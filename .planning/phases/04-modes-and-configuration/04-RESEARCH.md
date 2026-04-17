# Phase 4: Modes and Configuration - Research

**Researched:** 2026-04-17
**Domain:** Dual-colour variant pairing, inline background inputs, URL hash state sync
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Mode Scope**
- **D-01:** Dual-colour mode only. No single-colour mode, no toggle. App always shows dual-pair output.
- **D-02:** Phase 3's single-variant swatch row is fully replaced by dual-pair swatches. The existing `findVariants` / swatch rendering path retires or is repurposed.

**Dual-Mode Algorithm**
- **D-03:** Each result is a pair of hexes — one shade that passes AA on the light background, one shade that passes AA on the dark background, both close to the input colour and to each other.
- **D-04:** Claude's Discretion: the exact pairing algorithm. Likely extension of Phase 3's OKLCH lightness binary search — search both directions (darker for light-BG pass, lighter for dark-BG pass) from the input, then pair closest results. Perceptual distance between the two shades in a pair should be minimised.

**Dual Result Display**
- **D-05:** Paired swatches — each result is two joined swatches side-by-side, light-BG shade then dark-BG shade, as one clickable unit. ~5 pairs in a horizontal row below the panels (same location as Phase 3's swatch row).
- **D-06:** Both hex values shown per pair (e.g. `#2F6FE8 / #4E85F0`). User needs both.
- **D-07:** Clicking a pair previews the light panel with the light-BG shade and the dark panel with the dark-BG shade. Each panel uses the shade intended for it.
- **D-08:** Carry forward from Phase 3: clicking a pair does NOT update the hex input. Selected pair gets a visible ring/border. Distance warning still applies when closest pair is far from original.

**Custom Background Inputs**
- **D-09:** Inline on each panel — small hex input at top of each panel showing that panel's background colour. Label: "Background". Direct, no collapse/reveal.
- **D-10:** Default light BG: `#ffffff`. Default dark BG: `#000000` (per CFG-02 requirement). Current hardcoded `#111111` in `app.js` and `variant-search.js` must be updated.
- **D-11:** Invalid BG hex uses the same pattern as the main input (Phase 2 D-09): red border, inline error, panels keep last valid BG.
- **D-12:** BG changes live-update panel contrast ratios and badges. BG changes clear existing pair swatches (swatches depend on old BGs — user re-clicks Find for new pairs). Consistent with Phase 3 D-01 manual-trigger rule.

**URL State**
- **D-13:** URL carries full state: foreground hex, light BG, dark BG — in that order. Format: hash path `/#/2563eb/ffffff/000000`. Hash path chosen over true path routing because this is a static site.
- **D-14:** URL updates debounced ~300ms after any valid input change. Use `history.replaceState` to avoid history spam.
- **D-15:** On page load, hydrate foreground hex and both BGs from URL. Do NOT auto-run Find — user clicks to see pairs.
- **D-16:** Hexes in URL are lowercase without `#`. All three values present even when at defaults.

### Claude's Discretion

- Exact dual-pair algorithm (extension of OKLCH search is recommended)
- Visual style of paired swatches (hairline divider, shared border, slight gap)
- Hex label formatting within a pair
- Exact debounce timing for URL sync
- How distance warning wording adjusts for pair distance

### Deferred Ideas (OUT OF SCOPE)

- Single-colour mode (MODE-01, MODE-03) — dropped entirely, remove from REQUIREMENTS.md at phase transition
- Share button / copy-link affordance — URL always in sync
- Colour picker / RGB/HSL input modes — v2 per REQUIREMENTS.md (INP-05, INP-06)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support | In Scope? |
|----|-------------|------------------|-----------|
| MODE-01 | Single-colour mode (AA on both BGs) | N/A | DROPPED per D-01 |
| MODE-02 | Dual-colour mode (two close shades, one per BG) | Dual-pair algorithm extends Phase 3 binary search | YES |
| MODE-03 | Toggle between modes | N/A | DROPPED per D-01 |
| CFG-01 | Inline hex input for light BG (default #ffffff) | Panel-scoped input, reuses Phase 2 validation pattern | YES |
| CFG-02 | Inline hex input for dark BG (default #000000) | Panel-scoped input, updates hardcoded `#111111` to `#000000` | YES |
| CFG-03 | Hex stored in URL for shareable links | `location.hash` + `history.replaceState`, debounced 300ms | YES |

**Scope change:** REQUIREMENTS.md MUST be updated at phase transition to mark MODE-01 and MODE-03 as DROPPED (not Pending).
</phase_requirements>

## Summary

Phase 4 replaces Phase 3's single-variant output with dual-pair output (one shade per background), adds inline background hex inputs on each panel, and persists full state in the URL hash. No mode toggle — dual-only per user pivot.

All three concerns build on existing Phase 1-3 foundations. The dual-pair algorithm extends `searchL` to run per-background (search darker direction targeting light-BG pass; search lighter direction targeting dark-BG pass) and pair the closest results per `a`-offset. Background inputs reuse Phase 2's hex validation pattern (`parseHex` + red border + `aria-invalid` + keep-last-valid). URL sync uses `location.hash` with path-style segments for robustness across static hosts.

**Primary recommendation:** Refactor `searchL`'s pass condition from "passes either BG" to a per-target-BG check, pass BG values as parameters (remove hardcoded constants), emit pairs directly from `findVariants` (rename to `findVariantPairs` or similar), add a small `url-state.js` module with pure `parseHashState` / `buildHashPath` for testability.

## Standard Stack

### Core

No new dependencies. Vanilla HTML/CSS/JS only per project constraint.

| API | Purpose | Why Standard |
|-----|---------|--------------|
| `window.location.hash` | Read URL hash on load | Native, works on any static host including `file://` |
| `history.replaceState` | Write URL without history spam | Standard since HTML5, no polyfill needed |
| `setTimeout` / `clearTimeout` | Debounce URL writes | Simplest debounce, no library |
| `addEventListener('hashchange')` | Detect external hash changes (optional) | Not strictly required per D-15 (no auto-run) |

### Supporting

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `node:test` | Unit test pure logic | Per-project convention (Phase 1-3) |
| ES modules | Reusable pure functions | Per-project convention |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hash path `#/fg/lightBg/darkBg` | Query string `?fg=&lightBg=&darkBg=` | Query string cleaner but user picked hash (D-13) for path aesthetic + static-host robustness |
| Debounced `replaceState` | `pushState` per change | `pushState` spams back button — D-14 explicitly picks `replaceState` |
| Native `URLPattern` | Manual split | `URLPattern` not needed for 3-segment hash; manual split is 1 line |

**Installation:** None — zero dependencies.

## Architecture Patterns

### Recommended Project Structure

```
wcag-colour-finder/
├── colour-engine.js       # UNCHANGED — pure maths
├── variant-search.js      # MODIFIED — dual-pair output, BG params
├── url-state.js           # NEW — parseHashState, buildHashPath
├── app.js                 # MODIFIED — BG inputs, URL sync, pair rendering
├── index.html             # MODIFIED — BG inputs inside each panel
├── style.css              # MODIFIED — BG input styles, paired swatch styles
└── test/
    ├── colour-engine.test.js  # UNCHANGED
    ├── variant-search.test.js # MODIFIED — dual-pair contract
    ├── url-state.test.js      # NEW
    └── app.test.js            # MODIFIED — any new pure helpers
```

### Pattern 1: Pure URL State Module

Extract URL parsing/building into pure functions for testability. No DOM, no `window`.

```javascript
// url-state.js
const HEX6 = /^[0-9a-fA-F]{6}$/;

/**
 * Parse a hash path like "#/2563eb/ffffff/000000" into state.
 * Returns null if any segment is missing or invalid.
 */
export function parseHashState(hash) {
  if (typeof hash !== 'string') return null;
  const trimmed = hash.replace(/^#\/?/, '').replace(/\/$/, '');
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
 */
export function buildHashPath({ fg, lightBg, darkBg }) {
  return `#/${fg.toLowerCase()}/${lightBg.toLowerCase()}/${darkBg.toLowerCase()}`;
}
```

### Pattern 2: Debounced URL Write

One shared timer. Clear on every input. Write on timeout expiry.

```javascript
// Inside app.js DOM guard
let urlSyncTimer = null;
function scheduleUrlSync() {
  if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
  urlSyncTimer = setTimeout(() => {
    const hash = buildHashPath({
      fg: lastValidHex,
      lightBg: lastValidLightBg.slice(1),
      darkBg: lastValidDarkBg.slice(1),
    });
    history.replaceState(null, '', hash);
    urlSyncTimer = null;
  }, 300);
}
```

### Pattern 3: Dual-Pair Search

Split `searchL`'s pass condition. One direction searches for light-BG pass; the other for dark-BG pass. Pair results sharing the same `a/b` channel offset.

```javascript
// variant-search.js — extended
function searchLForBg(L, a, b, direction, bgHex) {
  // Same binary search structure, but pass condition is
  // only "passes AA against bgHex" (not either-or).
  // Returns hex or null.
}

export function findVariantPairs(inputHex, lightBg, darkBg, count = 5) {
  const rgb = parseHex(inputHex);
  if (!rgb) return null;
  const origin = srgbToOklab(rgb.r, rgb.g, rgb.b);
  const pairs = [];
  for (const aOffset of A_OFFSETS) {
    const a = origin.a + aOffset;
    const b = origin.b;
    // Light BG typically needs a darker foreground.
    // Dark BG typically needs a lighter foreground.
    const lightShade = searchLForBg(origin.L, a, b, 'darker', lightBg);
    const darkShade  = searchLForBg(origin.L, a, b, 'lighter', darkBg);
    if (!lightShade || !darkShade) continue;
    const lightDist = oklabDistance(rgb, parseHex(lightShade));
    const darkDist  = oklabDistance(rgb, parseHex(darkShade));
    const pairDist  = Math.max(lightDist, darkDist); // both must be close
    pairs.push({ lightHex: lightShade, darkHex: darkShade, distance: pairDist });
  }
  // Dedupe by (lightHex + darkHex) pair, sort by distance, slice count
  // ...
}
```

**Note (Claude's Discretion per D-04):** For very light or very dark input colours, one direction may not cross the threshold. For those cases, both shades may come from the same direction (e.g. for a near-white input, both the light-BG and dark-BG passing shades lie in the darker direction). Handle gracefully — if `searchLForBg` returns null for one side, skip that candidate pair.

### Pattern 4: CSS Custom Properties for BGs

Extend the existing `--user-colour` pattern. Panels already read from `--light-bg` and `--dark-bg` (style.css lines 8-9). Update these from JS on BG input change.

```javascript
function applyLightBg(hex) {
  document.documentElement.style.setProperty('--light-bg', hex);
}
```

### Anti-Patterns to Avoid

- **Do not** put URL logic inside `findVariantPairs` — keep search pure, stateless, testable.
- **Do not** use `pushState` per keystroke — back button becomes unusable.
- **Do not** auto-run Find on hash load (D-15) — breaks the manual-trigger pattern from Phase 3.
- **Do not** swallow invalid hash silently without fallback — fall back to defaults (fg `2563eb`, lightBg `ffffff`, darkBg `000000`) if `parseHashState` returns null.
- **Do not** regex-parse the full hash inline — use a pure module for testability.
- **Do not** duplicate BG constants between `app.js` and `variant-search.js` — `findVariantPairs` takes BGs as parameters (removes the STATE.md-noted duplication).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex validation for BG inputs | Custom regex | Existing `parseHex` from `colour-engine.js` | Already handles 3/6 digit, # prefix, case |
| Contrast calc for new BGs | Custom formula | Existing `contrastRatio` | Already handles BG parameter (inspect: `contrastRatio('#2563EB', '#ffffff')`) |
| Debounce | `lodash.debounce` or library | 3 lines of `setTimeout` | Single use case, zero deps rule |
| URL routing | `wouter`, `page.js` | Raw `location.hash` | 3-segment path, static site, no SPA routing needed |
| Copy-to-clipboard | Custom button | Not requested (deferred idea) | URL auto-syncs; user copies from address bar |

**Key insight:** Everything needed is either in the stdlib (`history`, `location`, `setTimeout`) or already in the codebase (`parseHex`, `contrastRatio`, binary search skeleton).

## Common Pitfalls

### Pitfall 1: Hash Parsing Case Sensitivity

**What goes wrong:** Users share a URL with uppercase hex (e.g. `#/2563EB/FFFFFF/000000`); parser rejects it or produces a different state than the intent.

**Why it happens:** Strict case match in regex or comparison.

**How to avoid:** Normalise to lowercase after validation. `HEX6` regex in `parseHashState` above accepts both cases; `toLowerCase()` after.

**Warning signs:** Tests pass with default lowercase but fail with typed uppercase hex.

### Pitfall 2: Debounce Not Cleared on Unmount

**What goes wrong:** A pending `setTimeout` writes state after it's no longer relevant (e.g. user navigated away or typed a new value during the delay).

**Why it happens:** Single-shared timer not cleared before new schedule.

**How to avoid:** Always `clearTimeout(urlSyncTimer)` before `setTimeout`. Single module-scoped timer variable.

**Warning signs:** URL appears to lag behind input by ~300ms on rapid typing (this is expected); URL races ahead/behind on exotic paths (this is a bug).

### Pitfall 3: `replaceState` With Relative URL

**What goes wrong:** `history.replaceState(null, '', '#/...')` works. But `history.replaceState(null, '', '/...')` on `file://` fails or throws on some browsers.

**Why it happens:** `replaceState` requires same-origin. Hash-only changes are always same-origin; path changes on `file://` are not.

**How to avoid:** Always prefix with `#`. The hash path format `#/fg/lightBg/darkBg` guarantees hash-only change.

**Warning signs:** `SecurityError` in console when opened via `file://`.

### Pitfall 4: BG Change Leaves Stale Swatches

**What goes wrong:** User clicks Find, sees 5 pairs, then changes the dark BG. Panels update but the old pairs are still shown — clicking one now previews shades that no longer pass on the new BG.

**Why it happens:** Swatches cache results from an earlier BG state.

**How to avoid (D-12):** Any BG change clears `#swatch-row` (set `hidden`, empty `swatch-list`). User must re-click Find. Mirrors Phase 3's rule that hex input changes also invalidate swatches.

**Warning signs:** Swatch pair hex values persist across BG changes.

### Pitfall 5: Default Dark BG Drift

**What goes wrong:** `DARK_BG = '#111111'` in two files. Phase 4 updates one, misses the other. Tests still pass against `#111111`.

**Why it happens:** Duplicated constants.

**How to avoid:** Remove the constant from `variant-search.js` — pass BG as a parameter to `findVariantPairs`. Remove from `app.js` — default state value lives in app.js only, sourced from `url-state.js` or inline const. Single source of truth.

**Warning signs:** Tests still pass `#111111` explicitly; grep for `#111111` returns unexpected matches after refactor.

### Pitfall 6: Input `type="color"` Native Picker Leaks

**What goes wrong:** Using `<input type="color">` for BG inputs opens a native picker that does not match the minimal UI theme.

**Why it happens:** Following an instinct to use native APIs.

**How to avoid:** Use `<input type="text">` matching the main hex input pattern. A native picker is explicitly deferred (INP-06, v2).

**Warning signs:** Colour picker UI appearing in v1.

### Pitfall 7: Hash Change Round-Trip Loop

**What goes wrong:** Writing to `location.hash` fires `hashchange`. If a listener re-reads and re-writes, infinite loop.

**Why it happens:** Coupling input → URL write → `hashchange` → input restore → URL write.

**How to avoid:** Use `history.replaceState` (does NOT fire `hashchange`). Do not add a `hashchange` listener unless you need to react to user-initiated URL edits — and if you do, guard against self-triggered changes.

**Warning signs:** CPU pegged, URL flicker in address bar.

## Code Examples

### Reading State on Load

```javascript
// app.js — DOM guard
import { parseHashState, buildHashPath } from './url-state.js';

const DEFAULTS = { fg: '2563eb', lightBg: 'ffffff', darkBg: '000000' };

function loadInitialState() {
  const parsed = parseHashState(window.location.hash);
  return parsed ?? DEFAULTS;
}

document.addEventListener('DOMContentLoaded', () => {
  const state = loadInitialState();
  hexInput.value = state.fg.toUpperCase();
  lightBgInput.value = state.lightBg.toUpperCase();
  darkBgInput.value = state.darkBg.toUpperCase();
  applyLightBg('#' + state.lightBg);
  applyDarkBg('#' + state.darkBg);
  render(state.fg.toUpperCase()); // D-15: render, but do NOT auto-run Find
});
```

### Pair Swatch Rendering (Paired Button Unit)

```javascript
function renderPairs(pairs) {
  swatchList.innerHTML = '';
  for (const p of pairs) {
    const li = document.createElement('li');
    li.className = 'swatch-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch-pair';
    btn.setAttribute('aria-label',
      `Variant pair ${p.lightHex} on light, ${p.darkHex} on dark — click to preview`);

    // Two visual halves inside one button
    const lightHalf = document.createElement('span');
    lightHalf.className = 'swatch-pair__half swatch-pair__half--light';
    lightHalf.style.background = p.lightHex;

    const darkHalf = document.createElement('span');
    darkHalf.className = 'swatch-pair__half swatch-pair__half--dark';
    darkHalf.style.background = p.darkHex;

    btn.appendChild(lightHalf);
    btn.appendChild(darkHalf);

    btn.addEventListener('click', () => {
      // D-07: each panel uses its own shade
      renderPanel(lightPanel, p.lightHex, currentLightBg);
      renderPanel(darkPanel, p.darkHex, currentDarkBg);
      clearSelectedSwatch();
      btn.classList.add('swatch-pair--selected');
    });

    const label = document.createElement('span');
    label.className = 'swatch-pair-hex';
    label.textContent = `${p.lightHex} / ${p.darkHex}`;

    li.appendChild(btn);
    li.appendChild(label);
    swatchList.appendChild(li);
  }

  swatchRow.hidden = false;
}
```

### BG Input Event Handler

```javascript
lightBgInput.addEventListener('input', () => {
  const raw = lightBgInput.value.trim();
  const parsed = parseHex(raw);
  if (parsed !== null) {
    lastValidLightBg = '#' + expandHex(raw.replace(/^#/, '')).toLowerCase();
    setBgErrorState(lightBgInput, lightBgError, false);
    applyLightBg(lastValidLightBg);
    renderLightPanel(lastValidHex, lastValidLightBg); // D-12 live update
    clearPairs(); // D-12 stale-swatch rule
    scheduleUrlSync();
  } else {
    setBgErrorState(lightBgInput, lightBgError, true);
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `hashchange` listener as primary | `history.replaceState` (no event) | HTML5 History API mature since ~2012 | Smoother UX, no flicker |
| Query string with library | Raw hash path + pure parser | Always fine for simple static sites | Zero deps, testable |
| `pushState` per input | Debounced `replaceState` | Same | Back button stays usable |
| MutationObserver for URL sync | Direct call in handler | Same | Simpler, no async surprises |

**No deprecations in this domain.** `history.replaceState` and `location.hash` are stable.

## Open Questions

1. **Pair algorithm convergence for edge inputs (e.g. saturated yellow `#FFFF00`)**
   - What we know: Phase 3's search handles this by searching both directions; D-04 gives Claude discretion.
   - What's unclear: Whether some inputs produce no valid pair (e.g. input already passes both — return input itself twice? Return the closest AA-passing pair anyway?).
   - Recommendation: If input already passes AA on both BGs, return `{ lightHex: input, darkHex: input, distance: 0 }` as the first result, then generate variants for alternatives.

2. **Visual style of paired swatches (D-05 Claude's Discretion)**
   - What we know: Two joined swatches, one clickable unit, hex pair label below.
   - What's unclear: Hairline divider vs slight gap vs shared border.
   - Recommendation: Shared button with 1px white/grey divider between halves. 48px total width split 24/24, matching Phase 3's 48px swatch size. Ring-highlight on the outer button element.

3. **Distance metric for pairs (D-04)**
   - What we know: Both shades should be close to input and to each other.
   - What's unclear: Should `distance` be `max(distLight, distDark)`, `avg`, or include pair-internal distance?
   - Recommendation: `max(distLight, distDark)` for warning threshold (conservative — warn if either shade is far). Sort by the same metric. Leaves room for future refinement.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (test runner) | `node:test` | ✓ (Phase 1 established) | 24.x | — |
| Modern browser | `history.replaceState`, ES modules | ✓ (project constraint) | Any evergreen | — |
| `file://` support for hash | Static-host robustness (D-13) | ✓ | — | — |

No external services or runtimes beyond what Phase 1-3 already use.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in, Node 24) |
| Config file | None — uses `node --test` discovery |
| Quick run command | `node --test test/url-state.test.js` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODE-02 | `findVariantPairs` returns pairs with `lightHex`, `darkHex`, `distance` | unit | `node --test test/variant-search.test.js` | UPDATE |
| MODE-02 | Each pair's `lightHex` passes AA on supplied light BG | unit | same | UPDATE |
| MODE-02 | Each pair's `darkHex` passes AA on supplied dark BG | unit | same | UPDATE |
| MODE-02 | Pairs sorted by ascending `distance` | unit | same | UPDATE |
| MODE-02 | BG parameters respected (passing `#FFFFFF`/`#000000` vs `#FFFFFF`/`#111111` gives different results) | unit | same | NEW |
| CFG-01 | `parseHex` accepts valid BG hex (covered by Phase 1 tests) | unit | `node --test test/colour-engine.test.js` | EXISTS |
| CFG-02 | Default dark BG in app is `#000000` (not `#111111`) | manual smoke | browser smoke | MANUAL |
| CFG-03 | `parseHashState('#/2563eb/ffffff/000000')` returns `{fg, lightBg, darkBg}` | unit | `node --test test/url-state.test.js` | NEW |
| CFG-03 | `parseHashState` returns null for invalid/partial hash | unit | same | NEW |
| CFG-03 | `buildHashPath({fg, lightBg, darkBg})` round-trips with `parseHashState` | unit | same | NEW |
| CFG-03 | `buildHashPath` lowercases + strips `#` (D-16) | unit | same | NEW |
| CFG-03 | URL updates on input (debounced) | manual smoke | browser smoke | MANUAL |
| CFG-03 | Page load from URL hydrates state without auto-Find (D-15) | manual smoke | browser smoke | MANUAL |
| D-12 | Changing BG clears pair swatches | manual smoke | browser smoke | MANUAL |
| D-11 | Invalid BG shows red border, keeps last valid | manual smoke | browser smoke | MANUAL |

### Sampling Rate

- **Per task commit:** `node --test test/url-state.test.js` (fastest — new module only)
- **Per wave merge:** `node --test test/` (full suite)
- **Phase gate:** Full suite green + manual smoke checklist before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/url-state.test.js` — covers CFG-03 pure logic (parse/build round-trip, invalid inputs, case handling)
- [ ] Update `test/variant-search.test.js` — replace single-variant contract with pair contract for MODE-02; update hardcoded `#111111` references to parameterised BGs
- [ ] Remove hardcoded `DARK_BG = '#111111'` from `variant-search.js` at the same time tests are updated (coupled change)

## Project Constraints (from CLAUDE.md)

Directives the planner MUST honor:

- **Tech stack:** Vanilla HTML/CSS/JS. No frameworks, no build tools, no dependencies. Phase 4 adds zero deps.
- **Compatibility:** Modern browsers only. No IE polyfills.
- **Accessibility:** The tool itself must be accessible — BG inputs need labels, `aria-invalid`, `aria-live` error messages (extend Phase 2 pattern).
- **Performance:** All calcs client-side, instant feedback. Debounce only for URL writes (300ms), not for preview updates.
- **Code spelling:** American (color, ratio) in identifiers. British (colour) in UI text.
- **WCAG algorithm:** Use existing `colour-engine.js` primitives (`contrastRatio`, `passesAA`). Do not reimplement.
- **Colour space:** OKLab/OKLCH for perceptual distance (already in `colour-engine.js`).
- **No WCAG 3.0 / APCA:** v1 is WCAG 2.1 only.
- **No HSL, RGB Euclidean, or brute-force sRGB search.**
- **GSD workflow:** File edits only through planned phase work.
- **Pure function extraction pattern:** Export pure logic above DOM guard in `app.js`; put reusable pure modules in their own files. `node:test` tests pure logic without JSDOM.
- **`null` return for invalid input** (Phase 1 convention).

## Sources

### Primary (HIGH confidence)

- MDN `History.replaceState()` — https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
- MDN `Window.location` `hash` — https://developer.mozilla.org/en-US/docs/Web/API/Location/hash
- WCAG 2.1 relative luminance — https://www.w3.org/TR/WCAG21/relative-luminance.html (already used by `colour-engine.js`)
- Project CLAUDE.md — stack constraints, algorithm rationale
- Phase 1-3 context files — conventions, reusable code

### Secondary (MEDIUM confidence)

- Existing codebase: `app.js`, `variant-search.js`, `style.css`, `index.html`, test files — all read directly
- Phase 3 CONTEXT.md — manual-trigger pattern, swatch selection pattern

### Tertiary (LOW confidence)

- None — all research grounded in existing code or MDN.

## Metadata

**Confidence breakdown:**

- Dual-pair algorithm: HIGH — extends existing, tested `searchL` with a well-scoped change (pass condition + BG param).
- URL hash state: HIGH — standard HTML5 History API, decades of browser support.
- Inline BG inputs: HIGH — reuses established Phase 2 validation pattern.
- Pair visual design: MEDIUM — Claude's Discretion area; recommendation given but final look is a planning-time choice.
- Edge-case input behaviour (already-passing input, saturated yellow): MEDIUM — flagged as Open Question 1.

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable web APIs, low-churn domain)
