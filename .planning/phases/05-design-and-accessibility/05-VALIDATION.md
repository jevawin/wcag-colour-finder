---
phase: 5
slug: design-and-accessibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node 24, built-in) |
| **Config file** | none — built-in |
| **Quick run command** | `node --test tests/` |
| **Full suite command** | `node --test tests/` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/`
- **After every plan wave:** Run `node --test tests/`
- **Before `/gsd:verify-work`:** Full suite must be green + axe-core DevTools scan clean
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

*To be filled by planner. Each task mapped to REQ-ID, test type, and automated command.*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/ui-chrome-contrast.test.js` — stub for UI-01 (top-zone chrome contrast fn)
- [ ] `tests/british-spelling.test.js` — stub that greps index.html for American offenders (color-not-colour, gray, center, behavior, favorite, organize)
- [ ] `tests/badge-markup.test.js` — stub for A11Y-02 (badge contains ✓/✗ glyph + text, not colour-only)

*Existing 68 tests cover the colour engine — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Keyboard focus visible on all interactive elements | A11Y-03 | Visual/interactive — no automated check replaces human Tab walkthrough | Tab through: hex input → Find btn → bg inputs → swatch cards → sample text. Every stop shows 2px chrome outline at 2px offset (except sample text — dashed blended). |
| axe-core DevTools scan | A11Y-01 | Browser extension run | Open index.html, run axe DevTools, 0 critical/serious issues in scope |
| VoiceOver smoke test | A11Y-01 | Screen reader behaviour | Cmd+F5, navigate with VO+arrow. Badges announce "Pass AA" / "Fail AA". aria-live updates spoken when swatch selected. |
| Mobile stack below ~700px | UI-02 | Responsive layout visual | Resize browser to 600px wide. Top zone, preview zones stack vertically. No horizontal scroll. |
| Polish tidy-pass (typography, spacing) | UI-02 | Subjective aesthetic | Side-by-side compare against mockup in 05-UI-SPEC.md. Typography scale and spacing rhythm feel consistent. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
