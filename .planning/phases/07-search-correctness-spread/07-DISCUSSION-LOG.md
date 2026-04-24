# Phase 7: Search Correctness & Spread - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 07-search-correctness-spread
**Areas discussed:** Threshold integration, Spread strategy, Asymmetric search semantics, Empty-state vs no-solution

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Threshold integration (AAA fix) | searchLForBg threshold-awareness | ✓ |
| Spread strategy (5-result range) | Wider L-axis span across 5 results | ✓ |
| Asymmetric search semantics | Per-side gating when input passes one BG | ✓ |
| Empty-state vs no-solution | Distinguish defect from genuine no-solution | ✓ |

**User's choice:** All four selected.

---

## Threshold Integration

### Q1: How should variant-search become threshold-aware?

| Option | Description | Selected |
|--------|-------------|----------|
| Parameterise searchLForBg | Add targetRatio param. Binary search converges to passing point at active threshold. | ✓ |
| Add target='AA'\|'AAA' param | Higher-level API, internal mapping | |
| Keep post-filter, raise ceiling | Patch via post-filter only | |

### Q2: Where does the threshold value live?

| Option | Description | Selected |
|--------|-------------|----------|
| App passes threshold per call | app.js maps state.target → ratio, passes in | ✓ |
| Named constants from colour-engine | Search imports constants, accepts label | |

### Q3: Refactor scope — keep passesAA semantics or generalise?

| Option | Description | Selected |
|--------|-------------|----------|
| Generalise to passesThreshold(ratio, target) | New helper alongside passesAA/AAA | ✓ |
| Inline ratio comparison | No new helper | |

---

## Spread Strategy

### Q1: How to widen L-axis spread across 5 results?

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-seed L stretch | Result 0 nearest, 1–4 seeded further along L | ✓ |
| Larger pool + stratified pick | Generate ~20, pick by distance percentile | |
| Hybrid a-offset + L-stretch | Mix of nuance and stretch | |

### Q2: What anchors the 'first result'?

| Option | Description | Selected |
|--------|-------------|----------|
| Nearest passing pair (current behaviour) | min max(distLight, distDark) | ✓ |
| Nearest on each side independently | Per-side independent nearest | |

### Q3: What defines 'last result clearly distinct'?

| Option | Description | Selected |
|--------|-------------|----------|
| Min L-axis delta from result 0 | Concrete numeric guarantee | ✓ |
| Visible-step heuristic | Empirical L stretch values | |
| You decide | Claude picks | |

---

## Asymmetric Search Semantics

### Q1: Input passes one BG already — what does each pair contain?

| Option | Description | Selected |
|--------|-------------|----------|
| Input verbatim on passing side, alts on failing side | All 5 pairs share input on passing side | ✓ |
| Single result row instead of 5 | Collapse pair structure | |
| Search both, prefer input on passing side | Post-process override | |

### Q2: Input passes BOTH backgrounds at active threshold — what to show?

| Option | Description | Selected |
|--------|-------------|----------|
| Empty results + 'already accessible' message | No swatches, status copy | ✓ |
| Single trivial pair (input/input) | Click-to-apply no-op | |
| Show 5 spread variants anyway | Exploration mode | |

### Q3: Distance metric when one side = input (distance 0)?

| Option | Description | Selected |
|--------|-------------|----------|
| Use failing-side distance only | Special-case but explicit | ✓ |
| Keep max(distLight, distDark) | Mathematically same; max(0,x)=x | |

---

## Empty-State vs No-Solution

### Q1: How does search signal 'genuinely no solution'?

| Option | Description | Selected |
|--------|-------------|----------|
| Binary search returns null when gamut hit | Existing null already means no-solution post-fix | ✓ |
| Add explicit 'no_solution' flag | Bigger API change | |

### Q2: Empty-state message wording — distinguish AA vs AAA failure?

| Option | Description | Selected |
|--------|-------------|----------|
| Single message 'No accessible pair found' | Keep current copy | ✓ |
| Threshold-aware 'No AAA pair found — try AA?' | Suggest fallback action | |

---

## Claude's Discretion

- Exact L-stretch seed values for results 1–4
- Numeric value for "min L delta from result 0" guarantee (0.15–0.25 range guidance)
- "Already accessible" status message wording
- findVariantPairs signature shape (positional vs object) — Claude picks based on test impact

## Deferred Ideas

- Threshold-aware empty-state copy
- Per-swatch distance warnings (still respect Phase 3 D-04)
- Auto-find on AA/AAA toggle — Phase 8 territory
