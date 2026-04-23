# Roadmap: WCAG Colour Finder

## Overview

Start with the colour maths (the most failure-prone part), layer on the live preview UI, add the variant search algorithm (the differentiator), bolt on modes and configuration, then polish the design and audit accessibility. Each phase delivers something independently verifiable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Colour Engine** - Pure JS colour maths — luminance, contrast ratio, hex parsing, OKLab distance
- [x] **Phase 2: Live Preview UI** - Hex input, split-screen panels, contrast ratios, AA/AAA badges (completed 2026-04-12)
- [x] **Phase 3: Variant Search** - Find closest accessible colour variants, display as clickable swatches (completed 2026-04-12)
- [ ] **Phase 4: Modes and Configuration** - Dual-colour mode, custom background inputs, URL sharing
- [x] **Phase 5: Design and Accessibility** - Monochrome UI polish, tool passes its own WCAG AA standard (completed 2026-04-23)
- [ ] **Phase 6: Gap Closure — VAR-05 + Orphan Cleanup** - Restore empty-state messaging, remove unused export, backfill Nyquist validation

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
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — TDD: colour engine (hex parsing, luminance, contrast, OKLab, distance)

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
**Plans:** 1/1 plans complete

Plans:
- [x] 02-01-PLAN.md — HTML/CSS/JS live preview (hex input, split panels, contrast badges, contenteditable text)
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
**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — TDD: variant search algorithm (OKLCH lightness binary search, findVariants)
- [x] 03-02-PLAN.md — UI wiring (button, swatch row, swatch click, distance warning)

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
**Plans:** 3 plans

Plans:
- [x] 04-01-PLAN.md — TDD: url-state module + findVariantPairs refactor (BG params, dual-pair output)
- [x] 04-02-PLAN.md — UI wiring (BG inputs, paired swatches, URL hydrate + debounced sync)
- [x] 04-03-PLAN.md — REQUIREMENTS.md cleanup + browser smoke checkpoint

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
**Plans:** 8 plans (3 original + 5 gap-closure rebuild wave)

Plans:
- [x] 05-01-pure-helpers-and-wave-0-PLAN.md — Wave 0: extract buildBadgeHTML, chooseChromeForeground, deriveBadgeColors + test stubs (british-spelling, badge-markup, ui-chrome-contrast)
- [x] 05-02-two-zone-layout-and-badges-PLAN.md — Two-zone HTML, typography/spacing CSS, derived pass-badge tint, British copy sweep, setBadge rewire
- [x] 05-03-focus-responsive-a11y-audit-PLAN.md — Unified focus styles + mobile tabs ARIA shipped (Task 1); a11y audit deferred to gap-closure wave after new Claude Design mockup arrived mid-plan (status: gaps-found — 10 structural gaps recorded in 05-VERIFICATION.md)
- [x] 05-04-rebuild-markup-and-fonts-PLAN.md — Rebuild wave W1: new index.html skeleton matching mockup + Google Fonts (Inter + JetBrains Mono). Closes G1/G2/G6/G7/G10 markup.
- [x] 05-05-rebuild-styles-PLAN.md — Rebuild wave W2: replace style.css with mockup CSS + unified focus append. Closes G1/G5/G6/G7/G10 CSS.
- [x] 05-06-rewire-app-PLAN.md — Rebuild wave W3: rewire app.js against new DOM — auto-find pipeline, segmented AA|AAA toggle, fg-tag/bg-tag copy, Find re-roll, topbar-fg derivation. Closes G3/G4/G8.
- [x] 05-07-alts-grid-polish-PLAN.md — Rebuild wave W4: alts tiles as semantic buttons with aria-label + .is-selected class + :focus-visible. Closes G9 keyboard/SR bits.
- [x] 05-08-a11y-reaudit-PLAN.md — Rebuild wave W5: axe-core + keyboard + VoiceOver re-audit at 4 hex values; flip phase status to complete.
**UI hint**: yes

### Phase 05.1: reinstate-editable-specimens (INSERTED)

**Goal:** Make the three specimen text elements (heading, paragraph, digits) editable in both preview panels. Edits in one panel mirror to the other. No persistence across reloads.
**Requirements**: UI-04 (new — editable specimens)
**Depends on:** Phase 5
**Success Criteria** (what must be TRUE):
  1. `.heading`, `.para`, `.digits` in both `#preview-light` and `#preview-dark` have `contenteditable="true"` and an appropriate `aria-label`
  2. Editing any specimen element in one panel updates the matching element in the other panel in real time (`input` event)
  3. Default copy restored on hard reload — no localStorage, no URL persistence
  4. Focus outline visible when a specimen is focused; keyboard users can Tab to and edit each specimen
  5. No new axe violations; existing contrast calc + sr-status announcements unaffected
**Plans:** 1/1 plans complete

Plans:
- [x] 05.1-01-editable-specimens-PLAN.md — reinstate contenteditable on .heading/.para/.digits in both panels + cross-panel input sync

### Phase 6: Gap Closure — VAR-05 + Orphan Cleanup
**Goal**: Close v1.0 audit tech-debt items — restore explicit empty-state copy + SR announcement for VAR-05, remove orphan `DISTANCE_WARNING_THRESHOLD` export, backfill Nyquist validation across phases 1–5
**Depends on**: Phase 5
**Requirements**: VAR-05 (regression)
**Gap Closure**: Closes tech_debt items from .planning/v1.0-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. When `state.alts.length === 0`, an explicit text line ("No accessible pair found for this colour" or equivalent British copy) renders in place of em-dash placeholders
  2. Empty-state change triggers an `announce()` call via `#sr-status` live region
  3. `DISTANCE_WARNING_THRESHOLD` either consumed by UI (threshold-based warning) or removed from variant-search.js exports
  4. All 5 VALIDATION.md files reach `nyquist_compliant: true` via `/gsd:validate-phase 1..5`
  5. Re-run `/gsd:audit-milestone` reports `status: complete` with empty tech_debt
**Plans:** TBD (run `/gsd:plan-phase 6`)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Colour Engine | 0/1 | Not started | - |
| 2. Live Preview UI | 1/1 | Complete   | 2026-04-12 |
| 3. Variant Search | 2/2 | Complete   | 2026-04-12 |
| 4. Modes and Configuration | 0/? | Not started | - |
| 5. Design and Accessibility | 8/8 | Complete | 2026-04-23 |
| 6. Gap Closure — VAR-05 + Orphan Cleanup | 0/? | Not started | - |
