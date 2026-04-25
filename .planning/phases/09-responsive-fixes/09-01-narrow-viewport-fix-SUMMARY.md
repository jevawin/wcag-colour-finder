---
phase: 09-responsive-fixes
plan: 01
subsystem: responsive-css
tags: [css, responsive, wcag, mobile, narrow-viewport]
requires:
  - Phase 5 v1.0 visual contract (.pills grid, .hex-input flex chain)
  - Phase 5 AA fallback overrides at style.css:377-380 (#555555, #d1d5db)
provides:
  - "@media (max-width: 480px) block at style.css:519-545"
  - "RESP-01 closure: 4-col → 2-col pill grid below 480px"
  - "RESP-02 closure: min-width:0 propagation + clamp() font-size on hex input"
affects:
  - style.css
tech-stack:
  added: []
  patterns:
    - "clamp(min, fluid, max) for iOS-safe font-size floor (≥16px to avoid Safari focus-zoom)"
    - "min-width: 0 on flex chain to allow flex children to shrink below their content size"
key-files:
  created: []
  modified:
    - style.css (lines 519-545; +27 lines from 547→574)
decisions:
  - "Trimmed .pill padding to 6px 12px below 480px to fit 320px viewport floor (D-07)"
  - "clamp(16px, 4.5vw, 22px) on .hex-input input + .hash — preserves iOS 16px floor (D-05)"
  - "overflow-wrap: anywhere on .pill-label as defensive guard (no truncation, D-02)"
  - "No white-space: nowrap added to pill scope (D-03 guard preserved)"
metrics:
  duration: ~25m
  completed: 2026-04-25
---

# Phase 9 Plan 01: Narrow-Viewport Fix Summary

CSS-only fix adds `@media (max-width: 480px)` block to style.css. Pills relax 4→2 columns so AA Normal / AA Large / AAA Normal / AAA Large labels stay fully readable. Hex input shrinks fluidly down to 320px floor without document overflow. Closes RESP-01 and RESP-02.

## What Was Built

A single new media block in `style.css` (lines 519–545), inserted between the existing 767 block (ends line 516) and the focus-styles section (starts line 545). Block contents:

- **RESP-01 (.pills 4→2 col below 480px)**
  - `.pills { grid-template-columns: repeat(2, 1fr); }` overrides the 767 block's `repeat(4, 1fr) width:100%`
  - `.pill-wrap { min-width: 0 }` — allows grid cell to shrink and contain wrapping label
  - `.pill { flex-wrap: wrap; padding: 6px 12px }` — trim padding for 320px floor; allow glyph + Pass/Fail to wrap
  - `.pill-label { overflow-wrap: anywhere }` — defensive break (no truncation)

- **RESP-02 (hex input fluid scale)**
  - `.row-one { min-width: 0 }` and `.hex-input { min-width: 0; padding: 0 12px }` — propagates flex shrinking up the chain
  - `.hex-input input[type="text"], .hex-input .hash { font-size: clamp(16px, 4.5vw, 22px) }` — iOS-safe floor

## Files Changed

| File      | Lines Added | Range   | Notes                                                         |
| --------- | ----------- | ------- | ------------------------------------------------------------- |
| style.css | +27 (547→574) | 519–545 | New @media block; no existing rules modified                  |

## Commits

- `e3560e3` — feat(09-01): add @media (max-width: 480px) for narrow-viewport fixes (Task 1)
- Task 2 (verification only, no edits) — no commit
- Task 3 (checkpoint, no edits) — no commit

## Audit Results (Task 2)

All seven static-grep / regression checks PASS:

| Row        | Check                                                              | Result   |
| ---------- | ------------------------------------------------------------------ | -------- |
| 9-01-01/02 | `node --test test/` — Phase 1–8 regression suite                   | PASS 121/121 |
| 9-01-03    | `@media (max-width: 480px)` present                                | PASS     |
| 9-01-04    | `white-space: nowrap` on pill scope                                | PASS (none — D-03 guard intact) |
| 9-01-04    | `text-overflow: ellipsis` anywhere                                 | PASS (none — D-02 guard intact) |
| 9-01-05    | `min-width: 0` on `.hex-input` and `.row-one`                      | PASS (≥2 matches) |
| -          | Cascade order: 434 (767) < 519 (480) < 545 (focus)                 | ORDER OK |
| -          | Out-of-scope selectors (.alts/.preview/.bg-tag/etc) unchanged      | PASS     |

## Visual Sweep (Task 3) — IMPORTANT CAVEAT

Task 3 was a `checkpoint:human-verify` requiring a real browser sweep at 320 / 360 / 480 / 767 / 991 / 1400 / 1500 widths × both panels × both AA/AAA toggle states (D-11), plus iOS Safari focus-zoom check (D-05) and axe DevTools spot-checks at 320 / 767.

**The checkpoint was AUTO-APPROVED under the `--auto` chain (orchestrator response: "approved (iOS skipped)"). A human did not actually perform the visual sweep.**

Implications:
- Static and regression gates all PASS; the maths and CSS shape are sound.
- The visual / device-rendering verification (RESP-01 success criteria 1, RESP-02 success criteria 2 in 09-PLAN.md) has NOT been independently confirmed by a human eye.
- iOS Safari focus-zoom behaviour (D-05) is unverified.

**Recommendation for phase verifier and human-UAT:**
- Phase verifier should likely return `human_needed`, generating a HUMAN-UAT.md.
- Before phase 09 is truly closed, a human must run the full sweep per Task 3 `<how-to-verify>` — 7 widths × 2 panels × 2 toggle states + iOS check + axe spot-checks.
- Until that happens, treat RESP-01 and RESP-02 as code-complete but visually unverified.

## Deviations from Plan

None — plan executed exactly as written. The CSS recipe in Task 1 was inserted verbatim. No auto-fixes (Rules 1–3) triggered. No architectural changes (Rule 4) needed.

## Authentication Gates

None.

## Known Stubs

None.

## Closure Status

- **RESP-01:** code-complete; visual verification pending real human sweep
- **RESP-02:** code-complete; visual verification pending real human sweep

## Self-Check: PASSED

- style.css @media (max-width: 480px) block at lines 519–545: FOUND
- Commit e3560e3: FOUND in git log
- Cascade order (767 < 480 < focus): VERIFIED via grep -n
- Regression suite: 121/121 PASS (per Task 2 report)
