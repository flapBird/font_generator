# Generator copy interaction update — 2026-10-27

## Scope and observed issues

The supplied Adopt Me screenshot showed a large compatibility note before the input, decoration options hidden in a select, and outputs presented as read-only textareas with small separate copy buttons. The homepage's existing result-card interaction is the reference for this correction. Canonical topic pages remain useful entry points; they do not need different basic copy interactions.

## Verified flow

1. **Enter text:** compact input comes first. Desktop platform workspaces put controls beside the result list; mobile uses one column. Clear returns focus to the input and disables empty results.
2. **Choose an option:** Adopt Me exposes all four frame previews with a visible selected state. Discord shows its six message formats as buttons. X keeps destination modes because they change length-counter behavior. Roblox, Twitch, and Adopt Me field-specific notes live in the expandable help area instead of nonfunctional destination switches.
3. **Copy:** the whole result card is a native button, with selectable text, Enter/Space activation, and temporary success feedback. A clipboard failure exposes and selects a manual-copy textarea. Editing the result removes stale success feedback. The unchanged original is still available after the styled results.

## Visual and behavioral checks

- Inspect desktop and 390 × 844 mobile Adopt Me screenshots; all frame choices and the entire first result fit in the mobile viewport for a short name.
- Verify X mobile layout, exact clipboard contents, keyboard copying, selected states, clear behavior, and clipboard-denied recovery.
- Re-run the complete generator browser suite to cover Discord, Zalgo, platform constraints, exports, routes, metadata, sitemap, and actual llms output.
- This is a focused interaction check, not a full screen-reader or WCAG conformance audit. Actual acceptance of styled text by external platforms is unchanged and remains destination-dependent.

The generated llms.txt describes whole-card copying, visible options, and retained platform help. Public usage instructions and sitemap modification dates are synchronized with the implementation.

Validation passed: ESLint, generator regression checks, the production build, and all 16 Playwright browser tests. Screenshot evidence was inspected at `/tmp/adopt-me-copy-desktop.png`, `/tmp/adopt-me-copy-mobile.png`, `/tmp/adopt-me-copy-feedback-mobile.png`, and `/tmp/twitter-copy-mobile.png`.
