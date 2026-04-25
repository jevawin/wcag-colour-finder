---
phase: 8
slug: auto-find-ux
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-25
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node 24 native) |
| **Config file** | none — built into Node 24 |
| **Quick run command** | `node --test 'test/app.test.js'` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test 'test/app.test.js'`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green (87/87 baseline + new INPUT-01/02/03 tests)
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INPUT-03 | unit (pure-fn) | `node --test 'test/app.test.js'` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | INPUT-01 | DOM-integration | `node --test 'test/app.test.js'` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 2 | INPUT-01 | grep-verifiable | `! grep -q "find-btn\|Find 5" index.html app.js` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 2 | INPUT-02 | DOM-integration | `node --test 'test/app.test.js'` | ✅ | ⬜ pending |
| 08-03-02 | 03 | 2 | INPUT-03 | DOM-integration | `node --test 'test/app.test.js'` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `test/app.test.js` already exists with the pure-function extraction pattern from Phase 2
- No new framework, fixture, or runner install needed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual confirmation Find 5 button is gone | INPUT-01 | Visual UI check | Open `index.html`, confirm no Find button between hex input and AA/AAA toggle |
| Tab order remains sensible after button removal | INPUT-01 | A11y kbd-flow check | Tab from base hex → AA toggle → AAA toggle → preview swatches; no orphan stops |
| 3-char shorthand UX feels right | INPUT-03 | Subjective input feel | Type `f00`, confirm input stays "F00"; tab out, confirm expands to "FF0000" and search runs |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (N/A — existing infra sufficient)
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter (planner sets after task IDs finalised)

**Approval:** pending
