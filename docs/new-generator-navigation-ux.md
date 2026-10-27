# New generator navigation and workspace coverage — 2026-10-27

## Navigation policy

Desktop and mobile navigation preserve the original entries, order, search UI, scroll behavior and collection-link positions. Only the 13 additions are excluded through `lib/generator-navigation.ts`; there is no 12-item cap or curated replacement of older entries. Their canonical routes, full-directory listings, related links, sitemap entries and llms listings remain available. AGENTS.md records this scope to prevent unrelated navigation changes.

## Coverage of the 13 additions

| Pages | Workspace behavior |
| --- | --- |
| Bold, Strikethrough, Underline, Small Caps, Vaporwave, Double-Struck | Compact input, relevant styles only, whole-card copying and direct directory link; no embedded generator navigation or unrelated font filters. |
| Roblox, Twitter/X, Twitch, Adopt Me | Retain the improved compact platform workspace and its functional controls, with a direct directory link. X entity protection and weighted length, and Adopt Me decorations remain intact. |
| Discord | Compact input first, visible destination and format buttons, whole-card copying for Unicode and Markdown; detailed notes below results. |
| Zalgo | Compact input and strength presets, direct result copying and randomization, followed by fine-tuning controls. Intensity, direction toggles, input bounds and grapheme preservation remain intact. |
| Handwriting | Opt-in visible font presets before the mobile preview, a jump link to the separately labelled copyable script workspace, and whole-card copying there. PNG and both SVG exports remain distinct from Unicode text. |

## Existing generator impact

The earlier 12-item reduction has been corrected: homepage and older workspace navigation restore all original entries, excluding only the 13 additions. Their conversion engines, result sets, input behavior and export logic are unchanged. The focused text layout is enabled only for the six listed new text pages and the handwriting alternative section. Prominent artwork presets are an explicit handwriting-only prop; existing visual tools keep the prior selector and layout.

## Verification

- Generator regression checks cover transforms, draft behavior, text effects, social entities and the exact navigation exclusion list and preservation of older entries.
- The 20-test production-browser suite checks all 13 additions at desktop and mobile widths, actual clipboard values, absence of embedded navigation, complete-directory access, metadata, llms output, and exports.
- Older homepage, Small Text and Cursive clipboard outputs and clearing behavior are checked. Impact retains its preset selector and PNG download. These are targeted regression checks, not a claim that every old page has been manually audited.
- Screenshots are captured as `/tmp/<slug>-<width>-unified.png`; the restored navigation is captured as `/tmp/restored-navigation-<width>.png`. Representative mobile and desktop screenshots are inspected alongside behavior checks.

Final validation passed: ESLint, generator regressions and the production build. The browser suite passed 19 checks initially; its navigation expectation incorrectly included a directory landing page that the original sidebar also excludes. After correcting that test expectation, the navigation check passed on desktop and mobile for both the homepage and Bubble workspace, completing all 20 checks. Desktop and mobile navigation screenshots were inspected: the desktop text list again contains the original 33 entries. Collection-link placement and full-directory access were also verified. Bold and Discord workspaces and mobile Zalgo result placement were visually inspected in the earlier workspace update.
