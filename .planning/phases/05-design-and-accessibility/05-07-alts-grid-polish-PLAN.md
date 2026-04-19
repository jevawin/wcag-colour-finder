---
phase: 05-design-and-accessibility
plan: 07
type: execute
wave: 4
depends_on:
  - 05-06
files_modified:
  - app.js
  - style.css
  - test/app.test.js
autonomous: true
gap_closure: true
requirements:
  - UI-01
  - UI-02
  - A11Y-02
  - A11Y-03
must_haves:
  truths:
    - "Alts grid renders 5 placeholder tiles with dashed border + 0.55 opacity when no results"
    - "Each alt tile is keyboard-focusable (either a button or [tabindex='0'] with role='button' + aria-label describing the pair)"
    - "Selected alt tile shows outline 2px solid var(--topbar-fg) + outline-offset 2px"
    - "Chip-pair rendering: light chip + dark chip when lightHex !== darkHex; single chip otherwise"
    - "Mobile layout collapses alts to 1-column with flex-row tile"
    - "No stale tests reference removed exports or DOM"
  artifacts:
    - path: "app.js"
      provides: "Alts rendered as buttons with proper aria-label + keyboard activation"
    - path: "style.css"
      provides: "Alts grid selected + focus states aligned with topbar-fg"
  key_links:
    - from: ".alt button click + Enter/Space"
      to: "state.appliedLight/Dark + renderPreviews"
      via: "click / keydown handlers"
      pattern: "appliedLight"
---

<objective>
Polish the alts grid rebuild from 05-06: ensure each alt tile is a focusable button with a clear aria-label, keyboard-activatable, and the selected state uses the unified focus pattern (outline var(--topbar-fg)). Close G9 (alt tile format, chip-pair rendering, placeholder state, selection outline) cleanly and make sure the a11y-audit wave (05-08) has solid keyboard + screen-reader foundations for the alts.

Purpose: Close remaining bits of G9 (keyboard + screen-reader parity for alt tiles). Any residual cleanup after 05-06 that the audit-ready build needs.

Output: alts rendered as semantic buttons with aria-labels; selected state uses CSS class instead of inline styles for audit traceability.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-VERIFICATION.md
@.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html
@app.js
@style.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Alts tiles as semantic buttons + .is-selected class</name>
  <files>app.js, style.css</files>
  <read_first>
    - `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 202-230 (alt CSS), 703-750 (renderAlts), 432-460 (mobile @media alts)
    - `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` gap G9 + A11y Audit Status section (keyboard walkthrough expectations)
    - current `app.js` (post-05-06) `renderAlts` implementation
    - current `style.css` (post-05-05) `.alt` / `.alt.placeholder` rules
  </read_first>
  <action>
    Update `app.js` `renderAlts` so each non-placeholder alt is a `<button type="button">` (not a `<div>`). Reasoning: they are clickable pair-selectors; button gives keyboard activation, focus ring, and screen-reader semantics for free.

    Each alt button must have:
    - `class="alt"` (plus `single` when lightHex === darkHex)
    - `type="button"`
    - `aria-label="Apply pair: light ${a.lightHex}, dark ${a.darkHex}"` (or `Apply single ${a.lightHex}` when not a shade pair)
    - Same inner markup as 05-06 (chips div + hex div)
    - Inline `--alt-light` and `--alt-dark` custom properties

    Placeholder tiles stay as `<div class="alt placeholder">` (non-interactive).

    Replace inline `outline` styles for selection with a CSS class:
    - Remove `el.style.outline = '2px solid var(--topbar-fg)'; el.style.outlineOffset = '2px';` from renderAlts
    - Instead `el.classList.add('is-selected')` when matched.

    Add to `style.css`, appended after the mockup alt rules:
    ```css
    /* --- Alts selection + focus (A11Y-03) --- */
    .alt.is-selected {
      outline: 2px solid var(--topbar-fg, #111111);
      outline-offset: 2px;
    }
    button.alt {
      font: inherit;
      text-align: left;
      color: inherit;
    }
    button.alt:focus-visible {
      outline: 2px solid var(--topbar-fg, #111111);
      outline-offset: 2px;
    }
    ```

    Also confirm that `style.css` already has no `.sample-text:focus` rule (should be gone after 05-05). If present, remove it in this task.

    Audit `test/app.test.js` for any leftover `buildBadgeHTML` or `deriveBadgeColors` references — remove any still present. Audit `test/badge-markup.test.js` — if it still asserts old `.badge--pass` patterns, update to grep for `.pill.pass` in `style.css` and `buildPillHTML` in `app.js`. Delete the file only if refactor is not feasible; explain in SUMMARY.
  </action>
  <acceptance_criteria>
    - `grep -c "aria-label=\"Apply" app.js` → ≥ 1 (OR template-literal equivalent: `grep -c "Apply pair" app.js` → ≥ 1 AND `grep -c "aria-label" app.js` → ≥ 3 — the template literal produces the label dynamically)
    - `grep -c "document.createElement('button')" app.js` → ≥ 1 (alt tile uses button element)
    - `grep -c "\.alt\.is-selected" style.css` → 1
    - `grep -c "button\.alt:focus-visible" style.css` → 1
    - `grep -c "sample-text:focus" style.css` → 0
    - `grep -c "\.alt\.placeholder" style.css` → ≥ 1 (retained from 05-05)
    - `grep -c "buildBadgeHTML" test/app.test.js` → 0
    - `grep -c "deriveBadgeColors" test/app.test.js` → 0
    - `node --test test/*.test.js` → green
  </acceptance_criteria>
  <verify>
    <automated>node --test test/*.test.js</automated>
  </verify>
  <done>Alt tiles are semantic buttons with aria-label. Selected state uses .is-selected class driven by --topbar-fg. Focus ring present via :focus-visible. All tests green. No stale badge references.</done>
</task>

</tasks>

<verification>
- Keyboard Tab order reaches each alt tile; Enter/Space applies the pair (manual check in 05-08)
- VoiceOver reads the aria-label when focused
- Selected tile visually outlined with --topbar-fg
</verification>

<success_criteria>
All gaps G1–G10 are fully closed after this plan. The build is ready for the formal a11y re-audit in 05-08.
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-07-SUMMARY.md`.
</output>
</content>
</invoke>