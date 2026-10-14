# Waffo billing recovery and notifications

Apply `supabase/migrations/202610140001_billing_reconciliation_outbox.sql`
after the three earlier AI-font migrations and **before deploying this version**.
The migration is transactional and preserves existing credit balances. It adds
payment checks, refund adjustments, dispute holds, operator decisions and a mail
outbox. Only `service_role` can access these tables and functions. This source
change does not apply the migration to a hosted database or deploy the Worker.

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

## Freemail configuration

The website calls Freemail only. Mailjet credentials and its integration belong
in Freemail. The adapter follows the supplied
[Freemail API contract](https://github.com/idinging/freemail/blob/master/docs/api.md):
POST `/api/send`, Bearer authentication, JSON
`{from, fromName, to, subject, text}`, and `{success:true,id,provider}` on acceptance.
The upstream documentation lists other delivery providers; any Mailjet bridge
must preserve this contract. No direct Mailjet SDK is installed on this site.

Place these server-only values in ignored `.env.local` for development and Worker
runtime secrets/settings for deployment. URL, token and sender are intentionally
blank until the mail service is ready. The same placeholders are in the ignored
local `docs/ai-font.env.example`.

```dotenv
FREEMAIL_API_CONTRACT=idinging-send-v1
FREEMAIL_API_URL=
FREEMAIL_API_TOKEN=
FREEMAIL_FROM_EMAIL=
FREEMAIL_FROM_NAME=Font Generators
```

`FREEMAIL_API_URL` is the full HTTPS send endpoint, for example
`https://mail.example.com/api/send`. `FREEMAIL_API_TOKEN` is the Bearer token
authorized to send from the configured address. It is never public or put in a
URL. Without all required settings, sending is disabled and committed notices
remain queued. Completing this configuration enables cron delivery of the queued
notices; review old/test entries before enabling production mail.

Payment credit changes and notification intent commit together. Delivery runs
afterward, at most three messages per cron pass. The recipient is the Supabase
account email, not an arbitrary cashier address. Messages cover confirmed credit
arrival, refunds, restricted disputes and confirmed recoveries. A payment under
review is described as confirmed but paused, not ready to spend. Messages use the
balance snapshot at the adjustment time; the account page shows the current state.

Freemail does not document request idempotency. A timeout, lost response, 5xx or
invalid successful receipt is therefore `needs_review`, not automatically resent.
A process crash after delivery starts also requires review. A confirmed rate
limit is retried with backoff, up to eight attempts. Permanent configuration or
request rejection requires correction and review. `sent` means Freemail accepted
the message and returned an ID; it does not prove inbox delivery. Email failure
never rolls back payment or credits.

## Operations

Cron response reports separate `billing`, `jobs` and `mail` counts and an aggregate
`errors` count. One queue's failure does not stop the others. Monitor scheduled
failures, overdue `next_billing_check_at`, `billing_last_error`, active dispute
holds, and mail `needs_review` or overdue leases. Account and recipient data must
stay in restricted administrative tools and out of logs.

Before requeueing an uncertain email, check Freemail's sent records and downstream
delivery record. If it was accepted, record its receipt instead of sending again.
If it was definitely not accepted, clear the started/lease fields and requeue the
specific reviewed row. Never bulk-reset all `needs_review` notices.

Verify on a separate test database: lost webhook payment recovery, duplicate
notifications, multiple partial refunds, refund-before-payment, spent-credit
deficits, dispute review/recovery and mail acceptance/failure. This implementation
has database/provider-mock tests; a hosted end-to-end test still needs the new
migration, an actual site-started sandbox purchase and configured Freemail.
