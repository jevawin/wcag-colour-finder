---
phase: 03-variant-search
plan: 01
subsystem: variant-search
tags: [tdd, oklab, binary-search, wcag, accessibility]
dependency_graph:
  requires:
    - colour-engine.js (parseHex, srgbToOklab, oklabToSrgb, contrastRatio, passesAA, oklabDistance)
  provides:
    - variant-search.js (findVariants, DISTANCE_WARNING_THRESHOLD)
  affects:
    - app.js (Phase 03-02 will import findVariants to wire the Find button)
tech_stack:
  added: []
  patterns:
    - OKLCH lightness binary search (40-iteration, sub-0.001 L precision)
    - a-channel offset set to produce up to 5 distinct candidates
    - Round-trip gamut check (|Δa| > 0.02 || |Δb| > 0.02 → discard)
    - Pure ES module, no DOM — same pattern as colour-engine.js
key_files:
  created:
    - variant-search.js
    - test/variant-search.test.js
  modified: []
decisions:
  - DARK_BG hardcoded as #111111 in variant-search.js to match app.js (not #000000)
  - A_OFFSETS = [0, ±0.01, ±0.02] on OKLab a-channel — small enough to preserve hue identity
  - DISTANCE_WARNING_THRESHOLD = 0.12 per UI-SPEC D-06 (threshold on caller, not result objects)
  - No distantWarning property on result objects — threshold is exported for the UI layer to apply
metrics:
  duration_seconds: 85
  completed_date: "2026-04-12T21:32:57Z"
  tasks_completed: 3
  files_created: 2
  files_modified: 0
---

# Phase 03 Plan 01: Variant Search Algorithm Summary

**One-liner:** OKLCH lightness binary search in OKLab space, returning up to 5 deduplicated AA-passing colour variants sorted by perceptual distance.

## What Was Built

`variant-search.js` — a pure ES module with no DOM access. Exports:

- `findVariants(inputHex, count = 5)` — finds accessible colour variants close to the input
- `DISTANCE_WARNING_THRESHOLD` — exported constant (0.12) for the UI layer to use when warning about distant variants

`test/variant-search.test.js` — 23 unit tests covering all plan requirements.

## Algorithm

1. Parse input hex to `{r, g, b}` — return null if invalid.
2. Convert to OKLab origin `{L, a, b}`.
3. For each of 5 a-channel offsets `[0, +0.01, -0.01, +0.02, -0.02]`:
   - Run binary search toward darker (L → 0) and lighter (L → 1).
   - 40 iterations per search → sub-0.001 L precision.
   - After each candidate: round-trip gamut check. Discard if |Δa| > 0.02 or |Δb| > 0.02.
4. Deduplicate by uppercase hex.
5. Sort by ascending OKLab distance from original.
6. Return first `count` results as `[{ hex, distance }]`.

## Test Results

```
67 tests total (colour-engine + app + variant-search)
67 pass / 0 fail / 0 skip
```

Variant-search tests: 23/23 pass.
No regressions in existing colour-engine (35/35) or app (9/9) tests.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 3f5307d | test (RED) | Failing tests for findVariants — 23 tests across 6 describe blocks |
| 0e0e94e | feat (GREEN) | variant-search.js implementation — all 23 tests pass |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Deviation note: test directory path

The plan references `tests/variant-search.test.js` (plural) but the project uses `test/` (singular). Test file was placed at `test/variant-search.test.js` to match the existing project structure. This is a minor path correction, not a deviation from intent.

## Known Stubs

None — `findVariants` is fully wired and returns real computed results. `DISTANCE_WARNING_THRESHOLD` is a real value (0.12) that the UI layer will use in Phase 03-02.

## Self-Check: PASSED
