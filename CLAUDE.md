# WCAG Colour Finder

## What this is

A web tool that helps people find accessible colour variants from a hex code that meet WCAG contrast standards. Inspired by colourcontrast.cc.

## Two modes

### Single-colour mode
Find one colour close to your input that meets WCAG AA contrast against both light and dark backgrounds simultaneously. Also indicates if it passes AAA.

### Dual-colour mode
Find two shades close to each other — one that works on light backgrounds, one on dark. Each shade meets WCAG AA (and shows AAA status).

## Key features

- User enters a hex colour
- Default backgrounds: white (#ffffff) and black (#000000)
- User can set custom light/dark background colours
- Shows contrast ratios
- Shows AA/AAA pass/fail status
- Clean, minimal UI inspired by colourcontrast.cc

## Tech stack

- Vanilla HTML/CSS/JS — no frameworks, no build step
- Single-page app
- All colour calculations done client-side

## WCAG contrast ratios

- AA normal text: 4.5:1
- AA large text: 3:1
- AAA normal text: 7:1
- AAA large text: 4.5:1

We focus on normal text ratios (4.5:1 for AA, 7:1 for AAA).

## Design notes

- Clean, modern, minimal — inspired by colourcontrast.cc
- Show colour previews with text samples
- Black/white UI with colour accents from the user's input
- British spelling throughout (colour, not color) in UI text

<!-- GSD:project-start source:PROJECT.md -->
## Project

**WCAG Colour Finder**

A web tool that helps designers and developers find accessible colour variants from any hex code that meet WCAG contrast standards. Enter a hex colour, see it previewed as text on light and dark backgrounds with pass/fail badges, then find the closest accessible alternatives. Inspired by colourcontrast.cc.

**Core Value:** Given any hex colour, find the closest accessible variant(s) that pass WCAG AA contrast against light and dark backgrounds.

### Constraints

- **Tech stack**: Vanilla HTML/CSS/JS — no frameworks, no build tools, no dependencies
- **Performance**: All calculations client-side, instant feedback on input
- **Compatibility**: Modern browsers (no IE support needed)
- **Accessibility**: The tool itself should be accessible
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core approach: hand-rolled calculations, no dependencies
## WCAG Contrast Calculations
### Formula (WCAG 2.1 / 2.2 — same spec, same maths)
| Level | Normal text | Large text |
|-------|-------------|------------|
| AA    | 4.5:1       | 3:1        |
| AAA   | 7:1         | 4.5:1      |
## Colour Space: OKLab for Perceptual Distance
### Why you need a perceptual colour space
### OKLCH/OKLab is the right choice in 2025
| Metric | OKLab error | CIELAB error |
|--------|-------------|--------------|
| Lightness | 0.20 RMS | 1.70 RMS |
| Chroma | 0.81 RMS | 1.84 RMS |
### Conversion formulas (hand-roll these — no library needed)
## "Find Nearest Accessible Colour" Algorithm
### Recommended approach: search in OKLCH lightness axis
- Chroma and hue shifts change the colour's identity (a red becomes a pink)
- Lightness adjustment preserves the colour's character
- WCAG contrast is monotonically related to luminance, so binary search is valid
## Libraries: When to Use and When Not To
### Do NOT use a library for this project
| Library | Size | Notes |
|---------|------|-------|
| culori | ~30KB | Excellent, accurate, ESM-native, tree-shakeable, on jsDelivr. Worth it for complex colour tools. Overkill here. |
| chroma.js | ~60KB | Good. Has WCAG contrast. No advantage over culori. |
| tinycolor2 | ~15KB | Smallest, but CommonJS-only. Poor fit for modern ESM. Lacks OKLab support. |
| color.js | ~40KB+ | Lea Verou's library. Has `contrastWCAG21()`. Full colour science. Too large. |
## WCAG 3.0 / APCA: Do Not Use Yet
## Web APIs Worth Using
| API | Use |
|-----|-----|
| `URL` / `URLSearchParams` | Store hex colour in query string for shareable links |
| CSS custom properties | Pass the user's colour into the UI via `--user-colour` for live previews |
| `input[type=color]` | Optional: native colour picker as an alternative to hex input |
| `CSS.supports()` | Detect `oklch()` support if needed (all modern browsers support it) |
## What NOT to Use
| Thing | Why not |
|-------|---------|
| HSL for perceptual distance | HSL lightness is not perceptually uniform. Two colours at the same HSL lightness can look very different. |
| RGB Euclidean distance | Not perceptually uniform. Blue shifts look tiny; yellow shifts look huge. |
| Brute-force full sRGB search | 16M+ candidates. Even with chunking it is slow. Search in OKLCH L axis instead. |
| Any CSS colour library from 2020 or earlier | Most predate OKLab. They use HSL or CIELAB for perceptual operations. |
| Canvas pixel manipulation | No advantage over pure JS maths for this use case. Adds complexity. |
## Sources
- WCAG 2.1 relative luminance spec: https://www.w3.org/TR/WCAG21/relative-luminance.html
- W3C threshold correction (0.03928 → 0.04045): https://github.com/w3c/wcag/issues/308
- OKLab by Björn Ottosson: https://bottosson.github.io/posts/oklab/
- OKLCH in CSS (Evil Martians): https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- Lea Verou — contrast-color() research: https://lea.verou.me/blog/2024/contrast-color/
- culori on jsDelivr: https://www.jsdelivr.com/package/npm/culori
- culori vs chroma-js vs tinycolor2 (2026): https://www.pkgpulse.com/blog/culori-vs-chroma-js-vs-tinycolor2-color-manipulation-javascript-2026
- WCAG 3.0 status 2026: https://web-accessibility-checker.com/en/blog/wcag-3-0-guide-2026-changes-prepare
- Building a colour contrast checker (DEV): https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
