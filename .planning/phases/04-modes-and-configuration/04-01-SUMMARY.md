---
phase: 04-modes-and-configuration
plan: 01
subsystem: variant-search-and-url-state
tags: [pure-functions, tdd, refactor]
requires:
  - colour-engine.js (parseHex, srgbToOklab, oklabToSrgb, contrastRatio, passesAA, oklabDistance)
provides:
  - findVariantPairs(inputHex, lightBg, darkBg, count) — dual-pair search with BG parameters
  - parseHashState(hash) / buildHashPath({fg, lightBg, darkBg}) — pure URL hash state
  - DISTANCE_WARNING_THRESHOLD (unchanged at 0.12)
affects:
  - app.js (NEXT PLAN — must switch from findVariants to findVariantPairs, wire URL sync)
  - test/app.test.js (NEXT PLAN — expected to break until app.js is rewired)
tech_stack:
  added: []
  patterns:
    - "Pure ES module, no DOM — same convention as colour-engine.js"
    - "node:test with deepStrictEqual for object assertions, strictEqual for scalars"
    - "TDD RED → GREEN with separate commits per step"
key_files:
  created:
    - url-state.js
    - test/url-state.test.js
  modified:
    - variant-search.js
    - test/variant-search.test.js
decisions:
  - "Distance metric = max(distLight, distDark) — conservative pair warning"
  - "Try all 4 direction combinations per a-offset and keep the one with smallest distance"
  - "URL hash format: #/<fg>/<lightBg>/<darkBg>, all 6-digit lowercase, no # per segment"
  - "Fixed pre-existing gamut-boundary bug: on clamp, move search back toward origin L, not further toward the boundary"
metrics:
  tasks: 2
  files_changed: 4
  commits: 4
  tests_added: 24
  tests_passing: 59
  duration_min: ~15
  completed: 2026-04-18
---

# Phase 4 Plan 1: Variant Pair Search and URL State Summary

Built the pure-logic foundation for Phase 4: a new `url-state.js` module with `parseHashState` / `buildHashPath`, plus a rewrite of `variant-search.js` from single-variant `findVariants` to dual-pair `findVariantPairs` that takes both backgrounds as parameters.

## What Changed

### `url-state.js` (new)

Pure ES module, no DOM. Two exports:

```js
parseHashState(hash) → { fg, lightBg, darkBg } | null
buildHashPath({ fg, lightBg, darkBg }) → '#/<fg>/<lightBg>/<darkBg>'
```

Accepts `#/`, `/`, or bare prefixed hash, tolerates trailing slash, normalises case to lowercase, and requires exactly three 6-digit hex segments. Returns `null` for anything else (including 3-digit hex — per D-16 the URL always carries full 6-digit values).

### `variant-search.js` (rewritten)

Removed hardcoded `LIGHT_BG` and `DARK_BG` constants. Renamed `searchL` to `searchLForBg` and changed its pass condition from "passes AA on either BG" to "passes AA on the single supplied bgHex". Replaced `findVariants` with:

```js
findVariantPairs(inputHex, lightBg, darkBg, count = 5)
  → Array<{ lightHex, darkHex, distance }> | null
```

For each of the 5 a-channel offsets, we try all four direction combinations (light side darker/lighter × dark side darker/lighter) and keep the pair with the smallest `max(distLight, distDark)`. Light backgrounds typically want a darker foreground, dark backgrounds typically want a lighter one — but for edge inputs (very saturated, or near-white/near-black), both shades can lie in the same direction, so we exhaust the four combinations.

`DISTANCE_WARNING_THRESHOLD = 0.12` is unchanged.

## Tests

- `test/url-state.test.js` — 14 tests: valid inputs (case handling, trailing slash), invalid inputs (empty, 2-seg, 4-seg, invalid chars, 3-digit, null, undefined), buildHashPath lowercase behaviour, round-trip.
- `test/variant-search.test.js` — rewritten: 10 tests covering pair shape, AA compliance on each supplied BG, sort order, BG-parameter honoured (different darkBg → different darkHex), count limit, constant preservation.
- Full suite: 59 tests passing across colour-engine, url-state, variant-search.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Gamut-boundary direction flipped in pre-existing `searchL`**
- **Found during:** Task 2 GREEN step — `findVariantPairs('#2563EB', '#ffffff', '#000000')` returned `[]` because the dark-side lighter search always bailed out at the gamut check.
- **Issue:** On gamut rejection, the code moved the interval toward the gamut boundary (`lo = mid` for lighter direction, pushing `lo` upward toward `L=1`), not away. The Phase 3 "passes either BG" logic masked this because lightening always trivially passed on white.
- **Fix:** Swapped both branches in `searchLForBg` — on gamut clamp, move the interval back toward origin L. `darker` → `lo = mid` (lo up toward L); `lighter` → `hi = mid` (hi down toward L).
- **Files modified:** `variant-search.js`
- **Commit:** 831cd3f

## Known Stubs

None.

## Follow-ups for Plan 04-02

- `app.js` still imports `findVariants` — must switch to `findVariantPairs(hex, lightBg, darkBg)` and supply BG values from state.
- `app.js` still hardcodes `DARK_BG = '#111111'` — must replace with state-backed dark BG default `#000000` and read from `url-state`.
- `test/app.test.js` will break on the `findVariants` import path — addressed in plan 04-02 per plan success criteria.

## Self-Check: PASSED

- url-state.js exists
- test/url-state.test.js exists
- variant-search.js has `findVariantPairs` export, no `findVariants`, no `DARK_BG`/`LIGHT_BG`/`#111111`
- All 4 task commits exist: 57d28c9, 46981ef, 575d5fc, 831cd3f
- `node --test test/url-state.test.js test/variant-search.test.js test/colour-engine.test.js` exits 0 (59 passing)
