// variant-search.js
// Pure ES module — no DOM, no window. Imports only from colour-engine.js.
//
// Dual-pair output: each result is a shade that passes the active threshold
// on the supplied light BG and a shade that passes the active threshold on
// the supplied dark BG. BGs and threshold are parameters — no hardcoded
// constants (per Phase 4 D-10 / Phase 7 D-02).
//
// Exports:
//   findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5)
//     → Array<{ lightHex, darkHex, distance }> | null
//     Returns [] (empty array) when input already passes targetRatio on both BGs.
//     Returns null only for invalid inputHex.

import {
  parseHex,
  srgbToOklab,
  oklabToSrgb,
  contrastRatio,
  passesThreshold,
  oklabDistance,
} from './colour-engine.js';

// --- Constants ---

// Small a-channel offsets to generate up to 5 distinct candidate pairs.
// Restricted to ±0.02 to preserve colour identity (hue/chroma shift is minimal).
const A_OFFSETS = [0, 0.01, -0.01, 0.02, -0.02];

// L-axis stretch seeds. Index 0 = nearest passing (existing behaviour).
// Indices 1..4 progressively bias the binary-search starting bound away from
// input L so results span the L axis (D-05, D-07). 0.18 chosen per
// 07-RESEARCH.md Open Question 1 — ~20-30 JNDs, visible yet in-family.
const L_STRETCH_SEEDS = [0, 0.05, 0.10, 0.15, 0.18];

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
 * Normalise any accepted hex form ('#abc', 'abc', '#AABBCC', 'aabbcc') into
 * the canonical 7-char uppercase '#RRGGBB' used for locked-side outputs.
 *
 * @param {string} hex
 * @returns {string|null}
 */
function normaliseHex(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Binary search on the OKLab L axis for a shade that passes `targetRatio`
 * against a single supplied background. Monotonicity holds because OKLab L
 * is monotonically related to WCAG luminance.
 *
 * `seedDelta` biases the starting bound past the nearest threshold crossing
 * so subsequent seeds converge to progressively-further passing points along
 * the L axis (Phase 7 D-05 / SEARCH-02). seedDelta=0 preserves the original
 * "nearest passing" behaviour.
 *
 * @param {number} L          - Starting OKLab L value
 * @param {number} a          - OKLab a channel (fixed during this search)
 * @param {number} b          - OKLab b channel (fixed during this search)
 * @param {'darker'|'lighter'} direction
 * @param {string} bgHex      - Background to pass against (e.g. '#ffffff')
 * @param {number} targetRatio - Numeric contrast threshold (e.g. 4.5 or 7.0)
 * @param {number} seedDelta  - L offset from input used to narrow the search interval
 * @returns {string|null}     - Uppercase hex or null if no crossing found
 */
function searchLForBg(L, a, b, direction, bgHex, targetRatio, seedDelta = 0) {
  let lo, hi;
  if (direction === 'darker') {
    lo = 0;
    hi = Math.max(0, L - seedDelta);
  } else {
    lo = Math.min(1, L + seedDelta);
    hi = 1;
  }
  if (hi <= lo) return null; // seed pushed past gamut — correct null signal (D-14)

  let result = null;

  for (let i = 0; i < 40; i++) { // 40 iterations → sub-0.001 precision on L
    const mid = (lo + hi) / 2;
    const { r, g: gv, b: bv } = oklabToSrgb(mid, a, b);
    const hex = rgbToHex(r, gv, bv);

    // Gamut check: round-trip to OKLab and verify a/b channels haven't shifted
    // more than GAMUT_AB_TOLERANCE. If clipped beyond tolerance, push the
    // search interval back toward origin L (away from the extreme sRGB
    // boundary that caused clamping — Phase 4 fix).
    //
    // Tolerance 0.05 (not 0.02): saturated mid-tones (e.g. #2563EB, b ≈ -0.21)
    // legitimately lose some chroma when brightened into AAA luminance territory,
    // and the clipped hex is still in the same colour family. 0.02 was too tight
    // and blocked all AAA pairs for saturated blues.
    const roundTrip = srgbToOklab(r, gv, bv);
    if (Math.abs(roundTrip.a - a) > 0.05 || Math.abs(roundTrip.b - b) > 0.05) {
      if (direction === 'darker') lo = mid; // push lo up toward L
      else hi = mid;                         // push hi down toward L
      continue;
    }

    const ratio = contrastRatio(hex, bgHex);

    if (ratio !== null && passesThreshold(ratio, targetRatio)) {
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
 * Find up to `count` accessible dual-pair colour variants at `targetRatio`.
 *
 * For each a-channel offset × L-stretch seed, we try all four direction
 * combinations (light side darker/lighter × dark side darker/lighter) and
 * keep the pair with the smallest `max(distLight, distDark)`.
 *
 * Per-side gating (D-09/D-10/D-11/D-12):
 *   - If input already passes `targetRatio` on a BG, that side is LOCKED to
 *     the input hex and only the failing side is searched.
 *   - If input passes both sides at `targetRatio`, returns [] (empty array).
 *
 * Distance metric (per 04-RESEARCH.md Open Question 3 + D-13):
 *   `max(distLight, distDark)` where a locked side contributes 0.
 *   Conservative — pairs are only "close" if both shades are close to input.
 *
 * @param {string} inputHex     - Hex colour, with or without #, 3 or 6 digits
 * @param {string} lightBg      - Light background hex (e.g. '#ffffff')
 * @param {string} darkBg       - Dark background hex (e.g. '#000000')
 * @param {number} count        - Maximum pairs to return (default 5)
 * @param {number} targetRatio  - WCAG contrast threshold (default 4.5 = AA normal; use 7.0 for AAA)
 * @returns {Array<{ lightHex: string, darkHex: string, distance: number }> | null}
 *   - Array of pairs (possibly empty if both sides already pass at targetRatio)
 *   - null only for invalid inputHex
 */
export function findVariantPairs(inputHex, lightBg, darkBg, count = 5, targetRatio = 4.5) {
  const rgb = parseHex(inputHex);
  if (!rgb) return null;

  // Per-side gating (D-09/D-10/D-11/D-12)
  const lightRatio = contrastRatio(inputHex, lightBg);
  const darkRatio  = contrastRatio(inputHex, darkBg);
  const lightPasses = lightRatio !== null && lightRatio >= targetRatio;
  const darkPasses  = darkRatio  !== null && darkRatio  >= targetRatio;

  if (lightPasses && darkPasses) return []; // D-12

  const origin = srgbToOklab(rgb.r, rgb.g, rgb.b);

  // Per-seed buckets: each seedDelta index gets its own candidate Map so we
  // can pick one representative per L-stretch band. Preserves the
  // nearest-pair guarantee (seed[0]) while delivering visible L-axis spread
  // across the returned list (SEARCH-02 / D-05 / D-07).
  const perSeed = L_STRETCH_SEEDS.map(() => new Map());

  // Normalise input hex for locked-side output (uppercase, 7-char with '#').
  const inputNorm = normaliseHex(inputHex);

  for (const aOffset of A_OFFSETS) {
    const a = origin.a + aOffset;
    const b = origin.b;

    for (let si = 0; si < L_STRETCH_SEEDS.length; si++) {
      const seedDelta = L_STRETCH_SEEDS[si];
      const bucket = perSeed[si];

      for (const lDir of ['darker', 'lighter']) {
        // Short-circuit duplicate work when light side is locked.
        if (lightPasses && lDir !== 'darker') continue;

        for (const dDir of ['darker', 'lighter']) {
          if (darkPasses && dDir !== 'darker') continue;

          const lightHex = lightPasses
            ? inputNorm
            : searchLForBg(origin.L, a, b, lDir, lightBg, targetRatio, seedDelta);
          const darkHex = darkPasses
            ? inputNorm
            : searchLForBg(origin.L, a, b, dDir, darkBg, targetRatio, seedDelta);

          if (!lightHex || !darkHex) continue;

          const lightRgb = parseHex(lightHex);
          const darkRgb  = parseHex(darkHex);
          if (!lightRgb || !darkRgb) continue;

          // D-13: locked-side distance is 0 by construction.
          const distLight = lightPasses ? 0 : oklabDistance(rgb, lightRgb);
          const distDark  = darkPasses  ? 0 : oklabDistance(rgb, darkRgb);
          const distance  = Math.max(distLight, distDark);

          const key = lightHex + '|' + darkHex;
          if (!bucket.has(key) || bucket.get(key).distance > distance) {
            bucket.set(key, { lightHex, darkHex, distance });
          }
        }
      }
    }
  }

  // Pick the nearest candidate from each seed bucket, then dedupe across
  // buckets (adjacent seeds can collapse onto the same sRGB pair).
  const seen = new Set();
  const representatives = [];
  for (const bucket of perSeed) {
    const sorted = [...bucket.values()].sort((x, y) => x.distance - y.distance);
    for (const cand of sorted) {
      const key = cand.lightHex + '|' + cand.darkHex;
      if (seen.has(key)) continue;
      seen.add(key);
      representatives.push(cand);
      break; // one pick per seed bucket
    }
  }

  // Global ordering: nearest first, then progressively further-stretched picks.
  // Sort stabilises the "result[0] is nearest" invariant (D-06) without
  // collapsing the spread.
  representatives.sort((x, y) => x.distance - y.distance);

  // If we have fewer than `count`, top up from leftover candidates across
  // buckets (ordered by distance) so sparse gamuts still return up to count.
  if (representatives.length < count) {
    const leftover = [];
    for (const bucket of perSeed) {
      for (const cand of bucket.values()) {
        const key = cand.lightHex + '|' + cand.darkHex;
        if (seen.has(key)) continue;
        seen.add(key);
        leftover.push(cand);
      }
    }
    leftover.sort((x, y) => x.distance - y.distance);
    for (const cand of leftover) {
      if (representatives.length >= count) break;
      representatives.push(cand);
    }
    // Re-sort after top-up so results stay ascending by distance.
    representatives.sort((x, y) => x.distance - y.distance);
  }

  return representatives.slice(0, count);
}
