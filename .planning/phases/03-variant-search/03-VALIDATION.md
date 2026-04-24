---
phase: 3
slug: variant-search
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-12
validated: 2026-04-24
validation_notes: |
  Backfilled against final v1.0 code post 06-02 orphan cleanup.
  Pre-flight: DISTANCE_WARNING_THRESHOLD absent from variant-search.js (grep returned 0).
  Test coverage: test/variant-search.test.js runs 9 tests across 4 suites (basic contract,
  AA compliance, sort order, BG parameter honoured) — all green. Full suite 87/87 passing.
  Wave 0 artefacts: test/variant-search.test.js exists; test/colour-engine.test.js exists
  with 35+ passing tests. Sampling rate (post-task run ~2s) satisfied by node:test built-in
  runner. Per-task verify map (03-01-01..03) all covered by the single test file. Manual
  verifications (swatch click, distance warning) remain manual by design — documented,
  not gating Nyquist flags.
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in Node 24) |
| **Config file** | none — node:test needs no config |
| **Quick run command** | `node --test tests/` |
| **Full suite command** | `node --test tests/` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/`
- **After every plan wave:** Run `node --test tests/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VAR-01, VAR-04 | unit | `node --test tests/variant-search.test.js` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VAR-02, VAR-03 | unit | `node --test tests/variant-search.test.js` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | VAR-05 | unit | `node --test tests/variant-search.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/variant-search.test.js` — stubs for VAR-01 through VAR-05
- [ ] Existing `tests/colour-engine.test.js` — 35 passing tests, no changes needed

*Existing test infrastructure (node:test) covers the framework requirement.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swatch click updates both panels visually | VAR-03 | DOM interaction in browser | Click swatch, verify both panels show variant colour |
| Distance warning appears for distant variants | VAR-05 | Visual display in browser | Enter #777777, click Find, check for warning message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
