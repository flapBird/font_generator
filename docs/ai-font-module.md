# AI font module

The first version is isolated at `/ai-font-generator`. Existing generators,
shared navigation, global styles, root layout and advertising allowlist are
unchanged. The new page is intentionally not in the sitemap/navigation and has
`noindex` while being reviewed. It uses existing bundled fonts for free style
references; no generation request is made by previewing or signing in.

## Local preview and configuration

Run `npm run dev` and open `/ai-font-generator`. Without credentials, sample
previews work and purchasing is disabled. There is no simulated successful
payment, fake login, or production demo-credit bypass.

Copy the entries from `docs/ai-font.env.example` into your untracked `.env.local`.
Restart Next after changing them. Never send service secrets to the browser.

1. Create a Supabase project. Apply
   `supabase/migrations/202610030001_ai_fonts.sql` with the SQL editor or Supabase
   CLI. It creates private tables and the private `ai-fonts` bucket. All ledger
   writes require the service role; anonymous and authenticated client roles
   have no direct access.
2. In Google Cloud create a web OAuth client. Configure the redirect URI shown
   by Supabase (`https://<project>.supabase.co/auth/v1/callback`). Configure the
   consent screen and test users as needed. Enable the Google provider in
   Supabase with that client ID and secret. These Google secrets live in
   Supabase, not in this repository.
3. Set Supabase Auth Site URL and allow the exact application callback URLs:
   `http://localhost:3000/ai-font-generator/auth/callback` for local development
   and `https://font-generators.org/ai-font-generator/auth/callback` for the site.
   Set `AI_FONT_APP_URL` to the actual application origin. Do not use wildcard
   production redirect URLs. Supabase handles Google OAuth/PKCE; route handlers
   validate users with `getUser()` and refresh cookies. No root auth provider,
   global proxy or login requirement is added to free tools.
4. Configure a Mixfont API key and prepaid API balance. This version supports
   prompt-to-standard-English-TTF only (72 glyphs). API keys stay server-side.
5. Create a PayPal Sandbox REST application. Use its client ID and secret,
   then register the public HTTPS webhook URL:
   `/api/ai-font/webhooks/paypal`. Local webhook testing requires a public HTTPS
   tunnel, with the same origin set as `AI_FONT_APP_URL` and allowed in Supabase.
   Subscribe to `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`,
   `PAYMENT.CAPTURE.REFUNDED`, and `PAYMENT.CAPTURE.REVERSED`. Set that webhook's
   ID as `PAYPAL_WEBHOOK_ID`. Use a Sandbox buyer account distinct from the
   merchant. Real and Sandbox credentials/webhooks must not be mixed.
6. Schedule an authenticated GET to `/api/ai-font/reconcile` every five minutes,
   with `Authorization: Bearer <AI_FONT_CRON_SECRET>`. Use your deployment
   platform's scheduler. If using Vercel Cron, configure the same value as
   Vercel's `CRON_SECRET` and add this path/schedule in deployment configuration
   (plan-dependent scheduling limits apply). This repository does not change
   your deployment configuration automatically. Verify it executes before
   enabling purchases. It saves completed fonts even after users close the tab;
   Mixfont's temporary output expires after 24 hours. The worker handles ten
   active jobs per pass; monitor backlog and increase worker capacity before
   allowing higher volume. Alert on nonzero `errors`, old active jobs and
   `needs_review` jobs.

Checkout remains disabled unless all required service variables are present.
Presence is not a connectivity check: validate database migration, Google auth,
PayPal webhook delivery, generation and scheduled storage retrieval in Sandbox
before switching `PAYPAL_ENVIRONMENT=live` and supplying live credentials.
Sandbox still calls the real Mixfont API when a test purchase is used to generate.

## Payment architecture and ownership

`lib/ai-font/payments/types.ts` defines `PaymentProvider` (`createCheckout`,
`complete`, `verifyWebhook`). PayPal owns provider-specific HTTP/auth/signature
verification and normalizes receipts/events. The service layer settles an order
through a database transaction; generation code does not know about PayPal.
To add another method, implement this interface, register it in `payments/index.ts`,
add its webhook route and expose its choice in the checkout UI/API validation.
All providers must verify the stored order ID, amount, currency and completed
payment before returning a receipt. They must support stable request IDs and
refund/reversal reconciliation.

Prices and credits are set on the server from `lib/ai-font/catalog.ts`, never
accepted from the browser. Orders snapshot the purchase amount and credits so
later price changes cannot change an existing purchase. If changing the initial
pack, update its purchase policy copy too. Only verified payment completion
grants credits. A PayPal redirect, query parameter or client success state cannot
grant credits. Creation and capture use stable PayPal request IDs; callback and
browser return races settle the same order only once. POST/PATCH browser routes
require the configured same-origin header. Webhooks require PayPal signature
verification and do not use browser sessions.

Refunds/reversals revoke a whole pack exactly once; negative balances block
further generation and new checkout until support resolves them. Partial
refunds are conservatively treated as a pack revocation, with manual review as
stated in the policy. This version has no self-service refund UI. A refund before
payment completion marks the order revoked, so a later completion cannot grant
credits. Downloads from already-delivered jobs remain available.

## Generation reliability

Client request UUIDs and wallet row locks prevent duplicate credit debits and
overspending. One active job per account is allowed. A conditional claim permits
only one worker to submit a job to Mixfont. Confirmed rejection/failure restores
one generation atomically. File persistence must finish before a job is marked
successful. The API download URL is host-allowlisted, redirects are rejected,
file size is bounded, and a TTF header is checked. Stored files are private;
every preview/download checks ownership and receives a 60-second signed URL.

Mixfont does not document idempotent job creation. A timeout after submission
could have created a chargeable job, so the app deliberately does not retry the
creation request. It puts that request in `needs_review` and blocks another
generation until resolved. A process terminated during submission is moved to
review after five minutes. This is a recoverable support case, not a silent
credit refund followed by a duplicate API charge.

Support recovery (use service-role tools/SQL editor, verify the upstream job first):

- If the upstream job exists, attach its exact ID to the user's existing job,
  set status to `processing`, set `updated_at=now()`, then run reconciliation.
- If the provider confirms no job was accepted, or confirms unrecoverable
  failure, call `select public.ai_font_finish_job('<job-uuid>', 'failed');`.
  Repeated calls restore only one credit.
- If a completed font cannot be persisted, resolve storage credentials/quota
  and rerun reconciliation before the upstream 24-hour expiry. If that window
  was missed, review and restore the credit with the same function; do not
  automatically create another paid upstream job.

Keep backups of the database and storage; monitor the private font bucket,
provider errors, pending orders, wallet adjustments and oldest unfinished job.
Account deletion is support-managed in this version; remove private files and
personal data consistently while retaining required transaction records.

## Verification

```
npm run lint
npm run test:generators
npm run test:ai-font
npm run build
npx playwright install chromium
npm run test:ai-font:browser
```

Ledger tests run the actual migration/functions in embedded PostgreSQL (PGlite),
including callback replay, repeat generation requests, single submission claims,
failure restoration, refund ordering and browser-role permission denial. Provider
tests mock external HTTP; they do not make payments or paid generation calls.
Browser checks cover free previews, unconfigured checkout, route authorization,
representative existing tools, and the purchase/generation UI with mocked account
responses. You can set `PLAYWRIGHT_EXECUTABLE_PATH` to use an existing Chromium
binary instead of downloading one. Full Google OAuth and PayPal Sandbox/Mixfont
delivery must also be verified with configured accounts; local automated tests
are not evidence of real provider integration success.

Official references:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://developer.paypal.com/api/orders/v2
- https://developer.paypal.com/api/webhooks/v1
- https://www.mixfont.com/docs/guides/font-generation
- https://www.mixfont.com/license
