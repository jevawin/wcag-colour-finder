---
phase: 02-live-preview-ui
plan: "01"
subsystem: ui
tags: [html, css, vanilla-js, wcag, live-preview, contenteditable, css-custom-properties]
dependency_graph:
  requires: [colour-engine.js]
  provides: [index.html, style.css, app.js, test/app.test.js]
  affects: []
tech_stack:
  added: []
  patterns: [css-custom-properties, es-modules, node-test, dom-guard-pattern]
key_files:
  created:
    - index.html
    - style.css
    - app.js
    - test/app.test.js
  modified: []
decisions:
  - "Pure function extraction: buildBadgeState, expandHex, formatRatio exported separately from DOM code so node:test can test them without JSDOM"
  - "Single export { } statement at module level rather than inline export keywords — cleaner separation between function definitions and public API"
  - "render() called immediately plus on DOMContentLoaded — ES module scripts defer automatically, so immediate call covers the common case while DOMContentLoaded is belt-and-braces"
metrics:
  duration_minutes: 2
  completed_date: "2026-04-12"
  tasks_completed: 3
  files_created: 4
  files_modified: 0
---

# Phase 02 Plan 01: Live Preview UI Summary

**One-liner:** Hex input wired to split-screen panels via CSS custom property `--user-colour`, with live WCAG badge updates using colour-engine.js imports and 9 passing pure-logic tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create HTML structure and CSS styles | 8ff1abc | index.html, style.css |
| 2 (RED) | Add failing tests for pure functions | a3c5df9 | test/app.test.js |
| 2 (GREEN) | Implement app.js logic and wire to engine | 06eac07 | app.js |
| 3 | Visual verification (auto-approved) | — | — |

## What Was Built

**index.html** — Full page structure: hex input with static `#` prefix, `aria-live` error span, two panel sections (light/dark) each with `contenteditable` heading and paragraph, two badge rows per panel (normal + large text), all element IDs and classes the JS selects by.

**style.css** — CSS custom properties for all colours and spacing tokens, flexbox panel layout, `--user-colour` custom property used via `color: var(--user-colour)` on `.sample-text`, `color-mix()` for 50% opacity focus outline on editable text (avoids the `opacity` pitfall that would dim text), responsive stacking below 768px.

**app.js** — Three exported pure functions (`buildBadgeState`, `expandHex`, `formatRatio`) above a DOM guard. Inside the guard: `render(hex)` sets `--user-colour` and calls `updatePanel` for both panels; `setErrorState(isError)` toggles `aria-invalid`, `input--error` class, and hides/shows error message; input event handler calls `parseHex` on every keystroke and routes to render or error state.

**test/app.test.js** — 9 tests for the three pure functions covering all boundary values from the plan: `buildBadgeState` at 2.5, 3.1, 4.6, 8.0 (all four WCAG threshold combinations); `expandHex` for 3-digit and 6-digit input; `formatRatio` rounding.

## Test Results

```
node --test test/colour-engine.test.js test/app.test.js
tests 44  |  pass 44  |  fail 0
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate export syntax error**
- **Found during:** Task 2 GREEN phase
- **Issue:** Added trailing `export { buildBadgeState, expandHex, formatRatio }` while the functions also had `export function` keywords — Node.js rejected this as duplicate exports.
- **Fix:** Removed `export` keyword from the function declarations, kept only the trailing `export { }` statement as specified in the acceptance criteria.
- **Files modified:** app.js
- **Commit:** 06eac07

### Auto-approved Checkpoints

**Task 3 (checkpoint:human-verify):** Auto-approved per `auto_advance: true` in config.json. Tests confirm correct logic. Visual check deferred to user.

## Known Stubs

None. All badge placeholder text ("Fail AA" etc.) in the HTML is replaced immediately by `render(HEX_DEFAULT)` on module load. The `—:1` ratio placeholder is also replaced on load.

## Self-Check: PASSED
