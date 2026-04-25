---
phase: 260425-r3v-phase-7-gap-closure-default-dark-bg-disa
plan: 01
subsystem: variant-search + app-integration
tags: [phase-7, gap-closure, search-correctness, default-dark, return-shape]
requirements: [SEARCH-01-gap, SEARCH-03-gap]
provides:
  - "DEFAULT_DARK flipped to '000000' across runtime sources (app.js, index.html)"
  - "findVariantPairs returns discriminated shape: { alreadyAccessible: true, pairs: [] } sentinel | Array<pair> | null"
  - "autoFindAndApply distinguishes already-accessible from no-solution via the sentinel, not an array-emptiness heuristic"
  - "First-load already-accessible inputs now announce status (was previously silent)"
affects:
  - app.js
  - index.html
  - variant-search.js
  - test/app.test.js
  - test/variant-search.test.js
key-files:
  modified:
    - app.js
    - index.html
    - variant-search.js
    - test/app.test.js
    - test/variant-search.test.js
decisions:
  - "Sentinel-as-object over tagged-union string: consumers can use truthy `result.alreadyAccessible` checks; plain Array stays for the common path so existing array consumers work unchanged."
  - "First-load announcement guard: announce on alreadyAccessible if prevAltsLen !== 0 OR srStatus.textContent === '' — the empty-status check covers fresh load, prevAltsLen guards re-renders."
metrics:
  duration_minutes: ~12
  tasks_completed: 2
  tests_added: 3
  tests_total: 112
  completed: "2026-04-25T18:36:03Z"
---

# Phase 260425-r3v Plan 01: Phase 7 Gap Closure — Default Dark BG + Disambiguated Return Shape Summary

Restored AAA reachability on fresh load by flipping the dark-BG default from #111111 to #000000, and replaced the fragile array-emptiness heuristic in autoFindAndApply with a discriminated-return sentinel from findVariantPairs.

## Gaps Closed

### Gap 1 — DEFAULT_DARK regression (SEARCH-01-gap)

Phase 4 D-10 set the dark default to #000000 but the runtime defaults still read #111111. With #111111, the AAA binary search on #2563EB could not reach a passing point inside the gamut tolerance — users saw "No accessible pair found" on fresh load. Four edits restore the intended default.

| File         | Change                                                       |
| ------------ | ------------------------------------------------------------ |
| `app.js:94`  | `DEFAULT_DARK = '111111'` → `'000000'`                       |
| `index.html` | `.swatch-sm` background `#111111` → `#000000`                |
| `index.html` | `<input type="color" id="dark-bg-color" value="#111111">` → `#000000` |
| `index.html` | `<input id="dark-bg-text" value="111111">` → `000000`        |

### Gap 2 — Ambiguous return shape (SEARCH-03-gap)

`findVariantPairs` previously returned `[]` for two semantically distinct cases — input already passes both BGs (D-12) and genuine no-solution. `autoFindAndApply` disambiguated them with a `prevAltsLen` transition heuristic that misannounced on edge cases (first-load already-accessible inputs were silent; threshold toggles could flip the wrong message).

Source edit: in `variant-search.js:174`, replaced `return [];` with `return { alreadyAccessible: true, pairs: [] };`. JSDoc on `findVariantPairs` and the file-header comment updated to document the tri-state contract: object sentinel | Array | null.

App consumer wired to the new shape: `autoFindAndApply` now checks `!Array.isArray(raw) && raw.alreadyAccessible === true` for the sentinel branch and reads pairs from `raw.pairs` in that case. The `null` path returns early. Announcement logic now fires "already accessible" only for the sentinel and "No accessible pair found" only for a genuine empty array.

## Subtle Behaviour Change

**First-load already-accessible inputs now announce the status.** Previously the `prevAltsLen !== 0` guard kept the announcer silent when the app booted with an already-accessible URL hash (e.g. `#/000000/ffffff/888888`). The new guard is `prevAltsLen !== 0 || srStatus.textContent === ''` — the empty-status branch covers fresh load while still suppressing duplicate announcements on idempotent re-renders.

## Test Delta

| Suite                        | Before | After | Added                                                                |
| ---------------------------- | ------ | ----- | -------------------------------------------------------------------- |
| `test/variant-search.test.js`| 39     | 40    | "genuine no-solution returns plain empty Array" (existing both-pass test rewritten to assert sentinel) |
| `test/app.test.js`           | 18     | 19    | "alreadyAccessible sentinel" (rewrite) + "Default dark BG #000000 enables AAA pairs for #2563EB" |
| **Total**                    | **110** | **112** | **+2 net (3 new tests, 1 rewritten)**                              |

Full suite: `ℹ tests 112 / pass 112 / fail 0`.

## Verification

- [x] `node --test 'test/*.test.js'` — 112/112 green
- [x] `grep DEFAULT_DARK app.js` → `'000000'`
- [x] `grep 111111 index.html` → no matches
- [x] `grep alreadyAccessible variant-search.js app.js test/variant-search.test.js test/app.test.js` → all four files mention it
- [ ] Manual browser smoke (deferred to user — preview server is running): load index.html, confirm dark preview is pure black on first load; enter #2563EB, toggle AA → AAA, confirm visible alts populate.

## Commits

| Hash      | Scope                                                               |
| --------- | ------------------------------------------------------------------- |
| `228ec36` | refactor: disambiguate findVariantPairs return shape                |
| `8b252ed` | fix: flip DEFAULT_DARK to #000000 + wire app.js to sentinel         |

## Deviations from Plan

None — plan executed exactly as written. No Rule 1/2/3 auto-fixes triggered.

## Self-Check: PASSED

- `app.js`: FOUND, contains `DEFAULT_DARK = '000000'`
- `index.html`: FOUND, no `111111` matches
- `variant-search.js`: FOUND, contains `alreadyAccessible` sentinel
- `test/variant-search.test.js`: FOUND, contains both new tests
- `test/app.test.js`: FOUND, contains both new tests
- Commits `228ec36`, `8b252ed`: both present in `git log`
