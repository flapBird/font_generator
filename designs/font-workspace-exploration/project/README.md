# Font Generators — homepage design exploration

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
