# Requirements: WCAG Colour Finder

**Defined:** 2026-04-12
**Core Value:** Given any hex colour, find the closest accessible variant(s) that pass WCAG AA contrast against light and dark backgrounds.

## v1 Requirements

### Colour Input

- [ ] **INP-01**: User can enter a hex colour code (3 or 6 digit, with or without #)
- [ ] **INP-02**: Hex input validates strictly — rejects invalid characters, shows error state
- [ ] **INP-03**: Default colour #2563EB loads on first visit
- [ ] **INP-04**: User's hex becomes the text colour on both light and dark panels

### Contrast Display

- [ ] **CON-01**: Live contrast ratio displayed per panel (e.g. "4.52:1"), updates as colour changes
- [ ] **CON-02**: AA pass/fail badge for normal text (4.5:1 threshold) per panel
- [ ] **CON-03**: AAA pass/fail badge for normal text (7:1 threshold) per panel
- [ ] **CON-04**: AA pass/fail badge for large text (3:1 threshold) per panel
- [ ] **CON-05**: AAA pass/fail badge for large text (4.5:1 threshold) per panel

### Preview Panels

- [ ] **PNL-01**: Split-screen layout — light background (left), dark background (right)
- [ ] **PNL-02**: Real UI text samples shown in the chosen colour (heading + paragraph)
- [ ] **PNL-03**: User can click to edit the text sample content directly

### Variant Search

- [ ] **VAR-01**: "Find accessible colour" button triggers search for closest accessible variants
- [ ] **VAR-02**: Returns ~5 accessible colour variants displayed as clickable swatches
- [ ] **VAR-03**: Clicking a swatch updates both panels to preview that variant
- [ ] **VAR-04**: Variants are as close to the original colour as possible (perceptual distance)
- [ ] **VAR-05**: Honest messaging when no nearby accessible variant exists for the input

### Colour Modes

- [ ] **MODE-01**: Single-colour mode — finds one colour that passes AA on both light and dark backgrounds simultaneously
- [ ] **MODE-02**: Dual-colour mode — finds two close shades, one for light BG, one for dark BG, each passing AA
- [ ] **MODE-03**: Toggle between single-colour and dual-colour modes

### Configuration

- [ ] **CFG-01**: Inline hex inputs to set custom light background colour (default #ffffff)
- [ ] **CFG-02**: Inline hex inputs to set custom dark background colour (default #000000)
- [ ] **CFG-03**: Hex colour stored in URL for shareable links (updates on input change)

### Visual Design

- [ ] **UI-01**: Minimal monochrome UI — black/white chrome, colour only from user input
- [ ] **UI-02**: Clean, modern layout inspired by colourcontrast.cc
- [ ] **UI-03**: British spelling throughout (colour, not color)

### Accessibility

- [ ] **A11Y-01**: The tool itself passes WCAG AA for all text and interactive elements
- [ ] **A11Y-02**: Pass/fail status not communicated by colour alone (text labels + icons)
- [ ] **A11Y-03**: All interactive elements have visible focus states

## v2 Requirements

### Extended Input

- **INP-05**: RGB and HSL input modes alongside hex
- **INP-06**: Colour picker (native or custom)

### WCAG 3.0

- **WCAG3-01**: APCA contrast scores shown alongside WCAG 2.1 ratios (informational)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Colour blindness simulation | Different tool, different scope |
| Colour palette generation | We find accessible variants, not full palettes |
| Framework or build step | Vanilla HTML/CSS/JS only — simplicity is a feature |
| User accounts / saved colours | Stateless tool, URL sharing instead |
| Wide gamut / P3 colours | Input is hex (sRGB), no need for wide gamut |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INP-01 | Phase 2 | Pending |
| INP-02 | Phase 2 | Pending |
| INP-03 | Phase 2 | Pending |
| INP-04 | Phase 2 | Pending |
| CON-01 | Phase 2 | Pending |
| CON-02 | Phase 2 | Pending |
| CON-03 | Phase 2 | Pending |
| CON-04 | Phase 2 | Pending |
| CON-05 | Phase 2 | Pending |
| PNL-01 | Phase 2 | Pending |
| PNL-02 | Phase 2 | Pending |
| PNL-03 | Phase 2 | Pending |
| VAR-01 | Phase 3 | Pending |
| VAR-02 | Phase 3 | Pending |
| VAR-03 | Phase 3 | Pending |
| VAR-04 | Phase 3 | Pending |
| VAR-05 | Phase 3 | Pending |
| MODE-01 | Phase 4 | Pending |
| MODE-02 | Phase 4 | Pending |
| MODE-03 | Phase 4 | Pending |
| CFG-01 | Phase 4 | Pending |
| CFG-02 | Phase 4 | Pending |
| CFG-03 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |
| A11Y-01 | Phase 5 | Pending |
| A11Y-02 | Phase 5 | Pending |
| A11Y-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total (+ Phase 1 engine foundation with no explicit req IDs)
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
