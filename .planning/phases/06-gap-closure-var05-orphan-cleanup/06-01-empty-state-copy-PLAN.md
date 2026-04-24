---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app.js
  - style.css
autonomous: true
requirements:
  - VAR-05
must_haves:
  truths:
    - "When state.alts.length === 0, a visible text line reading 'No accessible pair found for this colour' renders inside #alts instead of 5 em-dash placeholder tiles."
    - "On transition from alts.length >= 1 to alts.length === 0, announce() fires exactly once with the string 'No accessible pair found for this colour' via #sr-status."
    - "While alts remain empty across successive input changes, announce() does NOT repeat the empty-state string."
    - "When alts repopulate (length returns to >= 1), the empty-state paragraph is removed and tile buttons render normally."
  artifacts:
    - path: "app.js"
      provides: "renderAlts empty branch renders .alts-empty <p>; autoFindAndApply tracks previous alts length and triggers announce on 1→0 transition"
      contains: "alts-empty"
    - path: "style.css"
      provides: ".alts-empty typography + spacing rule"
      contains: ".alts-empty"
  key_links:
    - from: "app.js renderAlts (line ~186)"
      to: "#alts DOM node"
      via: "altsEl.innerHTML / appendChild of <p class=\"alts-empty\">"
      pattern: "alts-empty"
    - from: "app.js autoFindAndApply (line ~244)"
      to: "announce() helper"
      via: "previous-length guard: announce only when prevAltsLen > 0 && state.alts.length === 0"
      pattern: "announce\\(.*No accessible pair"
---

<objective>
Restore VAR-05 explicit empty-state messaging. When `state.alts.length === 0`, renderAlts replaces the 5 em-dash placeholder tiles with a single `<p class="alts-empty">No accessible pair found for this colour</p>` element, and autoFindAndApply fires `announce('No accessible pair found for this colour')` exactly once per 1→0 transition.

Purpose: Closes tech_debt VAR-05 from v1.0-MILESTONE-AUDIT.md. Phase 5 rebuild removed the Phase 3 `#distance-warning` container; this plan reinstates the message in the new DOM.

Output: Modified `app.js` (renderAlts empty branch + autoFindAndApply transition guard) and `style.css` (.alts-empty rule). No new files.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/v1.0-MILESTONE-AUDIT.md
@.planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md
@app.js
@style.css
@index.html

<interfaces>
From app.js:

```js
// announce helper (app.js:109)
function announce(msg) {
  srStatus.textContent = '';
  requestAnimationFrame(() => { srStatus.textContent = msg; });
}

// renderAlts (app.js:186) — empty branch currently renders 5 placeholder tiles
function renderAlts() {
  altsEl.innerHTML = '';
  if (state.alts.length === 0) {
    for (let i = 0; i < 5; i++) { /* placeholder tile */ }
    return;
  }
  // ... tile render
}

// autoFindAndApply (app.js:244) — sets state.alts = filtered then calls renderAlts/renderPreviews
function autoFindAndApply() {
  // ...
  state.alts = filtered;
  // ...
  renderAlts();
  renderPreviews();
}

// State shape (app.js:129)
const state = {
  base, light, dark, target,
  alts: [],           // Array<{ lightHex, darkHex, distance }>
  appliedLight: null,
  appliedDark: null,
};
```

From index.html:
- `<div class="alts" id="alts" aria-label="Colour pair suggestions"></div>` — target container
- `<span id="sr-status" aria-live="polite" aria-atomic="true" class="sr-only"></span>` — SR live region

British-spelling non-negotiable per PROJECT.md. Exact empty copy per D-01: `No accessible pair found for this colour`.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Replace placeholder tiles with .alts-empty paragraph + add transition announce</name>
  <files>app.js</files>
  <read_first>
    - app.js (entire file — full picture of state, renderAlts, autoFindAndApply, announce)
    - .planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md (D-01..D-05 locked decisions)
    - index.html (lines 1-44 — confirm #alts + #sr-status IDs)
  </read_first>
  <action>
    Make three changes to app.js:

    (1) Replace the `state.alts.length === 0` branch in `renderAlts()` (app.js:188-196). Delete the `for (let i = 0; i < 5; i++) { … placeholder tile … }` loop entirely. Replace with:

    ```js
    if (state.alts.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'alts-empty';
      msg.textContent = 'No accessible pair found for this colour';
      altsEl.appendChild(msg);
      return;
    }
    ```

    Keep the `altsEl.innerHTML = '';` line above the if-branch untouched — it still clears on every render.

    (2) Add previous-length tracking. Directly BEFORE the `state` declaration at app.js:129, add:

    ```js
    let prevAltsLen = 0;
    ```

    (closure variable — per D-claude-discretion, closure cleaner than expanding state shape).

    (3) In `autoFindAndApply()` (app.js:244-267), AFTER `state.alts = filtered;` (line 256) and BEFORE the `if (filtered.length > 0 ...)` block, insert:

    ```js
    if (prevAltsLen > 0 && filtered.length === 0) {
      announce('No accessible pair found for this colour');
    }
    prevAltsLen = filtered.length;
    ```

    Rationale per D-04: announce fires only on transition from `>=1` to `0`. Tracks previous length so repeated input changes while unresolvable do not re-announce. Per D-05: string exactly matches the visible copy.

    Do NOT touch the `'N pairs found.'` announce site at line 349 — it runs on explicit Find button re-roll and is the only announcement path when alts are populated. The new empty-transition announce is the only path when alts go empty. No double-announce risk: `autoFindAndApply()` is called from `findBtn` click before `announce(state.alts.length + ' pairs found.')` runs, so when filtered.length===0 only the empty-state announce fires (the 'N pairs found' announce will say '0 pairs found' which is a duplicate — suppress by changing line 349 to: `announce(state.alts.length + ' pairs found.')` only when `state.alts.length > 0`; if empty, the prevAltsLen guard already handled it).

    Specifically at app.js:349, change:
    ```js
    announce(state.alts.length + ' pairs found.');
    ```
    to:
    ```js
    if (state.alts.length > 0) announce(state.alts.length + ' pairs found.');
    ```

    Leave the line 336 target-toggle announce (`'Target ' + state.target + ' selected. ' + state.alts.length + ' pairs found.'`) unchanged — toggling target is a separate intent; user hearing '0 pairs found' there is acceptable signalling (plus the 1→0 empty-transition will also fire if applicable).

    British spelling: "colour" not "color" (PROJECT.md non-negotiable).
  </action>
  <verify>
    <automated>
      # All four greps must return exactly the expected match counts
      grep -c "alts-empty" app.js        # expect >= 2 (className + creation)
      grep -c "No accessible pair found for this colour" app.js  # expect >= 2 (visible + announce)
      grep -c "prevAltsLen" app.js       # expect >= 3 (declare + check + update)
      grep -c "if (state.alts.length > 0) announce" app.js  # expect 1
      node --test test/
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep "alts-empty" app.js` returns at least 2 matches.
    - `grep "No accessible pair found for this colour" app.js` returns at least 2 matches (one sets textContent, one passed to announce).
    - `grep "prevAltsLen" app.js` returns at least 3 matches (declaration, guard check, reassignment).
    - The 5-tile placeholder loop `for (let i = 0; i < 5; i++)` is removed from app.js (`grep -c "for (let i = 0; i < 5; i++)" app.js` returns 0).
    - Line 349's `'pairs found.'` announce is guarded by `state.alts.length > 0`.
    - `node --test test/` exits 0 (no regressions).
    - No "color" (American) spelling introduced: `grep -n "\bcolor\b" app.js` returns only pre-existing matches (identifiers like basePicker/color input — no new UI strings).
  </acceptance_criteria>
  <done>
    renderAlts empty branch outputs `<p class="alts-empty">No accessible pair found for this colour</p>` with no placeholder tiles. autoFindAndApply fires announce on 1→0 transition, suppresses repeats, and avoids duplicate 'N pairs found' on empty. All tests pass.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Add .alts-empty CSS rule</name>
  <files>style.css</files>
  <read_first>
    - style.css (full file — understand current .alts grid, mono/typography tokens, colour vars)
    - .planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md (Claude's discretion on styling)
  </read_first>
  <action>
    Append a new rule block to style.css immediately after the existing `.alt.placeholder .hex { color: var(--topbar-fg); }` line (around line 224) and before `/* ——— Preview panels */`. The rule must:

    - Make `.alts-empty` span the full alts grid width (it lives inside `#alts` which is `display: grid; grid-template-columns: repeat(5, 1fr);` — use `grid-column: 1 / -1`).
    - Use the topbar foreground colour so it reads on the user-tinted topbar (`color: var(--topbar-fg)`).
    - Font-size 16px (match `.alt .hex` rhythm), font-weight 500, margin 0, padding 14px 0, text-align: center.
    - Italic is optional — omit to match the app's minimal aesthetic.

    Concrete block to append:

    ```css
    .alts-empty {
      grid-column: 1 / -1;
      margin: 0;
      padding: 14px 0;
      text-align: center;
      color: var(--topbar-fg);
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 16px;
      font-weight: 500;
      opacity: 0.75;
    }
    ```

    Also add a mobile override inside the existing `@media (max-width: 767px)` block (near line 460 where `.alts` grid collapses to `1fr`). Append to that media query:

    ```css
      .alts-empty { padding: 10px 0; }
    ```

    British spelling: the rule name is `.alts-empty` (not `.alts-none` or similar) — matches the class set in app.js Task 1.
  </action>
  <verify>
    <automated>
      grep -c "\.alts-empty" style.css   # expect >= 2 (main rule + mobile override)
      grep -c "grid-column: 1 / -1" style.css  # expect >= 1
      node --test test/
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep "\.alts-empty" style.css` returns at least 2 matches.
    - The main rule contains `grid-column: 1 / -1`, `color: var(--topbar-fg)`, and `text-align: center`.
    - Mobile media query (`@media (max-width: 767px)`) contains an `.alts-empty` override.
    - `node --test test/` exits 0 (CSS change cannot break node tests, but run for safety).
  </acceptance_criteria>
  <done>
    `.alts-empty` renders centred across the 5-column alts grid (and the 1-column mobile grid) using topbar-fg colour, 16px Inter, 75% opacity. Typography matches existing card rhythm.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Browser smoke — empty-state renders + announces</name>
  <what-built>
    Empty-state copy 'No accessible pair found for this colour' renders in place of em-dash placeholder tiles when variant search yields no results. VoiceOver announces the same copy via #sr-status on 1→0 transition, and does not repeat while alts remain empty.
  </what-built>
  <how-to-verify>
    1. Serve locally: `python3 -m http.server 8000` (or equivalent) from repo root.
    2. Open http://localhost:8000 in the browser.
    3. Observe default state (base = #2563EB): 5 tiles render under Find 5. No empty-state message.
    4. Enter hex `FFFFFF` (white) — no accessible pair exists vs a white light BG. Observe:
       - The 5 em-dash placeholder tiles are GONE.
       - A single centred line reads `No accessible pair found for this colour` in the top bar area.
       - VoiceOver (Cmd+F5) announces `No accessible pair found for this colour` exactly once.
    5. Change hex to `EEEEEE` (still no pair). Observe:
       - Message still visible.
       - VoiceOver does NOT re-announce (no repeat while empty).
    6. Change hex back to `2563EB`. Observe:
       - Empty-state message disappears.
       - 5 alt tiles render normally.
       - No "0 pairs found" duplicate announce happens.
    7. Press Find 5 with `2563EB` loaded: VoiceOver announces `5 pairs found.` (or similar count). Then type `FFFFFF` — announce fires `No accessible pair found for this colour`.
  </how-to-verify>
  <resume-signal>Type "approved" if all 7 checks pass. Otherwise describe which step failed and why.</resume-signal>
</task>

</tasks>

<verification>
- `grep "alts-empty" app.js` → >= 2 matches
- `grep "alts-empty" style.css` → >= 2 matches
- `grep "No accessible pair found for this colour" app.js` → >= 2 matches
- `grep "for (let i = 0; i < 5; i++)" app.js` → 0 matches (placeholder loop removed)
- `node --test test/` exits 0
- Browser smoke (Task 3) passes all 7 checks
</verification>

<success_criteria>
VAR-05 satisfied: explicit empty-state text renders and is announced once per transition. No regression to existing 'N pairs found' announcements for populated results. Tests green.
</success_criteria>

<output>
After completion, create `.planning/phases/06-gap-closure-var05-orphan-cleanup/06-01-SUMMARY.md` recording: renderAlts diff, autoFindAndApply guard implementation, .alts-empty CSS values, and browser-smoke outcome.
</output>
