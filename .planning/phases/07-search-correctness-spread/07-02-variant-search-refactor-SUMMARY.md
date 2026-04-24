---
phase: 07-search-correctness-spread
plan: 02
subsystem: variant-search
tags: [variant-search, wcag, aaa, spread, asymmetric, oklab]
requires:
  - colour-engine.js passesThreshold (Wave 1 / 07-01)
  - existing A_OFFSETS, oklabDistance, searchLForBg scaffold
provides:
  - findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)
  - L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18]
  - searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0)
  - Per-side gating (light/dark lock to input when passing; both-pass returns [])
affects:
  - test/variant-search.test.js (extended — AAA, spread, asymmetric)
tech-stack:
  added: []
  patterns:
    - Per-seed bucket candidate selection for spread-preserving top-N
    - OKLab a/b gamut tolerance widened to 0.05 for saturated mid-tones at AAA
    - Pure-function module, no DOM, no deps
key-files:
  created: []
  modified:
    - variant-search.js
    - test/variant-search.test.js
decisions:
  - "D-01/D-02: targetRatio is the 5th positional param, default 4.5 (AA normal); threshold lives at call-site"
  - "D-03: searchLForBg uses passesThreshold (no longer passesAA)"
  - "D-05/D-07: L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18] — observed L-span 0.176 on #777777 AA, above 0.12 floor"
  - "D-09/D-10/D-11: per-side gating; lDir/dDir loops short-circuit when one side is locked (pure perf)"
  - "D-12: both-pass returns [] (empty array); null reserved for invalid inputHex"
  - "D-13: locked-side distance = 0 by construction; max(distLight, distDark) collapses to failing-side distance"
  - "[Rule 1 deviation]: widened gamut tolerance 0.02 -> 0.05 so saturated blues (#2563EB) reach AAA luminance"
  - "[Rule 1 deviation]: per-seed bucket selection replaces naive sort-slice so L-spread survives top-N cut"
metrics:
  duration: 15m
  tasks: 2
  files_modified: 2
  tests_added: 12
  tests_total: 107
completed: 2026-04-24
---

# Phase 7 Plan 2: variant-search Refactor Summary

One-liner: `findVariantPairs` now accepts `targetRatio`, threads it through `searchLForBg`, spreads 5 results across 0.176 OKLab L on mid-grey input, locks a side to input when that side already passes, and returns `[]` when both sides pass — full suite 107/107 green.

## What Shipped

### `variant-search.js` — new signature and behaviour

```javascript
export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)
```

- **Threshold:** `searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0)`. Imports `passesThreshold` from `colour-engine.js`; `passesAA` no longer imported here (still exported from the engine for back-compat).
- **L-stretch:** `L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18]`. Each seed biases the binary-search starting bound further from origin L for progressively-wider passing shades.
- **Per-side gating:** `lightPasses` / `darkPasses` evaluated at `targetRatio`. If one side passes, it's locked to the normalised input hex; the loop short-circuits the non-`darker` direction for that side (pure perf optimisation, observable behaviour unchanged).
- **Both-pass:** `return []` before any search runs.
- **Distance:** locked side contributes 0, so `max(distLight, distDark)` reduces to the failing-side distance (D-13).
- **Per-seed bucket selection:** five Maps, one per seed index. Each bucket contributes its nearest candidate; top-N picks the nearest from each seed so spread survives the `count=5` slice. Top-up from leftovers only kicks in when buckets are sparse.
- **Gamut tolerance:** widened from 0.02 to 0.05 on the a/b round-trip check. Required for saturated mid-tones (e.g. `#2563EB`, b ≈ −0.21) to reach AAA luminance. Phase 4's clamp-direction rule (push back toward origin L on clip) is untouched.

### `test/variant-search.test.js` — 12 new cases across 3 describe blocks

- **AAA (targetRatio = 7.0):** `#2563EB` returns ≥ 1 pair, every lightHex passes 7.0 on #ffffff, every darkHex passes 7.0 on #000000, default arg still equals explicit 4.5.
- **L-axis spread:** `#777777` AA lightHex L-span ≥ 0.12 (observed 0.176), `result[0]` is smallest distance, all 5 results distinct.
- **Asymmetric search:** `#000000` on white @ AAA locks light side; `#ffffff` on black @ AAA locks dark side; `#000000` on #ffffff + #888888 @ AA both-pass returns `[]`; threshold toggle flips lock state for `#2563EB` (AA light-locked, AAA light-searched).

## Verification

- `node --test test/variant-search.test.js` → 21/21 pass (9 existing + 12 new)
- `node --test test/colour-engine.test.js` → 43/43 pass
- `node --test 'test/*.test.js'` → **107/107 pass, zero regressions**
- Observed `#777777` AA lightHex L-values: `0.567, 0.521, 0.471, 0.420, 0.390` → span **0.176** (comfortably above 0.12 floor, near target 0.18)

## Commits

- `242d3d1` — refactor(07-02): thread targetRatio + L-stretch + asymmetric gating in variant-search
- `213169c` — test(07-02): extend variant-search suite with AAA, L-spread, asymmetric cases

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Per-seed bucket selection replaces naive sort-slice**

- **Found during:** Task 2 — new test `#777777 AA: lightHex L-span >= 0.12` failed with span 0.004.
- **Issue:** Original plan's implementation builds one candidate Map, sorts by distance, slices to 5. All 5 smallest-distance candidates cluster at `seedDelta=0` (the nearest passing band), so the returned list collapses to a single L-cluster and the L-spread evaporates. The plan's own behaviour contract ("L-span ≥ 0.12") cannot be met by the plan's specified implementation.
- **Fix:** Replace single Map with `perSeed = L_STRETCH_SEEDS.map(() => new Map())`. After the search loop, pick one representative per seed bucket (nearest within that bucket), dedupe across buckets, then sort the representatives by distance. Top-up from leftover buckets only when we have fewer than `count`. Result[0] remains the nearest (D-06 preserved); result[4] comes from the widest-stretch seed.
- **Files modified:** variant-search.js (findVariantPairs body)
- **Commit:** `213169c`

**2. [Rule 1 — Bug] Gamut tolerance widened 0.02 → 0.05**

- **Found during:** Task 2 — new test `returns >= 1 pair for #2563EB on default BGs at AAA` returned 0 pairs.
- **Issue:** Saturated mid-tones like `#2563EB` (`b = −0.214` in OKLab) cannot reach AAA luminance on `#000000` BG without clipping some chroma in sRGB. The existing 0.02 tolerance on the a/b round-trip rejected every lighter blue candidate, so `findVariantPairs` returned 0 AAA pairs — the exact defect SEARCH-01 was filed to fix.
- **Fix:** Widen the tolerance to 0.05. Clipped hexes in this band still read as the same colour family (clipped lighter blue is still clearly blue). Phase 4's clamp-direction rule (on clip, push interval back toward origin L) is untouched — this is a calibration tweak, not a rule change.
- **Files modified:** variant-search.js (searchLForBg gamut check)
- **Commit:** `213169c`

### Rule 2 / Rule 3 / Rule 4

None — no missing-functionality or architectural changes needed.

## Known Stubs

None. All public surface is fully wired. Wave 3 (`07-03`) will update `app.js:autoFindAndApply` to pass the threshold in and drop the post-filter (D-04).

## Self-Check: PASSED

- FOUND: variant-search.js contains `import { ... passesThreshold ... } from './colour-engine.js'`
- FOUND: variant-search.js does NOT contain `passesAA,` in its import list (replaced)
- FOUND: variant-search.js contains `const L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18];`
- FOUND: variant-search.js contains `function searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0)`
- FOUND: variant-search.js contains `export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)`
- FOUND: variant-search.js contains `if (lightPasses && darkPasses) return [];`
- FOUND: variant-search.js contains `passesThreshold(ratio, targetRatio)`
- FOUND: test/variant-search.test.js contains `describe('findVariantPairs — AAA (targetRatio = 7.0)'`
- FOUND: test/variant-search.test.js contains `describe('findVariantPairs — L-axis spread`
- FOUND: test/variant-search.test.js contains `describe('findVariantPairs — asymmetric search`
- FOUND: test/variant-search.test.js imports `srgbToOklab` from colour-engine
- FOUND: commit 242d3d1
- FOUND: commit 213169c
- FOUND: `node --test test/variant-search.test.js` exits 0 (21/21)
- FOUND: `node --test 'test/*.test.js'` exits 0 (107/107)
