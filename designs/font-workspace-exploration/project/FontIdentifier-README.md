# Font Identifier · Design prototype

Seven editable artboards are on canvas page “03 · Font Identifier 识别与比较”. Existing design pages remain available.

## Flow

- FontTools → IdentifierUpload → IdentifierCrop → IdentifierLoading → IdentifierResults.
- IdentifierUploadMobile → IdentifierMobile provides a compact mobile sample flow.
- In Play, the file picker displays a local filename only. Subsequent screens use the supplied specimen.
- Crop toggles between two illustrative selections. Pointer dragging and numeric crop fields remain implementation requirements; this prototype does not implement image processing.
- Loading has a phase tweak: loading, matching, error, no-text. “View sample results” explicitly advances the demo; no model runs and no progress percentage is fabricated.
- Results use three illustrative candidates. Selection, comparison text and size controls update the preview. Production must retain up to ten real model results, with progressive disclosure if needed.

## Scope and assumptions

The current brand's purple, pale gray and Arial UI are retained. Original and selected previews are adjacent; candidates show actual letterforms. Font Tools includes only the currently available tool.

The specimen is a locally rendered Georgia image. The candidate set (EB Garamond, Amiri and Lateef) and ordering are demonstration data, not recognition output. The comparison is intended to communicate interaction and layout, not accuracy.

Uploaded preview fonts are bundled for the design. Production must preserve optional/on-demand Google Fonts loading, local image processing, cropping accessibility, cancellation, timeout, errors, limits, and the current What / How to / FAQ content.

This delivery changes design files only. It does not change production routes, navigation, rendering, matching, or SEO. Existing llms.txt descriptions remain applicable.

## Assets

- Specimen PNG: df25968d9cc8a95b0f7a4a46a68b3e09. Locally rendered text; no Georgia font file is redistributed.
- EB Garamond regular: 912929dba0faab5e151849ea5e988adb.
- EB Garamond medium: 7b252686ba2797f0a376a4ce7e56534d.
- Amiri regular: d600850a2b0f3d862559d0bb040bca87.
- Lateef regular: 2a4752592455dbc9a30ad5f407bde4fd.
- Font licenses are included as FontIdentifier-*-LICENSE.txt alongside the artboards.

## Validation

Claude Design structure check reports zero problems. The checker does not render pages or execute their scripts. Browser layout and interaction testing have not been performed.

