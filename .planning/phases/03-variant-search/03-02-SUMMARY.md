---
phase: "03-variant-search"
plan: "02"
subsystem: "UI wiring — variant search flow"
tags: ["ui", "interaction", "swatches", "accessibility"]
dependency_graph:
  requires:
    - "03-01 (variant-search.js with findVariants and DISTANCE_WARNING_THRESHOLD)"
    - "02-01 (app.js render function, element cache patterns)"
  provides:
    - "Working end-to-end variant search flow in the browser"
    - "Button triggers search, swatches appear, swatch click updates panels"
  affects:
    - "index.html (restructured input-area, added swatch-row)"
    - "style.css (added ~100 lines of new rules)"
    - "app.js (import, element refs, renderSwatches, clearSelectedSwatch, event handlers)"
tech_stack:
  added: []
  patterns:
    - "Swatch click updates panels via existing render() — no duplication"
    - "Element refs cached at guard-block level — consistent with Phase 2 pattern"
    - "clearSelectedSwatch helper deduplicates ring removal logic"
    - "hidden attribute toggling for swatch-row and distance-warning"
key_files:
  created: []
  modified:
    - "index.html"
    - "style.css"
    - "app.js"
decisions:
  - "Swatch click calls render(hexNoHash) — reuses existing panel update path, does not set hexInput.value (D-08)"
  - "clearSelectedSwatch called on hex input change to clear selection state (D-08 / UI-SPEC)"
  - "Distance warning shown when variants[0].distance > 0.12 (DISTANCE_WARNING_THRESHOLD from Plan 01)"
  - "find button has loading state (disabled + 'Finding...') even though search is synchronous — guards against any future async change and provides feedback"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-04-12"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
status: "complete"
---

# Phase 03 Plan 02: UI Wiring — Variant Search Flow Summary

**One-liner:** Button-triggered swatch row wired to findVariants, with panel preview on swatch click, selected-ring highlight, and OKLab distance warning.

## What Was Built

Tasks 1, 2, and 3 all complete. Task 3 (human-verify checkpoint) approved by user after browser testing of the variant search flow.

### Task 1 — HTML structure and CSS styles (commit a96042c)

**index.html changes:**
- Replaced the flat `.input-area` contents with a `.input-row` flex wrapper containing the hex label and a new `#find-btn` button
- Added `#swatch-row` (hidden) after `.panels`, containing `.swatch-list` (role="list") and `#distance-warning` (hidden)
- No new script tag needed — variant-search.js is imported via ES module in app.js

**style.css additions (~100 lines before the responsive block):**
- `.input-row` — inline-flex row for hex input + button
- `.find-btn` — dark background, white text, 16px/600 weight, with hover/focus/disabled states
- `.swatch-row`, `.swatch-list`, `.swatch-item`, `.swatch-btn` — swatch layout
- `.swatch-btn--selected` — 3px user-colour outline ring for active swatch
- `.swatch-hex` — 14px label below each swatch
- `.distance-warning`, `.distance-warning__prefix` — warning row with red prefix icon

### Task 2 — app.js wiring (commit 06ad186)

- Added `import { findVariants, DISTANCE_WARNING_THRESHOLD } from './variant-search.js'`
- Cached `findBtn`, `swatchRow`, `swatchList`, `distWarning` references
- Added `clearSelectedSwatch()` helper — removes `.swatch-btn--selected` from any active swatch
- Added `renderSwatches(variants)` — builds `<li><button><span>` elements, wires click handlers, toggles distance warning based on `variants[0].distance > DISTANCE_WARNING_THRESHOLD`
- Swatch click: calls `render(hexNoHash)` to update panels, then `clearSelectedSwatch()` + adds `.swatch-btn--selected` to the clicked button. Does NOT set `hexInput.value` (D-08)
- `findBtn` click handler: disables button with "Finding..." text, calls `findVariants('#' + lastValidHex)`, re-enables, calls `renderSwatches(results)`
- Added `clearSelectedSwatch()` at the top of the hex input `input` event handler

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are live. `findVariants` returns real search results; the swatch row is not populated until the user clicks the button, which is the intended behaviour.

## Self-Check: PASSED

- FOUND: index.html
- FOUND: style.css
- FOUND: app.js
- FOUND: commit a96042c (Task 1)
- FOUND: commit 06ad186 (Task 2)
