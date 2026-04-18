# Phase 5: Design and Accessibility — Research

**Researched:** 2026-04-19
**Domain:** CSS design polish, WCAG accessibility self-audit, vanilla HTML/CSS/JS
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Monochrome Scope (UI-01)**
- D-01: All focus outlines use chrome colour (black on light panel, white on dark panel). Drop current `--user-colour` tint on Find button, swatch focus, etc. Strict read of "chrome is monochrome".
- D-02 (overridden by mockups): Selected swatch-pair ring is solid black/white. UI-SPEC overrides D-02 — black ring `3px solid #000000`, not `--user-colour`.
- D-03: Exception — contenteditable sample text keeps its dashed outline blended with `--user-colour`. That text IS the user colour, so the focus hint legitimately tints.
- D-04: Distance-warning keeps the `⚠` glyph prefix. Already meets A11Y-02 cleanly.

**Pass/Fail Non-Colour Cues (A11Y-02)**
- D-05: Badges get both text and icon — `✓ Pass AA`, `✗ Fail AA`.
- D-06 (overridden by mockups): Pass badges use `color-mix()` derived tint from `--user-colour`, not monochrome solid fill.
- D-07: Ratio number stays pure number. Adjacent badges carry pass/fail.
- D-08: Wrap each panel's `.badge-area` in `aria-live="polite"`.

**Focus and Visual Polish (UI-02, A11Y-03)**
- D-09: Unified focus spec: **2px solid outline, 2px offset, chrome colour** across `#hex-input`, `#find-btn`, `.bg-input`, `.swatch-pair`. Sample text keeps blended dashed exception (D-03).
- D-10: Polish scope = tidy pass. Audit typography scale, spacing rhythm, panel proportions. No structural change, no redesign.
- D-11: Mobile: stack panels vertically below ~700px.
- D-12: Typography: keep system font stack. No web font.
- D-13: Claude's Discretion: exact numeric spacing scale, precise breakpoint (~700px), badge pill dimensions, icon glyph choice.

**British Spelling Sweep (UI-03)**
- D-14: UI strings in British English. Code identifiers stay American. grep-audit visible copy.

**A11Y Audit Method (A11Y-01)**
- D-15: Audit combo: axe-core DevTools (primary) + manual keyboard walkthrough (Tab/Shift-Tab/Enter/Space) + VoiceOver smoke test on macOS.
- D-16: Audit results captured in `05-VERIFICATION.md` as per-criterion checklist.
- D-17: Fail policy: fix axe findings that are small and in scope. Out-of-scope findings → deferred, not scope creep.

**UI-SPEC mockup overrides** (mockups override CONTEXT.md where specified):
- Two-zone layout: top "control zone" (`background: var(--user-colour)`) + bottom "preview zone" (50/50 split).
- Pass badge: `color-mix()` derived from `--user-colour` (not monochrome fill).
- CTA copy: "Find 5 →" (not "Find accessible colour").
- Font: system-ui for body/labels, ui-monospace for hex codes and contrast ratios.
- Selected card border: `3px solid #000000`.

### Claude's Discretion
- Exact CSS for solid-vs-outline pill badges (border-radius, padding, weight).
- Specific spacing and typography scale values for the tidy pass.
- Icon glyph selection.
- Mobile breakpoint within 600–800px band.
- Order of implementation (markup first vs CSS first).

### Deferred Ideas (OUT OF SCOPE)
- Print stylesheet
- Animation/transition polish (swatch fade-in)
- Dark-mode for chrome itself (system colour-scheme)
- Empty-state copy for pre-search swatch row
- Web font upgrade
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Minimal monochrome UI — black/white chrome, colour only from user input | CSS custom property audit: remove `--user-colour` from `.find-btn:focus` and `.swatch-pair--selected`. Add two-zone layout with `--user-colour` top zone. |
| UI-02 | Clean, modern layout inspired by colourcontrast.cc | Two-zone structure per UI-SPEC. Typography unification: system-ui + ui-monospace. Spacing scale from existing tokens. |
| UI-03 | British spelling throughout (colour, not color) | grep audit of visible UI strings. Fix button label, badge labels, sample paragraph text, aria-labels. |
| A11Y-01 | Tool passes WCAG AA for all text and interactive elements | axe-core DevTools scan zero critical/serious violations. Manual verify: `#111111` on `#ffffff` = 21:1. `--pass-text` on `--pass-bg` ≥ 4.5:1. Top zone `#000000` on `--user-colour` requires runtime check. |
| A11Y-02 | Pass/fail not communicated by colour alone | Badge markup: add `<span aria-hidden="true">✓</span>` icon + text label. Badge text: "Pass AA" / "Fail AA". `aria-live="polite"` on `.badge-area`. |
| A11Y-03 | All interactive elements have visible focus states | Unified `outline: 2px solid var(--chrome-dark); outline-offset: 2px` on all interactive elements except `.sample-text`. Dark panel override to `var(--chrome-light)`. |
</phase_requirements>

---

## Summary

Phase 5 is a polish and audit pass over existing, working code. No new features. The codebase is in good shape — all 68 unit tests pass, no DOM dependencies in pure functions, error handling and aria-live patterns already in place. The work divides cleanly into four buckets: (1) structural HTML/CSS changes for the two-zone layout, (2) badge markup and `color-mix()` derivation for non-colour pass/fail cues, (3) CSS unification for focus states and typography, and (4) an axe-core + keyboard + VoiceOver audit with findings captured in VERIFICATION.md.

The biggest implementation risk is the `color-mix()` derived pass-badge contrast guarantee. The spec requires `--pass-text` on `--pass-bg` to hit 4.5:1, but `color-mix()` output varies with the user's chosen colour. A runtime JS check after derivation is needed, with fallback to `#16a34a` / `#ffffff` when `CSS.supports('color-mix(in oklch, red 30%, white)')` returns false or the computed contrast falls below 4.5:1. The existing `contrastRatio()` function in `colour-engine.js` can verify this — it just needs calling at render time.

The second risk is the top-zone background: `#000000` text on `var(--user-colour)`. The tool advertises WCAG compliance, so the tool's own chrome must comply. For very dark or very saturated user colours, `#000000` may not hit 4.5:1 against the top-zone background. The plan needs a runtime contrast check that warns (or applies a chrome colour override) when this falls below threshold.

**Primary recommendation:** Implement in four waves: (1) two-zone HTML structure + CSS layout, (2) badge markup changes + `color-mix()` CSS + runtime contrast safety, (3) focus state and typography unification, (4) a11y audit and VERIFICATION.md. Each wave is independently reviewable.

---

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| node:test (built-in) | Node 24 | Unit test runner for pure functions | Already used; zero deps |
| axe-core DevTools (browser extension) | Latest | Automated WCAG 2.1 accessibility scan | Industry standard; free; actionable findings |
| VoiceOver (macOS built-in) | macOS 25 | Screen reader smoke test | Available on this machine; D-15 requires it |

No npm packages are needed. No build step. The project has no `package.json` and runs all tests via `node --test`.

### Supporting

| Thing | Purpose | When to Use |
|-------|---------|-------------|
| `CSS.supports('color-mix(in oklch, red 30%, white)')` | Feature-detect color-mix support | Guard the derived badge colour path |
| `colour-engine.js` `contrastRatio()` | Verify computed badge contrast at runtime | Call after setting `--pass-bg` / `--pass-text` to validate they hit 4.5:1 |
| `python3 -m http.server` | Serve the static site for audit | Available (Python 3.9.6 confirmed); axe-core requires a served page |

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure

No restructuring needed. Existing flat layout:

```
wcag-colour-finder/
├── index.html        — markup (badge icons, aria-live, two-zone structure)
├── style.css         — all styles (focus, typography, color-mix, layout)
├── app.js            — DOM wiring (badge rendering, pass-bg derivation, runtime contrast check)
├── colour-engine.js  — pure maths (contrastRatio used for badge contrast verification)
├── variant-search.js — unchanged in this phase
├── url-state.js      — unchanged in this phase
└── test/             — unchanged in this phase
```

### Pattern 1: Two-Zone Layout

**What:** Wrap existing markup in two structural divs. The control zone gets `background: var(--user-colour)`. The preview zone holds `.panels`.

**When to use:** The whole page.

```html
<div class="control-zone">
  <!-- H1, description, hex input pill, find button, AA/AAA toggle, swatch-list -->
</div>
<div class="preview-zone">
  <div class="panels">
    <!-- .panel--light and .panel--dark -->
  </div>
</div>
```

```css
.control-zone {
  background: var(--user-colour);
  padding: var(--space-3xl) var(--space-md);
  color: #000000;
}
.preview-zone {
  background: var(--surface);
}
```

### Pattern 2: Badge Icon Injection

**What:** Add `aria-hidden="true"` icon span inside each badge. Icon is a Unicode glyph, not SVG.

**Current state:** `setBadge()` sets `el.textContent = (passes ? 'Pass ' : 'Fail ') + label`. This overwrites any child elements.

**Change needed:** `setBadge()` must use `innerHTML` (safe — no user input) or construct child spans explicitly.

```javascript
function setBadge(root, selector, passes, label) {
  const el = root.querySelector(selector);
  if (!el) return;
  const icon = passes ? '✓' : '✗';
  const text = passes ? 'Pass ' : 'Fail ';
  el.innerHTML = `<span aria-hidden="true">${icon}</span><span>${text}${label}</span>`;
  el.classList.toggle('badge--pass', passes);
  el.classList.toggle('badge--fail', !passes);
}
```

Source: UI-SPEC Badge Spec section. Pattern from WCAG SC 1.4.1 (Use of Colour) best practice.

### Pattern 3: Derived Pass-Badge Colour with Runtime Safety

**What:** Compute `--pass-bg` and `--pass-text` from `--user-colour` using CSS `color-mix()`, then verify contrast in JS.

```javascript
// After applyColor(hex) sets --user-colour:
function applyPassBadgeColors(hex) {
  const root = document.documentElement;
  if (CSS.supports('color-mix(in oklch, red 30%, white)')) {
    // Let CSS color-mix() do the derivation
    // --pass-bg and --pass-text are set in CSS using color-mix(in oklch, var(--user-colour) ...)
    // Verify the result:
    const computedPassBg   = getComputedStyle(root).getPropertyValue('--pass-bg').trim();
    const computedPassText = getComputedStyle(root).getPropertyValue('--pass-text').trim();
    const ratio = contrastRatio(computedPassText, computedPassBg);
    if (ratio < 4.5) {
      // Fallback: override to guaranteed accessible green
      root.style.setProperty('--pass-bg',   '#16a34a');
      root.style.setProperty('--pass-text', '#ffffff');
    }
  } else {
    // No color-mix support: use static fallback
    root.style.setProperty('--pass-bg',   '#16a34a');
    root.style.setProperty('--pass-text', '#ffffff');
  }
}
```

Note: `getComputedStyle()` returns the resolved `color-mix()` result as an `rgb()` value in supported browsers. `contrastRatio()` accepts any valid hex or `rgb()` string only if it already handles that format. Check `colour-engine.js`'s `parseHex()` — if it only accepts hex, this approach needs a helper to read the computed RGB components and pass them directly. The fallback path (static `#16a34a`) avoids this complexity entirely when `color-mix` is absent.

**Simpler alternative:** Compute `--pass-bg` and `--pass-text` entirely in JS using the existing OKLab maths, skipping `color-mix()` in CSS. This gives full control, no browser API dependency, and the contrast check is straightforward. Trade-off: more JS, CSS becomes simpler.

### Pattern 4: Top-Zone Chrome Contrast Warning

**What:** After the user changes their colour, check that `#000000` on `var(--user-colour)` hits 4.5:1. If it does not, show a warning in the control zone.

```javascript
function checkTopZoneContrast(hex) {
  const ratio = contrastRatio('#000000', '#' + hex);
  const warning = document.querySelector('#top-zone-warning');
  if (warning) warning.hidden = ratio >= 4.5;
}
```

Add a `<p id="top-zone-warning" hidden aria-live="polite">Warning: current colour may reduce readability of page controls.</p>` in the control zone.

### Pattern 5: Mobile Tab Switch (≤700px)

**What:** On mobile, the two preview panels are replaced by a single panel with "Light" / "Dark" tabs.

**Implementation:** Pure CSS show/hide driven by `aria-selected` on tab buttons. No JavaScript tab state needed if CSS uses `[aria-selected="true"]` + adjacent sibling selectors — but since panels are siblings of the tabs (not children), JS toggling a `.panel--active` class is simpler.

```javascript
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');
    const target = btn.dataset.panel; // 'light' or 'dark'
    panels.forEach(p => p.hidden = !p.classList.contains(`panel--${target}`));
  });
});
```

ARIA: `role="tablist"` on container, `role="tab"` on each button, `role="tabpanel"` on each panel. Tab panel uses `aria-labelledby` pointing to the active tab.

### Pattern 6: AA/AAA Toggle (Segmented Control)

**What:** Two-button segmented control that switches the threshold for badge labelling.

**ARIA:** `role="group"` on container, each button is a `<button aria-pressed="true/false">`. No `role="radio"` needed — pressed state is simpler for a two-option toggle.

**No re-search on toggle:** Toggle just re-labels/re-filters existing result cards. The `findVariantPairs()` call is not triggered.

### Anti-Patterns to Avoid

- **Using `textContent` in `setBadge()` after adding icon spans:** Overwrites child elements. Use `innerHTML` with sanitised strings or construct children via `createElement`.
- **Assuming `getComputedStyle()` returns `color-mix()` as a hex string:** It returns `rgb()`. Either parse the `rgb()` string or handle it in `contrastRatio()`.
- **Putting `aria-live` on elements that always have content:** Causes screen readers to announce on every page load. The `.badge-area` `aria-live` is correct — content changes on user action.
- **Using `outline: none` without a replacement:** Never remove the outline without providing a visible replacement. The D-09 unified spec provides the replacement.
- **Forget `outline-offset`:** Chrome and Safari render outlines inside the element without offset, clipping them on rounded corners. The `2px offset` in D-09 is required for visibility.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG automated audit | Custom DOM checker | axe-core DevTools extension | Covers 40+ WCAG rules, generates actionable findings, industry standard |
| Contrast ratio of computed CSS colours | CSS-to-hex parser | Read computed style RGB channels directly, or use the JS fallback path | Browser already resolved the colour; re-parsing is fragile |
| British spelling grep | Manual review | `grep -rn '\b(color|gray|center|analyze)\b' index.html app.js style.css` | Catches stray American spellings in under a second |

**Key insight:** The entire colour computation stack (`contrastRatio`, `passesAA`, etc.) is already in `colour-engine.js`. Phase 5 reuses it — it does not add new colour maths.

---

## Common Pitfalls

### Pitfall 1: `color-mix()` Resolved Value is `rgb()` Not Hex

**What goes wrong:** `getComputedStyle(root).getPropertyValue('--pass-bg')` returns `rgb(180, 220, 195)`, not a hex string. Passing this to `contrastRatio()` fails if that function only parses hex.

**Why it happens:** The browser resolves `color-mix()` to a standard colour representation when you read it back via computed style.

**How to avoid:** Either (a) compute pass-badge colours entirely in JS using the existing hex-based maths, bypassing `color-mix()` reads, or (b) add an `rgbStringToHex()` helper. Option (a) is simpler for this project.

**Warning signs:** `contrastRatio()` throws or returns `NaN` when passed the computed badge colour.

### Pitfall 2: Focus Outline on Dark Panel Is Invisible

**What goes wrong:** The unified `outline: 2px solid var(--chrome-dark)` (which is `#111111`) is invisible against the `#111111` dark panel background.

**Why it happens:** `--chrome-dark` is `#111111`. The dark panel background is also `#111111`. Same colour.

**How to avoid:** Add `.panel--dark *:focus { outline-color: var(--chrome-light); }` as specified in D-09 and the UI-SPEC Interaction Contract. This is already documented in UI-SPEC — just make sure it is not forgotten during CSS edits.

**Warning signs:** During keyboard walkthrough, focus is invisible inside the dark panel.

### Pitfall 3: `aria-live` Announces on Page Load

**What goes wrong:** Adding `aria-live="polite"` to `.badge-area` causes the initial badge text ("Fail AA", "Fail AAA") to be announced on page load via VoiceOver.

**Why it happens:** `aria-live` announces changes to element content. If the element has content when the live region is parsed, some screen readers announce it.

**How to avoid:** Per D-08 note in CONTEXT.md: "debounce or accept chatter". The existing error message pattern has the same behaviour. The `hidden` attribute suppresses announcements for hidden elements. If the badge-area is visible at load time, accept the initial announcement — it provides useful information (current contrast status).

**Warning signs:** VoiceOver reading badge text immediately on page load without user action.

### Pitfall 4: `innerHTML` XSS Risk in `setBadge()`

**What goes wrong:** Using `innerHTML` with attacker-controlled content introduces XSS.

**Why it happens:** Caution with `innerHTML` is a reflex, not always applicable.

**How to avoid:** The badge icon and label text in `setBadge()` are entirely generated from internal boolean state (`passes`) and a static string (`label`). No user input flows into these strings. `innerHTML` is safe here. Alternatively, use `createElement` + `appendChild` for belt-and-braces if preferred.

### Pitfall 5: Top-Zone `#000000` Text Fails on Dark User Colours

**What goes wrong:** A user enters `#111111` as their hex colour. The top zone becomes `background: #111111`. Black text (`#000000`) on `#111111` has contrast ratio of ~1.05:1 — far below AA.

**Why it happens:** The tool uses `--user-colour` as the top-zone background with no contrast guard.

**How to avoid:** Add a runtime check in `applyColor()` / `render()`. If `contrastRatio('#000000', '#' + hex) < 4.5`, apply a visible warning in the control zone OR switch the top-zone chrome text to white. Document the chosen behaviour in the plan.

**Warning signs:** Axe-core flags "Insufficient colour contrast" on H1 or description text in the control zone.

### Pitfall 6: Mobile Tabs Missing ARIA

**What goes wrong:** Implementing mobile tabs as plain buttons without `role="tablist"` / `role="tab"` / `role="tabpanel"` means screen readers cannot navigate the tab structure.

**Why it happens:** Tab UI looks simple; ARIA overhead is easy to forget.

**How to avoid:** Use the full tablist pattern. `role="tablist"` on the container, `role="tab"` + `aria-selected` on each button, `role="tabpanel"` + `aria-labelledby` on each panel.

### Pitfall 7: `swatch-pair-hex` Label Outside the Panel Has `.panel--dark` in Its Ancestor Chain

**What goes wrong:** The `.swatch-pair-hex` label under each swatch sits inside `.swatch-item` inside `.swatch-list` inside `#swatch-row` — not inside any `.panel--*`. The existing rule `.panel--dark .swatch-pair-hex { color: var(--chrome-dark); }` has no effect because there is no `.panel--dark` ancestor. The label gets `--chrome-dark` = `#111111` from the default rule — correct for the current `--surface` background context. No change needed.

**Warning signs:** If `#swatch-row` ever moves inside a panel, this cascades incorrectly.

---

## Code Examples

### British Spelling Grep Audit

```bash
# Run from project root
grep -rn '\bcolor\b' index.html app.js style.css \
  | grep -v "color-mix\|outline-color\|border-color\|background-color\|box-shadow\|getPropertyValue\|setProperty\|applyColor\|clearColor\|checkTopZoneContrast"
```

This filters out CSS property names (which are American by spec) and JS function names (American by project convention), leaving only UI string occurrences.

### Unified Focus Rule (CSS)

```css
/* Source: UI-SPEC Interaction Contract / CONTEXT.md D-09 */

/* All interactive elements except .sample-text */
#hex-input:focus,
#find-btn:focus,
.bg-input:focus,
.swatch-pair:focus,
.tab-btn:focus,
.aa-toggle-btn:focus,
.copy-btn:focus {
  outline: 2px solid var(--chrome-dark);
  outline-offset: 2px;
}

/* Dark panel override */
.panel--dark #hex-input:focus,
.panel--dark .bg-input:focus,
.panel--dark .swatch-pair:focus,
.panel--dark .copy-btn:focus {
  outline-color: var(--chrome-light);
}

/* Exception: sample text (D-03) */
.sample-text:focus {
  outline: 2px dashed;
  outline-color: color-mix(in srgb, var(--user-colour) 50%, transparent);
  outline-offset: 2px;
}
```

### Pass Badge Derivation (CSS + JS Fallback)

```css
/* Source: UI-SPEC Colour section */
:root {
  --pass-bg:   color-mix(in oklch, var(--user-colour) 30%, #ffffff);
  --pass-text: color-mix(in oklch, var(--user-colour) 80%, #000000);
}
```

```javascript
// Source: UI-SPEC Colour section — runtime contrast safety check
// Called after applyColor(hex) sets --user-colour
function ensurePassBadgeContrast(hex) {
  if (!CSS.supports('color-mix(in oklch, red 30%, white)')) {
    document.documentElement.style.setProperty('--pass-bg',   '#16a34a');
    document.documentElement.style.setProperty('--pass-text', '#ffffff');
    return;
  }
  // color-mix() is supported; CSS does the derivation.
  // Verify the result by computing contrast on the derived RGB values.
  // Simplest path: derive in JS instead, using colour-engine.js.
  // (Avoids the rgb() string parsing problem with getComputedStyle.)
}
```

**Recommended simplification:** Compute pass-badge colours in JS using the OKLCH lightness of `--user-colour` — adjust L toward white for `--pass-bg` and toward dark for `--pass-text`, then verify with `contrastRatio()`. This gives guaranteed contrast without `getComputedStyle()` complexity. Use CSS `color-mix()` only as a visual default; override it via JS-computed inline custom property values after verification.

### axe-core DevTools Audit Steps

1. Serve the project: `python3 -m http.server 8080` from project root.
2. Open `http://localhost:8080` in Chrome.
3. Open DevTools → Extensions → axe DevTools → Scan page.
4. Run the scan with the default colour loaded (`#2563EB`).
5. Re-run with a dark colour (`#111111`) to exercise the top-zone contrast edge case.
6. Re-run after clicking "Find 5 →" to audit the swatch-list state.
7. Record all critical/serious violations in VERIFICATION.md.

### Keyboard Walkthrough Sequence

Tab order to verify:
1. Hex input (`#hex-input`)
2. Find button (`#find-btn`)
3. AA/AAA toggle buttons
4. Result cards (`.swatch-pair`) — only present after "Find 5 →"
5. Light BG input (`#light-bg-input`)
6. Dark BG input (`#dark-bg-input`)
7. Copy icons (when present)

Check: no tab traps, no invisible focus, logical order, Enter/Space activate buttons.

### VoiceOver Smoke Test Sequence (macOS)

1. Enable VoiceOver: `Cmd+F5`.
2. Navigate to hex input. Confirm VO reads: "Hex colour code, edit text".
3. Type `ff0000`. Confirm no announcement of badge changes mid-typing (or confirm polite chatter is acceptable per D-08 note).
4. Press Tab to Find button. Confirm VO reads: "Find 5, button".
5. Activate Find button (Space). Confirm VO announces badge changes in `.badge-area` (aria-live).
6. Navigate to first result card. Confirm VO reads the `aria-label` with hex pair info.
7. Activate a card (Space). Confirm panels update and VO reads "Pass AA" badge text (not "tick Pass AA" — icon must be `aria-hidden`).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate focus styles per element | Unified focus selector group | This phase | Fewer lines, easier maintenance |
| Static green `--pass-bg` (#16a34a) | Derived `color-mix()` from `--user-colour` | This phase | Visually cohesive; requires contrast verification |
| `textContent` only in badges | Icon + text in badges | This phase | WCAG SC 1.4.1 compliance |
| Single flat layout | Two-zone (control zone + preview zone) | This phase (UI-SPEC) | Matches mockup aesthetic |
| `outline` on `.swatch-pair--selected` uses `--user-colour` | `3px solid #000000` | This phase | Strict monochrome per UI-SPEC |

**Deprecated in this phase:**
- `--pass-bg: #16a34a` and `--fail-bg: #6b7280` as static values in `:root` — replaced by derived / semantic tokens.
- `--badge-text: #ffffff` — no longer a single badge text colour; pass and fail badges have separate colour tokens.
- `.find-btn:focus { outline-color: var(--user-colour) }` — replaced with `var(--chrome-dark)`.
- `.swatch-pair--selected { outline: 3px solid var(--user-colour) }` — replaced with `3px solid #000000`.

---

## Open Questions

1. **How to verify `--pass-text` on `--pass-bg` after `color-mix()` in CSS**
   - What we know: `getComputedStyle` returns `rgb()`, not hex. `colour-engine.js` `parseHex()` only handles hex.
   - What's unclear: Does the plan compute badge colours in JS (bypassing CSS `color-mix()`) or add an `rgb()` parser?
   - Recommendation: Compute in JS. Write a `deriveBadgeColors(userHex)` function in `app.js` that uses the existing OKLCH lightness maths. Set `--pass-bg` and `--pass-text` as inline custom properties. Simpler, testable, no browser API dependency.

2. **Top-zone chrome contrast — warn or auto-switch?**
   - What we know: `#000000` on user's colour may fail AA for dark input colours.
   - What's unclear: Should the tool switch top-zone text to white automatically, or show a warning?
   - Recommendation: Auto-switch. If `contrastRatio('#000000', '#' + hex) < 4.5`, set `--control-zone-text: #ffffff`; else `--control-zone-text: #000000`. Silent and correct. No warning needed.

3. **`contrastRatio()` — does it parse `rgb()` strings?**
   - What we know: The function exists in `colour-engine.js`. Tests pass for hex inputs.
   - What's unclear: Whether it handles `rgb(r, g, b)` format.
   - Recommendation: Check the source. If not, the JS badge-colour derivation path (question 1) removes the need entirely.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | `node --test` unit tests | Yes | v24.14.0 | — |
| Python 3 | Local HTTP server for axe audit | Yes | 3.9.6 | `npx serve` |
| axe-core DevTools (Chrome extension) | A11Y-01 audit | Unknown | — | Lighthouse DevTools (built-in) |
| VoiceOver | A11Y-01 smoke test | Yes (macOS 25) | Built-in | NVDA on Windows (not available) |
| pa11y CLI | Optional automated a11y | Not installed | — | axe-core DevTools (primary per D-15) |

**Missing with fallback:**
- axe-core DevTools: If not installed as extension, use Chrome Lighthouse DevTools → Accessibility audit. It runs axe-core internally. Lower resolution but zero install cost.
- pa11y: Not needed. D-15 names axe-core DevTools as the primary tool; pa11y is not required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24) |
| Config file | none — invoked directly |
| Quick run command | `node --test test/colour-engine.test.js test/app.test.js` |
| Full suite command | `node --test test/colour-engine.test.js test/app.test.js test/url-state.test.js test/variant-search.test.js` |

### Phase Requirements → Test Map

| Req ID | Behaviour | Test Type | Automated Command | File Exists? |
|--------|-----------|-----------|-------------------|-------------|
| UI-01 | Chrome is monochrome (focus/selection use `--chrome-dark`, not `--user-colour`) | manual | CSS review + keyboard walkthrough | N/A — CSS visual check |
| UI-02 | Layout matches two-zone spec, typography unified | manual | Browser visual check | N/A |
| UI-03 | No American spelling in visible UI strings | automated (grep) | `grep -rn '\bcolor\b' index.html app.js` (filtered) | N/A — grep audit |
| A11Y-01 | Zero axe-core critical/serious violations | manual + tool | axe-core DevTools scan | N/A — browser tool |
| A11Y-02 | Badge icon `aria-hidden`, badge text includes "Pass"/"Fail" | unit + manual | `node --test test/app.test.js` | ✅ (extend existing) |
| A11Y-03 | All interactive elements have visible focus (2px solid chrome) | manual | Keyboard walkthrough | N/A — visual check |

Unit-testable parts of this phase:
- `setBadge()` output: can test that the DOM has icon span with `aria-hidden="true"` and text span with correct label — requires JSDOM or a DOM mock. Currently `app.test.js` only tests pure functions exported above the DOM guard. Option: export a `buildBadgeHTML(passes, label)` pure string function and test it.
- `deriveBadgeColors(userHex)`: if implemented as a pure function (returns `{ passBg, passText }` hex pair), is directly testable.
- Top-zone contrast decision: `chooseChromeForeground(userHex)` → `'#000000'` or `'#ffffff'` — pure, testable.

### Sampling Rate

- Per task commit: `node --test test/app.test.js`
- Per wave merge: `node --test test/colour-engine.test.js test/app.test.js test/url-state.test.js test/variant-search.test.js`
- Phase gate: full suite green + axe-core zero violations + keyboard walkthrough complete before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No new test files required for CSS/visual changes — but if `buildBadgeHTML()` and `deriveBadgeColors()` are extracted as pure functions, add test cases to `test/app.test.js`. Create stubs now if the plan extracts these functions.
- [ ] No framework install needed — node:test already confirmed working (68/68 pass).

---

## Sources

### Primary (HIGH confidence)

- CONTEXT.md decisions D-01 through D-17 — locked choices verified by reading the file
- UI-SPEC.md — mockup ground truth, overrides CONTEXT.md where noted
- `style.css` audit — current focus rule locations at lines 106–117, 256–259, 300–303, 390–396
- `app.js` `setBadge()` at line 107 — current implementation without icon spans
- WCAG 2.1 SC 1.4.1 (Use of Colour): https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html
- WCAG 2.1 SC 2.4.7 (Focus Visible): https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
- WCAG 2.1 SC 1.4.3 (Contrast Minimum): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

### Secondary (MEDIUM confidence)

- `CSS.supports()` for `color-mix()` feature detection — documented in MDN, all modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+) support `color-mix(in oklch, ...)`.
- axe-core as standard automated WCAG audit tool — verified by multiple sources; free Chrome extension.
- ARIA tablist pattern — documented at https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

### Tertiary (LOW confidence)

- VoiceOver behaviour on `aria-live="polite"` at page load — generally does not announce initial content, but behaviour varies by VoiceOver version. Verify during audit.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all tools confirmed installed or available
- Architecture patterns: HIGH — derived directly from existing code + locked UI-SPEC
- Pitfalls: HIGH — identified from reading actual source code and known CSS/ARIA edge cases
- Validation architecture: HIGH — node:test confirmed working (68/68), axe-core is the industry standard

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (stable domain; WCAG 2.1 spec unchanged; CSS `color-mix()` support stable)
