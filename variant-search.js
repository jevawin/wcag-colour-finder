// variant-search.js
// Pure ES module — no DOM, no window. Imports only from colour-engine.js.
//
// Dual-pair output: each result is a shade that passes AA on the supplied
// light BG and a shade that passes AA on the supplied dark BG. BGs are
// parameters — no hardcoded constants (per Phase 4 D-10, Pitfall 5).
//
// Exports:
//   findVariantPairs(inputHex, lightBg, darkBg, count = 5)
//     → Array<{ lightHex, darkHex, distance }> | null

import {
  parseHex,
  srgbToOklab,
  oklabToSrgb,
  contrastRatio,
  passesAA,
  oklabDistance,
} from './colour-engine.js';

// --- Constants ---

// Small a-channel offsets to generate up to 5 distinct candidate pairs.
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
 * Binary search on the OKLab L axis for the closest shade that passes AA
 * against a single supplied background. Monotonicity holds because OKLab L
 * is monotonically related to WCAG luminance.
 *
 * @param {number} L          - Starting OKLab L value
 * @param {number} a          - OKLab a channel (fixed during this search)
 * @param {number} b          - OKLab b channel (fixed during this search)
 * @param {'darker'|'lighter'} direction
 * @param {string} bgHex      - Background to pass against (e.g. '#ffffff')
 * @returns {string|null}     - Uppercase hex or null if no crossing found
 */
function searchLForBg(L, a, b, direction, bgHex) {
  let lo = direction === 'darker' ? 0 : L;
  let hi = direction === 'darker' ? L : 1;
  let result = null;

  for (let i = 0; i < 40; i++) { // 40 iterations → sub-0.001 precision on L
    const mid = (lo + hi) / 2;
    const { r, g: gv, b: bv } = oklabToSrgb(mid, a, b);
    const hex = rgbToHex(r, gv, bv);

    // Gamut check: round-trip to OKLab and verify a/b channels haven't shifted.
    // If out of gamut, move the search interval back toward origin L
    // (i.e., away from the extreme sRGB boundary that caused clamping).
    const roundTrip = srgbToOklab(r, gv, bv);
    if (Math.abs(roundTrip.a - a) > 0.02 || Math.abs(roundTrip.b - b) > 0.02) {
      if (direction === 'darker') lo = mid; // push lo up toward L
      else hi = mid;                         // push hi down toward L
      continue;
    }

    const ratio = contrastRatio(hex, bgHex);

    if (ratio !== null && passesAA(ratio)) {
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
 * Find up to `count` accessible dual-pair colour variants.
 *
 * For each a-channel offset, we try all four direction combinations
 * (light side darker/lighter × dark side darker/lighter) and keep the
 * pair with the smallest `max(distLight, distDark)`. Light backgrounds
 * usually want a darker foreground; dark backgrounds usually want a
 * lighter foreground — but for edge inputs (very light / very dark)
 * both shades may lie in the same direction, so we try all four.
 *
 * Distance metric (per 04-RESEARCH.md Open Question 3): max of the two
 * per-shade distances. Conservative — pairs are only "close" if both
 * shades are close to the input.
 *
 * @param {string} inputHex   - Hex colour, with or without #, 3 or 6 digits
 * @param {string} lightBg    - Light background hex (e.g. '#ffffff')
 * @param {string} darkBg     - Dark background hex (e.g. '#000000')
 * @param {number} count      - Maximum pairs to return (default 5)
 * @returns {Array<{ lightHex: string, darkHex: string, distance: number }> | null}
 */
export function findVariantPairs(inputHex, lightBg, darkBg, count = 5) {
  const rgb = parseHex(inputHex);
  if (!rgb) return null;

  const origin = srgbToOklab(rgb.r, rgb.g, rgb.b);
  const candidates = new Map(); // key: lightHex+'|'+darkHex → { lightHex, darkHex, distance }

  for (const aOffset of A_OFFSETS) {
    const a = origin.a + aOffset;
    const b = origin.b;

    for (const lDir of ['darker', 'lighter']) {
      for (const dDir of ['darker', 'lighter']) {
        const lightHex = searchLForBg(origin.L, a, b, lDir, lightBg);
        const darkHex  = searchLForBg(origin.L, a, b, dDir, darkBg);
        if (!lightHex || !darkHex) continue;

        const lightRgb = parseHex(lightHex);
        const darkRgb  = parseHex(darkHex);
        if (!lightRgb || !darkRgb) continue;

        const distLight = oklabDistance(rgb, lightRgb);
        const distDark  = oklabDistance(rgb, darkRgb);
        const distance  = Math.max(distLight, distDark);

        const key = lightHex + '|' + darkHex;
        if (!candidates.has(key) || candidates.get(key).distance > distance) {
          candidates.set(key, { lightHex, darkHex, distance });
        }
      }
    }
  }

  return [...candidates.values()]
    .sort((x, y) => x.distance - y.distance)
    .slice(0, count);
}
