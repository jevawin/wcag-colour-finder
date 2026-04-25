---
phase: 9
slug: responsive-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, used by existing test/ suite) |
| **Config file** | none — node --test runs files directly |
| **Quick run command** | `node --test test/` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green + manual viewport sweep complete
- **Max feedback latency:** ~5 seconds (auto) + manual visual checks

---

## Per-Task Verification Map

Tasks here are CSS-only edits to `style.css`. Behavioural code (colour engine, search, app wiring) is NOT touched, so existing test suite functions as a regression gate, not a positive test of the responsive fix. Visual verification is manual.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | RESP-01 | regression | `node --test test/` | ✅ | ⬜ pending |
| 9-01-02 | 01 | 1 | RESP-02 | regression | `node --test test/` | ✅ | ⬜ pending |
| 9-01-03 | 01 | 1 | RESP-01, RESP-02 | static-grep | `grep -E "@media \(max-width: 480px\)" style.css` | ✅ | ⬜ pending |
| 9-01-04 | 01 | 1 | RESP-01 | static-grep | `grep -E "white-space:\s*nowrap" style.css \| grep -i pill` (must be empty) | ✅ | ⬜ pending |
| 9-01-05 | 01 | 1 | RESP-02 | static-grep | `grep -E "min-width:\s*0" style.css \| grep -E "(hex-input\|row-one\|base-row)"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/` directory exists with node:test suite — no new test infra needed
- [ ] No new Wave 0 tests required for visual responsive fix; static-grep checks above suffice

*Existing infrastructure covers regression checks. Visual correctness is manual-only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Badge labels (AA Normal / AA Large / AAA Normal / AAA Large) fully visible at 320px width | RESP-01 | Visual layout fit cannot be asserted by static analysis | Open `index.html`, set browser to 320px width, enter any valid hex (e.g. `#3366cc`), observe both light + dark preview pills — all four labels must be readable, no clipping or ellipsis |
| Badge labels fully visible at 360 / 480 / 767 / 991 / 1400 widths | RESP-01 | Same | Repeat at each named width; both AA and AAA toggle states |
| Hex input does not push content off-screen at 320px | RESP-02 | Visual overflow check | At 320px width, observe the hex input row — no horizontal scrollbar on `<body>`, input shrinks to fit, swatch + `#` prefix remain fixed-size |
| Hex input scales fluidly from 320 → 1400 | RESP-02 | Same | Drag viewport from 320 to 1400, watch input grow without overflow at any width |
| iOS focus does not zoom the page | RESP-02 (D-05) | Only reproducible on real iOS Safari, not desktop devtools | Open on iPhone Safari, tap hex input — page must NOT zoom. Confirms `clamp()` floor ≥16px |
| WCAG AA contrast unchanged at all widths | success criterion 3 | Phase 5 contrast pairs unchanged but resize can expose layout-dependent contrast | Visual check pill labels and tag labels at 320 / 767 / 1400 in both light/dark — fail-pill `#555555` (light) and `#d1d5db` (dark) remain readable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (regression suite + static-grep) or are flagged manual-only above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none required for this phase)
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s for automated checks
- [ ] `nyquist_compliant: true` set in frontmatter once execution begins

**Approval:** pending
