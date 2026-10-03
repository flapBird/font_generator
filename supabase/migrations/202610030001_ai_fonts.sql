-- Run once in a Supabase project. All mutations are server-only. No credits
-- are granted on sign-up. Existing site features do not use these tables.
create table public.ai_font_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0
);
create table public.ai_font_orders (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  provider text not null,
  package_id text not null,
  amount_minor integer not null check (amount_minor > 0),
  currency text not null,
  credits integer not null check (credits > 0),
  external_id text,
  capture_id text,
  status text not null default 'pending' check (status in ('pending','paid','revoked')),
  created_at timestamptz not null default now(),
  unique(provider, external_id),
  unique(provider, capture_id)
);
create table public.ai_font_credit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  event_key text not null unique,
  delta integer not null,
  created_at timestamptz not null default now()
);
create table public.ai_font_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  prompt text not null check (length(prompt) between 10 and 1000),
  status text not null default 'reserved' check (status in ('reserved','starting','processing','needs_review','succeeded','failed')),
  external_id text unique,
  storage_path text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_font_jobs_owner on public.ai_font_jobs(user_id, created_at desc);
create index ai_font_orders_owner on public.ai_font_orders(user_id, created_at desc);
create index ai_font_jobs_active on public.ai_font_jobs(updated_at) where status in ('reserved','starting','processing');

alter table public.ai_font_wallets enable row level security;
alter table public.ai_font_orders enable row level security;
alter table public.ai_font_credit_events enable row level security;
alter table public.ai_font_jobs enable row level security;
revoke all on public.ai_font_wallets, public.ai_font_orders, public.ai_font_credit_events, public.ai_font_jobs from anon, authenticated;
grant all on public.ai_font_wallets, public.ai_font_orders, public.ai_font_credit_events, public.ai_font_jobs to service_role;
grant usage, select on sequence public.ai_font_credit_events_id_seq to service_role;

-- Called inside the transaction of another function, not exposed to clients.
create function public.ai_font_credit_once(p_user uuid, p_key text, p_delta integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into ai_font_wallets(user_id) values(p_user) on conflict do nothing;
  perform 1 from ai_font_wallets where user_id = p_user for update;
  insert into ai_font_credit_events(user_id, event_key, delta) values(p_user, p_key, p_delta) on conflict do nothing;
  if found then update ai_font_wallets set balance = balance + p_delta where user_id = p_user; end if;
end;
$$;

create function public.ai_font_settle_order(p_id uuid, p_external text, p_capture text)
returns void language plpgsql security definer set search_path = public as $$
declare o ai_font_orders;
begin
  select * into strict o from ai_font_orders where id = p_id for update;
  if o.external_id is distinct from p_external then raise exception 'ORDER_MISMATCH'; end if;
  if o.status = 'revoked' then return; end if;
  if o.status = 'paid' then
    if o.capture_id is distinct from p_capture then raise exception 'CAPTURE_MISMATCH'; end if;
    return;
  end if;
  update ai_font_orders set status = 'paid', capture_id = p_capture where id = p_id;
  perform ai_font_credit_once(o.user_id, 'order:' || p_id, o.credits);
end;
$$;

create function public.ai_font_revoke_order(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o ai_font_orders;
begin
  select * into strict o from ai_font_orders where id = p_id for update;
  if o.status = 'revoked' then return; end if;
  update ai_font_orders set status = 'revoked' where id = p_id;
  -- A negative balance deliberately blocks further generation if refunded
  -- credits have already been spent. Repeated refund events do not double-debit.
  if o.status = 'paid' then perform ai_font_credit_once(o.user_id, 'revoke:' || p_id, -o.credits); end if;
end;
$$;

create function public.ai_font_reserve_job(p_user uuid, p_id uuid, p_prompt text)
returns uuid language plpgsql security definer set search_path = public as $$
declare existing ai_font_jobs; available integer;
begin
  insert into ai_font_wallets(user_id) values(p_user) on conflict do nothing;
  select balance into available from ai_font_wallets where user_id = p_user for update;
  select * into existing from ai_font_jobs where id = p_id;
  if found then
    if existing.user_id <> p_user or existing.prompt <> p_prompt then raise exception 'REQUEST_MISMATCH'; end if;
    return p_id;
  end if;
  if available < 1 then raise exception 'NO_CREDITS'; end if;
  if exists(select 1 from ai_font_jobs where user_id = p_user and status in ('reserved','starting','processing','needs_review')) then
    raise exception 'ACTIVE_JOB';
  end if;
  insert into ai_font_jobs(id,user_id,prompt) values(p_id,p_user,p_prompt);
  perform ai_font_credit_once(p_user, 'job:' || p_id, -1);
  return p_id;
end;
$$;

create function public.ai_font_claim_job(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update ai_font_jobs set status='starting', updated_at=now() where id=p_id and status='reserved';
  return found;
end;
$$;

create function public.ai_font_finish_job(p_id uuid, p_status text, p_path text default null, p_name text default null)
returns void language plpgsql security definer set search_path = public as $$
declare j ai_font_jobs;
begin
  if p_status not in ('succeeded','failed') then raise exception 'INVALID_STATUS'; end if;
  select * into strict j from ai_font_jobs where id = p_id for update;
  if j.status in ('succeeded','failed') then return; end if;
  if p_status = 'succeeded' and (p_path is null or p_path <> j.user_id || '/' || j.id || '.ttf') then raise exception 'INVALID_PATH'; end if;
  update ai_font_jobs set status=p_status, storage_path=p_path, name=left(p_name,100), updated_at=now() where id=p_id;
  if p_status = 'failed' then perform ai_font_credit_once(j.user_id, 'restore:' || p_id, 1); end if;
end;
$$;

revoke all on function public.ai_font_credit_once(uuid,text,integer) from public, anon, authenticated;
revoke all on function public.ai_font_settle_order(uuid,text,text) from public, anon, authenticated;
revoke all on function public.ai_font_revoke_order(uuid) from public, anon, authenticated;
revoke all on function public.ai_font_reserve_job(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.ai_font_claim_job(uuid) from public, anon, authenticated;
revoke all on function public.ai_font_finish_job(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.ai_font_settle_order(uuid,text,text), public.ai_font_revoke_order(uuid), public.ai_font_reserve_job(uuid,uuid,text), public.ai_font_claim_job(uuid), public.ai_font_finish_job(uuid,text,text,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ai-fonts','ai-fonts',false,20971520,array['font/ttf'])
on conflict(id) do nothing;
-- No public storage policies. Downloads require an owner check and a short-lived
-- signed URL created by the server. Configure account deletion via support until
-- billing-record retention and storage cleanup are implemented.
