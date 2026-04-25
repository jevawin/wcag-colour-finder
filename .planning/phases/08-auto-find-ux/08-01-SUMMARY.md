---
phase: 08-auto-find-ux
plan: 01
subsystem: ui
tags: [hex-input, pure-helper, tdd, node-test]

requires:
  - phase: 02-live-preview-ui
    provides: pure-function extraction pattern (helpers above DOM guard, named exports for node:test)
provides:
  - expandShorthandIfValid pure helper exported from app.js
  - Six-case unit-test block for shorthand expansion decision
affects: [08-auto-find-ux Plan 02 (wireHexInput blur-expand wiring)]

tech-stack:
  added: []
  patterns:
    - Shorthand-validation gate decoupled from DOM wiring (D-17): single source of truth for "is this expandable?"

key-files:
  created: []
  modified:
    - app.js
    - test/app.test.js

key-decisions:
  - "Helper lives above DOM guard alongside expandHex/formatRatio — no DOM, no imports, unit-testable without JSDOM"
  - "Strict gate: returns null for anything that is not exactly 3 valid hex chars (with optional leading #) — no double-expand on 6-char input"

patterns-established:
  - "Pure validation helpers next to their formatters (expandShorthandIfValid sits alongside expandHex)"

requirements-completed: [INPUT-03]

duration: 1min
completed: 2026-04-25
---

# Phase 8 Plan 01: expandShorthandIfValid helper Summary

**Pure expandShorthandIfValid(value) helper added to app.js with strict 3-char gate and six-case node:test coverage; Wave 1 unblocks Plan 02 blur-expand wiring.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-25T19:45:01Z
- **Completed:** 2026-04-25T19:45:53Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- expandShorthandIfValid added at app.js:64 (above DOM guard at line 104)
- Export list updated to include the new helper
- Six it() blocks under describe('expandShorthandIfValid') in test/app.test.js
- Full test suite green: 118/118 pass (was 112 before)

## Task Commits

TDD execution — RED then GREEN, no refactor needed.

1. **Task 1 RED: failing tests** - `82fdd11` (test)
2. **Task 1 GREEN: helper + export** - `22c8f81` (feat)

## Files Created/Modified

- `app.js` - Added expandShorthandIfValid (line 64) and exported it (line 100)
- `test/app.test.js` - Added expandShorthandIfValid to import line and added six-case describe block

## Decisions Made

None new — followed plan as specified. Helper shape, location, and test cases all match the plan's exact action steps.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 02 can now `import { expandShorthandIfValid } from './app.js'` (or use it in-file) for wireHexInput blur-expand
- Helper is the single source of truth for the shorthand-expand decision per D-17

## Self-Check: PASSED

- FOUND: app.js (function at line 64, export at line 100, both above DOM guard at line 104)
- FOUND: test/app.test.js (describe('expandShorthandIfValid', ...) block, six it() cases)
- FOUND: commit 82fdd11 (test)
- FOUND: commit 22c8f81 (feat)
- node --test 'test/*.test.js' → 118 pass, 0 fail

---
*Phase: 08-auto-find-ux*
*Completed: 2026-04-25*
