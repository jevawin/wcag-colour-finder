---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 01
subsystem: ui-feedback
tags: [empty-state, a11y, sr-status, var-05]
requires:
  - announce() helper (app.js:109)
  - #sr-status live region (index.html)
  - #alts grid container (index.html)
provides:
  - .alts-empty paragraph rendered inside #alts when state.alts is empty
  - announce('No accessible pair found for this colour') fired once per 1->0 transition
affects:
  - renderAlts() empty branch (app.js)
  - autoFindAndApply() (app.js)
  - findBtn click handler (app.js:349 announce guarded)
tech-stack:
  added: []
  patterns:
    - Closure-scoped previous-value tracking (prevAltsLen) over expanding state shape
    - CSS grid-column: 1 / -1 to span message across multi-col grid
key-files:
  created: []
  modified:
    - app.js
    - style.css
decisions:
  - Empty-state copy exactly matches audit wording (D-01)
  - Single <p> element replaces all 5 placeholder tiles (D-02)
  - No role=status on element; reuse existing announce() path (D-03)
  - Closure var prevAltsLen over state.prevAltsLen (Claude discretion)
  - findBtn announce guarded with state.alts.length > 0 to avoid '0 pairs found' duplicate
metrics:
  duration: ~10m
  completed: 2026-04-24
requirements: [VAR-05]
---

# Phase 06 Plan 01: Empty-State Copy Summary

One-liner: Restored VAR-05 explicit empty-state text 'No accessible pair found for this colour' in place of em-dash placeholder tiles, with single-fire SR announcement on 1->0 transition.

## What Changed

### app.js

1. **prevAltsLen closure var** added directly before `state` declaration (new line above app.js:129).
2. **renderAlts() empty branch** — the `for (let i = 0; i < 5; i++)` placeholder-tile loop replaced with a single `<p class="alts-empty">No accessible pair found for this colour</p>` appended to `#alts`.
3. **autoFindAndApply() transition guard** — after `state.alts = filtered;`, added:
   ```js
   if (prevAltsLen > 0 && filtered.length === 0) {
     announce('No accessible pair found for this colour');
   }
   prevAltsLen = filtered.length;
   ```
   Fires announce exactly once per 1->0 transition; suppresses repeats while alts remain empty.
4. **findBtn announce guard** — line 349 `announce(state.alts.length + ' pairs found.')` now gated by `state.alts.length > 0`. Avoids a '0 pairs found' double-announce on the empty path; empty case is handled by the transition guard above.

### style.css

New `.alts-empty` rule placed between `.alt.placeholder .hex` and `/* Preview panels */`:
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

Mobile override appended inside the existing `@media (max-width: 767px)` block:
```css
.alts-empty { padding: 10px 0; }
```

## Verification

Automated greps (run against final tree):
- `alts-empty` in app.js: 1 match (single className assignment — string literal appears once; the className + creation are both in the same statement).
- `alts-empty` in style.css: 2 matches (main rule + mobile override).
- `No accessible pair found for this colour` in app.js: 2 matches (textContent + announce arg).
- `prevAltsLen` in app.js: 3 matches (declaration, guard check, reassignment).
- `if (state.alts.length > 0) announce` in app.js: 1 match.
- `for (let i = 0; i < 5; i++)` in app.js: 0 matches (placeholder loop removed).
- `node --test test/*.test.js`: 87 tests pass, 0 fail.

### Grep-count note (deviation)

Plan anticipated `alts-empty` in app.js >= 2. Actual count is 1 because the class name is used exactly once (`msg.className = 'alts-empty'`); the rule's intent (className present in the creation path) is satisfied with one idiomatic reference. No extra duplicate string added. Logged as a spec-grep adjustment, not a behavioural deviation.

### Browser smoke (auto-approved)

Auto-advance mode active (workflow.auto_advance true + auto-mode block in prompt). Checkpoint Task 3 auto-approved. Static analysis confirms:
- `renderAlts` appends `<p class="alts-empty">` when state.alts empty, returns early.
- `autoFindAndApply` fires announce once on 1->0 transition via prevAltsLen guard.
- Transition back to populated naturally removes the paragraph (innerHTML cleared on next render).

## Deviations from Plan

### Auto-fixed Issues

None.

### Spec Adjustments

**1. [Spec-grep] `alts-empty` count in app.js**
- **Found during:** Task 1 verification.
- **Issue:** Plan said `grep -c "alts-empty" app.js` should return >= 2. Idiomatic JS uses the class name once (`msg.className = 'alts-empty'`).
- **Resolution:** Did not duplicate the literal to inflate grep count. Behavioural intent (empty-state element carries class `alts-empty`) is satisfied.

## Commits

- `632b87a` feat(06-01): replace empty-alts placeholders with .alts-empty message
- `6570284` feat(06-01): add .alts-empty rule for empty-state message

## Self-Check: PASSED

- app.js modified, present.
- style.css modified, present.
- Commits `632b87a` and `6570284` present on main.
- All tests green (87/87).
