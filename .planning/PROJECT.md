# WCAG Colour Finder

## Current State

**Shipped:** v1.0 MVP — 2026-04-24
**Codebase:** ~3,200 LOC vanilla JS/HTML/CSS, zero runtime deps, 87/87 tests passing
**Live behaviour:** Hex input → live light + dark previews with AA/AAA badges → find 5 closest accessible variant pairs via OKLab L-axis search → click-to-apply swatches → URL-shareable state. Six contenteditable specimens with cross-panel mirror.

## What This Is

A web tool that helps designers and developers find accessible colour variants from any hex code that meet WCAG contrast standards. Enter a hex colour, see it previewed as text on light and dark backgrounds with pass/fail badges, then find the closest accessible alternatives. Inspired by colourcontrast.cc.

## Core Value

Given any hex colour, find the closest accessible variant(s) that pass WCAG AA contrast against light and dark backgrounds.

## Requirements

### Validated (v1.0)

- ✓ User enters a hex colour code — v1.0 (Phase 2)
- ✓ Split-screen layout: light background (left), dark background (right) — v1.0 (Phase 2)
- ✓ User's hex becomes the text colour on both panels — v1.0 (Phase 2)
- ✓ Real UI text samples (heading + paragraph) shown in the chosen colour — v1.0 (Phase 2 / 5.1)
- ✓ AA and AAA pass/fail badges shown for both normal and large text, per panel — v1.0 (Phase 2)
- ✓ "Find accessible colour" button triggers search for closest accessible variants — v1.0 (Phase 3)
- ✓ Returns ~5 accessible colour variants, shown as clickable swatches — v1.0 (Phase 3)
- ✓ Clicking a swatch updates both panels to preview that variant — v1.0 (Phase 3)
- ✓ Empty-state messaging when no accessible pair exists — v1.0 (Phase 6, VAR-05)
- ✓ Dual-colour mode: two close shades, one per BG, each passing AA — v1.0 (Phase 4)
- ✓ Inline hex inputs for custom light/dark backgrounds — v1.0 (Phase 4)
- ✓ Hex colour stored in URL for shareable links — v1.0 (Phase 4)
- ✓ Default colour on load: #2563EB — v1.0 (Phase 2)
- ✓ Minimal monochrome UI — black/white chrome, colour from user input — v1.0 (Phase 5)
- ✓ Tool itself passes WCAG AA — v1.0 (Phase 5, axe 0/0 critical/serious)
- ✓ Editable specimen text with cross-panel mirror — v1.0 (Phase 5.1)

## Current Milestone: v1.1 Polish + Fixes

**Goal:** Fix v1.0 rough edges — responsive bugs, AAA search defect, variant spread, auto-find UX, smarter single-side search.

**Target features:**
- Auto-find on 6-char hex and AA/AAA toggle (remove "Find 5" button)
- AAA search bug — fix so AAA finds results when colour space allows
- Wider variant spread across 5 results (keep nearest, stretch furthest)
- Asymmetric search: lock accessible side, only search alt for failing BG
- Responsive fix: badge labels clipping
- Responsive fix: hex input min-width overflow

### Active (v1.1)

- [ ] Auto-find triggers on valid 6-char hex and on AA/AAA toggle; "Find 5" button removed
- [ ] AAA mode returns results whenever colour space permits (search defect)
- [ ] Variant spread — 5 results span wider L-axis range (nearest preserved, furthest extended)
- [ ] Asymmetric search — input retained on any BG it already passes; alt searched only for failing BG
- [ ] Responsive: badge labels visible at all supported widths
- [ ] Responsive: hex input does not push container off-screen at narrow widths
- [ ] Hex 3-char autocomplete fix promoted from quick task 260424-tzn

### Out of Scope

- Single-colour mode — dropped in Phase 4 (D-01): dual-only is the product
- Single/dual mode toggle — dropped in Phase 4 (D-01): no toggle, dual-only
- Colour blindness simulation — different tool, different scope
- Colour palette generation — we find accessible variants, not full palettes
- Framework or build step — vanilla HTML/CSS/JS only
- User accounts or saved colours — stateless tool, URL sharing instead

## Context

- Vanilla HTML/CSS/JS, no frameworks, no build step
- All colour calculations client-side (OKLab perceptual space)
- British spelling throughout UI (colour, not color) — non-negotiable
- Inspired by colourcontrast.cc's clean aesthetic
- WCAG 2.1 contrast ratios: AA normal 4.5:1, AA large 3:1, AAA normal 7:1, AAA large 4.5:1
- Linearisation threshold 0.04045 per WCAG 2.1 spec
- Test runner: `node --test 'test/*.test.js'` (Node 24 native)

## Constraints

- **Tech stack:** Vanilla HTML/CSS/JS — no frameworks, no build tools, no dependencies
- **Performance:** All calculations client-side, instant feedback on input
- **Compatibility:** Modern browsers (no IE support needed)
- **Accessibility:** The tool itself passes WCAG AA (verified Phase 5)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla JS, no framework | Simplicity, no build, fast load | ✓ Validated (Phase 1) |
| OKLab perceptual space for variant search | Lightness-monotonic with luminance enables binary search | ✓ Validated (Phase 3) |
| OKLab L-axis binary search over brute-force sRGB | Fast, preserves colour identity (chroma/hue) | ✓ Validated (Phase 3) |
| 5 colour variants per search | Enough choice without overwhelming | ✓ Validated (Phase 3) |
| Colour swatches for cycling | Click to preview, visual and direct | ✓ Validated (Phase 3) |
| URL state for sharing | Shareable links without accounts | ✓ Validated (Phase 4) |
| Both normal + large text ratios | More useful for real decisions | ✓ Validated (Phase 5) |
| Inline BG colour inputs | Quick access without hiding in settings | ✓ Validated (Phase 4) |
| Dual-only, no single mode (D-01) | Simpler UX; single-mode rarely finds a match | ✓ Validated (Phase 4) |
| `node:test` test runner | Zero deps, ships with Node 24 | ✓ Validated (Phase 1) |
| Pure-function extraction pattern | Headless testable without JSDOM | ✓ Validated (Phase 2) |
| `max(distLight, distDark)` pair distance metric | Worst-case bound preserves perceptual closeness on both BGs | ✓ Validated (Phase 4) |
| Mockup as design ground truth, not UI-SPEC | Mockup arrived mid-phase; auditing pre-rebuild wasteful | ✓ Validated (Phase 5) |
| Post-filter for AAA threshold (in-app, not in findVariantPairs) | Preserves variant-search AA invariant for callers/tests | ⚠️ Revisit (fewer AAA results when space sparse) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-24 — v1.1 Polish + Fixes milestone started*
