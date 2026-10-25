# SeeAPI safety checks for AI fonts

New font generation requires the server-only `SEEAPI_API_KEY` in `.env.local`
for local development and a Worker runtime secret in production. Never prefix it
with `NEXT_PUBLIC_`. Authentication and previously delivered downloads do not
require SeeAPI. A missing key disables new generation and checkout rather than
silently bypassing screening.

## Rollout

1. Pause new generation and scheduled font reconciliation.
2. Apply the existing font/credit/account/billing migrations in order, followed by
   `supabase/migrations/202610200001_font_moderation.sql`.
3. Deploy this application version and configure the SeeAPI runtime secret.
4. Verify checks, the private `ai-font-review` bucket and the scheduler before
   resuming generation. No new public storage policies are required.

The migration preserves already delivered fonts as legacy deliveries. New job
reservations require a matching passed prompt check. Every unfinished delivery,
including a pre-migration in-flight font, needs all output pages approved before
completion. Old application code cannot silently deliver new unreviewed files.

## Pipeline and recovery

- The server validates the request, account, available credits, billing holds and
  active jobs before a paid prompt check. Admission is serialized per wallet,
  limited to 5 new descriptions/minute and 20/hour/user. Replaying the same
  request uses its existing check. Changed input under the same ID is rejected.
- `text-nsfw-filter` / `text-moderation` checks all seven supported categories at
  threshold 0.3. A pending, malformed or unavailable result never starts Mixfont
  or reserves user generation credits. A client retries its saved request briefly;
  if still pending it can resume with the same ID later.
- After approval the normal atomic credit reservation and one-owner Mixfont
  submission run. Ambiguous Mixfont submissions still require review rather
  than an unsafe automatic second submission.
- Completed TTF bytes undergo structural/coverage validation. Static monochrome
  outlines are rendered server-side, including visible unencoded glyphs and
  `.notdef`, into 1024×1024 PNG pages (16 glyphs/page, 256px cells). More than
  128 visible glyphs, alternate bitmap/SVG/color/variable content, or rendering
  complexity overflow is rejected rather than partially reviewed.
- The exact TTF and all specimen pages are saved to the private review bucket
  before binding their font SHA-256 and page count to the job. An immutable
  `staged.ttf` under the logical job's private namespace is saved first, so a
  partial PNG upload or failed bind resumes the same font even after Mixfont's
  temporary URL expires. `nsfw-filter-2` /
  `image-moderation` reviews every page at threshold 0.5 with
  `strict_special_care: true`. One provider operation per job/invocation bounds
  latency; authenticated refresh and five-minute cron continue the pages.
- The database retains check identity, input/asset hashes, provider task ID,
  lease, attempts and actual reported credits. A timeout reuses the same stored
  idempotency key/body; a known task is polled, not recreated. Pending checks wait
  at least 3 seconds, transient failures at least a minute or the bounded
  `Retry-After` delay. Twenty attempts or 24 hours end an unresolved check as
  failed. Explicitly rejected creation requests stop instead of automatically resubmitting.
  The studio honors the persisted retry delay and distinguishes checking from waiting
  to retry; it does not show Ready while an attempt is in progress. No uncertain or
  malformed verdict counts as approval. See the [Chinese troubleshooting guide](ai-font-generation.md).
- Only after every bound page passes are the original TTF bytes copied to the
  delivered bucket and the job marked successful. The final hash is rechecked;
  the SQL function and download API both enforce the release gate. A rejected or
  failed output restores the original reserved customer credit cost once.
- Private review objects are removed on a best-effort basis after completion or
  rejection; interrupted staging and failed cleanup can leave private objects
  requiring operator cleanup. The audit records remain. App refunds do not
  imply SeeAPI/Mixfont refunds. Never log raw prompts, images or authorization.

The input and output classifiers have different scopes. Image checks assess
sexual content; they do not cover every hateful symbol or audience suitability.
Stylized font specimens are not a measured accuracy benchmark. Tune decisions
using representative lawful samples and review false positives/negatives before
claiming broader coverage. There is no input-image or video generation feature
in this font product; those workflows are covered by the reusable skill instead.

## Data and API references

Descriptions and rendered glyph specimens go to SeeAPI; the raw TTF does not.
SeeAPI currently gives stored input files, task data and moderation results no
scheduled automatic expiry; logs are retained 60 days. A data URL does not
promise zero retention. Deletion requires a support request with task references.
Public AI/privacy disclosures describe this additional processing.

- [Text API](https://www.seeapi.com/docs/text-nsfw-filter/text-moderation/)
- [Image 2.0 API](https://www.seeapi.com/docs/nsfw-filter-2/image-moderation/)
- [Data handling](https://www.seeapi.com/docs/data-handling/)
- [Reusable skill](../skills/seeapi-nsfw/SKILL.md)

Do not hardcode API prices: the image page conflicts between its header and
response description. On 2026-10-20 a benign live text check reported 0.022
credits and one official font-specimen image reported 0.01 credits. These are
individual observations, not fixed future prices or a complete production test.

## Verification

Run `npm run lint`, `npx tsc --noEmit`, `npm run test:ai-font`,
`npm run test:generators`, `npm run test:cloudflare`, `npm run build:cloudflare`,
then `npm run test:ai-font:browser` sequentially (both builds use `.next`).
The browser suite builds its own unconfigured environment to isolate local
credentials. SQL tests apply the real migration in PGlite; provider/integration
tests mock HTTP. They do not operate on the configured remote database.

Live moderation smoke tests must use harmless, authorized input and stable
idempotency keys, record settled usage without exposing the key, and use bounded
polling. A live SeeAPI result does not prove that Supabase migrations or
Cloudflare production secrets have been deployed. A full paid Mixfont generation
is separate from these checks.
