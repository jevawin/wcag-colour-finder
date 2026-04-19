---
phase: 05-design-and-accessibility
plan: 06
type: execute
wave: 3
depends_on:
  - 05-04
  - 05-05
files_modified:
  - app.js
  - test/app.test.js
autonomous: true
gap_closure: true
requirements:
  - UI-01
  - UI-02
  - UI-03
  - A11Y-01
  - A11Y-02
must_haves:
  truths:
    - "Typing in #base-text updates --topbar-bg and auto-derives --topbar-fg (white or black, whichever wins contrast)"
    - "On every valid hex input change, the search runs and first result auto-applies to both panels"
    - "Segmented AA|AAA toggle is single-select and drives threshold: AAA=7.0, AA=4.5"
    - "Find button re-rolls (clears applied pair, runs search again) and shows 'Searching…' label"
    - "fg-tag copy button copies hex to clipboard with ✓ feedback for ~1.2s"
    - "bg-tag colour picker and text input both update the background hex"
    - "Ratio span and pills grid re-render per panel with current fg vs bg contrast"
    - "Hash route updates as user types (URL hydrate + debounced sync still work)"
  artifacts:
    - path: "app.js"
      provides: "DOM wiring against new mockup IDs + auto-find pipeline + segmented toggle + topbar-fg derivation + copy buttons"
      exports: ["buildBadgeState", "expandHex", "formatRatio", "chooseChromeForeground"]
    - path: "test/app.test.js"
      provides: "Updated assertions matching new API surface"
  key_links:
    - from: "#base-text input event"
      to: "autoFindAndApply()"
      via: "debounced or direct call on valid hex"
      pattern: "autoFindAndApply"
    - from: ".target-opt click"
      to: "state.target + autoFindAndApply"
      via: "click handler"
      pattern: "data-target"
    - from: ".copy-btn click"
      to: "navigator.clipboard.writeText"
      via: "delegated click handler"
      pattern: "navigator\\.clipboard"
---

<objective>
Rewire app.js to drive the new DOM from 05-04. Replace the old two-zone wiring with: (1) topbar-fg auto-derivation, (2) auto-find pipeline that runs on every valid input change, (3) segmented AA|AAA toggle that maps to threshold, (4) fg-tag/bg-tag with embedded colour-picker and copy buttons, (5) per-panel ratio + pills rendering, (6) Find button re-roll with "Searching…" label. Keep URL hash hydrate + debounced sync.

Purpose: Close gaps G3 (segmented toggle wired to threshold), G4 (fg-tag/bg-tag + copy buttons), G8 (auto-find + re-roll). Preserve UI-03 (British spelling) and A11Y-02 (pill labels include Pass/Fail text with aria-hidden glyph). Retain the existing pure-function exports for test continuity.

Output: new app.js that drives the mockup DOM; updated test/app.test.js aligned to the new DOM.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-VERIFICATION.md
@.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html
@app.js
@colour-engine.js
@variant-search.js
@url-state.js
@test/app.test.js
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Rewire app.js to new DOM with auto-find + segmented toggle + copy buttons</name>
  <files>app.js, test/app.test.js</files>
  <read_first>
    - `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 603-950 (full `<script>` block: Render, renderAlts, findAccessible, Wiring, autoFindAndApply, tabs, target-toggle, copy handler, Find button)
    - `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` gaps G3, G4, G8
    - current `app.js` (entire file — will be replaced)
    - current `test/app.test.js` (entire file — assertions may need update)
    - `colour-engine.js` exports: parseHex, contrastRatio, passesAA, passesAAA, passesAALarge, passesAALarge
    - `variant-search.js` exports: findVariantPairs, DISTANCE_WARNING_THRESHOLD
    - `url-state.js` exports: parseHashState, buildHashPath
  </read_first>
  <behavior>
    - buildBadgeState(ratio) unchanged — returns {aa, aaa, aaLarge, aaaLarge}
    - expandHex / formatRatio unchanged
    - chooseChromeForeground(hex) — returns '#000000' when black vs hex ≥ 4.5, else '#ffffff'. Used for topbar-fg derivation.
    - buildPillHTML(label, passes) — new helper. Returns HTML string `<div class="pill-wrap"><span class="pill pass|fail"><span class="glyph" aria-hidden="true">✓|✕</span>Pass|Fail</span><span class="pill-label">${label}</span></div>`. The pill label is visible (e.g. "AA Normal"), glyph is aria-hidden, word "Pass"/"Fail" is screen-reader-readable so A11Y-02 holds.
    - Test for buildPillHTML pass case: contains 'pass', '✓', 'Pass', and the label string, and contains 'aria-hidden="true"' on the glyph.
    - Test for buildPillHTML fail case: contains 'fail', '✕', 'Fail', and the label.
  </behavior>
  <action>
    Replace `app.js` with the following structure. Retain imports from `colour-engine.js`, `variant-search.js`, `url-state.js` (we keep our engine, not the mockup's inlined maths).

    Required exports (pure functions, before DOM guard, for test continuity):
    ```
    export { buildBadgeState, expandHex, formatRatio, chooseChromeForeground, buildPillHTML };
    ```

    Pure-function bodies:
    - `buildBadgeState(ratio)` — unchanged from current (uses passesAA etc).
    - `expandHex(hex)` — unchanged.
    - `formatRatio(ratio)` — unchanged (returns "4.48:1").
    - `chooseChromeForeground(userHex)` — unchanged (returns '#000000' if contrast with black ≥ 4.5, else '#ffffff').
    - `buildPillHTML(label, passes)` — NEW. Must produce exactly:
      `'<div class="pill-wrap"><span class="pill ' + (passes ? 'pass' : 'fail') + '"><span class="glyph" aria-hidden="true">' + (passes ? '✓' : '✕') + '</span>' + (passes ? 'Pass' : 'Fail') + '</span><span class="pill-label">' + label + '</span></div>'`
      This satisfies A11Y-02: glyph is aria-hidden, word "Pass"/"Fail" is readable. The 4 pills per panel cover AA Normal / AA Large / AAA Normal / AAA Large.

    Remove the exports `buildBadgeHTML` and `deriveBadgeColors` — no longer used (the new pill pattern replaces the old badge markup; the mockup has no derived pass-tint).

    DOM wiring (inside `if (typeof document !== 'undefined')`):

    1. Element cache:
       ```
       const baseText = document.getElementById('base-text');
       const baseColor = document.getElementById('base-color');
       const baseSwatch = document.getElementById('base-swatch');
       const findBtn = document.getElementById('find-btn');
       const findLabel = document.getElementById('find-btn-label');
       const altsEl = document.getElementById('alts');
       const targetToggle = document.getElementById('target-toggle');
       const topbar = document.getElementById('topbar-wrap');
       const previewLight = document.getElementById('preview-light');
       const previewDark = document.getElementById('preview-dark');
       const lightFgHex = document.getElementById('light-fg-hex');
       const darkFgHex = document.getElementById('dark-fg-hex');
       const lightBgColor = document.getElementById('light-bg-color');
       const lightBgText = document.getElementById('light-bg-text');
       const darkBgColor = document.getElementById('dark-bg-color');
       const darkBgText = document.getElementById('dark-bg-text');
       const lightRatio = document.getElementById('light-ratio');
       const darkRatio = document.getElementById('dark-ratio');
       const lightPills = document.getElementById('light-pills');
       const darkPills = document.getElementById('dark-pills');
       ```

    2. State:
       ```
       const state = { base: '2563EB', light: 'FFFFFF', dark: '111111', target: 'AA', alts: [], appliedLight: null, appliedDark: null };
       let urlSyncTimer = null;
       const URL_DEBOUNCE_MS = 300;
       ```

    3. applyTopbar(hex) — sets `--topbar-bg: #${hex}` and `--topbar-fg` derived via chooseChromeForeground. Use topbar.style.setProperty.

    4. renderPanel(panelEl, fgHex, bgHex, ratioEl, pillsEl, fgHexLabelEl) — sets `panelEl.style.background = '#' + bgHex`, sets `--specimen: '#' + fgHex`, `--bg-for-specimen: '#' + bgHex` on panelEl. Computes ratio via `contrastRatio('#' + fgHex, '#' + bgHex)`. Sets `ratioEl.textContent = ratio.toFixed(2)`. Sets `fgHexLabelEl.textContent = '#' + fgHex`. Renders pills: `pillsEl.innerHTML = buildPillHTML('AA Normal', state.aa) + buildPillHTML('AA Large', state.aaLarge) + buildPillHTML('AAA Normal', state.aaa) + buildPillHTML('AAA Large', state.aaaLarge)` where state = buildBadgeState(ratio).

    5. renderPreviews() — calls applyTopbar(state.base); updates baseSwatch background + baseColor value; lightSpecHex = state.appliedLight || state.base; darkSpecHex = state.appliedDark || state.base; calls renderPanel for each side.

    6. renderAlts() — renders 5 placeholder `.alt.placeholder` divs when state.alts is empty (each `<div class="alt placeholder"><div class="chips"><span class="chip"></span></div><div class="hex mono">—</div></div>`). When state.alts has entries, render one `.alt` per entry with `<div class="chips"><span class="chip light"></span>${isShade ? '<span class="chip dark"></span>' : ''}</div><div class="hex mono">${isShade ? a.lightHex + ' / ' + a.darkHex : '#' + a.lightHex}</div>` and set `--alt-light: '#' + a.lightHex`, `--alt-dark: '#' + a.darkHex`. On click, set state.appliedLight/Dark and call renderPreviews + renderAlts. Mark selected with `outline: 2px solid var(--topbar-fg); outline-offset: 2px;` inline styles when `state.appliedLight === a.lightHex && state.appliedDark === a.darkHex`.

    7. autoFindAndApply() — calls findVariantPairs('#' + state.base, '#' + state.light, '#' + state.dark, { threshold: state.target === 'AAA' ? 7.0 : 4.5 }). Maps results into alts with shape { lightHex, darkHex, distance }. If first run and no applied pair, set state.appliedLight/Dark to alts[0]. Calls renderAlts + renderPreviews.

       IMPORTANT: `findVariantPairs` in our codebase currently takes only (fg, lightBg, darkBg) and uses AA threshold internally. You may need a minimal refactor: check the existing signature in `variant-search.js` and extend with an optional `{ threshold }` option defaulting to 4.5 for backward compat. If refactor is nontrivial, instead call findVariantPairs as-is and post-filter results by `contrastRatio` against the selected threshold. Document the choice in the SUMMARY.

    8. setBase(hex) — validate via parseHex, store in state.base, update baseText.value + baseColor.value + baseSwatch background. Reset state.appliedLight/Dark to null (so auto-find picks first new result). Call autoFindAndApply. Call scheduleUrlSync.

    9. setLightBg(hex), setDarkBg(hex) — mirror setBase but for light/dark bg, update the respective `.swatch-sm` background via parent element lookup, then autoFindAndApply + scheduleUrlSync.

    10. wireHexInput(inputEl, setter) — on `input`, sanitise value to /[0-9a-fA-F]/ chars uppercase slice 0,6; if length 3 or 6 and parseHex succeeds, call setter.

    11. Wire baseText, lightBgText, darkBgText with wireHexInput. Wire baseColor / lightBgColor / darkBgColor with `input` event calling setter with e.target.value.

    12. Target toggle:
        ```
        targetToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.target-opt'); if (!btn) return;
          state.target = btn.dataset.target;
          targetToggle.querySelectorAll('.target-opt').forEach(b => b.classList.toggle('is-active', b === btn));
          state.appliedLight = null; state.appliedDark = null;
          autoFindAndApply();
        });
        ```
        AA → threshold 4.5, AAA → 7.0.

    13. Find button re-roll:
        ```
        findBtn.addEventListener('click', () => {
          findBtn.disabled = true;
          findLabel.textContent = 'Searching…';
          setTimeout(() => {
            state.appliedLight = null; state.appliedDark = null;
            autoFindAndApply();
            findBtn.disabled = false;
            findLabel.textContent = 'Find 5';
          }, 20);
        });
        ```

    14. Copy buttons — delegated listener on document for `.copy-btn`. If `data-copy-target`, read `document.getElementById(target).textContent` (strip leading `#`). Call `navigator.clipboard.writeText(text)`. Add `.copied` class for 1200ms.

    15. Mobile tabs — wire `.tab-btn` clicks to toggle `.is-visible` on preview-light / preview-dark and update `aria-selected`.

    16. URL hydrate + sync — keep existing parseHashState / buildHashPath logic. On load, hydrate state.base / state.light / state.dark from parsed hash; default to `2563EB / FFFFFF / 111111`. `scheduleUrlSync` writes `buildHashPath({ fg: state.base.toLowerCase(), lightBg: state.light.toLowerCase(), darkBg: state.dark.toLowerCase() })` after 300ms debounce.

    17. Initial boot: hydrate from URL, apply light/dark bg swatches, call autoFindAndApply.

    Update `test/app.test.js`:
    - Remove the import of `buildBadgeHTML` (no longer exported).
    - Replace any `buildBadgeHTML` tests with `buildPillHTML` tests asserting the new HTML string contract (see <behavior>).
    - Remove any tests referencing `deriveBadgeColors` (no longer exported).
    - Keep buildBadgeState / expandHex / formatRatio tests as-is.

    Check `test/badge-markup.test.js` — if it greps for old badge classes (`.badge--pass`), rewrite it to grep for `.pill.pass` / `.pill.fail` in style.css and `buildPillHTML` export in app.js. If refactor too disruptive, delete the file and note removal in SUMMARY. Prefer refactor over deletion.
  </action>
  <acceptance_criteria>
    - `grep -c "export { buildBadgeState, expandHex, formatRatio, chooseChromeForeground, buildPillHTML }" app.js` → 1
    - `grep -c "buildBadgeHTML" app.js` → 0
    - `grep -c "deriveBadgeColors" app.js` → 0
    - `grep -c "autoFindAndApply" app.js` → ≥ 2 (defined + called)
    - `grep -c "target-opt" app.js` → ≥ 1
    - `grep -c "data-target" app.js` → ≥ 1
    - `grep -c "'Searching…'" app.js` → 1
    - `grep -c "Find 5" app.js` → ≥ 1
    - `grep -c "navigator.clipboard" app.js` → ≥ 1
    - `grep -c "'--topbar-bg'" app.js` → ≥ 1
    - `grep -c "'--topbar-fg'" app.js` → ≥ 1
    - `grep -c "'--specimen'" app.js` → ≥ 1
    - `grep -c "buildPillHTML" app.js` → ≥ 5 (definition + 4 pills call OR 1 definition + looped render)
    - `grep -c "state.target === 'AAA' ? 7" app.js` → ≥ 1 (threshold wiring — also accept `state.target==='AAA'?7` or similar)
    - `node --test test/app.test.js` → green (tests must have been updated to match new exports)
    - `node --test test/british-spelling.test.js` → green
    - `node --test test/*.test.js` → green (full suite)
    - Open index.html in browser: typing `111111` in hex input → topbar goes black, topbar-fg goes white, alts populate, previews update (manual sanity — covered by 05-08 audit)
  </acceptance_criteria>
  <verify>
    <automated>node --test test/*.test.js</automated>
  </verify>
  <done>app.js drives the new DOM. All exports aligned. Auto-find runs on input change. Segmented toggle switches threshold. Find re-rolls with Searching… label. Copy buttons work. Full test suite green.</done>
</task>

</tasks>

<verification>
- app.js has no legacy DOM references (#hex-input, .sample-text, .aa-toggle-btn, .swatch-pair, .badge-area, etc — verify via grep returning 0 for each)
- New DOM references all present (base-text, target-toggle, alts, preview-light, preview-dark, light-ratio, dark-ratio, fg-tag via copy-btn delegation)
- Full test suite runs green
- British-spelling test stays green
</verification>

<success_criteria>
Opening index.html in a browser behaves like the mockup: typing a hex auto-finds, AA/AAA toggle flips threshold, Find re-rolls, copy buttons flash ✓, mobile tabs swap panels. All automated tests green.
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-06-SUMMARY.md`. Document whether findVariantPairs was refactored to accept threshold or whether post-filtering was used.
</output>
</content>
</invoke>