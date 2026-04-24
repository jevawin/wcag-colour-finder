---
phase: 7
slug: search-correctness-spread
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node 24 native) |
| **Config file** | none — package.json `scripts.test` |
| **Quick run command** | `node --test test/variant-search.test.js test/colour-engine.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command for the file(s) affected
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green (87/87 prior + new Phase 7 tests)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-XX | 01 | 1 | SEARCH-01 | unit | `node --test test/colour-engine.test.js` | ✅ | ⬜ pending |
| 7-02-XX | 02 | 2 | SEARCH-01 | unit | `node --test test/variant-search.test.js` | ✅ | ⬜ pending |
| 7-03-XX | 03 | 2 | SEARCH-02 | unit | `node --test test/variant-search.test.js` | ✅ | ⬜ pending |
| 7-04-XX | 04 | 2 | SEARCH-03 | unit | `node --test test/variant-search.test.js` | ✅ | ⬜ pending |
| 7-05-XX | 05 | 3 | SEARCH-01,02,03 | integration | `node --test test/app.test.js` | ✅ | ⬜ pending |

*Final task IDs assigned during planning. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure (`node:test`, `test/*.test.js`) covers all phase requirements. No Wave 0 setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visible distinctness of result[4] vs result[0] in browser | SEARCH-02 | Subjective "looks distinct" judgment | Open `index.html`, enter `#2563EB`, click Find 5, eyeball that swatch 5 looks clearly different from swatch 1 (post-AA fix and post-AAA fix) |
| "Already accessible" status copy reads naturally | D-12 | Copy review | Enter `#000000` with default BGs, toggle AA, confirm message wording |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or are listed Manual-Only
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none required)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter after planner finalises task IDs

**Approval:** pending
