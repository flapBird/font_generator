# Text generator batch one — 2026-10-26

## Research and intent decisions

- [YayText bold](https://yaytext.com/bold-italic/): primary copyable serif/sans bold and italic variants. Reuse the existing mathematical Unicode transforms. Do not imply CSS formatting, complete language coverage, or downloadable fonts.
- [YayText strikethrough](https://yaytext.com/strike/): separate short, long, and tilde overlays. Provide those three treatments, including digits and punctuation. Preserve whitespace and emoji; keep diagonal slashes on adjacent tools.
- [Zalgo competitor](https://www.gptgames.dev/tools/zalgo_text_generator.html): amount controls and directional marks are central to the task. Provide intensity, three independent directions, stable preview, and explicit randomization. Keep the existing Light Glitch page for readable preset styles.
- [Discord competitor](https://www.chatflo.app/tools/discord-font-generator) appeared in search with distinct Markdown and Unicode modes, but its full page could not be fetched. Platform behavior below was verified against official sources rather than that snippet.
- [Discord Markdown](https://support.discord.com/hc/en-us/articles/210298617): use native message syntax for bold, italic, underline, and strike. Escape existing syntax and wrap nonempty lines independently. Preview illustrates emphasis; it does not implement Discord's complete renderer.
- [Discord name rules](https://support.discord.com/hc/en-us/articles/12620128861463): decorative text is for display names/bios, not unique usernames. Show this distinction beside the tool. No ANSI coloring or client font replacement claims.

## Scope and boundaries

Four canonical routes: `/bold-text-generator`, `/strikethrough-text-generator`, `/discord-font-generator`, `/zalgo-text-generator`.

All are free browser-side text tools. New pages use the existing registry, directory, canonical metadata, sitemap, and llms generation. Discord's existing guide now links to its tool. Existing Glitch and Facebook pages link to the new related tools.

Zalgo accepts up to 1,000 UTF-16 input units, with at most 10 above, 2 middle, and 10 below marks per supported grapheme. Emoji, complex scripts, whitespace, and already-dense clusters stay intact. Original accents are retained; this is not a pasted-Zalgo cleaner. Saved drafts beyond the limit receive a visible error, never silent truncation.

## Verification commands

- `npm run test:generators`: includes mark bounds, zone selection, deterministic randomization, emoji/accent preservation, numeric strike coverage, and Markdown escaping/whitespace cases.
- `npm run lint`
- `npm run build`
- `npx playwright test --config tests/generators/playwright.config.ts`: production-route metadata, sitemap and llms output, exact clipboard values, mode switching, mobile layout, input limits, and clipboard failure fallback.

The production build, lint, generator regressions, and all seven browser checks passed. Desktop and 390px mobile screenshots were inspected. Browser tests required permission to bind a localhost preview port; the first test run also needed selector corrections for the existing workspace card and Next.js route announcer.

Remaining batches: Roblox, Twitter/X, Underline, Small Caps; then Double-struck, Vaporwave, Twitch, Handwriting, and Adopt Me after their own intent checks.
