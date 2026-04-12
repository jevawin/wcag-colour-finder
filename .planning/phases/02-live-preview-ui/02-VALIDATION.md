---
phase: 2
slug: live-preview-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
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
| 02-01-01 | 01 | 1 | INP-01, INP-02 | manual | Browser: type hex in input | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | INP-03 | unit | `node --test test/app.test.js` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | INP-04 | manual | Browser: type invalid hex | N/A | ⬜ pending |
| 02-01-04 | 01 | 1 | CON-01, CON-02 | unit | `node --test test/colour-engine.test.js` | ✅ | ⬜ pending |
| 02-01-05 | 01 | 1 | CON-03, CON-04, CON-05 | unit | `node --test test/app.test.js` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | PNL-01, PNL-02, PNL-03 | manual | Browser: verify panels render | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/app.test.js` — stubs for badge state logic (CON-03, CON-04, CON-05), hex validation (INP-03)
- [ ] Extract pure functions from app.js so badge/validation logic is testable without DOM

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
