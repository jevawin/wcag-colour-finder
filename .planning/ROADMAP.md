# Roadmap: WCAG Colour Finder

## Overview

Start with the colour maths (the most failure-prone part), layer on the live preview UI, add the variant search algorithm (the differentiator), bolt on modes and configuration, then polish the design and audit accessibility. Each phase delivers something independently verifiable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Colour Engine** - Pure JS colour maths — luminance, contrast ratio, hex parsing, OKLab distance
- [ ] **Phase 2: Live Preview UI** - Hex input, split-screen panels, contrast ratios, AA/AAA badges
- [ ] **Phase 3: Variant Search** - Find closest accessible colour variants, display as clickable swatches
- [ ] **Phase 4: Modes and Configuration** - Dual-colour mode, custom background inputs, URL sharing
- [ ] **Phase 5: Design and Accessibility** - Monochrome UI polish, tool passes its own WCAG AA standard

## Phase Details

### Phase 1: Colour Engine
**Goal**: A tested, correct colour maths library that all other phases depend on
**Depends on**: Nothing (first phase)
**Requirements**: (none — implicit foundation; engine is required by all INP/CON/VAR/MODE requirements)
**Success Criteria** (what must be TRUE):
  1. Hex parsing handles 3-digit, 6-digit, with and without #, and rejects invalid input
  2. Relative luminance calculation matches WCAG 2.1 spec values (linearisation threshold 0.04045)
  3. Contrast ratio calculation is correct — #777777 on white produces 4.48:1 (a fail, not a pass)
  4. OKLab/OKLCH conversion functions exist and return perceptually uniform distance values
  5. All engine functions are pure (no DOM) and pass unit tests
**Plans**: TBD

### Phase 2: Live Preview UI
**Goal**: Users can enter a hex colour and immediately see it previewed on light and dark backgrounds with accurate contrast badges
**Depends on**: Phase 1
**Requirements**: INP-01, INP-02, INP-03, INP-04, CON-01, CON-02, CON-03, CON-04, CON-05, PNL-01, PNL-02, PNL-03
**Success Criteria** (what must be TRUE):
  1. User can type a hex code (3 or 6 digit, with or without #) and see it applied as text colour on both panels
  2. Invalid hex input shows an error state and does not update the panels
  3. Page loads with #2563EB as the default colour, both panels populated
  4. Each panel shows a heading and paragraph in the chosen colour, and the user can edit that text directly
  5. Each panel shows live contrast ratio, AA/AAA badges for normal and large text, updating as the colour changes
**Plans**: TBD
**UI hint**: yes

### Phase 3: Variant Search
**Goal**: Users can find the closest accessible colour variants to their input and preview them
**Depends on**: Phase 2
**Requirements**: VAR-01, VAR-02, VAR-03, VAR-04, VAR-05
**Success Criteria** (what must be TRUE):
  1. Clicking "Find accessible colour" returns up to 5 variant swatches
  2. Each returned variant visually passes AA contrast on at least one background
  3. Variants are perceptually close to the original — not near-black or near-white unless unavoidable
  4. Clicking a swatch updates both preview panels to show that variant
  5. When no nearby accessible variant exists, the tool says so clearly rather than returning distant colours
**Plans**: TBD

### Phase 4: Modes and Configuration
**Goal**: Users can switch between single and dual-colour modes and customise background colours, with results shareable via URL
**Depends on**: Phase 3
**Requirements**: MODE-01, MODE-02, MODE-03, CFG-01, CFG-02, CFG-03
**Success Criteria** (what must be TRUE):
  1. Single-colour mode finds one colour that passes AA on both light and dark backgrounds simultaneously
  2. Dual-colour mode finds two close shades — one for each background — each passing AA independently
  3. User can toggle between modes and the results update accordingly
  4. User can change the light background colour (default #ffffff) and dark background colour (default #000000) via inline hex inputs
  5. The current hex colour is stored in the URL and the page state restores correctly when loading that URL
**Plans**: TBD

### Phase 5: Design and Accessibility
**Goal**: The tool looks polished, matches the intended minimal aesthetic, and passes its own WCAG AA standard
**Depends on**: Phase 4
**Requirements**: UI-01, UI-02, UI-03, A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. The UI chrome is monochrome (black and white) with colour only coming from the user's input
  2. All UI copy uses British spelling (colour, not color)
  3. The tool passes WCAG AA for all its own text and interactive elements
  4. Pass/fail status is communicated with text labels or icons, not colour alone
  5. All interactive elements have visible focus states when navigated by keyboard
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Colour Engine | 0/? | Not started | - |
| 2. Live Preview UI | 0/? | Not started | - |
| 3. Variant Search | 0/? | Not started | - |
| 4. Modes and Configuration | 0/? | Not started | - |
| 5. Design and Accessibility | 0/? | Not started | - |
