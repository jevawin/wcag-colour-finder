---
phase: 2
slug: live-preview-ui
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-12
validated: 2026-04-24
validation_notes: |
  Backfilled per audit tech-debt item #3 (06-04).
  - Wave 0 test files exist and are green: test/app.test.js (buildBadgeState, expandHex, formatRatio, buildPillHTML), test/colour-engine.test.js (luminance, contrast).
  - Full suite: `node --test test/*.test.js` → 87/87 passing at validation time.
  - CON-01, CON-02 covered by colour-engine.test.js (luminance + contrast ratio).
  - CON-03, CON-04, CON-05 covered by app.test.js buildBadgeState + buildPillHTML assertions (AA/AAA thresholds + Large variants).
  - INP-03 default hex (#2563EB) wired in app.js DEFAULT_BASE; expandHex test covers normalisation.
  - INP-01, INP-02, INP-04, PNL-01..03 remain manual-only (DOM interaction, visual layout) — already documented in Manual-Only table; human verification recorded in v1.0-MILESTONE-AUDIT.md (6/6 truths, "human_needed → passed").
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, zero deps — established in Phase 1) |
| **Config file** | none — node:test needs no config |
| **Quick run command** | `node --test test/` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | INP-01, INP-02 | manual | Browser: type hex in input | N/A | ✅ human-verified |
| 02-01-02 | 01 | 1 | INP-03 | unit | `node --test test/app.test.js` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | INP-04 | manual | Browser: type invalid hex | N/A | ✅ human-verified |
| 02-01-04 | 01 | 1 | CON-01, CON-02 | unit | `node --test test/colour-engine.test.js` | ✅ | ✅ green |
| 02-01-05 | 01 | 1 | CON-03, CON-04, CON-05 | unit | `node --test test/app.test.js` | ✅ | ✅ green |
| 02-01-06 | 01 | 1 | PNL-01, PNL-02, PNL-03 | manual | Browser: verify panels render | N/A | ✅ human-verified |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/app.test.js` — stubs for badge state logic (CON-03, CON-04, CON-05), hex validation (INP-03)
- [x] Extract pure functions from app.js so badge/validation logic is testable without DOM

*Existing Phase 1 test infrastructure (`test/colour-engine.test.js`) covers contrast ratio and luminance calculations.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hex input field accepts 3/6 digit with/without # | INP-01, INP-02 | DOM interaction | Type `#2563EB`, `2563EB`, `#ABC`, `abc` — all should update panels |
| Invalid hex shows error state | INP-04 | Visual state | Type `XYZ` — error border appears, panels don't update |
| Default colour on load | INP-03 | Page load state | Refresh page — panels show #2563EB |
| Panel layout with heading + paragraph | PNL-01, PNL-02 | Visual layout | Both panels show heading and paragraph in user colour |
| Editable sample text | PNL-03 | contenteditable interaction | Click heading/paragraph text, type new text |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-24 (backfill via 06-04)

---

## Validation Audit 2026-04-24

Backfilled per v1.0-MILESTONE-AUDIT.md tech-debt item #3 (Nyquist).

| Metric | Count |
|--------|-------|
| Unit-testable requirements | 5 (CON-01..05, INP-03) |
| Automated + green | 5 |
| Manual-only (DOM/visual) | 6 task-requirements (INP-01, INP-02, INP-04, PNL-01..03) |
| Gaps found | 0 |
| Resolved | 0 (tests already in place from Wave 0 work during execution) |
| Escalated | 0 |

Full suite at backfill: `node --test test/*.test.js` → **87/87 passing**.

All manual-only items were human-verified during Phase 2 execution (recorded as "human_needed → passed" in milestone audit, 6/6 truths).
