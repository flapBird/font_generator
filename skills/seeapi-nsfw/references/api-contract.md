# SeeAPI moderation contracts

Reference snapshot checked against official docs on 2026-10-20. Revisit the linked page for the selected endpoint before implementation. These are API facts and implementation checks, not a pricing guarantee.

## Shared transport

Create with `POST https://api.seeapi.com/v1/inferences`. Query with `GET https://api.seeapi.com/v1/inferences/{id}` using the complete, URL-encoded returned ID and the same environment/key. These are inference tasks, not `/v1/generations` tasks. Responses are top-level inference objects, not `{ generation: ... }`.

Send server-side `Authorization: Bearer <API key>` and JSON content type. Creation requires `Idempotency-Key` of at most 255 characters. Save the key and exact serialized body before sending. Reuse both for retries of that same request; a different body needs a separately versioned logical check. Do not rotate keys to escape a pending task.

Envelope fields to validate on creation and query:

```text
id: nonempty string (must match saved ID on queries/replays)
object: "inference"
provider: "seeapi"
model, endpoint: exact requested pair below
status: queued | processing | succeeded | failed | canceled | refunded | expired
result: null or { type: "json", data: endpoint-specific object }
error: null or { code: string, message: string }
```

Accept a pass only after the expected `succeeded` task has `error: null` and a fully valid result with `data.flagged: false`. `queued`/`processing` remain pending; other terminal states do not approve anything. HTTP 200 alone is not completion; HTTP 202 alone is not approval. Optional billing fields do not prove approval.

## Text

[Official text moderation contract](https://www.seeapi.com/docs/text-nsfw-filter/text-moderation/)

```json
{
  "model": "text-nsfw-filter",
  "endpoint": "text-moderation",
  "provider": "seeapi",
  "input": {
    "text": "A watercolor landscape with a small lighthouse",
    "threshold": 0.3,
    "categories": ["sexual_explicit", "sexual_suggestive", "sexual_minors", "violence", "hate", "harassment", "self_harm"]
  }
}
```

`input.text` contains the content to assess, at most 20,000 characters; it is not a request for the classifier to generate content. `threshold` accepts 0.01–0.99, default 0.3; lower is stricter. Omitted `categories` means all seven above; `[]` is invalid. A successful creation may return a completed HTTP 200 result; still support queued/processing queries.

Completed `result.data`:

```text
flagged: boolean
threshold: finite number, equal to the requested/applied policy
categories: object with each requested category → { score: finite number, flagged: boolean }
```

Require all requested category entries. An omitted category was not checked. Treat contradictory flags or a mismatched applied threshold as an unresolved contract/policy mismatch; do not repair a response by recalculating verdicts from scores. The docs' example responses are illustrative and may use options different from a nearby request example.

`consumed_credits`, `input_tokens`, and `output_tokens` belong at envelope level. Record actual reported usage; characters are not tokens. Do not turn sample usage into a fixed request cost.

## Image 2.0

[Official image moderation contract](https://www.seeapi.com/docs/nsfw-filter-2/image-moderation/)

```json
{
  "model": "nsfw-filter-2",
  "endpoint": "image-moderation",
  "provider": "seeapi",
  "input": {
    "image_url": "https://assets.example.com/immutable-version/image.png",
    "threshold": 0.5,
    "strict_special_care": true
  }
}
```

One static PNG/JPEG as an accessible HTTPS URL or a `data:image/png;base64,...` / `data:image/jpeg;base64,...` string. Not an array, bare base64, GIF, WebP, or arbitrary binary file.

All hard limits apply together: decoded file ≤16 MiB (16,777,216 bytes), each dimension 256–8192 px, and 78,400–32,000,000 total pixels. Recommended processing range: each dimension 256–1568 px and 78,400–2,458,624 total pixels. In particular, 256×256 fails the total-pixel minimum. Validate decoded dimensions/format server-side; bound decompression and request body size.

Threshold: finite 0.01–0.99, default 0.5. `strict_special_care` defaults true. New tasks normally return HTTP 202 with `result: null`; poll the inference endpoint. Terminal idempotent replay can return HTTP 200.

Completed `result.data`:

```text
flagged: boolean
categories.nsfw: array of "nudity" | "sexual_activity" | "sexual_suggestive"
categories.special_care: array of "sexual_minors"
```

Require both arrays, valid label types, and consistency with the overall flag and saved strictness. Unknown/malformed labels require contract review. This checks sexual content, not a general hate/violence policy. A response has no documented applied-threshold echo: do not invent one as a required field.

## Video

[Official video moderation contract](https://www.seeapi.com/docs/video-nsfw-filter/video-moderation/)

```json
{
  "model": "video-nsfw-filter",
  "endpoint": "video-moderation",
  "provider": "seeapi",
  "input": {
    "video_url": "https://assets.example.com/immutable-version/clip.mp4",
    "num_frames": 8,
    "threshold_offset": 0.02,
    "strict_special_care": true,
    "return_frames": "none"
  }
}
```

One accessible HTTPS MP4/MOV, at most 30 seconds and the documented “100 M” size limit. The docs do not specify the byte unit precisely: use a conservative 100,000,000-byte application limit or confirm with SeeAPI. Keep the URL accessible during processing. No documented base64-video input.

`num_frames`: integer 8–32, default 8. `threshold_offset`: finite 0–0.1, default 0.02; lower is stricter. It is not the text/image `threshold` field. `strict_special_care`: boolean, default true. `return_frames`: `none` (default), `flagged`, or `all`; the report still includes checked-frame assessments when no images are requested. Use `none` unless frame images serve a review need; returning images changes billing/storage.

New tasks return HTTP 202. Completed `result.data` contains:

```text
flagged: boolean
output: null or {
  nsfw_detected: boolean,
  scope: "sampled_frames",
  sampling_complete: boolean,
  checked_frames: integer,
  timestamp_source: string,
  output_layout: "named-files-v1",
  report_schema_version: 5,
  flagged_frame_count: integer,
  frames: [{
    frame_number: integer,
    timestamp_seconds: finite number,
    nsfw_detected: boolean,
    nsfw: string[],
    special?: string[],
    image_url?: string
  }]
}
reason?: "content_policy_blocked"
message?: string
```

For a pass, require a supported report schema, `sampling_complete: true`, positive `checked_frames` equal to `frames.length`, unique `frame_number` values, valid frame fields/counts, and consistent false overall/per-frame verdicts. A false per-frame flag alongside a nonempty `nsfw` list (or a nonempty `special` list under strict special-care handling) is contradictory and cannot approve the asset. Reconcile `flagged_frame_count` with the actual report. Do not assume the checked count always equals requested samples for every source. Unexpected coverage/counts require review rather than declaring full coverage.

`reason: "content_policy_blocked"` with `output: null` is a blocked, potentially billable outcome even when `status: "succeeded"`. Missing `special` means that optional category information was not returned; it is not an empty evaluated category. A missing frame `image_url` does not remove its assessment. Frame timestamps are approximate.

These are sampled visual-frame checks. They do not assess audio or every video frame and can miss brief events. Reject unsupported lengths or implement an explicit clip-and-aggregate policy; do not silently truncate a long video and approve the whole file.

## Operational sources and unresolved contracts

- [Authentication and key limits](https://www.seeapi.com/docs/authentication/): server-only key; separate environment keys; Developer Center supports a per-key daily credit cap by UTC day. `GET /v1/credits` is a non-generation credential/balance check.
- [Getting started](https://www.seeapi.com/docs/getting-started/): honor `Retry-After`, use increasing delays, keep duplicate callbacks harmless, and preserve idempotency on transient failures.
- Image/video accept optional top-level HTTPS `callback_url` (≤2048 chars). [Authentication](https://www.seeapi.com/docs/authentication/) requires verifying raw-body signatures with a separate webhook signing secret. These reviewed pages do not establish the exact signature header/algorithm/replay contract. Use polling until that contract is obtained and tested; do not copy an invented HMAC scheme.
- Billing is not fixed in this skill. The image page currently conflicts: header 0.01 credits/check, response description 0.2 after success. Verify the live dashboard/provider price and settled `consumed_credits` before quoting a cost. Video charges depend on requested sample count and frame-return mode. A flagged task may still incur cost; app credit refunds do not imply a provider refund.
- [Data handling](https://www.seeapi.com/docs/data-handling/): SeeAPI states it does not train on API inputs/outputs; files, task information, and moderation results have no scheduled automatic expiry, while request logs are retained 60 days. Deletion is requested through support, with task IDs; revoking your source URL does not delete already retrieved data. Review provider-specific handling rather than promising zero retention.
