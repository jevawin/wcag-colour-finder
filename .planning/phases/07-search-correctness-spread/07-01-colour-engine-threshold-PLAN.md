---
phase: 07-search-correctness-spread
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - colour-engine.js
  - test/colour-engine.test.js
autonomous: true
requirements:
  - SEARCH-01
must_haves:
  truths:
    - "colour-engine.js exports a passesThreshold(ratio, targetRatio) function that returns true iff ratio >= targetRatio"
    - "passesAA and passesAAA still exist and behave identically to before"
    - "Tests cover passesThreshold at the AA boundary (4.5) and AAA boundary (7.0), including just-below/just-above/exact cases"
  artifacts:
    - path: "colour-engine.js"
      provides: "passesThreshold named export"
      contains: "export function passesThreshold"
    - path: "test/colour-engine.test.js"
      provides: "passesThreshold regression tests"
      contains: "passesThreshold"
  key_links:
    - from: "colour-engine.js"
      to: "variant-search.js (Wave 2)"
      via: "named import of passesThreshold"
      pattern: "export function passesThreshold\\("
---

<objective>
Add the `passesThreshold(ratio, targetRatio)` helper to `colour-engine.js` so Wave 2's `variant-search.js` refactor can converge its binary search at either the AA (4.5) or AAA (7.0) threshold. Existing `passesAA`/`passesAAA` stay untouched for back-compat (D-03).

Purpose: one generic pass-check used by the threshold-aware search — single source of truth, zero deps, vanilla JS.

Output: new `passesThreshold` export + extended engine tests.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/07-search-correctness-spread/07-CONTEXT.md
@.planning/phases/07-search-correctness-spread/07-RESEARCH.md
@colour-engine.js
@test/colour-engine.test.js

<interfaces>
<!-- Existing exports in colour-engine.js (do not change) -->

```javascript
export const AA_NORMAL  = 4.5;
export const AAA_NORMAL = 7.0;
export const AA_LARGE   = 3.0;
export const AAA_LARGE  = 4.5;

export function parseHex(hex): {r, g, b} | null;
export function relativeLuminance(r, g, b): number;
export function contrastRatio(hex1, hex2): number | null;
export function passesAA(ratio): boolean;      // ratio >= 4.5
export function passesAAA(ratio): boolean;     // ratio >= 7.0
export function passesAALarge(ratio): boolean; // ratio >= 3.0
export function passesAAALarge(ratio): boolean;// ratio >= 4.5
export function srgbToOklab(r, g, b): {L, a, b};
export function oklabToSrgb(L, a, b): {r, g, b};
export function oklabDistance(rgb1, rgb2): number;
```

<!-- New export this plan adds -->

```javascript
/**
 * Threshold-parameterised pass check. Returns true if `ratio` is at or above
 * the supplied target. Used by variant-search to converge to the active
 * threshold (4.5 for AA normal, 7.0 for AAA normal).
 *
 * @param {number} ratio       - Raw contrast ratio float (do not pre-round)
 * @param {number} targetRatio - 4.5, 7.0, or any custom threshold
 * @returns {boolean}
 */
export function passesThreshold(ratio, targetRatio): boolean;
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add passesThreshold helper + tests</name>
  <read_first>
    - colour-engine.js (full file — see existing passesAA/passesAAA patterns at lines 82-91)
    - test/colour-engine.test.js (understand existing describe/it patterns and import list at lines 7-18)
    - .planning/phases/07-search-correctness-spread/07-CONTEXT.md (D-03)
    - .planning/phases/07-search-correctness-spread/07-RESEARCH.md (Example 1, line 319-336)
  </read_first>
  <files>colour-engine.js, test/colour-engine.test.js</files>
  <behavior>
    - passesThreshold(4.5, 4.5) === true    (exact AA boundary)
    - passesThreshold(4.499, 4.5) === false (just below AA)
    - passesThreshold(4.501, 4.5) === true  (just above AA)
    - passesThreshold(7.0, 7.0) === true    (exact AAA boundary)
    - passesThreshold(6.999, 7.0) === false (just below AAA)
    - passesThreshold(7.0, 4.5) === true    (AAA ratio passes AA target)
    - passesThreshold(4.5, 7.0) === false   (AA ratio fails AAA target)
    - passesThreshold(0, 4.5) === false     (zero contrast)
    - passesAA and passesAAA still behave exactly as before (re-run existing tests)
  </behavior>
  <action>
    Step 1 — Edit `colour-engine.js`. After the existing `passesAAALarge` function (line 91), append:

    ```javascript
    /**
     * Threshold-parameterised pass check. Returns true if `ratio` is at or above
     * the supplied target. Used by variant-search to converge to the active
     * threshold (4.5 for AA normal, 7.0 for AAA normal). Per D-03 (Phase 7 CONTEXT).
     *
     * @param {number} ratio       - Raw contrast ratio float (do not pre-round)
     * @param {number} targetRatio - 4.5, 7.0, or any custom threshold
     * @returns {boolean}
     */
    export function passesThreshold(ratio, targetRatio) {
      return ratio >= targetRatio;
    }
    ```

    Do NOT remove or alter `passesAA`, `passesAAA`, `passesAALarge`, `passesAAALarge` (D-03 requires back-compat).

    Step 2 — Edit `test/colour-engine.test.js`. Add `passesThreshold` to the import list at the top (around line 7-18):

    ```javascript
    import {
      parseHex,
      relativeLuminance,
      contrastRatio,
      passesAA,
      passesAAA,
      passesAALarge,
      passesAAALarge,
      passesThreshold,
      srgbToOklab,
      oklabToSrgb,
      oklabDistance,
    } from '../colour-engine.js';
    ```

    Step 3 — Append a new `describe('passesThreshold', () => { ... })` block at the end of `test/colour-engine.test.js`. Include these `it` cases (one assert each):

    ```javascript
    describe('passesThreshold', () => {
      it('returns true at the exact AA threshold (4.5)', () => {
        assert.strictEqual(passesThreshold(4.5, 4.5), true);
      });
      it('returns false just below the AA threshold', () => {
        assert.strictEqual(passesThreshold(4.499, 4.5), false);
      });
      it('returns true just above the AA threshold', () => {
        assert.strictEqual(passesThreshold(4.501, 4.5), true);
      });
      it('returns true at the exact AAA threshold (7.0)', () => {
        assert.strictEqual(passesThreshold(7.0, 7.0), true);
      });
      it('returns false just below the AAA threshold', () => {
        assert.strictEqual(passesThreshold(6.999, 7.0), false);
      });
      it('AAA-passing ratio also passes the AA target', () => {
        assert.strictEqual(passesThreshold(7.0, 4.5), true);
      });
      it('AA-passing ratio does NOT pass the AAA target', () => {
        assert.strictEqual(passesThreshold(4.5, 7.0), false);
      });
      it('zero contrast fails any positive target', () => {
        assert.strictEqual(passesThreshold(0, 4.5), false);
      });
    });
    ```

    Use a single `targetRatio` per case; do NOT pre-round the ratio (matches `contrastRatio` raw-float contract noted in colour-engine.js:62).

    Constraints:
    - Vanilla JS, no new imports to colour-engine.js.
    - Do not touch `passesAA`/`passesAAA`/`passesAALarge`/`passesAAALarge`.
    - Keep test style consistent with existing file (describe/it, `node:assert/strict`).
  </action>
  <verify>
    <automated>node --test test/colour-engine.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `colour-engine.js` contains the string `export function passesThreshold(`
    - `colour-engine.js` still contains `export function passesAA(` and `export function passesAAA(`
    - `test/colour-engine.test.js` contains `passesThreshold,` in the import list
    - `test/colour-engine.test.js` contains `describe('passesThreshold'`
    - `node --test test/colour-engine.test.js` exits 0
    - Test output shows 8 new passing `passesThreshold` cases
    - `node --test 'test/*.test.js'` exits 0 (no regressions in other files)
  </acceptance_criteria>
  <done>
    passesThreshold is exported, tested, and green. Wave 2 can import it.
  </done>
</task>

</tasks>

<verification>
Run `node --test 'test/*.test.js'` — full suite green, new passesThreshold cases included, zero regressions to passesAA/passesAAA.
</verification>

<success_criteria>
- passesThreshold exported from colour-engine.js
- 8 new boundary tests green
- No change in existing passesAA/passesAAA behaviour or tests
- Full test suite still green
</success_criteria>

<output>
After completion, create `.planning/phases/07-search-correctness-spread/07-01-SUMMARY.md` covering: new export signature, test count added, any deviations from plan.
</output>
