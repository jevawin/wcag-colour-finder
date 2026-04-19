---
phase: 05-design-and-accessibility
plan: 04
subsystem: ui
tags: [html, google-fonts, inter, jetbrains-mono, accessibility, dom-rebuild]

requires:
  - phase: 05-design-and-accessibility
    provides: 05-UI-SPEC mockup ground truth + 05-VERIFICATION gaps G1/G2/G6/G7/G10
provides:
  - New mockup-aligned DOM skeleton for index.html
  - Google Fonts Inter + JetBrains Mono loaded with preconnect
  - Topbar-wrap shell with controls hosting hex input, Find button, AA/AAA toggle
  - Preview panels with fg-tag / bg-tag / ratio-row / pills (aria-live) / heading / para / digits
  - IDs/classes matching the mockup script contract for 05-06 rewire
affects: [05-05-rebuild-styles, 05-06-rewire-app, 05-07-alts-grid-polish, 05-08-a11y-reaudit]

tech-stack:
  added:
    - Google Fonts Inter (400/500/600/700) via CDN stylesheet
    - Google Fonts JetBrains Mono (400/500/600) via CDN stylesheet
  patterns:
    - Full-bleed topbar shell (.topbar-wrap > .topbar) + split previews
    - Fixed specimen copy ("The quick brown fox" + body para + digits row) — no contenteditable
    - Copy affordance via SVG icon inside .copy-btn with data-copy-target hook
    - Native <input type="color"> paired with hex text input (swatch + hash + 6-char)

key-files:
  created: []
  modified:
    - index.html
    - test/british-spelling.test.js

key-decisions:
  - "HTML native <input type=\"color\"> added to british-spelling allow-list (American-by-spec, mirrors existing CSS color: allow rule)"
  - "Kept external style.css + app.js module split (mockup is single-file; our build stays split)"
  - "Default base colour stays #2563EB per INP-03 — mockup's #6BD4AC overridden in every seeded value (base-swatch style, base-color, base-text, light-fg-hex, dark-fg-hex)"
  - "Straight double-quotes around \"Find 5\" in subtitle copy (mockup uses curly quotes; project convention is straight)"
  - "aria-live=\"polite\" added to both .pills containers beyond mockup (plan-checker patch for A11Y-02 announcement parity)"

patterns-established:
  - "DOM contract: mockup IDs are the wire between markup and upcoming app.js rewire (base-text, base-color, find-btn, find-btn-label, target-toggle, alts, preview-light, preview-dark, light-ratio, light-pills, dark-ratio, dark-pills, light-fg-hex, dark-fg-hex, light/dark-bg-color, light/dark-bg-text)"
  - "Copy button uses SVG + data-copy-target attribute to name its source hex element — decouples from fragile DOM walking"

requirements-completed: [UI-01, UI-02, UI-03]

duration: ~8 min
completed: 2026-04-19
---

# Phase 05 Plan 04: Rebuild Markup and Fonts Summary

**New mockup-aligned index.html with Google Fonts (Inter + JetBrains Mono), full-bleed topbar shell, split light/dark preview panels, and all sample-text contenteditable patterns retired.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-19T18:43:56Z
- **Completed:** 2026-04-19T18:51:56Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Rebuilt index.html from scratch to match Claude Design mockup body structure (lines 518-601 of the mockup source)
- Wired Google Fonts Inter (400/500/600/700) + JetBrains Mono (400/500/600) via preconnect + CSS2 stylesheet
- Established the mockup's ID/class contract so 05-05 CSS and 05-06 JS rewire can target verbatim selectors
- Retired the editable `.sample-text` / `.sample-heading` / `.sample-para` / `.numerals` pattern — specimen copy is now fixed in markup
- Closed gaps G1 (topbar shell), G2 (controls inside topbar), G6 (typography system DOM hooks), G7 (new specimen copy), G10-markup (no contenteditable)

## Task Commits

1. **Task 1: Replace index.html with mockup-aligned skeleton** — `e60355c` (feat)

Plan metadata commit follows this SUMMARY write.

## Files Created/Modified
- `index.html` — wholesale rewrite: topbar-wrap + .topbar > .title-row + .controls(.row-one + .row-two > .alts), mobile tab bar, .previews > .preview.is-light + .preview.is-dark with fg-tag/bg-tag/ratio-row/pills/heading/para/digits; legacy .control-zone / .preview-zone / .aa-toggle / contenteditable .sample-text removed
- `test/british-spelling.test.js` — extended COLOR_ALLOW with `type="color"` / `type='color'` to permit HTML native colour-picker input (same rationale as existing CSS `color:` and JS `.style.color` allow entries)

## Decisions Made
- HTML native `<input type="color">` now explicitly allowed by the British-spelling audit. The test previously permitted `color:` (CSS) and `.style.color` (JS) as American-by-spec identifiers; the HTML attribute value follows the same logic.
- Kept `<link rel="stylesheet" href="style.css">` and `<script type="module" src="app.js">` — our build retains the external split even though the mockup is inlined.
- Default base colour seeded as `#2563EB` across `base-swatch` inline style, `base-color` value, `base-text` value, `light-fg-hex` text, and `dark-fg-hex` text (5 occurrences — mockup's `#6BD4AC` overridden per INP-03).
- Added `aria-live="polite"` to both `#light-pills` and `#dark-pills` beyond the mockup — required by the 05-04 plan frontmatter and plan-checker patch (A11Y-02 announcement parity).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended british-spelling allow-list for `type="color"`**
- **Found during:** Task 1 (British-spelling verify step)
- **Issue:** The new mockup markup adds three `<input type="color">` native colour pickers. The existing `test/british-spelling.test.js` flagged the bare word `color` on those three lines, blocking the verify gate. The legacy markup did not use native colour inputs, so this only surfaced after the task's own changes — within scope.
- **Fix:** Added `type="color"` and `type='color'` to the `COLOR_ALLOW` list alongside the existing CSS/JS allow entries. Rationale documented inline (American-by-spec HTML form control, same logic as `color:` CSS property).
- **Files modified:** `test/british-spelling.test.js`
- **Verification:** `node --test test/british-spelling.test.js` — 4/4 pass.
- **Committed in:** `e60355c` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to clear the plan's own verify gate. No scope creep — pure allow-list maintenance triggered by required mockup markup.

## Issues Encountered
None beyond the deviation above. All 26 acceptance-criteria greps returned the expected counts.

## Acceptance Criteria — Verification

All greps from plan acceptance_criteria returned expected counts:

| Check | Expected | Actual |
| --- | --- | --- |
| `fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600` | 1 | 1 |
| `class="topbar-wrap" id="topbar-wrap"` | 1 | 1 |
| `class="target-toggle"` | 1 | 1 |
| `data-target="AA"` / `data-target="AAA"` | 1 / 1 | 1 / 1 |
| `id="alts"` | 1 | 1 |
| `class="fg-tag"` / `class="bg-tag"` | 2 / 2 | 2 / 2 |
| `data-copy-target="light-fg-hex"` / dark | 1 / 1 | 1 / 1 |
| `id="light-ratio"` / `id="dark-ratio"` | 1 / 1 | 1 / 1 |
| `class="pills"` | 2 | 2 |
| `id="light-pills" aria-live="polite"` / dark | 1 / 1 | 1 / 1 |
| `class="heading"` / `class="digits"` | 2 / 2 | 2 / 2 |
| `The quick brown fox` | 2 | 2 |
| `contenteditable` / `sample-text` / `sample-heading` / `sample-para` / `control-zone` / `preview-zone` / `aa-toggle` | 0 each | 0 each |
| `2563EB` | ≥4 | 5 |
| `<link rel="stylesheet" href="style.css">` / `<script type="module" src="app.js">` | 1 / 1 | 1 / 1 |
| `node --test test/british-spelling.test.js` smoke | green | green |

## Next Phase Readiness
- `index.html` exposes every ID/class the mockup script queries — 05-05 (CSS) and 05-06 (JS rewire) can target verbatim selectors.
- Expected temporary breakage: `app.js` still references old IDs (`#hex-input`, `.sample-text`, `#swatch-row`, etc.) — full test suite will be red until 05-06 lands. Plan verification note (line 154) acknowledges this.
- No blockers for 05-05.

## Self-Check: PASSED

- `index.html` present (FOUND)
- `test/british-spelling.test.js` present (FOUND)
- Commit `e60355c` present in log (FOUND)

---
*Phase: 05-design-and-accessibility*
*Completed: 2026-04-19*
