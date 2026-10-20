-- Run after the credit migration, before deploying accounts + Waffo support.
begin;
create table public.ai_font_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 80),
  avatar_url text,
  name_customized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create function public.ai_font_sync_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into ai_font_profiles(user_id, display_name, avatar_url)
  values(new.id, left(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),80), new.raw_user_meta_data->>'avatar_url')
  on conflict(user_id) do update set
    display_name = case when ai_font_profiles.name_customized then ai_font_profiles.display_name else excluded.display_name end,
    avatar_url = excluded.avatar_url, updated_at = now();
  return new;
end;
$$;
create trigger ai_font_auth_profile after insert or update of raw_user_meta_data on auth.users
for each row execute function public.ai_font_sync_profile();
insert into ai_font_profiles(user_id,display_name,avatar_url)
select id,left(coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''),80),raw_user_meta_data->>'avatar_url' from auth.users;

alter table public.ai_font_orders add column purchase_kind text not null default 'one_time' check (purchase_kind in ('one_time','subscription'));
alter table public.ai_font_orders add column billing_interval text check (billing_interval in ('monthly','yearly'));
alter table public.ai_font_orders add column provider_order_id text;
alter table public.ai_font_orders add column checkout_url text;
alter table public.ai_font_orders add column checkout_expires_at timestamptz;
alter table public.ai_font_orders add column provider_environment text;
create unique index ai_font_provider_orders on public.ai_font_orders(provider,provider_order_id);

create table public.ai_font_subscriptions (
  id uuid primary key references public.ai_font_orders(id),
  user_id uuid not null references auth.users(id),
  provider text not null,
  external_id text not null,
  plan_id text not null,
  credits_per_period integer not null check (credits_per_period > 0),
  billing_interval text not null check (billing_interval in ('monthly','yearly')),
  status text not null check (status in ('pending','active','past_due','canceling','canceled','closed')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  state_event_at timestamptz,
  cancel_requested_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,external_id),
  check (current_period_end is null or current_period_start is null or current_period_end > current_period_start)
);
-- Each paid period is independent of subscription status; cancellation never
-- grants/revokes credits by itself. Granted credits roll over under this policy.
create table public.ai_font_billing_payments (
  provider text not null,
  payment_id text not null,
  order_id uuid not null references public.ai_font_orders(id),
  subscription_id uuid references public.ai_font_subscriptions(id),
  period_number integer,
  credits integer not null check (credits > 0),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null,
  status text not null check (status in ('paid','revoked')),
  created_at timestamptz not null default now(),
  primary key(provider,payment_id),
  unique(subscription_id,period_number),
  check ((subscription_id is null and period_number is null) or (subscription_id is not null and period_number > 0))
);
create table public.ai_font_webhook_events (
  provider text not null,
  event_key text not null,
  order_id uuid not null references public.ai_font_orders(id),
  kind text not null,
  processed_at timestamptz not null default now(),
  primary key(provider,event_key)
);
create index ai_font_subscriptions_owner on public.ai_font_subscriptions(user_id,created_at desc);
create index ai_font_billing_payments_owner on public.ai_font_billing_payments(order_id,created_at desc);

-- Receives a normalized event only AFTER signature/store/mode/amount validation
-- in the server adapter. No browser may call this function.
create function public.ai_font_apply_waffo_event(p_event jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare o ai_font_orders; payment ai_font_billing_payments; sub ai_font_subscriptions;
  v_payment_id text := p_event->>'paymentId'; kind text := p_event->>'kind'; period integer;
begin
  select * into strict o from ai_font_orders where id=(p_event->>'orderId')::uuid for update;
  if o.provider <> 'waffo' or o.provider_environment is distinct from p_event->>'mode' then raise exception 'ORDER_MISMATCH'; end if;
  if o.provider_order_id is not null and o.provider_order_id <> p_event->>'providerOrderId' then raise exception 'ORDER_MISMATCH'; end if;
  if (p_event->>'currency') is distinct from o.currency or (p_event->>'amountMinor')::integer is distinct from o.amount_minor then raise exception 'AMOUNT_MISMATCH'; end if;
  insert into ai_font_webhook_events(provider,event_key,order_id,kind) values('waffo',p_event->>'key',o.id,kind) on conflict do nothing;
  if not found then return; end if;
  update ai_font_orders set provider_order_id=p_event->>'providerOrderId' where id=o.id;
  if o.purchase_kind='subscription' then
    insert into ai_font_subscriptions(id,user_id,provider,external_id,plan_id,credits_per_period,billing_interval,status)
    values(o.id,o.user_id,'waffo',p_event->>'providerOrderId',o.package_id,o.credits,o.billing_interval,'pending') on conflict do nothing;
    select * into strict sub from ai_font_subscriptions where id=o.id for update;
    if kind='subscription' then
      if sub.state_event_at is null or (p_event->>'timestamp')::timestamptz > sub.state_event_at then
        -- A delayed active notification cannot reopen a terminal subscription.
        if sub.status not in ('canceled','closed') then
          update ai_font_subscriptions set status=p_event->>'status', state_event_at=(p_event->>'timestamp')::timestamptz,
            current_period_start=coalesce((p_event->>'periodStart')::timestamptz,current_period_start),
            current_period_end=coalesce((p_event->>'periodEnd')::timestamptz,current_period_end),
            cancel_requested_at=case when (p_event->>'cancellationWithdrawn')::boolean then null else cancel_requested_at end
          where id=o.id;
        end if;
      end if;
      return;
    end if;
    period := (p_event->>'periodNumber')::integer;
    if period is null or period < 1 then raise exception 'PERIOD_REQUIRED'; end if;
  elsif kind='subscription' or p_event->>'periodNumber' is not null then raise exception 'TYPE_MISMATCH'; end if;
  if kind not in ('paid','revoked') or v_payment_id is null then raise exception 'INVALID_EVENT'; end if;
  select * into payment from ai_font_billing_payments where provider='waffo' and ai_font_billing_payments.payment_id=v_payment_id for update;
  if found then
    if payment.order_id <> o.id or payment.period_number is distinct from period then raise exception 'PAYMENT_MISMATCH'; end if;
    if payment.status='revoked' or kind='paid' then return; end if;
    update ai_font_billing_payments set status='revoked' where provider='waffo' and ai_font_billing_payments.payment_id=v_payment_id;
    perform ai_font_credit_once(o.user_id,'billing-refund:waffo:'||v_payment_id,-payment.credits);
  else
    if o.purchase_kind='one_time' and exists(select 1 from ai_font_billing_payments where order_id=o.id) then raise exception 'DUPLICATE_PAYMENT_REVIEW'; end if;
    insert into ai_font_billing_payments(provider,payment_id,order_id,subscription_id,period_number,credits,amount_minor,currency,status)
    values('waffo',v_payment_id,o.id,case when o.purchase_kind='subscription' then o.id end,period,o.credits,o.amount_minor,o.currency,case when kind='paid' then 'paid' else 'revoked' end);
    if kind='paid' then perform ai_font_credit_once(o.user_id,'billing:waffo:'||v_payment_id,o.credits); end if;
  end if;
  if o.purchase_kind='subscription' and kind='paid' then update ai_font_orders set status='paid' where id=o.id; end if;
  if o.purchase_kind='one_time' then update ai_font_orders set status=case when kind='paid' then 'paid' else 'revoked' end,capture_id=v_payment_id where id=o.id; end if;
end;
$$;

alter table public.ai_font_profiles enable row level security;
alter table public.ai_font_subscriptions enable row level security;
alter table public.ai_font_billing_payments enable row level security;
alter table public.ai_font_webhook_events enable row level security;
revoke all on public.ai_font_profiles,public.ai_font_subscriptions,public.ai_font_billing_payments,public.ai_font_webhook_events from public,anon,authenticated;
grant all on public.ai_font_profiles,public.ai_font_subscriptions,public.ai_font_billing_payments,public.ai_font_webhook_events to service_role;
revoke all on function public.ai_font_sync_profile(),public.ai_font_apply_waffo_event(jsonb) from public,anon,authenticated;
grant execute on function public.ai_font_apply_waffo_event(jsonb) to service_role;
commit;
