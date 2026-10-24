# AI Font conversion analytics (GA4)

The current product is a **one-time credit pack**, not a recurring subscription.
The existing production web stream is `G-P3P9SJKZEG`. Browser events only run on
`font-generators.org` and `www.font-generators.org`; local/preview visits do not send.
Do not create a second Google tag or fire duplicate events through GTM.

## Setup status (2026-10-24)

- Verified GA4 account `308210524`, property `546971242`, web stream `15316923834`,
  website `https://font-generators.org`, measurement ID `G-P3P9SJKZEG` in the live UI.
- Saved all seven event-scoped custom dimensions listed below.
- Saved enhanced measurement changes: history-based page changes off, automatic
  form interactions off. Verified `purchase` is already a key event; no purchase
  stream data was present at verification time.
- **Pending:** save the two funnel explorations and internal-user exclusion segment.
  Browser control repeatedly timed out before the funnel editor could be reached.
  The sections below specify the exact remaining configuration; they are not a
  claim that those explorations have been created.
- **Pending deployment:** apply the new database migration, provide the real runtime
  MP secret, and deploy the application. No MP secret was created or configured,
  and no live payment, email or GA event was sent for verification.

## Deployment and configuration

1. Apply `supabase/migrations/202610230001_analytics_funnel.sql` after the existing
   account/billing migrations. This adds optional order attribution, durable event
   timestamps, and a service-role-only delivery queue. It does not backfill old purchases.
2. In GA4 Admin → Data streams, verify the website and measurement ID above.
   Obtain a Measurement Protocol API secret for **this stream**, then set the
   server runtime secret `GA4_MEASUREMENT_PROTOCOL_SECRET`. Never use `NEXT_PUBLIC_`,
   commit a value, place it in a browser tag, or log the MP request URL.
3. Optional runtime `GA4_INTERNAL_EMAILS` accepts comma/newline-separated test account
   emails. `AI_FONT_CHECKOUT_ALLOWLIST` accounts are also classified as internal,
   even after `AI_FONT_CHECKOUT_MODE=public`. Keep internal testers in either list.
4. Reuse the existing `AI_FONT_APP_URL` (production HTTPS origin), Supabase service
   role configuration, `AI_FONT_CRON_SECRET`, and five-minute Worker Cron trigger.
   Analytics delivery is independently handled by the authenticated reconciliation
   route. Missing analytics configuration disables delivery without disabling payment.
5. Deploy the code after the migration and configure the GA4 reports below. Changing
   the two GA4 environment variables is a runtime configuration change, not a new
   frontend build. A Worker configuration/version deployment may still be required
   by the hosting interface to apply changed settings.

No actual GA4 secret belongs in this document or `.env.example`.

## Event contract

| Event | Source and meaning |
| --- | --- |
| `ai_font_view` | Browser visits the AI Font Generator route. |
| `login_start` | Google sign-in requested after local auth configuration checks. |
| `login` | OAuth code exchange succeeded; a short-lived server marker is consumed after return. Ordinary session refresh is not a new login. |
| `login_return` | The site's header retrieves the authenticated session after OAuth return. This measures successful return to the site, not another sign-in. |
| `view_item` | Pricing account/availability data loaded and the starter pack is shown. |
| `checkout_click` | An authenticated, eligible user with accepted terms clicks Buy. |
| `checkout_error` | Checkout HTTP/network error, with a bounded error code. |
| `begin_checkout` | Server persisted the payment provider checkout URL. Does not prove the external payment page loaded. |
| `purchase` | Server order transitions to paid after provider validation. The success-page URL alone never produces a purchase. |

Every relevant event carries `audience_type` (`anonymous`, `customer`, `internal`),
`checkout_eligible` (`true`, `false`), `checkout_mode` (`private`, `public`),
`payment_provider` (`waffo`, `paypal`, or unknown before configuration is loaded), and
`payment_environment` (`test`, `live`, or unknown). Login events also include `method`
and `login_destination`. `user_id` is a stable SHA-256-derived account identifier,
not an email or a hash of the email. Logout clears it.

Internal accounts and test/sandbox payments emit **`test_begin_checkout` and
`test_purchase`** instead of standard server ecommerce events. They remain available
for testing without adding standard purchase revenue. Do not mark these test events
as key events. Frontend events retain their names and carry the audience/environment
flags. An anonymous visit cannot be recognized as an internal tester until sign-in;
use a user exclusion segment for the login funnel (see below).

The browser supplies only an existing GA `client_id` and `session_id`. User identity,
product, price, environment and eligibility come from the server/ledger. Ecommerce
values are the pack subtotal (`amount_minor / 100`), not a tax-inclusive charge.
`transaction_id` is the local order UUID. No email, display name, font prompt, card
information, auth token or arbitrary request data is sent in custom events. Manual
page locations strip query strings and fragments except bounded UTM fields; do not
place personal data in UTM values. Referrers contain only the origin.

## GA4 property settings

These are **remote property settings**, not applied by deploying this repository.
Verify the property and stream before editing; a local test cannot certify them.

- Admin → Custom definitions → Create custom dimension: create event-scoped
  `audience_type`, `checkout_eligible`, `checkout_mode`, `payment_provider`,
  `payment_environment`, `login_destination`, and `error_code`. The display name may
  match the parameter. Do not register `user_id`, `client_id`, transaction IDs or
  login event IDs as custom dimensions.
- Admin → Events / Key events: verify `purchase` is a key event. Login is a funnel
  step, not necessarily a business conversion. Do not derive purchases from a URL.
- Data stream → Enhanced measurement → Page views → Advanced settings: disable
  **Page changes based on browser history events** to avoid duplicating the manual
  Next.js route page views. Manual initialization also sets `send_page_view:false`.
  Disable automatic form-interaction collection for font input forms so these are
  not mistaken for checkout or lead events.
- Retain the existing reporting identity and privacy settings unless there is a
  deliberate reason to change them. Custom definitions need newly collected data;
  creating a definition does not restore missing historic event parameters.

## Saved funnel explorations

Create two closed Funnel explorations. Use **indirectly followed by**, unique users,
show elapsed time, and a rolling last-28-days range. These are user conversion
funnels; they are not a ledger of individual order attempts. Use the built-in
`Device category`, `Session source / medium`, or `Country` dimensions as breakdowns.
Keep breakdowns coarse while traffic is low.

### AI Font — Login completion

1. `Event name` exactly `login_start`.
2. `Event name` exactly `login`, within **30 minutes** of the previous step.
3. `Event name` exactly `login_return`, within **5 minutes** of the previous step.

Create a user segment that excludes users with any `audience_type=internal` event
in the exploration period. Apply this segment to remove testers' earlier anonymous
login_start events as well as their authenticated events. Do not filter every step
by `audience_type=customer`: the first step is normally anonymous. Do not require
checkout eligibility for this login funnel; the free site also supports accounts.

### AI Font — Eligible purchase conversion

1. `Event name` exactly `view_item` AND `checkout_eligible=true` AND
   `checkout_mode=public` AND `payment_environment=live`.
2. `Event name` exactly `checkout_click`, within **7 days** of the previous step.
3. `Event name` exactly `begin_checkout`, within **30 minutes** of the previous step.
4. `Event name` exactly `purchase`, within **7 days** of the previous step.

Apply the same internal-user exclusion segment. These are **per-step** windows;
GA4 does not interpret them as one overall seven-day first-to-last limit. Existing
signed-in users enter at view_item, so they do not have to sign in again to count.
During private rollout the production purchase funnel is expected to be empty.
For QA, duplicate it with private/test eligibility and the `test_` server events,
without the internal-user exclusion. Never merge that QA funnel into business KPIs.

Suggested dashboard reads: login completion, eligible view→click, click→checkout,
checkout→paid, overall eligible view→paid; compare by source/medium and device.
Use database orders/provider reports for revenue, refunds, disputes and entitlement.
This iteration does not emit `refund` or subscription-renewal events, so GA4 purchase
revenue is not net revenue and is not an accounting reconciliation.

## Reliability, privacy and limits

- Confirmed checkout/payment timestamps are committed with the order. Cron derives
  events from those facts; queue insertion and Google requests are outside webhook
  and credit transactions. Optional context attachment has a bounded timeout.
- Unique event keys prevent repeated webhook/reconciliation work from re-queuing a
  purchase. GA4 also receives the transaction ID. Expired processing leases and
  network/5xx failures are held as `needs_review`; they are not blindly resent.
  Explicit 429 responses get bounded backoff (maximum eight attempts).
- Google receipt `2xx` means HTTP acceptance, **not proof of schema validation or
  reporting**. Queue `sent` has this same limited meaning. Events older than 72 hours
  are held. Delivery normally occurs at the next five-minute cron; browser/session
  attribution can still be incomplete, particularly after long delayed payments.
- No analytics delivery occurs without a valid browser GA identifier. Browser opt-out
  (`ga-disable-G-P3P9SJKZEG`) and `fontAnalyticsConsent=denied` suppress custom events
  and prevent attaching new order attribution. `setAnalyticsConsent()` is the bridge
  for a CMP's analytics consent callback; if adding/changing a CMP, wire this bridge
  before initialization and on changes. A surviving `_ga` cookie alone is not proof
  of consent. This change does not add a consent dialog or claim that a third-party
  CMP has already been wired to that callback.
- An order retains the attribution captured at checkout. A later browser-only opt-out
  cannot reach an already queued server event. Handle deletion/withdrawal requests
  by clearing that user's pending attribution and using the relevant GA deletion
  process where required. Do not set analytics consent to granted server-side to
  bypass a denial or manufacture replacement IDs when a blocker prevents collection.
- Ad blockers, consent choices, absent cookies, browser closure during login return,
  network failures and GA processing can cause gaps. Never promise 100% tracking.

Safe operations query (service role only; avoid selecting context):

```sql
select event_name, status, last_error, count(*)
from public.ai_font_analytics_outbox
 group by event_name, status, last_error;
```

Investigate `needs_review` before any manual replay; do not bulk reset uncertain
rows. Keep context out of logs and limit operational access to this table.

## Verification

Mock tests cover identifiers, redaction, login deduplication, logout, cookie/consent
and hostname gates, production/test event names, receipt statuses, timeouts, queue
idempotence, authorization, backoff and stale claims. They send no real emails,
payments, or GA events. After deployment, use the existing tester account and the QA
funnel to verify the live wiring. Only a real provider-confirmed order should create
a server purchase event. Do not insert fake paid orders into production.

If validating an MP payload externally, use Google's `/debug/mp/collect` validation
endpoint with the correct stream secret in a controlled server environment. It does
not populate reports. Do not expose the URL/secret in logs or paste it into chat.
Then independently verify collection and report visibility; a successful code test
or HTTP response alone does not establish live end-to-end analytics.

References: [Measurement Protocol sending](https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events),
[validation](https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events),
[User-ID](https://developers.google.com/analytics/devguides/collection/ga4/user-id),
[Funnel explorations](https://support.google.com/analytics/answer/9327974?hl=en).
