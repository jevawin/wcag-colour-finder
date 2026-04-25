---
status: partial
phase: 09-responsive-fixes
source: [09-VERIFICATION.md]
started: 2026-04-25T00:00:00Z
updated: 2026-04-25T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Seven-width visual sweep (D-11)
expected: Serve index.html, open Chrome DevTools Device Toolbar, enter hex `#3366cc`. Sweep widths 1500 → 1400 → 991 → 767 → 480 → 360 → 320. At each width, on both light and dark preview panels, in both AA and AAA toggle states: all four pill labels ("AA Normal", "AA Large", "AAA Normal", "AAA Large") fully readable (wrap OK, abbreviation not OK); hex input fully visible inside topbar; swatch (36px) + `#` glyph fixed-size; `document.documentElement.scrollWidth === window.innerWidth` returns `true`; AA/AAA toggle still works; out-of-scope surfaces (`.alts`, `.preview-tabs`, `.preview`) look identical at 481px vs 479px.
result: [pending]

### 2. iOS Safari focus-zoom (D-05)
expected: On a real iPhone or iOS Simulator at narrow width, tap the hex input — page must NOT zoom on focus. The 16px floor in `clamp(16px, 4.5vw, 22px)` is the iOS-safe threshold.
result: [pending]

### 3. axe DevTools accessibility scan at 320px and 767px
expected: No new critical or serious issues vs the v1.0 Phase 5 baseline. Fail-pill colours `#555555` (light) and `#d1d5db` (dark) at style.css lines 377-380 remain readable.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
