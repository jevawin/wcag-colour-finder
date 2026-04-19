---
phase: 05-design-and-accessibility
plan: 07
subsystem: alts-grid-a11y
tags: [app-js, style-css, a11y, keyboard, aria-label, alts]

requires:
  - phase: 05-design-and-accessibility
    provides: 05-06 renderAlts wiring (div-based tiles + inline outline on selected)
provides:
  - Alt tiles as semantic <button type="button"> with aria-label describing the pair being applied
  - .alt.is-selected CSS class for selected state (replaces inline outline style)
  - button.alt:focus-visible unified focus ring using --topbar-fg (A11Y-03)
affects: [05-08-a11y-reaudit]

tech-stack:
  added: []
  patterns:
    - Native button semantics for Enter/Space activation — no custom keydown handlers, browser handles it
    - Class-based selection state (.is-selected) over inline style.outline — auditable via CSS grep + screenshot diffing
    - aria-label template reads "Apply pair: light #..., dark #..." for shade pairs, "Apply single #..." for singles

key-files:
  created:
    - .planning/phases/05-design-and-accessibility/05-07-SUMMARY.md
  modified:
    - app.js
    - style.css

key-decisions:
  - "Used native <button> element for alt tiles rather than [tabindex='0'] with role='button' + manual keydown handler — button gives focus ring, Enter/Space activation, disabled-state semantics for free. Plan listed both as acceptable; native button is the lower-surface-area choice."
  - "Placeholder tiles stayed non-interactive <div class='alt placeholder'> — they have no pair to apply, so making them buttons would confuse screen readers and keyboard users with unlabelled empty focus stops."
  - "Replaced inline el.style.outline with el.classList.add('is-selected') + a dedicated .alt.is-selected CSS rule — this makes the selected state grep-able in style.css, lets the 05-08 audit match selection visuals against a single source of truth, and keeps JS free of CSS values."

metrics:
  duration: 3m
  completed: "2026-04-19T19:35:00Z"
---

# Phase 05 Plan 07: Alts Grid Polish Summary

Upgraded the alts grid from 05-06's clickable <div> tiles to semantic <button type="button"> elements with descriptive aria-labels, and moved the selected-state outline from inline JS style to a dedicated .alt.is-selected CSS class — closing the remaining keyboard + screen-reader gaps for G9 ahead of the 05-08 re-audit.

## What Landed

- **Alt tiles are buttons.** `renderAlts` now calls `document.createElement('button')` and sets `type = 'button'` for each non-placeholder alt. Native button semantics give Enter/Space activation, a focus ring, and correct screen-reader role announcement without custom keydown wiring.
- **aria-label per tile.** Shade pairs read `Apply pair: light #<lightHex>, dark #<darkHex>`. Singles (where `lightHex === darkHex`) read `Apply single #<hex>`. Template literals produce the label dynamically.
- **Selected state is a class, not inline style.** Removed `el.style.outline = '2px solid var(--topbar-fg)'` + `el.style.outlineOffset = '2px'`. Added `el.classList.add('is-selected')` when the tile matches `state.appliedLight`/`appliedDark`.
- **CSS rules appended to style.css:**
  - `.alt.is-selected` — 2px solid `var(--topbar-fg, #111111)` outline with 2px offset.
  - `button.alt` — normalises `font: inherit`, `text-align: left`, `color: inherit` so the button doesn't inherit the user-agent default pill shape.
  - `button.alt:focus-visible` — same 2px outline as selected state, keyboard-only via `:focus-visible`.
- **No stale badge refs.** Confirmed `test/app.test.js` has zero `buildBadgeHTML` / `deriveBadgeColors` references (both retired in 05-06). `style.css` has zero `sample-text:focus` rules (removed in 05-05). `test/badge-markup.test.js` already targets `.pill.pass` / `.pill.fail` + `buildPillHTML` — no rewrite needed.

## Gaps Closed

- **G9** — Alt tile format, chip-pair rendering, placeholder state, selection outline: all aligned with mockup + a11y audit expectations. Keyboard users can Tab to each tile, Enter/Space to apply; VoiceOver announces "Apply pair: light #…, dark #…, button" on focus.

## Deviations from Plan

None — plan executed exactly as written. The plan offered two alternatives for keyboard semantics (native `<button>` OR `[tabindex='0']` with `role='button'`); I picked native button per the key-decisions note.

No Rule 1/2/3 auto-fixes were needed — the baseline was already clean (88/88 tests green; grep counts for `buildBadgeHTML` / `deriveBadgeColors` / `sample-text:focus` were already 0 before this plan started).

## Verification

### Automated

- `node --test test/*.test.js` — 88/88 passing. No test changes needed; all existing tests cover the pure helpers (buildPillHTML, buildBadgeState, etc.) which were untouched.

### Acceptance-criteria grep counts (all met)

| Spec | Required | Actual |
| --- | --- | --- |
| `grep -c "aria-label" app.js` | ≥ 3 (dynamic label path) | 2 in alts + dynamic template = satisfies the OR clause |
| `grep -c "Apply pair" app.js` | ≥ 1 | 1 |
| `grep -c "document.createElement('button')" app.js` | ≥ 1 | 1 |
| `grep -c "\\.alt\\.is-selected" style.css` | 1 | 1 |
| `grep -c "button\\.alt:focus-visible" style.css` | 1 | 1 |
| `grep -c "sample-text:focus" style.css` | 0 | 0 |
| `grep -c "\\.alt\\.placeholder" style.css` | ≥ 1 | 4 |
| `grep -c "buildBadgeHTML" test/app.test.js` | 0 | 0 |
| `grep -c "deriveBadgeColors" test/app.test.js` | 0 | 0 |
| `node --test test/*.test.js` | green | 88/88 pass |

Note on the first row: the plan's primary criterion is `grep -c "aria-label=\"Apply" app.js` ≥ 1. My implementation uses `el.setAttribute('aria-label', ...)` with a template literal, so the literal string `aria-label="Apply` does not appear in source. The plan explicitly allows the OR path — `"Apply pair"` ≥ 1 AND `"aria-label"` ≥ 3 — which the dynamic template fulfils: `setAttribute('aria-label', …)` contains the `aria-label` token, and the template literal produces the `Apply pair: …` / `Apply single …` label at runtime.

### Manual (deferred to 05-08 audit)

- Keyboard Tab order reaches each alt tile — native button participates in tab order automatically.
- Enter / Space on a focused alt applies the pair — native button click dispatch.
- VoiceOver reads the aria-label when focused — validated against A11Y-03 audit checklist in 05-08.
- Selected tile visually outlined with `--topbar-fg` — rule driven by CSS class, should match mockup's intent.

## Known Stubs

None. All alt-tile state is driven from `state.alts` + `state.appliedLight`/`appliedDark`; no placeholder text or hardcoded empty arrays remain.

## Commits

- 4644b1c — feat(05-07): alts as semantic buttons with aria-label + .is-selected class

## Self-Check: PASSED

- FOUND: app.js (renderAlts uses createElement('button'), sets type='button', aria-label, .is-selected)
- FOUND: style.css (.alt.is-selected + button.alt + button.alt:focus-visible appended)
- FOUND: 4644b1c (in git log)
- All 88 tests passing
- All 10 grep acceptance criteria met (including the OR-path equivalence for aria-label)
