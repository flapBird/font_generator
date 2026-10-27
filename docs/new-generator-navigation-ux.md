# New generator navigation and workspace coverage — 2026-10-27

## Navigation policy

Desktop and mobile navigation preserve the original entries, order, search UI, scroll behavior and collection-link positions. The 13 additions are excluded from the permanent list through `lib/generator-navigation.ts`; there is no 12-item cap or curated replacement of older entries. Their canonical routes, full-directory listings, related links, sitemap entries and llms listings remain available. On the 12 new text pages, a single temporary current-page entry marked HERE appears below search, outside the permanent list. It disappears on older pages, which keep their original active-item treatment. AGENTS.md records this scope to prevent unrelated navigation changes.

## Coverage of the 13 additions

| Pages | Workspace behavior |
| --- | --- |
| Bold, Strikethrough, Underline, Small Caps, Vaporwave, Double-Struck | Existing three-column workspace with the original navigation, relevant results, whole-card copying and live Font Studio preview. No unrelated font filters. |
| Roblox, Twitter/X, Twitch, Adopt Me | Use the same workspace and preview, retaining platform-specific controls and whole-card copying. X entity protection and weighted length, and Adopt Me decorations remain intact. |
| Discord | Shared workspace with visible destination/format buttons and whole-card copying. The live preview shows the selected Unicode result or clearly labelled Markdown source; compatibility notes remain below results. |
| Zalgo | Shared workspace with input and strength presets, direct result copying, a live effect preview, randomization and fine-tuning controls. Intensity, direction toggles, input bounds and grapheme preservation remain intact. |
| Handwriting | Opt-in visible font presets before the mobile preview, a jump link to the separately labelled copyable script workspace, and whole-card copying there. PNG and both SVG exports remain distinct from Unicode text. |

## Existing generator impact

The earlier 12-item reduction has been corrected: homepage and older workspace navigation restore all original entries, excluding only the 13 additions. Their conversion engines, result sets, input behavior and export logic are unchanged. The 12 text additions opt into the existing GeneratorTool shell with explicit controls/results/preview slots. Older pages keep the default input, results and preview behavior. Handwriting retains its separate artwork and copyable alternatives layout. Prominent artwork presets are an explicit handwriting-only prop; existing visual tools keep the prior selector and layout.

## Verification

- Generator regression checks cover transforms, draft behavior, text effects, social entities and the exact navigation exclusion list and preservation of older entries.
- The production-browser suite checks all 13 additions at desktop and mobile widths, actual clipboard values, shared navigation and temporary current-page indicators, client-side switching and draft continuity, complete-directory access, metadata, llms output, and exports.
- Older homepage, Small Text and Cursive clipboard outputs and clearing behavior are checked. Impact retains its preset selector and PNG download. These are targeted regression checks, not a claim that every old page has been manually audited.
- Screenshots are captured as `/tmp/<slug>-<width>-unified.png`; the restored navigation is captured as `/tmp/restored-navigation-<width>.png`. Representative mobile and desktop screenshots are inspected alongside behavior checks.

Validation passed: ESLint, generator regressions, production build and all 21 browser tests. After adding stronger keyboard/selected-preview assertions and the new llms description checks, both affected browser tests were rerun and passed. Bold, Adopt Me, Discord and Zalgo screenshots were inspected at representative desktop/mobile sizes. Old navigation still has 33 text entries; temporary current items do not increase that count. Client-side switching and browser Back retain the draft and correct canonical URL without a document reload.
