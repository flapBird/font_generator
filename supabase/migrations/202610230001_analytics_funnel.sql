begin;
-- Analytics is optional. Existing orders are deliberately not backdated.
alter table public.ai_font_orders add column analytics_context jsonb;
alter table public.ai_font_orders add column analytics_checkout_at timestamptz;
alter table public.ai_font_orders add column analytics_paid_at timestamptz;

create function public.ai_font_stamp_analytics() returns trigger
language plpgsql set search_path=public as $$
begin
  if new.checkout_url is not null and old.checkout_url is null then
    new.analytics_checkout_at:=coalesce(old.analytics_checkout_at,clock_timestamp());
  end if;
  if new.status='paid' and old.status<>'paid' then
    new.analytics_paid_at:=coalesce(old.analytics_paid_at,clock_timestamp());
  end if;
  return new;
end;
$$;
create trigger ai_font_analytics_facts before update on public.ai_font_orders
for each row execute function public.ai_font_stamp_analytics();

create table public.ai_font_analytics_outbox (
  id bigint generated always as identity primary key,
  event_key text not null unique,
  order_id uuid not null references public.ai_font_orders(id),
  event_name text not null check(event_name in ('begin_checkout','purchase')),
  occurred_at timestamptz not null,
  context jsonb not null,
  amount_minor integer not null,
  currency text not null,
  package_id text not null,
  status text not null default 'pending' check(status in ('pending','processing','sent','needs_review')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  lease_until timestamptz,
  last_error text,
  sent_at timestamptz
);
alter table public.ai_font_analytics_outbox enable row level security;
revoke all on public.ai_font_analytics_outbox from public,anon,authenticated;
grant all on public.ai_font_analytics_outbox to service_role;
grant usage,select on sequence public.ai_font_analytics_outbox_id_seq to service_role;
create index ai_font_analytics_due on public.ai_font_analytics_outbox(next_attempt_at) where status='pending';

create function public.ai_font_attach_analytics(p_order uuid,p_user uuid,p_context jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if p_context->>'analytics_storage' is distinct from 'granted'
    or coalesce(p_context->>'client_id','') !~ '^[0-9]{1,20}\.[0-9]{1,20}$'
    or coalesce(p_context->>'session_id','') !~ '^[0-9]{1,20}$'
    or coalesce(p_context->>'userId','') !~ '^[a-f0-9]{64}$'
    or coalesce(p_context->>'audienceType','') not in ('customer','internal')
    or coalesce(p_context->>'paymentEnvironment','') not in ('test','live')
    or coalesce(p_context->>'checkoutMode','') not in ('private','public')
    or coalesce(p_context->>'paymentProvider','') not in ('waffo','paypal')
    or p_context->>'checkoutEligible' is distinct from 'true'
  then return false; end if;
  update ai_font_orders set analytics_context=jsonb_build_object(
    'client_id',p_context->>'client_id','session_id',p_context->>'session_id','analytics_storage','granted',
    'userId',p_context->>'userId','audienceType',p_context->>'audienceType','paymentEnvironment',p_context->>'paymentEnvironment',
    'checkoutMode',p_context->>'checkoutMode','paymentProvider',p_context->>'paymentProvider','checkoutEligible',true)
  where id=p_order and user_id=p_user and analytics_context is null and status='pending'
    and provider=p_context->>'paymentProvider'
    and case when provider_environment in ('test','sandbox') then 'test' else 'live' end=p_context->>'paymentEnvironment';
  return found;
end;
$$;

create function public.ai_font_claim_analytics(p_limit integer default 5)
returns setof public.ai_font_analytics_outbox language plpgsql security definer set search_path=public as $$
begin
  -- Derive the independent queue from durable order facts. No webhook or credit
  -- transaction waits for queue insertion or a Google network request.
  insert into ai_font_analytics_outbox(event_key,order_id,event_name,occurred_at,context,amount_minor,currency,package_id)
  select e.kind||':'||o.id,o.id,e.kind,e.at,o.analytics_context,o.amount_minor,o.currency,o.package_id
  from ai_font_orders o cross join lateral (values
    ('begin_checkout',o.analytics_checkout_at),('purchase',o.analytics_paid_at)) as e(kind,at)
  where o.analytics_context is not null and e.at is not null
    and not exists(select 1 from ai_font_analytics_outbox q where q.event_key=e.kind||':'||o.id)
  order by e.at limit 100 on conflict(event_key) do nothing;
  update ai_font_analytics_outbox set status='needs_review',last_error='DELIVERY_UNCERTAIN',claim_token=null,lease_until=null
    where status='processing' and lease_until<=now();
  update ai_font_analytics_outbox set status='needs_review',last_error='EVENT_TOO_OLD'
    where status='pending' and occurred_at<now()-interval '72 hours';
  return query with due as (
    select id from ai_font_analytics_outbox where status='pending' and next_attempt_at<=now()
    order by occurred_at,id limit greatest(1,least(coalesce(p_limit,5),10)) for update skip locked
  ) update ai_font_analytics_outbox q set status='processing',attempts=q.attempts+1,claim_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
    from due where q.id=due.id returning q.*;
end;
$$;
create function public.ai_font_finish_analytics(p_id bigint,p_token uuid,p_error text default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update ai_font_analytics_outbox set
    status=case when p_error is null then 'sent' when p_error='RATE_LIMIT' and attempts<8 then 'pending' else 'needs_review' end,
    sent_at=case when p_error is null then now() end,last_error=left(p_error,60),
    next_attempt_at=now()+make_interval(secs=>least(86400,60*power(2,least(attempts,10))::integer)),claim_token=null,lease_until=null
    where id=p_id and status='processing' and claim_token=p_token and lease_until>now();
  return found;
end;
$$;
revoke all on function public.ai_font_stamp_analytics(),public.ai_font_attach_analytics(uuid,uuid,jsonb),public.ai_font_claim_analytics(integer),public.ai_font_finish_analytics(bigint,uuid,text) from public,anon,authenticated;
grant execute on function public.ai_font_attach_analytics(uuid,uuid,jsonb),public.ai_font_claim_analytics(integer),public.ai_font_finish_analytics(bigint,uuid,text) to service_role;
commit;
