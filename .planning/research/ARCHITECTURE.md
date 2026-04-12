# Architecture Patterns

**Project:** WCAG Colour Finder
**Researched:** 2026-04-12

## Recommended Architecture

A vanilla JS single-page app splits naturally into three layers: a pure colour engine with no DOM dependencies, a state module that owns the single source of truth, and UI components that read from state and trigger updates. The colour engine does the heavy lifting — all other layers are thin.

```
┌─────────────────────────────────────────────────────┐
│                        UI                           │
│  [hex-input]  [bg-inputs]  [preview-panels]         │
│  [mode-toggle]  [find-button]  [swatch-results]     │
└────────────────────┬────────────────────────────────┘
                     │ reads / triggers
┌────────────────────▼────────────────────────────────┐
│                   State                             │
│  { hex, lightBg, darkBg, mode, results, active }   │
└────────────────────┬────────────────────────────────┘
                     │ pure function calls
┌────────────────────▼────────────────────────────────┐
│               Colour Engine                         │
│  parse → luminance → contrast → search → format     │
└─────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `colour-engine.js` | All colour math — parsing, luminance, contrast ratio, WCAG thresholds, search algorithm | Nothing. Pure functions only. Takes values, returns values. |
| `state.js` | Owns the single app state object. Exposes `getState()`, `setState(patch)`, and `subscribe(fn)`. Persists hex to URL. | Colour engine (calls functions), UI (notifies subscribers) |
| `preview-panel.js` | Renders a single background panel (light or dark) with text samples and AA/AAA badges | State (reads on render) |
| `results-row.js` | Renders the swatch strip. Handles swatch click → setState | State (reads and writes) |
| `controls.js` | Hex input, background inputs, mode toggle, Find button | State (reads and writes) |
| `main.js` | Wires everything together. Bootstraps from URL params. Registers state subscribers. | All of the above |

### Data Flow

User input triggers a state change. State notifies subscribers. Subscribers re-render their slice of the UI.

```
User types hex
  → controls.js calls setState({ hex: value })
    → state.js validates, stores, notifies subscribers
      → preview-panel.js re-renders both panels
        (calls colourEngine.contrastRatio() inline during render)

User clicks "Find accessible colour"
  → controls.js calls colourEngine.findVariants(hex, lightBg, darkBg, mode)
    → returns array of candidate hex values
  → controls.js calls setState({ results: candidates })
    → results-row.js re-renders swatches

User clicks a swatch
  → results-row.js calls setState({ hex: swatchHex })
    → same flow as typing hex (panels re-render, URL updates)
```

**URL sync** lives in `state.js`. On `setState`, write `?hex=XXXXXX` to `history.replaceState`. On boot, `main.js` reads URL params and calls `setState` before first render.

## Patterns to Follow

### Pattern 1: Pure Colour Engine

The colour engine is a module of pure functions — no DOM, no globals, no side effects. Every function takes arguments and returns a value. This makes testing trivial and keeps the search algorithm decoupled from the UI.

```javascript
// colour-engine.js
export function hexToRgb(hex) { ... }
export function relativeLuminance(r, g, b) { ... }
export function contrastRatio(hex1, hex2) { ... }
export function passesAA(ratio) { return ratio >= 4.5; }
export function passesAAA(ratio) { return ratio >= 7.0; }
export function findVariants(hex, lightBg, darkBg, mode, count = 5) { ... }
```

No class needed. A plain module with named exports is enough.

### Pattern 2: Lightness Search via HSL

Finding the closest accessible variant means holding hue and saturation constant and walking the lightness axis until the contrast target is met. Binary search is the right tool: lightness (0–100) maps monotonically to luminance, so you can bisect to find the threshold in ~7 iterations per side.

For single-colour mode, search for a lightness that satisfies both backgrounds simultaneously. For dual-colour mode, run two independent searches — one toward the light-BG threshold, one toward the dark-BG threshold — then rank both results by perceptual distance from the original.

Convert: hex → RGB → HSL → adjust L → RGB → hex.

### Pattern 3: Flat State Object, Simple Pub/Sub

State is a single plain object. No classes, no proxies. A tiny subscriber list handles reactivity.

```javascript
// state.js
let state = { hex: '#2563EB', lightBg: '#ffffff', darkBg: '#000000', mode: 'single', results: [], activeResult: null };
const subscribers = [];

export function getState() { return { ...state }; }
export function setState(patch) {
  state = { ...state, ...patch };
  syncUrl(state);
  subscribers.forEach(fn => fn(state));
}
export function subscribe(fn) { subscribers.push(fn); }
```

This is enough. No need for a reactive framework for this scope.

### Pattern 4: Render Functions, Not Incremental DOM Patches

For panels and results that re-render cheaply on state change, write a `render(state)` function that sets `innerHTML` or updates a small set of DOM properties. The app is small enough that full re-render of a panel is fast and avoids diffing complexity.

Where fine-grained updates are cleaner (e.g. just swapping a CSS class), do that directly. The rule is: write the simplest thing that avoids visible flicker.

## Anti-Patterns to Avoid

### Anti-Pattern 1: DOM Calls Inside the Colour Engine

**What:** Colour math functions that also touch `document`, read input values, or set element styles.
**Why bad:** Makes the engine impossible to test in isolation. Any refactor of the UI breaks the math, and vice versa.
**Instead:** Colour engine is pure functions only. UI reads from it; it does not know the UI exists.

### Anti-Pattern 2: State Scattered Across the DOM

**What:** Reading input values directly from DOM elements whenever you need the current colour (treating inputs as the source of truth).
**Why bad:** The URL sync, swatch selection, and mode toggle all need consistent access to current state. If state lives in the DOM, each feature has to hunt for it in a different element.
**Instead:** All writes go through `setState`. All reads come from `getState`. The DOM reflects state; it does not store it.

### Anti-Pattern 3: Re-running the Search on Every Keystroke

**What:** Calling `findVariants` inside the hex input's `input` event handler.
**Why bad:** The search algorithm iterates over lightness candidates and runs multiple contrast calculations. It is fast but not free. Firing it on every keypress wastes CPU and may cause visible lag on slower devices.
**Instead:** Preview panels (contrast display, pass/fail badges) update on every keystroke — those are cheap single calculations. The `findVariants` search only runs when the user explicitly clicks the Find button or submits the form.

### Anti-Pattern 4: Hardcoding Contrast Thresholds Inline

**What:** Magic numbers like `>= 4.5` scattered through rendering code.
**Why bad:** WCAG thresholds appear in multiple places (preview badges, search algorithm, results display). Inconsistency creeps in.
**Instead:** Define thresholds once in the colour engine as named constants. `AA_NORMAL = 4.5`, `AAA_NORMAL = 7.0`, etc.

## Build Order

Dependencies determine order. The colour engine has no dependencies, so it ships first. State depends on the engine. UI depends on state.

| Order | Component | Depends On | Why First |
|-------|-----------|------------|-----------|
| 1 | `colour-engine.js` | Nothing | Foundation. All other code calls into it. |
| 2 | `state.js` | colour-engine (for validation) | State is needed before anything renders. |
| 3 | Preview panels | state, colour-engine | Core value prop — showing contrast live. |
| 4 | Hex input + URL sync | state | Users need to drive the tool. |
| 5 | AA/AAA badges | colour-engine | Extend preview panels with pass/fail labels. |
| 6 | Find variants (search) | colour-engine | The search algorithm, isolated and testable. |
| 7 | Results swatches | state, find-variants | Renders search output, handles swatch selection. |
| 8 | Mode toggle (single/dual) | state, find-variants | Changes how findVariants is called. |
| 9 | Custom BG colour inputs | state | Inline light/dark background overrides. |

**Implication for phases:** A working phase 1 is "hex input → live preview of contrast ratio on fixed white/black backgrounds". The search algorithm is a self-contained addition in a later phase. Mode toggle and custom backgrounds are the final layer.

## Scalability Considerations

This is a client-side static tool. The scalability concerns are performance, not infrastructure.

| Concern | Notes |
|---------|-------|
| Search performance | Binary search on lightness (~7 iterations) × ~5 candidates × 2 backgrounds = ~70 contrast calculations per search. Each is microseconds. No concern. |
| Bundle size | No dependencies, no build step. A single JS file under 10KB unminified is realistic. |
| Browser compatibility | `history.replaceState`, `Array.map`, `Math.pow` — all baseline. No concerns for modern browsers. |

## Sources

- [WCAG 2.1 — Understanding SC 1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [W3C Relative Luminance Algorithm (G17)](https://www.w3.org/TR/WCAG20-TECHS/G17.html)
- [Building your own colour contrast checker — DEV Community](https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o)
- [How I Built a WCAG Contrast Checker in 50 Lines of JavaScript — DEV Community](https://dev.to/afsar_khan/how-i-built-a-wcag-contrast-checker-in-50-lines-of-javascript-1lo5)
- [How does the WCAG colour contrast formula work? — Matthew Hallonbacka](https://mallonbacka.com/blog/2023/03/wcag-contrast-formula/)
- [Creating a colour algorithm with accessibility in mind — Medium/Heydays](https://medium.com/swlh/creating-a-color-algorithm-with-accessibility-in-mind-60c5b8256e19)
