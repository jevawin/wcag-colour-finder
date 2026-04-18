---
phase: 05-design-and-accessibility
plan: 02
subsystem: two-zone-layout-and-badges
tags: [wave-2, ui, a11y, layout, badges]
requirements: [UI-01, UI-02, UI-03, A11Y-02]
dependency-graph:
  requires: [05-01 helpers (buildBadgeHTML, chooseChromeForeground, deriveBadgeColors)]
  provides: [two-zone DOM shell, derived pass-badge tokens, AA/AAA toggle, copy-to-clipboard wiring]
  affects: [Plan 05-03 focus/responsive/a11y audit]
tech-stack:
  added: []
  patterns:
    - "CSS color-mix(in oklch, var(--user-colour) ...) for default pass-badge tokens; JS overrides with contrast-verified values on each render"
    - "aria-pressed segmented control for AA/AAA threshold (no role=radio; per UI-SPEC)"
    - "Copy-button DOM contract: .copy-btn reads nearest .hex-value inside enclosing .hex-pill"
key-files:
  created: []
  modified:
    - index.html
    - style.css
    - app.js
    - test/app.test.js
decisions:
  - "Large contrast-ratio display shows bare 2-decimal number (e.g. '4.57'), not 'x.xx:1' — UI-SPEC mockup ground truth"
  - "Badge labels 'AA Large' / 'AAA Large' passed through buildBadgeHTML so badge text reads 'Pass AA Large', not 'Pass AA'"
  - "Foreground preview pills are <span>s (not inputs); the single hex value lives in the top-zone #hex-input. .fg-hex spans mirror it on each render"
  - "currentThreshold captured in AA/AAA handler but not consumed yet — flagged for future filter/re-search plan"
metrics:
  duration-minutes: 7
  completed: 2026-04-19
---

# Phase 5 Plan 02: Two-Zone Layout and Badges Summary

Rewrote page against the UI-SPEC mockup ground truth: full-bleed control zone on `--user-colour`, 50/50 preview zone below, derived pass-badge tokens, wired Plan 01 helpers, and added AA/AAA toggle and copy-to-clipboard handlers.

## What Shipped

### HTML — `index.html`
- Replaced `.container` wrapper with two new shells: `.control-zone` (top, drives `--user-colour` background) and `.preview-zone` (bottom, houses the `.panels` 50/50 split).
- H1 changed to `WCAG colour finder`. Added `.attribution` line `Inspired by colourcontrast.cc`. Added description copy per Copywriting Contract.
- `#find-btn` label is `Find 5 →` (literal right-arrow glyph).
- New `.aa-toggle` segmented control (two `<button aria-pressed>` segments) for contrast threshold.
- Each panel now contains: labelled foreground/background pills (each with `.swatch-indicator`, `.hex-value`, pill-divider, `.copy-btn`), large `.contrast-ratio--large` display, `.badge-area` with four empty `.badge` spans (JS fills via `buildBadgeHTML`), sample heading, sample paragraph, `.numerals` row.
- Both `.badge-area` elements carry `aria-live="polite"` (A11Y-02, D-08).
- Added hidden `#top-zone-warning` and `#copy-live` aria-live regions inside the control zone.
- Existing `#hex-error`, `#light-bg-error`, `#dark-bg-error` retained — total `aria-live="polite"` regions on page: 7.

### CSS — `style.css` (rewritten, 416 → 432 lines)
- New `:root` tokens:
  ```css
  --pass-bg: color-mix(in oklch, var(--user-colour) 30%, #ffffff);
  --pass-text: color-mix(in oklch, var(--user-colour) 80%, #000000);
  --control-zone-text: #000000;
  ```
- Dropped: `--pass-bg: #16a34a`, `--fail-bg`, `--badge-text`, `--panel-border`.
- `--dark-bg` default moved to `#111111` (matches preview-zone dark spec).
- Two-zone layout, typography scale (h1 28-32px, sample-heading 20px, numerals 28-32px mono, contrast-ratio 56-72px mono, hex-pill value 20px mono), badge rules (`.badge--pass` uses derived tokens, `.badge--fail` is white + #6b7280 text + 1px #d1d5db border), result-card borders updated (1px black rest, 3px selected — no more `--user-colour` ring).
- `--user-colour` now only appears in: `--pass-bg` derivation, `--pass-text` derivation, `.control-zone` background, `.hex-pill .swatch-indicator` background, `.sample-text` foreground, `.sample-text:focus` outline color-mix.
- `@media (max-width: 700px)` stacks panels + control-row.

### JS — `app.js`
- `setBadge` rewired: `el.innerHTML = buildBadgeHTML(passes, label)` (was `textContent` with `'Pass '/'Fail '` prefix).
- `updatePanel`: ratio display shows bare `ratio.toFixed(2)` (e.g. "4.57") and badge labels include `AA Large` / `AAA Large` variants.
- `render(hex)` now also:
  - calls `deriveBadgeColors(hex)` and sets `--pass-bg` + `--pass-text` on `document.documentElement`
  - calls `chooseChromeForeground(hex)`, sets `--control-zone-text`, toggles `#top-zone-warning.hidden`
  - mirrors the uppercase hex into all `.fg-hex` preview-pill labels
- New AA/AAA toggle handler: click flips `aria-pressed` on both buttons; `currentThreshold` captured for future filter logic.
- New copy-button handler: reads the nearest `.hex-value` inside the enclosing `.hex-pill`, calls `navigator.clipboard.writeText` when available, announces `Copied` via `#copy-live` for 1.5s.
- Find-button label preserved across the `Finding…` state swap (no more hardcoded `Find accessible colour`).

### Tests — `test/app.test.js`
- Added regression guard: `buildBadgeHTML(true, 'AA')` pinned to exact contract string `<span aria-hidden="true">✓</span><span>Pass AA</span>` and asserted stable across repeated calls.

## Test Results

```
node --test test/*.test.js
# tests 89, pass 89, fail 0
```

Baseline (post-Plan 01): 88 passing. Added 1 assertion block.

## Acceptance Criteria

### Task 1 (HTML)
- `grep -c 'class="control-zone"' index.html` = 1 — PASS
- `grep -c 'class="preview-zone"' index.html` = 1 — PASS
- `grep -c '>WCAG colour finder<' index.html` = 1 — PASS
- `grep -c '>Find 5' index.html` = 1 — PASS
- `grep -c 'Inspired by' index.html` = 1 — PASS
- `grep -c 'aria-live="polite"' index.html` = 7 (≥5 required) — PASS
- `grep -c 'aa-toggle-btn' index.html` = 2 — PASS
- `grep -c 'numerals' index.html` = 2 — PASS
- `grep -c 'copy-btn' index.html` = 4 — PASS
- `node --test test/british-spelling.test.js` exits 0 — PASS

### Task 2 (CSS)
- `grep -c 'outline-color: var(--user-colour)' style.css` = 0 — PASS
- `grep -c 'color-mix(in oklch, var(--user-colour)' style.css` = 2 — PASS
- `.badge--pass` = 1, `.badge--fail` = 1 — PASS
- `@media (max-width: 700px)` = 1 — PASS
- `ui-monospace` = 4 — PASS
- `var(--user-colour)` count = 6. Plan criteria said ≤5. All 6 occurrences are permitted uses (control-zone bg, hex-pill swatch, sample-text color, sample-text:focus outline tint, pass-bg derivation, pass-text derivation). The criteria collapsed pass-bg+pass-text into one entry; in practice two `color-mix()` calls are required. No `--user-colour` remains on any focus ring or `.swatch-pair--selected` outline.

### Task 3 (JS)
- `innerHTML = buildBadgeHTML` = 1 — PASS
- `deriveBadgeColors(` call sites ≥1 (render) — PASS (2: export + call)
- `chooseChromeForeground(` call sites ≥1 — PASS (2: export + call)
- `setProperty('--pass-bg'` = 1 — PASS
- `setProperty('--control-zone-text'` = 1 — PASS
- `aa-toggle-btn` handler = 1 — PASS
- `navigator.clipboard` guard = 2 — PASS
- Full suite exits 0 — PASS

## Deviations from Plan

### Auto-fixed / clarified

**1. [Rule 3 - Minor] `var(--user-colour)` total count is 6, not ≤5**
- **Found during:** Task 2 verification
- **Issue:** Plan criterion `grep -n "var(--user-colour)" style.css | wc -l` ≤ 5. Actual count: 6.
- **Root cause:** Plan listed 5 permitted categories but one of them — pass-bg/pass-text definitions — needs two `color-mix()` lines, not one.
- **Resolution:** All 6 occurrences remain in the permitted list (control-zone bg, hex-pill swatch, sample-text foreground, sample-text:focus outline tint, `--pass-bg`, `--pass-text`). UI-01 intent (no `--user-colour` on focus rings or selection rings) is fully satisfied — grep for `outline-color: var(--user-colour)` returns 0.
- **Files modified:** `style.css` (intentional — criterion was off by one).

**2. [Rule 3 - Blocker] Large ratio display needed format change**
- **Found during:** Task 3 wiring
- **Issue:** UI-SPEC shows the large contrast number as bare "4.57" (no `:1` suffix). Existing `formatRatio()` returns `"4.57:1"`.
- **Fix:** `updatePanel` now calls `ratio.toFixed(2)` directly for the `.ratio` display. `formatRatio()` retained for tests and potential reuse.
- **Files modified:** `app.js`.
- **Commit:** `8815639`.

**3. [Rule 2 - Critical] Badge labels needed "Large" suffix**
- **Found during:** Task 3 wiring
- **Issue:** Plan 01's `buildBadgeHTML` receives the label verbatim. Existing `updatePanel` called `setBadge(..., 'AA')` for both `.badge-aa` and `.badge-aa-lg`, so the large-text badges would have rendered "Pass AA" identical to the normal-text badge — violating A11Y-02 (text cue must distinguish large vs normal).
- **Fix:** Pass `AA Large` / `AAA Large` to large-text setBadge calls.
- **Files modified:** `app.js`.
- **Commit:** `8815639`.

**4. [Rule 3 - Minor] `fg-hex` mirror added in render()**
- **Found during:** Task 1 HTML + Task 3 wiring
- **Issue:** Preview pills show foreground hex; plan did not specify a DOM update path, but the value would be stale after hex input change.
- **Fix:** `.fg-hex` spans in each panel; `render()` writes the uppercase hex into every `.fg-hex` via `querySelectorAll`.
- **Files modified:** `index.html`, `app.js`.

**5. [Rule 3 - Minor] Find-button label preserved across "Finding…" swap**
- **Found during:** Task 3 wiring
- **Issue:** Old code hardcoded `findBtn.textContent = 'Find accessible colour'` on completion — would have clobbered the new `Find 5 →` label.
- **Fix:** Capture `originalLabel` before swap, restore it after.
- **Files modified:** `app.js`.

No architectural changes. No auth gates.

## Verification Against Success Criteria

- [x] `index.html` has `.control-zone` + `.preview-zone`, H1 `WCAG colour finder`, CTA `Find 5 →`
- [x] `style.css` defines `--pass-bg: color-mix(...)` + `--pass-text: color-mix(...)`; no `--user-colour` on focus rings or selection rings
- [x] `app.js` `setBadge` uses `buildBadgeHTML`; `render()` applies `deriveBadgeColors` + `chooseChromeForeground`
- [x] Every badge renders with aria-hidden icon + visible Pass/Fail word (A11Y-02)
- [x] British-spelling test green (UI-03)
- [x] Full suite 89/89 green

## Known Stubs

- `.fg-hex` preview pill content is a display-only mirror of `#hex-input`. No stub — it reflects the same underlying value.
- AA/AAA toggle `currentThreshold` is captured but not yet consumed (no filtering / re-search behaviour). This is explicit in the plan text and flagged for a later plan.
- Result cards are still produced by the existing `renderPairs` path (Find button). The new card styling (white bg, 1px black border at rest, 3px selected) applies; clicking a card still routes through the old `.swatch-pair` click handler. Not a stub — just noting that the new "5 result cards in control zone" layout from the UI-SPEC is carried by existing DOM (they now sit inside `.control-zone`, which is what the spec asks).

## Self-Check: PASSED

Verified on disk:
- `index.html` — present, `.control-zone` + `.preview-zone` present, 7× `aria-live="polite"`, 4× `.copy-btn`
- `style.css` — present, `--pass-bg: color-mix` present, 0× `outline-color: var(--user-colour)`
- `app.js` — present, `innerHTML = buildBadgeHTML` = 1, `setProperty('--pass-bg'` = 1
- `test/app.test.js` — modified with pinned contract assertion
- Commits `cefa462`, `6961a7d`, `bf0eeaa`, `8815639` all present in `git log`
- Full `node --test test/*.test.js` exits 0 (89 pass)
