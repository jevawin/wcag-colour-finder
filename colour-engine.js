// colour-engine.js
// Pure JS colour maths — hex parsing, WCAG luminance, contrast ratios, OKLab, perceptual distance.
// Single ES module of named exports. No DOM, no window, no navigator.
//
// Sources:
//   WCAG 2.1 relative luminance: https://www.w3.org/TR/WCAG21/relative-luminance.html
//   W3C threshold correction (0.03928 -> 0.04045): https://github.com/w3c/wcag/issues/308
//   OKLab matrices by Bjorn Ottosson: https://bottosson.github.io/posts/oklab/

// --- WCAG contrast thresholds ---

export const AA_NORMAL  = 4.5;
export const AAA_NORMAL = 7.0;
export const AA_LARGE   = 3.0;
export const AAA_LARGE  = 4.5;

// --- Hex parsing ---

/**
 * Parse a hex colour string into an {r, g, b} object.
 * Accepts 3-digit or 6-digit hex, with or without leading #.
 * Returns null for any invalid input — never throws.
 *
 * @param {string} hex
 * @returns {{r: number, g: number, b: number} | null}
 */
export function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  hex = hex.replace(/^#/, '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// --- WCAG relative luminance ---

/**
 * Compute WCAG 2.1 relative luminance from integer sRGB values (0-255).
 * Threshold: 0.04045 (W3C May 2021 correction — NOT the old 0.03928).
 * Exponent: 2.4.
 *
 * @param {number} r - Red channel, 0-255
 * @param {number} g - Green channel, 0-255
 * @param {number} b - Blue channel, 0-255
 * @returns {number} Luminance in range 0-1
 */
export function relativeLuminance(r, g, b) {
  return [r, g, b]
    .map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

// --- Contrast ratio ---

/**
 * Compute WCAG 2.1 contrast ratio between two hex colours.
 * Returns the raw float — do NOT round before comparing to thresholds.
 * (#777777 on white = ~4.478, which fails AA; rounding to 4.5 would falsely pass it.)
 *
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number | null} Contrast ratio, or null if either input is invalid
 */
export function contrastRatio(hex1, hex2) {
  const rgb1 = parseHex(hex1);
  const rgb2 = parseHex(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --- WCAG threshold checks ---

/** @param {number} ratio @returns {boolean} */
export function passesAA(ratio)      { return ratio >= AA_NORMAL; }

/** @param {number} ratio @returns {boolean} */
export function passesAAA(ratio)     { return ratio >= AAA_NORMAL; }

/** @param {number} ratio @returns {boolean} */
export function passesAALarge(ratio) { return ratio >= AA_LARGE; }

/** @param {number} ratio @returns {boolean} */
export function passesAAALarge(ratio){ return ratio >= AAA_LARGE; }

// --- OKLab conversions (Ottosson matrices) ---

/**
 * Linearise a single sRGB channel (0-255) to linear light.
 * Uses the same sRGB transfer function as relativeLuminance.
 * Internal helper — not exported.
 *
 * @param {number} c - Channel value 0-255
 * @returns {number} Linear light value 0-1
 */
function linearise(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert sRGB (0-255 integers) to OKLab.
 * Source: https://bottosson.github.io/posts/oklab/
 *
 * @param {number} r - Red, 0-255
 * @param {number} g - Green, 0-255
 * @param {number} b - Blue, 0-255
 * @returns {{L: number, a: number, b: number}}
 */
export function srgbToOklab(r, g, b) {
  const rl = linearise(r);
  const gl = linearise(g);
  const bl = linearise(b);

  // M1: linear sRGB -> LMS
  let l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  let m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  let s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  // Cube root
  l = Math.cbrt(l);
  m = Math.cbrt(m);
  s = Math.cbrt(s);

  // M2: LMS -> OKLab
  return {
    L:  0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a:  1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b:  0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

/**
 * Convert OKLab back to sRGB (0-255 integers, clamped and rounded).
 * Inverse of srgbToOklab. Used by the Phase 3 search loop.
 *
 * @param {number} L - OKLab lightness
 * @param {number} a - OKLab a channel
 * @param {number} b - OKLab b channel
 * @returns {{r: number, g: number, b: number}}
 */
export function oklabToSrgb(L, a, b) {
  // Inverse M2: OKLab -> LMS (cube root space)
  let l = L + 0.3963377774 * a + 0.2158037573 * b;
  let m = L - 0.1055613458 * a - 0.0638541728 * b;
  let s = L - 0.0894841775 * a - 1.2914855480 * b;

  // Cube (undo cube root)
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;

  // Inverse M1: LMS -> linear sRGB
  const rl =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Delinearise (inverse of linearise), clamp, round
  function delinearise(v) {
    const out = v <= 0.0031308
      ? 12.92 * v
      : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, out * 255)));
  }

  return { r: delinearise(rl), g: delinearise(gl), b: delinearise(bl) };
}

// --- Perceptual distance ---

/**
 * Euclidean distance in OKLab space between two sRGB colours.
 * Perceptually uniform — chroma and lightness are weighted equally.
 *
 * @param {{r: number, g: number, b: number}} rgb1
 * @param {{r: number, g: number, b: number}} rgb2
 * @returns {number}
 */
export function oklabDistance(rgb1, rgb2) {
  const lab1 = srgbToOklab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = srgbToOklab(rgb2.r, rgb2.g, rgb2.b);
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}
