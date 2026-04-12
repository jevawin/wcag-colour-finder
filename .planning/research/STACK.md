# Technology Stack

**Project:** WCAG Colour Finder
**Researched:** 2026-04-12
**Overall confidence:** HIGH

---

## Recommended Stack

### Core approach: hand-rolled calculations, no dependencies

This project has no build step and no framework. The WCAG luminance formula is ~10 lines of maths. The "find nearest accessible colour" algorithm requires OKLab conversion (~15 lines). Neither justifies a dependency.

The constraint "no dependencies" is the right call here — the maths is small, stable, and fully specced.

---

## WCAG Contrast Calculations

### Formula (WCAG 2.1 / 2.2 — same spec, same maths)

**Relative luminance** converts an sRGB hex colour to a single perceptual brightness value:

```javascript
function relativeLuminance(r, g, b) {
  return [r, g, b]
    .map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
```

**Threshold note:** The WCAG 2.1 spec historically used 0.03928 (copied from an older IEC draft). The correct sRGB threshold is 0.04045. W3C updated their own docs in May 2021. The difference has no practical effect on 8-bit colour values, but use 0.04045 for correctness. (Source: [w3c/wcag issue #308](https://github.com/w3c/wcag/issues/308))

**Contrast ratio** from two luminance values:

```javascript
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

**Thresholds to check against:**

| Level | Normal text | Large text |
|-------|-------------|------------|
| AA    | 4.5:1       | 3:1        |
| AAA   | 7:1         | 4.5:1      |

This project focuses on normal text ratios (per PROJECT.md).

**Confidence: HIGH** — This is the W3C spec. No external source needed.

---

## Colour Space: OKLab for Perceptual Distance

### Why you need a perceptual colour space

The "find nearest accessible colour" problem requires measuring how far apart two colours feel to a human eye. RGB distance is wrong — equal RGB steps look very unequal (a small RGB shift in blue looks tiny; the same shift in yellow looks enormous).

### OKLCH/OKLab is the right choice in 2025

OKLab was designed by Björn Ottosson in 2020 specifically to fix CIELAB's perceptual non-uniformity. It outperforms CIELAB on the exact metrics that matter here:

| Metric | OKLab error | CIELAB error |
|--------|-------------|--------------|
| Lightness | 0.20 RMS | 1.70 RMS |
| Chroma | 0.81 RMS | 1.84 RMS |

CIELAB has known hue and chroma shifts (blue hues skew noticeably). OKLab does not.

For this project: **search for nearest accessible colour by minimising Euclidean distance in OKLab space.** Equal steps in OKLab correlate well with equal perceived colour difference.

**OKLCH** is the cylindrical form of OKLab (L = lightness, C = chroma, H = hue). Use it when you want to clamp/adjust a single axis (e.g. "shift lightness until contrast passes"). Use OKLab when computing raw distance between two colours.

Both are now supported natively in CSS (`oklch()`, `oklab()`) and in all modern browsers. (Source: [MDN oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch))

**Confidence: HIGH** — Multiple sources agree; OKLab's author published the benchmarks.

### Conversion formulas (hand-roll these — no library needed)

sRGB → linear RGB → XYZ → OKLab is ~20 lines of JS. The maths is stable and well-documented:

```javascript
// sRGB channel to linear light
function linearise(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// sRGB [0-255] to OKLab [L: 0-1, a: -0.5..0.5, b: -0.5..0.5]
function srgbToOklab(r, g, b) {
  const rl = linearise(r), gl = linearise(g), bl = linearise(b);

  // Linear sRGB → LMS (approximate)
  let l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  let m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  let s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  l = Math.cbrt(l);
  m = Math.cbrt(m);
  s = Math.cbrt(s);

  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

function oklabDistance(c1, c2) {
  const lab1 = srgbToOklab(c1.r, c1.g, c1.b);
  const lab2 = srgbToOklab(c2.r, c2.g, c2.b);
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}
```

Matrix values are from Ottosson's original post. They are stable — no library update will change them.

---

## "Find Nearest Accessible Colour" Algorithm

### Recommended approach: search in OKLCH lightness axis

WCAG contrast is almost entirely driven by relative luminance, which correlates strongly with OKLCH's L (lightness) channel. The practical algorithm is:

1. Convert input colour to OKLCH
2. Binary search (or linear scan with early exit) along the L axis
3. At each candidate L value, keep C and H fixed, convert back to sRGB, check WCAG contrast
4. Collect passing candidates; return the 5 closest to the original by OKLab Euclidean distance

Why binary search on L rather than full colour space search:
- Chroma and hue shifts change the colour's identity (a red becomes a pink)
- Lightness adjustment preserves the colour's character
- WCAG contrast is monotonically related to luminance, so binary search is valid

**Confidence: HIGH** — Derived from first principles; validated by Lea Verou's 2024 research showing L threshold approach works in OKLCH ([see her writeup](https://lea.verou.me/blog/2024/contrast-color/))

---

## Libraries: When to Use and When Not To

### Do NOT use a library for this project

| Library | Size | Notes |
|---------|------|-------|
| culori | ~30KB | Excellent, accurate, ESM-native, tree-shakeable, on jsDelivr. Worth it for complex colour tools. Overkill here. |
| chroma.js | ~60KB | Good. Has WCAG contrast. No advantage over culori. |
| tinycolor2 | ~15KB | Smallest, but CommonJS-only. Poor fit for modern ESM. Lacks OKLab support. |
| color.js | ~40KB+ | Lea Verou's library. Has `contrastWCAG21()`. Full colour science. Too large. |

**Verdict:** The entire implementation for this project is under 100 lines of maths. Importing 15–60KB of library to wrap 10 lines of spec maths is not justified, especially with no build step to tree-shake unused code.

If the project scope grew to include colour palette generation, gamut mapping, or APCA calculations, culori would be the first choice.

---

## WCAG 3.0 / APCA: Do Not Use Yet

APCA (Advanced Perceptual Contrast Algorithm) is the proposed contrast method in WCAG 3.0. As of April 2026, WCAG 3.0 remains a Working Draft with no ratification date. Expert consensus is 3–5 more years before it replaces WCAG 2.2 in law or policy.

**Recommendation:** Implement WCAG 2.1/2.2 ratios (4.5:1 AA, 7:1 AAA). Optionally display the APCA score as an informational extra, but do not gate pass/fail on it.

**Confidence: HIGH** — Multiple sources confirm WCAG 3.0 Working Draft status. (Source: [WCAG 3.0 Status 2026](https://web-accessibility-checker.com/en/blog/wcag-3-0-guide-2026-changes-prepare))

---

## Web APIs Worth Using

| API | Use |
|-----|-----|
| `URL` / `URLSearchParams` | Store hex colour in query string for shareable links |
| CSS custom properties | Pass the user's colour into the UI via `--user-colour` for live previews |
| `input[type=color]` | Optional: native colour picker as an alternative to hex input |
| `CSS.supports()` | Detect `oklch()` support if needed (all modern browsers support it) |

No Web Colour API or Canvas API is needed — all conversions are pure maths in JS.

---

## What NOT to Use

| Thing | Why not |
|-------|---------|
| HSL for perceptual distance | HSL lightness is not perceptually uniform. Two colours at the same HSL lightness can look very different. |
| RGB Euclidean distance | Not perceptually uniform. Blue shifts look tiny; yellow shifts look huge. |
| Brute-force full sRGB search | 16M+ candidates. Even with chunking it is slow. Search in OKLCH L axis instead. |
| Any CSS colour library from 2020 or earlier | Most predate OKLab. They use HSL or CIELAB for perceptual operations. |
| Canvas pixel manipulation | No advantage over pure JS maths for this use case. Adds complexity. |

---

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
