-- Apply after the failure-details migration, before deploying the sender.
-- Future terminal transitions only: deliberately do not backfill old tasks.
begin;
create table public.ai_font_job_mail_outbox (
  id bigint generated always as identity primary key,
  job_id uuid not null unique references public.ai_font_jobs(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('succeeded','failed')),
  recipient_email text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','needs_review')),
  attempts integer not null default 0 check (attempts>=0),
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claimed_until timestamptz,
  delivery_started_at timestamptz,
  last_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index ai_font_job_mail_due on public.ai_font_job_mail_outbox(next_attempt_at,id) where status in ('pending','processing');

create function public.ai_font_enqueue_job_mail() returns trigger
language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs; recipient text; restored integer:=0;
begin
  select * into strict j from ai_font_jobs where id=new.id;
  if j.status not in ('succeeded','failed') then return null; end if;
  -- Deferred until transaction end: the terminal status update happens before
  -- its credit event and public failure code. Snapshot their final values.
  if j.status='failed' then
    select delta into restored from ai_font_credit_events where user_id=j.user_id and event_key='restore:'||j.id;
    if restored is null or restored<>j.credit_cost then raise exception 'JOB_RESTORE_REQUIRED'; end if;
  elsif j.storage_path is distinct from j.user_id||'/'||j.id||'.ttf' or j.moderation_status<>'passed' then
    raise exception 'JOB_DELIVERY_REQUIRED';
  end if;
  select coalesce(trim(email),'') into strict recipient from auth.users where id=j.user_id;
  insert into ai_font_job_mail_outbox(job_id,user_id,kind,recipient_email,payload,status,last_error)
    values(j.id,j.user_id,j.status,recipient,jsonb_build_object('creditsRestored',restored,'failureCode',j.failure_code),
      case when recipient='' then 'needs_review' else 'pending' end,case when recipient='' then 'ACCOUNT_EMAIL_MISSING' end)
    on conflict(job_id) do nothing;
  return null;
end;
$$;
create constraint trigger ai_font_terminal_mail after update on public.ai_font_jobs
  deferrable initially deferred for each row
  when (old.status not in ('succeeded','failed') and new.status in ('succeeded','failed'))
  execute function public.ai_font_enqueue_job_mail();

create function public.ai_font_claim_job_mail(p_limit integer default 3)
returns setof public.ai_font_job_mail_outbox language plpgsql security definer set search_path=public as $$
begin
  -- Without a provider idempotency guarantee, an expired request that started
  -- sending may already have delivered. Keep it for review instead of re-send.
  update ai_font_job_mail_outbox set status='needs_review',last_error='DELIVERY_UNCERTAIN',claim_token=null,claimed_until=null
    where status='processing' and claimed_until<=now() and delivery_started_at is not null;
  update ai_font_job_mail_outbox set status='needs_review',last_error='DELIVERY_RETRIES_EXHAUSTED',claim_token=null,claimed_until=null
    where status='processing' and claimed_until<=now() and attempts>=8;
  return query with due as (
    select id from ai_font_job_mail_outbox where attempts<8 and
      ((status='pending' and next_attempt_at<=now()) or (status='processing' and claimed_until<=now()))
    order by next_attempt_at,id limit greatest(1,least(coalesce(p_limit,3),10)) for update skip locked
  ) update ai_font_job_mail_outbox m set status='processing',attempts=m.attempts+1,claim_token=gen_random_uuid(),claimed_until=now()+interval '5 minutes'
    from due where m.id=due.id returning m.*;
end;
$$;

create function public.ai_font_begin_job_mail_delivery(p_id bigint,p_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update ai_font_job_mail_outbox set delivery_started_at=now()
    where id=p_id and status='processing' and claim_token=p_token and claimed_until>now() and delivery_started_at is null;
  return found;
end;
$$;

create function public.ai_font_finish_job_mail(p_id bigint,p_token uuid,p_message_id text default null,p_error text default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if p_error is null then
    update ai_font_job_mail_outbox set status='sent',sent_at=now(),provider_message_id=left(p_message_id,200),last_error=null,claim_token=null,claimed_until=null
      where id=p_id and status='processing' and claim_token=p_token and claimed_until>now();
  else
    update ai_font_job_mail_outbox set status=case when attempts>=8 or p_error='DELIVERY_UNCERTAIN' or left(p_error,10)='PERMANENT_' then 'needs_review' else 'pending' end,
      next_attempt_at=now()+make_interval(secs=>least(86400,60*power(2,least(attempts,10))::integer)),
      last_error=left(p_error,500),delivery_started_at=case when p_error='DELIVERY_UNCERTAIN' then delivery_started_at end,claim_token=null,claimed_until=null
      where id=p_id and status='processing' and claim_token=p_token and claimed_until>now();
  end if;
  return found;
end;
$$;

alter table public.ai_font_job_mail_outbox enable row level security;
revoke all on public.ai_font_job_mail_outbox from public,anon,authenticated;
grant all on public.ai_font_job_mail_outbox to service_role;
grant usage,select on sequence public.ai_font_job_mail_outbox_id_seq to service_role;
revoke all on function public.ai_font_enqueue_job_mail(),public.ai_font_claim_job_mail(integer),public.ai_font_begin_job_mail_delivery(bigint,uuid),public.ai_font_finish_job_mail(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.ai_font_claim_job_mail(integer),public.ai_font_begin_job_mail_delivery(bigint,uuid),public.ai_font_finish_job_mail(bigint,uuid,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
