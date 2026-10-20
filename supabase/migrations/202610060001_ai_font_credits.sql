-- Apply once with checkout, generation, and reconciliation paused. Deploy the
-- matching app before resuming. This transaction converts old generation units
-- to credits without changing purchased entitlement (1 generation = 100 credits).
begin;
lock table public.ai_font_wallets, public.ai_font_orders, public.ai_font_jobs, public.ai_font_credit_events in access exclusive mode;

alter table public.ai_font_jobs add column credit_cost integer not null default 100 check (credit_cost > 0);
alter table public.ai_font_orders add column credit_version integer not null default 1;
update public.ai_font_wallets set balance = balance * 100;
update public.ai_font_orders set credits = credits * 100, credit_version = 2;
update public.ai_font_credit_events set delta = delta * 100;
-- Old application versions cannot silently create orders in generation units.
alter table public.ai_font_orders add constraint ai_font_credit_version check (credit_version = 2);

create table public.ai_font_operation_costs (
  operation text primary key,
  credits integer not null check (credits > 0)
);
insert into public.ai_font_operation_costs values ('standard', 100);
alter table public.ai_font_operation_costs enable row level security;
revoke all on public.ai_font_operation_costs from public, anon, authenticated;
grant select on public.ai_font_operation_costs to service_role;

-- A new signature makes stale generation servers fail closed.
drop function public.ai_font_reserve_job(uuid,uuid,text);
create function public.ai_font_reserve_job(p_user uuid, p_id uuid, p_prompt text, p_expected_cost integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare existing ai_font_jobs; available integer; cost integer;
begin
  insert into ai_font_wallets(user_id) values(p_user) on conflict do nothing;
  select balance into available from ai_font_wallets where user_id = p_user for update;
  select * into existing from ai_font_jobs where id = p_id;
  if found then
    if existing.user_id <> p_user or existing.prompt <> p_prompt then raise exception 'REQUEST_MISMATCH'; end if;
    return p_id;
  end if;
  select credits into strict cost from ai_font_operation_costs where operation = 'standard';
  if p_expected_cost is distinct from cost then raise exception 'COST_CHANGED'; end if;
  if available < cost then raise exception 'NO_CREDITS'; end if;
  if exists(select 1 from ai_font_jobs where user_id = p_user and status in ('reserved','starting','processing','needs_review')) then
    raise exception 'ACTIVE_JOB';
  end if;
  insert into ai_font_jobs(id,user_id,prompt,credit_cost) values(p_id,p_user,p_prompt,cost);
  perform ai_font_credit_once(p_user, 'job:' || p_id, -cost);
  return p_id;
end;
$$;

create or replace function public.ai_font_finish_job(p_id uuid, p_status text, p_path text default null, p_name text default null)
returns void language plpgsql security definer set search_path = public as $$
declare j ai_font_jobs;
begin
  if p_status not in ('succeeded','failed') then raise exception 'INVALID_STATUS'; end if;
  select * into strict j from ai_font_jobs where id = p_id for update;
  if j.status in ('succeeded','failed') then return; end if;
  if p_status = 'succeeded' and (p_path is null or p_path <> j.user_id || '/' || j.id || '.ttf') then raise exception 'INVALID_PATH'; end if;
  update ai_font_jobs set status=p_status, storage_path=p_path, name=left(p_name,100), updated_at=now() where id=p_id;
  if p_status = 'failed' then perform ai_font_credit_once(j.user_id, 'restore:' || p_id, j.credit_cost); end if;
end;
$$;


revoke all on function public.ai_font_reserve_job(uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.ai_font_reserve_job(uuid,uuid,text,integer) to service_role;
commit;
