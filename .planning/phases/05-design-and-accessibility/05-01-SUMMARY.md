---
phase: 05-design-and-accessibility
plan: 01
subsystem: pure-helpers
tags: [wave-0, testing, helpers, a11y]
requirements: [UI-03, A11Y-01, A11Y-02]
dependency-graph:
  requires: [colour-engine.js (contrastRatio, parseHex, srgbToOklab, oklabToSrgb)]
  provides: [buildBadgeHTML, chooseChromeForeground, deriveBadgeColors]
  affects: [Plan 05-02 DOM wiring, Plan 05-03 a11y audit]
tech-stack:
  added: []
  patterns:
    - "Pure helpers exported above the DOM guard for node:test coverage"
    - "OKLab lightness shift with AA fallback for derived badge colours"
    - "Grep-style spelling audit via fs.readFileSync + word-boundary regex"
key-files:
  created:
    - test/badge-markup.test.js
    - test/ui-chrome-contrast.test.js
    - test/british-spelling.test.js
  modified:
    - app.js
    - test/app.test.js
decisions:
  - "Changed FALLBACK passBg from #16a34a to #15803d — the planned value had ~3.30 contrast with white and would have failed the AA guard it is meant to enforce"
  - "British-spelling allow-list permits bare `color:` CSS declarations (American-by-spec) plus known JS identifiers applyColor/clearColor/checkTopZoneContrast per D-14"
metrics:
  duration-minutes: 3
  completed: 2026-04-19
---

# Phase 05 Plan 01: Pure Helpers and Wave 0 Summary

Extracted three DOM-free pure helpers (`buildBadgeHTML`, `chooseChromeForeground`, `deriveBadgeColors`) from app.js and installed three node:test suites — badge markup, top-zone/badge contrast, British-spelling audit — so Wave 1 DOM work can import tested logic.

## What Shipped

### New exports in app.js
- `buildBadgeHTML(passes, label)` — returns `<span aria-hidden="true">✓</span><span>Pass AA</span>`-style markup.
- `chooseChromeForeground(userHex)` — picks `#000000` when black-on-userHex ≥ 4.5:1, else `#ffffff`.
- `deriveBadgeColors(userHex)` — OKLab-shift derived `{passBg, passText}` with AA-safe fallback.

### New test files
| File | Assertions | Coverage |
|------|-----------:|----------|
| `test/badge-markup.test.js` | 5 | aria-hidden attr, Pass/Fail labels, tick/cross glyph, ordering, span count |
| `test/ui-chrome-contrast.test.js` | 10 | 6× chooseChromeForeground cases + 4× deriveBadgeColors cases incl. fallback |
| `test/british-spelling.test.js` | 4 | smoke + one test per scanned file (index.html, app.js, style.css) |

### Modified tests
- `test/app.test.js` — imports and smokes `buildBadgeHTML('Pass AAA Large')`.

## Test Results

```
node --test test/*.test.js
# tests 88, pass 88, fail 0
```

Baseline before plan: 68 passing. Added 20 assertions across 4 new suites.

## British-Spelling Audit Handoff for Plan 02

The audit passes cleanly against the current tree. **No offenders to fix.** The allow-list covers the existing American-by-spec surface (CSS `color:` declarations, `color-mix`, `outline-color`, alignment `center` keyword, `applyColor` JS identifier, etc.). Plan 02 should re-run the suite after any new copy lands.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fallback green pair failed AA**
- **Found during:** Task 2
- **Issue:** Plan specified `FALLBACK = { passBg: '#16a34a', passText: '#ffffff' }`. Actual contrast is ~3.30, which fails AA 4.5:1 — the fallback that is supposed to *guarantee* AA would have silently shipped a failing pair.
- **Fix:** Changed `passBg` to `#15803d` (Tailwind green-700, ~5.02:1 vs white). Updated the inline comment to document the deviation.
- **Files modified:** `app.js`
- **Commit:** `dfec661`

No architectural changes. No auth gates.

## Verification Against Success Criteria

- [x] `grep -nE "function (buildBadgeHTML|chooseChromeForeground|deriveBadgeColors)" app.js` → 3 matches
- [x] All three helpers in the `export { ... }` list at line 117
- [x] `node --test test/badge-markup.test.js test/ui-chrome-contrast.test.js test/british-spelling.test.js` exits 0
- [x] `node --test test/*.test.js` (full suite) exits 0 — 88/88 passing
- [x] No DOM/CSS changes — only app.js (above DOM guard) and test files

## Known Stubs

None. All new exports have real implementations backed by tests. `setBadge` in app.js is intentionally untouched and will be rewired to `buildBadgeHTML` in Plan 02 as specified by the plan's Task 1 note.

## Self-Check: PASSED

Verified on disk:
- `app.js` — present, 3 new functions, export list updated
- `test/badge-markup.test.js` — present (5 assertions)
- `test/ui-chrome-contrast.test.js` — present (10 assertions)
- `test/british-spelling.test.js` — present (4 tests, 3× readFileSync calls)
- `test/app.test.js` — modified with new import and assertion
- Commits `6588ff4`, `dfec661`, `2025e50` all present in `git log`
