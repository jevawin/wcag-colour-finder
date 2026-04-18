---
phase: 05-design-and-accessibility
plan: 02
type: execute
wave: 2
depends_on: [05-01]
files_modified:
  - index.html
  - style.css
  - app.js
  - test/app.test.js
autonomous: true
requirements: [UI-01, UI-02, UI-03, A11Y-02]
must_haves:
  truths:
    - "Page renders as two zones: control zone (top, full-bleed --user-colour bg) and preview zone (bottom, 50/50 light/dark split on desktop)"
    - "H1 reads 'WCAG colour finder'. CTA reads 'Find 5 →'. Attribution reads 'Inspired by colourcontrast.cc'"
    - "Every badge contains a `<span aria-hidden=\"true\">` icon and a visible Pass/Fail text label"
    - "Pass badges use --pass-bg / --pass-text derived from --user-colour (color-mix in CSS, JS fallback ensures ≥4.5:1)"
    - "Fail badges use white bg, #6b7280 text, 1px #d1d5db border"
    - ".badge-area on both panels has aria-live=\"polite\""
    - "Control-zone chrome text auto-switches between #000000 and #ffffff based on chooseChromeForeground(user-colour)"
    - "British-spelling audit test passes"
  artifacts:
    - path: "index.html"
      provides: "Two-zone wrapper divs, revised H1/CTA/copy, badge icon spans, aria-live on .badge-area, .control-zone warning region"
      contains: "class=\"control-zone\""
    - path: "style.css"
      provides: "Two-zone layout CSS, --pass-bg/--pass-text custom props via color-mix, badge--pass/badge--fail rules, hex-pill, Find 5 button, AA/AAA toggle styles, typography scale"
      contains: "--pass-bg:"
    - path: "app.js"
      provides: "setBadge rewired to use buildBadgeHTML; render() applies chooseChromeForeground + deriveBadgeColors on every hex change"
      contains: "buildBadgeHTML("
  key_links:
    - from: "app.js render()/applyColor()"
      to: "CSS custom properties --user-colour, --pass-bg, --pass-text, --control-zone-text"
      via: "documentElement.style.setProperty"
      pattern: "setProperty\\('--(pass-bg|pass-text|control-zone-text|user-colour)'"
    - from: "index.html .badge elements"
      to: "app.js setBadge -> buildBadgeHTML"
      via: "innerHTML assignment"
      pattern: "innerHTML\\s*=\\s*buildBadgeHTML"
    - from: "index.html .badge-area"
      to: "screen readers"
      via: "aria-live polite"
      pattern: "aria-live=\"polite\""
---

<objective>
Rebuild the page layout against the mockup ground truth in 05-UI-SPEC.md and wire the Wave-1 pure helpers (buildBadgeHTML, chooseChromeForeground, deriveBadgeColors) into the DOM.

Purpose: Deliver UI-01 (monochrome chrome with --user-colour only on the permitted elements), UI-02 (colourcontrast.cc aesthetic — two zones, typography scale, clean spacing), UI-03 (British copy swept through visible strings), and A11Y-02 (pass/fail via icon + text, aria-live badge regions).

Output: A polished, monochrome-chrome two-zone page with derived-tint pass badges and aria-live updates. No focus/responsive work yet — that's Plan 03.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-CONTEXT.md
@.planning/phases/05-design-and-accessibility/05-RESEARCH.md
@.planning/phases/05-design-and-accessibility/05-UI-SPEC.md
@.planning/phases/05-design-and-accessibility/05-01-SUMMARY.md
@index.html
@style.css
@app.js

<interfaces>
New exports from Plan 01 (app.js):
```javascript
export function buildBadgeHTML(passes: boolean, label: string): string;
// Returns '<span aria-hidden="true">✓</span><span>Pass AA</span>' style markup.

export function chooseChromeForeground(userHex: string): '#000000' | '#ffffff';
// Returns whichever chrome colour passes AA against the user colour.

export function deriveBadgeColors(userHex: string): { passBg: string, passText: string };
// Returns a tinted pair with contrast >= 4.5:1, or the static green fallback.
```

Existing app.js render flow (lines 92–135):
- applyColor(hex) sets document.documentElement.style setProperty('--user-colour', '#' + hex)
- render(hex) calls applyColor then updates each panel's ratio + badges
- setBadge(root, selector, passes, label) currently writes textContent — must switch to innerHTML with buildBadgeHTML
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Two-zone HTML structure, British copy sweep, badge markup</name>
  <files>index.html</files>
  <read_first>
    - index.html (current full markup — all ~90 lines)
    - 05-UI-SPEC.md sections: "Layout: Two-Zone Structure", "Top Zone — Control Zone Spec", "Bottom Zone — Preview Zone Spec", "Badge Spec" (structure HTML), "Copywriting Contract" (every row)
    - 05-CONTEXT.md D-05, D-08, D-14
    - test/british-spelling.test.js output from Plan 01 summary — fix every offender it lists
  </read_first>
  <action>
    1. Wrap existing body content in two new divs:
       ```html
       <div class="control-zone">
         <!-- H1, attribution, description, hex input pill, Find 5 button, AA/AAA toggle, #swatch-row -->
         <!-- also: #light-bg-input, #dark-bg-input (keep their current error regions) -->
         <p id="top-zone-warning" hidden aria-live="polite">Warning: current colour may reduce readability of page controls.</p>
       </div>
       <div class="preview-zone">
         <div class="panels">
           <!-- existing .panel--light and .panel--dark, updated per below -->
         </div>
       </div>
       ```
    2. H1 copy: `<h1>WCAG colour finder</h1>`. Add attribution line: `<p class="attribution">Inspired by <a href="https://colourcontrast.cc">colourcontrast.cc</a></p>`.
    3. Description paragraph below attribution (exact text from UI-SPEC Copywriting Contract):
       "Enter a hex code then press "Find 5" to find close pairs accessible on light and dark backgrounds."
    4. CTA button text: change to `Find 5 →` (literal right-arrow glyph). Keep id `#find-btn`.
    5. Add AA/AAA toggle segmented control after the Find button:
       ```html
       <div class="aa-toggle" role="group" aria-label="Contrast threshold">
         <button type="button" class="aa-toggle-btn" data-threshold="AA"  aria-pressed="true">AA</button>
         <button type="button" class="aa-toggle-btn" data-threshold="AAA" aria-pressed="false">AAA</button>
       </div>
       ```
    6. In each `.panel--*`, update copy per UI-SPEC Copywriting Contract:
       - Sample heading default: "The quick brown fox"
       - Sample paragraph default: "Typography should be readable first. This paragraph uses the current base colour at 16 px against the chosen background — the small-text benchmark for WCAG body copy."
       - Numerals row (new): `<p class="numerals">0 1 2 3 4 5 6 7 8 9</p>`
       - Foreground colour label + pill, Background colour label + pill (structure per UI-SPEC "Light panel" list items 1–4). Use `<button type="button" class="copy-btn" aria-label="Copy hex to clipboard" title="Copy hex to clipboard">⎘</button>` for the copy icon.
       - Large contrast ratio display: `<p class="contrast-ratio contrast-ratio--large"><span class="ratio">—</span></p>` (keep existing `.ratio` class so app.js still updates it; wrap it in the new large class).
    7. Badge markup: each `.badge` should be empty at load — app.js will fill it via setBadge → innerHTML → buildBadgeHTML. Keep existing badge classes (`badge-aa`, `badge-aaa`, `badge-aa-lg`, `badge-aaa-lg`). Wrap each panel's four badges in `<div class="badge-area" aria-live="polite">…</div>` (may already partially exist — add `aria-live="polite"` if missing, per D-08).
    8. British-spelling sweep: grep the file (and app.js) for every token flagged in Plan 01's british-spelling test output and replace with the British form. Do NOT rename JS identifiers or CSS property values — only visible copy and aria-label strings.
    9. `<title>` stays "WCAG Colour Finder" (already compliant per UI-SPEC).
    Addresses UI-01, UI-02, UI-03, A11Y-02 (structural part), D-05, D-08, D-14.
  </action>
  <verify>
    <automated>node --test test/british-spelling.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c 'class="control-zone"' index.html` = 1
    - `grep -c 'class="preview-zone"' index.html` = 1
    - `grep -c '>WCAG colour finder<' index.html` = 1
    - `grep -c '>Find 5' index.html` ≥ 1 (button label present)
    - `grep -c 'Inspired by' index.html` = 1
    - `grep -c 'aria-live="polite"' index.html` ≥ 5 (3 existing error regions + top-zone-warning + 2 badge-areas)
    - `grep -c 'aa-toggle-btn' index.html` ≥ 2
    - `grep -c 'numerals' index.html` ≥ 2 (one per panel)
    - `grep -c 'copy-btn' index.html` ≥ 2 (one per panel per pill — may be ≥4; accept ≥2)
    - `node --test test/british-spelling.test.js` exits 0
  </acceptance_criteria>
  <done>
    index.html mirrors the UI-SPEC mockup structure, all visible copy uses British spelling, badge areas have aria-live, and the british-spelling test is green.
  </done>
</task>

<task type="auto">
  <name>Task 2: Two-zone CSS — layout, typography, badge styles, pass-badge derivation</name>
  <files>style.css</files>
  <read_first>
    - style.css (full file — 416 lines — especially `:root` custom properties, `.panels`, `.badge-*`, `.find-btn`)
    - 05-UI-SPEC.md sections: "Spacing Scale", "Typography", "Colour" (custom properties + pass-badge derivation), "Top Zone — Control Zone Spec", "Badge Spec" (CSS dimensions + pass + fail)
    - 05-RESEARCH.md Pattern 3 (pass-badge CSS with JS safety), "Pass Badge Derivation" code block
    - 05-CONTEXT.md D-01, D-06 (overridden), D-13 (discretion on numeric details)
  </read_first>
  <action>
    1. Retain existing spacing tokens (`--space-xs` 4px through `--space-3xl` 64px) and retain `--chrome-dark`, `--chrome-light`, `--light-bg`, `--dark-bg`, `--surface`, `--border`, `--error`, `--user-colour`. Drop any static `--pass-bg: #16a34a` / `--badge-text` rules in `:root`.
    2. Add to `:root`:
       ```css
       --pass-bg: color-mix(in oklch, var(--user-colour) 30%, #ffffff);
       --pass-text: color-mix(in oklch, var(--user-colour) 80%, #000000);
       --control-zone-text: #000000;
       ```
       app.js will override `--pass-bg`, `--pass-text`, `--control-zone-text` as inline styles on `:root` when the JS contrast check runs (Task 3).
    3. Layout rules:
       ```css
       body { margin: 0; background: var(--surface); color: var(--chrome-dark); font-family: system-ui, -apple-system, sans-serif; }
       .control-zone { background: var(--user-colour); color: var(--control-zone-text); padding: var(--space-3xl) var(--space-md); }
       .preview-zone { background: var(--surface); }
       .panels { display: flex; gap: 0; } /* 50/50 split, full-bleed halves */
       .panel--light { flex: 1; background: var(--light-bg); color: var(--chrome-dark); padding: var(--space-lg); }
       .panel--dark  { flex: 1; background: var(--dark-bg);  color: var(--chrome-light); padding: var(--space-lg); }
       ```
    4. Typography (UI-SPEC Typography table):
       ```css
       h1 { font-size: clamp(28px, 4vw, 32px); font-weight: 700; line-height: 1.1; margin: 0; }
       .attribution { font-size: 14px; }
       .attribution a { color: currentColor; text-decoration: underline; }
       body, p { font-size: 16px; font-weight: 400; line-height: 1.5; }
       .sample-heading { font-size: 20px; font-weight: 700; line-height: 1.2; }
       .numerals { font-family: ui-monospace, 'Courier New', monospace; font-size: clamp(28px, 3vw, 32px); font-weight: 700; line-height: 1.1; }
       .contrast-ratio--large { font-family: ui-monospace, 'Courier New', monospace; font-size: clamp(56px, 8vw, 72px); font-weight: 700; line-height: 1; color: var(--chrome-dark); margin: var(--space-md) 0; }
       .panel--dark .contrast-ratio--large { color: var(--chrome-light); }
       #hex-input, .hex-pill .hex-value, .bg-input { font-family: ui-monospace, 'Courier New', monospace; font-weight: 700; font-size: 20px; }
       ```
    5. Hex input pill, Find button, AA/AAA toggle (UI-SPEC Top Zone specs):
       ```css
       .hex-pill { background: #ffffff; border-radius: 9999px; min-height: 56px; display: inline-flex; align-items: center; gap: var(--space-sm); padding: 0 var(--space-md); }
       .hex-pill .swatch-indicator { width: 24px; height: 24px; border-radius: 4px; background: var(--user-colour); }
       #find-btn { background: var(--chrome-dark); color: var(--chrome-light); border: none; border-radius: 9999px; min-height: 56px; padding: 0 var(--space-lg); font-size: 16px; font-weight: 700; cursor: pointer; }
       .aa-toggle { display: inline-flex; min-height: 56px; border: 1px solid var(--chrome-dark); border-radius: 9999px; overflow: hidden; }
       .aa-toggle-btn { background: #ffffff; color: var(--chrome-dark); border: none; padding: 0 var(--space-lg); font-weight: 700; cursor: pointer; }
       .aa-toggle-btn[aria-pressed="true"] { background: var(--chrome-dark); color: var(--chrome-light); }
       ```
    6. Badge rules (replace any existing `.badge*` rules):
       ```css
       .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 400; line-height: 1.4; }
       .badge--pass { background: var(--pass-bg); color: var(--pass-text); border: none; }
       .badge--fail { background: #ffffff; color: #6b7280; border: 1px solid #d1d5db; }
       .badge-area { display: flex; flex-wrap: wrap; gap: var(--space-sm); margin-top: var(--space-lg); }
       ```
    7. Result cards (retain existing `.swatch-pair` sizing; update borders only):
       ```css
       .swatch-pair { background: #ffffff; border: 1px solid #000000; border-radius: 8px; padding: var(--space-sm); }
       .swatch-pair--selected { border-width: 3px; border-color: #000000; }
       ```
       Remove any rule that sets `.swatch-pair--selected { outline: ... var(--user-colour) }` or `.find-btn:focus { outline-color: var(--user-colour) }` (Plan 03 will finalise focus — for now just delete the user-colour tints on these elements to satisfy UI-01 scan).
    8. Mobile stack (minimal — Plan 03 will add the full tabs pattern):
       ```css
       @media (max-width: 700px) { .panels { flex-direction: column; } }
       ```
    9. Delete any orphaned rules referencing `--badge-text` or the old static `--pass-bg: #16a34a`.
    Addresses UI-01, UI-02, UI-SPEC Colour / Typography / Layout / Badge sections, D-06 override, D-13.
  </action>
  <verify>
    <automated>grep -c "^--pass-bg: color-mix" style.css || grep -c "  --pass-bg: color-mix" style.css</automated>
  </verify>
  <acceptance_criteria>
    - `grep -n "var(--user-colour)" style.css | wc -l` ≤ 5 (only permitted uses: `.control-zone` bg, `.hex-pill .swatch-indicator`, `.sample-text` foreground via existing rule, `--pass-bg`/`--pass-text` definitions, `.sample-text:focus` outline)
    - `grep -c "outline-color: var(--user-colour)" style.css` = 0  (user-colour removed from focus rings; D-01 / UI-01)
    - `grep -c "color-mix(in oklch, var(--user-colour)" style.css` ≥ 2 (pass-bg + pass-text)
    - `grep -c "\.badge--pass" style.css` = 1
    - `grep -c "\.badge--fail" style.css` = 1
    - `grep -c "\.control-zone" style.css` ≥ 1
    - `grep -c "@media (max-width: 700px)" style.css` ≥ 1
    - `grep -c "ui-monospace" style.css` ≥ 2 (numerals + contrast-ratio + hex value)
  </acceptance_criteria>
  <done>
    style.css implements the two-zone layout, typography scale, derived pass-badge tokens, and badge pill styles exactly per UI-SPEC. No `--user-colour` remains in focus / selected-ring contexts.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire setBadge + applyColor to helpers; add AA/AAA toggle + copy-btn handlers</name>
  <files>app.js, test/app.test.js</files>
  <read_first>
    - app.js lines 92–135 (applyColor, setBadge, render) — the call sites to change
    - app.js lines ~193–230 (existing event handlers — hex input, find button, swatch-pair click) to see the established pattern
    - 05-RESEARCH.md Pattern 3 (ensurePassBadgeContrast), Pattern 4 (checkTopZoneContrast), Pattern 6 (AA/AAA toggle ARIA)
    - 05-UI-SPEC.md "Interaction Contract" (hex input live update, AA/AAA toggle, copy icon)
  </read_first>
  <behavior>
    - render(hex) still exists and, after this plan, also:
      * calls deriveBadgeColors(hex) and sets --pass-bg / --pass-text as inline custom properties on document.documentElement (overriding the CSS color-mix defaults with contrast-verified JS values)
      * calls chooseChromeForeground(hex) and sets --control-zone-text and toggles #top-zone-warning.hidden accordingly
    - setBadge still accepts (root, selector, passes, label) but now assigns `el.innerHTML = buildBadgeHTML(passes, label)` and retains the badge--pass / badge--fail class toggling
    - AA/AAA toggle: clicking an .aa-toggle-btn flips aria-pressed on both buttons and stores the current threshold (no re-search — just state for future filtering; a later plan may use it). Threshold default: 'AA'.
    - Copy button: clicking a .copy-btn reads the adjacent hex value and calls navigator.clipboard.writeText with guard (`if (navigator.clipboard && navigator.clipboard.writeText)`). Announces via a visually-hidden aria-live region. Silent on unsupported environments.
  </behavior>
  <action>
    1. In setBadge (app.js ~line 107): replace `el.textContent = (passes ? 'Pass ' : 'Fail ') + label` with `el.innerHTML = buildBadgeHTML(passes, label)`. Keep the classList.toggle calls. Add comment `// Delegates markup to buildBadgeHTML for A11Y-02 icon + text cue`.
    2. In render(hex) (app.js ~line 133), after applyColor:
       ```
       const { passBg, passText } = deriveBadgeColors(hex);
       document.documentElement.style.setProperty('--pass-bg',   passBg);
       document.documentElement.style.setProperty('--pass-text', passText);

       const chromeFg = chooseChromeForeground(hex);
       document.documentElement.style.setProperty('--control-zone-text', chromeFg);
       const warn = document.getElementById('top-zone-warning');
       if (warn) warn.hidden = (chromeFg === '#000000');
       ```
    3. AA/AAA toggle wiring. Below the existing event handlers:
       ```
       const aaToggleBtns = document.querySelectorAll('.aa-toggle-btn');
       let currentThreshold = 'AA';
       aaToggleBtns.forEach(btn =&gt; {
         btn.addEventListener('click', () =&gt; {
           currentThreshold = btn.dataset.threshold;
           aaToggleBtns.forEach(b =&gt; b.setAttribute('aria-pressed', String(b === btn)));
         });
       });
       ```
       (Use real arrow syntax; currentThreshold is captured but not yet consumed — a comment should flag it for future use.)
    4. Copy button wiring:
       ```
       document.querySelectorAll('.copy-btn').forEach(btn =&gt; {
         btn.addEventListener('click', async () =&gt; {
           const target = btn.previousElementSibling; // the hex-value span
           const text = target ? target.textContent.trim().replace(/^#/, '') : '';
           if (!text) return;
           try {
             if (navigator.clipboard && navigator.clipboard.writeText) {
               await navigator.clipboard.writeText(text);
             }
             const live = document.getElementById('copy-live');
             if (live) { live.textContent = ''; live.textContent = 'Copied'; setTimeout(() =&gt; { live.textContent = ''; }, 1500); }
           } catch (_e) { /* silent */ }
         });
       });
       ```
       Add `<span id="copy-live" class="sr-only" aria-live="polite"></span>` to index.html in the control-zone warning area if not present (coordinate with Task 1; if Task 1 missed it, add here).
    5. Extend test/app.test.js with one new test: confirm `buildBadgeHTML(true, 'AA')` is identical across runs (regression guard for the markup contract that setBadge now relies on).
    Addresses A11Y-02 wiring, UI-SPEC Interaction Contract, RESEARCH Pattern 3+4+6.
  </action>
  <verify>
    <automated>node --test test/</automated>
  </verify>
  <acceptance_criteria>
    - `grep -n "innerHTML = buildBadgeHTML" app.js` = 1
    - `grep -n "deriveBadgeColors(" app.js` ≥ 1 (call site inside render)
    - `grep -n "chooseChromeForeground(" app.js` ≥ 1
    - `grep -n "setProperty('--pass-bg'" app.js` = 1
    - `grep -n "setProperty('--control-zone-text'" app.js` = 1
    - `grep -n "aa-toggle-btn" app.js` ≥ 1 (handler present)
    - `grep -n "navigator.clipboard" app.js` ≥ 1 (copy handler present)
    - `node --test test/` all suites exit 0, including british-spelling.test.js and badge-markup.test.js
  </acceptance_criteria>
  <done>
    Every badge renders via buildBadgeHTML; --pass-bg/--pass-text/--control-zone-text are overridden in JS with contrast-verified values on every hex change; AA/AAA toggle state flips; copy icon copies to clipboard and announces "Copied"; full suite green.
  </done>
</task>

</tasks>

<verification>
1. `node --test test/` — full suite green (72+ assertions across 7 files)
2. Manual: open index.html via `python3 -m http.server 8080`, load http://localhost:8080. Confirm:
   - Top zone is full-bleed user colour (default #2563EB shows as blue band)
   - Bottom zone is 50/50 light/dark
   - Pass badges render with tinted mint-green style (derived from #2563EB)
   - Typing `#111111` makes control-zone text switch to white (chooseChromeForeground path)
   - Typing `#2563eb` shows top-zone warning hidden OR visible as appropriate
   - All visible copy is British-spelt
</verification>

<success_criteria>
1. index.html has `.control-zone` and `.preview-zone` wrappers, H1 "WCAG colour finder", CTA "Find 5 →"
2. style.css defines `--pass-bg: color-mix(...)` and `--pass-text: color-mix(...)`, removes all `--user-colour` focus-ring usage
3. app.js setBadge uses buildBadgeHTML; render() applies deriveBadgeColors + chooseChromeForeground
4. Every badge has aria-hidden icon + visible Pass/Fail word (A11Y-02)
5. British-spelling test green (UI-03)
6. Full test suite green
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-02-SUMMARY.md` documenting: structural HTML diff, new CSS tokens, setBadge rewiring, deriveBadgeColors call site, AA/AAA toggle state variable (flagged as unused by later filtering), any deviations from UI-SPEC.
</output>
