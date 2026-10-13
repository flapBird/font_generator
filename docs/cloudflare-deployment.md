# Cloudflare Workers deployment

This project deploys the existing Next.js application to **Cloudflare Workers**
using `@opennextjs/cloudflare`. Choose Workers when importing the repository in
the dashboard. Login, account APIs, payment callbacks and AI font jobs need a
server runtime, so a static Cloudflare Pages upload cannot run the full site.

The adapter requires the included Next.js 16.3.8 or a compatible newer release.
Node.js 22+ is required for Wrangler. Use `npm ci` with the committed lockfile.
This setup retains Next.js rather than migrating to the separate vinext beta
framework. Cloudflare currently recommends vinext for new applications; this
repository uses OpenNext to adapt the existing application with less change.

## Local build and preview

```bash
nvm use
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

`npm run preview` combines the last two steps. Open the URL printed by Wrangler,
normally `http://localhost:8787`. This runs in workerd rather than `next start`.
`npm run dev` remains the regular Next.js development workflow.

The generated `.open-next` directory and Wrangler's `.wrangler` directory are
ignored by Git. `cloudflare/worker.js` wraps the generated HTTP handler and adds
the AI font scheduled handler. `nodejs_compat` supports the existing Buffer and
Node crypto usage; do not change these route handlers to Next.js's edge runtime.

`npm run cf-typegen` generates binding/runtime declarations for Worker tooling.
The generated `cloudflare-env.d.ts` is ignored and excluded from the Next.js
TypeScript project, keeping workerd globals separate from browser/Node globals.

Use `.env.local` for local application variables, following
`docs/ai-font.env.example`. Optionally copy `.dev.vars.example` to `.dev.vars`
to select development env files in the adapter. To exercise the cron handler
locally, also place its required variables in `.dev.vars`, since a scheduled
handler reads Worker bindings directly. Both files are ignored. Never build a
production artifact from local files containing development credentials: the
adapter includes Next.js env-file values in its output.

## Deploy from the CLI

```bash
npx wrangler login
npm run deploy
```

The default Worker name is `font-generator`. If changing it, update both `name`
and `services[0].service` in `wrangler.jsonc`; the self binding must target the
same Worker. CLI deploy requires a Cloudflare account with Workers enabled.
These commands publish the application; they are separate from local preview.

For local Waffo checkout testing, keep `npm run dev` running on port 3000 and
expose that port through an HTTPS tunnel in another terminal
(for example, `ngrok http 3000`) and set `AI_FONT_APP_URL` in `.env.local` to
that HTTPS origin. The Next.js development configuration uses its exact hostname
as an `allowedDevOrigins` entry so tunnel requests can load development resources
and connect to HMR. Restart `npm run dev` after changing the origin, add
`<tunnel-origin>/ai-font-generator/auth/callback` to Supabase's redirect allowlist,
and register `<tunnel-origin>/api/ai-font/webhooks/waffo` as a test webhook.
Open the app and sign in through the tunnel URL. If the tunnel hostname changes,
update those settings together. The tunnel only forwards HTTP; it does not run
the Cloudflare scheduled handler locally.

If the purchase button stays on `Loading…` and Google sign-in does nothing,
check whether the browser's `/_next/` scripts return `403 Unauthorized`. A changed
tunnel hostname can leave `AI_FONT_APP_URL` and the development resource allowlist
pointing at the previous tunnel: the server-rendered page still appears, but
client-side actions cannot initialize. Copy the current forwarding origin from
ngrok's local dashboard at `http://127.0.0.1:4040` into `.env.local`, restart the
Next.js development server, then reload the page through that same HTTPS origin.
Supabase's redirect allowlist and Waffo's test webhook must use the current
tunnel too. Sessions are separate for localhost and each tunnel hostname; sign
in again after changing hosts.

If Google sign-in runs but returns to the production homepage instead of the
tunnel callback, check Supabase's **Authentication → URL Configuration → Redirect
URLs**. The requested `redirectTo` must match an allowed URL. Add the current
`<tunnel-origin>/ai-font-generator/auth/callback` there and save, then start a new
sign-in from the tunnel. The existing production Site URL remains the default;
adding a development callback belongs in Redirect URLs. A login that returned to
the production homepage cannot establish the local session, because the tunnel's
callback never exchanged its code. See Supabase's
[redirect troubleshooting](https://supabase.com/docs/guides/troubleshooting/why-am-i-being-redirected-to-the-wrong-url-when-using-auth-redirectto-option-_vqIeO).

After the first deployment, configure runtime variables/secrets in the Worker
dashboard, then deploy again if public build values changed. `keep_vars: true`
preserves dashboard-managed ordinary variables on subsequent CLI deployments.
Secrets are preserved by Wrangler. No secret values are stored in the repository.

## Deploy through Workers Builds

Connect the Git repository under **Workers & Pages → Create → Import a repository**
and choose a Worker, with these settings:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Worker name | `font-generator` |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Build Node version | `NODE_VERSION=22` |

The separate commands avoid building twice. Do not use `next start`, a Pages
output-directory upload, or plain `wrangler deploy` without first running the
OpenNext build. Cloudflare's normal dependency-install step should install dev
dependencies too, since Wrangler is a dev dependency.

## Environment variables and secrets

The existing free generators need no service credentials. Enable the optional
AI module using the following values, after applying its Supabase migration.
Build variables and runtime variables are separate settings in Cloudflare.

| Variable | Build variables and secrets | Worker runtime variables and secrets |
| --- | --- | --- |
| `NEXT_PUBLIC_GA_ID` | Optional GA override | Not needed |
| `NEXT_PUBLIC_SUPABASE_URL` | Required for client auth | Required for server auth and cron |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Required for client auth | Required for server auth |
| `AI_FONT_APP_URL` | Not needed | Actual HTTPS origin, e.g. `https://font-generators.org` |
| `AI_FONT_PAYMENT_PROVIDER` | Not needed | `waffo` or `paypal` |
| `WAFFO_ENVIRONMENT` | Not needed | `test` initially; `prod` after verification |
| `WAFFO_MERCHANT_ID`, `WAFFO_STORE_ID`, `WAFFO_PRODUCT_ID` | Not needed | Waffo merchant, expected store and one-time product IDs |
| `WAFFO_PRIVATE_KEY` | Not needed | Secret: merchant RSA private key (PEM) |
| `WAFFO_WEBHOOK_PUBLIC_KEY` | Not needed | Waffo webhook verification public key (PEM) |
| `PAYPAL_ENVIRONMENT` | Not needed | `sandbox` initially; `live` only after verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Not needed | Secret |
| `MIXFONT_API_KEY` | Not needed | Secret |
| `PAYPAL_CLIENT_ID` | Not needed | Server variable or secret |
| `PAYPAL_CLIENT_SECRET` | Not needed | Secret |
| `PAYPAL_WEBHOOK_ID` | Not needed | Server variable or secret |
| `AI_FONT_CRON_SECRET` | Not needed | Long random secret |

Only `NEXT_PUBLIC_*` values are browser-visible and compiled into client assets.
Set them **before building**, including a local CLI build in `.env.local` if
needed. Changing them requires a new build and deploy. A runtime-only setting
cannot enable the browser's Supabase client. Server secrets belong in **Settings
→ Variables and Secrets**, not in public build variables. Login and studio pages
render dynamically so server service availability follows runtime configuration.

See [AI font setup](ai-font-module.md) for Google OAuth, Waffo/PayPal and Mixfont. Only the selected payment provider needs credentials. Allow
the exact Supabase callback `https://<your-domain>/ai-font-generator/auth/callback`,
register the selected provider webhook at
`https://<your-domain>/api/ai-font/webhooks/waffo` or
`https://<your-domain>/api/ai-font/webhooks/paypal`, and
ensure both use the same origin as `AI_FONT_APP_URL`. Preview origins need their
own explicit callback allowlist and Sandbox settings if testing auth there.

## Scheduled font reconciliation

`wrangler.jsonc` registers `*/5 * * * *`. The custom Worker uses
`WORKER_SELF_REFERENCE` to issue an authenticated GET to the existing
`/api/ai-font/reconcile` route, so completed fonts persist when users close the
browser. It reuses the existing database job claims and does not add a second
generation/payment implementation. No external scheduler is necessary on Workers.

Reconciliation handles up to ten jobs sequentially per pass, avoiding simultaneous
large TTF buffers in Workers' 128 MB isolate memory. The cron's internal request
has a ten-minute timeout within Cloudflare's fifteen-minute scheduled wall limit.
Monitor batch duration and backlog as volume grows. This bounds memory within a
batch; it is not a guarantee for arbitrary concurrent traffic or provider load.

Without the app URL, cron secret, Supabase URL/service key or Mixfont key, the
scheduled handler skips work. Once configured, HTTP errors, transport failures
and nonzero reconciliation errors fail the scheduled event and appear in Worker
observability. Monitor Cron execution and old `processing`/`needs_review` jobs
before enabling purchases. Do not keep another scheduler running unnecessarily.

For local cron testing, run
`npm run preview:cloudflare -- --test-scheduled` and request
`http://localhost:8787/__scheduled?cron=*/5%20*%20*%20*%20*`.
With real credentials this can submit reserved paid generation jobs; use a
dedicated test database and Sandbox configuration.

## Caching and custom domains

Prebuilt public content uses Workers Static Assets as the read-only incremental
cache with cache interception. The current site does not use ISR, `revalidateTag`
or `revalidatePath`, so this avoids extra storage bindings. If those features are
added, switch to a writable cache and configure the adapter's revalidation queue
as documented by OpenNext. Login and AI pages are dynamic; account/payment
responses retain their existing `no-store` handling.

`public/_headers` gives hashed `/_next/static/*` files a one-year immutable cache.
Public files such as `ads.txt` retain normal revalidation. Do not add a blanket
Cloudflare “Cache Everything” rule to auth or API routes.

In the Worker dashboard add `font-generators.org` under **Settings → Domains &
Routes → Custom Domains**, and configure `www.font-generators.org` to redirect to
the canonical domain if used. Canonicals, sitemap and production analytics
currently target `font-generators.org`. Changing domains requires reviewing those
values and the existing advertising configuration.

## Verification

```bash
npm run lint
npm run test:generators
npm run test:ai-font
npm run test:cloudflare
npm run build:cloudflare
# Install Chromium if not already available:
npx playwright install chromium
npm run test:cloudflare:browser
```

The Workers browser suite reuses the existing UI/auth tests and additionally
checks permanent legacy redirects, metadata endpoints, public assets, unknown
routes and immutable asset headers. It expects a build with AI services absent
and uses mocked account/checkout responses for the paid UI. Scheduled unit tests
use fake service bindings and never call paid providers.

Local verification does not prove live Google/PayPal/Mixfont connectivity. Check
those separately using the configured Sandbox accounts after deployment.

The dependency audit still reports existing Tailwind 3/build-tool advisories.
Their affected versions are unchanged by this adaptation; fixing all of them
requires a separate dependency review, including a possible Tailwind migration.

References:
- [OpenNext setup](https://opennext.js.org/cloudflare/get-started)
- [OpenNext static-assets caching](https://opennext.js.org/cloudflare/caching)
- [OpenNext environment variables](https://opennext.js.org/cloudflare/howtos/env-vars)
- [OpenNext custom Worker handlers](https://opennext.js.org/cloudflare/howtos/custom-worker)
- [Cloudflare Next.js deployment paths](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Workers resource limits](https://developers.cloudflare.com/workers/platform/limits/)
