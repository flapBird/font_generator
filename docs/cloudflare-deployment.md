# Cloudflare Workers deployment

This project deploys the existing public Next.js site to **Cloudflare Workers**
using `@opennextjs/cloudflare`. Choose Workers when importing the repository in
the dashboard. This deployment contains the free browser-based generators and
guides; no account, payment, AI generation or scheduled job setup is required.

Use Node.js 22+ (`nvm use`) and `npm ci` with the committed lockfile. The included
Next.js 16.3.8 is the version used for this adaptation.

## Local build and preview

```bash
nvm use
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

`npm run preview` combines the build and preview steps. Open the URL printed by
Wrangler, normally `http://localhost:8787`. This uses the Workers runtime;
`npm run dev` remains the regular Next.js development workflow.

The generated `.open-next` and `.wrangler` directories are ignored by Git.
The Worker entry is `.open-next/worker.js` and static assets are under
`.open-next/assets`. `nodejs_compat` enables the adapter's Node.js compatibility.

`npm run cf-typegen` generates `cloudflare-env.d.ts`, which is ignored and
excluded from the Next.js TypeScript project. Optional `.dev.vars` settings can
be copied from `.dev.vars.example`. Environment files are ignored; do not build
production artifacts with private or development-only environment values.

## Deploy from the CLI

```bash
npx wrangler login
npm run deploy
```

These commands publish the site. The default Worker name is `font-generator`.
If changing it, update both `name` and `services[0].service` in `wrangler.jsonc`;
the self service binding must target the same Worker.

`keep_vars: true` preserves dashboard-managed runtime variables on subsequent
CLI deployments. The public site needs no service credentials.

## Deploy through Workers Builds

Connect the Git repository under **Workers & Pages → Create → Import a repository**
and choose a Worker with these settings:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Worker name | `font-generator` |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Build Node version | `NODE_VERSION=22` |

The separate commands avoid building twice. Install dev dependencies too, since
Wrangler is a dev dependency. Do not use `next start`, a Pages output-directory
upload or plain `wrangler deploy` without first running the OpenNext build.

## Caching and custom domains

Prebuilt public content uses Workers Static Assets as the read-only incremental
cache with cache interception. The current site does not use ISR or on-demand
revalidation, so no R2, KV or Durable Object provisioning is required. If those
features are added, configure a writable cache and revalidation queue first.

`public/_headers` gives hashed `/_next/static/*` files a one-year immutable cache.
Public files such as `ads.txt` retain normal revalidation.

Add `font-generators.org` under **Settings → Domains & Routes → Custom Domains**
and configure `www.font-generators.org` to redirect to the canonical domain if
used. Canonicals, sitemap and production analytics target `font-generators.org`.
Review those values and advertising configuration before changing domains.

Ordinary Node.js hosting remains available through `npm run build` and
`npm run start`. Neither `.next` nor `.open-next/assets` alone is a complete
deployment; this project does not enable `output: 'export'`.

## Verification

```bash
npm run lint
npm run test:generators
npx tsc --noEmit
npm run build:cloudflare
npm run test:cloudflare:browser
npx wrangler deploy --dry-run --outdir /tmp/font-generator-worker-dry-run
```

The Workers HTTP suite checks permanent legacy redirects, metadata endpoints
including `/llms.txt`, public assets, unknown routes and immutable asset headers.
It also verifies the homepage is available and account/AI routes are absent.
The suite uses HTTP requests and does not require a browser installation.

References:
- [OpenNext setup](https://opennext.js.org/cloudflare/get-started)
- [OpenNext caching](https://opennext.js.org/cloudflare/caching)
- [OpenNext environment variables](https://opennext.js.org/cloudflare/howtos/env-vars)
- [Cloudflare Next.js deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
