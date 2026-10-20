---
name: seeapi-nsfw
description: Integrate or repair SeeAPI NSFW moderation for image and video generation apps, including prompt checks, input-media checks, and gated output delivery. Use when adding SeeAPI moderation or reviewing its generation gates; not for unrelated classifiers or general legal compliance audits.
---

# SeeAPI NSFW moderation

Add moderation to the existing product and generation provider. Keep secrets and approval decisions on the server. Read [the API contract](references/api-contract.md) for the selected media type, and [integration and verification](references/integration.md) when implementing state, billing, delivery, or tests. Recheck the linked official documentation before relying on limits, prices, or a changed response schema.

## Establish the actual flow

Locate generation entry points, trusted prompt construction, uploads, billing/credits, task storage, retries/webhooks, and every preview/download/publication route. Identify the actual media types and the existing user-access model; do not add an unrelated login system or change generation providers.

Use the following order for applicable stages:

1. Validate the request, authorization/entitlement, media limits, rate limits, and moderation budget before any paid external call.
2. Moderate the text that will actually drive generation. A flagged or unresolved result stops the flow before input-media moderation or generation spending.
3. Moderate every supplied reference image/video. Skip absent media. Any blocked or unresolved item stops generation.
4. Atomically reserve generation credits and submit generation once all required input checks pass.
5. Keep generated assets private while moderating the actual outputs. Release previews, downloads, sharing, and public listings only when every required output passes.

A clean prompt is not a clean output. `succeeded` is execution status; it is not approval. Model failures, missing configuration, timeouts, null/malformed results, missing categories, incomplete video sampling, and unexpected task identity must hold the gate closed. Distinguish a flagged outcome from an unavailable check so transient errors do not falsely accuse users or trigger uncontrolled regeneration.

## Preserve these invariants

- Persist each logical check, policy/options, exact request body, stable idempotency key, and eventual provider task ID. Reuse the same key and body after an ambiguous submission; resume polling after a restart. Do not let a browser retry create duplicate paid work.
- Validate response identity and type, not just `flagged === false`. Bind approval to the requesting account/job, stage, exact prompt or immutable asset version/hash, model, selected categories, and policy version. Changed bytes or settings invalidate approval.
- Use bounded, durable retries with backoff and `Retry-After`; reconcile unknown outcomes rather than submitting fresh tasks. Treat verified webhooks as a signal for the expected persisted task. Use authenticated polling if the exact signature protocol is unavailable; never invent one.
- Make finalization, generation submission, credit debit/refund, and delivery transitions atomic/idempotent. Do not refund or restart an accepted generation merely because an HTTP request or status lookup timed out.
- Cap moderation spending itself with per-user/IP limits, concurrency limits, cached approvals bound to exact inputs, and an application/key budget. Prompt moderation before paid generation still costs money and can be abused independently.
- Disclose submission of prompts and applicable media to SeeAPI. SeeAPI's retention is not automatic deletion; expiring a signed URL does not delete a retrieved copy. Keep raw content, credentials, and signed URLs out of logs.

## Match the product's policy

Use server-owned thresholds/categories and record them. Keep `strict_special_care: true` unless the user explicitly chooses a different policy. Avoid keyword-only screening and do not relabel an omitted category as checked. Text moderation covers more categories than image/video NSFW detection; add another mechanism only when the product requires those additional checks.

Image/video checks are probabilistic. Video checks inspect sampled visual frames, not audio or every frame. Do not label outputs “guaranteed safe” or “fully reviewed” based on these APIs. Preserve the generation provider's own safeguards.

## Complete the integration

Implement configuration and useful blocked/pending/unavailable UI states; provide a retry/review route consistent with the app. Update the app's public processing/privacy descriptions and generated API/`llms.txt` documentation when relevant. Verify gates and recovery with mocked transport and realistic fixtures; no paid live calls, top-ups, production deployment, or publication unless covered by the user's scope.

Report what is implemented, tests actually run, required configuration/migrations, any unverified live behavior, and real coverage limits. A missing API key is an activation requirement, not permission to install a silent bypass.
