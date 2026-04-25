---
phase: 08-auto-find-ux
plan: 02
subsystem: input-ux
tags: [input, ui, hex, accessibility, removal]
requires:
  - "08-01"  # expandShorthandIfValid helper
provides:
  - "Find 5 button surface fully removed from DOM/JS/CSS"
  - "wireHexInput now binds blur listener that expands 3-char shorthand via setter"
  - "Subtitle copy without Find reference"
affects:
  - index.html
  - app.js
  - style.css
tech-stack:
  added: []
  patterns:
    - "Blur-then-expand piggy-backed on existing setter pipeline (URL sync + autoFindAndApply)"
    - "Atomic delete: HTML element + JS lookups + JS handler + CSS rules removed in one commit to avoid load-time crash"
key-files:
  created: []
  modified:
    - index.html
    - app.js
    - style.css
decisions:
  - "Blur handler lives inside wireHexInput so all three hex inputs (base, light bg, dark bg) inherit behaviour without per-input duplication"
  - "expandShorthandIfValid returns null for 6-char input, so input-then-blur sequence does not double-fire setter (research Pitfall 4)"
metrics:
  duration: 1m
  completed: 2026-04-25
---

# Phase 8 Plan 2: Remove Find Button + Wire Blur-Expand Summary

Atomic delete of the Find 5 button surface (HTML element, JS lookups + click handler, four CSS rules), subtitle copy rewrite, and blur-expand listener wired into `wireHexInput` — closing INPUT-01 and INPUT-03 in two task commits.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove Find 5 button surface and rewrite subtitle | c58e3a3 | index.html, app.js, style.css |
| 2 | Extend wireHexInput with blur-expand for 3-char shorthand | 351b3a6 | app.js |

## What Changed

### index.html
- Subtitle now reads exactly: `Enter a hex code to find close pairs accessible on light and dark backgrounds.`
- `#find-btn` button line deleted from `.row-one`. AA/AAA toggle and `.hex-input` neighbours intact.

### app.js
- Element cache lookups for `findBtn` and `findLabel` removed.
- Find button click handler block (re-roll with "Searching…" label) removed.
- `wireHexInput` now binds two listeners: existing `input` (sanitise + setter on length===6) plus new `blur` (call `expandShorthandIfValid`, forward to setter). All three hex text inputs inherit the new blur behaviour through the existing `wireHexInput(baseText, setBase)` / `wireHexInput(lightBgText, setLightBg)` / `wireHexInput(darkBgText, setDarkBg)` call sites.

### style.css
- Top-level `.btn`, `.btn:hover`, `.btn:disabled` rules removed.
- Mobile `@media` `.btn` flex/height/padding override removed.

## Verification

- 121/121 tests passing (`node --test 'test/*.test.js'`)
- `node --check app.js` exits 0
- `grep` for `find-btn|Find 5|findBtn|findLabel` returns 0 matches across the three files
- `grep` for `^\.btn` and `  \.btn ` returns 0 matches in style.css
- Subtitle string present in index.html
- Single blur listener inside `wireHexInput` (attached to 3 inputs via 3 calls)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- index.html: FOUND
- app.js: FOUND
- style.css: FOUND
- commit c58e3a3: FOUND
- commit 351b3a6: FOUND
