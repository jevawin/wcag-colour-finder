# Phase 1: Colour Engine — Research

**Researched:** 2026-04-12
**Domain:** Colour maths — WCAG luminance, contrast ratios, OKLab/OKLCH, hex parsing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use ES modules (`import`/`export` with `type="module"` on script tags)
- **D-03:** Tests must verify against known WCAG spec reference values and published contrast ratios — correctness against the standard is the bar
- **D-05:** American spelling in code identifiers (`color`, not `colour`), British spelling in UI-facing strings only
- **D-08:** Engine functions return `null` on bad input (e.g. `parseHex('#xyz')` returns `null`) — no thrown exceptions for expected invalid input. Callers decide how to handle.

### Claude's Discretion

- **D-02:** File organisation (single file vs split by concern) and naming conventions
- **D-04:** Choice of test runner/framework (options: Node built-in `node:test`, lightweight HTML runner, or other zero-dependency approach)
- **D-06:** Function naming convention (verb-first camelCase vs short noun-style)
- **D-07:** Internal colour representation format (RGB arrays, objects, or linear floats)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 1 builds a pure JS colour maths module with no DOM and no dependencies. The formulas are fully specified by W3C and Björn Ottosson — there is no design latitude in the maths itself. Every function must produce values that match authoritative tools (WebAIM, colourcontrast.cc) to be correct.

The maths is small. `relativeLuminance` is 5 lines, `contrastRatio` is 3 lines, `srgbToOklab` is ~20 lines, and hex parsing is ~6 lines. The whole engine is under 100 lines. The risk is not complexity — it is precision. Wrong threshold, wrong exponent, or wrong matrix coefficient produces plausible-looking but incorrect ratios.

The test suite is the deliverable of this phase, not just the code. Tests against published reference values (verified live during research) are what proves the engine is correct.

**Primary recommendation:** Write `colour-engine.js` as a single ES module of pure named exports, test it with `node:test` against hard-coded reference values, and treat the test suite as the primary artefact.

---

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| Vanilla JS (ES2022) | — | All colour maths | Project constraint: no frameworks, no build step |
| `node:test` | Built into Node 18+ | Unit test runner | Zero-dependency, ships with Node, `describe`/`it` API stable in Node 20+ |
| `node:assert/strict` | Built into Node | Assertions | Paired with `node:test`; strict equality by default |

### Supporting

| Thing | Purpose | When to Use |
|-------|---------|-------------|
| `Math.cbrt()` | Cube root for OKLab conversion | Required by Ottosson's matrix step 2 |
| `Math.pow(x, 2.4)` | sRGB linearisation | Required by WCAG 2.1 formula |
| `Math.atan2()` | OKLab → OKLCH hue angle | Needed if OKLCH cylindrical form is exposed |

**No npm install required.** Node v24.14.0 is confirmed available on this machine. `node:test` is available and working.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node:test` | HTML test runner (plain `<script>`) | Browser runner shows results in the browser — closer to the runtime. But `node:test` is faster to run, needs no browser, and suits pure-function unit tests well. Recommended for Phase 1. |
| `node:test` | Jest / Vitest | Adds a dev dependency and requires either a build step or ESM config. Not justified for 100 lines of pure maths. |
| Hand-rolled OKLab | culori (~30KB ESM) | culori is accurate and tree-shakeable. Still overkill — the matrix is 20 lines and never changes. |

**Test command:**
```bash
node --test test/colour-engine.test.js
```

---

## Architecture Patterns

### Recommended Project Structure

```
colour-engine.js          # Single ES module — all colour maths
test/
└── colour-engine.test.js # node:test suite with reference value assertions
```

Phase 1 produces exactly two files. No subdirectories needed.

### Pattern 1: Single ES Module of Named Exports

**What:** One file, all functions exported individually, no default export, no class.
**When to use:** Always — this is the project pattern (D-01, D-02).

```javascript
// colour-engine.js
// Source: WCAG 2.1 spec + Ottosson OKLab paper

export const AA_NORMAL  = 4.5;
export const AAA_NORMAL = 7.0;
export const AA_LARGE   = 3.0;
export const AAA_LARGE  = 4.5;

export function parseHex(hex) { ... }       // string → {r,g,b} | null
export function relativeLuminance(r, g, b) { ... }  // → float 0–1
export function contrastRatio(hex1, hex2) { ... }   // → float
export function passesAA(ratio)  { return ratio >= AA_NORMAL; }
export function passesAAA(ratio) { return ratio >= AAA_NORMAL; }
export function srgbToOklab(r, g, b) { ... }        // → {L,a,b}
export function oklabDistance(rgb1, rgb2) { ... }   // → float
```

This API surface is everything Phase 2 and Phase 3 need.

### Pattern 2: Internal Representation — Plain RGB Object

**What:** `{ r, g, b }` with integer 0–255 values as the internal format.
**When to use:** Across all inter-function calls.
**Why:** Readable, destructurable, no confusion with normalised floats. Functions that need linear values convert internally.

Recommend this over RGB arrays (error-prone indexing) or a class (unnecessary for pure functions).

### Pattern 3: WCAG Linearisation

Verified against WCAG 2.1 spec and confirmed correct via live computation:

```javascript
// Source: https://www.w3.org/TR/WCAG21/relative-luminance.html
// Threshold: 0.04045 (W3C correction, May 2021 — NOT 0.03928)
export function relativeLuminance(r, g, b) {
  return [r, g, b]
    .map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contrastRatio(hex1, hex2) {
  const rgb1 = parseHex(hex1), rgb2 = parseHex(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### Pattern 4: OKLab Conversion (Ottosson matrices)

Verified during research: black → `{L:0, a:0, b:0}`, white → `{L:~1, a:~0, b:~0}`.

```javascript
// Source: https://bottosson.github.io/posts/oklab/ (public domain / MIT)
function linearise(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function srgbToOklab(r, g, b) {
  const rl = linearise(r), gl = linearise(g), bl = linearise(b);
  let l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  let m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  let s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  l = Math.cbrt(l); m = Math.cbrt(m); s = Math.cbrt(s);
  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

export function oklabDistance(rgb1, rgb2) {
  const lab1 = srgbToOklab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = srgbToOklab(rgb2.r, rgb2.g, rgb2.b);
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}
```

### Pattern 5: Hex Parsing with Strict Validation

Returns `null` for any invalid input (D-08). `parseInt` is NOT used raw — it silently accepts garbage. The regex gate is the validator.

```javascript
export function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  hex = hex.replace(/^#/, '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
```

Verified: `parseHex('#fff')` → `{r:255,g:255,b:255}`, `parseHex('#xyz')` → `null`, `parseHex('12345')` → `null`.

### Pattern 6: node:test Test Suite

```javascript
// test/colour-engine.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHex, relativeLuminance, contrastRatio,
  passesAA, passesAAA, srgbToOklab, oklabDistance
} from '../colour-engine.js';

describe('parseHex', () => {
  it('parses 6-digit with hash',  () => assert.deepEqual(parseHex('#ffffff'), { r:255, g:255, b:255 }));
  it('parses 3-digit with hash',  () => assert.deepEqual(parseHex('#fff'),    { r:255, g:255, b:255 }));
  it('parses without hash',       () => assert.deepEqual(parseHex('ffffff'),  { r:255, g:255, b:255 }));
  it('returns null for invalid',  () => assert.equal(parseHex('#xyz'), null));
  it('returns null for 5-digit',  () => assert.equal(parseHex('12345'), null));
});

describe('relativeLuminance', () => {
  it('#000000 → 0',   () => assert.equal(relativeLuminance(0,0,0),     0));
  it('#ffffff → 1',   () => assert.equal(relativeLuminance(255,255,255), 1));
  it('#777777 → ~0.1845', () => {
    const l = relativeLuminance(0x77, 0x77, 0x77);
    assert.ok(Math.abs(l - 0.18447) < 0.0001, `Expected ~0.18447, got ${l}`);
  });
});

describe('contrastRatio', () => {
  it('#777777 on white = ~4.48 (FAIL)', () => {
    const ratio = contrastRatio('#777777', '#ffffff');
    assert.ok(Math.abs(ratio - 4.478) < 0.01, `Expected ~4.478, got ${ratio}`);
    assert.equal(passesAA(ratio), false);
  });
  it('#000000 on white = 21:1', () => {
    const ratio = contrastRatio('#000000', '#ffffff');
    assert.ok(Math.abs(ratio - 21) < 0.01, `Expected 21, got ${ratio}`);
  });
});
```

### Anti-Patterns to Avoid

- **Using `parseInt` without a regex gate:** `parseInt('xyz123', 16)` returns a number. Always validate with `/^[0-9a-fA-F]{6}$/` first.
- **Using 0.03928 as the linearisation threshold:** This is the old incorrect value. Use 0.04045. The difference is tiny but using 0.03928 signals stale code.
- **Using 2.2 or 2.0 as the power exponent:** Must be 2.4. Common mistake from approximating the sRGB transfer function.
- **Rounding contrast ratios before comparison:** `Math.round(4.478 * 10) / 10` gives 4.5, which would make #777777 on white falsely pass AA. Never round before threshold comparison.
- **Touching the DOM inside engine functions:** The engine is pure. No `document`, `window`, or `navigator` references.
- **Exporting an object of functions instead of named exports:** Named exports are required for tree-shaking and match the ES module pattern in D-01.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runner | Custom assertion loop | `node:test` + `node:assert/strict` | Ships with Node; TAP-compatible output; `describe`/`it` API |
| Colour library | — | Nothing — hand-roll the maths | The formulas are 100 lines total, stable, and fully specced |

**Key insight:** For colour maths at this scale, hand-rolling IS the right approach. Every library wraps the same W3C formula. No library handles the OKLab matrices better than copying them from Ottosson's post.

---

## Common Pitfalls

### Pitfall 1: Wrong Linearisation Threshold (0.03928 vs 0.04045)

**What goes wrong:** Contrast ratios are off by a tiny amount. Automated tests against authoritative values fail on borderline colours.
**Why it happens:** The WCAG 2.1 spec originally published 0.03928 (an IEC draft typo). W3C corrected it to 0.04045 in May 2021. Many blog posts and StackOverflow answers still show the old value.
**How to avoid:** Use 0.04045. Test against the spec's own reference values.
**Warning signs:** Contrast ratio for #777777 on white comes out as anything other than ~4.478:1.

### Pitfall 2: Rounding Before Threshold Comparison

**What goes wrong:** `#777777` on white (actual: 4.478:1) rounds to 4.5 and falsely passes AA. The search algorithm may return colours that just barely fail.
**Why it happens:** Displaying "4.48:1" requires rounding for the UI, but rounding the value used for comparison silently corrupts the pass/fail logic.
**How to avoid:** Keep the raw float for comparison. Round only for display output in the UI layer (Phase 2).
**Warning signs:** A colour reported as passing AA that WebAIM reports as failing.

### Pitfall 3: `parseInt` Silently Parses Invalid Hex

**What goes wrong:** `parseHex('1g2h3i')` returns a number instead of `null` because `parseInt` stops at the first invalid character.
**Why it happens:** `parseInt('1g2h3i', 16)` returns `1` — it parses until it hits `g`. Looks valid, is garbage.
**How to avoid:** Always run `/^[0-9a-fA-F]{6}$/` before `parseInt`.
**Warning signs:** Tests with inputs like `'gggggg'`, `'xyz123'`, or partial hex strings pass unexpectedly.

### Pitfall 4: Wrong OKLab Matrix Coefficients

**What goes wrong:** OKLab distance calculations are off. Colours that look different have similar distances; colours that look the same have different distances. The Phase 3 search algorithm returns wrong candidates.
**Why it happens:** Transcription error when copying the two Ottosson matrices. The M1 and M2 matrices have similar-looking coefficients that are easy to swap or misplace.
**How to avoid:** Copy directly from Ottosson's post. Unit-test the conversion: black must produce `{L:0, a:0, b:0}` and white must produce `{L:~1, a:~0, b:~0}` (verified: white gives `L:0.9999999934`, `a:8e-11`, `b:3.7e-8` — acceptable floating-point noise).
**Warning signs:** OKLab of white or black is not near `{L:0, a:0, b:0}` / `{L:1, a:0, b:0}`.

### Pitfall 5: ES Module `import` in Test File Requires `--experimental-vm-modules` (Old Node)

**What goes wrong:** On Node 18, ES module imports in test files require extra flags or a workaround.
**Why it happens:** `node:test` only gained stable ESM support in Node 20+.
**How to avoid:** The project machine runs Node 24.14.0 — not an issue here. Document the Node version requirement in the test file header.
**Warning signs:** `SyntaxError: Cannot use import statement` when running tests.

---

## Code Examples

### Full parseHex + relativeLuminance + contrastRatio

```javascript
// Source: WCAG 2.1 https://www.w3.org/TR/WCAG21/relative-luminance.html
// Threshold 0.04045: https://github.com/w3c/wcag/issues/308

export function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  hex = hex.replace(/^#/, '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function relativeLuminance(r, g, b) {
  return [r, g, b]
    .map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contrastRatio(hex1, hex2) {
  const rgb1 = parseHex(hex1), rgb2 = parseHex(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### Verified Reference Values (live-confirmed during research)

| Input | Expected | Confirmed |
|-------|----------|-----------|
| `relativeLuminance(0, 0, 0)` | `0` | `0.000000` |
| `relativeLuminance(255, 255, 255)` | `1` | `1.000000` |
| `relativeLuminance(0x77, 0x77, 0x77)` | `~0.1845` | `0.184475` |
| `contrastRatio('#777777', '#ffffff')` | `~4.48` | `4.4781` |
| `passesAA(contrastRatio('#777777', '#ffffff'))` | `false` | `false` |
| `srgbToOklab(0, 0, 0).L` | `0` | `0` |
| `srgbToOklab(255, 255, 255).L` | `~1` | `0.9999999` |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner (`node:test`) | Yes | v24.14.0 | — |
| `node:test` | Unit tests | Yes | Built-in (Node 24) | — |
| `node:assert/strict` | Assertions | Yes | Built-in | — |

No missing dependencies. No external services needed. This phase is entirely self-contained.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in, Node 24.14.0) |
| Config file | None — runs with `node --test` |
| Quick run command | `node --test test/colour-engine.test.js` |
| Full suite command | `node --test test/colour-engine.test.js` |

### Phase Requirements → Test Map

Phase 1 has no explicit requirement IDs, but the CONTEXT.md success criteria map directly:

| Criteria | Behaviour | Test Type | Automated Command |
|----------|-----------|-----------|-------------------|
| SC-1: Hex parsing handles 3-digit, 6-digit, with/without #, rejects invalid | `parseHex` returns `{r,g,b}` or `null` | unit | `node --test test/colour-engine.test.js` |
| SC-2: Luminance threshold is 0.04045 | `relativeLuminance(0x77,0x77,0x77)` ≈ 0.1845 | unit | `node --test test/colour-engine.test.js` |
| SC-3: #777777 on white = 4.48:1 (fail) | `contrastRatio('#777777','#ffffff')` ≈ 4.478, `passesAA` = false | unit | `node --test test/colour-engine.test.js` |
| SC-4: OKLab/OKLCH functions exist and return values | `srgbToOklab(0,0,0)` = `{L:0,a:0,b:0}` | unit | `node --test test/colour-engine.test.js` |
| SC-5: All functions pure (no DOM) | Tests run in Node with no browser | structural | `node --test test/colour-engine.test.js` |

### Sampling Rate

- **Per task commit:** `node --test test/colour-engine.test.js`
- **Per wave merge:** `node --test test/colour-engine.test.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/colour-engine.test.js` — covers all five success criteria above
- [ ] `colour-engine.js` — the module under test (greenfield, does not exist yet)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Linearisation threshold 0.03928 | 0.04045 | May 2021 (W3C issue #308) | Tiny numerical difference, correctness signal |
| CIELAB for perceptual distance | OKLab (Ottosson) | 2020 | Much lower hue/chroma error; better "closest colour" results |
| HSL for colour search | OKLCH lightness axis | 2020–2022 | Perceptually uniform; binary search is valid on L axis |

**Deprecated / outdated:**
- 0.03928 threshold: appears in most pre-2022 blog posts, StackOverflow answers, and colour library docs. Correct value is 0.04045.
- HSL lightness for perceptual distance: HSL L is not perceptually uniform. Equal HSL steps look very unequal to human eyes.
- CIELAB: Superseded by OKLab for new implementations. Known hue shift in blue region.

---

## Open Questions

1. **OKLCH inverse for search (Phase 3 concern, not Phase 1)**
   - What we know: Ottosson's post gives the forward conversion. The inverse (OKLab → linear sRGB) requires inverting M2 then M1 matrices.
   - What's unclear: Whether to expose an `oklchToSrgb` export from Phase 1 for use in Phase 3's search loop, or let Phase 3 add it.
   - Recommendation: Include the inverse in Phase 1's engine so Phase 3 imports it rather than duplicating maths. Design it as `oklabToSrgb(L, a, b) → {r, g, b}` with clamping to 0–255.

2. **Floating-point tolerance in test assertions**
   - What we know: OKLab of white gives `L: 0.9999999934` not exactly `1`. Luminance calculations have similar noise at the 6th+ decimal place.
   - What's unclear: How tight to set floating-point tolerances in tests.
   - Recommendation: Use `Math.abs(actual - expected) < 0.0001` for luminance values. For contrast ratios, `< 0.01` tolerance covers any rounding at the display layer.

---

## Sources

### Primary (HIGH confidence)

- WCAG 2.1 relative luminance spec: https://www.w3.org/TR/WCAG21/relative-luminance.html — formula, threshold, weights
- W3C threshold correction (0.03928 → 0.04045): https://github.com/w3c/wcag/issues/308 — when and why threshold changed
- OKLab by Björn Ottosson: https://bottosson.github.io/posts/oklab/ — full matrix coefficients, public domain

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — prior domain research with formula implementations verified against spec
- `.planning/research/PITFALLS.md` — pitfall catalogue from domain research phase
- `.planning/research/ARCHITECTURE.md` — recommended module structure and API surface

### Tertiary (LOW confidence)

None needed — all critical claims verified against primary sources.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no external dependencies; Node built-ins verified available on this machine
- Maths correctness: HIGH — formulas from W3C spec and Ottosson's post; reference values computed live and confirmed
- Architecture: HIGH — single ES module pattern is unambiguous given D-01 and project constraints
- Test strategy: HIGH — `node:test` confirmed available, output format verified, ESM import works on Node 24

**Research date:** 2026-04-12
**Valid until:** Stable indefinitely — WCAG 2.1 formula is not changing; OKLab matrices are not changing; Node 24 is current LTS
