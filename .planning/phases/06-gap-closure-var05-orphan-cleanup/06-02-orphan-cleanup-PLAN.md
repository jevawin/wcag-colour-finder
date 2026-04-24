---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - variant-search.js
  - test/variant-search.test.js
autonomous: true
requirements: []
must_haves:
  truths:
    - "DISTANCE_WARNING_THRESHOLD is not exported from variant-search.js."
    - "DISTANCE_WARNING_THRESHOLD is not imported or referenced in any test file."
    - "node --test test/ passes with zero failures after removal."
    - "No runtime error in app.js or other consumers (the symbol was an orphan — no UI wiring existed)."
  artifacts:
    - path: "variant-search.js"
      provides: "findVariantPairs (unchanged); DISTANCE_WARNING_THRESHOLD removed from exports and JSDoc"
      contains: "export function findVariantPairs"
    - path: "test/variant-search.test.js"
      provides: "all existing tests minus the orphan constant test"
      contains: "findVariantPairs"
  key_links:
    - from: "test/variant-search.test.js import line"
      to: "variant-search.js"
      via: "named import — must drop DISTANCE_WARNING_THRESHOLD"
      pattern: "import \\{ findVariantPairs"
---

<objective>
Remove the orphaned `DISTANCE_WARNING_THRESHOLD` export from `variant-search.js` and its corresponding test. The constant was exported for a UI warning feature that the Phase 5 rebuild removed — no consumer exists. Per CONTEXT D-06: explicit rejection of re-wiring; remove cleanly.

Purpose: Closes tech_debt item #2 from v1.0-MILESTONE-AUDIT.md (orphan export).

Output: Modified `variant-search.js` (drop line 11 JSDoc ref + line 24 export) and `test/variant-search.test.js` (drop line 8 import + lines 110-116 describe block).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/v1.0-MILESTONE-AUDIT.md
@.planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md
@variant-search.js
@test/variant-search.test.js

<interfaces>
Current exports from variant-search.js (lines 10-11, 24):
```js
//   findVariantPairs(inputHex, lightBg, darkBg, count = 5)
//     → Array<{ lightHex, darkHex, distance }> | null
//   DISTANCE_WARNING_THRESHOLD → 0.12     ← line 11 (to remove)

export const DISTANCE_WARNING_THRESHOLD = 0.12;   ← line 24 (to remove)
```

Current test import (test/variant-search.test.js line 8):
```js
import { findVariantPairs, DISTANCE_WARNING_THRESHOLD } from '../variant-search.js';
```

Current orphan test block (lines 110-116):
```js
describe('findVariantPairs — exported constants', () => {
  it('DISTANCE_WARNING_THRESHOLD is 0.12', () => {
    assert.strictEqual(DISTANCE_WARNING_THRESHOLD, 0.12);
  });
});
```

Verified no other consumer: `grep -r DISTANCE_WARNING_THRESHOLD .` across app.js, colour-engine.js, url-state.js, index.html returns zero matches (audit confirmed orphan status).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Remove DISTANCE_WARNING_THRESHOLD export + JSDoc ref</name>
  <files>variant-search.js</files>
  <read_first>
    - variant-search.js (entire file — confirm line numbers match)
    - .planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md (D-06 locked decision)
  </read_first>
  <action>
    Make two deletions in variant-search.js:

    (1) Delete the JSDoc reference on line 11:
    ```
    //   DISTANCE_WARNING_THRESHOLD → 0.12
    ```
    Remove that line entirely. The preceding lines 8-10 describing `findVariantPairs` remain.

    (2) Delete line 24 (the export):
    ```js
    export const DISTANCE_WARNING_THRESHOLD = 0.12;
    ```
    Remove the line entirely. The surrounding context becomes:
    ```js
    // --- Constants ---

    // Small a-channel offsets to generate up to 5 distinct candidate pairs.
    ```
    I.e., the `// --- Constants ---` header and the `A_OFFSETS` comment/declaration remain directly adjacent (one blank line between them).

    Do NOT touch anything else in the file. The `A_OFFSETS` constant (line 28), `rgbToHex`, `searchLForBg`, and `findVariantPairs` are all unchanged.
  </action>
  <verify>
    <automated>
      test "$(grep -c 'DISTANCE_WARNING_THRESHOLD' variant-search.js)" = "0"
      grep -c "export function findVariantPairs" variant-search.js  # expect 1
      grep -c "A_OFFSETS" variant-search.js   # expect >= 1 (unchanged)
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep "DISTANCE_WARNING_THRESHOLD" variant-search.js` returns 0 matches.
    - `export function findVariantPairs` still present (untouched).
    - `A_OFFSETS` still declared.
    - File still parses (verified via test run in Task 2).
  </acceptance_criteria>
  <done>
    variant-search.js exports only `findVariantPairs`. No orphan constant or JSDoc reference remains.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Remove orphan import + test block</name>
  <files>test/variant-search.test.js</files>
  <read_first>
    - test/variant-search.test.js (entire file — confirm line numbers)
    - variant-search.js (post-Task-1 state — confirm export surface)
  </read_first>
  <action>
    Make two edits in test/variant-search.test.js:

    (1) Line 8 — drop `DISTANCE_WARNING_THRESHOLD` from the named-import list. Change:
    ```js
    import { findVariantPairs, DISTANCE_WARNING_THRESHOLD } from '../variant-search.js';
    ```
    to:
    ```js
    import { findVariantPairs } from '../variant-search.js';
    ```

    (2) Lines 110-116 — delete the entire describe block:
    ```js
    // --- Constants ---

    describe('findVariantPairs — exported constants', () => {
      it('DISTANCE_WARNING_THRESHOLD is 0.12', () => {
        assert.strictEqual(DISTANCE_WARNING_THRESHOLD, 0.12);
      });
    });
    ```
    Delete from the `// --- Constants ---` comment through the closing `});` of the describe. Keep the final newline / EOF untouched.

    Do NOT touch the other describe blocks (basic contract, AA compliance, sort order, BG parameter). They exercise `findVariantPairs` directly — still valid.
  </action>
  <verify>
    <automated>
      test "$(grep -c 'DISTANCE_WARNING_THRESHOLD' test/variant-search.test.js)" = "0"
      grep -c "import { findVariantPairs } from" test/variant-search.test.js  # expect 1
      node --test test/
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep "DISTANCE_WARNING_THRESHOLD" test/variant-search.test.js` returns 0 matches.
    - Import line reads exactly `import { findVariantPairs } from '../variant-search.js';`.
    - `describe('findVariantPairs — exported constants', ...)` block is gone (`grep -c "exported constants" test/variant-search.test.js` returns 0).
    - `node --test test/` exits 0.
    - Repo-wide sanity: `grep -r DISTANCE_WARNING_THRESHOLD . --include='*.js'` returns 0 matches.
  </acceptance_criteria>
  <done>
    Test file imports only `findVariantPairs`. Orphan test removed. Full test suite passes. Repo-wide grep confirms no stale reference anywhere.
  </done>
</task>

</tasks>

<verification>
- `grep "DISTANCE_WARNING_THRESHOLD" variant-search.js` → 0 matches
- `grep "DISTANCE_WARNING_THRESHOLD" test/variant-search.test.js` → 0 matches
- `grep -r "DISTANCE_WARNING_THRESHOLD" . --include='*.js'` → 0 matches
- `node --test test/` exits 0
</verification>

<success_criteria>
Orphan export removed. All remaining tests pass. `findVariantPairs` is the sole public export of variant-search.js.
</success_criteria>

<output>
After completion, create `.planning/phases/06-gap-closure-var05-orphan-cleanup/06-02-SUMMARY.md` recording the deleted lines and final test-pass count.
</output>
