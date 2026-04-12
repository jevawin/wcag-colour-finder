# Phase 3: Variant Search — Research

**Researched:** 2026-04-12
**Domain:** OKLCH lightness binary search, vanilla JS DOM wiring, swatch UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Manual button press only — user clicks "Find accessible colour" to trigger search. No auto-search on input change.
- **D-02:** Button sits beside the hex input on the same row (right side). Compact single-line action bar.
- **D-03:** Horizontal row of ~5 swatches below the preview panels. Ordered by closeness to original colour (perceptually nearest first).
- **D-04:** Each swatch shows its hex code below/beside it. No contrast ratios or badges on swatches themselves.
- **D-05:** Always show best-effort results even when variants are distant from the original. Accompany with a warning message like "These are distant from your original colour" when results exceed a perceptual distance threshold.
- **D-06:** Claude's Discretion: exact distance threshold for "distant" warning and message wording.
- **D-07:** No hover preview effect — just a cursor change. Click to preview. Minimal and undistracted.
- **D-08:** Clicking a swatch updates both preview panels to show that variant BUT does not change the hex input field. Original colour stays in the input so user can easily compare/revert.
- **D-09:** Selected swatch gets a visible ring/border highlight to show which variant is currently being previewed.

### Claude's Discretion

Claude has flexibility on: search algorithm approach (OKLCH lightness binary search recommended in CLAUDE.md research), swatch sizing/spacing, exact distance threshold for "distant" warning (D-06), warning message copy, ring/border style for selected state, and how the swatch row handles responsive layout.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VAR-01 | "Find accessible colour" button triggers search for closest accessible variants | Button HTML/CSS pattern in UI-SPEC; DOM wiring pattern from app.js input handler |
| VAR-02 | Returns ~5 accessible colour variants displayed as clickable swatches | OKLCH lightness binary search produces one result; run twice per colour (toward dark, toward light) and collect up to 5 deduplicated results |
| VAR-03 | Clicking a swatch updates both panels to preview that variant | `render()` function already exists in app.js — swatch click reuses it directly |
| VAR-04 | Variants are as close to the original colour as possible (perceptual distance) | OKLCH L axis search minimises OKLab distance because L is monotonically linked to WCAG luminance |
| VAR-05 | Honest messaging when no nearby accessible variant exists | Distance warning shown when best result OKLab distance > 0.12 (per UI-SPEC D-06) |

</phase_requirements>

---

## Summary

The variant search algorithm is a binary search on the OKLab L (lightness) axis. The colour engine built in Phase 1 exports everything needed: `srgbToOklab`, `oklabToSrgb`, `oklabDistance`, `contrastRatio`, and `passesAA`. All 35 colour engine tests pass on Node 24. The algorithm module can be a new file (`variant-search.js`) — that is the cleaner choice because it keeps searchable logic separate from both the engine maths and the DOM wiring, and is testable without JSDOM.

The UI contract is fully specified in `03-UI-SPEC.md`. The button slot in the HTML is clear (nothing sits to the right of the hex input today — add the button there). The swatch row goes below `.panels` inside `<main class="container">`. All CSS custom properties needed already exist in `style.css` — no new tokens are required.

The one non-obvious challenge is producing up to five *distinct* results rather than one. Binary search converges on a single point. Strategy: run two searches per colour — one shifting L toward darker, one toward lighter — then optionally search at slight chroma offsets to fill remaining slots. Because lightness changes preserve colour identity (CLAUDE.md research), restrict chroma variation to a very small range (±0.02 OKLab a/b offset) and only use it when fewer than 5 lightness-only results exist.

**Primary recommendation:** Implement `variant-search.js` as a new ES module exporting a pure `findVariants(hexInput, count = 5)` function. Wire the button and swatch row in `app.js` DOM block. Reuse `render()` for swatch click updates.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| colour-engine.js | (project) | OKLab conversion, contrast ratio, distance | Already built, tested, correct — do not duplicate |
| node:test | Node 24 built-in | Unit tests for variant-search.js | Already the project test runner |

### Supporting

None. Vanilla JS only — no third-party libraries per CLAUDE.md constraints.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled binary search in OKLCH L | culori library | culori is ~30KB and overkill; engine already does the maths |
| New `variant-search.js` module | Adding search to `colour-engine.js` | colour-engine.js is pure colour maths; search contains product logic (count, distance warning threshold). Separate file is cleaner |

**Installation:** No new packages needed. Zero dependencies is the constraint.

---

## Architecture Patterns

### Recommended Project Structure

```
wcag-colour-finder/
├── colour-engine.js     # (existing) pure colour maths
├── variant-search.js    # NEW: pure search algorithm, no DOM
├── app.js               # (existing) DOM wiring — extend with button + swatch logic
├── index.html           # (existing) — add button + swatch-row HTML
├── style.css            # (existing) — add button, swatch, warning styles
└── test/
    ├── colour-engine.test.js   # (existing)
    ├── app.test.js             # (existing)
    └── variant-search.test.js  # NEW: tests for findVariants
```

### Pattern 1: OKLCH Lightness Binary Search

**What:** Binary search on the OKLab L axis to find the lightest/darkest L value where the colour passes AA. OKLab L is monotonically related to WCAG luminance, so binary search is valid — one crossing point exists in each direction.

**When to use:** Always. It's the only search axis that preserves colour identity (chroma and hue unchanged).

**Example:**
```javascript
// Source: CLAUDE.md "Find Nearest Accessible Colour" section + colour-engine.js API
import { srgbToOklab, oklabToSrgb, contrastRatio, passesAA } from './colour-engine.js';

/**
 * Binary search in OKLab L axis for a passing variant.
 * direction: 'darker' searches L toward 0, 'lighter' searches toward 1.
 * Returns hex string or null if no crossing found.
 *
 * @param {number} L - Starting OKLab L
 * @param {number} a - OKLab a (fixed)
 * @param {number} b - OKLab b (fixed)
 * @param {'darker'|'lighter'} direction
 * @param {string} lightBg - e.g. '#ffffff'
 * @param {string} darkBg  - e.g. '#000000'
 * @returns {string|null} 6-digit uppercase hex or null
 */
function searchL(L, a, b, direction, lightBg, darkBg) {
  let lo = direction === 'darker' ? 0 : L;
  let hi = direction === 'darker' ? L : 1;
  let result = null;

  for (let i = 0; i < 40; i++) {   // 40 iterations → sub-0.001 precision
    const mid = (lo + hi) / 2;
    const { r, g, b: bv } = oklabToSrgb(mid, a, b);
    const hex = '#' + [r, g, bv].map(v => v.toString(16).padStart(2, '0')).join('');
    const rl  = contrastRatio(hex, lightBg);
    const rd  = contrastRatio(hex, darkBg);

    if (passesAA(rl) || passesAA(rd)) {
      result = hex;
      // Keep searching toward the original colour
      if (direction === 'darker') lo = mid;
      else hi = mid;
    } else {
      if (direction === 'darker') hi = mid;
      else lo = mid;
    }
  }

  return result;
}
```

**Key insight:** Searching both directions gives at most two results. To reach up to 5, generate results at ±0.01 and ±0.02 on the `a` channel before searching L. This produces up to 6 candidates; deduplicate by hex value and take the 5 closest by OKLab distance.

### Pattern 2: Pure Function + DOM Separation

**What:** `variant-search.js` exports only pure functions. All DOM access stays in the `app.js` DOM block (the existing `if (typeof document !== 'undefined')` guard).

**When to use:** Every time. This is the established pattern: `buildBadgeState`, `expandHex`, `formatRatio` are already pure and tested without JSDOM.

**Example:**
```javascript
// variant-search.js — no document, no window
export function findVariants(inputHex, count = 5) {
  // ... pure maths, returns array of { hex, distance } objects
}

// app.js DOM block — import and wire
import { findVariants } from './variant-search.js';
const findBtn = document.querySelector('#find-btn');
findBtn.addEventListener('click', () => { /* call findVariants, render swatches */ });
```

### Pattern 3: Swatch Click Reuses render()

**What:** The existing `render(hex)` function in app.js already updates both panels for a given hex. Swatch click calls `render(variantHex)` without touching the input field value.

**When to use:** For swatch clicks (D-08). Do not re-implement panel update logic.

```javascript
swatchBtn.addEventListener('click', () => {
  render(variantHex);  // existing function — updates CSS var + both panels
  // does NOT set hexInput.value
  updateSelectedSwatch(swatchBtn);
});
```

### Pattern 4: rgbToHex Helper

The `oklabToSrgb` return value is `{r, g, b}` integers. Convert to a hex string for display and for passing to `contrastRatio`:

```javascript
function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
```

### Anti-Patterns to Avoid

- **Binary search on HSL lightness:** HSL L is not perceptually uniform. The crossing point is not where you expect.
- **Brute-force RGB scan:** 16M candidates, too slow.
- **Mutating OKLab a and b widely:** Changes hue/chroma beyond a tiny range, breaking colour identity. Restrict a/b offsets to ≤ ±0.02.
- **Rounding contrast ratio before passesAA():** Already a documented pitfall. `#777777` on white = 4.478, which fails; rounding to 4.48 would pass. Never round.
- **Setting hexInput.value on swatch click:** Breaks D-08. Use `render()` but leave the input alone.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Colour space conversions | Custom sRGB→OKLab math | `srgbToOklab` / `oklabToSrgb` from colour-engine.js | Already correct, tested, handles linearisation threshold |
| Contrast ratio | Custom WCAG formula | `contrastRatio` + `passesAA` from colour-engine.js | Tested against #777777 edge case; float-safe |
| Perceptual distance | Custom metric | `oklabDistance` from colour-engine.js | Correct OKLab Euclidean; no reimplementation needed |
| Test runner | Custom harness | `node:test` | Zero deps, Node 24 built-in, already in use |

**Key insight:** The engine is the engine. Phase 3 adds product logic on top — "find me 5 of them" — not new colour maths.

---

## Common Pitfalls

### Pitfall 1: Search produces only one or two results

**What goes wrong:** Searching L toward darker and lighter gives at most two distinct colours. The requirement is up to 5.

**Why it happens:** Binary search converges to a single optimal point in each direction.

**How to avoid:** Before the L search, produce a small set of starting OKLab (a, b) offsets: `[0, +0.01, -0.01, +0.02, -0.02]`. For each, run both directions. Deduplicate by hex. Sort by OKLab distance from original. Take first 5. Because offsets are small, the variants remain recognisably the same hue.

**Warning signs:** `findVariants` always returns exactly 2 results regardless of input.

### Pitfall 2: oklabToSrgb produces out-of-gamut values

**What goes wrong:** Shifting L toward 0 or 1 can push the colour out of the sRGB gamut. The engine clamps r/g/b to 0–255, so the output hex is technically valid — but the actual rendered colour may shift hue noticeably.

**Why it happens:** OKLab is defined over all lightness values; sRGB is a bounded subset.

**How to avoid:** After `oklabToSrgb`, round-trip through `srgbToOklab` and compare the a/b channels. If |Δa| > 0.02 or |Δb| > 0.02, the colour has shifted significantly — discard that result. This is a mild gamut check without a full gamut-mapping algorithm.

**Warning signs:** Searching for a variant of a vivid red or vivid blue returns a result that visually looks more brown or grey than the original.

### Pitfall 3: Duplicate swatches

**What goes wrong:** Two search paths converge on the same hex (e.g., `#1E3D8F` from both `+0.01a` and `-0.01a`). Showing duplicates wastes swatch slots and looks like a bug.

**Why it happens:** Small a/b offsets produce nearly identical L search results after rounding.

**How to avoid:** Deduplicate the results array by uppercase hex value before sorting.

### Pitfall 4: Swatch click changes the input field

**What goes wrong:** Developer wires swatch click to also set `hexInput.value`, causing the input to show the variant hex and the live-typing handler to fire.

**Why it happens:** Natural instinct — the panels show the variant, so the input should too.

**How to avoid:** D-08 explicitly forbids this. Call `render(variantHex)` only. Clear selected swatch state when the user types a new hex (input `event` handler already fires on every keystroke — add selected-state clear there).

### Pitfall 5: Distance warning threshold too sensitive

**What goes wrong:** The warning fires on almost every search, even when the variant is visually very close to the original.

**Why it happens:** A threshold that is too small (e.g., 0.05) will warn on changes that are imperceptible to most people.

**How to avoid:** Use 0.12 as established in the UI-SPEC (D-06). In OKLab, 0.12 is approximately the distance between adjacent hue steps at the same lightness on a typical HSL wheel — noticeable but not dramatic. Anything below 0.12 is within acceptable perceptual closeness.

---

## Code Examples

### findVariants skeleton

```javascript
// variant-search.js
import {
  parseHex, srgbToOklab, oklabToSrgb,
  contrastRatio, passesAA, oklabDistance
} from './colour-engine.js';

const LIGHT_BG = '#ffffff';
const DARK_BG  = '#111111';
const DISTANCE_WARNING_THRESHOLD = 0.12;
const A_OFFSETS = [0, 0.01, -0.01, 0.02, -0.02];

/**
 * Find up to `count` accessible colour variants close to inputHex.
 * Returns an array of { hex, distance, distantWarning } objects,
 * sorted by ascending OKLab distance from the original.
 *
 * @param {string} inputHex - User's input, with or without #
 * @param {number} count - Maximum variants to return (default 5)
 * @returns {Array<{ hex: string, distance: number }> | null}
 */
export function findVariants(inputHex, count = 5) {
  const rgb = parseHex(inputHex);
  if (!rgb) return null;

  const origin = srgbToOklab(rgb.r, rgb.g, rgb.b);
  const candidates = new Map(); // hex -> distance

  for (const aOffset of A_OFFSETS) {
    const a = origin.a + aOffset;
    const b = origin.b;

    for (const direction of ['darker', 'lighter']) {
      const hex = searchL(origin.L, a, b, direction);
      if (!hex) continue;

      const resultRgb = parseHex(hex);
      const dist = oklabDistance(rgb, resultRgb);
      const key = hex.toUpperCase();
      if (!candidates.has(key) || candidates.get(key).distance > dist) {
        candidates.set(key, { hex: key, distance: dist });
      }
    }
  }

  const sorted = [...candidates.values()].sort((x, y) => x.distance - y.distance);
  return sorted.slice(0, count);
}

export const DISTANCE_WARNING = DISTANCE_WARNING_THRESHOLD;
```

### Converting {r,g,b} to hex string

```javascript
function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}
```

### HTML structure to add (per UI-SPEC)

```html
<!-- Inside .input-area, after the hex-label -->
<button type="button" id="find-btn" class="find-btn">
  Find accessible colour
</button>

<!-- After .panels, inside .container -->
<div id="swatch-row" class="swatch-row" hidden>
  <ul class="swatch-list" role="list" aria-label="Accessible colour variants">
    <!-- repeated per variant -->
    <li class="swatch-item">
      <button
        type="button"
        class="swatch-btn"
        aria-label="Variant #3B82F6 — click to preview"
        style="background: #3B82F6"
      ></button>
      <span class="swatch-hex" aria-hidden="true">#3B82F6</span>
    </li>
  </ul>
  <p id="distance-warning" class="distance-warning" hidden>
    <span class="distance-warning__prefix" aria-hidden="true">⚠</span>
    These variants are a long way from your original colour — no closer accessible shade exists.
  </p>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL lightness search | OKLCH/OKLab L search | 2020 (OKLab published) | Perceptually uniform; correct convergence |
| Brute-force sRGB scan | Binary search on L axis | Same | O(log n) vs O(16M) |
| 0.03928 linearisation threshold | 0.04045 (W3C correction) | May 2021 | #777777 correctly fails AA — critical for this tool |

---

## Environment Availability

Step 2.6: SKIPPED — phase is code/config changes only. No external tools, services, or CLIs beyond Node 24 (already confirmed: `node --version` → `v24.14.0`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (Node 24 built-in) |
| Config file | none — pass file path directly to `node --test` |
| Quick run command | `node --test test/variant-search.test.js` |
| Full suite command | `node --test test/colour-engine.test.js test/app.test.js test/variant-search.test.js` |

### Phase Requirements → Test Map

| Req ID | Behaviour | Test Type | Automated Command | File Exists? |
|--------|-----------|-----------|-------------------|-------------|
| VAR-01 | Button triggers search — DOM wiring only | manual/smoke | — (DOM) | N/A |
| VAR-02 | `findVariants` returns up to 5 AA-passing variants | unit | `node --test test/variant-search.test.js` | ❌ Wave 0 |
| VAR-03 | Swatch click updates panels — DOM wiring only | manual/smoke | — (DOM) | N/A |
| VAR-04 | Variants are perceptually close to input (distance < 0.12 unless unavoidable) | unit | `node --test test/variant-search.test.js` | ❌ Wave 0 |
| VAR-05 | `findVariants` includes `distantWarning` flag when nearest variant > 0.12 | unit | `node --test test/variant-search.test.js` | ❌ Wave 0 |

VAR-01 and VAR-03 are DOM integration — not testable without a browser or JSDOM. Smoke-test manually in browser after implementation.

### Sampling Rate

- **Per task commit:** `node --test test/variant-search.test.js`
- **Per wave merge:** `node --test test/colour-engine.test.js test/app.test.js test/variant-search.test.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/variant-search.test.js` — covers VAR-02, VAR-04, VAR-05

*(No gaps in colour-engine or app tests — both exist and are green.)*

---

## Open Questions

1. **Gamut-clipped results**
   - What we know: `oklabToSrgb` clamps out-of-gamut values; the resulting hex is always valid sRGB.
   - What's unclear: For extremely vivid inputs (saturated red, saturated blue), the nearest accessible variant found by L-axis search may look noticeably different due to clamping — even though the distance metric says it's close.
   - Recommendation: Add a round-trip gamut check (compare re-converted a/b channels). If |Δa| > 0.02 or |Δb| > 0.02, treat the result as if it triggers the distance warning. This is a low-risk polish step; document it in the plan but don't block on it.

2. **Dark panel background is #111111, not #000000**
   - What we know: `app.js` defines `DARK_BG = '#111111'`. The algorithm must use this same value when checking AA on the dark background, not #000000.
   - What's unclear: Nothing — the constant is clear. But it's easy to hardcode #000000 in the search module by mistake.
   - Recommendation: Export `LIGHT_BG` and `DARK_BG` from a shared constants location, or pass them as parameters to `findVariants`. The plan should make this explicit.

---

## Sources

### Primary (HIGH confidence)

- `colour-engine.js` (project) — full source read; all exports verified
- `app.js` (project) — full source read; `render()` function confirmed reusable
- `03-UI-SPEC.md` (project) — HTML structure, CSS tokens, distance threshold (0.12), copy
- `03-CONTEXT.md` (project) — locked decisions D-01 through D-09
- CLAUDE.md (project) — algorithm recommendation (OKLCH L binary search), tech stack constraints
- OKLab spec (Björn Ottosson): https://bottosson.github.io/posts/oklab/ — confirms L monotonicity
- `node --test test/colour-engine.test.js` — 35/35 pass on Node 24.14.0 (run this session)

### Secondary (MEDIUM confidence)

- CLAUDE.md "Find Nearest Accessible Colour Algorithm" section — OKLCH L binary search rationale; cross-references Ottosson spec

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are the project's own engine; no third-party choices needed
- Architecture: HIGH — direct reading of existing source; patterns are established, not speculative
- Pitfalls: HIGH — derived from reading actual engine code and the search algorithm logic; no speculation
- Search algorithm: HIGH — monotonicity of OKLab L vs WCAG luminance is mathematically guaranteed (both are monotone transforms of linear luminance)

**Research date:** 2026-04-12
**Valid until:** Stable — vanilla JS + OKLab spec; no fast-moving ecosystem concerns. Review if WCAG threshold constants change (very rare).
