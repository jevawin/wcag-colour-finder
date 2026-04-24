# Phase 7: Search Correctness & Spread - Research

**Researched:** 2026-04-24
**Domain:** Vanilla JS colour-search algorithm — OKLab L-axis binary search, threshold parameterisation, asymmetric pair construction, perceptual L-spread.
**Confidence:** HIGH

## Summary

Phase 7 fixes three correctness defects in `variant-search.js`:

1. **SEARCH-01 (AAA fix):** The current binary search converges on the AA passing point (`passesAA`, ratio ≥ 4.5). When `app.js:autoFindAndApply` post-filters by AAA (≥ 7.0), most or all pairs are dropped because the search converged just past 4.5, not past 7.0. Fix: parameterise `searchLForBg` with `targetRatio` so the binary search converges to the active threshold.
2. **SEARCH-02 (spread):** All 5 results currently cluster near the threshold crossing (binary search by design returns the *closest* passing point). Fix: re-seed the binary search 4 more times with successively offset L starting points past the crossing, producing a spread along the L axis. Layer this on top of the existing 5 `A_OFFSETS` for hue/chroma nuance.
3. **SEARCH-03 (asymmetric):** When the input already passes the active threshold on one background, lock that side to the input hex and only run the search on the failing side. Distance metric collapses to the failing side only.

All three are compatible with the existing OKLab monotonicity invariant (D-03 from Phase 3) and the Phase 4 `max(distLight, distDark)` distance metric. The fixes do not require any new dependencies — the project's vanilla JS / no-deps constraint holds. All maths stays in `colour-engine.js` and `variant-search.js`.

**Primary recommendation:** Add a `targetRatio` parameter to `searchLForBg` and `findVariantPairs`, add `passesThreshold(ratio, target)` to `colour-engine.js`, layer L-stretch seeds on top of existing `A_OFFSETS`, branch per-side on input-passing-at-threshold, and remove the `app.js` post-filter once the search itself is threshold-aware.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Threshold integration (SEARCH-01):**
- D-01: Parameterise `searchLForBg` with target ratio. Binary search converges to true passing point at active threshold (4.5 AA / 7.0 AAA).
- D-02: Threshold lives in `app.js`. App translates `state.target` → numeric ratio and passes into `findVariantPairs`. `variant-search.js` stays free of UI semantics.
- D-03: Add `passesThreshold(ratio, targetRatio)` helper to `colour-engine.js`. `searchLForBg` uses it. Existing `passesAA` / `passesAAA` stay for back-compat.
- D-04: Remove the post-filter in `app.js:autoFindAndApply` once the search is threshold-aware.

**Spread strategy (SEARCH-02):**
- D-05: Multi-seed L-axis stretch. Result 0 = nearest (existing behaviour). Results 1–4 seeded further along L past the threshold crossing.
- D-06: First result anchors on minimum `max(distLight, distDark)` — preserves v1.0 "least disruption" promise.
- D-07: Last result must differ from result 0 by minimum L-axis delta (0.15–0.25 — pick concrete value).
- D-08: Existing `A_OFFSETS = [0, 0.01, -0.01, 0.02, -0.02]` stays. L-stretch layered on top.

**Asymmetric search (SEARCH-03):**
- D-09: Per-side gating. Evaluate input contrast at active threshold. If input passes a side, lock that side to input hex.
- D-10: When one side locked, all 5 pairs share that side's hex; failing side gets 5 spread alts.
- D-11: "Passing" evaluated against `state.target`. Toggling AA/AAA re-evaluates the lock.
- D-12: Both sides pass at active threshold → empty results + "already accessible" status message.
- D-13: Distance metric when one side = input: failing-side distance only.

**Empty state vs no solution:**
- D-14: `searchLForBg` returning `null` is the genuine no-solution signal post-fix. No new return shape.
- D-15: Empty-state message stays as the current copy: "No accessible pair found for this colour".

### Claude's Discretion
- Exact L-axis stretch deltas for results 1–4 (D-05).
- Numeric value for the minimum L-delta guarantee (D-07) — range 0.15–0.25.
- Wording of the "already accessible" status message (D-12).
- Whether to refactor `findVariantPairs` signature to a target object or stay positional (`count`, then `targetRatio`).

### Deferred Ideas (OUT OF SCOPE)
- Threshold-aware empty-state copy ("No AAA pair — try AA?"). Single message stays per D-15.
- Surfacing distance/quality warnings on individual swatches (Phase 3 D-04 still holds).
- Auto-find triggers on AA/AAA toggle — Phase 8 (INPUT-02), not Phase 7.

## Project Constraints (from CLAUDE.md)

- Vanilla HTML/CSS/JS — no frameworks, no build step, no dependencies.
- All colour calculations client-side.
- British spelling in UI text (colour, not color); American spelling in code identifiers (color, ratio).
- Modern browsers only (no IE).
- Hand-rolled colour maths, OKLab matrices from Ottosson.
- WCAG AA normal text 4.5:1, AAA normal text 7.0:1. Tool focuses on normal text.
- Do NOT use any colour library (culori, chroma.js, tinycolor2, color.js).
- Do NOT use HSL, RGB Euclidean distance, or brute-force sRGB search for perceptual operations.
- GSD workflow enforcement — file edits go through a GSD command.
- Test runner: `node --test 'test/*.test.js'` (Node 24 native, zero deps).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEARCH-01 | AAA mode returns variant pairs whenever the colour space permits (fix defect where AAA currently never returns results) | Threshold parameterisation of `searchLForBg`; remove post-filter; `passesThreshold` helper. Monotonicity holds at ratio 7.0 (see Architecture Patterns). |
| SEARCH-02 | The 5 returned variant pairs span a wider L-axis range — nearest preserved, furthest extended | L-stretch seed strategy past threshold crossing; concrete L-delta value (recommend 0.18); layered on top of existing `A_OFFSETS`. |
| SEARCH-03 | When input already passes the active threshold on one background, that BG keeps the input verbatim; only the failing BG is searched | Per-side gating function; `evaluateSide(inputHex, bgHex, targetRatio)` → `{passes, locked: inputHex} | {passes: false, run search}`. Distance metric collapses to failing side. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node `node:test` | bundled with Node 24 | Test runner | Already used in project (Phase 1 D — see STATE.md). Zero deps, ships native. |
| `node:assert/strict` | bundled | Assertions | Already standard in `test/*.test.js`. |

### Supporting
None — phase is pure colour maths with no new infra.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `passesThreshold` | culori `wcagContrast()` | culori is ~30KB and pulls in conversions we already hand-roll. Project constraint forbids it. |
| Multi-seed L-stretch | Sample N points along L axis without binary search | Sampling skips the "nearest passing" guarantee for result 0. Binary search per seed preserves D-06. |
| New module `variant-search-v2.js` | In-place edit of `variant-search.js` | In-place keeps API surface; simpler diff for verifier; tests need fewer rewrites. |

**Installation:** None. No new packages.

**Version verification:** N/A — no new packages introduced.

## Architecture Patterns

### Recommended Project Structure
```
colour-engine.js     # add: passesThreshold(ratio, targetRatio)
variant-search.js    # edit: searchLForBg, findVariantPairs — accept targetRatio
                     # edit: per-side gating + L-stretch seeds
                     # add: helper(s) for stretch L offsets
app.js               # edit: autoFindAndApply — pass threshold, drop post-filter
                     # edit: empty-state branch for "already accessible"
test/                # extend each existing file; no new test files unless useful
  colour-engine.test.js
  variant-search.test.js
  app.test.js
```

### Pattern 1: Threshold-aware binary search

**What:** Replace the `passesAA(ratio)` call inside `searchLForBg` with `passesThreshold(ratio, targetRatio)`. Pass `targetRatio` through `findVariantPairs` from the call site.

**When to use:** Always — single source of truth for what "passing" means inside the search.

**Example:**
```javascript
// colour-engine.js — new export
export function passesThreshold(ratio, targetRatio) {
  return ratio >= targetRatio;
}

// variant-search.js — edited signature
function searchLForBg(L, a, b, direction, bgHex, targetRatio) {
  // ... existing binary search ...
  const ratio = contrastRatio(hex, bgHex);
  if (ratio !== null && passesThreshold(ratio, targetRatio)) {
    result = hex;
    if (direction === 'darker') lo = mid;
    else hi = mid;
  } else {
    if (direction === 'darker') hi = mid;
    else lo = mid;
  }
}

export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5) {
  // ... thread targetRatio into searchLForBg calls ...
}
```

**Source:** existing code at `variant-search.js:79`; D-01/D-03; OKLab monotonicity per Ottosson (https://bottosson.github.io/posts/oklab/).

### Pattern 2: L-axis stretch seeding

**What:** After finding the nearest passing L for a given (a, b, direction, bg), re-run the search with the L starting point biased further past the threshold crossing. Each seed produces a different convergence point.

**Two implementation strategies:**

**Strategy A — re-seed binary search starting bound (recommended).**
For `direction = 'darker'`, the existing search uses `lo = 0; hi = L`. To force convergence further from the input, lower the upper bound: `hi = L_passing - delta`. The search now finds the nearest passing point in a *narrower, further* sub-interval.

```javascript
// Pseudocode for spread search past the nearest crossing
function searchLForBgWithSeed(L, a, b, direction, bgHex, targetRatio, seedDelta) {
  // seedDelta = 0 → original behaviour
  // seedDelta > 0 → search further from L
  let lo, hi;
  if (direction === 'darker') {
    lo = 0;
    hi = Math.max(0, L - seedDelta);  // bias hi away from input
  } else {
    lo = Math.min(1, L + seedDelta);  // bias lo away from input
    hi = 1;
  }
  // ... rest of binary search identical ...
}
```

For 5 results: `seedDeltas = [0, 0.05, 0.10, 0.15, 0.20]` (concrete recommendation in Code Examples). Result 0 (`seedDelta = 0`) is the existing nearest-passing behaviour; results 1–4 progressively walk down the L axis.

**Strategy B — sample then verify.**
Pick N L offsets past the crossing, snap each to the nearest passing point via a short binary search. More flexible but harder to reason about edge cases.

**Recommendation:** Strategy A. Reuses one search function with a parameter; preserves binary-search optimality per seed; bounded iteration count.

**When to use:** Always for results 1..4. Result 0 always uses `seedDelta = 0`.

**Edge case:** when seed pushes `hi <= lo`, the search returns `null` (gamut/threshold limit hit). That seed contributes nothing and the result list ends up < 5. This is correct behaviour — fewer alts when the colour space is sparse.

### Pattern 3: Per-side gating (asymmetric search)

**What:** Before invoking the search, evaluate input contrast at the active threshold against each background. If input passes a side, lock that side to the input hex; only run the search on the failing side.

**Example:**
```javascript
function evaluateSide(inputHex, bgHex, targetRatio) {
  const ratio = contrastRatio(inputHex, bgHex);
  return {
    passes: ratio !== null && ratio >= targetRatio,
    inputHex,
  };
}

export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5) {
  const lightSide = evaluateSide(inputHex, lightBg, targetRatio);
  const darkSide  = evaluateSide(inputHex, darkBg,  targetRatio);

  if (lightSide.passes && darkSide.passes) return [];          // D-12: empty
  if (lightSide.passes) return runFailingSide('dark', ...);    // light locked
  if (darkSide.passes)  return runFailingSide('light', ...);   // dark locked
  return runBothSides(...);                                    // existing dual-pair path
}
```

**When to use:** Always — gating is the entry point; existing dual-search runs only in the both-fail branch.

**Source:** D-09, D-10, D-13.

### Pattern 4: Distance metric collapse

**What:** When one side is locked to the input hex, the locked-side distance is 0. `max(distLight, distDark) = max(0, distFailing) = distFailing`. Document and use this directly — no special case needed.

**Source:** D-13. Mathematically equivalent; documented for clarity.

### Anti-Patterns to Avoid

- **Don't refactor `searchLForBg` to read threshold from a module-level constant.** Threshold must be a parameter — `app.js` owns it (D-02).
- **Don't keep both the post-filter in `app.js` AND a threshold-aware search.** Single source of truth (D-04). The post-filter masks search bugs; remove it.
- **Don't hand-roll a new contrast formula.** `contrastRatio` already exists in `colour-engine.js` and is correct (W3C 0.04045 threshold, 2.4 exponent, raw float).
- **Don't change the existing `A_OFFSETS` array.** Layer L-stretch on top (D-08). Existing 5 a-offsets × new 5 L-stretch seeds = up to 25 candidates per (lDir, dDir) combination — Map-deduplication already handles overlaps.
- **Don't introduce `oklch()` CSS or any new OKLCH library code.** All maths stays in JS. CLAUDE.md guardrail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Threshold check | A new `passesAA7`/`passesXThreshold` per ratio | `passesThreshold(ratio, targetRatio)` — single helper | One generic, two existing-name back-compat helpers (D-03). |
| Pair distance | A new asymmetric distance function | `oklabDistance` + `Math.max` (and `0` for locked side per D-13) | Existing pattern; D-13 explicitly maps to `max(0, distFailing)`. |
| L-stretch ordering | Re-implement sort | `[...candidates.values()].sort((x, y) => x.distance - y.distance)` is already there | Existing line at `variant-search.js:150`. Add post-sort enforcement only if min-L-delta fails. |
| Gamut detection | New gamut check | Existing round-trip check in `searchLForBg` (lines 70–75) | Already correct, already battle-tested in Phase 4 fix (see STATE.md "Fixed pre-existing searchL gamut-boundary bug"). |

**Key insight:** Phase 7 is small-surface — it's a parameter addition, two new branches, and a seeding loop. Almost everything reuses existing primitives.

## Common Pitfalls

### Pitfall 1: Monotonicity holds at AAA but gamut limits hit sooner

**What goes wrong:** AAA (7.0:1) needs more luminance separation than AA (4.5:1). For mid-tone saturated colours, the L axis runs out of gamut before reaching a passing point.

**Why it happens:** OKLab `(L, a, b)` triples can produce out-of-gamut sRGB. The existing round-trip a/b drift check catches this. As targetRatio rises, the passing band moves further from the input L, and the gamut wall is hit earlier.

**How to avoid:** Don't try to coerce a passing result. `searchLForBg` returning `null` IS the correct signal (D-14). Empty result list is honest — Phase 1 already proved gamut-clamp behaviour is solid.

**Warning signs:** A pure mid-saturation hue (e.g. fully saturated cyan `#00ffff` against white BG, AAA target) returns 0 results. Verify by checking white BG contrast: `#00ffff` vs `#ffffff` = 1.25:1; even max-darken cyan stays low-contrast on white. This is genuine no-solution.

### Pitfall 2: Result 0 must keep the v1.0 "minimum disruption" semantics

**What goes wrong:** L-stretch seeds change the candidate set. If sort tie-breaks differently, result 0 may not be the historical "nearest passing" pair → regression on success criterion 4 ("Existing AA dual-pair behaviour continues to work").

**Why it happens:** Spread seeds add candidates further from the input. Existing sort by `max(distLight, distDark)` ascending should still place the `seedDelta = 0` candidate first — but only if its distance is genuinely the smallest, which it is by construction.

**How to avoid:** Always include `seedDelta = 0` in the seed list. Verify via test: `findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5)[0]` matches the v1.0 nearest result within tolerance.

**Warning signs:** AA test for `#777777` returns a result 0 with `distance > previous_distance`. Investigate seed loop bug.

### Pitfall 3: AAA toggle leaves stale `appliedLight`/`appliedDark`

**What goes wrong:** User selects an alt at AA, toggles to AAA, search re-runs, `state.alts` updates but `state.appliedLight` still references the old hex which may not exist in the new list (or worse: it does but isn't a sensible default).

**Why it happens:** `app.js:autoFindAndApply` already nulls `appliedLight/Dark` on toggle (lines 337–338) — that path is fine. Risk is the asymmetric branch: when one side is locked to input, all 5 alts share that side's hex. If the user previously selected an alt on the other side, mismatch on `lightHex === a.lightHex` filtering.

**How to avoid:** Already null-resets on toggle. For the locked-side branch, ensure `state.appliedLight = state.base` (or `appliedDark = state.base`) when that side is locked, so the panel renders the input on the locked side. Plan should make this explicit.

**Warning signs:** UI test: enter `#000000`, default BGs, toggle AAA. Light side should show black on white (passes AAA at 21:1). Dark side should show 5 lighter alts. Verify panel renders correctly and copy-button on light side reads `#000000`.

### Pitfall 4: Spread seeds can produce duplicate hexes after rounding to sRGB

**What goes wrong:** Two seed values converge to the same passing L (rounded to integer 0–255 sRGB). Map deduplication by `lightHex+'|'+darkHex` already handles this — but final result count drops below 5.

**Why it happens:** L axis is continuous; sRGB is 8-bit. Adjacent L values can map to the same hex.

**How to avoid:** Accept it as natural consequence of bit depth. Test on real colours and confirm 5 distinct results emerge in normal cases. If a colour cannot produce 5 distinct results, that is a genuine sparse-space outcome and `count` returned naturally.

**Warning signs:** Common case (e.g. `#2563EB`) returns < 5 results. Check seed-delta values are spaced wide enough — recommend 0.05 minimum step.

### Pitfall 5: Performance regression — 5× search count

**What goes wrong:** Existing search runs `5 a-offsets × 4 direction combos × 1 search-per-side = 40 binary searches` (per side: `~2` × `2` direction inputs since 4 combos × 2 sides = 8 search calls × 5 a-offsets = 40 — actually `5 × 4 × 2 = 40` searches @ 40 iterations each = 1600 iterations).

With L-stretch (5 seeds), this becomes `5 × 4 × 2 × 5 = 200` searches × 40 iterations = 8000 iterations. Each iteration is a few cbrt + matrix multiplies + contrastRatio call.

**Why it happens:** Multiplicative growth from layering.

**How to avoid:** Measure. JS V8 cbrt + multiply should run sub-microsecond — 8000 iterations is well below 50ms even on a slow CPU. Confirm with a `console.time` test in planning. If too slow, reduce a-offsets to 3 or merge with stretch seeds.

**Warning signs:** Manual UX feels laggy on `setBase` keystroke. Benchmark via test or browser DevTools.

### Pitfall 6: `passesThreshold` shadowing existing `passesAA`/`passesAAA` semantics

**What goes wrong:** Tests for `passesAA` start failing because something else uses `passesThreshold(ratio, 4.5)` and a future refactor accidentally breaks the back-compat path.

**Why it happens:** D-03 says keep `passesAA`/`passesAAA` for back-compat. If implementation deletes them, regressions cascade.

**How to avoid:** Keep both. New code uses `passesThreshold`; existing exports stay. Tests validate both still work.

## Runtime State Inventory

> Phase 7 is a code-only refactor — no migrations, no service config, no OS state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by reading STATE.md (no DBs, no localStorage, no IndexedDB usage in app) | None |
| Live service config | None — verified by reading config.json and project structure (static site, no backend) | None |
| OS-registered state | None — verified by project type (browser-only static site) | None |
| Secrets/env vars | None — verified by absence of `.env`, no API keys referenced in source | None |
| Build artifacts | None — verified by CLAUDE.md "no build step" and absence of `dist/`, `node_modules/` (only test infra is `node:test` native) | None |

**Conclusion:** Pure code edit. No runtime state to migrate.

## Code Examples

### Example 1: `passesThreshold` helper

```javascript
// colour-engine.js — append after passesAAALarge

/**
 * Threshold-parameterised pass check. Returns true if `ratio` is at or above
 * the supplied target. Used by variant-search to converge to the active
 * threshold (4.5 for AA normal, 7.0 for AAA normal).
 *
 * @param {number} ratio       - Raw contrast ratio float (do not pre-round)
 * @param {number} targetRatio - 4.5, 7.0, or any custom threshold
 * @returns {boolean}
 */
export function passesThreshold(ratio, targetRatio) {
  return ratio >= targetRatio;
}
```

**Source:** D-03; existing pattern of `passesAA` at `colour-engine.js:82`.

### Example 2: Threshold-aware `searchLForBg` with seed delta

```javascript
// variant-search.js — edited

/**
 * Binary search on the OKLab L axis for the closest shade that passes
 * `targetRatio` against `bgHex`. Optional seedDelta biases the starting
 * bound past the threshold crossing for L-axis spread.
 */
function searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0) {
  let lo, hi;
  if (direction === 'darker') {
    lo = 0;
    hi = Math.max(0, L - seedDelta);
  } else {
    lo = Math.min(1, L + seedDelta);
    hi = 1;
  }
  if (hi <= lo) return null; // seed pushed past gamut

  let result = null;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const { r, g: gv, b: bv } = oklabToSrgb(mid, a, b);
    const hex = rgbToHex(r, gv, bv);

    const roundTrip = srgbToOklab(r, gv, bv);
    if (Math.abs(roundTrip.a - a) > 0.02 || Math.abs(roundTrip.b - b) > 0.02) {
      if (direction === 'darker') lo = mid;
      else hi = mid;
      continue;
    }

    const ratio = contrastRatio(hex, bgHex);
    if (ratio !== null && passesThreshold(ratio, targetRatio)) {
      result = hex;
      if (direction === 'darker') lo = mid;
      else hi = mid;
    } else {
      if (direction === 'darker') hi = mid;
      else lo = mid;
    }
  }
  return result;
}
```

### Example 3: L-stretch seed list

```javascript
// variant-search.js — new constant

// L-axis stretch seeds. Index 0 = original behaviour (nearest passing).
// Indices 1..4 progressively bias the search starting bound away from L
// for visibly distinct shades. Values chosen so result[4] differs from
// result[0] by ~0.18 in OKLab L (perceptually clear, stays in colour family).
//
// OKLab L is roughly perceptually uniform — JNDs at L=0.5 are around
// 0.005–0.01. A 0.18 delta is ~20–30 JNDs, comfortably visible without
// crossing into a different colour family.
const L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18];
```

### Example 4: Asymmetric branching in `findVariantPairs`

```javascript
export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5) {
  const rgb = parseHex(inputHex);
  if (!rgb) return null;

  const lightRatio = contrastRatio(inputHex, lightBg);
  const darkRatio  = contrastRatio(inputHex, darkBg);
  const lightPasses = lightRatio !== null && lightRatio >= targetRatio;
  const darkPasses  = darkRatio  !== null && darkRatio  >= targetRatio;

  // D-12: input already accessible on both → empty
  if (lightPasses && darkPasses) return [];

  // D-09 / D-10: one side locked, search only the failing side
  if (lightPasses) {
    return findFailingSideOnly(rgb, inputHex, darkBg, 'dark', count, targetRatio);
  }
  if (darkPasses) {
    return findFailingSideOnly(rgb, inputHex, lightBg, 'light', count, targetRatio);
  }

  // Both fail — existing dual-pair behaviour with L-stretch
  return findBothSides(rgb, lightBg, darkBg, count, targetRatio);
}
```

### Example 5: `app.js` post-filter removal

```javascript
// Before (current app.js:244-271) — post-filter approach
function autoFindAndApply() {
  const pairs = findVariantPairs('#' + state.base, '#' + state.light, '#' + state.dark) || [];
  const threshold = state.target === 'AAA' ? 7.0 : 4.5;
  const filtered = pairs.filter(p => { ... }).map(p => ({ ... }));
  // ...
}

// After — threshold passed in, no post-filter
function autoFindAndApply() {
  const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;
  const pairs = findVariantPairs(
    '#' + state.base,
    '#' + state.light,
    '#' + state.dark,
    5,
    targetRatio,
  ) || [];
  state.alts = pairs.map(p => ({
    lightHex: p.lightHex.replace(/^#/, '').toUpperCase(),
    darkHex:  p.darkHex.replace(/^#/, '').toUpperCase(),
    distance: p.distance,
  }));
  // ... rest of function unchanged
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AA-only fixed threshold in search | Threshold-parameterised search | Phase 7 | SEARCH-01 fix; AAA returns results when colour space allows. |
| Single nearest-crossing convergence | Multi-seed L-stretch | Phase 7 | SEARCH-02 fix; visible spread across the L axis. |
| Symmetric dual-search regardless of input state | Per-side gating | Phase 7 | SEARCH-03 fix; preserves user's input when already accessible. |
| Post-filter in `app.js` | Threshold-aware search | Phase 7 | Single source of truth; fewer false negatives. |

**Deprecated/outdated:** Phase 5-06 post-filter pattern (added in 05-06, see STATE.md). Was a deliberate trade-off then ("fewer AAA results when space is sparse"); Phase 7 supersedes it.

## Open Questions

1. **Concrete value for D-07 minimum L-delta (0.15–0.25 range).**
   - What we know: OKLab JND at mid-L is ~0.005–0.01. 0.15 = ~15–30 JNDs (clearly visible). 0.25 ≈ 25–50 JNDs (very distinct, may start nudging toward "different shade family").
   - What's unclear: User's tolerance for distinct-vs-recognisable.
   - Recommendation: Pick **0.18** for D-07. Maps to seed list `[0, 0.05, 0.10, 0.15, 0.18]`. Test empirically with `#2563EB`, `#777777`, and a saturated mid-tone — verify result[4] is visibly distinct but recognisable as same colour family. Adjust during planning if visual review shows otherwise.

2. **Should `findVariantPairs` accept a target object or stay positional?**
   - What we know: Current signature `(inputHex, lightBg, darkBg, count = 5)`. Adding `targetRatio` as 5th positional is straightforward.
   - What's unclear: Future-proofing (e.g. large-text variants in v1.2+).
   - Recommendation: **Stay positional** for Phase 7. Append `targetRatio = 4.5` as 5th param. Keep the API minimal; revisit if v1.2 adds another orthogonal axis.

3. **Should L-stretch seeds re-seed per a-offset, or share the same L crossing across a-offsets?**
   - What we know: Each `aOffset` shifts the colour identity slightly. The threshold-crossing L depends on a (and bg).
   - What's unclear: Whether per-aOffset re-search adds value or just cost.
   - Recommendation: **Re-seed per a-offset** — already required by current loop structure; cost is acceptable per Pitfall 5 estimate. Keeps each candidate self-consistent.

4. **Min-L-delta enforcement: re-seed if too tight, or accept as-is?**
   - What we know: D-07 requires `|result[4].lightL - result[0].lightL| >= chosen_min`. Recommended seed list typically produces ~0.18 delta.
   - What's unclear: When candidates collapse (high gamut pressure), seeds may converge.
   - Recommendation: **Accept as-is**. If the colour space cannot produce the L-delta, returning a tighter spread is honest. Validate via test rather than enforcement loop. Document limitation in test assertion.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner (`node --test`) | ✓ | 24.x (per STATE.md, Phase 1) | — |
| `node:test` | Existing tests | ✓ | bundled | — |
| `node:assert/strict` | Existing tests | ✓ | bundled | — |
| Browser (modern) | App runtime | ✓ | Chromium/Firefox/Safari current | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js native `node:test` + `node:assert/strict` |
| Config file | None — invoked via npm script or direct CLI |
| Quick run command | `node --test test/variant-search.test.js` |
| Full suite command | `node --test test/*.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEARCH-01 | AAA at 7.0 returns ≥1 pair for a colour where AAA is achievable (e.g. `#2563EB`) | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-01 | AAA at 7.0 returns `[]` (empty array) — not `null` — for a colour where no AAA pair exists due to gamut limits | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-01 | Every returned pair at AAA target genuinely passes 7.0 on its respective BG | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-01 | `passesThreshold(ratio, targetRatio)` correctness across boundaries | unit | `node --test test/colour-engine.test.js` | ✅ (extend) |
| SEARCH-02 | `result[4].lightL - result[0].lightL` ≥ chosen min-delta (0.18) for a representative colour (`#777777`, AA) | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-02 | `result[0]` is closer to input (smaller `max(distLight, distDark)`) than `result[4]` | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-02 | All 5 results are distinct (deduplicated by `lightHex+darkHex` key) | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-03 | Black `#000000` on white BG @ AAA: all returned pairs share `lightHex = '#000000'` | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-03 | Black `#000000` on white BG @ AAA: dark-side hexes form 5 distinct alts | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-03 | Toggle AA→AAA flips lock state (e.g. a colour that passes light at AA but fails light at AAA goes from "asymmetric" to "both fail") | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| SEARCH-03 | Both-pass case returns `[]` (e.g. white text input with a dark light-BG and dark-BG that both have low contrast — contrived, document) | unit | `node --test test/variant-search.test.js` | ✅ (extend) |
| Regression | `#777777` on default BGs at AA returns ≥1 pair, all pass AA on respective BG (existing test) | unit | `node --test test/variant-search.test.js` | ✅ (existing) |
| Regression | Pairs sorted ascending by distance (existing test) | unit | `node --test test/variant-search.test.js` | ✅ (existing) |
| Regression | Different `darkBg` produces different pair set (existing test) | unit | `node --test test/variant-search.test.js` | ✅ (existing) |
| Integration | `app.js:autoFindAndApply` passes `targetRatio` and stops post-filtering | manual + smoke | open `index.html` in browser, toggle AA/AAA, verify 5 alts at each setting | ❌ manual |
| Performance | `findVariantPairs` returns within budget (recommend < 50ms on representative input) | unit | `node --test test/variant-search.test.js` (with `console.time`) | ❌ Wave 0 if added |

### Sampling Rate
- **Per task commit:** `node --test test/variant-search.test.js` (~50ms — primary regression surface).
- **Per wave merge:** `node --test test/*.test.js` (full suite — colour-engine + variant-search + app + url-state).
- **Phase gate:** Full suite green; manual browser smoke test (toggle AA/AAA on `#2563EB`, `#000000`, `#777777`); visual review of L-spread.

### Wave 0 Gaps

- [ ] No new test files needed — extend existing `test/variant-search.test.js`, `test/colour-engine.test.js`, `test/app.test.js`.
- [ ] Existing `variant-search.test.js` assertions encode AA-only assumptions:
  - Lines 47–56: "every lightHex passes AA on the supplied light BG" — keep as AA-default test; add a parallel AAA test with `targetRatio = 7.0`.
  - Lines 59–68: "every darkHex passes AA on the supplied dark BG" — same treatment.
  - Lines 75–83: "pairs are sorted by ascending distance" — should still hold; verify under both AA and AAA.
  - Lines 88–107: "different darkBg produces different pair set" — BG variation, unaffected by threshold change. Keep.
- [ ] `findVariantPairs` test calls (5 existing) all use the 4-arg signature. After D-01 they must still work (default `targetRatio = 4.5`). New AAA tests pass `targetRatio = 7.0` explicitly.
- [ ] No framework install needed — Node 24 `node:test` already used.
- [ ] No new test config — direct CLI invocation continues.

## Sources

### Primary (HIGH confidence)
- **In-repo:** `variant-search.js`, `colour-engine.js`, `app.js` — current implementation truth.
- **In-repo:** `.planning/STATE.md` — phase history, including Phase 5-06 post-filter decision (lines 110–111) and Phase 7 blocker note (line 126).
- **In-repo:** `.planning/phases/03-variant-search/03-CONTEXT.md` — original OKLab L-axis binary search rationale.
- **In-repo:** `.planning/phases/04-modes-and-configuration/04-CONTEXT.md` — dual-pair output, `max(distLight, distDark)` distance metric, BG parameterisation.
- **In-repo:** `.planning/phases/07-search-correctness-spread/07-CONTEXT.md` — locked decisions D-01 through D-15.
- **In-repo:** `CLAUDE.md` — vanilla constraint, OKLab matrices, no-deps rule, WCAG thresholds.
- **External:** OKLab spec by Björn Ottosson — https://bottosson.github.io/posts/oklab/ (perceptual uniformity / monotonicity claim).
- **External:** WCAG 2.1 contrast ratio — https://www.w3.org/TR/WCAG21/relative-luminance.html (4.5/7.0 thresholds).

### Secondary (MEDIUM confidence)
- OKLCH in CSS (Evil Martians) — https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl (perceptual JND ranges informing L-delta choice).
- Existing test files (`test/*.test.js`) — encode current contract; verified by running mentally against current source.

### Tertiary (LOW confidence)
- None. All Phase 7 decisions are derived from existing code + locked CONTEXT.md decisions; no speculative external claims.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; reuses existing `node:test`.
- Architecture: HIGH — additive parameter changes + branching; preserves all v1.0 invariants.
- Pitfalls: HIGH — pitfalls derived from reading the actual code paths, not speculation.

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days — stable scope, no fast-moving deps)

## RESEARCH COMPLETE

**Phase:** 7 - Search Correctness & Spread
**Confidence:** HIGH

### Key Findings
- Phase 7 is small-surface: 1 new helper (`passesThreshold`), 1 new param on two existing functions (`searchLForBg`, `findVariantPairs`), 1 new constant (`L_STRETCH_SEEDS`), 1 entry-point branch (per-side gating), and the `app.js` post-filter removal.
- Recommended L-stretch seed list: `[0, 0.05, 0.10, 0.15, 0.18]`. D-07 concrete value: **0.18**.
- Recommended `findVariantPairs` signature: positional, `(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)`. Default 4.5 keeps existing test signatures green without rewrites.
- All v1.0 success-criterion 4 regression tests stay green by construction: `seedDelta = 0` is always seed[0], `targetRatio` defaults to 4.5, sort order unchanged.
- No runtime state, no migrations, no external deps. Pure code refactor.

### File Created
`.planning/phases/07-search-correctness-spread/07-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Reuses Node native test runner; zero new deps. |
| Architecture | HIGH | Additive changes preserve OKLab monotonicity invariant; branching is mechanical. |
| Pitfalls | HIGH | All pitfalls grounded in real code paths and STATE.md history. |

### Open Questions
1. Exact L-delta value (recommended 0.18, in 0.15–0.25 range — final choice during planning).
2. Whether to enforce min-L-delta with re-seeding or accept gamut-limited tightening (recommended: accept).
3. "Already accessible" message wording for D-12 (Claude's discretion at plan time).

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
