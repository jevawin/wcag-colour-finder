# Phase 8: Auto-Find UX — Research

**Researched:** 2026-04-25
**Domain:** DOM input wiring, event handling, headless test ergonomics
**Confidence:** HIGH

## Summary

Phase 8 is almost entirely a deletion + small extension to a single helper. The infrastructure for auto-find is already wired (`autoFindAndApply` is called by all three setters and by the AA/AAA toggle handler). INPUT-01 is "remove the button + handler + DOM lookups + subtitle phrase". INPUT-02 is "add a regression test — the code path already exists". INPUT-03 is "add blur-expand to `wireHexInput` so 3-char values resolve when focus leaves, but never mid-typing".

Because the project is vanilla JS with no build, no framework, and no JSDOM, the research is bounded to the existing source. There are no third-party libraries to evaluate, no version pinning, no ecosystem tradeoffs. The only design choice is the shape of the blur-expand helper: extend `wireHexInput` in place vs extract a pure `expandShorthandIfValid(value)` helper. Recommendation below.

**Primary recommendation:** Delete `find-btn` + handler in one task. Extend `wireHexInput` to also bind `blur` and call `setter(expanded)` when the trimmed value is exactly 3 valid hex chars. Extract a tiny pure helper `expandShorthandIfValid(value)` so the blur logic is unit-testable without DOM.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Trigger Surface (INPUT-01, INPUT-02)**
- D-01: Auto-find fires from existing `setBase` / `setLightBg` / `setDarkBg`. They already call `autoFindAndApply()` at the end. Delete the manual button handler.
- D-02: AA/AAA toggle already calls `autoFindAndApply()` (`app.js:366`). Verify with a test, do not re-implement.
- D-03: No debouncing. `requestIdleCallback` wrapper only if profiling shows a problem (Claude's Discretion).

**"Find 5" Button Removal (INPUT-01)**
- D-04: Remove the button from the DOM (`index.html:33`), not hide via CSS.
- D-05: Remove the click handler (`app.js:371-381`) and the `findBtn` / `findLabel` element lookups (`app.js:103-104`).
- D-06: Update subtitle copy (`index.html:21`). New: "Enter a hex code to find close pairs accessible on light and dark backgrounds." British spelling preserved.
- D-07: No re-roll affordance. Variants are deterministic given (input, threshold, BGs). The button's `setTimeout` + "Searching…" label was UI theatre.
- D-08: Remove `.btn` styles tied solely to `#find-btn` from `style.css` if no other element uses the selector. Verify via grep before deletion.

**3-Char Shorthand Behaviour (INPUT-03)**
- D-09: While typing in the base hex text input: do NOT expand 3-char to 6-char. Search fires only at exact length 6 (current behaviour preserved).
- D-10: On blur of the hex text input: if value is valid 3-char hex, expand to 6-char uppercase and trigger the setter (which auto-finds).
- D-11: Apply same blur-expand to light-bg and dark-bg hex inputs. Extend `wireHexInput`, do not special-case base.
- D-12: If user types 4 or 5 chars, do nothing on input or blur. Existing sanitisation stays.

**Accessibility / Announcements**
- D-13: Keep the Phase 7 dedupe in `autoFindAndApply` (`app.js:284`). No throttle.
- D-14: AA/AAA toggle's "Target X selected. N pairs found." announcement stays as-is.

**Test Surface**
- D-15: Drop tests targeting `findBtn`. (Audit confirms none exist — see "Test Audit" below.)
- D-16: Add tests for: (a) 6-char hex triggers search; (b) AA→AAA toggle re-runs search; (c) 3-char does NOT trigger on input but DOES expand+search on blur.
- D-17: Headless DOM testing pattern (no JSDOM, pure-function extraction) holds. Blur-expand helper should be exportable.

### Claude's Discretion
- Subtitle wording (D-06)
- Extract `expandShorthandIfValid(value)` helper vs fold blur into `wireHexInput` (D-17)
- Keep or delete `.btn` CSS class entirely (D-08)
- Throttling / idle scheduling (D-03) — only if profiling problem

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within INPUT-01/02/03. Responsive bugs (RESP-01/02) are Phase 9.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INPUT-01 | Search runs on valid 6-char entry; "Find 5" button removed | Setters already call `autoFindAndApply` (app.js:309/321/332). Button + handler deletion sites listed below. |
| INPUT-02 | AA/AAA toggle re-runs search | Toggle handler already calls `autoFindAndApply` (app.js:366). Phase contribution = regression test only. |
| INPUT-03 | 3-char shorthand: no auto-expand mid-typing, expand on blur | `wireHexInput` (app.js:340-346) already gates at length 6 (per commit b1b3c2e). Add blur listener calling `expandShorthandIfValid` + setter. |

## Project Constraints (from CLAUDE.md)

- Vanilla HTML/CSS/JS — no frameworks, no build step, no deps
- All calculations client-side; instant feedback on input
- British spelling in UI text (non-negotiable)
- American spelling in code identifiers (color, ratio) — DOM API reality
- Store hex without `#` prefix in state; pass `'#' + hex` into `contrastRatio`
- Pass raw `contrastRatio` float to `passesAA` etc — never round before threshold check
- Test runner: `node --test 'test/*.test.js'` (Node 24, zero deps)
- Pure-function extraction pattern for headless tests (no JSDOM)
- GSD workflow enforced — direct edits outside a GSD command not allowed

## Standard Stack

No third-party libraries. Native browser APIs only.

| API | Use | Notes |
|-----|-----|-------|
| `addEventListener('input', ...)` | Existing — sanitise + setter at length 6 | Already in `wireHexInput` |
| `addEventListener('blur', ...)` | NEW — expand 3-char and call setter | Bubbles? No, but direct binding on the input element is fine |
| `addEventListener('change', ...)` | NOT used | Fires only on commit (Enter or blur on text inputs); blur is more predictable |

`blur` vs `change` rationale: `change` on `<input type="text">` fires on blur AND on Enter. `blur` is simpler and matches the user-tabs-out intent precisely. The Enter case is a reasonable extension but is not required by INPUT-03 — leave it out unless adding it for free is trivial.

**No installation step.** Phase has no new dependencies.

## Architecture Patterns

### Pattern 1: Pure-function extraction for headless tests

Established in Phase 2. New helpers go above the `if (typeof document !== 'undefined')` guard and are exported alongside `buildBadgeState` / `expandHex` / etc. They are imported by `test/app.test.js` without JSDOM.

```javascript
// Recommended new helper (above DOM guard, ~line 50)
/**
 * If value (sans #) is exactly 3 hex chars, return the 6-char uppercase
 * expansion. Otherwise return null. Used by blur-expand for hex text inputs.
 *
 * @param {string} value - Raw input value (may include leading #)
 * @returns {string|null} 6-char uppercase hex, or null if not expandable
 */
function expandShorthandIfValid(value) {
  const v = value.replace(/^#/, '');
  if (v.length !== 3) return null;
  if (!/^[0-9a-fA-F]{3}$/.test(v)) return null;
  return v.split('').map(c => c + c).join('').toUpperCase();
}
export { /* existing */, expandShorthandIfValid };
```

### Pattern 2: Setters own the post-state pipeline

`setBase` / `setLightBg` / `setDarkBg` each end with `autoFindAndApply(); scheduleUrlSync();`. The blur-expand helper must call the setter — not duplicate the pipeline. This keeps URL sync, dedupe announce, and previews consistent.

### Pattern 3: Wire hex input is the single choke point

`wireHexInput(inputEl, setter)` (app.js:340) is bound to all three text inputs. Extending it adds blur-expand to all three for free. Per D-11 do not special-case base.

```javascript
// Recommended extension to wireHexInput
function wireHexInput(inputEl, setter) {
  inputEl.addEventListener('input', (e) => {
    const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6);
    e.target.value = v;
    if (v.length === 6 && parseHex(v)) setter(v);
  });
  inputEl.addEventListener('blur', (e) => {
    const expanded = expandShorthandIfValid(e.target.value);
    if (expanded) setter(expanded); // setter writes back via inputEl.value = state.base
  });
}
```

The setter already writes the canonical 6-char value back into the input field (`baseText.value = state.base` at app.js:304, mirrored in light/dark setters). So blur-expand displays the expanded form to the user without extra code.

### Anti-Patterns to Avoid

- **Do not re-implement the URL sync or dedupe inside the blur handler.** Always go through the setter.
- **Do not bind blur on `document` and delegate.** `blur` does not bubble. Direct binding on the input is correct.
- **Do not expand on Enter without also handling blur.** Pick one event (blur). Adding both risks double-fires of the setter.
- **Do not delete `.btn` CSS rules without confirming no `class="btn"` survivors.** Audit shows `#find-btn` is the only consumer (see CSS Audit below) — safe to delete in this phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex validation | Custom regex per call site | `parseHex` from colour-engine.js | Already validated; consistent with rest of app |
| 3→6 expansion | Inline `.split('').map(...)` again | Reuse `expandHex` (app.js:40) inside `expandShorthandIfValid` | Single source of truth |
| Sanitising input value | New input handler | The existing `wireHexInput` input listener already sanitises | Adding a second handler creates ordering bugs |
| Triggering search after blur expand | Direct call to `autoFindAndApply` | Call the setter; setter calls `autoFindAndApply` and `scheduleUrlSync` | Setter is the canonical pipeline; bypass breaks URL sync |

## Common Pitfalls

### Pitfall 1: Blur fires after blur target's input event has already cleared the value

**What goes wrong:** User types "ab", then deletes one char so value is "a", then tabs out. Blur sees "a" — not expandable. Fine. But if they typed "abc", then backspaced to "ab", then re-typed "c" rapidly, the input event fires for each keystroke. Blur sees the final value. No race here — `input` and `blur` are sequential, not concurrent.
**How to avoid:** Treat blur value as authoritative. No need to coordinate with input handler beyond the shared setter.
**Warning signs:** Test that types `abc`, dispatches blur, asserts setter called once with `AABBCC`.

### Pitfall 2: Setter writes value back to input, which could re-trigger input event

**What goes wrong:** `setter('AABBCC')` writes `baseText.value = 'AABBCC'` (app.js:304). Programmatic value writes do NOT fire `input` events in browsers — this is by spec. So no loop.
**How to avoid:** Nothing needed. Documented here so the planner does not add a defensive `mirroring` flag like the specimen sync code.
**Warning signs:** N/A.

### Pitfall 3: Removing the button leaves a focus tab-stop hole

**What goes wrong:** Tab order today: hex input → swatch picker (`<input type="color">`, focusable) → find-btn → AA toggle → AAA toggle → light-bg picker → light-bg text → ... With find-btn deleted: hex input → AA toggle → AAA toggle → ... This is fine. The picker `<input type="color">` is positioned absolutely inside the swatch and is focusable; no orphan aria attributes reference `find-btn` (verified — no `aria-controls="find-btn"` or similar in the markup).
**How to avoid:** Delete the button cleanly. No aria cleanup needed.
**Warning signs:** Manually tab through after removal. AA/AAA should follow the swatch picker.

### Pitfall 4: Blur racing with URL sync debounce

**What goes wrong:** Setter calls `scheduleUrlSync()` which uses 300ms debounce. If user types `2563EB` (input fires setter → schedules URL sync) and then immediately tabs out, blur sees `2563EB` (length 6, NOT expandable — `expandShorthandIfValid` returns null). No second setter call. No race. The race only matters for the 3-char path: type `abc` → input handler does nothing (length 3) → blur calls setter → URL sync scheduled. Single sync, no race.
**How to avoid:** `expandShorthandIfValid` returns null for 6-char input, so blur is a no-op when the input handler already committed.
**Warning signs:** Watch for double `scheduleUrlSync` calls in any extension.

### Pitfall 5: 3-char value with non-hex chars after sanitation

**What goes wrong:** Existing input handler strips non-hex chars. After sanitation, a typed "z2c" becomes "2c" (2 chars) — not 3, so blur won't expand. A typed "a1g" becomes "a1" (2 chars). The 3-char path is only reachable for genuinely valid 3-hex input.
**How to avoid:** `expandShorthandIfValid` re-validates with `/^[0-9a-fA-F]{3}$/` as defence in depth. Cheap.
**Warning signs:** Test case: type "a1g", blur, assert setter NOT called.

## Code Examples

### Removing the find button — exact deletion sites

**index.html line 21** (subtitle copy):
```html
<!-- BEFORE -->
<p class="subtitle">Enter a hex code then press "Find 5" to find close pairs accessible on light and dark backgrounds.</p>
<!-- AFTER -->
<p class="subtitle">Enter a hex code to find close pairs accessible on light and dark backgrounds.</p>
```

**index.html line 33** (button element — delete entire line):
```html
<button class="btn" id="find-btn"><span id="find-btn-label">Find 5</span><span aria-hidden="true">→</span></button>
```

**app.js lines 103-104** (lookups — delete both lines):
```javascript
const findBtn       = document.getElementById('find-btn');
const findLabel     = document.getElementById('find-btn-label');
```

**app.js lines 370-382** (entire click handler block — delete):
```javascript
// Find button — re-roll with "Searching…" label
findBtn.addEventListener('click', () => {
  findBtn.disabled = true;
  findLabel.textContent = 'Searching…';
  setTimeout(() => {
    state.appliedLight = null;
    state.appliedDark  = null;
    autoFindAndApply();
    findBtn.disabled = false;
    findLabel.textContent = 'Find 5';
    if (state.alts.length > 0) announce(state.alts.length + ' pairs found.');
  }, 20);
});
```

**style.css lines 124-139** (`.btn`, `.btn:hover`, `.btn:disabled`) and **line 469** (`.btn` mobile override) — see CSS Audit for safe-to-delete confirmation.

### Headless test for blur expand

```javascript
// test/app.test.js — new describe block
import { expandShorthandIfValid } from '../app.js';

describe('expandShorthandIfValid', () => {
  it('expands valid 3-char hex to 6-char uppercase', () => {
    assert.equal(expandShorthandIfValid('abc'), 'AABBCC');
    assert.equal(expandShorthandIfValid('#f0a'), 'FF00AA');
  });
  it('returns null for 6-char input (no double-expand)', () => {
    assert.equal(expandShorthandIfValid('AABBCC'), null);
    assert.equal(expandShorthandIfValid('2563EB'), null);
  });
  it('returns null for 4 or 5 char input', () => {
    assert.equal(expandShorthandIfValid('abcd'), null);
    assert.equal(expandShorthandIfValid('abcde'), null);
  });
  it('returns null for invalid chars', () => {
    assert.equal(expandShorthandIfValid('xyz'), null);
    assert.equal(expandShorthandIfValid('a1g'), null);
  });
  it('returns null for empty string', () => {
    assert.equal(expandShorthandIfValid(''), null);
  });
});
```

For INPUT-02 (AA/AAA toggle re-runs search), the existing test pattern in `app.test.js:106-134` (calling `findVariantPairs` directly with both 4.5 and 7.0 targetRatios) already exercises the same code path. A new test asserting both call shapes succeed in the same `it` block documents INPUT-02 contract without DOM.

## Test Audit (find-btn references in test/)

Search across `test/` returned **zero matches** for `find-btn`, `findBtn`, `findLabel`, or `Find 5`. No tests need rewriting or deletion. D-15 is a no-op — confirm by grep, document in plan, move on.

`test/app.test.js` has 4 describe blocks (`buildBadgeState`, `expandHex`, `formatRatio`, `buildPillHTML`) plus a Phase 7 integration block (`app.js integration — findVariantPairs call pattern`). None reference the button.

## CSS Audit (.btn class usage)

```
style.css:124  .btn { ... }              ← rule
style.css:138  .btn:hover { ... }        ← rule
style.css:139  .btn:disabled { ... }     ← rule
style.css:469  .btn { ... }              ← mobile override
index.html:33  class="btn" id="find-btn" ← only consumer in app
```

The mockup HTML in `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/` references `.btn` but is a frozen artefact, not part of the live app. **`#find-btn` is the only live consumer of `.btn`.** Per D-08, safe to delete all four `.btn` rules. Recommendation: delete them — dead CSS invites drift just like dead markup.

## Wire Audit (current setter + toggle + autoFindAndApply call sites)

Confirmed by reading app.js:

| Caller | Line | Calls `autoFindAndApply()`? |
|--------|------|-----------------------------|
| `setBase` | 309 | YES (immediately before `scheduleUrlSync`) |
| `setLightBg` | 321 | YES |
| `setDarkBg` | 332 | YES |
| AA/AAA toggle handler | 366 | YES (before announce) |
| Find button handler | 377 | YES (inside setTimeout) — TO DELETE |
| Initial boot | 516 | YES |

Conclusion: every meaningful state change already triggers auto-find. INPUT-01 and INPUT-02 are structurally satisfied; this phase deletes the now-redundant button path and adds tests.

## URL State Confirmation

`scheduleUrlSync` (app.js:482) reads `state.base` / `state.light` / `state.dark` — all three are set by their setters to the **expanded** 6-char uppercase form (`expandHex(hex.replace(/^#/, ''))` at lines 303, 316, 328). Then `buildHashPath` lowercases them (lines 486-488). So:

- Blur-expand path: type `abc` → blur → `expandShorthandIfValid` returns `AABBCC` → `setBase('AABBCC')` → `state.base = 'AABBCC'` → URL gets `aabbcc`.
- No double-write. No half-state. URL is always the canonical 6-char form.

Shareable links unaffected.

## A11y / Tab Order Confirmation

After button removal, the row-one tab order is:
1. `#base-color` (color picker, focusable inside swatch)
2. `#base-text` (hex text input)
3. `#target-toggle` AA button
4. `#target-toggle` AAA button

Then below: light preview's `#light-bg-color`, `#light-bg-text`, copy button, contenteditable specimens. No aria attributes reference `find-btn` (grep confirms). Live region `#sr-status` continues to receive announces from `autoFindAndApply` and the toggle handler.

## State of the Art

| Old Approach | Current Approach | Why |
|--------------|------------------|-----|
| Explicit "search" button in colour tools | Live search on input change | Sub-millisecond compute makes the button friction without benefit. Industry shift since ~2020. |
| Mid-typing hex auto-expansion | Expand on blur only | Auto-expanding mid-typing is hostile — users typing `abcd` see `aabbcc` flash to `abcd` to `abcdcd`. Quick task 260424-tzn fixed the input case; Phase 8 closes the loop with deferred blur-expand. |

## Quick Task 260424-tzn (background)

Located at `.planning/quick/260424-tzn-disable-hex-input-3-char-autocomplete/`. Files: `260424-tzn-PLAN.md`, `260424-tzn-SUMMARY.md`. Commit: **b1b3c2e** ("fix(260424-tzn): stop hex input auto-expanding 3-char shorthand"). Single-line change: `if ((v.length === 3 || v.length === 6) && parseHex(v)) setter(v);` → `if (v.length === 6 && parseHex(v)) setter(v);` at app.js:344. INPUT-03 inherits from this — Phase 8 adds the blur-expand half that the quick task explicitly deferred.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in, Node 24) |
| Config file | none — default `node --test` discovery |
| Quick run command | `node --test test/app.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INPUT-01 | Search runs on valid 6-char hex (no button) | unit (pure-fn integration) | `node --test test/app.test.js` — assert `findVariantPairs` returns Array for valid 6-char input via the same call shape `setBase` → `autoFindAndApply` uses. Existing test at app.test.js:107 already covers this; add a comment tying it to INPUT-01. | yes (test/app.test.js) |
| INPUT-01 | "Find 5" button no longer in DOM | manual + grep | grep `find-btn` in index.html / app.js / style.css returns zero matches | grep, no test file |
| INPUT-02 | AA→AAA toggle re-runs search | unit (pure-fn integration) | `node --test test/app.test.js` — assert `findVariantPairs` returns valid AAA result with targetRatio=7.0. Existing test at app.test.js:113 covers it; add a regression test naming INPUT-02. | yes (test/app.test.js) |
| INPUT-03 | 3-char does NOT trigger search on input | unit (negative) | `node --test test/app.test.js` — assert `expandShorthandIfValid('abc')` returns 'AABBCC' (the helper exists), and confirm input handler in `wireHexInput` only calls setter at length 6 (code-shape assertion via reading the handler — already enforced by commit b1b3c2e). | yes (test/app.test.js) — needs new describe block |
| INPUT-03 | 3-char DOES expand + trigger search on blur | unit (pure helper) | `node --test test/app.test.js` — `expandShorthandIfValid('abc') === 'AABBCC'` and friends (full table in Code Examples above) | needs new describe block in test/app.test.js |
| INPUT-03 | Manual smoke: tab out of hex input with 3-char value | manual | open index.html, type `abc`, Tab, confirm input shows `AABBCC` and previews/alts re-render | n/a |

### Sampling Rate

- **Per task commit:** `node --test test/app.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'` (full suite — all 87+ tests)
- **Phase gate:** Full suite green + manual smoke (3-char tab-out, button absent)

### Wave 0 Gaps

- [ ] Add `expandShorthandIfValid` to `app.js` exports (above DOM guard)
- [ ] Add `describe('expandShorthandIfValid', ...)` block to `test/app.test.js` (5 cases per Code Examples)
- [ ] Add INPUT-02 regression test (or annotate existing AAA test at app.test.js:113 with the requirement ID)

No new test file or framework install needed — existing `test/app.test.js` and `node:test` cover everything.

## Open Questions

1. **Should the blur-expand also write the expanded value back into the input field before calling the setter?**
   - What we know: The setter already does `baseText.value = state.base` (and equivalent for light/dark). So writing back happens automatically.
   - What's unclear: Nothing — confirmed by reading lines 304, 317, 329.
   - Recommendation: Trust the setter. Do not duplicate.

2. **Should `change` event be bound alongside `blur` to handle Enter-key commit?**
   - What we know: `change` fires on blur AND on Enter for text inputs. Binding both `blur` and `change` would double-fire. Binding only `change` covers both cases.
   - What's unclear: Whether INPUT-03 intent includes Enter as a commit trigger. CONTEXT.md only mentions blur.
   - Recommendation: Bind `blur` only per CONTEXT D-10. Defer Enter handling — easy to add later if requested.

3. **Should the find-btn deletion be one task or split?**
   - What we know: HTML, JS, CSS edits are all small and tightly coupled.
   - What's unclear: Planner preference.
   - Recommendation: Single task ("delete find-btn surface"). Deleting the lookup but leaving the handler would crash on load — atomic change is safer.

## Sources

### Primary (HIGH confidence)
- `app.js` (full file) — current state of all relevant wiring, confirmed setters call `autoFindAndApply`
- `index.html` — confirmed find-btn at line 33, subtitle at line 21
- `style.css` — confirmed `.btn` only consumed by `#find-btn` in live app
- `test/app.test.js` — confirmed zero references to find-btn / Find 5
- `.planning/phases/08-auto-find-ux/08-CONTEXT.md` — locked decisions
- Git log + commit b1b3c2e — provenance for INPUT-03 quick task

### Secondary (MEDIUM confidence)
- MDN: `input` events do not fire from programmatic `.value` writes (web standard, well-known)
- MDN: `blur` does not bubble; `change` on text inputs fires on blur+Enter (web standard)

### Tertiary (LOW confidence)
None — entire research is bounded to local source files, no external claims to verify.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external dependencies, native DOM only
- Architecture: HIGH — established pure-function extraction pattern from Phases 1/2
- Pitfalls: HIGH — verified directly against source (no hypothetical edge cases)
- Test surface: HIGH — grep confirmed zero find-btn refs in test/

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (or until app.js is restructured)
