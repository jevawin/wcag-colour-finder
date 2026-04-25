# Phase 8: Auto-Find UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 08-auto-find-ux
**Mode:** `--auto` (Claude selected recommended defaults; no interactive Q&A)
**Areas discussed:** Trigger granularity, Find-button removal, 3-char shorthand, Loading feedback, Test strategy

---

## Trigger Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Fire on every valid 6-char input, no debounce | Search is sub-ms; latency-free | ✓ |
| Debounce 150ms | Smoother for slow typers; adds latency | |
| Debounce only after first result lands | Hybrid — fast first response, throttled re-runs | |

**Auto-selected:** No debounce. Recommended because `findVariantPairs` runs sub-ms per call; debouncing trades nothing for added latency.

---

## Find-button Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Remove from DOM (delete markup, handler, lookups) | Clean — no dead code | ✓ |
| Hide via CSS (`display: none`) | Reversible but invites drift | |
| Repurpose as a "re-roll" button | Variants are deterministic — nothing to re-roll | |

**Auto-selected:** Delete from DOM, handler, and JS element lookups. Recommended because variants are deterministic given input + threshold + BGs — re-roll is meaningless.

---

## 3-char Shorthand Behaviour

| Option | Description | Selected |
|--------|-------------|----------|
| No expand on input; expand on blur if valid 3-char | Quiet while typing; resolves cleanly when user moves on | ✓ |
| No expand at all — only 6-char triggers anything | Loses 3-char convenience | |
| Expand on input as soon as length === 3 | Mid-typing rewrite — exactly what 260424-tzn flagged as broken | |

**Auto-selected:** Blur-expand. Recommended because it matches the original quick-task framing (no mid-typing rewrites) while still letting 3-char shorthand work end-to-end.

---

## Loading Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| None — rely on swatch update | Search is instant; spinner is theatre | ✓ |
| Brief "Searching…" status | Familiar but unnecessary at sub-ms | |
| Skeleton swatches | Overengineered for instant op | |

**Auto-selected:** None. Recommended because the previous Find button's `setTimeout(20)` + "Searching…" label was UI theatre over an instant calculation.

---

## Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Audit `test/app.test.js` for `find-btn` refs; add 3 new tests (6-char trigger, toggle re-run, 3-char blur-expand) | Targeted; matches existing pattern | ✓ |
| Full test rewrite | Overkill | |
| Skip tests for INPUT-02 since wiring already exists | Misses regression coverage | |

**Auto-selected:** Targeted audit + 3 new tests. Recommended because it locks the new behaviour without churning passing tests.

---

## Claude's Discretion

- Exact subtitle copy wording.
- Whether to extract `expandHexOnBlur` helper or fold into `wireHexInput`.
- Whether to delete unused `.btn` CSS class.
- Whether any throttling is needed (only add if profiling reveals a problem).

## Deferred Ideas

None — discussion stayed within INPUT-01/02/03 scope.
