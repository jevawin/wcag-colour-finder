# Phase 7: Search Correctness & Spread - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix `variant-search.js` correctness defects and broaden result spread:

- **SEARCH-01:** AAA mode returns variant pairs whenever the colour space permits.
- **SEARCH-02:** The 5 returned pairs span a wider OKLab L-axis range — first nearest, last clearly distinct.
- **SEARCH-03:** Asymmetric search — when input already passes the active threshold on one background, that side keeps the input verbatim; only the failing side is searched.

Out of scope (other phases): auto-find UX (Phase 8 — INPUT-01/02/03), responsive fixes (Phase 9 — RESP-01/02). Manual "Find 5" button stays in this phase; Phase 8 removes it.

</domain>

<decisions>
## Implementation Decisions

### Threshold Integration (fixes SEARCH-01)

- **D-01:** Parameterise `searchLForBg` with a target ratio. Binary search converges to the true passing point at the active threshold (4.5 for AA, 7.0 for AAA) instead of always converging to AA.
- **D-02:** Threshold lives in `app.js`. `app.js` translates `state.target` (`'AA'|'AAA'`) → `4.5|7.0` and passes the numeric ratio into `findVariantPairs`. `variant-search.js` stays pure of UI state semantics.
- **D-03:** Add `passesThreshold(ratio, targetRatio)` helper to `colour-engine.js`. `searchLForBg` uses it. Existing `passesAA` / `passesAAA` stay for back-compat and existing tests.
- **D-04:** Remove the post-filter in `app.js:autoFindAndApply` once search is threshold-aware. Single source of truth: the search itself.

### Spread Strategy (fixes SEARCH-02)

- **D-05:** Multi-seed L-axis stretch. Result 0 = nearest passing pair (existing behaviour). Results 1–4 are produced by seeding the binary search to converge to passing points further along the L axis past the threshold crossing.
- **D-06:** First result anchors on minimum `max(distLight, distDark)` — preserves the v1.0 "least disruption" promise.
- **D-07:** Last result must differ from result 0 by at least a minimum L-axis delta in OKLab (concrete delta value is Claude's Discretion — research/planning to pick a value in the 0.15–0.25 range that produces visibly distinct shades without leaving the colour family).
- **D-08:** Existing a-offset variation (`A_OFFSETS = [0, 0.01, -0.01, 0.02, -0.02]`) stays — provides hue/chroma nuance. L-stretch is layered on top, not a replacement.

### Asymmetric Search (fixes SEARCH-03)

- **D-09:** Per-side search gating. For each background, evaluate input contrast at the active threshold. If input passes, lock that side to the input hex. Only run binary search for the failing side.
- **D-10:** When one side is locked to input, all 5 returned pairs share that side's hex. The failing side gets 5 spread alts (per D-05/D-07).
- **D-11:** "Passing" is evaluated against the active threshold (`state.target`), not always AA. Toggling AA/AAA can flip a colour from "asymmetric" to "both fail" or vice versa.
- **D-12:** When input passes both backgrounds at the active threshold: return empty results. App shows an "already accessible" status message. Wording is Claude's Discretion.
- **D-13:** Distance metric when one side = input: use the failing-side distance only. Mathematically equivalent to `max(0, distFailing) = distFailing`; documented for clarity.

### Empty State vs No Solution

- **D-14:** `searchLForBg` returning `null` already indicates the gamut limit was hit before a passing point was found. Once SEARCH-01 is fixed, `null` is the genuine "no solution" signal — no new return shape needed.
- **D-15:** Empty-state message stays as the current copy: "No accessible pair found for this colour". Threshold context comes from the visible AA/AAA toggle.

### Claude's Discretion

- Exact L-axis stretch deltas for results 1–4 (D-05).
- Numeric value for the "minimum L delta from result 0" guarantee (D-07) — pick during research/planning.
- Wording of the "already accessible" status message (D-12).
- Whether to refactor `findVariantPairs` signature to accept a target object or stay positional (`count`, then `targetRatio`) — Claude picks based on test impact.

### Folded Todos

None — no pending todos matched Phase 7.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` §"Phase 7" — goal, success criteria, dependency notes.
- `.planning/REQUIREMENTS.md` — SEARCH-01, SEARCH-02, SEARCH-03 (this phase's requirements).

### Source files in scope
- `variant-search.js` — primary edit target. `searchLForBg`, `findVariantPairs`, `A_OFFSETS`.
- `colour-engine.js` — add `passesThreshold` helper; existing `AA_NORMAL`, `AAA_NORMAL`, `passesAA`, `passesAAA`, `oklabDistance`, `srgbToOklab`, `oklabToSrgb` stay.
- `app.js:244` (`autoFindAndApply`) — remove post-filter, pass threshold into search.

### Prior phase context
- `.planning/phases/03-variant-search/03-CONTEXT.md` — original OKLab L-axis binary search rationale (D-03/D-05).
- `.planning/phases/04-modes-and-configuration/04-CONTEXT.md` — dual-pair output (D-01), `max(distLight, distDark)` distance metric (D-04 / Open Question 3), BG params not constants (D-10).

### Tests
- `test/variant-search.test.js` — primary regression surface. Existing AA dual-pair behaviour must still pass per success criterion 4.
- `test/colour-engine.test.js` — extend for `passesThreshold`.
- `test/app.test.js` — autoFindAndApply integration.

### Project guardrails
- `CLAUDE.md` §"WCAG Contrast Calculations" — AA 4.5 normal, AAA 7 normal.
- `CLAUDE.md` §"Find Nearest Accessible Colour Algorithm" — OKLab L-axis monotonicity invariant.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `searchLForBg(L, a, b, direction, bgHex)` — already does single-side binary search with gamut clamping. Add a `targetRatio` param to make it threshold-aware.
- `passesAA` / `passesAAA` in `colour-engine.js:82-91` — kept for back-compat. New `passesThreshold(ratio, target)` sits alongside.
- `oklabDistance` — used by both pair distance and (in D-13) failing-side-only distance.
- `A_OFFSETS` constant — keep, layer L-stretch on top.

### Established Patterns
- Pure-function modules, no DOM (Phase 1/2 invariant) — variant-search and colour-engine stay headless and testable via `node --test`.
- Hex case: uppercase with `#` prefix from search; app strips `#` for storage. Don't break this.
- BGs always parameters, never hardcoded (Phase 4 D-10) — extend by also parameterising the threshold.

### Integration Points
- `app.js:autoFindAndApply` is the only caller of `findVariantPairs`. State.target is already in scope here.
- URL state (Phase 4) is unaffected — threshold is not URL-persisted (it's session-local; AA is default).

### Risks
- **Test surface:** existing `variant-search.test.js` may assume AA-only behaviour. Audit and update assertions; add AAA cases.
- **Performance:** multi-seed L-stretch increases binary search invocations from 20 (4 dirs × 5 a-offsets) to ~40-60. Each search is 40 iterations — still sub-millisecond. Confirm during planning.
- **Gamut limit ambiguity:** at very saturated input colours, AAA may genuinely have no pair. Distinguishing this from a-offset failure relies on null-aggregation logic in `findVariantPairs`.
- **Asymmetric edge:** input passes light at AA but fails at AAA. Toggling AAA must re-evaluate the lock per D-11; lock state isn't persistent.

</code_context>

<specifics>
## Specific Ideas

- Failure case to test explicitly: a saturated mid-tone (e.g. `#2563EB`) under AAA — currently returns empty due to defect. Post-fix should return spread pairs.
- Spread test: result[0] vs result[4] visible to the eye. Concrete check: `|result[4].lightL - result[0].lightL| >= chosen_min_delta`.
- Asymmetric test: pure black `#000000` on white BG already passes AAA — verify pair list shows `#000000` on light side and dark-side alternatives only.

</specifics>

<deferred>
## Deferred Ideas

- Threshold-aware empty-state copy ("No AAA pair — try AA?") — deferred. Single message stays per D-15.
- Surfacing distance/quality warnings on individual swatches — out of scope; Phase 3 D-04 (no badges on swatches) still holds.
- Auto-find triggers on AA/AAA toggle — Phase 8 (INPUT-02), not Phase 7.

### Reviewed Todos (not folded)

None — none matched.

</deferred>

---

*Phase: 07-search-correctness-spread*
*Context gathered: 2026-04-24*
