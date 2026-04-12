---
phase: 01-colour-engine
plan: "01"
subsystem: testing
tags: [wcag, oklab, oklch, colour-engine, contrast, luminance, node-test]

# Dependency graph
requires: []
provides:
  - "colour-engine.js: pure ES module with hex parsing, WCAG luminance, contrast ratios, OKLab/OKLCH conversions, perceptual distance"
  - "test/colour-engine.test.js: 35-test node:test suite verified against WCAG spec reference values"
affects:
  - 02-live-preview
  - 03-variant-search
  - all subsequent phases that import colour-engine.js

# Tech tracking
tech-stack:
  added: ["node:test (built-in)", "node:assert/strict (built-in)"]
  patterns:
    - "Single ES module of named exports — no default export, no class"
    - "Pure functions — no DOM, no window, no navigator"
    - "null-on-bad-input pattern — no thrown exceptions for invalid user input"
    - "TDD: RED commit then GREEN commit per feature"
    - "Raw float contrast ratios — never round before threshold comparison"

key-files:
  created:
    - colour-engine.js
    - test/colour-engine.test.js
  modified: []

key-decisions:
  - "node:test chosen as test runner — zero dependencies, ships with Node 24, stable describe/it API"
  - "Single colour-engine.js file, not split by concern — engine is <150 lines, splitting adds indirection"
  - "0.04045 linearisation threshold (W3C May 2021 correction) — not the old 0.03928"
  - "contrastRatio returns raw float — rounding before passesAA would make #777777 on white falsely pass"
  - "oklabToSrgb included in Phase 1 engine so Phase 3 search loop can import it rather than duplicate maths"

patterns-established:
  - "Hex parsing: typeof guard + regex gate before parseInt — parseInt silently accepts partial hex garbage"
  - "OKLab: Ottosson M1/M2 matrix coefficients copied verbatim from source paper"
  - "Test assertions: Math.abs(actual - expected) < tolerance for floating-point comparisons"

requirements-completed: [SC-1, SC-2, SC-3, SC-4, SC-5]

# Metrics
duration: 2min
completed: 2026-04-12
---

# Phase 01 Plan 01: Colour Engine Summary

**Pure JS colour maths engine in OKLab space — hex parsing, WCAG 2.1 luminance and contrast ratios, Ottosson OKLab/inverse conversion, Euclidean perceptual distance — 35 node:test tests all green**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-12T17:37:07Z
- **Completed:** 2026-04-12T17:39:00Z
- **Tasks:** 2 (RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Colour engine built as a single pure ES module — no DOM, no dependencies, no build step
- 35 tests covering all five success criteria pass against WCAG 2.1 spec reference values
- Critical smoke test passes: `#777777` on white = 4.478:1, which fails AA (confirms raw float, no premature rounding)
- OKLab round-trip (`srgbToOklab` → `oklabToSrgb`) preserves all RGB channels within ±1 integer
- `oklabToSrgb` included proactively so Phase 3 can import it rather than duplicate the matrix maths

## Task Commits

1. **Task 1: RED — failing test suite + stub engine** - `df01d49` (test)
2. **Task 2: GREEN — full colour engine implementation** - `dba4963` (feat)

**Plan metadata:** _(pending final docs commit)_

_Note: TDD plan — Task 1 = RED (all 35 tests fail on stub), Task 2 = GREEN (all 35 pass on real implementation)_

## Files Created/Modified

- `colour-engine.js` — pure ES module: parseHex, relativeLuminance, contrastRatio, passesAA/AAA/AALarge/AAALarge, srgbToOklab, oklabToSrgb, oklabDistance, AA_NORMAL, AAA_NORMAL, AA_LARGE, AAA_LARGE
- `test/colour-engine.test.js` — 35 node:test tests across 7 describe groups, all verified against WCAG spec reference values

## Decisions Made

- **node:test** chosen over Vitest/Jest — zero dependencies, ships with Node 24, `describe`/`it` API stable
- **Single file** (`colour-engine.js`) rather than splitting — engine is ~150 lines; splitting adds complexity without benefit at this scale
- **0.04045 threshold** throughout — W3C corrected the spec from 0.03928 in May 2021; many posts still show old value
- **oklabToSrgb added to Phase 1** — Phase 3's search loop needs the inverse; better to include it here than have Phase 3 duplicate the matrix
- **Raw float contrast ratio** — never round before comparing to AA/AAA threshold; rounding 4.478 → 4.5 would falsely pass `#777777` on white

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external services, no environment variables. Runs with `node --test test/colour-engine.test.js`.

## Next Phase Readiness

- `colour-engine.js` exports are stable and ready for Phase 2 (live preview UI) to import
- Phase 3 (variant search) can import `oklabToSrgb` and `oklabDistance` for OKLCH lightness-axis binary search
- All five success criteria (SC-1 through SC-5) verified via test suite

---
*Phase: 01-colour-engine*
*Completed: 2026-04-12*
