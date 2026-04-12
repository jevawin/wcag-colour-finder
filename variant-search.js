// variant-search.js
// Pure ES module — no DOM, no window. Imports only from colour-engine.js.
//
// Exports:
//   findVariants(inputHex, count = 5)  → Array<{ hex, distance }> | null
//   DISTANCE_WARNING_THRESHOLD          → 0.12

import {
  parseHex,
  srgbToOklab,
  oklabToSrgb,
  contrastRatio,
  passesAA,
  oklabDistance,
} from './colour-engine.js';

// --- Constants ---

const LIGHT_BG = '#ffffff';
const DARK_BG  = '#111111'; // Must match app.js DARK_BG — NOT #000000

export const DISTANCE_WARNING_THRESHOLD = 0.12;

// Small a-channel offsets to generate up to 5 distinct candidates.
// Restricted to ±0.02 to preserve colour identity (hue/chroma shift is minimal).
const A_OFFSETS = [0, 0.01, -0.01, 0.02, -0.02];

// --- Helpers ---

/**
 * Convert integer r, g, b (0-255) to 7-char uppercase hex string with # prefix.
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} e.g. '#2563EB'
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.min(255, Math.max(0, v)))
      .toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Binary search on the OKLab L axis for the closest accessible variant.
 *
 * Monotonicity guarantee: OKLab L is monotonically related to WCAG luminance,
 * so there is exactly one crossing point in each direction (darker / lighter).
 *
 * @param {number} L          - Starting OKLab L value
 * @param {number} a          - OKLab a channel (fixed during this search)
 * @param {number} b          - OKLab b channel (fixed during this search)
 * @param {'darker'|'lighter'} direction
 * @param {string} lightBg    - Light background hex (e.g. '#ffffff')
 * @param {string} darkBg     - Dark background hex (e.g. '#111111')
 * @returns {string|null}     - Uppercase hex string, or null if no crossing found
 */
function searchL(L, a, b, direction, lightBg, darkBg) {
  let lo = direction === 'darker' ? 0 : L;
  let hi = direction === 'darker' ? L : 1;
  let result = null;

  for (let i = 0; i < 40; i++) { // 40 iterations → sub-0.001 precision on L
    const mid = (lo + hi) / 2;
    const { r, g: gv, b: bv } = oklabToSrgb(mid, a, b);
    const hex = rgbToHex(r, gv, bv);

    // Gamut check: round-trip to OKLab and verify a/b channels haven't shifted.
    // Large shifts mean clamping distorted the colour identity — discard.
    const roundTrip = srgbToOklab(r, gv, bv);
    if (Math.abs(roundTrip.a - a) > 0.02 || Math.abs(roundTrip.b - b) > 0.02) {
      // Search further away from the gamut boundary
      if (direction === 'darker') hi = mid;
      else lo = mid;
      continue;
    }

    const rl = contrastRatio(hex, lightBg);
    const rd = contrastRatio(hex, darkBg);

    if ((rl !== null && passesAA(rl)) || (rd !== null && passesAA(rd))) {
      result = hex;
      // Keep searching toward the original colour to find the closest passing point
      if (direction === 'darker') lo = mid;
      else hi = mid;
    } else {
      // Search away from original — need more contrast
      if (direction === 'darker') hi = mid;
      else lo = mid;
    }
  }

  return result;
}

// --- Main export ---

/**
 * Find up to `count` accessible colour variants close to inputHex.
 *
 * Strategy:
 *   1. Convert input to OKLab origin point.
 *   2. For each of 5 small a-channel offsets, run binary search in both
 *      'darker' and 'lighter' directions on the L axis.
 *   3. Discard results that fail gamut checks (handled inside searchL).
 *   4. Deduplicate by uppercase hex.
 *   5. Sort by ascending OKLab distance from the original input colour.
 *   6. Return the first `count` results.
 *
 * @param {string} inputHex   - Hex colour, with or without #, 3 or 6 digits
 * @param {number} count      - Maximum variants to return (default 5)
 * @returns {Array<{ hex: string, distance: number }> | null}
 *   Returns null for invalid input. Each object has:
 *     - hex: 7-char uppercase hex string (e.g. '#2563EB')
 *     - distance: OKLab Euclidean distance from the original colour (lower = closer)
 */
export function findVariants(inputHex, count = 5) {
  const rgb = parseHex(inputHex);
  if (!rgb) return null;

  const origin = srgbToOklab(rgb.r, rgb.g, rgb.b);
  const candidates = new Map(); // key: uppercase hex → { hex, distance }

  for (const aOffset of A_OFFSETS) {
    const aShifted = origin.a + aOffset;
    const bFixed   = origin.b;

    for (const direction of ['darker', 'lighter']) {
      const hex = searchL(origin.L, aShifted, bFixed, direction, LIGHT_BG, DARK_BG);
      if (!hex) continue;

      const resultRgb = parseHex(hex);
      if (!resultRgb) continue;

      const dist = oklabDistance(rgb, resultRgb);
      const key  = hex.toUpperCase();

      // Keep only the closest occurrence if we find the same hex via different paths
      if (!candidates.has(key) || candidates.get(key).distance > dist) {
        candidates.set(key, { hex: key, distance: dist });
      }
    }
  }

  const sorted = [...candidates.values()].sort((x, y) => x.distance - y.distance);
  return sorted.slice(0, count);
}
