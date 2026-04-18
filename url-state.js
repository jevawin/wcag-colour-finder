// url-state.js
// Pure ES module — no DOM, no window. Parses and builds the URL hash state
// carrying the foreground hex plus the two background hexes.
//
// Hash format (per D-13, D-16): '#/<fg>/<lightBg>/<darkBg>'
//   - All three segments always present
//   - Lowercase 6-digit hex, no '#' prefix within segments
//
// Exports:
//   parseHashState(hash) → { fg, lightBg, darkBg } | null
//   buildHashPath({ fg, lightBg, darkBg }) → string

const HEX6 = /^[0-9a-fA-F]{6}$/;

/**
 * Parse a hash path into state. Returns null for any invalid shape.
 *
 * Accepts:
 *   '#/2563eb/ffffff/000000'
 *   '/2563eb/ffffff/000000'
 *   '#/2563EB/FFFFFF/000000'       (case-insensitive, normalised to lower)
 *   '#/2563eb/ffffff/000000/'      (trailing slash tolerated)
 *
 * Rejects: empty string, bare '#/', 2 or 4+ segments, invalid hex, 3-digit hex.
 *
 * @param {string} hash
 * @returns {{ fg: string, lightBg: string, darkBg: string } | null}
 */
export function parseHashState(hash) {
  if (typeof hash !== 'string') return null;
  const trimmed = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (trimmed === '') return null;
  const parts = trimmed.split('/');
  if (parts.length !== 3) return null;
  const [fg, lightBg, darkBg] = parts;
  if (!HEX6.test(fg) || !HEX6.test(lightBg) || !HEX6.test(darkBg)) return null;
  return {
    fg: fg.toLowerCase(),
    lightBg: lightBg.toLowerCase(),
    darkBg: darkBg.toLowerCase(),
  };
}

/**
 * Build a hash path from state. All three segments always present (D-16).
 * Lowercases each segment so callers may pass uppercase hex safely.
 *
 * @param {{ fg: string, lightBg: string, darkBg: string }} state
 * @returns {string}
 */
export function buildHashPath({ fg, lightBg, darkBg }) {
  return '#/' + fg.toLowerCase() + '/' + lightBg.toLowerCase() + '/' + darkBg.toLowerCase();
}
