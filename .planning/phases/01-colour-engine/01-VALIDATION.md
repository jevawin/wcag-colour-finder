---
phase: 1
slug: colour-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in, Node 24.14.0) |
| **Config file** | None — runs with `node --test` |
| **Quick run command** | `node --test test/colour-engine.test.js` |
| **Full suite command** | `node --test test/colour-engine.test.js` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/colour-engine.test.js`
- **After every plan wave:** Run `node --test test/colour-engine.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SC-1 (hex parsing) | unit | `node --test test/colour-engine.test.js` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SC-2 (luminance) | unit | `node --test test/colour-engine.test.js` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SC-3 (contrast ratio) | unit | `node --test test/colour-engine.test.js` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | SC-4 (OKLab/OKLCH) | unit | `node --test test/colour-engine.test.js` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | SC-5 (pure, no DOM) | structural | `node --test test/colour-engine.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/colour-engine.test.js` — test file covering all five success criteria
- [ ] `colour-engine.js` — the ES module under test (greenfield)

*Wave 0 creates both files from scratch.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
