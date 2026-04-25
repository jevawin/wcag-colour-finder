# Phase 9: Responsive Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 09-responsive-fixes
**Mode:** `--auto` (Claude selected recommended defaults; no interactive Q&A)
**Areas discussed:** Badge label visibility (RESP-01), Hex input scaling (RESP-02), Breakpoint strategy, Supported viewport floor, Implementation approach

---

## Badge Label Visibility (RESP-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Wrap labels + add intermediate breakpoint | Allow `.pill` / `.pill-label` to wrap; add ~480px breakpoint between current 1400 and 767 | ✓ |
| Abbreviate labels at narrow widths | "AA-N", "AAA-L" etc. | |
| Stack badges vertically below 480px | One pill per row | |
| Use icons + tooltip | Replace text with glyphs at narrow widths | |

**Auto-selected:** Wrap + intermediate breakpoint (recommended — preserves label text fidelity, CSS-only, extends existing pattern).
**Notes:** Existing mobile block at 767px forces `.pills` back to `repeat(4, 1fr)` width:100% which is the clipping cause below ~480px.

---

## Hex Input Scaling (RESP-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Fix flex chain `min-width: 0` + clamp() font-size | Ensure shrinking works; cap font where needed | ✓ |
| Fixed font-size, allow horizontal scroll inside input | | |
| JS-driven resize | Resize observer adjusts width | |

**Auto-selected:** Fix flex chain + clamp() (recommended — vanilla CSS, no JS, no overflow).
**Notes:** Text input already has `min-width: 0` at line 122; issue is parent flex containers or `flex: 1` not collapsing. Keep readable font floor ≥16px.

---

## Breakpoint Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Add intermediate ~480px breakpoint | Extend existing 1400 / 991 / 767 ladder | ✓ |
| Replace media queries with container queries | Modernise | |
| Fully fluid (no new breakpoints) | clamp() everywhere | |

**Auto-selected:** Add ~480px (recommended — least invasive, matches existing pattern).
**Notes:** Exact value is Claude's discretion in planning.

---

## Supported Viewport Floor

| Option | Description | Selected |
|--------|-------------|----------|
| 320px | iPhone SE 1st gen | ✓ |
| 360px | Modern small phones | |
| 375px | iPhone Mini | |

**Auto-selected:** 320px (recommended — covers widest realistic device baseline).

---

## Implementation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| CSS-only | Edit `style.css` only | ✓ |
| CSS + minor markup tweak | If wrapping requires structural change | |
| Add JS resize logic | | |

**Auto-selected:** CSS-only (recommended — vanilla constraint, simplest fix).

## Claude's Discretion

- Exact intermediate breakpoint value
- Whether labels wrap under pills, stack, or hybrid per width
- `clamp()` vs discrete media-query font-size step

## Deferred Ideas

- Full responsive audit (touch targets, landscape, ultra-wide) — v1.2 candidate
- Container queries migration — modernisation, not a defect fix
