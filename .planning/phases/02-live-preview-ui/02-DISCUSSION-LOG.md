# Phase 2: Live Preview UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 02-live-preview-ui
**Areas discussed:** Panel layout, Badge density, Text samples and editing, Input and feedback

---

## Panel Layout

### Panel arrangement

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side | Light panel left, dark panel right. Equal width. Direct visual comparison like colourcontrast.cc. | ✓ |
| Stacked vertically | Light panel on top, dark below. Better for narrow screens but loses direct comparison. | |
| Side-by-side, stack on mobile | Side-by-side on wide screens, stacks vertically below a breakpoint. | |

**User's choice:** Side-by-side
**Notes:** None

### Input position

| Option | Description | Selected |
|--------|-------------|----------|
| Centred above panels | Prominent single input at the top. Clean and obvious — colourcontrast.cc style. | ✓ |
| Sticky top bar | Input stays visible while scrolling. | |
| Between the panels | Input sits in the divider between light and dark panels. | |

**User's choice:** Centred above panels
**Notes:** None

### Page width

| Option | Description | Selected |
|--------|-------------|----------|
| Max-width container | Centred content area ~1200px. Feels designed, works well on large monitors. | ✓ |
| Full bleed | Panels stretch edge-to-edge. Immersive but can feel sparse on ultrawide. | |

**User's choice:** Max-width container
**Notes:** None

---

## Badge Density

### Badge grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Compact row below text | One row per panel: ratio number + inline AA/AAA badges. Minimal space. | ✓ |
| Table/grid | Small 2x2 grid: rows = normal/large, columns = AA/AAA. | |
| Sidebar strip | Vertical strip on inner edge of each panel with stacked badges. | |

**User's choice:** Compact row below text
**Notes:** None

### Large text badge weight

| Option | Description | Selected |
|--------|-------------|----------|
| Show both equally | Normal and large text results side-by-side with same prominence. | |
| Normal primary, large secondary | Normal text badges prominent. Large text shown smaller or collapsed. | ✓ |
| You decide | Claude picks the best approach. | |

**User's choice:** Normal primary, large secondary
**Notes:** None

---

## Text Samples and Editing

### Default text content

| Option | Description | Selected |
|--------|-------------|----------|
| Realistic UI copy | Natural heading + paragraph showing real reading context. | ✓ |
| Lorem ipsum | Classic placeholder. Familiar but meaningless. | |
| Descriptive/instructional | Self-describing text like "Heading Text" and "This is body text at normal size." | |

**User's choice:** Realistic UI copy
**Notes:** None

### Click-to-edit mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| contenteditable | Text is directly editable in place. Native browser feature. | ✓ |
| Click to reveal input | Clicking text swaps it for a text input field. | |
| You decide | Claude picks the simplest approach. | |

**User's choice:** contenteditable
**Notes:** None

---

## Input and Feedback

### Update timing

| Option | Description | Selected |
|--------|-------------|----------|
| Live as-you-type | Panels update on every keystroke once input is valid hex. | ✓ |
| On blur or Enter | Panels update when user leaves the field or presses Enter. | |
| Debounced (300ms) | Updates after a short pause in typing. | |

**User's choice:** Live as-you-type
**Notes:** None

### Error state

| Option | Description | Selected |
|--------|-------------|----------|
| Red border + inline message | Input gets red border. Short message below. Panels keep last valid colour. | ✓ |
| Just red border | Red border only, no text message. | |
| You decide | Claude picks the clearest approach. | |

**User's choice:** Red border + inline message
**Notes:** None

### Hash prefix

| Option | Description | Selected |
|--------|-------------|----------|
| Static # before input | Non-editable # sits before the input field. User types "2563EB", sees "#2563EB". | ✓ |
| Accept with or without | No visual prefix. Engine handles both formats. | |
| You decide | Claude picks. | |

**User's choice:** Static # before input
**Notes:** None

---

## Claude's Discretion

- Responsive breakpoint for panel stacking on narrow screens
- Exact sample text wording
- Badge icon/text treatment (checkmarks vs text labels)
- Exact error message copy
- File organisation (single HTML vs separate CSS/JS)

## Deferred Ideas

None — discussion stayed within phase scope
