---
phase: 05-design-and-accessibility
plan: 03
type: execute
wave: 3
depends_on: [05-02]
files_modified:
  - style.css
  - index.html
  - app.js
  - .planning/phases/05-design-and-accessibility/05-VERIFICATION.md
autonomous: false
requirements: [UI-02, A11Y-01, A11Y-03]
must_haves:
  truths:
    - "Every interactive element except .sample-text shows a 2px solid chrome-colour outline at 2px offset when focused by keyboard"
    - ".sample-text retains its 2px dashed --user-colour-blended focus outline (D-03 exception)"
    - "Dark panel overrides the outline colour to --chrome-light so focus is visible against #111111"
    - "Below 700px, preview zone shows mobile tabs (Light/Dark) with ARIA tablist pattern, and content stacks"
    - "axe-core DevTools scan reports zero critical or serious violations"
    - "Manual keyboard walkthrough reaches every interactive element in logical order with no traps"
    - "VoiceOver reads badges as 'Pass AA' / 'Fail AA' (icon aria-hidden) and announces updates via aria-live"
    - "05-VERIFICATION.md records the audit outcome per success criterion"
  artifacts:
    - path: "style.css"
      provides: "Unified :focus outline block, dark-panel override, .sample-text:focus exception, responsive @media (max-width: 700px) with mobile tabs"
      contains: "outline: 2px solid var(--chrome-dark)"
    - path: "index.html"
      provides: "Mobile-only tablist (role=tablist, role=tab, role=tabpanel) above .panels"
      contains: "role=\"tablist\""
    - path: "app.js"
      provides: "Tab switch handler — aria-selected toggle + panel hidden toggle"
      contains: "tab-btn"
    - path: ".planning/phases/05-design-and-accessibility/05-VERIFICATION.md"
      provides: "Per-criterion audit checklist with evidence per D-16"
      contains: "UI-01"
  key_links:
    - from: "style.css :focus rule group"
      to: "All interactive elements (hex input, find btn, bg inputs, swatch-pair, tab-btn, aa-toggle-btn, copy-btn)"
      via: "CSS selector group"
      pattern: "#hex-input:focus,\\s*#find-btn:focus"
    - from: "app.js tab handler"
      to: ".panel--light / .panel--dark"
      via: "hidden attribute toggle"
      pattern: "panel--\\${target}"
---

<objective>
Finalise the accessibility layer: unified focus styles, dark-panel focus override, mobile tabs with ARIA, and the audit itself (axe-core + keyboard + VoiceOver) captured in VERIFICATION.md.

Purpose: Deliver A11Y-01 (passes WCAG AA self-audit), A11Y-03 (visible focus everywhere), and UI-02 (mobile polish — colourcontrast.cc has a tidy small-screen layout). This plan contains the human audit checkpoint per D-15 / D-16.

Output: Focus styles locked per D-09, mobile tabs working, VERIFICATION.md filled with audit evidence. Phase 5 is complete after this plan.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-CONTEXT.md
@.planning/phases/05-design-and-accessibility/05-RESEARCH.md
@.planning/phases/05-design-and-accessibility/05-UI-SPEC.md
@.planning/phases/05-design-and-accessibility/05-VALIDATION.md
@.planning/phases/05-design-and-accessibility/05-02-SUMMARY.md
@index.html
@style.css
@app.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unified focus styles + mobile tabs CSS + HTML/JS wiring</name>
  <files>style.css, index.html, app.js</files>
  <read_first>
    - 05-UI-SPEC.md sections: "Focus Specification (A11Y-03)", "Selected swatch-pair ring", "Responsive Breakpoints"
    - 05-RESEARCH.md "Unified Focus Rule (CSS)" code block, Pattern 5 (Mobile Tab Switch), Pitfall 2 (dark-panel invisible outline), Pitfall 6 (tabs missing ARIA)
    - 05-CONTEXT.md D-03, D-09, D-11
    - style.css current focus rules at approximately lines 106–117, 256–259, 300–303, 390–396 (per RESEARCH line 551)
  </read_first>
  <action>
    1. In style.css, locate and remove every existing per-element focus rule that uses `--user-colour` or duplicates the focus spec. Replace with a single unified block:
       ```css
       /* Unified focus — A11Y-03, D-09 */
       #hex-input:focus,
       #find-btn:focus,
       .bg-input:focus,
       .swatch-pair:focus,
       .tab-btn:focus,
       .aa-toggle-btn:focus,
       .copy-btn:focus,
       .attribution a:focus {
         outline: 2px solid var(--chrome-dark);
         outline-offset: 2px;
       }

       /* Dark-panel override — Pitfall 2 */
       .panel--dark #hex-input:focus,
       .panel--dark .bg-input:focus,
       .panel--dark .swatch-pair:focus,
       .panel--dark .copy-btn:focus,
       .panel--dark .tab-btn:focus {
         outline-color: var(--chrome-light);
       }

       /* Exception — sample text (D-03) */
       .sample-text:focus {
         outline: 2px dashed;
         outline-color: color-mix(in srgb, var(--user-colour) 50%, transparent);
         outline-offset: 2px;
       }

       /* Error-state outline overrides (retain existing pattern) */
       .input--error:focus { outline-color: var(--error); }

       /* Selected swatch-pair ring — mockup override of D-02 */
       .swatch-pair--selected { outline: 3px solid #000000; outline-offset: 2px; }
       ```
    2. In index.html, above the existing `.panels` container inside `.preview-zone`, add the mobile tablist:
       ```html
       <div class="panel-tabs" role="tablist" aria-label="Preview panel">
         <button type="button" class="tab-btn" role="tab" data-panel="light" aria-selected="true"  aria-controls="panel-light-content" id="tab-light">Light</button>
         <button type="button" class="tab-btn" role="tab" data-panel="dark"  aria-selected="false" aria-controls="panel-dark-content"  id="tab-dark">Dark</button>
       </div>
       ```
       Add `id="panel-light-content" role="tabpanel" aria-labelledby="tab-light"` to `.panel--light`, and the equivalent for `.panel--dark`.
    3. In style.css, hide the tabs on desktop and add mobile styles:
       ```css
       .panel-tabs { display: none; }
       @media (max-width: 700px) {
         .panels { flex-direction: column; }
         .panel-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--chrome-dark); }
         .tab-btn { flex: 1; background: #ffffff; color: var(--chrome-dark); border: none; padding: var(--space-md); font-weight: 700; cursor: pointer; min-height: 44px; }
         .tab-btn[aria-selected="true"] { background: var(--chrome-dark); color: var(--chrome-light); }
         .panel--light[hidden], .panel--dark[hidden] { display: none; }
         .swatch-list { flex-wrap: wrap; }
         .aa-toggle, #find-btn, .hex-pill { width: 100%; }
       }
       ```
    4. In app.js, add the tab switch handler (RESEARCH Pattern 5):
       ```
       const tabBtns = document.querySelectorAll('.tab-btn');
       const panelLight = document.querySelector('.panel--light');
       const panelDark  = document.querySelector('.panel--dark');
       function syncTabs(activePanel) {
         tabBtns.forEach(b =&gt; b.setAttribute('aria-selected', String(b.dataset.panel === activePanel)));
         if (panelLight) panelLight.hidden = (activePanel !== 'light');
         if (panelDark)  panelDark.hidden  = (activePanel !== 'dark');
       }
       tabBtns.forEach(btn =&gt; btn.addEventListener('click', () =&gt; syncTabs(btn.dataset.panel)));
       // On load, ensure panels are unhidden on desktop. A resize listener keeps behaviour sane:
       function applyTabState() {
         const isMobile = window.matchMedia('(max-width: 700px)').matches;
         if (!isMobile) {
           if (panelLight) panelLight.hidden = false;
           if (panelDark)  panelDark.hidden  = false;
         } else {
           const active = document.querySelector('.tab-btn[aria-selected="true"]');
           syncTabs(active ? active.dataset.panel : 'light');
         }
       }
       window.addEventListener('resize', applyTabState);
       applyTabState();
       ```
       Use real arrow syntax (=>) in actual source.
    Addresses A11Y-03, UI-02 mobile, D-03, D-09, D-11.
  </action>
  <verify>
    <automated>node --test test/</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "outline: 2px solid var(--chrome-dark)" style.css` ≥ 1
    - `grep -c "outline-color: var(--chrome-light)" style.css` ≥ 1
    - `grep -c "\.sample-text:focus" style.css` = 1 and that rule contains `dashed`
    - `grep -c "outline-color: var(--user-colour)" style.css` = 0  (A11Y-03 anchor — D-01 strict)
    - `grep -c "role=\"tablist\"" index.html` = 1
    - `grep -c "role=\"tab\"" index.html` ≥ 2
    - `grep -c "role=\"tabpanel\"" index.html` = 2
    - `grep -c "aria-controls=" index.html` ≥ 2
    - `grep -c "matchMedia('(max-width: 700px)')" app.js` = 1
    - `node --test test/` exits 0 (no regressions)
  </acceptance_criteria>
  <done>
    Unified focus ring in CSS, dark-panel override in CSS, mobile tablist present and wired with ARIA, full suite green.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Manual a11y audit — axe-core + keyboard + VoiceOver, record in VERIFICATION.md</name>
  <files>.planning/phases/05-design-and-accessibility/05-VERIFICATION.md</files>
  <read_first>
    - 05-CONTEXT.md D-15, D-16, D-17
    - 05-RESEARCH.md sections "axe-core DevTools Audit Steps", "Keyboard Walkthrough Sequence", "VoiceOver Smoke Test Sequence (macOS)"
    - 05-UI-SPEC.md "Accessibility Audit Targets (A11Y-01, A11Y-02, A11Y-03)"
  </read_first>
  <what-built>
    Phase 5 complete implementation: two-zone layout, badge icon+text, aria-live badge areas, unified focus, mobile tabs, British copy, derived pass-badge tint, chrome-foreground auto-switch.
  </what-built>
  <action>
    Perform the audit steps in <how-to-verify> below and record results in 05-VERIFICATION.md.
  </action>
  <verify>
    <automated>test -f .planning/phases/05-design-and-accessibility/05-VERIFICATION.md && grep -c "UI-01\|UI-02\|UI-03\|A11Y-01\|A11Y-02\|A11Y-03" .planning/phases/05-design-and-accessibility/05-VERIFICATION.md</automated>
    <manual>Human audit — see <how-to-verify> steps</manual>
  </verify>
  <how-to-verify>
    1. Serve the project:
       ```
       cd /Users/jamiepersonal/Developer/wcag-colour-finder
       python3 -m http.server 8080
       ```
       Open http://localhost:8080 in Chrome.

    2. axe-core DevTools scan (D-15 primary):
       - Open DevTools → axe DevTools panel → "Scan all of my page".
       - If axe DevTools is not installed, use DevTools → Lighthouse → Accessibility audit instead (covers axe-core rules).
       - Run at default colour (#2563EB). Record violation count.
       - Set hex to `#111111` (top-zone-warning should appear, chrome text flips to white). Re-scan.
       - Set hex to `#ffff00` (top-zone-warning should be hidden, chrome stays black). Re-scan.
       - Click "Find 5 →" and re-scan with swatch-list populated.
       - Target: zero critical and zero serious violations across all four scans.

    3. Keyboard walkthrough (RESEARCH "Keyboard Walkthrough Sequence"):
       - Press Tab from page load. Record the tab order.
       - Expected stops in order: hex input → Find 5 button → AA toggle → AAA toggle → (after click Find 5) each swatch-pair in turn → light-bg input → dark-bg input → foreground copy button (light) → background copy button (light) → sample text (light) → foreground copy button (dark) → background copy button (dark) → sample text (dark).
       - Confirm every stop shows a visible 2px outline. Sample text shows a dashed blended outline (D-03).
       - Confirm Enter/Space activate buttons. No tab traps.

    4. VoiceOver smoke test (macOS, Cmd+F5):
       - Navigate to hex input. VO reads "Hex colour code, edit text".
       - Type `#ff0000`. Confirm `.badge-area` polite region announces badge changes (or that chatter is acceptable per D-08).
       - Activate Find 5 button. VO reads "Find 5, button".
       - Navigate to first result card. VO reads the card's aria-label.
       - Activate (Space). VO reads "Pass AA" or "Fail AA" — NOT "tick Pass AA" (icon aria-hidden works).
       - Activate a copy button. VO announces "Copied" via the #copy-live region.

    5. Mobile audit — resize browser to 600px wide:
       - `.panels` stack vertically OR tabs appear (implementation choice: CSS shows tabs because `.panel-tabs` display changes to flex at ≤700px, and panels are switched via hidden toggling).
       - Tab through: tabs should be reachable and Enter/Space switches visible panel.
       - Re-run axe-core at 600px width.

    6. Fill in `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` using this structure:
       ```markdown
       ---
       phase: 5
       status: verified | gaps-found
       audited: 2026-04-XX
       ---

       # Phase 5 — Verification

       ## UI-01 Monochrome chrome
       - [ ] axe-core scan: N critical / N serious (target 0 / 0) — evidence: …
       - [ ] grep "var(--user-colour)" style.css only on permitted elements — evidence: …

       ## UI-02 Clean layout
       - [ ] Two-zone layout renders correctly at desktop width — evidence: …
       - [ ] Mobile (≤700px) stacks + tabs — evidence: …

       ## UI-03 British spelling
       - [ ] british-spelling.test.js green — evidence: node --test output

       ## A11Y-01 WCAG AA self-compliance
       - [ ] axe-core zero critical/serious (4 scans) — evidence: …

       ## A11Y-02 Non-colour cues
       - [ ] Badges read "Pass AA" / "Fail AA" in VoiceOver — evidence: …
       - [ ] badge-markup.test.js green — evidence: …

       ## A11Y-03 Visible focus
       - [ ] Keyboard walkthrough reaches every interactive element with visible outline — evidence: …

       ## Gaps found
       (list any axe findings deferred per D-17, with rationale)
       ```
    7. If the audit surfaces blockers, list each as a gap with truth/reason/artifacts/missing so `/gsd:plan-phase --gaps` can pick them up.
  </how-to-verify>
  <acceptance_criteria>
    - `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` exists
    - File contains one section per requirement ID (UI-01, UI-02, UI-03, A11Y-01, A11Y-02, A11Y-03)
    - Each checkbox is either ✅ with evidence OR ❌ with a recorded gap
    - Frontmatter `status` is either `verified` (all checkboxes ✅) or `gaps-found` (any ❌)
  </acceptance_criteria>
  <resume-signal>Type "audit complete — status verified" or "audit complete — status gaps-found" with a list of gap summaries.</resume-signal>
  <done>
    05-VERIFICATION.md filled with per-criterion checklist + evidence, and user has declared status.
  </done>
</task>

</tasks>

<verification>
Final Phase 5 gate:
1. `node --test test/` — full suite green (all Plan 01/02 guards still pass)
2. `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` has status `verified` OR gaps documented for `/gsd:plan-phase --gaps`
3. All six Phase 5 requirement IDs (UI-01, UI-02, UI-03, A11Y-01, A11Y-02, A11Y-03) have an explicit ✅ or ❌ in VERIFICATION.md
</verification>

<success_criteria>
1. style.css has exactly one focus rule group using `var(--chrome-dark)`, one dark-panel override using `var(--chrome-light)`, one `.sample-text:focus` dashed exception, and no `var(--user-colour)` focus-ring references
2. index.html has a ARIA-compliant tablist (role=tablist, role=tab, aria-selected, aria-controls, role=tabpanel)
3. app.js has a tab switch handler driven by `matchMedia('(max-width: 700px)')`
4. VERIFICATION.md captures audit evidence per D-16
5. axe-core reports zero critical/serious violations (or deferred per D-17 with rationale)
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-03-SUMMARY.md` summarising: focus rule consolidation (before/after line counts), mobile tablist markup, audit outcomes per criterion, any gaps routed to `/gsd:plan-phase --gaps`.
</output>
