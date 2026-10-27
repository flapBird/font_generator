# New generator navigation and workspace coverage — 2026-10-27

## Navigation policy

Desktop and mobile shortcuts are an explicit selection of 12 existing tools in `lib/generator-navigation.ts`. None of the 13 additions joins that list, even when searching shortcuts. Persistent links open the full text and visual/art directories; canonical routes, related links, sitemap entries and llms listings are retained. Old unbounded-list scroll offsets are not reused for the new fixed list. AGENTS.md records that future additions must not expand shortcuts automatically.

## Coverage of the 13 additions

| Pages | Workspace behavior |
| --- | --- |
| Bold, Strikethrough, Underline, Small Caps, Vaporwave, Double-Struck | Compact input, relevant styles only, whole-card copying and direct directory link; no embedded generator navigation or unrelated font filters. |
| Roblox, Twitter/X, Twitch, Adopt Me | Retain the improved compact platform workspace and its functional controls, with a direct directory link. X entity protection and weighted length, and Adopt Me decorations remain intact. |
| Discord | Compact input first, visible destination and format buttons, whole-card copying for Unicode and Markdown; detailed notes below results. |
| Zalgo | Compact input and strength presets, direct result copying and randomization, followed by fine-tuning controls. Intensity, direction toggles, input bounds and grapheme preservation remain intact. |
| Handwriting | Opt-in visible font presets before the mobile preview, a jump link to the separately labelled copyable script workspace, and whole-card copying there. PNG and both SVG exports remain distinct from Unicode text. |

## Existing generator impact

The requested shortcut-list reduction applies to the homepage and older workspaces. Their conversion engines, result sets, input behavior and export logic are unchanged. The focused text layout is enabled only for the six listed new text pages and the handwriting alternative section. Prominent artwork presets are an explicit handwriting-only prop; existing visual tools keep the prior selector and layout.

## Verification

- Generator regression checks cover transforms, draft behavior, text effects, social entities and bounded shortcut selection.
- The 20-test production-browser suite checks all 13 additions at desktop and mobile widths, actual clipboard values, absence of embedded navigation, complete-directory access, metadata, llms output, and exports.
- Older homepage, Small Text and Cursive clipboard outputs and clearing behavior are checked. Impact retains its preset selector and PNG download. These are targeted regression checks, not a claim that every old page has been manually audited.
- Screenshots are captured as `/tmp/<slug>-<width>-unified.png`; the fixed navigation is captured as `/tmp/fixed-shortcuts-<width>.png`. Representative mobile and desktop screenshots are inspected alongside behavior checks.

Final validation passed: ESLint, generator regressions, the production build, and all 20 Playwright browser tests. The final desktop shortcut list, Bold and Discord workspaces, and mobile Zalgo result placement were visually inspected.
