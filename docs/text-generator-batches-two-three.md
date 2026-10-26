# Text generator batches two and three — 2026-10-26

## Implemented scope

Nine canonical pages: Roblox, Twitter/X, Underline, Small Caps, Vaporwave, Double-Struck, Twitch, Handwriting, and Adopt Me. `/x-font-generator` redirects permanently to `/twitter-font-generator`; it is not a second indexed page.

## Intent research and decisions

| Topic | Evidence | Implementation decision |
| --- | --- | --- |
| Roblox | [Meshlox](https://meshlox.com/tools/roblox-font-generator), [Roblox name help](https://en.help.roblox.com/hc/en-us/articles/4401938870292-Changing-Your-Display-Name), [official text filtering](https://create.roblox.com/docs/ui/text-input#text-filtering) | Copyable labels/profile text, destination guidance, and original fallback. Do not repeat competitors' unsupported universal name-compatibility claims. No logo or official font download. |
| Twitter/X | [HopperHQ](https://www.hopperhq.com/tools/twitter-font-generator/), [X counting rules](https://docs.x.com/fundamentals/counting-characters), [profile fields](https://help.x.com/en/managing-your-account/how-to-customize-your-profile), [account names](https://help.x.com/en/managing-your-account/change-x-handle) | One page, field-specific guidance, preserved detected entities, standard-post weighted estimate via Twitter's open-source `twitter-text` package. Do not reuse post weights for names/bios or claim to model long-post plans or reply context. |
| Underline | [YayText](https://yaytext.com/underline/) | Single/double low lines, copied as actual Unicode; no CSS-only output or hyperlink claim. Preserve emoji and whitespace. |
| Small Caps | [LingoJam](https://lingojam.com/SmallCapsGenerator) | Baseline all-small-cap conversion and a preserve-uppercase alternative. Explain phonetic approximations and distinguish superscripts/subscripts and genuine font-level small caps. |
| Double-Struck | [YayText](https://yaytext.com/double-struck/) | Accurate Latin capitals, lowercase and digits; verify legacy capitals ℂℍℕℙℚℝℤ. Do not fill the page with unrelated alphabets or claim adjustable outline artwork. |
| Vaporwave | [LingoJam](https://lingojam.com/VaporwaveTextGenerator) | Fullwidth printable ASCII and ideographic spaces, original-case/uppercase/spaced variants. Preserve line breaks and emoji. No unrelated CJK substitutions or translation claims. |
| Twitch | [CopyFont](https://copyfont.com/twitch-fonts), [Twitch display-name help](https://help.twitch.tv/s/article/display-names-on-twitch?language=en_US) | Title/bio/chat accents, protected entities, explicit account-name limitation. Official search excerpts supplied the name-rule evidence; the live help page returned its CSS-error shell. No assumption that arbitrary Unicode is a valid account name. |
| Adopt Me | [AdoptMeText](https://adoptmetext.com/), Roblox filtering documentation above | Pet-name/roleplay ideas with independent frame selection. Every result remains unverified in-game; no filter bypass or `name-safe` badge. Original input stays unchanged. |
| Handwriting | [FontSpace Unicode approach](https://www.fontspace.com/font-generator), [FindFont search result](https://www.findfont.co/font-generator/handwriting), [Caveat](https://fontsource.org/fonts/caveat/about), [Patrick Hand](https://fontsource.org/fonts/patrick-hand/about) | Search intent spans copyable approximations and real-font artwork. Lead with bundled handwriting typefaces and PNG/SVG export, retain a separate Unicode section. No photo-to-font, personal-handwriting cloning, or TTF promise. FindFont's full page was unavailable; no unobserved controls were assumed. |

Competitor descriptions are treated as intent evidence, not authority for platform rules. No Roblox, Twitch, X, or Adopt Me account was modified and no content was posted as part of verification.

## Implementation boundaries

- The four platform workspaces use a 1,000-unit HTML input limit, shared session drafts, and copyable original fallback. The limit is per edit, not certification against a destination's length rules.
- X and Twitch preserve entities detected by `twitter-text` before transforming surrounding spans. X estimates standard-post length only; the package's recognized emoji set and the final X composer can differ for new characters or contextual behavior.
- Standard Unicode style inputs retain the existing 240-unit limit. Underline no longer attaches new marks to emoji; repeat application does not duplicate the same underline mark.
- Handwriting uses `@fontsource/caveat` 400/700 and `@fontsource/patrick-hand` 400 Latin subsets, served by the site. OFL notices are included under `public/licenses` and linked from the page. Unsupported scripts can fall back to other browser fonts.
- The handwriting artwork input retains the existing 120-unit limit and manual line handling. Editable SVG retains text and needs its font; faithful SVG embeds raster pixels. Copyable script alternatives do not reproduce the rendered typefaces.
- The generator registry determines sitemap, canonical metadata, navigation and llms listings. Unicode game pages now appear in both the style directory and fandom directory; handwriting appears in Visual & Art.

## Verification

- `npm run test:generators`: transformation edge cases, entity preservation after multi-codepoint emoji, X weighted lengths and URLs, pet-frame cleanup, registry uniqueness, related links, and sitemap date coverage.
- `npm run lint` and `npm run build`.
- `npx playwright test --config tests/generators/playwright.config.ts`: first-batch regressions plus all nine routes, metadata, redirect, actual llms/sitemap output, directory links, exact clipboard contents, destination switching, pet frames, real-font loading, PNG/SVG downloads, and mobile layouts.

All commands above passed, including all 14 browser tests against the production build. Inspected desktop handwriting and mobile handwriting, X, Adopt Me, Vaporwave, and Underline screenshots. Checked the generated `/llms.txt` body for all nine canonical links and the distinction between text and artwork outputs. The production build also caught and resolved `twitter-text`'s default-export interoperability requirement before browser verification.

All 13 topics from the original gap list now have implementations. Actual platform acceptance remains destination-dependent and is described accordingly in the UI and llms.txt.
