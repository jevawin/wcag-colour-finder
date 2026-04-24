---
phase: 04
slug: modes-and-configuration
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-17
validated: 2026-04-24
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

- [x] `test/url-state.test.js` — stubs for CFG-03 (parseHashState / buildHashPath round-trip, invalid inputs, case handling) — landed in 04-03.
- [x] Update `test/variant-search.test.js` — pair contract for MODE-02, BGs parameterised (no hardcoded `#111111`) — landed in 04-02.

*Coupled: `DARK_BG = '#111111'` constant removed from `variant-search.js` alongside the test update.*

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (`test/url-state.test.js`, updated `test/variant-search.test.js`)
- [x] No watch-mode flags
- [x] Feedback latency < 5s (full suite ~66ms, phase-4 tests ~50ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed 2026-04-24

### Backfill Notes (06-06)

Nyquist validation backfilled after phase completion per v1.0 milestone audit item #3. Executed inline in plan 06-06 (nested slash-commands not invokable mid-execution).

Evidence of compliance:

- `test/url-state.test.js` present with 9 passing tests covering `parseHashState` (valid hash, missing parts, invalid fg/bg, extra slashes, case handling) and `buildHashPath` round-trip.
- `test/variant-search.test.js` refactored to pair contract: 14 passing tests covering basic contract (shape, count, invalid input), AA compliance on both BGs, sort order, and BG parameter honouring.
- `DARK_BG` hardcoded constant removed from `variant-search.js` — BGs threaded through function signature.
- All Phase 4 requirements (MODE-02, CFG-01, CFG-02 manual, CFG-03) covered by automated tests or documented manual-smoke verifications.
- Full suite: 87/87 tests passing, ~66ms runtime (well under 5s feedback-latency cap).
