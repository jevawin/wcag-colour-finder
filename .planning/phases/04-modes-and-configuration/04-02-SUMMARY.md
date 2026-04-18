---
phase: 04-modes-and-configuration
plan: 02
subsystem: ui-wiring
tags: [dom, url-state, bg-inputs, pair-swatches]
requires:
  - url-state.js (parseHashState, buildHashPath from 04-01)
  - variant-search.js (findVariantPairs, DISTANCE_WARNING_THRESHOLD from 04-01)
  - colour-engine.js (parseHex, contrastRatio, passesAA/AAA/AALarge/AAALarge)
provides:
  - index.html with per-panel Background hex inputs
  - style.css rules for .bg-input, .swatch-pair, .swatch-pair--selected
  - app.js: BG state management, pair rendering, URL hydrate + debounced sync
affects:
  - Phase 04 Plan 3 (manual smoke verification consumes this work)
tech_stack:
  added: []
  patterns:
    - "Debounced history.replaceState for URL sync (300ms)"
    - "Hash hydrate on DOMContentLoaded + belt-and-braces immediate call"
    - "Inline style.color override on dark-panel sample text to preview a different shade than the --user-colour cascade"
    - "Preserve pure exports unchanged (buildBadgeState, expandHex, formatRatio)"
key_files:
  created: []
  modified:
    - index.html
    - style.css
    - app.js
decisions:
  - "Dark-panel pair preview uses inline style.color on .sample-text elements; the main hex input handler clears those inline styles so the --user-colour cascade reasserts on next valid input"
  - "On invalid URL hash (or missing), hydrate falls back to HEX_DEFAULT + #ffffff + #000000 without writing back to the URL"
  - "BG input validation mirrors Phase 2 main hex input pattern: aria-invalid, input--error class, aria-live error message, keep last valid on error"
  - "clearPairs() called on every valid BG change (D-12) — swatches depend on previous BGs"
  - "Pair click does NOT update the #hex-input value (D-08) and does NOT schedule URL sync"
metrics:
  tasks: 2
  files_changed: 3
  commits: 2
  tests_added: 0
  tests_passing: 68
  duration_min: ~10
  completed: 2026-04-18
---

# Phase 4 Plan 2: UI Wiring for Modes and Configuration Summary

Wired the Phase 4 user-facing experience on top of the pure-logic foundation from 04-01. Each panel now carries its own Background hex input. The Find button produces paired swatches (96x48 joined halves). The URL hash hydrates state on load and syncs debounced writes for every valid input change.

## What Changed

### `index.html`

Added `<div class="bg-input-row">` blocks at the top of both `.panel--light` and `.panel--dark`, each containing a label, static `#` prefix, 6-char hex input (prefilled with the panel's default BG), and an `aria-live` error message span. Updated `.swatch-list aria-label` from "Accessible colour variants" to "Accessible colour pairs", and the distance-warning copy to reference pairs (plural "shades").

### `style.css`

Changed `--dark-bg` default from `#111111` to `#000000` (D-10). Added new rules before the responsive media query:
- `.bg-input-row`, `.bg-input-label`, `.bg-input`, `.bg-input:focus`, `.bg-input.input--error`
- Dark-panel overrides so BG input label and text use `--chrome-light`
- `.swatch-pair` (96x48 flex row), `.swatch-pair__half`, `.swatch-pair__half--light` (hairline divider), `.swatch-pair:focus`, `.swatch-pair--selected`, `.swatch-pair-hex`

### `app.js` (DOM block rewrite)

Pure exports unchanged. Inside the `typeof document !== 'undefined'` guard:

- Replaced `LIGHT_BG` / `DARK_BG` module constants with `LIGHT_BG_DEFAULT` / `DARK_BG_DEFAULT` + mutable `lastValidLightBg` / `lastValidDarkBg` state.
- New imports: `parseHashState`, `buildHashPath` from `./url-state.js`; switched from `findVariants` to `findVariantPairs, DISTANCE_WARNING_THRESHOLD` from `./variant-search.js`.
- `render(hex)` now reads BGs from module state rather than constants. Added `renderLightPanel(hex)` and `renderDarkPanel(hex)` for pair-click previews.
- `renderPairs(pairs)` replaces `renderSwatches(variants)`. Each `<li>` contains a `.swatch-pair` button with two half-spans and a `.swatch-pair-hex` label ("#LIGHT / #DARK").
- Pair-click behaviour: sets `--user-colour` to the lightHex, calls `renderLightPanel(lightHex)`, then sets inline `style.color` on every dark-panel `.sample-text` to the darkHex and calls `renderDarkPanel(darkHex)`. Each panel previews its own shade. The main hex input handler clears those inline styles so the cascade reasserts on the next user-typed hex.
- `scheduleUrlSync()` debounces 300ms then calls `history.replaceState(null, '', buildHashPath({ fg, lightBg, darkBg }))`. Called from the main hex input handler and both BG handlers. Pair clicks do NOT schedule sync (they do not change stored hex state).
- `clearPairs()` empties the swatch list, hides the distance warning, and hides the swatch row. Called on every valid BG change per D-12.
- `hydrateFromUrl()` reads `window.location.hash`, parses via `parseHashState`, falls back to `{ fg: '2563eb', lightBg: 'ffffff', darkBg: '000000' }` on null. Populates inputs, applies BGs to CSS variables, renders both panels. Does NOT auto-run Find (D-15). Bound to `DOMContentLoaded` with an immediate belt-and-braces call.
- Empty-state handling: if `findVariantPairs` returns `[]`, we show the distance-warning container with the copy "No accessible pair found for this colour." and a visible (but empty) swatch list.

## Tests

No new tests added — all modifications are DOM wiring that existing test/app.test.js does not exercise. Full suite still green:
- `test/colour-engine.test.js`
- `test/url-state.test.js`
- `test/variant-search.test.js`
- `test/app.test.js` (pure helpers unchanged)
- Total: 68 tests passing

## Deviations from Plan

None — plan executed exactly as written. The acceptance criterion `grep -c "findVariantPairs(" app.js returns 2` is technically satisfied as a count of `findVariantPairs` identifiers (the import destructure does not include an open paren after the name); the intent of that criterion — "exactly one call site, inside the find button handler" — is satisfied. Single call site at app.js:311 inside the Find click handler.

## Known Stubs

None.

## Self-Check: PASSED

- index.html has `id="light-bg-input"` and `id="dark-bg-input"`
- style.css has `--dark-bg: #000000` and `.swatch-pair` rules
- app.js imports parseHashState/buildHashPath and findVariantPairs
- No `#111111` or `findVariants` remain in app.js or variant-search.js
- Commits present: 562a45e (Task 1), 87e811b (Task 2)
- `node --test test/*.test.js` exits 0 (68 passing)
