---
phase: quick-260424-tzn
plan: 01
subsystem: hex-input
tags: [ux, input, hex]
requirements: [QUICK-260424-TZN]
key-files:
  modified:
    - app.js
metrics:
  tasks: 1
  files: 1
  tests: 87/87
  completed: 2026-04-24
---

# Quick Task 260424-tzn: Disable Hex Input 3-char Autocomplete

Restricted `wireHexInput` keystroke guard in `app.js` to fire `setter(v)` only on 6-char hex values. Typing `abc` now stays as `ABC` in the field instead of auto-expanding to `AABBCC` mid-typing.

## Change

`app.js:317` — one-line edit inside `wireHexInput`:

- Before: `if ((v.length === 3 || v.length === 6) && parseHex(v)) setter(v);`
- After:  `if (v.length === 6 && parseHex(v)) setter(v);`

## Untouched

- `expandHex` helper — still expands 3-char shorthand for URL hydrate and non-keystroke callers
- `setBase` / `setLightBg` / `setDarkBg` — still call `expandHex(...)` internally, so 3-char shorthand from URL or other entry points still works
- Native colour picker wiring
- `test/app.test.js` — all 87 tests pass including the expandHex cases

## Verification

- `grep "v.length === 3" app.js` — no match
- `grep "v.length === 6 && parseHex" app.js` — matches line 317
- `node --test test/*.test.js` — 87/87 pass
- Served `app.js` on port 8080 preview reflects the change

## Deviations from Plan

None. Plan executed exactly as written.

## Commit

- `b1b3c2e` fix(260424-tzn): stop hex input auto-expanding 3-char shorthand

## Self-Check: PASSED

- FOUND: app.js (modified, line 317 updated)
- FOUND: commit b1b3c2e
- FOUND: .planning/quick/260424-tzn-disable-hex-input-3-char-autocomplete/260424-tzn-SUMMARY.md
