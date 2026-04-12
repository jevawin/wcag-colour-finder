# Phase 3: Variant Search - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 03-variant-search
**Areas discussed:** Search trigger, Swatch display, No-variant messaging, Swatch interaction

---

## Search Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Manual button only | User clicks 'Find accessible colour' button. Keeps preview fast, search is a deliberate action. | ✓ |
| Auto on valid input | Variants update automatically as user types valid hex. More immediate but search runs on every keystroke. | |
| Both -- auto + button | Auto-search on input change, plus a button for re-triggering after background changes. | |

**User's choice:** Manual button only
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Below hex input | Directly under the hex input field, prominent CTA. | |
| Beside hex input | Same row as hex input, right side. Compact layout, single-line action bar. | ✓ |
| Below panels | Under the preview panels. User sees the problem first, then clicks to find solutions. | |

**User's choice:** Beside hex input
**Notes:** None

---

## Swatch Display

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal row | Single row of swatches below the panels. Compact, scannable left-to-right. Ordered by closeness. | ✓ |
| Grid / two rows | 2-3 per row if space is tight. Good for mobile but more visual weight. | |
| Vertical list | Stacked list with hex + ratio info beside each swatch. More room for detail. | |

**User's choice:** Horizontal row
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Hex code | Show the hex value below/beside the swatch | ✓ |
| Contrast ratios | Show contrast ratio against both backgrounds | |
| AA/AAA badges | Small pass/fail indicators per swatch | |
| Colour only | Just the swatch square, details on hover/click | |

**User's choice:** Hex code only
**Notes:** Multi-select question -- user selected only hex code

---

## No-Variant Messaging

| Option | Description | Selected |
|--------|-------------|----------|
| Show best efforts + warning | Still show closest variants with a 'distant from original' message. User sees options even if imperfect. | ✓ |
| Show nothing + message | Empty swatch area with clear message. Clean but dead-end. | |
| Show distant + original | Show distant variants AND original with failing ratios for comparison. | |

**User's choice:** Show best efforts + warning
**Notes:** None

---

## Swatch Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Live preview on hover | Panels temporarily update on hover. Revert on mouse leave. | |
| Tooltip info | Show ratios in tooltip. Panels stay until click. | |
| No hover effect | Just cursor change. Click to preview. Simpler. | ✓ |

**User's choice:** No hover effect
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Original stays in input | Swatch updates panels but not hex input. User keeps original for easy revert. | ✓ |
| Input updates to variant | Hex input changes to variant hex. Re-type to go back. | |
| Undo / back button | Input updates but 'back to original' link appears. | |

**User's choice:** Original stays in input
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Ring/border highlight | Selected swatch gets visible border or ring. | ✓ |
| No indicator | No selected state, panels show what's active. | |
| You decide | Claude picks during implementation. | |

**User's choice:** Ring/border highlight
**Notes:** None

---

## Claude's Discretion

- Search algorithm approach (OKLCH lightness binary search recommended)
- Swatch sizing and spacing
- Exact distance threshold for "distant" warning
- Warning message copy
- Ring/border style for selected swatch
- Responsive layout for swatch row

## Deferred Ideas

None -- discussion stayed within phase scope
