---
phase: 04
slug: modes-and-configuration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in, Node 24) |
| **Config file** | none — uses `node --test` discovery |
| **Quick run command** | `node --test test/url-state.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/url-state.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | MODE-02 | unit | `node --test test/variant-search.test.js` | ✅ UPDATE | ⬜ pending |
| TBD | TBD | TBD | CFG-01 | unit | `node --test test/colour-engine.test.js` | ✅ EXISTS | ⬜ pending |
| TBD | TBD | TBD | CFG-02 | manual smoke | browser smoke | ❌ MANUAL | ⬜ pending |
| TBD | TBD | TBD | CFG-03 | unit | `node --test test/url-state.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Planner to refine Task IDs once PLAN.md files are created.*

---

## Wave 0 Requirements

- [ ] `test/url-state.test.js` — stubs for CFG-03 (parseHashState / buildHashPath round-trip, invalid inputs, case handling)
- [ ] Update `test/variant-search.test.js` — replace single-variant contract with pair contract for MODE-02; parameterise BGs (remove hardcoded `#111111`)

*Coupled: remove `DARK_BG = '#111111'` constant from `variant-search.js` with the test update.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Default dark BG is `#000000` | CFG-02 | DOM default-value check | Load page, inspect dark BG input value |
| URL updates on input (debounced) | CFG-03 | History API + timing | Type hex, wait 300ms, verify `location.hash` matches `#/fg/lightBg/darkBg` |
| Page load from URL hydrates state | CFG-03 | Full-page reload flow | Visit `/#/2563eb/ffffff/000000`, confirm fields populate, no auto-Find |
| Invalid BG shows red border, keeps last valid | D-11 | Visual + ARIA state | Enter bad hex, confirm `aria-invalid=true` and last-valid preview retained |
| Changing BG clears pair swatches | D-12 | UX flow | Run Find, change BG, confirm swatches cleared |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`test/url-state.test.js`, updated `test/variant-search.test.js`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
