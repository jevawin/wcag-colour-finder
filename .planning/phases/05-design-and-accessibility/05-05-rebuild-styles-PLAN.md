---
phase: 05-design-and-accessibility
plan: 05
type: execute
wave: 2
depends_on:
  - 05-04
files_modified:
  - style.css
autonomous: true
gap_closure: true
requirements:
  - UI-01
  - UI-02
  - A11Y-03
must_haves:
  truths:
    - "Topbar renders with --topbar-bg background and --topbar-fg foreground, bordered-bottom 2px solid --topbar-fg"
    - "Hex input pill is 72px tall, JetBrains Mono 22px, white background"
    - "Find button is 72px tall, uses --topbar-fg as bg and --topbar-bg as fg"
    - "Segmented AA|AAA toggle is 72px tall, active option swaps to --topbar-fg bg"
    - "Alts grid is 5-column on desktop, 1-column stacked on mobile"
    - "Preview panels render ratio at 64px JetBrains Mono, pills as 4-col grid"
    - "fg-tag and bg-tag positioned absolutely top:88px with 44px height"
    - "Specimen heading is 64px, paragraph 16px max-width 52ch, digits row 34px JetBrains Mono"
    - "No .sample-text:focus dashed rule remains in style.css"
    - "No .control-zone / .preview-zone / .aa-toggle / .hex-pill legacy rules remain"
  artifacts:
    - path: "style.css"
      provides: "Complete mockup-aligned CSS"
      contains: ".topbar-wrap"
  key_links:
    - from: ".topbar-wrap"
      to: "--topbar-bg / --topbar-fg custom properties"
      via: "background / color declarations"
      pattern: "background: var\\(--topbar-bg"
    - from: ".pill.pass"
      to: "--specimen / --bg-for-specimen custom properties"
      via: "background + color declarations"
      pattern: "background: var\\(--specimen"
---

<objective>
Replace style.css with mockup-aligned styles. Inline the mockup's `<style>` block (lines 10-515) as our external stylesheet, adjusted for our file naming and British-spelling conventions. Retire all legacy rules from 05-01/05-02/05-03 (control-zone, preview-zone, aa-toggle, hex-pill old pattern, sample-text, badge-area, badge--pass/fail, swatch-pair ring, etc).

Purpose: Close gaps G1 (topbar CSS), G5 (ratio typography + 4-pill grid), G6 (Inter/JetBrains Mono + `.mono` utility), G7 (specimen typography), G10 CSS-side (retire `.sample-text:focus` dashed rule). Addresses UI-01 (monochrome chrome derived from --topbar-fg), UI-02 (layout), A11Y-03 (focus states re-applied against new DOM).

Output: new style.css that styles the index.html skeleton from 05-04 into the mockup visuals.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-VERIFICATION.md
@.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html
@style.css
@index.html
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace style.css with mockup CSS + focus rules</name>
  <files>style.css</files>
  <read_first>
    - `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 10-515 (the entire `<style>` block)
    - `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` gaps G1, G5, G6, G7, G10
    - current `style.css` (entire file — will be replaced)
    - rebuilt `index.html` from 05-04 (the CSS must style this DOM)
  </read_first>
  <action>
    Replace the entire contents of `style.css` with the CSS rules from the mockup's `<style>` block (lines 10-515 of `mockup/wcag-colour-finder/project/WCAG Colour Finder.html`). Strip the `<style>` / `</style>` wrappers. Preserve every rule verbatim, including:

    - `:root { --ink: #111111; --ink-mute: #555555; --paper: #ffffff; --border-w: 2px; }`
    - `* { box-sizing: border-box; }`
    - `html, body { margin:0; padding:0; background: var(--ink); color: var(--ink); font-family: 'Inter', system-ui, sans-serif; font-feature-settings: 'ss01','cv11'; min-height: 100vh; }`
    - `body { display: flex; flex-direction: column; min-height: 100vh; }`
    - `.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-ligatures: none; }`
    - All `.topbar-wrap`, `.topbar`, `.title-row`, `h1`, `.subtitle`, `.credit`, `.credit a`, `.controls`, `.row-one`, `.row-two`, `.card`, `.card-label`, `.base-row`, `.hex-input`, `.hex-input .swatch`, `.hex-input .swatch input[type="color"]`, `.hex-input .hash`, `.hex-input input[type="text"]`, `.btn`, `.btn:hover`, `.btn:disabled`, `.target-toggle`, `.target-opt`, `.target-opt + .target-opt`, `.target-opt.is-active` rules
    - `.alts`, `.alt`, `.alt .chips`, `.alt .hex`, `.alt .chip`, `.alt .chip.light`, `.alt .chip.dark`, `.alt.single .chip`, `.alt.placeholder` rules
    - All `.previews`, `.preview`, `.preview.is-light`, `.preview.is-dark`, `.preview-inner` rules
    - `.bg-tag`, `.fg-tag`, `.fg-tag .fg-swatch`, `.tag-label`, `.copy-btn`, `.copy-btn:hover`, `.copy-btn svg`, `.copy-btn.copied svg`, `.copy-btn.copied::before`, `.bg-tag .label`, `.bg-tag .swatch-sm`, `.bg-tag .swatch-sm input[type="color"]`, `.bg-tag .hash-sm`, `.bg-tag input[type="text"]` rules
    - `.ratio-row`, `.ratio`, `.pills`, `.pill-wrap`, `.pill`, `.pill.pass`, `.pill.fail`, `.pill .glyph`, `.pill-label` rules
    - `.heading`, `.para`, `.digits` rules
    - `.preview-tabs`, `.preview-tabs-inner`, `.tab-btn`, `.tab-btn[data-tab="dark"]`, `.tab-btn.is-active` rules
    - The complete `@media (max-width: 991px)` and `@media (max-width: 1400px)` and `@media (max-width: 767px)` blocks
    - The `.toggle-row` / `.toggle` legacy mockup rules can be included verbatim even if unused (mockup retains them; harmless).

    Then APPEND at the end of style.css (after the mockup rules) this unified focus block for A11Y-03 — focus colour derives from `--topbar-fg` in the topbar and from `var(--specimen, currentColor)` on the preview panels:

    ```css
    /* --- Unified focus — A11Y-03 --- */
    .topbar-wrap :focus-visible,
    .topbar-wrap .hex-input:focus-within {
      outline: 2px solid var(--topbar-fg, #111111);
      outline-offset: 2px;
    }
    .preview :focus-visible {
      outline: 2px solid var(--specimen, currentColor);
      outline-offset: 2px;
    }
    .preview-tabs .tab-btn:focus-visible {
      outline: 2px solid var(--ink);
      outline-offset: -2px;
    }
    .input--error { outline: 2px solid #dc2626 !important; }
    ```

    Do NOT add any legacy rules (no .control-zone, .preview-zone, .aa-toggle, .aa-toggle-btn, .hex-pill, .preview-pill, .preview-field, .badge-area, .badge, .badge--pass, .badge--fail, .sample-text, .sample-heading, .sample-para, .numerals, .swatch-row, .swatch-list, .swatch-item, .swatch-pair, .swatch-pair__half, .swatch-pair--selected, .swatch-btn--selected, .swatch-indicator, .hex-prefix, .hex-value, .distance-warning, .top-zone-warning, .pill-divider, .panels, .panel, .panel--light, .panel--dark, .panel-tabs, .attribution, .contrast-ratio--large, .sr-only). The mockup does not need `.sr-only`; we are not adding sr-only content in this rebuild. If a later task needs sr-only, it can add it then.

    Keep British spelling in any CSS comments (use "colour" not "color" in prose; CSS property `color:` stays as-is — that's a CSS keyword). The british-spelling test allows bare `color:` CSS property and the specific identifiers listed in its allow-list.
  </action>
  <acceptance_criteria>
    - `grep -c "\.topbar-wrap" style.css` → ≥ 1
    - `grep -c "\.mono" style.css` → ≥ 1
    - `grep -c "'JetBrains Mono'" style.css` → ≥ 5 (hex-input hash, hex-input text, fg-tag, bg-tag input, ratio, digits)
    - `grep -c "'Inter'" style.css` → ≥ 2 (body, target-opt or tag-label)
    - `grep -c "var(--topbar-bg" style.css` → ≥ 1
    - `grep -c "var(--topbar-fg" style.css` → ≥ 3
    - `grep -c "\.target-toggle" style.css` → ≥ 1
    - `grep -c "\.target-opt\.is-active" style.css` → 1
    - `grep -c "\.alts" style.css` → ≥ 1
    - `grep -c "grid-template-columns: repeat(5" style.css` → ≥ 1
    - `grep -c "\.ratio" style.css` → ≥ 1
    - `grep -c "font-size: 64px" style.css` → ≥ 2 (ratio + heading)
    - `grep -c "\.pill\.pass" style.css` → 1 and `grep -c "\.pill\.fail" style.css` → 1
    - `grep -c "\.fg-tag" style.css` → ≥ 1
    - `grep -c "\.bg-tag" style.css` → ≥ 1
    - `grep -c "\.copy-btn" style.css` → ≥ 1
    - `grep -c "max-width: 52ch" style.css` → 1
    - `grep -c "control-zone" style.css` → 0
    - `grep -c "preview-zone" style.css` → 0
    - `grep -c "aa-toggle" style.css` → 0
    - `grep -c "sample-text" style.css` → 0
    - `grep -c "sample-text:focus" style.css` → 0
    - `grep -c "badge--pass" style.css` → 0
    - `grep -c "badge--fail" style.css` → 0
    - `grep -c "swatch-pair" style.css` → 0
    - `grep -c "outline: 2px solid var(--topbar-fg" style.css` → ≥ 1 (unified focus rule)
    - `grep -c "outline: 2px solid var(--specimen" style.css` → ≥ 1 (preview focus rule)
    - `node --test test/british-spelling.test.js` — green (style.css must contain no forbidden American tokens outside allow-list)
  </acceptance_criteria>
  <verify>
    <automated>node --test test/british-spelling.test.js</automated>
  </verify>
  <done>style.css replaced with mockup CSS + appended unified focus block. All greps pass. All legacy rules retired. British-spelling test green.</done>
</task>

</tasks>

<verification>
- All legacy selectors gone (control-zone, sample-text, aa-toggle, badge--pass, swatch-pair, etc all grep to 0)
- Mockup selectors present (topbar-wrap, target-opt, pill.pass, fg-tag, bg-tag, alts, ratio, heading, digits)
- Focus rules reapplied against new DOM using topbar-fg / specimen custom properties
- British-spelling test stays green
</verification>

<success_criteria>
style.css is a verbatim copy of mockup CSS + the unified-focus append block. Opening index.html in a browser now shows the mockup design, though buttons don't yet work (JS rewiring lands in 05-06).
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-05-SUMMARY.md`.
</output>
</content>
</invoke>