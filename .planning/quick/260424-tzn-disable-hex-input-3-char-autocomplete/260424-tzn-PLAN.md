---
phase: quick-260424-tzn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [app.js]
autonomous: true
requirements: [QUICK-260424-TZN]
must_haves:
  truths:
    - "Typing 'abc' in a hex input no longer auto-expands to AABBCC mid-typing"
    - "Typing a full 6-char hex still commits (setter fires when v.length === 6)"
    - "expandHex('abc') still returns 'AABBCC' for URL hydrate and non-keystroke callers"
    - "All 87 tests still pass (node --test test/*.test.js)"
  artifacts:
    - path: "app.js"
      provides: "wireHexInput guard restricted to length === 6"
      contains: "v.length === 6"
  key_links:
    - from: "app.js wireHexInput input listener"
      to: "setter (setBase/setLightBg/setDarkBg)"
      via: "guard: (v.length === 6) && parseHex(v)"
      pattern: "v\\.length === 6"
---

<objective>
Stop the hex text inputs from auto-expanding 3-char shorthand to 6 chars mid-typing. Typing `abc` should sit as `abc` in the field until the user types the remaining 3 chars.

Purpose: Typing mid-hex currently fires the setter on 3 chars, which expands the value (e.g. `abc` -> `AABBCC`) and disrupts intent. Users type 6 chars directly; the 3-char branch was premature.
Output: Single-line change in `wireHexInput` guard. `expandHex` helper untouched — still supports 3-char shorthand for URL hydrate and any non-keystroke entry point.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@app.js
@test/app.test.js
</context>

<interfaces>
Current `wireHexInput` (app.js:313-319):
```js
function wireHexInput(inputEl, setter) {
  inputEl.addEventListener('input', (e) => {
    const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6);
    e.target.value = v;
    if ((v.length === 3 || v.length === 6) && parseHex(v)) setter(v);
  });
}
```

Setters (setBase/setLightBg/setDarkBg, lines 273-307) already call `expandHex(hex.replace(/^#/, ''))` internally, so committing a 3-char value via the setter still works from other call sites. Only the keystroke handler changes.

`expandHex` is exported and covered by tests in test/app.test.js:43-54 — do not touch.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Restrict wireHexInput commit to 6-char values only</name>
  <files>app.js</files>
  <action>
    In `wireHexInput` (app.js:313-319), change the guard on line 317 from `(v.length === 3 || v.length === 6)` to `v.length === 6`. Do not touch anything else in the function. Do not modify `expandHex`. Do not modify setters (setBase/setLightBg/setDarkBg) — they keep calling `expandHex` internally so URL hydrate and other entry points still accept 3-char shorthand.

    Final line should read:
    ```js
    if (v.length === 6 && parseHex(v)) setter(v);
    ```
  </action>
  <verify>
    <automated>cd /Users/jamiepersonal/Developer/wcag-colour-finder &amp;&amp; grep -n "v.length === 3" app.js; test $? -eq 1 &amp;&amp; grep -n "v.length === 6 &amp;&amp; parseHex" app.js &amp;&amp; node --test test/*.test.js</automated>
  </verify>
  <done>
    - `grep "v.length === 3" app.js` returns no match (exit 1)
    - `grep "v.length === 6 && parseHex" app.js` matches the wireHexInput guard
    - `node --test test/*.test.js` reports 87/87 pass
    - expandHex tests in test/app.test.js still green (line 43-54 cases)
  </done>
</task>

</tasks>

<verification>
- Run `node --test test/*.test.js` — expect 87/87 pass, no regressions.
- Grep confirms the 3-char disjunct is gone from wireHexInput.
- Manual smoke (optional, not blocking): open index.html, type `abc` into the hex field — value stays as `ABC`, no auto-expansion, no panel update. Type `abcdef` — panel updates as before.
</verification>

<success_criteria>
- app.js wireHexInput guard is `v.length === 6 && parseHex(v)` — single condition, no disjunct
- expandHex function and its tests untouched
- All 87 tests pass
- Setters still expand 3-char shorthand when called from URL hydrate or other non-keystroke paths
</success_criteria>

<output>
After completion, create `.planning/quick/260424-tzn-disable-hex-input-3-char-autocomplete/260424-tzn-SUMMARY.md`
</output>
