# Font Generators — design and interaction exploration

## Revision 2: task-oriented workspaces

The canvas opens in the new specimen-wall prototype. The page named “02 · 新版交互与主要页面” contains six connected artboards; the earlier static concepts remain on “01 · 上轮静态方案”. Production pages are untouched.

- Wall: a full-width input and two-column specimen wall with category filtering, style search, real clipboard attempts, manual-copy recovery, empty states and comparison of up to three styles.
- TextDetail: a cursive-focused workspace with its own default input and four representative styles, reusing Wall through a Design Component import.
- Explore: a searchable snapshot of all 96 existing public catalog entries (57 text, 28 artwork, 6 symbols, 5 Unicode utilities). Cursive and Neon open local prototype screens; other entries explicitly open the live site. Initial results paginate in groups of nine.
- Artwork: a canvas-led Neon workspace with editable text, four concept palettes, colors, glow, size, alignment, shape and transparency. Prepare PNG creates a real blob from the visible canvas; a save link downloads it. Editing invalidates the previous export.
- Phone and Phone-Art: 390 × 844 frames importing the same interactive components, with compact navigation. Artwork places its preview, export and presets before detailed settings on narrow screens.

This iteration proposes a different information hierarchy and a new comparison interaction. It is not a claim that these changes are live. The original permanent generator navigation is not modified; the complete catalog remains available in the prototype directory.

The text prototype contains ten representative style maps extracted from the current implementation for ASCII letters and digits, preserving other characters. It does not reproduce every production transform, combining-mark rule or all 59 styles. The Cursive screen uses four representative variants. The Neon prototype uses system Arial and simplified outline/glow rendering, not the production fonts or renderer. Its four palettes are original prototype options. Exports are 2000 × 1000 or 1600 × 1600 PNG. AI Font, authentication, payments, dark mode and the remaining individual tool workspaces are outside this revision.

Local state is per component instance and is not transferred between tool pages. Clipboard and download support depend on the editor sandbox/browser; clipboard denial exposes selectable text instead of reporting success. Search results show a recovery action when empty. Compare state is temporary and is not saved to an account.

Validation: the skill's artifact checker checks structure only; no browser render, interaction or accessibility audit was performed in this iteration. The llms.txt source was reviewed: these private design concepts do not change public functionality, so its content remains unchanged.

## Revision 1: retained comparison

Four editable Claude Design artboards compare the same homepage content:

- A / Clear and light: violet brand, modest rounded cards, compact introduction.
- B / Type specimen workspace: neutral surfaces, fine rules, tighter result rows.
- Each direction includes a 1440-pixel desktop page and a 390 × 844 mobile frame.

These are static visual concepts, not production implementations. Text inputs can be edited, but conversion, filtering, copying, search, theme and menu buttons are not wired to application behavior. Links open the existing public website. The mobile generator directory and FAQ use native disclosures.

All 33 existing copyable-text sidebar links and 18 artwork links retain their observed order. The six displayed results illustrate the beginning of the existing 59-style list; they are not a proposed limit. The sample phrase is identical in all four boards. Mobile preserves access to the full directory. Global mobile navigation expansion, dark mode, error states, clipboard feedback and the remainder of the result list are outside this initial visual study.

No application components, conversion logic, URLs, public navigation or SEO output are changed. The existing llms.txt route was checked; private design concepts should not be described as live functionality, so its content stays unchanged.

Open the editable canvas:

```sh
node /Users/admin/.mirasim/skills/claude-design/scripts/artifact.mjs open designs/font-workspace-exploration
```

Validate the artifact structure:

```sh
node /Users/admin/.mirasim/skills/claude-design/scripts/artifact.mjs check designs/font-workspace-exploration
```

The artifact checker validates structure only. It does not render or verify visual layout or runtime behavior. Local preview-server state is excluded from Git.
