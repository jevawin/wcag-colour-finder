# WCAG Colour Finder

## What This Is

A web tool that helps designers and developers find accessible colour variants from any hex code that meet WCAG contrast standards. Enter a hex colour, see it previewed as text on light and dark backgrounds with pass/fail badges, then find the closest accessible alternatives. Inspired by colourcontrast.cc.

## Core Value

Given any hex colour, find the closest accessible variant(s) that pass WCAG AA contrast against light and dark backgrounds.

## Requirements

### Validated

- [x] Dual-colour mode: finds two close shades — one for light BG, one for dark BG — each passing AA — Validated in Phase 4
- [x] Inline hex inputs to set custom light/dark background colours (defaults: #ffffff, #000000) — Validated in Phase 4
- [x] Hex colour stored in URL for shareable links — Validated in Phase 4

### Active

- [ ] User enters a hex colour code
- [ ] Split-screen layout: light background (left), dark background (right)
- [ ] User's hex becomes the text colour on both panels
- [ ] Real UI text samples (heading + paragraph) shown in the chosen colour
- [ ] AA and AAA pass/fail badges shown for both normal and large text, per panel
- [ ] "Find accessible colour" button triggers search for closest accessible variants
- [ ] Returns ~5 accessible colour variants, shown as clickable swatches
- [ ] Clicking a swatch updates both panels to preview that variant
- [ ] Default colour on load: #2563EB
- [ ] Minimal monochrome UI — black/white chrome, colour only from user input

### Out of Scope

- Single-colour mode — dropped in Phase 4 (D-01): dual-only is the product
- Single/dual mode toggle — dropped in Phase 4 (D-01): no toggle, dual-only
- Colour blindness simulation — different tool, different scope
- Colour palette generation — we find accessible variants, not full palettes
- Framework or build step — vanilla HTML/CSS/JS only
- User accounts or saved colours — stateless tool, URL sharing instead

## Context

- Vanilla HTML/CSS/JS, no frameworks, no build step
- All colour calculations client-side
- British spelling throughout UI (colour, not color)
- Inspired by colourcontrast.cc's clean aesthetic
- WCAG contrast ratios: AA normal 4.5:1, AA large 3:1, AAA normal 7:1, AAA large 4.5:1
- Relative luminance formula per WCAG 2.1 specification

## Constraints

- **Tech stack**: Vanilla HTML/CSS/JS — no frameworks, no build tools, no dependencies
- **Performance**: All calculations client-side, instant feedback on input
- **Compatibility**: Modern browsers (no IE support needed)
- **Accessibility**: The tool itself should be accessible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla JS, no framework | Simplicity, no build step, fast load | Validated (Phase 1) |
| 5 colour variants per search | Enough choice without overwhelming | — Pending |
| Colour swatches for cycling | Click to preview, visual and direct | — Pending |
| URL state for sharing | Shareable links without accounts | Validated (Phase 4) |
| Both normal + large text ratios | More useful for real decisions | — Pending |
| Inline BG colour inputs | Quick access without hiding in settings | Validated (Phase 4) |
| Dual-only, no single mode (D-01) | Simpler UX; single-mode rarely finds a match | Validated (Phase 4) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-18 — Phase 4 (Modes and Configuration) complete*
