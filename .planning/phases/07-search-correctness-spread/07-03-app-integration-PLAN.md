---
phase: 07-search-correctness-spread
plan: 03
type: execute
wave: 3
depends_on: ["07-02"]
files_modified:
  - app.js
  - test/app.test.js
autonomous: true
requirements:
  - SEARCH-01
  - SEARCH-02
  - SEARCH-03
must_haves:
  truths:
    - "app.js no longer post-filters findVariantPairs results by threshold — the search itself is threshold-aware"
    - "app.js passes targetRatio (4.5 for AA, 7.0 for AAA) into findVariantPairs based on state.target"
    - "When findVariantPairs returns [] because input already passes on both BGs, app announces 'This colour is already accessible on both backgrounds' (or similar) — NOT 'No accessible pair found for this colour'"
    - "Empty-result branch when search genuinely found nothing still announces the existing 'No accessible pair found for this colour' copy (D-15)"
    - "Toggling AA/AAA re-runs autoFindAndApply and nulls appliedLight/appliedDark before search — existing behaviour preserved"
  artifacts:
    - path: "app.js"
      provides: "Threshold-parameterised autoFindAndApply with already-accessible status branch"
      contains: "targetRatio"
    - path: "test/app.test.js"
      provides: "Regression tests for the removed post-filter and the already-accessible branch (if coverable pure-function-style)"
      contains: "targetRatio OR already accessible"
  key_links:
    - from: "app.js:autoFindAndApply"
      to: "variant-search.js:findVariantPairs"
      via: "5th positional argument targetRatio"
      pattern: "findVariantPairs\\([^)]*targetRatio"
    - from: "app.js empty branch"
      to: "announce() call"
      via: "Distinguishes [] (already accessible) vs genuine no-solution"
      pattern: "already accessible"
---

<objective>
Integrate the Wave 2 `findVariantPairs` refactor into `app.js`:
1. Remove the post-filter in `autoFindAndApply` (D-04) and pass the active `targetRatio` into `findVariantPairs` (D-02).
2. Distinguish the two empty-result causes:
   - `findVariantPairs` returned `[]` because input already passes on both BGs → announce "already accessible" status.
   - `findVariantPairs` returned `null` or a non-null-but-zero-length result where input did NOT already pass → keep existing "No accessible pair found for this colour" copy (D-15).
3. Keep AA/AAA toggle behaviour (null-reset appliedLight/Dark, re-run search) — already correct.

Purpose: wire the fixed search into the app; surface accurate user feedback.

Output: refactored `app.js:autoFindAndApply` + tests for the integration.
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
@app.js
@variant-search.js
@test/app.test.js

<interfaces>
<!-- Wave 2 public signature (already landed before this plan runs) -->

```javascript
export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5):
  Array<{ lightHex: string, darkHex: string, distance: number }> | null;
// Returns []  when input already passes targetRatio on BOTH BGs (D-12).
// Returns null when inputHex is invalid.
// Returns non-empty array of up to `count` pairs otherwise.
// All pair hexes are uppercase with leading '#'.
```

<!-- Current app.js:autoFindAndApply (lines 244-271) — see file for full context -->

<!-- state shape (partial, relevant fields): -->
<!--   state.base: uppercase 6-char hex, no '#' -->
<!--   state.light: uppercase 6-char hex, no '#' -->
<!--   state.dark:  uppercase 6-char hex, no '#' -->
<!--   state.target: 'AA' | 'AAA' -->
<!--   state.alts: Array<{ lightHex, darkHex, distance }> — hexes stored with NO '#' prefix -->
<!--   state.appliedLight, state.appliedDark: string | null (no '#') -->

<!-- announce(msg) helper at app.js:109 updates aria-live region -->
<!-- prevAltsLen tracked at module level (app.js:129) -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Rewrite autoFindAndApply — threshold param + already-accessible branch</name>
  <read_first>
    - app.js full section from line ~100 to ~360 (announce helper at 109, prevAltsLen at 129, renderAlts at ~200, autoFindAndApply at 237-271, setBase/setLightBg/setDarkBg at 273-307, target toggle at 329-341)
    - variant-search.js post-Wave-2 (new findVariantPairs signature, [] return semantics)
    - colour-engine.js (contrastRatio — still used for input-passes checks in the already-accessible branch if desired)
    - .planning/phases/07-search-correctness-spread/07-CONTEXT.md (D-02, D-04, D-12, D-15)
    - .planning/phases/07-search-correctness-spread/07-RESEARCH.md Example 5 (lines 432-460)
  </read_first>
  <files>app.js</files>
  <behavior>
    - autoFindAndApply computes `targetRatio = state.target === 'AAA' ? 7.0 : 4.5` and passes it as the 5th positional argument to findVariantPairs.
    - autoFindAndApply does NOT filter the returned pairs by contrastRatio any more; it only strips the leading '#' and uppercases hexes for state storage.
    - When findVariantPairs returns `[]`: state.alts becomes []; announce the "already accessible" status exactly once per transition into this state (gate on prevAltsLen or a new prevAlreadyAccessible flag — pick the lightest change).
    - When findVariantPairs returns a non-empty array: state.alts is populated, first-pair auto-apply logic preserved (appliedLight/Dark defaulted if null).
    - When findVariantPairs returns `null` (invalid base hex): treat as zero-length — state.alts = [], state.appliedLight = null, state.appliedDark = null. Do NOT announce "already accessible" in this case.
    - Existing "No accessible pair found for this colour" announcement still fires when a genuine search yielded zero results (both sides failed initially but no valid pair emerged from the search — rare but possible via gamut limits).
  </behavior>
  <action>
    Step A — Replace the body of `autoFindAndApply` (app.js lines ~237-271). New implementation:

    ```javascript
    /**
     * Run findVariantPairs with the active threshold and apply results to state.
     *
     * Phase 7: search is threshold-aware (D-01 / D-02). No post-filter.
     * An empty array return from findVariantPairs means the input already
     * passes targetRatio on both backgrounds (D-12) — surface that as an
     * "already accessible" status, NOT as "no accessible pair".
     */
    function autoFindAndApply() {
      const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;
      const raw = findVariantPairs(
        '#' + state.base,
        '#' + state.light,
        '#' + state.dark,
        5,
        targetRatio,
      );

      // Distinguish the three outcomes:
      //   raw === null                 → invalid base hex (shouldn't reach here in practice)
      //   Array.isArray(raw) && raw.length === 0 → input already accessible on both BGs (D-12)
      //   non-empty array              → normal search result
      const alreadyAccessible = Array.isArray(raw) && raw.length === 0;
      const pairs = Array.isArray(raw) ? raw : [];

      state.alts = pairs.map(p => ({
        lightHex: p.lightHex.replace(/^#/, '').toUpperCase(),
        darkHex:  p.darkHex.replace(/^#/, '').toUpperCase(),
        distance: p.distance,
      }));

      if (state.alts.length > 0) {
        if (state.appliedLight === null || state.appliedDark === null) {
          state.appliedLight = state.alts[0].lightHex;
          state.appliedDark  = state.alts[0].darkHex;
        }
      } else {
        state.appliedLight = null;
        state.appliedDark  = null;
      }

      // Status announcements — at most one per call, only on transitions.
      if (alreadyAccessible && prevAltsLen !== 0) {
        announce('This colour is already accessible on both backgrounds');
      } else if (!alreadyAccessible && prevAltsLen > 0 && state.alts.length === 0) {
        announce('No accessible pair found for this colour');
      }
      // Note: when alreadyAccessible is true and prevAltsLen was already 0,
      // stay silent — no state change to announce.
      prevAltsLen = state.alts.length;

      renderAlts();
      renderPreviews();
    }
    ```

    Step B — Remove the now-unused import if `contrastRatio` is no longer referenced anywhere else in app.js. Grep for `contrastRatio` first — if used elsewhere (e.g. for preview ratio display), keep the import. If unused, drop it from the import statement at the top of app.js. DO NOT remove `parseHex` or other imports still in use.

    Step C — Update the JSDoc comment above `autoFindAndApply` so it no longer mentions "post-filter" or the Phase 5-06 trade-off (the post-filter pattern is retired in Phase 7).

    Step D — No changes required to setBase/setLightBg/setDarkBg/target-toggle handlers (they still call autoFindAndApply unchanged). The target toggle handler's existing null-reset of appliedLight/appliedDark (app.js ~337-338) is correct — leave it.

    Constraints:
    - Vanilla JS, no new npm deps.
    - "already accessible" wording is Claude's discretion (D-12) — the recommended copy is `'This colour is already accessible on both backgrounds'`. Keep it short, British-compatible spelling (no "color").
    - Do NOT add any new aria-live regions. Reuse existing `announce()`.
    - Do NOT re-add any post-filter. Single source of truth is the search itself.
    - Hex storage in state.alts stays WITHOUT leading '#', uppercase — matches existing convention used by renderAlts/renderPreviews.
    - Keep `prevAltsLen` module-level variable (it already exists at app.js:129).
  </action>
  <verify>
    <automated>node --test test/app.test.js test/variant-search.test.js test/colour-engine.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `app.js` does NOT contain the string `const threshold = state.target === 'AAA' ? 7.0 : 4.5;` (old post-filter marker removed)
    - `app.js` does NOT contain `pairs.filter(p => {` inside autoFindAndApply
    - `app.js` contains `const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;`
    - `app.js` contains a call matching `findVariantPairs(` that includes `targetRatio` as the 5th argument
    - `app.js` contains the string `already accessible` (the new status copy)
    - `app.js` still contains `'No accessible pair found for this colour'` (D-15 copy preserved for the genuine no-solution branch)
    - `node --test test/app.test.js` exits 0 (no regressions)
    - `node --test 'test/*.test.js'` exits 0
  </acceptance_criteria>
  <done>
    autoFindAndApply is threshold-aware, post-filter is gone, already-accessible status surfaces correctly. No test regressions.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add app.test.js coverage for autoFindAndApply threshold + already-accessible branch</name>
  <read_first>
    - test/app.test.js (full file — see existing pattern for what's testable in node:test without jsdom)
    - app.js post-Task-1 (new autoFindAndApply)
    - .planning/phases/07-search-correctness-spread/07-RESEARCH.md §"Validation Architecture" (lines 508-553)
  </read_first>
  <files>test/app.test.js</files>
  <behavior>
    - At the app.js level, autoFindAndApply is not exported (it's inside the DOMContentLoaded IIFE). The practical integration surface we CAN test in node:test is the boundary behaviour via findVariantPairs directly — which is already covered in Plan 07-02. So this task adds whatever extra coverage is feasible without JSDOM:
      1. Assert that importing app.js (if it exports any pure helpers — check via `import`) does not throw under node:test environment (existing test pattern).
      2. If app.js exports pure helpers touched in this phase, test them. If none are newly exported, add a single sanity `describe` noting integration coverage is handled at the findVariantPairs layer, so the file remains non-empty and under Nyquist.
    - Concretely: exercise `findVariantPairs` from the caller's perspective with the SAME 5-argument call pattern app.js uses, for two scenarios:
      a. Already-accessible: `findVariantPairs('#000000', '#FFFFFF', '#888888', 5, 4.5)` returns `[]`.
      b. Threshold wiring: `findVariantPairs('#2563EB', '#FFFFFF', '#000000', 5, 7.0)` returns a non-empty array or `[]` (accept either since gamut may limit), and if non-empty every pair genuinely passes 7.0.
  </behavior>
  <action>
    Open `test/app.test.js`. Read current imports and describe blocks.

    Append a new describe block at the end:

    ```javascript
    // --- Phase 7 integration: autoFindAndApply call shape ---

    describe('app.js integration — findVariantPairs call pattern', () => {
      it('mirrors autoFindAndApply AA call: 5 args with targetRatio=4.5', () => {
        // Equivalent to: findVariantPairs('#' + base, '#' + light, '#' + dark, 5, 4.5)
        const result = findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 4.5);
        assert.ok(Array.isArray(result), 'should return an array for valid input');
      });

      it('mirrors autoFindAndApply AAA call: 5 args with targetRatio=7.0', () => {
        const result = findVariantPairs('#2563EB', '#FFFFFF', '#000000', 5, 7.0);
        assert.ok(Array.isArray(result), 'should return an array for valid input');
        for (const p of result) {
          const lr = contrastRatio(p.lightHex, '#FFFFFF');
          const dr = contrastRatio(p.darkHex,  '#000000');
          assert.ok(lr !== null && lr >= 7.0, `${p.lightHex} fails AAA on #FFFFFF`);
          assert.ok(dr !== null && dr >= 7.0, `${p.darkHex}  fails AAA on #000000`);
        }
      });

      it('already-accessible inputs return [] — autoFindAndApply surfaces this as a status, not as results', () => {
        // #000000 passes AA on both #FFFFFF (21:1) and a mid-grey dark BG.
        // Pick a dark BG where #000000 clears 4.5 but the combo is realistic.
        const result = findVariantPairs('#000000', '#FFFFFF', '#888888', 5, 4.5);
        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 0,
          'already-accessible input must return [] so the app can show already-accessible status');
      });
    });
    ```

    Ensure `findVariantPairs` and `contrastRatio` are imported at the top of the test file (add to existing import block if needed).

    Constraints:
    - No JSDOM, no new test framework.
    - If `#000000` + `#FFFFFF` + `#888888` does NOT yield both-pass at AA in practice (unlikely but verify: contrastRatio('#000000','#888888') should be ≥ 4.5), substitute `#AAAAAA` for the dark BG — both must exceed 4.5 for the already-accessible case. Use this exact Node one-liner if needed to verify:
      `node -e "import('./colour-engine.js').then(m => console.log(m.contrastRatio('#000000','#888888')))"`
    - Keep test style consistent with existing app.test.js patterns.
  </action>
  <verify>
    <automated>node --test test/app.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `test/app.test.js` contains `describe('app.js integration — findVariantPairs call pattern'`
    - `test/app.test.js` contains at least three it-cases covering AA call, AAA call, already-accessible `[]` return
    - `test/app.test.js` imports findVariantPairs and contrastRatio (add if not already imported)
    - `node --test test/app.test.js` exits 0
    - `node --test 'test/*.test.js'` exits 0 (full suite green)
  </acceptance_criteria>
  <done>
    app-level integration tests exercise the exact call shape autoFindAndApply uses, including the both-pass `[]` contract that the "already accessible" status depends on.
  </done>
</task>

</tasks>

<verification>
- `node --test 'test/*.test.js'` — full suite green
- Manual smoke test (human, post-plan): open index.html, enter `#2563EB`, toggle AA↔AAA — AAA now returns 5 pairs instead of empty; swatch 5 visibly differs from swatch 1; enter `#000000` — light side shows black, dark side shows lighter alts; enter a colour that already passes both BGs at AA — status announces "already accessible".
</verification>

<success_criteria>
- Post-filter removed from app.js
- targetRatio plumbed end-to-end from state.target → findVariantPairs
- Already-accessible branch distinguished from no-solution branch in announcements
- All existing tests still green; new integration tests green
</success_criteria>

<output>
After completion, create `.planning/phases/07-search-correctness-spread/07-03-SUMMARY.md` covering: exact call-site change in autoFindAndApply, final "already accessible" copy used, any imports removed, manual smoke-test result.
</output>
