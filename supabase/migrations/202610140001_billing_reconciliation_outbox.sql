-- Apply after accounts_billing. Payment state, credit changes and notification
-- intent commit together. Delivery happens later and cannot roll back credits.
begin;

alter table public.ai_font_orders add column billing_checked_at timestamptz;
alter table public.ai_font_orders add column billing_review_reason text;
alter table public.ai_font_orders add column next_billing_check_at timestamptz not null default now();
alter table public.ai_font_orders add column billing_claim_token uuid;
alter table public.ai_font_orders add column billing_claim_until timestamptz;
alter table public.ai_font_orders add column billing_check_failures integer not null default 0;
alter table public.ai_font_orders add column billing_last_error text;
create index ai_font_orders_billing_due on public.ai_font_orders(next_billing_check_at) where provider='waffo';
alter table public.ai_font_billing_payments add column payment_total_minor integer;
alter table public.ai_font_billing_payments add column refunded_amount_minor integer not null default 0;
alter table public.ai_font_billing_payments add column payment_confirmed boolean not null default false;
alter table public.ai_font_billing_payments add column credits_granted integer not null default 0;
alter table public.ai_font_billing_payments add column credits_revoked integer not null default 0;
alter table public.ai_font_billing_payments add column chargeback_active boolean not null default false;
alter table public.ai_font_billing_payments add column legacy_full_reversal boolean not null default false;
-- Historic full reversals remain terminal. A refund that arrived first did not
-- issue credits; preserve that fact when migrating old rows.
update public.ai_font_billing_payments p set
  payment_confirmed=exists(select 1 from public.ai_font_credit_events e where e.event_key='billing:'||p.provider||':'||p.payment_id),
  credits_granted=case when exists(select 1 from public.ai_font_credit_events e where e.event_key='billing:'||p.provider||':'||p.payment_id) then p.credits else 0 end,
  credits_revoked=case when p.status='revoked' and exists(select 1 from public.ai_font_credit_events e where e.event_key='billing:'||p.provider||':'||p.payment_id) then p.credits else 0 end,
  legacy_full_reversal=(p.status='revoked');
-- The old ledger only stored tax-exclusive price, not the actual paid total.
-- Do not invent a gross total from it; legacy_full_reversal preserves full
-- withdrawal while a verified provider read fills in the real amount later.
alter table public.ai_font_billing_payments add constraint ai_font_payment_total check(payment_total_minor is null or payment_total_minor >= amount_minor);
alter table public.ai_font_billing_payments add constraint ai_font_payment_refund check(refunded_amount_minor >= 0 and (payment_total_minor is null or refunded_amount_minor <= payment_total_minor));
alter table public.ai_font_billing_payments add constraint ai_font_payment_credits check(credits_granted between 0 and credits and credits_revoked between 0 and credits_granted);

create table public.ai_font_billing_adjustments (
  provider text not null,
  adjustment_id text not null,
  payment_id text not null,
  kind text not null check(kind in ('refund','chargeback')),
  amount_minor integer not null check(amount_minor > 0),
  active boolean not null default true,
  state_event_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key(provider,adjustment_id),
  foreign key(provider,payment_id) references public.ai_font_billing_payments(provider,payment_id)
);
create index ai_font_billing_adjustments_payment on public.ai_font_billing_adjustments(provider,payment_id);

-- Provider dispute statuses have no documented complete terminal mapping.
-- Unknown disputes freeze new purchases/generation for review, without guessing
-- whether money was permanently lost or altering already delivered font files.
create table public.ai_font_billing_holds (
  provider text not null,
  adjustment_id text not null,
  order_id uuid not null references public.ai_font_orders(id),
  user_id uuid not null references auth.users(id),
  payment_id text not null,
  reason text not null check(reason='chargeback'),
  provider_status text,
  chargeback_amount_minor integer not null check(chargeback_amount_minor > 0),
  active boolean not null default true,
  needs_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(provider,adjustment_id),
  foreign key(provider,payment_id) references public.ai_font_billing_payments(provider,payment_id)
);
create index ai_font_billing_holds_owner on public.ai_font_billing_holds(user_id) where active;

create table public.ai_font_chargeback_decisions (
  provider text not null,
  adjustment_id text not null,
  outcome text not null check(outcome in ('confirmed_loss','reversed')),
  evidence_reference text not null check(length(evidence_reference) between 1 and 200),
  decided_at timestamptz not null default clock_timestamp(),
  primary key(provider,adjustment_id,outcome),
  foreign key(provider,adjustment_id) references public.ai_font_billing_holds(provider,adjustment_id)
);

create table public.ai_font_mail_outbox (
  id bigint generated always as identity primary key,
  event_key text not null unique,
  user_id uuid not null references auth.users(id),
  order_id uuid not null references public.ai_font_orders(id),
  payment_id text not null,
  kind text not null check(kind in ('payment_credited','refund_applied','chargeback_restricted','chargeback_reversed')),
  recipient_email text not null,
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','processing','sent','needs_review')),
  attempts integer not null default 0 check(attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claimed_until timestamptz,
  delivery_started_at timestamptz,
  last_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index ai_font_mail_outbox_due on public.ai_font_mail_outbox(next_attempt_at) where status in ('pending','processing');

create function public.ai_font_enqueue_mail(p_key text,p_user uuid,p_order uuid,p_payment text,p_kind text,p_payload jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare recipient text; available integer;
begin
  -- The authenticated site account owns the purchase. Cashier-provided email
  -- is deliberately not used to avoid sending account data to another person.
  select coalesce(trim(email),'') into strict recipient from auth.users where id=p_user;
  select balance into available from ai_font_wallets where user_id=p_user;
  insert into ai_font_mail_outbox(event_key,user_id,order_id,payment_id,kind,recipient_email,payload,status,last_error)
  values(p_key,p_user,p_order,p_payment,p_kind,recipient,p_payload||jsonb_build_object('balance',coalesce(available,0)),
    case when recipient='' then 'needs_review' else 'pending' end,case when recipient='' then 'ACCOUNT_EMAIL_MISSING' end)
  on conflict(event_key) do nothing;
end;
$$;

create or replace function public.ai_font_apply_waffo_event(p_event jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare o ai_font_orders; payment ai_font_billing_payments; sub ai_font_subscriptions; adjustment ai_font_billing_adjustments;
  v_payment_id text:=p_event->>'paymentId'; kind text:=p_event->>'kind'; period integer;
  reason text:=coalesce(p_event->>'reason','refund'); v_adjustment_id text:=p_event->>'adjustmentId';
  total integer; refund integer; target integer; delta integer; net_before integer;
  chargeback_amount integer; chargeback_total bigint;
  confirmed boolean; restricted boolean; event_time timestamptz:=(p_event->>'timestamp')::timestamptz;
begin
  select * into strict o from ai_font_orders where id=(p_event->>'orderId')::uuid for update;
  if o.provider <> 'waffo' or o.provider_environment is distinct from p_event->>'mode' then raise exception 'ORDER_MISMATCH'; end if;
  if o.provider_order_id is not null and o.provider_order_id <> p_event->>'providerOrderId' then raise exception 'ORDER_MISMATCH'; end if;
  if nullif(p_event->>'providerOrderId','') is null then raise exception 'ORDER_MISMATCH'; end if;
  if (p_event->>'currency') is distinct from o.currency or (p_event->>'amountMinor')::integer is distinct from o.amount_minor then raise exception 'AMOUNT_MISMATCH'; end if;
  -- Reconciliation is not permitted to guess a purchase from amount/email/time.
  -- A persisted Waffo order or an authenticated provider read with exact
  -- merchant UUID/metadata/product/store/mode/price validation is required.
  if p_event->>'source'='reconciliation' and o.provider_order_id is null
      and (p_event->>'businessReferenceVerified')::boolean is distinct from true then
    update ai_font_orders set billing_review_reason='UNVERIFIED_RECONCILIATION_REFERENCE',billing_checked_at=now() where id=o.id;
    return;
  end if;
  insert into ai_font_webhook_events(provider,event_key,order_id,kind) values('waffo',p_event->>'key',o.id,kind) on conflict do nothing;
  if not found then return; end if;
  if kind='review' and exists(select 1 from ai_font_billing_holds h where h.provider='waffo' and h.adjustment_id=v_adjustment_id and (not h.needs_review or not h.active)) then
    if exists(select 1 from ai_font_billing_holds h where h.provider='waffo' and h.adjustment_id=v_adjustment_id and (h.order_id<>o.id or h.payment_id<>v_payment_id)) then raise exception 'ADJUSTMENT_MISMATCH'; end if;
    if p_event->>'chargebackAmountMinor' is not null and exists(select 1 from ai_font_billing_holds h where h.provider='waffo' and h.adjustment_id=v_adjustment_id and h.chargeback_amount_minor<>(p_event->>'chargebackAmountMinor')::integer) then raise exception 'CHARGEBACK_AMOUNT_MISMATCH'; end if;
    -- An unclassified polling status cannot overturn an audited manual result.
    return;
  end if;
  update ai_font_orders set provider_order_id=p_event->>'providerOrderId',billing_checked_at=now(),
    billing_review_reason=case when exists(select 1 from ai_font_billing_holds where order_id=o.id and active and needs_review) then billing_review_reason end where id=o.id;
  if o.purchase_kind='subscription' then
    insert into ai_font_subscriptions(id,user_id,provider,external_id,plan_id,credits_per_period,billing_interval,status)
    values(o.id,o.user_id,'waffo',p_event->>'providerOrderId',o.package_id,o.credits,o.billing_interval,'pending') on conflict do nothing;
    select * into strict sub from ai_font_subscriptions where id=o.id for update;
    if kind='subscription' then
      if sub.state_event_at is null or event_time > sub.state_event_at then
        if sub.status not in ('canceled','closed') then
          update ai_font_subscriptions set status=p_event->>'status',state_event_at=event_time,
            current_period_start=coalesce((p_event->>'periodStart')::timestamptz,current_period_start),
            current_period_end=coalesce((p_event->>'periodEnd')::timestamptz,current_period_end),
            cancel_requested_at=case when (p_event->>'cancellationWithdrawn')::boolean then null else cancel_requested_at end
          where id=o.id;
        end if;
      end if;
      return;
    end if;
    period:=(p_event->>'periodNumber')::integer;
    if period is null or period < 1 then raise exception 'PERIOD_REQUIRED'; end if;
  elsif kind='subscription' or p_event->>'periodNumber' is not null then raise exception 'TYPE_MISMATCH'; end if;
  if kind not in ('paid','revoked','restored','review') or nullif(v_payment_id,'') is null or event_time is null then raise exception 'INVALID_EVENT'; end if;
  if kind='restored' and reason<>'chargeback_reversed' then raise exception 'INVALID_EVENT'; end if;
  if kind='revoked' and reason not in ('refund','chargeback') then raise exception 'INVALID_EVENT'; end if;
  if kind='review' and (reason<>'chargeback' or nullif(v_adjustment_id,'') is null) then raise exception 'INVALID_EVENT'; end if;
  select * into payment from ai_font_billing_payments where provider='waffo' and payment_id=v_payment_id for update;
  if not found then
    if o.purchase_kind='one_time' and exists(select 1 from ai_font_billing_payments where order_id=o.id) then raise exception 'DUPLICATE_PAYMENT_REVIEW'; end if;
    insert into ai_font_billing_payments(provider,payment_id,order_id,subscription_id,period_number,credits,amount_minor,currency,status)
    values('waffo',v_payment_id,o.id,case when o.purchase_kind='subscription' then o.id end,period,o.credits,o.amount_minor,o.currency,'paid');
    select * into strict payment from ai_font_billing_payments where provider='waffo' and payment_id=v_payment_id for update;
  end if;
  if payment.order_id<>o.id or payment.period_number is distinct from period then raise exception 'PAYMENT_MISMATCH'; end if;
  total:=coalesce((p_event->>'paymentTotalMinor')::integer,payment.payment_total_minor,o.amount_minor);
  if total<o.amount_minor or (payment.payment_total_minor is not null and total<>payment.payment_total_minor) then raise exception 'PAYMENT_TOTAL_MISMATCH'; end if;
  chargeback_amount:=coalesce((p_event->>'chargebackAmountMinor')::integer,total);
  if reason in ('chargeback','chargeback_reversed') and (chargeback_amount<=0 or chargeback_amount>total) then raise exception 'INVALID_CHARGEBACK_AMOUNT'; end if;
  if reason in ('chargeback','chargeback_reversed') and exists(select 1 from ai_font_billing_holds h where h.provider='waffo' and h.adjustment_id=v_adjustment_id and h.chargeback_amount_minor<>chargeback_amount) then raise exception 'CHARGEBACK_AMOUNT_MISMATCH'; end if;
  if kind='review' then
    insert into ai_font_wallets(user_id) values(o.user_id) on conflict do nothing;
    perform 1 from ai_font_wallets where user_id=o.user_id for update;
    if exists(select 1 from ai_font_billing_holds h where h.provider='waffo' and h.adjustment_id=v_adjustment_id and (h.order_id<>o.id or h.payment_id<>v_payment_id)) then raise exception 'ADJUSTMENT_MISMATCH'; end if;
    insert into ai_font_billing_holds(provider,adjustment_id,order_id,user_id,payment_id,reason,provider_status,chargeback_amount_minor)
    values('waffo',v_adjustment_id,o.id,o.user_id,v_payment_id,'chargeback',left(p_event->>'chargebackStatus',100),chargeback_amount)
    on conflict(provider,adjustment_id) do update set provider_status=excluded.provider_status,updated_at=now();
    update ai_font_billing_payments set payment_total_minor=total where provider='waffo' and payment_id=v_payment_id;
    update ai_font_orders set billing_review_reason='CHARGEBACK_REVIEW_REQUIRED' where id=o.id;
    perform ai_font_enqueue_mail('chargeback:waffo:'||v_adjustment_id,o.user_id,o.id,v_payment_id,'chargeback_restricted',
      jsonb_build_object('creditsDelta',0,'reviewRequired',true,'billingRestricted',true,'chargebackAmountMinor',chargeback_amount,'paymentTotalMinor',total,'currency',o.currency));
    return;
  end if;
  net_before:=payment.credits_granted-payment.credits_revoked;
  confirmed:=payment.payment_confirmed or kind='paid';
  if kind='revoked' or kind='restored' then
    -- Legacy events without an adjustment ID represent a full refund. New
    -- adapters must supply stable refund/dispute IDs and the original total.
    v_adjustment_id:=coalesce(nullif(v_adjustment_id,''),'legacy-full-refund:'||v_payment_id);
    refund:=case when reason='refund' then coalesce((p_event->>'refundAmountMinor')::integer,total) else chargeback_amount end;
    if refund<=0 or refund>total then raise exception 'INVALID_REFUND_AMOUNT'; end if;
    select * into adjustment from ai_font_billing_adjustments where provider='waffo' and ai_font_billing_adjustments.adjustment_id=v_adjustment_id for update;
    if found then
      if adjustment.payment_id<>v_payment_id or adjustment.kind<>(case when reason='refund' then 'refund' else 'chargeback' end) or adjustment.amount_minor<>refund then raise exception 'ADJUSTMENT_MISMATCH'; end if;
      if reason='refund' then return; end if;
      if event_time<=adjustment.state_event_at then return; end if;
      -- A confirmed reversal is terminal for this dispute ID; delayed opens
      -- cannot restrict the user again even if delivered with a newer wrapper.
      if not adjustment.active then return; end if;
      update ai_font_billing_adjustments set active=(p_event->>'kind'<>'restored'),state_event_at=event_time
        where provider='waffo' and ai_font_billing_adjustments.adjustment_id=v_adjustment_id;
    else
      insert into ai_font_billing_adjustments(provider,adjustment_id,payment_id,kind,amount_minor,active,state_event_at)
      values('waffo',v_adjustment_id,v_payment_id,case when reason='refund' then 'refund' else 'chargeback' end,refund,kind<>'restored',event_time);
    end if;
  end if;
  select coalesce(sum(amount_minor),0)::integer into refund from ai_font_billing_adjustments where provider='waffo' and payment_id=v_payment_id and ai_font_billing_adjustments.kind='refund';
  -- Migrated historical reversals may not have individual adjustment rows.
  refund:=case when payment.legacy_full_reversal then total else greatest(refund,payment.refunded_amount_minor) end;
  if refund>total then raise exception 'REFUND_TOTAL_EXCEEDED'; end if;
  select exists(select 1 from ai_font_billing_adjustments where provider='waffo' and payment_id=v_payment_id and ai_font_billing_adjustments.kind='chargeback' and active) into restricted;
  select coalesce(sum(amount_minor),0) into chargeback_total from ai_font_billing_adjustments where provider='waffo' and payment_id=v_payment_id and ai_font_billing_adjustments.kind='chargeback' and active;
  -- Use actual paid total, including tax, as the ratio denominator. Round the
  -- cumulative entitlement once so splitting refunds cannot exploit rounding.
  target:=ceil(o.credits::numeric*least(total::bigint,refund::bigint+chargeback_total)/total)::integer;
  delta:=(case when confirmed then o.credits-target else 0 end)-net_before;
  update ai_font_billing_payments set payment_total_minor=case when p_event->>'paymentTotalMinor' is not null or kind<>'paid' then total else payment.payment_total_minor end,refunded_amount_minor=refund,payment_confirmed=confirmed,
    credits_granted=case when confirmed then o.credits else 0 end,credits_revoked=case when confirmed then target else 0 end,
    chargeback_active=restricted,status=case when restricted or refund=total then 'revoked' else 'paid' end
  where provider='waffo' and payment_id=v_payment_id;
  if reason in ('chargeback','chargeback_reversed') then
    insert into ai_font_wallets(user_id) values(o.user_id) on conflict do nothing;
    perform 1 from ai_font_wallets where user_id=o.user_id for update;
    if exists(select 1 from ai_font_billing_holds h where h.provider='waffo' and h.adjustment_id=v_adjustment_id and (h.order_id<>o.id or h.payment_id<>v_payment_id)) then raise exception 'ADJUSTMENT_MISMATCH'; end if;
    insert into ai_font_billing_holds(provider,adjustment_id,order_id,user_id,payment_id,reason,provider_status,chargeback_amount_minor,active,needs_review)
    values('waffo',v_adjustment_id,o.id,o.user_id,v_payment_id,'chargeback',left(p_event->>'chargebackStatus',100),chargeback_amount,kind<>'restored',false)
    on conflict(provider,adjustment_id) do update set active=excluded.active,needs_review=false,provider_status=excluded.provider_status,updated_at=now();
  end if;
  if delta<>0 then
    perform ai_font_credit_once(o.user_id,case when kind='paid' then 'billing:waffo:'||v_payment_id else 'billing-adjustment:waffo:'||v_adjustment_id||':'||reason end,delta);
  end if;
  if kind='paid' and not payment.payment_confirmed and delta>0 then
    perform ai_font_enqueue_mail('payment:waffo:'||v_payment_id,o.user_id,o.id,v_payment_id,'payment_credited',
      jsonb_build_object('credits',delta,'creditsDelta',delta,'amountMinor',o.amount_minor,'paymentTotalMinor',total,'currency',o.currency,
        'billingRestricted',exists(select 1 from ai_font_billing_holds where user_id=o.user_id and active) or coalesce((select balance from ai_font_wallets where user_id=o.user_id),0)<0,
        'reviewRequired',exists(select 1 from ai_font_billing_holds where user_id=o.user_id and active and needs_review)));
  elsif kind='revoked' and reason='refund' then
    perform ai_font_enqueue_mail('refund:waffo:'||v_adjustment_id,o.user_id,o.id,v_payment_id,'refund_applied',
      jsonb_build_object('creditsDelta',delta,'revokedCredits',target,'refundAmountMinor',coalesce((p_event->>'refundAmountMinor')::integer,total),'refundedAmountMinor',refund,'paymentTotalMinor',total,'currency',o.currency));
  elsif kind='revoked' and reason='chargeback' then
    perform ai_font_enqueue_mail('chargeback-loss:waffo:'||v_adjustment_id,o.user_id,o.id,v_payment_id,'chargeback_restricted',
      jsonb_build_object('creditsDelta',delta,'revokedCredits',target,'confirmedLoss',true,'billingRestricted',true,'chargebackAmountMinor',chargeback_amount,'paymentTotalMinor',total,'currency',o.currency));
  elsif kind='restored' then
    perform ai_font_enqueue_mail('chargeback-reversed:waffo:'||v_adjustment_id,o.user_id,o.id,v_payment_id,'chargeback_reversed',
      jsonb_build_object('creditsDelta',delta,'chargebackAmountMinor',chargeback_amount,'paymentTotalMinor',total,'currency',o.currency));
  end if;
  update ai_font_orders set billing_review_reason=case when exists(select 1 from ai_font_billing_holds where order_id=o.id and active and needs_review) then 'CHARGEBACK_REVIEW_REQUIRED' end where id=o.id;
  if o.purchase_kind='subscription' and confirmed then update ai_font_orders set status='paid' where id=o.id; end if;
  if o.purchase_kind='one_time' then update ai_font_orders set status=case when restricted or refund=total then 'revoked' when confirmed then 'paid' else 'pending' end,capture_id=v_payment_id where id=o.id; end if;
end;
$$;

create function public.ai_font_claim_mail(p_limit integer default 3)
returns setof public.ai_font_mail_outbox language plpgsql security definer set search_path=public as $$
begin
  -- Without a provider idempotency guarantee, an expired request that started
  -- sending may already have delivered. Keep it for review instead of re-send.
  update ai_font_mail_outbox set status='needs_review',last_error='DELIVERY_UNCERTAIN',claim_token=null,claimed_until=null
    where status='processing' and claimed_until<=now() and delivery_started_at is not null;
  update ai_font_mail_outbox set status='needs_review',last_error='DELIVERY_RETRIES_EXHAUSTED',claim_token=null,claimed_until=null
    where status='processing' and claimed_until<=now() and attempts>=8;
  return query with due as (
    select id from ai_font_mail_outbox where attempts<8 and
      ((status='pending' and next_attempt_at<=now()) or (status='processing' and claimed_until<=now()))
    order by next_attempt_at,id limit greatest(1,least(coalesce(p_limit,3),10)) for update skip locked
  ) update ai_font_mail_outbox m set status='processing',attempts=m.attempts+1,claim_token=gen_random_uuid(),claimed_until=now()+interval '5 minutes'
    from due where m.id=due.id returning m.*;
end;
$$;

-- A reconciliation snapshot may contain both a missed payment and refunds.
-- Apply the complete validated snapshot atomically, with refunds first, so a
-- fully refunded purchase never briefly exposes spendable credits or queues a
-- misleading "credits available" email between separate HTTP/RPC calls.
create function public.ai_font_apply_waffo_events(p_events jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_order uuid; owner_id uuid; item jsonb;
begin
  if jsonb_typeof(p_events) is distinct from 'array' or jsonb_array_length(p_events)>100 then raise exception 'INVALID_EVENT_BATCH'; end if;
  if jsonb_array_length(p_events)=0 then return; end if;
  v_order:=(p_events->0->>'orderId')::uuid;
  if v_order is null or exists(select 1 from jsonb_array_elements(p_events) e where e.value->>'orderId' is distinct from v_order::text) then raise exception 'INVALID_EVENT_BATCH'; end if;
  select user_id into strict owner_id from ai_font_orders where id=v_order for update;
  insert into ai_font_wallets(user_id) values(owner_id) on conflict do nothing;
  perform 1 from ai_font_wallets where user_id=owner_id for update;
  for item in select value from jsonb_array_elements(p_events) order by
    case value->>'kind' when 'revoked' then 0 when 'review' then 1 when 'restored' then 2 else 3 end
  loop
    perform ai_font_apply_waffo_event(item);
  end loop;
end;
$$;

-- Administrative recovery only, after Waffo/bank evidence confirms the money
-- outcome. This adjusts entitlement and releases/keeps the hold; it never
-- initiates a payment-provider refund, charge or chargeback action.
create function public.ai_font_resolve_chargeback(p_adjustment_id text,p_outcome text,p_reference text)
returns void language plpgsql security definer set search_path=public as $$
declare hold ai_font_billing_holds; payment ai_font_billing_payments; o ai_font_orders; event_time timestamptz;
begin
  if p_outcome not in ('confirmed_loss','reversed') or p_outcome is null then raise exception 'INVALID_CHARGEBACK_OUTCOME'; end if;
  if p_reference is null or p_reference !~ '^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,199}$' then raise exception 'INVALID_EVIDENCE_REFERENCE'; end if;
  select * into hold from ai_font_billing_holds where provider='waffo' and adjustment_id=p_adjustment_id;
  if not found then raise exception 'CHARGEBACK_NOT_FOUND'; end if;
  -- Match event processing's lock order: order, wallet, hold/payment.
  select * into strict o from ai_font_orders where id=hold.order_id for update;
  insert into ai_font_wallets(user_id) values(o.user_id) on conflict do nothing;
  perform 1 from ai_font_wallets where user_id=o.user_id for update;
  select * into strict hold from ai_font_billing_holds where provider='waffo' and adjustment_id=p_adjustment_id for update;
  select * into strict payment from ai_font_billing_payments where provider='waffo' and payment_id=hold.payment_id for update;
  if p_outcome='confirmed_loss' and (not hold.active or exists(select 1 from ai_font_chargeback_decisions where provider='waffo' and adjustment_id=p_adjustment_id and outcome='reversed')) then raise exception 'CHARGEBACK_ALREADY_REVERSED'; end if;
  if exists(select 1 from ai_font_chargeback_decisions where provider='waffo' and adjustment_id=p_adjustment_id and outcome=p_outcome) then return; end if;
  if o.provider<>'waffo' or o.provider_order_id is null or payment.order_id<>o.id or payment.payment_total_minor is null then raise exception 'CHARGEBACK_PAYMENT_REVIEW_REQUIRED'; end if;
  insert into ai_font_chargeback_decisions(provider,adjustment_id,outcome,evidence_reference)
    values('waffo',p_adjustment_id,p_outcome,p_reference);
  select greatest(clock_timestamp(),coalesce(max(state_event_at)+interval '1 microsecond',clock_timestamp())) into event_time
    from ai_font_billing_adjustments where provider='waffo' and adjustment_id=p_adjustment_id;
  perform ai_font_apply_waffo_event(jsonb_build_object(
    'key','manual-chargeback:'||p_adjustment_id||':'||p_outcome,
    'kind',case when p_outcome='confirmed_loss' then 'revoked' else 'restored' end,
    'reason',case when p_outcome='confirmed_loss' then 'chargeback' else 'chargeback_reversed' end,
    'adjustmentId',p_adjustment_id,'chargebackStatus',case when p_outcome='confirmed_loss' then 'MANUAL_CONFIRMED_LOSS' else 'MANUAL_REVERSED' end,
    'chargebackAmountMinor',hold.chargeback_amount_minor,
    'orderId',o.id,'providerOrderId',o.provider_order_id,'paymentId',payment.payment_id,'mode',o.provider_environment,
    'amountMinor',o.amount_minor,'paymentTotalMinor',payment.payment_total_minor,'currency',o.currency,
    'periodNumber',payment.period_number,'timestamp',event_time));
end;
$$;
create function public.ai_font_begin_mail_delivery(p_id bigint,p_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update ai_font_mail_outbox set delivery_started_at=now()
    where id=p_id and status='processing' and claim_token=p_token and claimed_until>now() and delivery_started_at is null;
  return found;
end;
$$;
create function public.ai_font_finish_mail(p_id bigint,p_token uuid,p_message_id text default null,p_error text default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if p_error is null then
    update ai_font_mail_outbox set status='sent',sent_at=now(),provider_message_id=left(p_message_id,200),last_error=null,claim_token=null,claimed_until=null
      where id=p_id and status='processing' and claim_token=p_token and claimed_until>now();
  else
    update ai_font_mail_outbox set status=case when attempts>=8 or p_error='DELIVERY_UNCERTAIN' or left(p_error,10)='PERMANENT_' then 'needs_review' else 'pending' end,
      next_attempt_at=now()+make_interval(secs=>least(86400,60*power(2,least(attempts,10))::integer)),
      last_error=left(p_error,500),delivery_started_at=case when p_error='DELIVERY_UNCERTAIN' then delivery_started_at end,claim_token=null,claimed_until=null
      where id=p_id and status='processing' and claim_token=p_token and claimed_until>now();
  end if;
  return found;
end;
$$;

create function public.ai_font_claim_billing_orders(p_limit integer default 3,p_order uuid default null,p_mode text default null)
returns setof public.ai_font_orders language plpgsql security definer set search_path=public as $$
begin
  return query with due as (
    select id from ai_font_orders where provider='waffo' and purchase_kind='one_time'
      and (p_mode is null or provider_environment=p_mode)
      and (billing_claim_until is null or billing_claim_until<=now())
      and ((p_order is null and next_billing_check_at<=now()) or (id=p_order and (billing_checked_at is null or billing_checked_at<=now()-interval '60 seconds')))
    order by next_billing_check_at,id limit greatest(1,least(coalesce(p_limit,3),10)) for update skip locked
  ) update ai_font_orders o set billing_claim_token=gen_random_uuid(),billing_claim_until=now()+interval '5 minutes'
    from due where o.id=due.id returning o.*;
end;
$$;
create function public.ai_font_finish_billing_check(p_id uuid,p_token uuid,p_error text default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update ai_font_orders set billing_checked_at=now(),billing_last_error=left(p_error,100),
    billing_check_failures=case when p_error is null then 0 else billing_check_failures+1 end,
    next_billing_check_at=now()+case when p_error is not null then make_interval(secs=>least(21600,60*power(2,least(billing_check_failures+1,10))::integer))
      when status='pending' then interval '5 minutes' else interval '30 minutes' end,
    billing_claim_token=null,billing_claim_until=null
    where id=p_id and billing_claim_token=p_token and billing_claim_until>now();
  return found;
end;
$$;

alter table public.ai_font_billing_adjustments enable row level security;
alter table public.ai_font_billing_holds enable row level security;
alter table public.ai_font_chargeback_decisions enable row level security;
alter table public.ai_font_mail_outbox enable row level security;
revoke all on public.ai_font_billing_adjustments,public.ai_font_billing_holds,public.ai_font_chargeback_decisions,public.ai_font_mail_outbox from public,anon,authenticated;
grant all on public.ai_font_billing_adjustments,public.ai_font_billing_holds,public.ai_font_chargeback_decisions,public.ai_font_mail_outbox to service_role;
grant usage,select on sequence public.ai_font_mail_outbox_id_seq to service_role;
revoke all on function public.ai_font_enqueue_mail(text,uuid,uuid,text,text,jsonb),public.ai_font_apply_waffo_event(jsonb),public.ai_font_apply_waffo_events(jsonb),public.ai_font_resolve_chargeback(text,text,text),public.ai_font_claim_mail(integer),public.ai_font_begin_mail_delivery(bigint,uuid),public.ai_font_finish_mail(bigint,uuid,text,text),public.ai_font_claim_billing_orders(integer,uuid,text),public.ai_font_finish_billing_check(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.ai_font_apply_waffo_event(jsonb),public.ai_font_apply_waffo_events(jsonb),public.ai_font_resolve_chargeback(text,text,text),public.ai_font_claim_mail(integer),public.ai_font_begin_mail_delivery(bigint,uuid),public.ai_font_finish_mail(bigint,uuid,text,text),public.ai_font_claim_billing_orders(integer,uuid,text),public.ai_font_finish_billing_check(uuid,uuid,text) to service_role;

create or replace function public.ai_font_reserve_job(p_user uuid,p_id uuid,p_prompt text,p_expected_cost integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare existing ai_font_jobs; available integer; cost integer;
begin
  insert into ai_font_wallets(user_id) values(p_user) on conflict do nothing;
  select balance into available from ai_font_wallets where user_id=p_user for update;
  select * into existing from ai_font_jobs where id=p_id;
  if found then
    if existing.user_id<>p_user or existing.prompt<>p_prompt then raise exception 'REQUEST_MISMATCH'; end if;
    return p_id;
  end if;
  if exists(select 1 from ai_font_billing_holds where user_id=p_user and active) then raise exception 'BILLING_RESTRICTED'; end if;
  select credits into strict cost from ai_font_operation_costs where operation='standard';
  if p_expected_cost is distinct from cost then raise exception 'COST_CHANGED'; end if;
  if available<cost then raise exception 'NO_CREDITS'; end if;
  if exists(select 1 from ai_font_jobs where user_id=p_user and status in ('reserved','starting','processing','needs_review')) then raise exception 'ACTIVE_JOB'; end if;
  insert into ai_font_jobs(id,user_id,prompt,credit_cost) values(p_id,p_user,p_prompt,cost);
  perform ai_font_credit_once(p_user,'job:'||p_id,-cost);
  return p_id;
end;
$$;

create or replace function public.ai_font_claim_job(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare owner_id uuid; available integer; job ai_font_jobs;
begin
  select user_id into owner_id from ai_font_jobs where id=p_id;
  if owner_id is null then return false; end if;
  insert into ai_font_wallets(user_id) values(owner_id) on conflict do nothing;
  select balance into available from ai_font_wallets where user_id=owner_id for update;
  select * into strict job from ai_font_jobs where id=p_id for update;
  if job.status<>'reserved' then return false; end if;
  if available<0 or exists(select 1 from ai_font_billing_holds where user_id=owner_id and active) then
    -- No remote generation has started, so cancel and restore its exact reserved
    -- cost once. Existing remote jobs continue to deliver/finish normally.
    perform ai_font_finish_job(p_id,'failed');
    return false;
  end if;
  update ai_font_jobs set status='starting',updated_at=now() where id=p_id and status='reserved';
  return found;
end;
$$;

-- Claim and cancellation both lock wallet before job; completion must use the
-- same order to avoid a claim-vs-failed-completion deadlock on the credit refund.
create or replace function public.ai_font_finish_job(p_id uuid,p_status text,p_path text default null,p_name text default null)
returns void language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs; owner_id uuid;
begin
  if p_status not in ('succeeded','failed') then raise exception 'INVALID_STATUS'; end if;
  select user_id into strict owner_id from ai_font_jobs where id=p_id;
  insert into ai_font_wallets(user_id) values(owner_id) on conflict do nothing;
  perform 1 from ai_font_wallets where user_id=owner_id for update;
  select * into strict j from ai_font_jobs where id=p_id for update;
  if j.status in ('succeeded','failed') then return; end if;
  if p_status='succeeded' and (p_path is null or p_path<>j.user_id||'/'||j.id||'.ttf') then raise exception 'INVALID_PATH'; end if;
  update ai_font_jobs set status=p_status,storage_path=p_path,name=left(p_name,100),updated_at=now() where id=p_id;
  if p_status='failed' then perform ai_font_credit_once(j.user_id,'restore:'||p_id,j.credit_cost); end if;
end;
$$;
commit;
