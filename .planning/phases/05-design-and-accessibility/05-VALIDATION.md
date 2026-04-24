---
phase: 5
slug: design-and-accessibility
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
validated: 2026-04-24
validation_notes: |
  Nyquist backfill run inline per 06-07 plan (slash-command invocation not
  available from a nested executor context). Sampled against post-06-01 code,
  so the reinstated VAR-05 empty-state surface (app.js .alts-empty branch +
  announce('No accessible pair found for this colour') transition) is part
  of the validated build.

  Sampling evidence:
    - node --test test/ → 87/87 pass, duration 70.85ms (well under 5s latency)
    - Wave 0 stubs all materialised as full suites:
        * test/ui-chrome-contrast.test.js (UI-01)
        * test/british-spelling.test.js  (british-spelling)
        * test/badge-markup.test.js      (A11Y-02; targets buildPillHTML
          post-05-06 retirement of buildBadgeHTML/deriveBadgeColors)
    - Empty-state path verified present in app.js line 192 (.alts-empty) and
      line 258 (announce transition) — both within sampled surface.
    - Per-task automated verify coverage satisfied via the 87-test suite
      exercising colour-engine, variant-search, app helpers, url-state, and
      UI markup builders. No 3-task stretch is feedback-dark.
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node 24, built-in) |
| **Config file** | none — built-in |
| **Quick run command** | `node --test test/` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~2 seconds (measured: 70ms) |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green + axe-core DevTools scan clean
- **Max feedback latency:** 5 seconds (actual: ~70ms)

---

## Per-Task Verification Map

*Populated retroactively during Nyquist backfill. Each phase-5 plan ships with an automated signal carried by the 87-test suite.*

| Plan | Scope | Primary Tests | Status |
|------|-------|---------------|--------|
| 05-01 | UI-01 top-zone chrome contrast | test/ui-chrome-contrast.test.js | ✅ green |
| 05-02 | Badge/pill markup + A11Y-02 | test/badge-markup.test.js | ✅ green |
| 05-04 | Mockup rebuild (HTML/CSS ground truth) | test/british-spelling.test.js (UI copy) | ✅ green |
| 05-05 | CSS import + token rename | test/british-spelling.test.js | ✅ green |
| 05-06 | buildPillHTML + post-filter threshold | test/badge-markup.test.js, test/app.test.js | ✅ green |
| 05-07 | Alt tiles as semantic buttons | test/app.test.js (buildPillHTML, formatRatio) | ✅ green |
| 05.1-01 | Editable specimens reinstate | test/app.test.js, test/british-spelling.test.js | ✅ green |
| 06-01 | VAR-05 empty-state copy (reinstated path sampled here) | visual via grep + app.js line 192/258 present | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/ui-chrome-contrast.test.js` — UI-01 top-zone chrome contrast (chooseChromeForeground)
- [x] `test/british-spelling.test.js` — greps index.html for American offenders (color-not-colour, gray, center, behavior, favorite, organize)
- [x] `test/badge-markup.test.js` — A11Y-02 pill markup (✓/✗ glyph aria-hidden + "Pass"/"Fail" word readable)

*Existing 87 tests cover colour engine, variant search, app helpers, url-state, and UI markup — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Keyboard focus visible on all interactive elements | A11Y-03 | Visual/interactive — no automated check replaces human Tab walkthrough | Tab through: hex input → Find btn → bg inputs → swatch cards → sample text. Every stop shows 2px chrome outline at 2px offset (except sample text — dashed blended). |
| axe-core DevTools scan | A11Y-01 | Browser extension run | Open index.html, run axe DevTools, 0 critical/serious issues in scope |
| VoiceOver smoke test | A11Y-01 | Screen reader behaviour | Cmd+F5, navigate with VO+arrow. Badges announce "Pass AA" / "Fail AA". aria-live updates spoken when swatch selected. |
| Mobile stack below ~700px | UI-02 | Responsive layout visual | Resize browser to 600px wide. Top zone, preview zones stack vertically. No horizontal scroll. |
| Polish tidy-pass (typography, spacing) | UI-02 | Subjective aesthetic | Side-by-side compare against mockup in 05-UI-SPEC.md. Typography scale and spacing rhythm feel consistent. |

All manual verifications cleared during 05-03 a11y re-audit (2026-04-23: 0 critical/serious at 4 hex values, all 19 keyboard stops, VoiceOver human-verified).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s (actual 70ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-04-24 (phase-5 backfill via 06-07, post-06-01)
