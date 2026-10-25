# Waffo billing recovery and notifications

Apply `supabase/migrations/202610140001_billing_reconciliation_outbox.sql`
after the three earlier AI-font migrations and **before deploying this version**.
The migration is transactional and preserves existing credit balances. It adds
payment checks, refund adjustments, dispute holds, operator decisions and a mail
outbox. Only `service_role` can access these tables and functions. This source
change does not apply the migration to a hosted database or deploy the Worker.

## Private checkout rollout

Checkout defaults to a private rollout. Configure these **server runtime** values
in Worker Variables and Secrets (or ignored `.env.local` for local development):

```dotenv
AI_FONT_CHECKOUT_MODE=private
AI_FONT_CHECKOUT_ALLOWLIST=
```

Set the allowlist to the Google login emails permitted to test purchases, separated
by commas (or newlines). Start with only your own account.
Only the confirmed email returned by Supabase `auth.getUser()` is compared, using
case-insensitive exact matching. User metadata, request bodies and browser state
cannot grant access. The configured allowlist is not returned in API responses
or page props. An empty allowlist, unknown mode, unverified email or unlisted account
cannot purchase. Missing mode defaults to `private`.

Payment, generation, moderation and cron configuration must still be ready.
The test account must still accept terms, have no billing restriction and pass
the existing order validation and rate limit. Private access does not select a
payment sandbox: the existing Waffo/PayPal environment setting still determines
whether a purchase uses test or real money.

The account API returns personalized checkout availability. Visitors and other
accounts see the existing disabled **Payments coming soon** button. The order
creation endpoint independently repeats this check before database writes or
payment-provider calls, so changing the UI cannot bypass it. Existing orders,
payment webhooks, reconciliation, cancellation and purchased-credit usage continue
to work; the gate only controls starting or reopening checkout sessions.

When ready to open purchases, explicitly set `AI_FONT_CHECKOUT_MODE=public` and
apply the runtime configuration. No frontend rebuild is required for these two
settings. All existing payment checks still apply. This remains a one-time pack,
not a new recurring subscription product. Test the private and public states
with mocks; changing these settings alone does not validate a real payment.

## Payment recovery

Keep the signed HTTP webhook for `order.completed` and `refund.succeeded`.
The five-minute cron also reads Waffo's authenticated GraphQL API, using the
existing local order UUID as `orderMerchantExternalId`. It checks the exact
store, environment, product, metadata, currency, original price and actual
successful payment. It can recover a checkout even if saving its session failed.
An unpaid, missing or mismatched provider record grants no credits.

Both the authenticated **Check payment** action and cron use database leases.
Manual checks have a 60-second cooldown. Cron claims at most three orders per
pass, fairly across all historical one-time Waffo orders in the configured
environment, including paid/refunded orders. Pending checks are normally due
after five minutes; paid checks after thirty minutes. These are eligibility
intervals, not per-order delivery guarantees when there is a backlog. Failures
back off to a maximum of six hours. Inspect overdue orders and increase capacity
deliberately as volume grows.

The complete provider snapshot is validated before one transactional batch
applies its refunds, disputes and payment. Refunds are considered before a
previously missing payment, so an already refunded purchase cannot briefly grant
spendable credits. Payment IDs, refund IDs and unique credit-event keys prevent
duplicate credit changes across webhook retries and periodic queries. The
browser success redirect itself never grants credits.

Waffo API keys determine the environment. Test orders and production orders are
validated separately, but the existing wallet is shared within a Supabase
project. Use a separate test database. Switching a shared database to production
does not erase test credits; review any existing test balances before launch.

## Refunds and spent credits

This feature records refunds already executed by Waffo. It does **not** call a
refund-creation API or decide a customer's refund eligibility. Support reviews
the monetary refund in Waffo according to the purchase terms and applicable
consumer rights.

For a payment with `C` credits, actual paid total `P` (including tax), and
cumulative successfully refunded amount `R`, withdrawn credits are
`ceil(C * R / P)`, capped at `C`. The ledger recomputes the cumulative entitlement,
so splitting a refund into multiple requests does not compound rounding. Refund
webhook `eventId` and GraphQL `Refund.id` identify the same adjustment.

If 300 credits were purchased and 100 were consumed, a full refund changes the
remaining balance from 200 to -100. If all 300 were consumed, it becomes -300.
A negative balance pauses new generations and purchases until support resolves
it. This is an accounting deficit, not an automatic card charge. Previously
delivered fonts remain downloadable. Requests reserved but not yet sent to
Mixfont are cancelled and their exact reserved cost restored if a refund or
dispute prevents submission; work already submitted is allowed to complete.

Old reversals processed by the previous implementation retain their original
full-credit withdrawal. Their real paid total can be filled in by reconciliation
without re-granting credits or failing because tax was unknown. Historical
partial refunds that were previously treated as full reversals need support
review; the migration does not silently change old balances.

## Chargebacks

Waffo exposes chargeback records but does not document a complete mapping of
PSP status strings to final outcomes. Reconciliation therefore records the case
and pauses the account for review, without guessing that money was refunded or
that a dispute was won. Resolved cases stay resolved when old provider records
are queried again.

After verifying the actual funds outcome in Waffo or the bank, an operator can
run the restricted database function below. The reference must be a non-personal
evidence/document reference (up to 200 ASCII letters, digits or `._:/#-`), not an
email address, secret or URL query string. Use the provider's existing chargeback
ID from `ai_font_billing_holds`, not a newly invented ID.

```sql
-- Confirmed funds loss: withdraw credits for this case's verified principal.
select public.ai_font_resolve_chargeback(
  '<existing-chargeback-id>', 'confirmed_loss', 'waffo-case-record-123'
);
-- Confirmed reversal/recovery: restore only the unrefunded entitlement.
select public.ai_font_resolve_chargeback(
  '<existing-chargeback-id>', 'reversed', 'waffo-recovery-record-123'
);
```

Both actions record an audit decision and adjust credits in the same transaction.
Neither sends money or requests a second refund. Partial chargeback loss uses
the actual principal recorded for the case, combined with successful refunds
and capped at the original paid total. Refunds plus chargebacks cannot withdraw
more than the original payment's credits. Duplicate decisions are
idempotent; a reversed case cannot subsequently be marked lost by a stale retry.
Other unresolved disputes or negative balances continue to restrict the account.

## Inbox transaction mail configuration

The reusable server-only adapter is `lib/mail/inbox.ts`. It calls the configured
HTTPS origin at `POST /api/v1/send` with a server-constructed Bearer header and
JSON `{from: {email, name}, to, cc?, bcc?, subject, text?, html?}`. At least one
nonblank text or HTML body is required. The adapter supports an address or address
array for `to`, `cc` and `bcc`; the existing billing flow uses only the single
account address stored in the outbox. There is no public mail-sending endpoint.
Sender identity always comes from server settings, and browser Origin, Cookie and
Authorization headers are never forwarded. Redirects are refused.

Copy the blank placeholders from the tracked `.env.example` into ignored
`.env.local` for development. In production, use Worker runtime variables and
secrets (never `NEXT_PUBLIC_*` values). Configure:

- `INBOX_URL`: `https://mail.leeswalvpn.ccwu.cc` (origin only, no API path).
- `INBOX_SEND_API_KEY`: your send API key, stored as a server secret.
- `INBOX_FROM_EMAIL`: `support@font-generators.org`.
- `INBOX_FROM_NAME`: `Font Generators`.

The mailbox must already exist and the key must be authorized for that sender.
No mailbox login password or Mailjet credentials are needed. Remove the old
mail adapter settings from deployment environments; they are no longer read.
The previous adapter and its configuration contract have been removed.
Without all four settings, sending is disabled and committed notices remain
queued. Invalid settings fail before taking delivery leases. Completing this
configuration enables cron delivery of queued notices: review old/test entries
before enabling production mail. Billing uses the existing billing outbox migration;
font result notices additionally require `202610260001_job_notifications.sql`.
See [font result notifications](ai-font-notifications.md) for the Chinese rollout guide.

Payment credit changes and notification intent commit together. Delivery runs
afterward, sharing at most **one message per five-minute cron pass** with font
result notifications. Queue priority alternates each pass; an empty preferred
queue yields to the other queue. Recipients come from
Supabase account records, not browser input. Messages cover Waffo credit arrival,
refunds, restricted disputes and confirmed recoveries. Payment under review is
described as confirmed but paused. Messages use the balance snapshot at adjustment
time; the account page shows the current state. Email failure never rolls back
payment or credits. This integration does not change authentication email,
PayPal flows or the contact page.

The service limits each key to **60 requests/minute** and each sender mailbox to
**20 messages/hour and 100/day**. Mailbox limits are shared across projects.
One cron message at a time reduces bursts, but does not reserve quota or enforce
a global/day budget locally: the service remains authoritative. Daily or shared
quota exhaustion can delay mail and exhaust the bounded retry budget; monitor
pending and review queues. This is low-volume transaction mail, not OTP or bulk
marketing infrastructure. Requests over 20 MiB are rejected locally.

Each call has a **35-second timeout**, allowing for the service's 25-second send
timeout. Delivery is awaited inside the existing authenticated reconciliation
route (600-second budget), invoked by the Cron service binding, rather than
post-response background work. This fits the current
[Cloudflare Cron 15-minute wall-time limit](https://developers.cloudflare.com/workers/platform/limits/#wall-time-limits-by-invocation-type).
If moved to a platform with a shorter request limit, run this outbox consumer in
a background worker that can await at least 35 seconds per message plus database
work; do not shorten the timeout and automatically resend.

Only **HTTP 202 with `{id: "...", status: "sent"}`** is accepted. `sent` in the
outbox means accepted and saved to the service's Sent folder, not final delivery.
The API has no idempotency key support. Outbox event uniqueness and delivery leases
prevent local duplicates but cannot deduplicate a second upstream send.

| Outcome | Recorded code and handling |
| --- | --- |
| Timeout, network exception, 502, unexpected status, invalid/non-JSON 202 receipt | `DELIVERY_UNCERTAIN`: sending outcome unknown; `needs_review`, no automatic resend |
| 401 | `PERMANENT_AUTHENTICATION`: invalid API key; review |
| 403 | `PERMANENT_SENDER_UNAUTHORIZED`: sender not authorized (the adapter does not send Origin); review |
| 404 | `PERMANENT_SENDER_NOT_FOUND`: mailbox missing; review |
| 400 or 413 | `PERMANENT_REJECTED`: invalid/oversized message; review |
| 503 | `PERMANENT_CONFIGURATION`: mail service configuration error; review |
| 429 | `RETRY_RATE_LIMIT`: known rejection, existing exponential backoff; review after eight attempts |

HTTP status handling does not depend on JSON error bodies. Receipt reading is
bounded to 16 KiB. Error logs include only outbox ID, fixed error code and HTTP
status when available; they never contain recipients, keys, bodies or full requests.
The durable outbox `last_error` records the fixed code. A process crash after
sending starts, or failure to save the acceptance receipt, also requires review
when its lease expires. Local preparation failures can retry before a send starts.

Validation uses intercepted fetch mocks, including success, authorization failure,
rate limiting, timeout, network failure and non-JSON responses, plus existing
outbox database tests. Run `npm run test:ai-font`, `npm run test:cloudflare`,
`npx tsc --noEmit` and `npm run lint`. These checks **do not verify real delivery**.
No real test email is sent without an explicit request; deployment credentials
must be configured separately by the operator.

## Operations

Cron response reports separate `billing`, `jobs`, billing `mail`, font `fontMail`
and `analytics` counts and an aggregate `errors` count. Generation or billing
failures do not stop mail processing. A mail queue error ends that pass's mail
budget; queue priority alternates on later passes. Monitor scheduled
failures, overdue `next_billing_check_at`, `billing_last_error`, active dispute
holds, and mail `needs_review` or overdue leases. Account and recipient data must
stay in restricted administrative tools and out of logs.

Before requeueing an uncertain email, check the mail service's Sent records and downstream
delivery record. If it was accepted, record its receipt instead of sending again.
If it was definitely not accepted, clear the started/lease fields and requeue the
specific reviewed row. Never bulk-reset all `needs_review` notices.

Verify on a separate test database: lost webhook payment recovery, duplicate
notifications, multiple partial refunds, refund-before-payment, spent-credit
deficits, dispute review/recovery and mail acceptance/failure. This implementation
has database/provider-mock tests; a hosted end-to-end test still needs the new
migration, an actual site-started sandbox purchase and configured Inbox mail.
