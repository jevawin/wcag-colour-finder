---
phase: 07-search-correctness-spread
plan: 02
type: execute
wave: 2
depends_on: ["07-01"]
files_modified:
  - variant-search.js
  - test/variant-search.test.js
autonomous: true
requirements:
  - SEARCH-01
  - SEARCH-02
  - SEARCH-03
must_haves:
  truths:
    - "findVariantPairs accepts a targetRatio argument (positional, 5th param, default 4.5) and uses it throughout the search"
    - "At targetRatio=7.0 the function returns ≥1 pair for a colour where AAA is achievable (e.g. #2563EB on #ffffff/#000000), and every returned pair genuinely passes 7.0 on its respective BG"
    - "Results span the OKLab L axis — |result[last].lightL - result[0].lightL| ≥ 0.12 for a representative mid-grey input where spread is possible"
    - "result[0] remains the nearest passing pair by max(distLight, distDark)"
    - "When input already passes targetRatio on light BG, all returned pairs have lightHex === input hex (uppercased, with '#' prefix) and darkHex varies across 5 alts"
    - "Symmetric behaviour for the dark side (input passes dark → darkHex locked, lightHex varies)"
    - "When input passes both sides at targetRatio, findVariantPairs returns [] (empty array, not null)"
    - "Existing AA tests (#777777 default BGs) still pass unmodified"
  artifacts:
    - path: "variant-search.js"
      provides: "Threshold-aware, L-stretch, asymmetric-gated findVariantPairs"
      contains: "targetRatio"
    - path: "variant-search.js"
      provides: "L_STRETCH_SEEDS constant"
      contains: "L_STRETCH_SEEDS"
    - path: "test/variant-search.test.js"
      provides: "AAA + spread + asymmetric regression tests"
      contains: "targetRatio"
  key_links:
    - from: "variant-search.js"
      to: "colour-engine.js"
      via: "import { passesThreshold }"
      pattern: "passesThreshold"
    - from: "variant-search.js"
      to: "searchLForBg seeding"
      via: "seedDelta parameter widens search interval away from input L"
      pattern: "seedDelta"
---

<objective>
Refactor `variant-search.js` to:
1. Accept a `targetRatio` parameter on `findVariantPairs` and thread it into `searchLForBg` via the new `passesThreshold` helper (fixes SEARCH-01).
2. Layer an L-axis stretch-seed loop on top of the existing `A_OFFSETS` loop so the 5 returned pairs span a wider L range (fixes SEARCH-02).
3. Gate per side — if input already passes `targetRatio` on a BG, lock that side to the input hex and only search the failing side; if both pass, return `[]` (fixes SEARCH-03).

Purpose: single source of truth for "passing"; visible spread without losing the nearest-pair guarantee; honour user's input when it already works on one BG.

Output: refactored `variant-search.js` + extended `test/variant-search.test.js`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/07-search-correctness-spread/07-CONTEXT.md
@.planning/phases/07-search-correctness-spread/07-RESEARCH.md
@.planning/phases/07-search-correctness-spread/07-VALIDATION.md
@variant-search.js
@test/variant-search.test.js
@colour-engine.js

<interfaces>
<!-- Imports available from colour-engine.js after Wave 1 -->

```javascript
import {
  parseHex,
  srgbToOklab,
  oklabToSrgb,
  contrastRatio,
  passesThreshold,   // NEW in Wave 1 — use this instead of passesAA
  oklabDistance,
} from './colour-engine.js';
```

<!-- Final public signature this plan must produce -->

```javascript
/**
 * @param {string} inputHex
 * @param {string} lightBg
 * @param {string} darkBg
 * @param {number} count       - default 5
 * @param {number} targetRatio - default 4.5 (AA normal); use 7.0 for AAA normal
 * @returns {Array<{ lightHex: string, darkHex: string, distance: number }> | null}
 *   - Array of pairs (possibly empty if both sides already pass at targetRatio)
 *   - null only for invalid inputHex
 */
export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5);
```

<!-- Internal helper signatures to introduce -->

```javascript
// Biased binary search — seedDelta=0 preserves original "nearest passing" behaviour.
function searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0): string | null;

// L-axis stretch seeds. Index 0 = nearest (existing), indices 1..4 bias further along L.
const L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18];
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Thread targetRatio + add L-stretch seeding in variant-search.js</name>
  <read_first>
    - variant-search.js (full file — current searchLForBg at lines 57-92, findVariantPairs at 116-152, A_OFFSETS at 25)
    - colour-engine.js lines 80-91 (passes* helpers) and new passesThreshold from Wave 1
    - .planning/phases/07-search-correctness-spread/07-CONTEXT.md (D-01 through D-13)
    - .planning/phases/07-search-correctness-spread/07-RESEARCH.md Example 2 (threshold-aware searchLForBg with seedDelta, lines 340-386), Example 3 (L_STRETCH_SEEDS, lines 388-402), Example 4 (asymmetric branching, 404-430)
    - test/variant-search.test.js (existing AA regression surface — extend, do not replace lines 46-108)
  </read_first>
  <files>variant-search.js</files>
  <behavior>
    - `findVariantPairs('#777777', '#ffffff', '#000000')` (no targetRatio) returns ≥1 pair, each pair passes AA (4.5) on its respective BG — existing contract preserved.
    - `findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5)` returns identical shape; result[0] distance ≤ all other result distances.
    - `findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0)` returns a non-empty array; every lightHex gives contrastRatio(lightHex, '#ffffff') >= 7.0, every darkHex gives contrastRatio(darkHex, '#000000') >= 7.0.
    - For the results of `findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5)` with length >= 2: compute OKLab L for each lightHex; L-span (max − min across the list) >= 0.12. (We don't assert exactly 0.18 because gamut may tighten it; the test asserts ≥ 0.12 which is comfortably achievable for mid-grey input.)
    - result[0] still has the smallest distance (nearest pair is preserved).
    - Deduplication: no two results share the same `lightHex + '|' + darkHex` key.
    - `findVariantPairs('not-a-hex', '#ffffff', '#000000')` returns null.
  </behavior>
  <action>
    Edit `variant-search.js` in place (keep module header comment, keep imports style).

    Step A — Update imports at the top. Replace `passesAA` with `passesThreshold`:

    ```javascript
    import {
      parseHex,
      srgbToOklab,
      oklabToSrgb,
      contrastRatio,
      passesThreshold,
      oklabDistance,
    } from './colour-engine.js';
    ```

    Step B — Keep `A_OFFSETS = [0, 0.01, -0.01, 0.02, -0.02]` unchanged (D-08).

    Step C — Add the new constant just below `A_OFFSETS`:

    ```javascript
    // L-axis stretch seeds. Index 0 = nearest passing (existing behaviour).
    // Indices 1..4 progressively bias the binary-search starting bound away from
    // input L so results span the L axis (D-05, D-07). 0.18 chosen per
    // 07-RESEARCH.md Open Question 1 — ~20-30 JNDs, visible yet in-family.
    const L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18];
    ```

    Step D — Replace `searchLForBg` with the threshold- and seed-aware version. Signature becomes `(L, a, b, direction, bgHex, targetRatio, seedDelta = 0)`. Body per 07-RESEARCH Example 2 — the two changes vs current code are:
      1. Compute bounds from seedDelta:
         ```javascript
         let lo, hi;
         if (direction === 'darker') {
           lo = 0;
           hi = Math.max(0, L - seedDelta);
         } else {
           lo = Math.min(1, L + seedDelta);
           hi = 1;
         }
         if (hi <= lo) return null; // seed pushed past gamut — correct null signal (D-14)
         ```
      2. Swap `passesAA(ratio)` for `passesThreshold(ratio, targetRatio)` in the pass check.

    Keep everything else identical: 40 iterations, gamut round-trip check with 0.02 a/b tolerance and "push back toward origin L" rule (DO NOT change the gamut-clamp fix from Phase 4), `rgbToHex` helper untouched.

    Step E — Rewrite `findVariantPairs`. Signature:

    ```javascript
    export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5) {
      const rgb = parseHex(inputHex);
      if (!rgb) return null;

      // Per-side gating (D-09/D-10/D-11/D-12)
      const lightRatio = contrastRatio(inputHex, lightBg);
      const darkRatio  = contrastRatio(inputHex, darkBg);
      const lightPasses = lightRatio !== null && lightRatio >= targetRatio;
      const darkPasses  = darkRatio  !== null && darkRatio  >= targetRatio;

      if (lightPasses && darkPasses) return []; // D-12

      const origin = srgbToOklab(rgb.r, rgb.g, rgb.b);
      const candidates = new Map(); // key: lightHex+'|'+darkHex

      // Normalise input hex for locked-side output (uppercase, 7-char with '#').
      const inputNorm = normaliseHex(inputHex);

      for (const aOffset of A_OFFSETS) {
        const a = origin.a + aOffset;
        const b = origin.b;

        for (const seedDelta of L_STRETCH_SEEDS) {
          for (const lDir of ['darker', 'lighter']) {
            for (const dDir of ['darker', 'lighter']) {
              // Light side: locked to input if it already passes; else search.
              const lightHex = lightPasses
                ? inputNorm
                : searchLForBg(origin.L, a, b, lDir, lightBg, targetRatio, seedDelta);
              // Dark side: locked to input if it already passes; else search.
              const darkHex  = darkPasses
                ? inputNorm
                : searchLForBg(origin.L, a, b, dDir, darkBg,  targetRatio, seedDelta);

              if (!lightHex || !darkHex) continue;

              const lightRgb = parseHex(lightHex);
              const darkRgb  = parseHex(darkHex);
              if (!lightRgb || !darkRgb) continue;

              // D-13: locked-side distance is 0 by construction; Math.max picks the failing side.
              const distLight = lightPasses ? 0 : oklabDistance(rgb, lightRgb);
              const distDark  = darkPasses  ? 0 : oklabDistance(rgb, darkRgb);
              const distance  = Math.max(distLight, distDark);

              const key = lightHex + '|' + darkHex;
              if (!candidates.has(key) || candidates.get(key).distance > distance) {
                candidates.set(key, { lightHex, darkHex, distance });
              }
            }
          }
        }
      }

      return [...candidates.values()]
        .sort((x, y) => x.distance - y.distance)
        .slice(0, count);
    }
    ```

    Step F — Add a `normaliseHex(hex)` private helper above `findVariantPairs` (not exported):

    ```javascript
    function normaliseHex(hex) {
      const rgb = parseHex(hex);
      if (!rgb) return null;
      return rgbToHex(rgb.r, rgb.g, rgb.b); // '#XXXXXX' uppercase with '#'
    }
    ```

    Constraints / invariants:
    - Optimisation skip: when `lightPasses` is true, the `lDir` loop still iterates but every iteration produces the same `lightHex`; Map-dedup handles this. You MAY short-circuit with an `if (lightPasses && lDir !== 'darker') continue;` to avoid duplicate work (purely perf — observable behaviour identical). Apply same to darkPasses / dDir. Either approach is acceptable.
    - Do NOT hardcode `#ffffff`/`#000000`/`#111111` anywhere (Phase 4 D-10 invariant).
    - Keep the module header comment block at the top — update the `Exports:` line to reflect the new signature (`count = 5, targetRatio = 4.5`).
    - Update the JSDoc on `findVariantPairs` to describe the new `targetRatio` param, the `[]` return case (both pass), the `null` return case (invalid input).
    - Do NOT introduce any new npm deps.
  </action>
  <verify>
    <automated>node --test test/variant-search.test.js test/colour-engine.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `variant-search.js` contains `import { ... passesThreshold ... } from './colour-engine.js'`
    - `variant-search.js` does NOT contain `passesAA,` in the import list (replaced)
    - `variant-search.js` contains `const L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18];`
    - `variant-search.js` contains the signature `function searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0)`
    - `variant-search.js` contains the signature `export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)`
    - `variant-search.js` contains `if (lightPasses && darkPasses) return [];`
    - `variant-search.js` contains `passesThreshold(ratio, targetRatio)`
    - `node --test test/variant-search.test.js` exits 0 (all pre-existing AA tests still green)
    - `node --test test/colour-engine.test.js` exits 0
  </acceptance_criteria>
  <done>
    variant-search.js is threshold-aware, L-spread seeded, and asymmetric-gated. Existing AA tests still green. No post-filter yet removed — Wave 3 handles that.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend variant-search.test.js — AAA, spread, asymmetric, both-pass</name>
  <read_first>
    - test/variant-search.test.js (full file — existing patterns at lines 14-108)
    - variant-search.js (post-Task-1 state — new signature and behaviours)
    - colour-engine.js (srgbToOklab for spread measurement; contrastRatio for AAA assertions)
    - .planning/phases/07-search-correctness-spread/07-VALIDATION.md (per-requirement test map, lines 39-47)
    - .planning/phases/07-search-correctness-spread/07-RESEARCH.md §"Phase Requirements → Test Map" (lines 519-536)
  </read_first>
  <files>test/variant-search.test.js</files>
  <behavior>
    New describe blocks exercise:
    1. AAA returns pairs for achievable colours (SEARCH-01).
    2. Every returned pair at AAA genuinely passes 7.0 on its BG (SEARCH-01).
    3. 5-result L-span >= 0.12 for #777777 AA (SEARCH-02).
    4. result[0] remains the nearest by distance (SEARCH-02).
    5. Input that passes light BG at AAA → all lightHex equal input; darkHex varies; distLight effectively 0 (SEARCH-03 light-locked).
    6. Both-pass case returns [] (SEARCH-03, D-12).
    7. Toggling targetRatio flips lock state (AA-asymmetric → AAA-both-fail or vice versa — one scenario suffices).
  </behavior>
  <action>
    Append new `describe` blocks to `test/variant-search.test.js` AFTER the existing BG-parameter block. Keep existing tests and imports intact; add `srgbToOklab` to the imports:

    ```javascript
    import { contrastRatio, srgbToOklab, parseHex } from '../colour-engine.js';
    import { findVariantPairs } from '../variant-search.js';
    ```

    Add these blocks (use `assert` from `node:assert/strict` already imported):

    ```javascript
    // --- SEARCH-01: AAA returns pairs when colour space permits ---

    describe('findVariantPairs — AAA (targetRatio = 7.0)', () => {
      it('returns ≥1 pair for #2563EB on default BGs at AAA', () => {
        const results = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
        assert.ok(Array.isArray(results), 'should return an array');
        assert.ok(results.length >= 1, `expected >= 1 AAA pair, got ${results.length}`);
      });

      it('every lightHex at AAA passes 7.0 on the light BG', () => {
        const results = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
        for (const p of results) {
          const r = contrastRatio(p.lightHex, '#ffffff');
          assert.ok(r !== null && r >= 7.0,
            `${p.lightHex} on #ffffff: ${r?.toFixed(3)} fails AAA`);
        }
      });

      it('every darkHex at AAA passes 7.0 on the dark BG', () => {
        const results = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
        for (const p of results) {
          const r = contrastRatio(p.darkHex, '#000000');
          assert.ok(r !== null && r >= 7.0,
            `${p.darkHex} on #000000: ${r?.toFixed(3)} fails AAA`);
        }
      });

      it('default targetRatio remains 4.5 (back-compat)', () => {
        const aaDefault  = findVariantPairs('#777777', '#ffffff', '#000000');
        const aaExplicit = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
        assert.strictEqual(aaDefault.length, aaExplicit.length);
      });
    });

    // --- SEARCH-02: L-axis spread ---

    describe('findVariantPairs — L-axis spread (SEARCH-02)', () => {
      it('#777777 AA: lightHex L-span across 5 results >= 0.12 in OKLab', () => {
        const results = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
        assert.ok(results.length >= 2, 'need >= 2 results to measure spread');
        const Ls = results.map(p => {
          const rgb = parseHex(p.lightHex);
          return srgbToOklab(rgb.r, rgb.g, rgb.b).L;
        });
        const span = Math.max(...Ls) - Math.min(...Ls);
        assert.ok(span >= 0.12,
          `expected L-span >= 0.12, got ${span.toFixed(3)} from Ls=${Ls.map(l => l.toFixed(3)).join(',')}`);
      });

      it('result[0] has the smallest distance (nearest preserved)', () => {
        const results = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
        for (let i = 1; i < results.length; i++) {
          assert.ok(results[0].distance <= results[i].distance,
            `result[0].distance (${results[0].distance}) > result[${i}].distance (${results[i].distance})`);
        }
      });

      it('all results are distinct by lightHex+darkHex key', () => {
        const results = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
        const keys = new Set(results.map(p => p.lightHex + '|' + p.darkHex));
        assert.strictEqual(keys.size, results.length, 'duplicate pair(s) found');
      });
    });

    // --- SEARCH-03: Asymmetric + both-pass ---

    describe('findVariantPairs — asymmetric search (SEARCH-03)', () => {
      it('#000000 on #ffffff at AAA: all lightHex equal #000000 (light side locked)', () => {
        // Black on white = 21:1 — passes AAA on light. Dark side fails; must be searched.
        const results = findVariantPairs('#000000', '#ffffff', '#000000', 5, 7.0);
        assert.ok(Array.isArray(results));
        assert.ok(results.length >= 1, `expected >= 1 result, got ${results.length}`);
        for (const p of results) {
          assert.strictEqual(p.lightHex, '#000000',
            `lightHex should be locked to #000000, got ${p.lightHex}`);
        }
      });

      it('#000000 asymmetric case: darkHex values form 5 distinct alts (or all gamut-possible)', () => {
        const results = findVariantPairs('#000000', '#ffffff', '#000000', 5, 7.0);
        const darkHexes = new Set(results.map(p => p.darkHex));
        assert.ok(darkHexes.size >= 1, 'expected at least 1 distinct darkHex');
        // All darkHexes must genuinely pass AAA on #000000 BG.
        for (const hex of darkHexes) {
          const r = contrastRatio(hex, '#000000');
          assert.ok(r !== null && r >= 7.0,
            `${hex} on #000000: ${r?.toFixed(3)} fails AAA`);
        }
      });

      it('#ffffff on #000000 at AAA: all darkHex equal #FFFFFF (dark side locked)', () => {
        // White on black = 21:1 — passes AAA on dark. Light side fails; must be searched.
        const results = findVariantPairs('#ffffff', '#ffffff', '#000000', 5, 7.0);
        assert.ok(Array.isArray(results));
        assert.ok(results.length >= 1);
        for (const p of results) {
          assert.strictEqual(p.darkHex, '#FFFFFF',
            `darkHex should be locked to #FFFFFF, got ${p.darkHex}`);
        }
      });

      it('both-pass case returns [] — input already accessible on both BGs', () => {
        // A mid-grey against near-grey BGs both-fail normally; we contrive both-pass:
        // #000000 against a light-grey light BG (#cccccc gives ~17:1) and dark BG #000000 itself
        // is zero-contrast — bad. Use #000000 against #ffffff light and #888888 dark:
        //   #000000 vs #ffffff = 21:1 (passes AAA)
        //   #000000 vs #888888 = 5.92:1 (fails AAA 7.0 but passes AA 4.5)
        // So at AA (4.5) both sides pass → expect [].
        const results = findVariantPairs('#000000', '#ffffff', '#888888', 5, 4.5);
        assert.ok(Array.isArray(results));
        assert.strictEqual(results.length, 0,
          `expected [] for both-pass input, got ${results.length} pair(s)`);
      });

      it('threshold toggle flips lock state', () => {
        // #2563EB on #ffffff ≈ 5.17:1 — passes AA (light locked at AA) but fails AAA.
        // At AA: light side locked; at AAA: light side searched.
        const aaResults  = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 4.5);
        const aaaResults = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
        // At AA: lightHex should equal input (locked)
        if (aaResults.length > 0) {
          for (const p of aaResults) {
            assert.strictEqual(p.lightHex, '#2563EB',
              `AA: lightHex should be locked to input, got ${p.lightHex}`);
          }
        }
        // At AAA: at least one lightHex should differ from input (searched)
        if (aaaResults.length > 0) {
          const anyDiffers = aaaResults.some(p => p.lightHex !== '#2563EB');
          assert.ok(anyDiffers, 'AAA: expected at least one searched lightHex different from input');
        }
      });
    });
    ```

    Notes:
    - Contrast values in the both-pass test comment (`#000000` vs `#888888` ≈ 5.92:1) are approximate — the assertion only checks `results.length === 0`. If the chosen BG pair does not produce both-pass at AA, pick `#000000` + `#ffffff` + `#777777` or another combination that satisfies both-pass; verify locally by computing `contrastRatio('#000000', '#888888')` if needed. (Node can be used: `node -e "import('./colour-engine.js').then(m => console.log(m.contrastRatio('#000000','#888888')))"`.)
    - If `#2563EB` does not cleanly demonstrate the lock-flip (AA vs AAA), substitute a mid-tone that does — e.g. find a hex where `contrastRatio(hex, '#ffffff')` is in `[4.5, 7.0)`.  Verify empirically before committing.
    - Do not modify existing tests at lines 14-108.
  </action>
  <verify>
    <automated>node --test test/variant-search.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `test/variant-search.test.js` contains `describe('findVariantPairs — AAA (targetRatio = 7.0)'`
    - `test/variant-search.test.js` contains `describe('findVariantPairs — L-axis spread`
    - `test/variant-search.test.js` contains `describe('findVariantPairs — asymmetric search`
    - `test/variant-search.test.js` contains `'#000000', '#ffffff', '#000000', 5, 7.0`
    - `test/variant-search.test.js` imports `srgbToOklab` from colour-engine
    - `node --test test/variant-search.test.js` exits 0 with new cases included
    - `node --test 'test/*.test.js'` exits 0 (no regressions)
  </acceptance_criteria>
  <done>
    Test suite exercises SEARCH-01 (AAA returns + genuinely passes 7.0), SEARCH-02 (L-span + nearest preserved + distinct), SEARCH-03 (light-locked, dark-locked, both-pass empty, threshold toggle flips lock). Full suite green.
  </done>
</task>

</tasks>

<verification>
Run `node --test 'test/*.test.js'` — full suite green. Existing AA tests unchanged; new AAA/spread/asymmetric cases pass.
</verification>

<success_criteria>
- findVariantPairs signature includes `targetRatio = 4.5`
- AAA target returns genuinely-AAA-passing pairs for colours where possible
- L-span across 5 results measurable and ≥ 0.12 for mid-grey input
- Locked-side behaviour verified for light- and dark-pass inputs
- Both-pass returns `[]`
- Full test suite green
</success_criteria>

<output>
After completion, create `.planning/phases/07-search-correctness-spread/07-02-SUMMARY.md`. Note: final signature of `findVariantPairs`, chosen L-stretch seeds, any short-circuit optimisation for locked-side loops, observed L-span on `#777777`, any tests adjusted for empirical contrast values.
</output>
