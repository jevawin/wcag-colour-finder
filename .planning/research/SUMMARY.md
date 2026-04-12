# Research Summary — WCAG Colour Finder

## Executive Summary

- **No libraries needed.** WCAG luminance formula is ~10 lines, OKLab conversion ~20 lines. Entire tool stays under 10KB unminified.
- **OKLab/OKLCH for the search algorithm.** Binary search on OKLCH lightness axis, rank candidates by OKLab Euclidean distance. Perceptually uniform — far better than HSL for "closest colour."
- **The maths is the risk, not the UI.** Wrong linearisation threshold, rounding borderline ratios, and hex parsing edge cases produce plausible-looking but incorrect results. Unit-test the engine first.
- **Single-colour mode can fail honestly.** Many saturated mid-tones have no nearby variant that passes AA on both light and dark. The UX must say so rather than returning near-black/white.
- **The single/dual-colour split is a genuine differentiator.** No existing tool addresses this. Most just check one background.

## Stack

- Vanilla HTML/CSS/JS — no build step, no dependencies
- OKLab (hand-rolled, ~20 lines) — perceptual distance for ranking candidates
- OKLCH lightness search — binary search on L axis, ~7 iterations
- `history.replaceState` — URL sync for shareable links
- CSS custom properties — pass user's colour into UI for live previews
- WCAG 2.1/2.2 ratios — 4.5:1 AA, 7:1 AAA (WCAG 3.0/APCA still Working Draft)

## Key Features

**Table stakes:** hex input, live contrast ratio, AA/AAA badges (normal + large text), split-screen preview, real text samples, custom background inputs

**Differentiators:** find closest accessible variant (~5 swatches), single-colour mode (both BGs), dual-colour mode (separate shades), shareable URLs

**Anti-features:** colour blindness sim, palette generation, accounts, APCA/WCAG 3.0

## Architecture

Three layers, one-way data flow: input → setState → subscribers re-render.

1. `colour-engine.js` — pure functions, no DOM, fully testable
2. `state.js` — flat state object, pub/sub, URL sync
3. UI components — preview panels, results row, controls

## Critical Pitfalls

1. Use linearisation threshold 0.04045 (not 0.03928)
2. Never round before threshold comparison (#777777 on white = 4.48:1 = fail)
3. Validate hex input strictly — `parseInt` silently parses garbage
4. Constrain search deviation — don't return near-black/white as "accessible variant"
5. The tool itself must pass WCAG AA — audit last, not first

## Recommended Build Order

1. **Colour engine + tests** — all maths, zero UI
2. **State + live preview UI** — hex input, contrast display, split-screen panels
3. **Find variants (search algorithm)** — the differentiator, with swatches
4. **Dual-colour mode + custom BGs + URL sharing** — configuration layers
5. **Accessibility audit + polish** — tool passes its own standard

## Open Questions

- OKLab vs HSL for search axis — decide in Phase 3 planning (OKLab recommended)
- "No variant found" UX — design decision for single-colour mode edge cases
- Dual-colour UX — how to present two distinct results clearly
