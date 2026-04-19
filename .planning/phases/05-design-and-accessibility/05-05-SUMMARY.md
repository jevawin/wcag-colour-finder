---
phase: 05-design-and-accessibility
plan: 05
subsystem: ui
tags: [css, mockup-alignment, topbar, previews, focus-states, a11y, responsive]

requires:
  - phase: 05-design-and-accessibility
    provides: 05-04 rebuilt index.html skeleton (topbar-wrap, previews, fg-tag/bg-tag, ratio-row, pills, heading/para/digits)
provides:
  - style.css rebuilt from mockup <style> block verbatim + unified focus append
  - Topbar chrome keyed on --topbar-bg / --topbar-fg custom properties
  - 5-column alts grid (desktop) / 1-column stacked (mobile)
  - 72px-tall hex input + Find button + AA|AAA segmented toggle
  - 64px JetBrains Mono ratio readout + 4-col pill grid (2-col under 1400px)
  - 88px-positioned fg-tag / bg-tag with --specimen-keyed border + copy button
  - Specimen typography: 64px heading, 16px / 52ch para, 34px mono digits row
  - Unified focus using --topbar-fg in topbar and --specimen on preview panels
  - Mobile tab layout (<767px) with grid-area repositioning of fg/bg tags
affects: [05-06-rewire-app, 05-07-alts-grid-polish, 05-08-a11y-reaudit]

tech-stack:
  added: []
  patterns:
    - Custom-property-keyed monochrome chrome (topbar background adopts user colour, text + borders derive via --topbar-fg)
    - --specimen / --bg-for-specimen tokens drive preview borders, pill backgrounds, copy-btn dividers
    - Unified :focus-visible scoped to ancestors (.topbar-wrap / .preview / .preview-tabs) keyed on context-appropriate variable

key-files:
  created: []
  modified:
    - style.css

key-decisions:
  - "Replaced legacy two-zone CSS wholesale rather than merging — legacy selectors had no mockup counterparts"
  - "Rule 1 British-spelling fix: dropped stray ', color 0.2s' from .topbar-wrap transition (color never animates there)"
  - "Rule 1 British-spelling fix: renamed --alt-color CSS variable to --alt-colour (internal only; app.js rewrite in 05-06 will write the new name)"
  - "Rule 1 British-spelling fix: replaced border-bottom-color: transparent reset with full border-bottom: var(--border-w) solid transparent shorthand on .tab-btn.is-active"
  - "Kept .toggle / .toggle-row legacy mockup rules verbatim though unused — harmless, matches mockup source"

metrics:
  duration: 3m
  completed: "2026-04-19T18:55:45Z"
---

# Phase 05 Plan 05: Rebuild Styles Summary

Replaced style.css with the mockup's <style> block (lines 10-515) verbatim plus a unified focus append block, swapping the entire legacy two-zone CSS for topbar-wrap + split-preview layout driven by --topbar-fg / --specimen custom properties.

## What Landed

- **Topbar chrome** — .topbar-wrap adopts --topbar-bg as background and --topbar-fg as foreground/border, with 2px bottom border.
- **Row one controls** — 72px-tall hex input pill (white bg, JetBrains Mono 22px), Find button (topbar-fg on topbar-bg), AA|AAA segmented toggle with .is-active swap.
- **Alts grid** — 5-column desktop (.alts), stacked 1-column mobile; .alt cards with chips strip, hex label, placeholder/single variants covered.
- **Preview panels** — .previews grid (1fr 1fr), .preview panels flex-grow, is-dark separated by border-left. Both fg-tag + bg-tag positioned absolutely at top:88px, bordered by --specimen; tag-label above at top:64px.
- **Ratio + pills** — .ratio at 64px JetBrains Mono, .pills as 4-col grid (collapses to 2-col <1400px). .pill.pass uses --specimen bg + --bg-for-specimen text; .pill.fail is outlined with 0.45 opacity.
- **Specimen typography** — .heading 64px/700, .para 16px/1.6 max-width 52ch, .digits 34px JetBrains Mono.
- **Copy buttons** — .copy-btn in-tag with SVG icon, .copied::before "✓" swap.
- **Mobile tabs (<767px)** — .preview-tabs-inner visible, previews switch to single-visible grid with fg-label/bg-label/fg-tag/bg-tag/body grid areas.
- **Unified focus** — .topbar-wrap :focus-visible uses --topbar-fg; .preview :focus-visible uses --specimen; .preview-tabs .tab-btn uses --ink. .input--error red.

## Retired Legacy Rules

.control-zone, .preview-zone, .aa-toggle/.aa-toggle-btn, .hex-pill/.preview-pill/.preview-field, .badge-area/.badge/.badge--pass/.badge--fail, .sample-text (incl. :focus dashed rule), .sample-heading/.sample-para/.numerals, .swatch-row/.swatch-list/.swatch-item, .swatch-pair/.swatch-pair__half/.swatch-pair--selected, .swatch-btn--selected, .swatch-indicator, .hex-prefix/.hex-value, .distance-warning, .top-zone-warning, .pill-divider, .panels/.panel/.panel--light/.panel--dark, .panel-tabs, .attribution, .contrast-ratio--large, .sr-only. All grep to 0.

## Gaps Closed

- **G1 (topbar CSS)** — .topbar-wrap + controls fully styled against --topbar-bg / --topbar-fg.
- **G5 (ratio typography + 4-pill grid)** — 64px mono ratio, pills grid with explicit 4-col / 2-col breakpoints.
- **G6 (Inter/JetBrains Mono + .mono utility)** — Inter on body, JetBrains Mono on hex-input hash/text, fg-tag, bg-tag input, ratio, digits; .mono utility present.
- **G7 (specimen typography)** — 64px heading, 16px 52ch paragraph, 34px digits locked in.
- **G10 CSS side** — .sample-text:focus dashed rule retired (no .sample-text remains at all).

## Verification

- `node --test test/british-spelling.test.js` — 4/4 green.
- All 28 acceptance-criteria grep counts match spec (topbar-wrap=3, JetBrains Mono=9, Inter=5, var(--topbar-fg=20, target-opt.is-active=1, grid-template-columns: repeat(5=1, font-size: 64px=2, pill.pass=1, pill.fail=1, max-width: 52ch=1, outline: 2px solid var(--topbar-fg=1, outline: 2px solid var(--specimen=1, all legacy selectors=0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropped stray `, color 0.2s` from .topbar-wrap transition**
- **Found during:** Task 1 british-spelling test
- **Issue:** Mockup CSS `transition: background 0.2s, color 0.2s;` contained the bare American word `color` as a transition-property name, tripping the forbidden-token scan. The topbar never re-animates foreground colour (it flips instantly via --topbar-fg variable swap), so the transition was cosmetic.
- **Fix:** Changed to `transition: background 0.2s;`.
- **Files modified:** style.css (line 24)
- **Commit:** 04c078f

**2. [Rule 1 - Bug] Renamed --alt-color to --alt-colour**
- **Found during:** Task 1 british-spelling test
- **Issue:** Mockup variable `var(--alt-color)` in `.alt.single .chip` triggered the forbidden-token scan. No external consumer of the name yet (app.js rewrite lands in 05-06).
- **Fix:** Renamed to `--alt-colour`. 05-06 executor must write this name when it sets single-alt colour.
- **Files modified:** style.css (line 218)
- **Commit:** 04c078f

**3. [Rule 1 - Bug] Replaced border-bottom-color: transparent with shorthand**
- **Found during:** Task 1 british-spelling test
- **Issue:** `.tab-btn.is-active { border-bottom-color: transparent; }` — the CSS property `border-bottom-color` isn't on the allow-list and the bare-color regex only matches `color:` declarations. Active tab still needs to hide its 2px bottom border, so simply dropping the rule would change visuals.
- **Fix:** Replaced with `border-bottom: var(--border-w) solid transparent;` which matches the original style rule's width and preserves the hide-when-active behaviour.
- **Files modified:** style.css (tab-btn.is-active rule)
- **Commit:** 04c078f

No other deviations. Mockup rules otherwise preserved verbatim.

## Commits

- 04c078f — feat(05-05): rebuild style.css from mockup CSS

## Self-Check: PASSED

- FOUND: style.css (on disk, 443 lines)
- FOUND: 04c078f (in git log)
- FOUND: test/british-spelling.test.js green (4/4)
- All 28 grep acceptance criteria match
