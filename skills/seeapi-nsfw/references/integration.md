# Implement and verify the gates

## Persist the check before calling SeeAPI

Adapt the existing database/job system rather than assuming one framework. A useful durable check record contains:

```text
owner/job ID + stage + item index
prompt hash or immutable asset ID/version + content hash
policy version + model/endpoint + exact options
exact serialized request body + stable idempotency key
provider task ID (nullable until a response arrives)
state: created/submitting/pending/passed/blocked/unavailable
attempt count + next attempt time + deadline
settled credits + minimal validated verdict/error
```

Use a uniqueness constraint for one logical check/version and an atomic worker lease. Create the record/key/body before submitting. The state machine must survive a lost POST response, a process crash, simultaneous requests, and duplicate notifications. Do not depend on an in-memory map or request lifetime for correctness.

On ambiguous POST timeout, retry the saved exact body and key with bounded backoff. On a saved task ID, query it instead of creating another check. If a signed URL must change after expiry, first reconcile the existing task; create an explicitly new version only when justified. A fresh URL is a changed request body, not a safe identical replay. Never leave old checks able to approve replacement bytes.

For queued/processing tasks, persist `next_attempt_at`, honor `Retry-After`, apply jitter and a maximum delay, and use the existing scheduler/queue. A short HTTP handler can return pending while a worker resumes the persisted task. Set an overall deadline and capped attempts; unresolved checks then remain unavailable/reviewable, without exposing assets or automatically regenerating them.

Retry only transient transport/5xx/429 failures within budget. Diagnose 400/401/402/403/404/409/422 before further submissions; 409 may mean a conflicting body or in-flight creation, so reconcile rather than minting a new key. Do not turn a failed lookup into a new paid generation. Keep enough task identity for support without storing secrets in logs.

## Protect moderation spending and generation credits

Authenticate/authorize according to the existing app; for an intentionally anonymous flow, use its established anonymous abuse controls. Check request/media limits, entitlement and generation balance before paying to moderate. Limit attempts per user/IP and concurrent jobs, including rejected/pending attempts. Enforce a separate server-owned moderation budget and the account's key-level limit; many small prompt checks can drain credits even when generation is blocked.

Reserve quota atomically so parallel requests cannot race past a cap. Cached approvals require exact content, media version, policy/options, and stage compatibility; do not cache “safe user” or approve a later changed prompt. Expire caches when policy/model changes require rechecking. Do not let clients choose model, threshold, category exclusions, asset owner, upstream base URL, or retry budget.

After all input checks pass, atomically reserve the user's generation credits and record a single generation submission intent/idempotency key. Ensure concurrent workers can submit it at most once logically. Reconcile uncertain upstream submissions before releasing credits or trying again. An already accepted generation can keep running after an HTTP timeout.

Handle a crash after recording/reserving that intent but before receiving a generator response according to the selected generator's capabilities. If its contract supports safe idempotent replay, resume the same saved key and body. An authoritative lookup that proves no task was accepted may justify submitting the same intent under that provider's contract; an unknown lookup, temporary 404, or missing local task ID does not. If neither replay nor authoritative reconciliation is available, hold for review instead of automatically repeating a potentially charged POST. Do not assume every generation provider supports SeeAPI-style idempotency.

Give blocked input, blocked output, unavailable moderation, and provider-generation failure explicit product outcomes. Apply the app's stated refund/review policy idempotently. If output is flagged after paid generation, generation cost already happened; never promise an upstream refund. Avoid unlimited free rerolls that repeatedly incur generation and moderation cost.

## Bind approval to the bytes delivered

Store source and generated files privately under immutable versions. Verify ownership and decoded format/size before sending media for review. Prefer application-controlled storage or allowlisted provider hosts; avoid fetching arbitrary user URLs without SSRF protections, redirect validation, byte/time limits, and private-network blocking.

Use a short-lived, least-privilege URL that SeeAPI can fetch for the expected processing window, or an accepted data URL for images. Do not expose storage credentials. Avoid a signed URL that expires before asynchronous processing begins. Disclose that sending a URL allows the provider to retrieve/copy the content; URL expiry is not deletion.

For input references, generation must receive the same approved immutable bytes. For output, the preview/download/public/share route must resolve the exact approved version. Preserve a content hash/version in both the check and delivery record. If you transform outputs (compositing, cropping, adding text, changing frames), moderate the final delivered result or establish an explicit reviewed equivalence policy. A thumbnail check alone does not approve a larger materially different original.

Every output in a batch needs a terminal decision before its own release. Avoid collapsing many detailed outputs into one unreadable contact sheet. If the product can deliver independent safe items from a partial batch, implement that decision explicitly per asset; otherwise keep the batch private until all required checks pass. Do not leak unapproved provider URLs in API JSON, email, analytics, Open Graph images, job lists, or previews while gating only the visible download button.

## Validate, do not trust browser flags

Use a bounded body parser and a runtime schema for provider responses. Verify the exact task ID/model/endpoint/provider and the persisted account/job/stage mapping. Require all decision-bearing fields with the correct boolean/number/array types; do not coerce strings, treat missing/null as false, or accept an unrelated completed task.

Check text's selected categories and applied threshold; image category arrays and expected strictness behavior; video's report schema, coverage, frame types, and counts. Use provider verdicts; inconsistent data is unresolved, not a chance to guess a clean outcome from scores. Unknown schema versions should trigger an integration review while existing assets stay private.

If callbacks are used, obtain and test the exact official signature/replay protocol against raw bytes, use constant-time verification where appropriate, enforce freshness, and make duplicate deliveries harmless. Map only to an expected persisted task. An authenticated GET of the saved inference ID can reconcile a notification. Never accept caller-submitted `approved`, `flagged`, or an arbitrary provider task ID as authority.

## Useful offline verification

Use mocked transport and a temporary database/storage so tests cannot incur charges or release real assets. The checks should prove observable outcomes:

| Scenario | Required observation |
|---|---|
| Flagged prompt | No reference check, generation call, or user generation debit |
| Clean prompt, flagged reference | No generation call; no unapproved input can be swapped in |
| Clean inputs, clean output | One generation intent/debit; only the approved immutable output is delivered |
| Output flagged | No preview/download/share leak; product credit policy applied at most once |
| Missing key, timeout, null/malformed result, unknown schema | Gate remains closed with pending/unavailable state |
| Wrong ID/model/provider/category/threshold | No approval despite `succeeded` and `flagged: false` |
| Lost POST response, restart, parallel handlers | Same persisted key/body; one logical task; state resumes |
| Crash after generation credit reservation, before known submission | Capability-specific recovery resumes the saved intent once or holds unknown outcomes for review |
| Duplicate callbacks/finalizers/refunds | No extra generation, release, debit, or refund |
| 429/Retry-After and prolonged processing | Durable scheduled retry; bounded attempts; no tight loop |
| Repeated rejected prompts | Moderation abuse limit/budget still enforced |
| Changed media or prompt after approval | Old decision cannot authorize new content |
| Video policy block/incomplete sampling | No release, including `succeeded` plus null output |
| Duplicate video frame numbers or nonempty labels with false frame flags | No approval from a misleading frame count or contradictory report |
| Video with audio or long input | Coverage limitation is explicit; no silent whole-video approval |

Use representative benign prompts and media to evaluate false positives and documented dimensions without introducing illegal material. Do not automatically run paid moderation/generation tests or deploy/publish as a consequence of invoking this skill. A credential-only read may verify configuration within scope; a live charged smoke test needs authorization covering the call and its bounded cost.

## Product copy and handoff

Tell users what is sent to SeeAPI (prompt, references, generated output as applicable), why, and where privacy/deletion information lives. Avoid claiming checks are local, ephemeral, zero retention, or comprehensive. Distinguish a policy block from temporary review failure, and retain a sensible appeal/support path when the app needs one.

Review environment examples, server secret wiring, database migrations, generated docs and privacy copy alongside code. In a repository that generates `/llms.txt`, maintain its source instead of writing a second root file. Handoff should list remaining configuration/activation steps and clearly distinguish mocked/offline validation from live end-to-end verification.
