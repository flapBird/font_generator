-- Pause generation/reconciliation, apply once, then deploy the matching app.
-- Previously delivered fonts keep their existing download entitlement.
begin;

create table public.ai_font_moderation_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  stage text not null check (stage='prompt' or stage ~ '^output:[0-7]$'),
  policy_version text not null default 'seeapi-v1' check (policy_version='seeapi-v1'),
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  asset_hash text check (asset_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending','passed','blocked','failed')),
  provider_task_id text unique,
  consumed_credits numeric check (consumed_credits >= 0),
  lease_token uuid,
  lease_until timestamptz,
  next_check_at timestamptz not null default now(),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,request_id,stage,policy_version)
);
create index ai_font_moderation_admission on public.ai_font_moderation_checks(user_id,created_at) where stage='prompt';
alter table public.ai_font_moderation_checks enable row level security;
revoke all on public.ai_font_moderation_checks from public,anon,authenticated;
grant all on public.ai_font_moderation_checks to service_role;

alter table public.ai_font_jobs add column moderation_version text check (moderation_version is null or moderation_version='seeapi-v1');
alter table public.ai_font_jobs alter column moderation_version set default 'seeapi-v1';
alter table public.ai_font_jobs add column output_hash text check (output_hash ~ '^[0-9a-f]{64}$');
alter table public.ai_font_jobs add column review_page_count integer check (review_page_count between 1 and 8);
alter table public.ai_font_jobs add column moderation_status text not null default 'pending' check (moderation_status in ('legacy','pending','passed','blocked'));
update public.ai_font_jobs set moderation_status='legacy' where status='succeeded';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ai-font-review','ai-font-review',false,20971520,array['font/ttf','image/png']) on conflict(id) do nothing;
-- No browser storage policies: these files are quarantined until every page passes.

create function public.ai_font_prepare_moderation(p_user uuid,p_request uuid,p_stage text,p_input_hash text,p_asset_hash text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c ai_font_moderation_checks; j ai_font_jobs; available integer; cost integer; token uuid;
begin
  if p_stage is null or not (p_stage='prompt' or p_stage ~ '^output:[0-7]$') or p_input_hash is null or p_input_hash !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_REVIEW'; end if;
  insert into ai_font_wallets(user_id) values(p_user) on conflict do nothing;
  select balance into available from ai_font_wallets where user_id=p_user for update;
  if p_stage='prompt' then
    select credits into strict cost from ai_font_operation_costs where operation='standard';
    if available<cost then raise exception 'NO_CREDITS'; end if;
    if exists(select 1 from ai_font_billing_holds where user_id=p_user and active) then raise exception 'BILLING_RESTRICTED'; end if;
    if exists(select 1 from ai_font_jobs where user_id=p_user and status in ('reserved','starting','processing','needs_review')) then raise exception 'ACTIVE_JOB'; end if;
    if p_asset_hash is not null then raise exception 'INVALID_REVIEW'; end if;
  else
    select * into j from ai_font_jobs where id=p_request and user_id=p_user;
    if not found or j.status<>'processing' or j.output_hash is distinct from p_asset_hash or j.review_page_count is null or substring(p_stage from 8)::integer>=j.review_page_count then raise exception 'INVALID_REVIEW'; end if;
  end if;
  select * into c from ai_font_moderation_checks where user_id=p_user and request_id=p_request and stage=p_stage and policy_version='seeapi-v1' for update;
  if found then
    if c.input_hash<>p_input_hash or c.asset_hash is distinct from p_asset_hash then raise exception 'REVIEW_MISMATCH'; end if;
  else
    -- The wallet lock serializes new prompt admissions, so parallel requests
    -- cannot spend an unbounded moderation budget before generation is charged.
    if p_stage='prompt' and (
      (select count(*) from ai_font_moderation_checks where user_id=p_user and stage='prompt' and created_at>now()-interval '1 minute')>=5 or
      (select count(*) from ai_font_moderation_checks where user_id=p_user and stage='prompt' and created_at>now()-interval '1 hour')>=20
    ) then raise exception 'REVIEW_RATE_LIMIT'; end if;
    insert into ai_font_moderation_checks(user_id,request_id,stage,input_hash,asset_hash)
      values(p_user,p_request,p_stage,p_input_hash,p_asset_hash) returning * into c;
  end if;
  if c.status<>'pending' then return to_jsonb(c)||jsonb_build_object('claim_token',null); end if;
  if c.lease_until>now() then return to_jsonb(c)||jsonb_build_object('claim_token',null); end if;
  if c.attempts>=20 or c.created_at<now()-interval '24 hours' then
    update ai_font_moderation_checks set status='failed',lease_token=null,lease_until=null,updated_at=now() where id=c.id returning * into c;
    return to_jsonb(c)||jsonb_build_object('claim_token',null);
  end if;
  if c.next_check_at>now() then return to_jsonb(c)||jsonb_build_object('claim_token',null); end if;
  token:=gen_random_uuid();
  update ai_font_moderation_checks set lease_token=token,lease_until=now()+interval '1 minute',attempts=attempts+1,updated_at=now() where id=c.id returning * into c;
  return to_jsonb(c)||jsonb_build_object('claim_token',token);
end;
$$;

create function public.ai_font_finish_moderation(p_id uuid,p_token uuid,p_task_id text,p_status text,p_consumed_credits numeric default null,p_retry_after_seconds integer default 60)
returns boolean language plpgsql security definer set search_path=public as $$
declare c ai_font_moderation_checks;
begin
  if p_status not in ('pending','passed','blocked','failed','retry') then raise exception 'INVALID_REVIEW_STATUS'; end if;
  select * into c from ai_font_moderation_checks where id=p_id for update;
  if not found or p_token is null or c.lease_token is null or c.lease_until is null or c.status<>'pending' or c.lease_token is distinct from p_token or c.lease_until<=now() then return false; end if;
  if p_task_id is not null and (p_task_id !~ '^task_[a-zA-Z0-9_-]{1,240}$' or (c.provider_task_id is not null and c.provider_task_id<>p_task_id)) then raise exception 'REVIEW_TASK_MISMATCH'; end if;
  if p_status in ('passed','blocked') and coalesce(p_task_id,c.provider_task_id) is null then raise exception 'REVIEW_TASK_REQUIRED'; end if;
  update ai_font_moderation_checks set status=case when p_status='retry' then 'pending' else p_status end,
    provider_task_id=coalesce(p_task_id,provider_task_id),consumed_credits=coalesce(p_consumed_credits,consumed_credits),
    next_check_at=now()+case when p_status='retry' then greatest(3,least(300,p_retry_after_seconds))*interval '1 second' else interval '3 seconds' end,
    lease_token=null,lease_until=null,updated_at=now() where id=p_id;
  return true;
end;
$$;

create function public.ai_font_bind_review(p_id uuid,p_hash text,p_pages integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs;
begin
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' or p_pages is null or p_pages not between 1 and 8 then raise exception 'INVALID_REVIEW_ASSET'; end if;
  select * into strict j from ai_font_jobs where id=p_id for update;
  if j.status<>'processing' then return false; end if;
  if j.output_hash is not null then return j.output_hash=p_hash and j.review_page_count=p_pages; end if;
  update ai_font_jobs set output_hash=p_hash,review_page_count=p_pages,moderation_status='pending',updated_at=now() where id=p_id;
  return true;
end;
$$;

-- Preserve existing billing logic while making stale application code unable
-- to reserve or deliver a new font without server-recorded moderation approval.
alter function public.ai_font_reserve_job(uuid,uuid,text,integer) rename to ai_font_reserve_job_unreviewed;
create function public.ai_font_reserve_job(p_user uuid,p_id uuid,p_prompt text,p_expected_cost integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs;
begin
  select * into j from ai_font_jobs where id=p_id;
  if found then
    if j.user_id<>p_user or j.prompt<>p_prompt then raise exception 'REQUEST_MISMATCH'; end if;
    return p_id;
  end if;
  if not exists(select 1 from ai_font_moderation_checks where user_id=p_user and request_id=p_id and stage='prompt' and policy_version='seeapi-v1' and status='passed' and input_hash=encode(sha256(convert_to(p_prompt,'UTF8')),'hex')) then raise exception 'MODERATION_REQUIRED'; end if;
  return ai_font_reserve_job_unreviewed(p_user,p_id,p_prompt,p_expected_cost);
end;
$$;

alter function public.ai_font_claim_job(uuid) rename to ai_font_claim_job_unreviewed;
create function public.ai_font_claim_job(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs;
begin
  select * into j from ai_font_jobs where id=p_id;
  if not found then return false; end if;
  if j.moderation_version is not null and not exists(select 1 from ai_font_moderation_checks where user_id=j.user_id and request_id=j.id and stage='prompt' and policy_version=j.moderation_version and status='passed' and input_hash=encode(sha256(convert_to(j.prompt,'UTF8')),'hex')) then return false; end if;
  return ai_font_claim_job_unreviewed(p_id);
end;
$$;

alter function public.ai_font_finish_job(uuid,text,text,text) rename to ai_font_finish_job_unreviewed;
create function public.ai_font_finish_job(p_id uuid,p_status text,p_path text default null,p_name text default null)
returns void language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs; owner_id uuid;
begin
  select user_id into strict owner_id from ai_font_jobs where id=p_id;
  perform 1 from ai_font_wallets where user_id=owner_id for update;
  select * into strict j from ai_font_jobs where id=p_id for update;
  if j.status in ('succeeded','failed') then return; end if;
  if p_status='succeeded' and j.moderation_version is not null and not exists(
    select 1 from ai_font_moderation_checks where user_id=j.user_id and request_id=j.id and stage='prompt' and policy_version=j.moderation_version and status='passed' and input_hash=encode(sha256(convert_to(j.prompt,'UTF8')),'hex')
  ) then raise exception 'MODERATION_REQUIRED'; end if;
  if p_status='succeeded' then
    if j.output_hash is null or j.review_page_count is null or exists(
      select 1 from generate_series(0,j.review_page_count-1) as page
      where not exists(select 1 from ai_font_moderation_checks c where c.user_id=j.user_id and c.request_id=j.id and c.stage='output:'||page and c.policy_version='seeapi-v1' and c.asset_hash=j.output_hash and c.status='passed')
    ) then raise exception 'OUTPUT_MODERATION_REQUIRED'; end if;
    update ai_font_jobs set moderation_status='passed' where id=p_id;
  elsif p_status='failed' and exists(select 1 from ai_font_moderation_checks where user_id=j.user_id and request_id=j.id and asset_hash=j.output_hash and status='blocked') then
    update ai_font_jobs set moderation_status='blocked' where id=p_id;
  end if;
  perform ai_font_finish_job_unreviewed(p_id,p_status,p_path,p_name);
end;
$$;

revoke all on function public.ai_font_reserve_job_unreviewed(uuid,uuid,text,integer),public.ai_font_claim_job_unreviewed(uuid),public.ai_font_finish_job_unreviewed(uuid,text,text,text) from public,anon,authenticated,service_role;
revoke all on function public.ai_font_prepare_moderation(uuid,uuid,text,text,text),public.ai_font_finish_moderation(uuid,uuid,text,text,numeric,integer),public.ai_font_bind_review(uuid,text,integer),public.ai_font_reserve_job(uuid,uuid,text,integer),public.ai_font_claim_job(uuid),public.ai_font_finish_job(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.ai_font_prepare_moderation(uuid,uuid,text,text,text),public.ai_font_finish_moderation(uuid,uuid,text,text,numeric,integer),public.ai_font_bind_review(uuid,text,integer),public.ai_font_reserve_job(uuid,uuid,text,integer),public.ai_font_claim_job(uuid),public.ai_font_finish_job(uuid,text,text,text) to service_role;
commit;
