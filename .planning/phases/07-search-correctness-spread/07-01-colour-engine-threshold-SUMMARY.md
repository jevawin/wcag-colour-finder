---
phase: 07-search-correctness-spread
plan: 01
subsystem: colour-engine
tags: [colour-engine, wcag, threshold, helper]
requires:
  - colour-engine.js existing exports (passesAA, passesAAA)
provides:
  - passesThreshold(ratio, targetRatio) named export from colour-engine.js
affects:
  - test/colour-engine.test.js (extended)
tech-stack:
  added: []
  patterns:
    - Pure-function named export, no DOM, no deps
    - node:test + node:assert/strict for unit coverage
key-files:
  created: []
  modified:
    - colour-engine.js
    - test/colour-engine.test.js
decisions:
  - "D-03 honoured: passesThreshold added alongside passesAA/passesAAA; back-compat preserved"
metrics:
  duration: 4m
  tasks: 1
  files_modified: 2
  tests_added: 8
  tests_total: 95
completed: 2026-04-24
---

# Phase 7 Plan 1: colour-engine passesThreshold Helper Summary

One-liner: Added `passesThreshold(ratio, targetRatio)` to `colour-engine.js` so Wave 2's variant-search can converge binary search at either AA (4.5) or AAA (7.0) threshold, with 8 boundary tests green and zero regressions.

## What Shipped

**New export in `colour-engine.js`:**

```javascript
export function passesThreshold(ratio, targetRatio) {
  return ratio >= targetRatio;
}
```

Inserted after `passesAAALarge` (line 91, before OKLab conversions). Existing `passesAA`, `passesAAA`, `passesAALarge`, `passesAAALarge` untouched (D-03 back-compat).

**Extended `test/colour-engine.test.js`:**

- Added `passesThreshold` to import list.
- New `describe('passesThreshold', ...)` block with 8 `it` cases covering exact boundaries, just-below, just-above, cross-threshold, and zero-contrast.

## Verification

- `node --test test/colour-engine.test.js` — 43/43 pass.
- `node --test 'test/*.test.js'` — 95/95 pass (full suite, zero regressions).
- All 8 new `passesThreshold` cases green.
- Existing 4 `passesAA`/`passesAAA`/`passesAALarge`/`passesAAALarge` tests unchanged and still green.

## Commits

- `d21762a` — test(07-01): add failing tests for passesThreshold helper (RED)
- `f19133f` — feat(07-01): add passesThreshold helper to colour-engine (GREEN)

## Deviations from Plan

None — plan executed exactly as written. TDD RED/GREEN cycle clean; no refactor step needed (one-liner implementation).

## Known Stubs

None. `passesThreshold` is fully wired; Wave 2 (`variant-search.js`) will import and use it.

## Self-Check: PASSED

- FOUND: colour-engine.js contains `export function passesThreshold(`
- FOUND: colour-engine.js still contains `export function passesAA(` and `export function passesAAA(`
- FOUND: test/colour-engine.test.js contains `passesThreshold,` in import list
- FOUND: test/colour-engine.test.js contains `describe('passesThreshold'`
- FOUND: commit d21762a
- FOUND: commit f19133f
- FOUND: `node --test test/colour-engine.test.js` exits 0 (43/43)
- FOUND: `node --test 'test/*.test.js'` exits 0 (95/95)
