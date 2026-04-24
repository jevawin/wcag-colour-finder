---
phase: 07-search-correctness-spread
plan: 03
subsystem: app-integration
tags: [app, variant-search, wcag, aaa, already-accessible]
requires:
  - findVariantPairs(input, lightBg, darkBg, count=5, targetRatio=4.5) — Wave 2 / 07-02
  - announce() + prevAltsLen module-level plumbing (existing)
provides:
  - autoFindAndApply now passes targetRatio derived from state.target
  - Already-accessible status announcement (distinct from no-solution copy)
affects:
  - app.js (autoFindAndApply replaced; post-filter removed)
  - test/app.test.js (3 new integration tests)
tech-stack:
  added: []
  patterns:
    - Threshold-parameterised call site (single source of truth at call site — D-02)
    - Transition-gated aria-live announcements (prevAltsLen state machine)
key-files:
  created: []
  modified:
    - app.js
    - test/app.test.js
decisions:
  - "D-02: state.target → 4.5 (AA) or 7.0 (AAA) → findVariantPairs 5th arg"
  - "D-04: post-filter removed from autoFindAndApply — search is single source of truth"
  - "D-12: findVariantPairs [] vs null vs non-empty handled as three distinct branches"
  - "D-15: 'No accessible pair found for this colour' copy preserved for genuine no-solution branch"
  - "Already-accessible copy: 'This colour is already accessible on both backgrounds' (British spelling, no 'color')"
  - "contrastRatio import kept — still used by chooseChromeForeground + renderPanel"
requirements:
  - SEARCH-01
  - SEARCH-02
  - SEARCH-03
metrics:
  duration: 8m
  tasks: 2
  files_modified: 2
  tests_added: 3
  tests_total: 110
completed: 2026-04-24
---

# Phase 7 Plan 3: app Integration Summary

One-liner: `autoFindAndApply` now threads `targetRatio` (4.5 AA / 7.0 AAA) into `findVariantPairs`, drops the post-filter, and announces "already accessible" when the search returns `[]` — full suite 110/110 green.

## What Shipped

### `app.js:autoFindAndApply` — rewritten

Before (Phase 5-06 post-filter pattern):

```javascript
const pairs = findVariantPairs('#' + state.base, '#' + state.light, '#' + state.dark) || [];
const threshold = state.target === 'AAA' ? 7.0 : 4.5;
const filtered = pairs.filter(p => { /* post-filter by threshold */ }).map(...);
```

After (Phase 7 threshold-aware search):

```javascript
const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;
const raw = findVariantPairs(
  '#' + state.base,
  '#' + state.light,
  '#' + state.dark,
  5,
  targetRatio,
);
const alreadyAccessible = Array.isArray(raw) && raw.length === 0;
const pairs = Array.isArray(raw) ? raw : [];
// ... map into state.alts, apply first-pair default, transition-gated announce
```

### Three-way branch on search result

| `findVariantPairs` return | Cause | Behaviour |
|---|---|---|
| `null` | Invalid base hex | `state.alts = []`, no "already accessible" announcement |
| `[]` | Input passes `targetRatio` on BOTH BGs (D-12) | `state.alts = []`, announce "This colour is already accessible on both backgrounds" on transition |
| non-empty array | Normal search result | Populate `state.alts`, first pair auto-applied if no selection |

### Announcements (transition-gated via `prevAltsLen`)

- Previous had results, new is `[]` from already-accessible path → "This colour is already accessible on both backgrounds"
- Previous had results, new is `[]` from genuine no-solution → "No accessible pair found for this colour" (D-15, existing copy preserved)
- Previous was already 0 and new is 0 → silent (no state change)

### Imports

`contrastRatio` import **kept** — still consumed by `chooseChromeForeground` (line 67) and `renderPanel` (line 164). No import changes needed.

### `test/app.test.js` — 3 new integration tests

New imports: `findVariantPairs` from `../variant-search.js`, `contrastRatio` from `../colour-engine.js`.

New `describe('app.js integration — findVariantPairs call pattern')` block:

1. **AA call shape** — `findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 4.5)` returns an array
2. **AAA call shape** — `findVariantPairs('#2563EB', '#FFFFFF', '#000000', 5, 7.0)` returns array where every pair genuinely passes 7.0 on its BG
3. **Already-accessible contract** — `findVariantPairs('#000000', '#FFFFFF', '#888888', 5, 4.5)` returns `[]` (verified `#000` vs `#888` = 5.92:1, clears AA)

## Verification

- `node --test test/app.test.js` → 16/16 pass (13 existing + 3 new)
- `node --test 'test/*.test.js'` → **110/110 pass, zero regressions**

### Acceptance marker counts (post-edit)

| Check | Count | Expected |
|---|---|---|
| `grep -c "pairs.filter" app.js` | 0 | 0 |
| `grep -c "const threshold = state.target" app.js` | 0 | 0 |
| `grep -c "const targetRatio = state.target" app.js` | 1 | ≥1 |
| `grep -c "already accessible" app.js` | 3 | ≥1 |
| `grep -c "No accessible pair found for this colour" app.js` | 2 | ≥1 |

## Commits

- `2bee9e8` — refactor(07-03): thread targetRatio through autoFindAndApply and add already-accessible branch
- `29e3582` — test(07-03): add integration coverage for autoFindAndApply call shape

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes (Rules 1–3) needed. No architectural decisions (Rule 4) needed. No authentication gates.

## Known Stubs

None. All new branches are fully wired. Manual browser smoke test (per phase verification block) is the remaining gate — handled by the phase verifier, not this plan.

## Self-Check: PASSED

- FOUND: app.js contains `const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;`
- FOUND: app.js contains `findVariantPairs(` with 5-arg call including `targetRatio`
- FOUND: app.js contains `already accessible`
- FOUND: app.js contains `'No accessible pair found for this colour'`
- MISSING: `pairs.filter` in app.js (expected — post-filter removed, D-04)
- MISSING: `const threshold = state.target` in app.js (expected — replaced by `targetRatio`)
- FOUND: test/app.test.js contains `describe('app.js integration — findVariantPairs call pattern'`
- FOUND: test/app.test.js imports `findVariantPairs` and `contrastRatio`
- FOUND: commit `2bee9e8`
- FOUND: commit `29e3582`
- FOUND: `node --test test/app.test.js` exits 0 (16/16)
- FOUND: `node --test 'test/*.test.js'` exits 0 (110/110)
