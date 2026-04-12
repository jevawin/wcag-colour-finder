# Phase 2: Live Preview UI - Research

**Researched:** 2026-04-12
**Domain:** Vanilla HTML/CSS/JS — live DOM updates, contenteditable, CSS custom properties, WCAG badge display
**Confidence:** HIGH

## Summary

This phase is a pure vanilla HTML/CSS/JS build with no framework, no build step, and no external libraries. The colour engine from Phase 1 (`colour-engine.js`) provides all maths — the UI layer only needs to import and call it. The key technical challenges are: live hex input validation and DOM updates on each keystroke, CSS custom property approach to propagate the user's colour into panels, `contenteditable` heading and paragraph samples, and a two-row badge layout per panel.

The UI design contract is fully specified in `02-UI-SPEC.md`. All spacing, typography, colour values, copy, and accessibility requirements are already locked. Research focus here is the implementation mechanics: event handling patterns, CSS architecture, file organisation, and test strategy.

**Primary recommendation:** Single `index.html` with external `style.css` and `app.js` imported as an ES module. App state is one string (the current valid hex). All DOM updates happen in a single `render(hex)` function called from the `input` event handler.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Side-by-side panels — light (left), dark (right). Equal width.
- **D-02:** Centred hex input above the panels, prominent and obvious.
- **D-03:** Max-width container (~1200px), centred on page. Not full bleed.
- **D-04:** Compact row below the text samples in each panel. Format: ratio number + inline AA/AAA badges (e.g. "4.52:1 Pass AA Fail AAA").
- **D-05:** Normal text badges have primary visual weight. Large text badges shown smaller or secondary.
- **D-06:** Default text is realistic UI copy ("The quick brown fox" heading, a short readable paragraph). Not lorem ipsum.
- **D-07:** Click-to-edit uses `contenteditable` — native in-place editing, no modal or separate input field.
- **D-08:** Live as-you-type updates — panels update on every keystroke once input is valid hex. Invalid input triggers error state without updating panels.
- **D-09:** Error state: red border on input + inline message below. Panels keep showing last valid colour.
- **D-10:** Static non-editable `#` prefix before the input field. User types "2563EB", sees "#2563EB".

### Claude's Discretion

- Responsive breakpoint for panel stacking on narrow screens (768px chosen in UI-SPEC)
- Exact sample text wording (specified in UI-SPEC)
- Badge icon/text treatment (text labels chosen in UI-SPEC)
- Exact error message copy (specified in UI-SPEC)
- File organisation (single HTML file vs separate CSS/JS files)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INP-01 | User can enter a hex colour code (3 or 6 digit, with or without #) | `parseHex` in colour-engine.js handles all four formats. Input is `maxlength="6"` (no `#`), engine strips the `#` anyway. |
| INP-02 | Hex input validates strictly — rejects invalid characters, shows error state | `parseHex` returns `null` for any invalid input. Check on `input` event: `null` → show error, don't update panels. |
| INP-03 | Default colour #2563EB loads on first visit | Set `input.value = '2563EB'` and call `render('2563EB')` on `DOMContentLoaded`. |
| INP-04 | User's hex becomes the text colour on both light and dark panels | Set `document.documentElement.style.setProperty('--user-colour', '#' + hex)`. CSS targets `.sample-text { color: var(--user-colour); }`. |
| CON-01 | Live contrast ratio displayed per panel, updates as colour changes | `contrastRatio(userHex, '#ffffff')` and `contrastRatio(userHex, '#111111')`. Display as `ratio.toFixed(2) + ':1'`. |
| CON-02 | AA pass/fail badge for normal text (4.5:1 threshold) per panel | `passesAA(ratio)` → render Pass/Fail badge. |
| CON-03 | AAA pass/fail badge for normal text (7:1 threshold) per panel | `passesAAA(ratio)` → render Pass/Fail badge. |
| CON-04 | AA pass/fail badge for large text (3:1 threshold) per panel | `passesAALarge(ratio)` → render Pass/Fail badge. |
| CON-05 | AAA pass/fail badge for large text (4.5:1 threshold) per panel | `passesAAALarge(ratio)` → render Pass/Fail badge. |
| PNL-01 | Split-screen layout — light background (left), dark background (right) | CSS flexbox on `.panels-container`, two `.panel` children at `flex: 1`. |
| PNL-02 | Real UI text samples shown in the chosen colour (heading + paragraph) | `<h2 contenteditable="true">` and `<p contenteditable="true">` styled with `color: var(--user-colour)`. |
| PNL-03 | User can click to edit the text sample content directly | `contenteditable="true"` on both elements. No JS required beyond styling focus state. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Vanilla HTML/CSS/JS only — no frameworks, no build tools, no dependencies
- **Performance:** All calculations client-side, instant feedback on input
- **Compatibility:** Modern browsers (no IE support)
- **Code identifiers:** American spelling (`color` in variable/property names)
- **UI text:** British spelling ("colour")
- **ES modules:** `export`/`import` with `type="module"`
- **Null returns:** `parseHex` returns `null` on bad input — UI handles display, never pass invalid input to engine functions
- **No rounding before threshold checks:** Pass raw `contrastRatio` float to `passesAA` etc.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| colour-engine.js | Phase 1 output | All colour maths | Already exists, tested, purpose-built |
| Vanilla HTML5 | — | Document structure | Project constraint, no framework |
| CSS3 (custom properties) | — | Live colour propagation | Native, zero-cost, instant |
| ES modules (native) | — | JS file organisation | Established in Phase 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Node 24 built-in | Tests for app.js logic | Any pure JS logic worth unit testing |

No npm packages. No CDN imports. This is the full stack.

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure

```
/
├── index.html          # document structure, imports style.css and app.js
├── style.css           # all visual styles, CSS custom properties
├── app.js              # event handling, DOM updates, imports colour-engine.js
├── colour-engine.js    # Phase 1 — no changes
└── test/
    ├── colour-engine.test.js   # Phase 1 — existing
    └── app.test.js             # Phase 2 — pure-logic tests for app.js helpers
```

**Rationale for separate files over a single HTML file:** separating CSS and JS makes each file focused and easy to navigate. The Phase 1 convention (separate `colour-engine.js`) already set this pattern. Single HTML file is acceptable but harder to test and maintain.

### Pattern 1: CSS Custom Property for Live Colour

**What:** Set `--user-colour` on `:root` whenever the valid hex changes. Panel sample text reads it via `color: var(--user-colour)`.

**When to use:** Any time the user's colour must flow into rendered elements. Do not build string-replace functions over the DOM — one property update touches everything.

```css
/* style.css */
:root {
  --user-colour: #2563eb;
}

.sample-text {
  color: var(--user-colour);
}
```

```js
// app.js — called from render()
function applyColor(hex) {
  document.documentElement.style.setProperty('--user-colour', '#' + hex);
}
```

**Source:** MDN CSS Custom Properties (HIGH confidence — native browser feature, widely documented)

### Pattern 2: Single render() Function

**What:** All DOM mutations for a colour change go through one `render(hex)` function. The input event handler validates, then calls `render` if valid or enters error state if not.

**When to use:** Any time multiple DOM nodes depend on the same piece of state.

```js
// app.js
import { contrastRatio, passesAA, passesAAA, passesAALarge, passesAAALarge } from './colour-engine.js';

const LIGHT_BG = '#ffffff';
const DARK_BG  = '#111111';

function render(hex) {
  applyColor(hex);

  const ratioLight = contrastRatio('#' + hex, LIGHT_BG);
  const ratioDark  = contrastRatio('#' + hex, DARK_BG);

  updatePanel(lightPanel, ratioLight);
  updatePanel(darkPanel, ratioDark);
}

function updatePanel(panelEl, ratio) {
  panelEl.querySelector('.ratio').textContent = ratio.toFixed(2) + ':1';
  setBadge(panelEl, '.badge-aa',      passesAA(ratio));
  setBadge(panelEl, '.badge-aaa',     passesAAA(ratio));
  setBadge(panelEl, '.badge-aa-lg',   passesAALarge(ratio));
  setBadge(panelEl, '.badge-aaa-lg',  passesAAALarge(ratio));
}

function setBadge(root, selector, passes) {
  const el = root.querySelector(selector);
  el.textContent = passes ? 'Pass' : 'Fail';
  el.classList.toggle('badge--pass', passes);
  el.classList.toggle('badge--fail', !passes);
}
```

### Pattern 3: Input Validation on `input` Event

**What:** Listen on `input` event (fires on every keystroke). `parseHex` returns `null` for bad input. Track `lastValidHex` so panels stay at last good colour when input turns invalid.

```js
// app.js
let lastValidHex = '2563EB';

hexInput.addEventListener('input', () => {
  const raw = hexInput.value.trim();
  const parsed = parseHex(raw); // accepts 3 or 6 digit, with or without #

  if (parsed) {
    // Normalise to 6-digit uppercase for display consistency
    const hex = hexInput.value.replace(/^#/, '').padStart(6, '0').toUpperCase();
    lastValidHex = hex;
    setErrorState(false);
    render(hex);
  } else {
    setErrorState(true);
    // panels keep showing lastValidHex — do not call render()
  }
});

function setErrorState(isError) {
  hexInput.setAttribute('aria-invalid', isError ? 'true' : 'false');
  hexInput.classList.toggle('input--error', isError);
  errorMsg.hidden = !isError;
}
```

**Note:** The input has `maxlength="6"` and the user types without `#`. `parseHex` can handle input with or without `#` — the `#` prefix is just a static label element.

### Pattern 4: contenteditable Sample Text

**What:** `<h2 contenteditable="true">` and `<p contenteditable="true">` styled with `color: var(--user-colour)`. No JS interaction needed for editing — browsers handle it natively.

**When to use:** Any in-place text editing that does not need to persist or validate.

```html
<h2 contenteditable="true" 
    aria-label="Editable heading — light panel"
    class="sample-heading">The quick brown fox</h2>
<p contenteditable="true" 
   aria-label="Editable paragraph — light panel"
   class="sample-para">Designers and developers use accessible colours so everyone can read content clearly, regardless of ability or context.</p>
```

```css
.sample-heading,
.sample-para {
  color: var(--user-colour);
}

.sample-heading:focus,
.sample-para:focus {
  outline: 2px dashed var(--user-colour);
  outline-offset: 2px;
  opacity: 0.5; /* applied to outline via box-shadow trick or pseudo — see pitfall below */
}
```

**Pitfall:** `opacity: 0.5` on the element itself fades the text too. Use `outline-color: color-mix(in srgb, var(--user-colour) 50%, transparent)` or a `box-shadow` workaround to achieve the 50% opacity outline without affecting text. `color-mix()` has 90%+ browser support in 2025. (MEDIUM confidence — verify with caniuse.com if IE-era browsers matter; they don't per CLAUDE.md.)

### Pattern 5: aria-live for Error Message

**What:** The error message container is always in the DOM but `hidden`. It uses `aria-live="polite"` so screen readers announce it when it appears.

```html
<span id="hex-error" aria-live="polite" hidden>Enter a valid hex colour</span>
```

```js
// Show: errorMsg.hidden = false;
// Hide: errorMsg.hidden = true;
```

**Source:** WCAG technique ARIA19, MDN aria-live (HIGH confidence)

### Anti-Patterns to Avoid

- **String-building HTML in JS:** Don't use `innerHTML` for badge updates — select elements and set `textContent`. Avoids XSS surface and re-creating elements.
- **Re-creating DOM on every keystroke:** Select elements once on load; update properties inside `render()`. Never `innerHTML` the whole panel.
- **Rounding contrast ratio before threshold check:** `contrastRatio` returns a raw float. Pass it directly to `passesAA` etc. Established in Phase 1 — `#777777` on white = 4.478 which fails AA; rounding to 4.48 or 4.5 would be wrong. Comment in colour-engine.js covers this.
- **Calling contrastRatio with pre-hashed string inconsistently:** `colour-engine.js` handles strings with or without `#`. Pick a convention and stick to it. Recommend: always pass `'#' + hex` (6-digit, uppercase).
- **Using `change` event instead of `input`:** `change` fires on blur, not on keystrokes. Use `input`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex parsing | Custom regex/split | `parseHex` from colour-engine.js | Already handles 3-digit, 6-digit, with/without `#`, null on bad input |
| Contrast ratio | Custom luminance maths | `contrastRatio` from colour-engine.js | Correct 0.04045 threshold, correct formula |
| WCAG threshold checks | `ratio >= 4.5` inline | `passesAA`, `passesAAA`, `passesAALarge`, `passesAAALarge` | Named, readable, threshold constants already exported |
| Live colour propagation | Updating every element's `style.color` | CSS custom property `--user-colour` | One update propagates everywhere via cascade |

**Key insight:** The engine exists. The UI is thin wiring. Any logic duplicated in the UI layer creates drift risk.

---

## Common Pitfalls

### Pitfall 1: `contenteditable` + CSS `color` + `outline` opacity conflict

**What goes wrong:** Setting `opacity: 0.5` on a focused `contenteditable` element to dim the outline also dims the text, making the sample unreadable during editing.

**Why it happens:** `opacity` applies to the whole element including children and text.

**How to avoid:** Use `color-mix(in srgb, var(--user-colour) 50%, transparent)` for the outline colour, or use a `box-shadow` that simulates an outline. Both keep text at full opacity.

**Warning signs:** Focus state looks correct in DevTools but sample text appears dimmed when you click into it.

### Pitfall 2: 3-digit hex input with `maxlength="6"`

**What goes wrong:** A user types "fff" (3-digit) — `maxlength="6"` allows it, `parseHex` accepts it, panels update. But displayed input shows "fff" not "ffffff", which can surprise the user.

**Why it happens:** `parseHex` expands 3-digit internally but the input field doesn't reflect the expansion.

**How to avoid:** Accept 3-digit as valid (the engine handles it), but you may choose to normalise the field to 6 digits on valid input. The UI-SPEC does not mandate this, so it is Claude's discretion. Simplest approach: leave the input as typed, rely on `parseHex` to handle both.

### Pitfall 3: Dark panel background vs. contrast calculation target

**What goes wrong:** The dark panel uses `#111111` as its background, not `#000000`. If contrast is calculated against `#000000` but rendered on `#111111`, the displayed ratio is slightly wrong.

**Why it happens:** Confusion between "black as a test background" (Phase 4 default) and the current dark panel colour.

**How to avoid:** Define `DARK_BG = '#111111'` and `LIGHT_BG = '#ffffff'` as named constants. Pass these to `contrastRatio`. Do not hardcode black.

**Source:** UI-SPEC specifies dark panel background as `#111111`.

### Pitfall 4: `aria-invalid` not toggled off on valid input

**What goes wrong:** Screen readers keep announcing "invalid" after the user corrects their input.

**Why it happens:** Setting `aria-invalid="true"` but forgetting to set `aria-invalid="false"` (or remove it) when valid.

**How to avoid:** Always call `setErrorState(false)` on valid input. The pattern above does this.

### Pitfall 5: `contrastRatio` called with pre-fixed `#` on stored hex

**What goes wrong:** `lastValidHex` stores without `#` (e.g. `'2563EB'`), but `contrastRatio` is called inconsistently — sometimes with `'#'`, sometimes without.

**Why it happens:** `parseHex` strips the `#` internally, so both work, but inconsistent calling makes the code confusing.

**How to avoid:** Store hex without `#` (`lastValidHex = '2563EB'`). Always call `contrastRatio('#' + lastValidHex, LIGHT_BG)`. One convention, applied consistently.

---

## Code Examples

### Initial page load

```js
// app.js
const HEX_DEFAULT = '2563EB';

document.addEventListener('DOMContentLoaded', () => {
  hexInput.value = HEX_DEFAULT;
  render(HEX_DEFAULT);
});
```

### Full hex input handler

```js
hexInput.addEventListener('input', () => {
  const raw = hexInput.value.trim();
  const parsed = parseHex(raw);

  if (parsed) {
    const hex = raw.replace(/^#/, '').toUpperCase();
    // Expand 3-digit: parseHex already validated, but we need 6-char hex for #RRGGBB
    const hex6 = hex.length === 3
      ? hex.split('').map(c => c + c).join('')
      : hex;
    lastValidHex = hex6;
    setErrorState(false);
    render(hex6);
  } else {
    setErrorState(true);
  }
});
```

### Badge HTML structure (per panel)

```html
<div class="badge-row badge-row--normal" aria-label="Normal text contrast">
  <span class="ratio">4.52:1</span>
  <span class="badge badge-aa">Pass AA</span>
  <span class="badge badge-aaa">Fail AAA</span>
</div>
<div class="badge-row badge-row--large" aria-label="Large text contrast">
  <span class="badge-row-label">Large text:</span>
  <span class="badge badge-aa-lg">Pass AA</span>
  <span class="badge badge-aaa-lg">Fail AAA</span>
</div>
```

```css
.badge {
  display: inline-block;
  font-size: 14px;
  font-weight: 400;
  padding: 4px 8px;
  border-radius: 4px;
  color: #ffffff;
}

.badge--pass { background: #16a34a; }
.badge--fail { background: #6b7280; }

.badge-row--large {
  font-size: 14px;
  opacity: 0.75;
}
```

---

## Environment Availability

Step 2.6: Skipped — this phase is purely HTML/CSS/JS. No external tools, services, databases, or CLIs are required. Node 24 is available (`v24.14.0`) for running tests via `node:test`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node 24 built-in) |
| Config file | none — run directly |
| Quick run command | `node --test test/app.test.js` |
| Full suite command | `node --test test/colour-engine.test.js test/app.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INP-01 | `parseHex` handles 3-digit, 6-digit, with/without `#` | unit (engine) | `node --test test/colour-engine.test.js` | Yes (Phase 1) |
| INP-02 | Invalid input → error state, panels unchanged | unit (app logic) | `node --test test/app.test.js` | No — Wave 0 |
| INP-03 | Default `#2563EB` on load | smoke | manual browser check | — |
| INP-04 | Valid hex sets `--user-colour` CSS property | unit (app logic) | `node --test test/app.test.js` | No — Wave 0 |
| CON-01 | Ratio displayed as `X.XX:1`, updates live | unit (app logic) | `node --test test/app.test.js` | No — Wave 0 |
| CON-02 | AA badge correct for normal text | unit (engine) | `node --test test/colour-engine.test.js` | Yes (Phase 1) |
| CON-03 | AAA badge correct for normal text | unit (engine) | `node --test test/colour-engine.test.js` | Yes (Phase 1) |
| CON-04 | AA badge correct for large text | unit (engine) | `node --test test/colour-engine.test.js` | Yes (Phase 1) |
| CON-05 | AAA badge correct for large text | unit (engine) | `node --test test/colour-engine.test.js` | Yes (Phase 1) |
| PNL-01 | Side-by-side layout at ≥768px, stacked below | manual | visual check | — |
| PNL-02 | Sample text renders in user's colour | manual | visual check | — |
| PNL-03 | `contenteditable` accepts user edits | manual | click-and-type check | — |

**Manual-only justification:** PNL-01/02/03 require a browser rendering context. `node:test` has no DOM. These are visual/interaction requirements best checked manually or with a future Playwright test (out of scope for this phase).

**Testable pure logic in `app.test.js`:** The `setErrorState`, `render`, and `updatePanel` helper functions can be extracted and tested if written as pure functions that accept DOM element references as arguments. The planner should structure `app.js` to separate pure logic from DOM manipulation.

### Sampling Rate

- **Per task commit:** `node --test test/colour-engine.test.js` (existing suite, confirms engine intact)
- **Per wave merge:** `node --test test/colour-engine.test.js test/app.test.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- `test/app.test.js` — covers INP-02, INP-04, CON-01. Needs JSDOM or a pure-function extraction approach.

**Note on JSDOM:** `node:test` has no built-in DOM. For `app.test.js` to test DOM-touching code, either (a) extract pure logic functions that can run without a DOM, or (b) use `jsdom` as a dev dependency. Option (a) is preferred — it costs nothing and keeps the zero-dependency rule. The planner should include a Wave 0 task to design the testable function boundary in `app.js`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `element.style.color = value` on every element | CSS custom property + cascade | ~2017 (Chrome 49) | One JS line updates all dependent elements |
| `oninput` attribute in HTML | `addEventListener('input', ...)` in JS | ~2010 | Cleaner separation of concerns |
| Polling `input.value` for changes | `input` event | — | Fires on every keystroke including paste |

**No deprecated approaches apply here** — this is a fresh build using the modern baseline the project already targets (modern browsers, no IE).

---

## Open Questions

1. **Should `app.js` be tested via pure function extraction or jsdom?**
   - What we know: `node:test` has no DOM. The engine tests use pure functions only.
   - What's unclear: How much of `app.js` logic is testable without a DOM mock.
   - Recommendation: Design `app.js` with a `buildBadgeState(ratio)` pure function that returns a plain object, and test that. DOM writes happen in a thin untested layer.

2. **Should the hex input normalise 3-digit input to 6 digits after acceptance?**
   - What we know: `parseHex` expands internally. The field shows whatever the user typed.
   - What's unclear: Whether user expects to see "fff" or "ffffff".
   - Recommendation: Leave as typed for now. Phase 4 URL sharing will need a canonical 6-digit form — address normalisation there.

---

## Sources

### Primary (HIGH confidence)

- `colour-engine.js` — Phase 1 output. All exported functions verified by `test/colour-engine.test.js`.
- `02-UI-SPEC.md` — Approved design contract. All spacing, colours, typography, copy, and accessibility requirements locked.
- `02-CONTEXT.md` — 10 locked implementation decisions.
- MDN Web Docs — CSS Custom Properties, `contenteditable`, `aria-live`, `input` event (all stable, widely-implemented browser features).

### Secondary (MEDIUM confidence)

- `color-mix()` support for 50% opacity outline trick — ~90% browser support in 2026 per caniuse data. All modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+). No IE support needed per CLAUDE.md.

### Tertiary (LOW confidence)

None — this phase uses only established browser primitives and the verified Phase 1 engine.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no libraries, all Phase 1 code verified, browser APIs are stable
- Architecture: HIGH — patterns are standard vanilla JS, well-established
- Pitfalls: HIGH — all identified from first principles with specific root causes
- Test strategy: MEDIUM — `node:test` + pure function extraction is proven, but `app.test.js` design depends on how the planner structures `app.js`

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable browser APIs, no fast-moving dependencies)
