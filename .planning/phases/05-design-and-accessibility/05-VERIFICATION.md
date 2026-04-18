---
phase: 5
status: pending-manual-audit
audited: 2026-04-19
---

# Phase 5 — Verification

> Automated evidence (grep counts, test results) is pre-filled.
> Browser / keyboard / VoiceOver items are flagged `[ ] MANUAL` and must be completed by the human auditor per the plan `<how-to-verify>` steps.
> Set frontmatter `status` to `verified` once every checkbox is ✅ with evidence, or `gaps-found` if any ❌ remains.

## UI-01 Monochrome chrome

- [x] `var(--user-colour)` appears only on permitted elements in style.css — evidence: `grep -n "var(--user-colour)" style.css` → 6 lines, all within the permitted list: `--pass-bg` derivation (line 17), `--pass-text` derivation (line 18), `.control-zone` background (line 115), `.hex-pill .swatch-indicator` background (line 185), `.sample-text` colour (line 348), `.sample-text:focus` outline tint (line 386).
- [x] No `--user-colour` on focus rings or selection rings — evidence: `grep -c "outline-color: var(--user-colour)" style.css` → 0. `.swatch-pair--selected` uses `3px solid #000000`.
- [ ] MANUAL — axe-core scan at default colour `#2563EB`: N critical / N serious (target 0 / 0) — evidence: …
- [ ] MANUAL — axe-core scan at `#111111` (chrome text flips to white, warning visible): N / N — evidence: …
- [ ] MANUAL — axe-core scan at `#ffff00` (warning hidden): N / N — evidence: …

## UI-02 Clean layout

- [x] Two-zone layout markup present — evidence: `grep -c 'class="control-zone"' index.html` → 1, `grep -c 'class="preview-zone"' index.html` → 1.
- [x] Mobile tablist markup present — evidence: `role="tablist"` → 1, `role="tab"` → 2, `role="tabpanel"` → 2, `aria-controls=` → 2.
- [x] Tab switch handler driven by `matchMedia('(max-width: 700px)')` — evidence: app.js line matches on single occurrence.
- [ ] MANUAL — visual check at ≥1100px: 50/50 panels, 5 result cards in one row after Find, badges 4-up — evidence: …
- [ ] MANUAL — visual check at 600px: tabs visible, panels swap on click, cards wrap, controls stack full-width — evidence: …
- [ ] MANUAL — axe-core scan at 600px viewport: 0 critical / 0 serious — evidence: …

## UI-03 British spelling

- [x] `british-spelling.test.js` green — evidence: `node --test test/british-spelling.test.js` → 4 pass / 0 fail on 2026-04-19.
- [x] Full suite green — evidence: `node --test test/*.test.js` → 89 pass / 0 fail on 2026-04-19.

## A11Y-01 WCAG AA self-compliance

- [x] Chrome foreground on top-zone background — `chooseChromeForeground` auto-switches `#000000` → `#ffffff` when the user's colour fails 4.5:1 for black; `#top-zone-warning` surfaces when colour is marginal.
- [x] Pass-badge contrast verified at derivation time — `deriveBadgeColors` falls back to `#15803d` / `#ffffff` (≈5.02:1) when the OKLab-derived pair falls below 4.5:1.
- [ ] MANUAL — axe-core DevTools 4-scan set (default / #111111 / #ffff00 / after Find 5) zero critical and zero serious — evidence: …

## A11Y-02 Non-colour cues

- [x] Badge markup contract pinned — evidence: `test/app.test.js` asserts `buildBadgeHTML(true, 'AA') === '<span aria-hidden="true">✓</span><span>Pass AA</span>'` across repeated calls (added Plan 02).
- [x] `aria-live="polite"` regions present: 7 total in index.html (hex-error, light-bg-error, dark-bg-error, top-zone-warning, copy-live, light-panel badge-area, dark-panel badge-area).
- [x] Large-text badges distinguished — setBadge is called with labels `AA Large` / `AAA Large`, so they render as `Pass AA Large` vs `Pass AA`.
- [ ] MANUAL — VoiceOver reads badges as "Pass AA" / "Fail AA" (icon aria-hidden works) — evidence: …
- [ ] MANUAL — VoiceOver announces badge-area changes and "Copied" announcement on copy — evidence: …

## A11Y-03 Visible focus

- [x] Unified focus rule uses `var(--chrome-dark)` — evidence: `grep -c "outline: 2px solid var(--chrome-dark)" style.css` → 2 (one in the unified block selector group, one in `.hex-pill:focus-within`).
- [x] Dark-panel override uses `var(--chrome-light)` — evidence: `grep -c "outline-color: var(--chrome-light)" style.css` → 1.
- [x] `.sample-text:focus` dashed exception retained — evidence: `grep -c "\.sample-text:focus" style.css` → 1 (rule contains `dashed`).
- [x] No `--user-colour` on any focus outline — evidence: `grep -c "outline-color: var(--user-colour)" style.css` → 0.
- [ ] MANUAL — keyboard walkthrough reaches every interactive element in logical order with a visible 2px outline, sample text shows dashed blended outline, no tab traps — evidence: …
- [ ] MANUAL — Enter/Space activate all buttons; tab order: hex input → Find 5 → AA → AAA → swatch-pair(s) → light BG input → dark BG input → (each copy-btn in turn) → sample headings/paras — evidence: …

## Gaps found

(To be filled once the manual audit is complete. If any ❌ above stays unchecked or axe-core reports critical / serious violations, list each as a gap with:
- truth: what the user sees / hears
- reason: root cause
- artifacts: files/selectors involved
- missing: code needed to fix

so `/gsd:plan-phase --gaps` can pick them up.)
