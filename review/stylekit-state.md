# Style Kit state and download inspection

Base: `bc7aa828cc084b07084f6da8afd43fa847f7c9b7`.

## Confirmed failure and cause

The previous Studio entry point called `StyleKit.render(StyleKit.current() || S.base)`.
Once Kit had been visited, `current()` remained truthy. Changing the global
palette on another tab therefore kept the old Kit preview and old download
target. There was also no Kit branch in `renderExtra()`, so global style changes
while Kit was visible did not refresh it. `cur` carried no indication of whether
the user had deliberately chosen an independent template.

The 13 Kit assets are independently authored static templates. The 9 component
presets share their main/deep/accent colors, but Kit has its own 12 Office theme
slots, highlight tints and format scheme. A Kit match must therefore validate
the palette and actual asset slots; an equal ID alone is insufficient.

## Local change

- New default source: **跟隨全站配色**. A known, unmodified built-in palette resolves
  to the corresponding asset by actual P/PD/A values; a stale base ID cannot
  select an unrelated file.
- Clicking one of the 13 Kit themes explicitly chooses **獨立範本**. This selection
  is retained across global style changes and page reloads. The UI explains that
  independent selection will not be overwritten. A source button returns to
  following the current Studio palette.
- A changed P, PD, PT, A, ink, body text, muted text, line, l2 or fill palette has no
  corresponding static Kit asset. Kit shows the current role swatches and a
  specific unsupported-custom-palette explanation, hides the old template
  gallery and removes all download hrefs. The component library can still
  preview/export that custom palette. Users can deliberately choose a static
  independent template instead.
- Font, size, table appearance and semantic warning/good/bad edits do not become
  false custom-palette blockers. Those are not Office Kit color-source changes.
- Existing Office gallery semantics, fixed half-height marker yellow,
  neutral colors, 12-slot asset colors, format scheme and existing shadow/gradient
  illustrations are preserved. No new shadow was introduced.
- Static anchors emit a cancellable `stylekit-download` event. The host can share
  its download lock without an asset fetch, preserving relative `file://` and
  bundled Blob download support. Detached stale anchors cancel themselves.

## Host integration

Replace the old Kit entry render call with:

```js
StyleKit.sync(S.p, S.base);
```

Use the same call from the `renderExtra()` Kit branch. `StyleKit.state()` returns
`{source, id, downloadable, base}`. Explicit `render(id)` remains compatible and
now records an independent template choice.

Listen on `document` for `stylekit-download` and call `preventDefault()` to cancel.
The event contains `theme`, `format`, `file`, `href`, `download`, `source` and
`validation: 'build-time-package'`. The original anchor follows only when the
host does not cancel the event. No runtime fetch or layout claim is implicit.

## Verification and limits

`node tools/stylekit_state_test.js` checks 20 state/anchor contracts, including
all 9 global presets, all 13 independent themes, P/PD/PT/A and neutral overrides,
reload, return to following, custom recovery, stale anchors, cancelled download,
all three file formats, relative/embedded asset modes, malformed storage and
mutations of actual main/deep/accent asset slots. Expected blue/purple/green/wine
colors are independent literals; the tests do not call the resolver to derive
expected values. The script can also inspect the rebuilt single-file source
with `STUDIO_HTML=PPT-Style-Studio.html`.

These tests use a minimal DOM adapter to execute the production state and anchor
handlers. They do not certify browser layout, native download completion or
PowerPoint rendering. Full Studio integration tests are a separate host gate.

Static Kit packaging validation belongs to the build-time 13-theme asset suite.
The static download path does not perform a runtime font, overflow, PowerPoint
layout or editability inspection. No custom static Kit asset generation was
added in this change.
