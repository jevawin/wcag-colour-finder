---
phase: 07-search-correctness-spread
verified: 2026-04-24T00:00:00Z
status: passed
score: 11/11 must-haves verified
---

# Phase 7: Search Correctness + Spread Verification Report

**Phase Goal:** Variant search returns correct, varied, and minimally-disruptive results across AA/AAA and per-background pass states.
**Verified:** 2026-04-24
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | findVariantPairs accepts targetRatio (5th arg, default 4.5) and uses it throughout | VERIFIED | variant-search.js:164 signature `findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)` |
| 2 | searchLForBg parameterised with targetRatio | VERIFIED | variant-search.js:86 `searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0)`; passesThreshold call at line 122 |
| 3 | L_STRETCH_SEEDS exists and produces wider spread | VERIFIED | variant-search.js:34 `[0, 0.05, 0.10, 0.15, 0.18]`; spread test asserts L-span >= 0.12 (passing) |
| 4 | Asymmetric per-side gating returns input verbatim on passing side | VERIFIED | variant-search.js:171-174, 202-207; tests at AAA lock #000000/#FFFFFF on respective sides (passing) |
| 5 | Both-pass returns [] (empty) | VERIFIED | variant-search.js:174 `if (lightPasses && darkPasses) return [];`; test passes |
| 6 | colour-engine.js exports passesThreshold | VERIFIED | colour-engine.js:102 `export function passesThreshold(ratio, targetRatio)` |
| 7 | app.js no longer post-filters (no `pairs.filter` or `const threshold = state.target` patterns) | VERIFIED | grep returns no matches in app.js |
| 8 | app.js passes 4.5/7.0 derived from state.target | VERIFIED | app.js:246 `const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;` passed as 5th arg at line 252 |
| 9 | "Already accessible" status branch present | VERIFIED | app.js:280 `announce('This colour is already accessible on both backgrounds');` |
| 10 | British spelling in UI copy | VERIFIED | app.js uses "colour" in user-facing strings (lines 193, 280, 282); identifiers retain DOM-API "color" only |
| 11 | `node --test 'test/*.test.js'` 110/110 green | VERIFIED | Test run: pass 110, fail 0, suites 28 |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `colour-engine.js` | passesThreshold export | VERIFIED | Line 102, two-line implementation |
| `variant-search.js` | findVariantPairs with targetRatio + L_STRETCH_SEEDS + asymmetric gating | VERIFIED | All elements present; signature, constant, gating all match plan |
| `app.js` | autoFindAndApply threshold-aware, post-filter removed, already-accessible branch | VERIFIED | Lines 245-290; no post-filter; branch wired |
| `test/colour-engine.test.js` | passesThreshold cases | VERIFIED | Tests pass |
| `test/variant-search.test.js` | AAA + spread + asymmetric coverage | VERIFIED | All new describe blocks pass |
| `test/app.test.js` | Integration call-pattern coverage | VERIFIED | Suite green |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| variant-search.js | colour-engine.js | `import { passesThreshold }` | WIRED (variant-search.js:20) |
| variant-search.js | searchLForBg seeding | `seedDelta` parameter | WIRED (line 86 signature, line 90/92 used in bounds) |
| app.js:autoFindAndApply | variant-search.js:findVariantPairs | 5th positional arg targetRatio | WIRED (app.js:247-253) |
| app.js empty branch | announce() | Distinguishes [] vs no-solution | WIRED (app.js:279-283) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| app.js renderAlts | state.alts | autoFindAndApply mapping of findVariantPairs result | Yes — search produces hex pairs from OKLab L-axis search | FLOWING |
| app.js renderPanel | state.appliedLight/Dark | autoFindAndApply assigns from alts[0] | Yes — populated from search results when alts present | FLOWING |

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
| --------- | ------- | ------ | ------ |
| Full test suite passes | `node --test 'test/*.test.js'` | 110 pass / 0 fail | PASS |
| AAA returns pairs for #2563EB | Test in variant-search.test.js | Pass | PASS |
| L-span >= 0.12 for #777777 | Test in variant-search.test.js | Pass | PASS |
| Both-pass returns [] | Test in variant-search.test.js | Pass | PASS |
| Asymmetric lock on #000000 light side | Test in variant-search.test.js | Pass | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SEARCH-01 | 07-01, 07-02, 07-03 | AAA mode returns variant pairs whenever colour space permits | SATISFIED | passesThreshold + targetRatio threading; AAA test for #2563EB returns >=1 pair, all pass 7.0 |
| SEARCH-02 | 07-02, 07-03 | 5 returned pairs span wider L-axis | SATISFIED | L_STRETCH_SEEDS + per-seed bucket selection; L-span test passes (>=0.12) |
| SEARCH-03 | 07-02, 07-03 | Passing side keeps entered colour; failing side searched | SATISFIED | Per-side gating in findVariantPairs; locked-side tests pass for both light and dark |

No orphaned requirements — all phase 7 IDs claimed by at least one plan.

### Anti-Patterns Found

None. No TODO/FIXME/placeholder/stub patterns detected in modified files. No leftover post-filter code in app.js.

### Human Verification Required

Manual smoke test in browser recommended (per plan 07-03 verification note):
- Load index.html, enter `#2563EB`, toggle AA <-> AAA — confirm AAA returns visible 5 pairs
- Confirm swatch 5 visibly differs from swatch 1 (L-spread visible)
- Enter `#000000` — confirm light side stays black, dark side gets lighter alts
- Enter a colour that passes both BGs at AA — confirm "already accessible" status announced

These are visual/UX checks not coverable by node:test. All automated checks pass.

### Gaps Summary

None. All 11 must-haves verified, all 3 requirements satisfied, full test suite 110/110 green, no anti-patterns, vanilla-JS / no-deps constraint upheld, British spelling in UI copy preserved.

---

_Verified: 2026-04-24_
_Verifier: Claude (gsd-verifier)_
