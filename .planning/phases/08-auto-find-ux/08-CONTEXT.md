# Phase 8: Auto-Find UX - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Mode:** `--auto` (Claude selected recommended defaults)

<domain>
## Phase Boundary

Make variant search feel live. Three requirements:

- **INPUT-01:** Search runs automatically when the base hex input reaches a valid 6-char value. Remove the "Find 5" button.
- **INPUT-02:** Toggling AA / AAA re-runs the search automatically against the new threshold.
- **INPUT-03:** Typing a 3-char shorthand hex does not auto-expand mid-typing (promote quick task 260424-tzn).

Out of scope: responsive fixes (Phase 9 — RESP-01/02). No new search behaviour — Phase 7 already delivered the corrected, threshold-aware search this UX exercises.

</domain>

<decisions>
## Implementation Decisions

### Trigger Surface (INPUT-01, INPUT-02)

- **D-01:** Auto-find fires from existing `setBase` / `setLightBg` / `setDarkBg` setters in `app.js`. They already call `autoFindAndApply()` at the end (Phase 7 wiring). No new trigger plumbing needed — just delete the manual button handler.
- **D-02:** AA/AAA toggle already calls `autoFindAndApply()` (`app.js:366`). INPUT-02 is structurally already met; verify with a test in this phase rather than re-implementing.
- **D-03:** No debouncing. `findVariantPairs` runs sub-millisecond per keystroke; debouncing adds latency without benefit. If profiling during planning shows a hot path, planner may add a `requestIdleCallback` wrapper — Claude's Discretion.

### "Find 5" Button Removal (INPUT-01)

- **D-04:** Remove the button from the DOM (`index.html:33`), not hide it via CSS. Leaving dead markup invites drift.
- **D-05:** Remove the click handler (`app.js:371-381`) and the `findBtn` / `findLabel` element lookups (`app.js:103-104`).
- **D-06:** Update the subtitle copy (`index.html:21`). New copy: "Enter a hex code to find close pairs accessible on light and dark backgrounds." (Drops "then press Find 5"). British spelling preserved.
- **D-07:** No re-roll affordance replaces the button. Variants are deterministic given (input, threshold, BGs) — there is nothing to re-roll. The button's `setTimeout` + "Searching…" label was UI theatre over an instant calculation. Drop it cleanly.
- **D-08:** Remove the `.btn` styles tied solely to `#find-btn` from `style.css` if no other element uses the same selector. Planner verifies via grep before deletion.

### 3-Char Shorthand Behaviour (INPUT-03)

- **D-09:** While typing in the base hex text input: do **not** expand 3-char to 6-char. Search fires only at exact length 6 (current behaviour in `wireHexInput`, `app.js:341-345` — preserved).
- **D-10:** On `blur` of the hex text input: if the value is a valid 3-char hex, expand to 6-char uppercase and trigger the setter (which auto-finds). This matches the quick task 260424-tzn intent — no mid-typing rewrites, but a 3-char value still resolves to a working state when the user tabs out.
- **D-11:** Apply the same blur-expand behaviour to the light-bg and dark-bg hex text inputs for consistency. All three use `wireHexInput`; extend the helper rather than special-casing base.
- **D-12:** If the user types past 3 chars (4 or 5 chars), do nothing on input or blur — neither valid nor expandable. Existing sanitisation (length cap at 6, strip non-hex) stays.

### Accessibility / Announcements

- **D-13:** Keep the Phase 7 dedupe in `autoFindAndApply` (`app.js:284`) — prevents the live region from chattering on every keystroke. No throttle needed; dedupe handles it.
- **D-14:** AA/AAA toggle's "Target X selected. N pairs found." announcement (`app.js:367`) stays as-is. INPUT-02 doesn't change announcement copy.

### Test Surface

- **D-15:** Drop tests targeting `findBtn` (search `test/app.test.js` for `find-btn` references — remove or rewrite as auto-find tests).
- **D-16:** Add tests for: (a) 6-char hex input triggers search; (b) AA→AAA toggle re-runs search; (c) 3-char shorthand does NOT trigger search on input but DOES expand+search on blur.
- **D-17:** Headless DOM testing pattern from prior phases (no JSDOM — pure-function extraction) holds. The blur-expand helper should be exportable for unit testing without wiring.

### Claude's Discretion

- Exact wording of the new subtitle copy (D-06) — current draft is a starting point; planner may tighten.
- Whether to extract a `expandHexOnBlur(inputEl, setter)` helper or fold blur logic into `wireHexInput` — Claude picks based on test ergonomics.
- Whether to keep the `.btn` CSS class definitions in `style.css` for future use or delete entirely (D-08).
- Whether `autoFindAndApply` needs any throttling/idle scheduling — only add if profiling shows a problem.

### Folded Todos

None — `gsd-tools todo match-phase 8` returned zero matches. The hex shorthand work (quick task 260424-tzn) is already promoted to INPUT-03 in REQUIREMENTS.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` §"Phase 8: Auto-Find UX" — goal, success criteria, dependency on Phase 7.
- `.planning/REQUIREMENTS.md` §"Input and Interaction (INPUT)" — INPUT-01, INPUT-02, INPUT-03.

### Source files in scope
- `app.js:103-104` — `findBtn` / `findLabel` lookups (delete).
- `app.js:251-298` — `autoFindAndApply` (no change; already called by setters and toggle).
- `app.js:300-333` — `setBase` / `setLightBg` / `setDarkBg` (no change to call sites; blur-expand may piggyback).
- `app.js:337-349` — `wireHexInput` (extend to add blur-expand for 3-char per D-10/D-11).
- `app.js:355-368` — AA/AAA toggle (verify via test; no change).
- `app.js:371-381` — Find button click handler (delete).
- `index.html:21` — subtitle copy (rewrite).
- `index.html:33` — `<button id="find-btn">` (delete).
- `style.css` — audit for `.btn` / `#find-btn` rules (D-08).

### Prior phase context
- `.planning/phases/07-search-correctness-spread/07-CONTEXT.md` — `autoFindAndApply` semantics, dedupe announce (D-12), threshold-aware search.
- `.planning/phases/04-modes-and-configuration/04-CONTEXT.md` — input wiring conventions, URL state.
- `.planning/phases/02-live-preview-ui/02-CONTEXT.md` — pure-function extraction pattern for headless tests.

### Tests
- `test/app.test.js` — primary regression surface. Audit for `find-btn` / "Find 5" assertions.
- `test/app.test.js` §`expandHex` — already covers 3→6 expansion correctness; INPUT-03 adds the "when to expand" tests.

### Quick task being promoted
- Anything tagged `260424-tzn` in `.planning/quick/` (if archived) or git log — original framing of the 3-char shorthand bug. Read before planning to confirm scope intent.

### Project guardrails
- `CLAUDE.md` §"Tech stack" — vanilla JS, no build step, no deps.
- `CLAUDE.md` §"Design notes" — minimal monochrome, British spelling.
- `.planning/PROJECT.md` §"Constraints" — performance: instant feedback on input.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `wireHexInput(inputEl, setter)` (`app.js:340`) — central choke point for hex text inputs. Extend here for D-10/D-11 instead of duplicating per input.
- `expandHex(hex)` (`app.js:40`) — already handles 3→6 expansion. Reuse on blur.
- `parseHex` from `colour-engine.js` — already validates hex strings; use to gate the blur-expand.
- `autoFindAndApply` (`app.js:251`) — already idempotent and dedupe-aware. No new orchestration needed.

### Established Patterns
- Setters (`setBase` etc.) own the "after-state-changes" pipeline including `autoFindAndApply`. Don't fire search outside a setter.
- Pure functions exported alongside DOM wiring for headless testing (Phase 2 invariant). New blur-expand helper should follow the same shape.
- British spelling in UI strings — non-negotiable (PROJECT.md).

### Integration Points
- HTML → JS: `find-btn` / `find-btn-label` IDs. Removing the element means removing the lookups in the same change to keep DOM/JS in sync.
- URL state (Phase 4): unaffected. Hex written to URL is always the 6-char expanded form via setters.
- AA/AAA toggle: already wired to `autoFindAndApply`. INPUT-02 is implementation-complete; this phase verifies + adds a regression test.

### Risks
- **Test churn:** `test/app.test.js` likely references `find-btn`. Audit before deleting markup.
- **CSS orphan:** `.btn` rules in `style.css` may have become specific to `#find-btn`. Confirm no other usage before deletion.
- **Blur timing:** `blur` fires after `input` — make sure the blur-expand path doesn't race with the URL state writer or duplicate the announce. The dedupe (D-13) should absorb this; verify with a test.
- **A11y regression:** Removing the button removes a focusable control. Verify keyboard tab order still makes sense (hex text → AA/AAA toggle → previews/swatches).

</code_context>

<specifics>
## Specific Ideas

- INPUT-02 is structurally already satisfied by the Phase 7 wiring (`app.js:366`). Phase 8's contribution for INPUT-02 is a regression test + verification, not new code.
- The "Searching…" label and `setTimeout(20)` on the old Find button (`app.js:373-379`) was UI theatre — search is sub-ms. Drop without replacement.
- 3-char blur-expand should write the expanded form back into the input field so the user sees the canonical 6-char value after tabbing out. Mirrors how `parseHex` consumers expect 6-char.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within INPUT-01/02/03 scope. Responsive bugs (RESP-01/02) belong to Phase 9 and were not touched.

</deferred>

---

*Phase: 08-auto-find-ux*
*Context gathered: 2026-04-25 (auto mode)*
