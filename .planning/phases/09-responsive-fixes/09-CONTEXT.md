# Phase 9: Responsive Fixes - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two responsive defects so the layout holds at narrow viewport widths:

1. Badge labels (AA Normal / AA Large / AAA Normal / AAA Large) remain fully visible — no off-screen clipping at any supported width (RESP-01).
2. Hex input container scales with the viewport at narrow widths — does not push content off-screen via min-width or fixed sizing (RESP-02).

In scope: CSS-only adjustments to `style.css`, possibly minor markup tweaks in `index.html` if required for wrapping/truncation. Targets the badge pills and hex input row. Visual regression check at 320px / 360px / 480px / 767px / 991px / 1400px against v1.0 Phase 5 visual contract.

Out of scope: redesign of badges or input, JS resize logic, new colour modes, layout overhaul beyond the two defect areas.

</domain>

<decisions>
## Implementation Decisions

### RESP-01 Badge Label Visibility
- **D-01:** Fix via CSS-only — pills + labels wrap inside their grid cell; introduce intermediate breakpoint (~480px) so 4-col → 2-col → 1-col grid degrades cleanly. Existing 1400px breakpoint already drops to 2-col; mobile (≤767px) currently forces `repeat(4, 1fr)` width:100% which is the clipping culprit at <480px.
- **D-02:** Preserve full label text ("AA Normal" etc.) — do NOT abbreviate. Wrapping or stacking is acceptable; truncation/ellipsis is not.
- **D-03:** `.pill` and `.pill-label` must allow `flex-wrap`/text wrap; remove any `white-space: nowrap` that prevents this in the affected scope.

### RESP-02 Hex Input Scaling
- **D-04:** Hex input must scale fluidly down to the supported viewport floor. Ensure `min-width: 0` propagates through the flex chain (`.row-one`, `.base-row`, `.hex-input`) so the text input shrinks.
- **D-05:** Use `clamp()` on input font-size if needed to prevent the 22px monospace hex from forcing horizontal overflow on narrow widths. Keep readable floor (≥16px to avoid iOS zoom on focus).
- **D-06:** Swatch + `#` prefix stay fixed-size — only the text input flexes. Toggle (AA/AAA) wraps to its own row at the existing 767px breakpoint (already implemented); confirm it survives below 480px.

### Supported Viewport Floor
- **D-07:** Floor = 320px width (covers iPhone SE 1st gen and equivalent). Above the floor, no horizontal scroll, no clipped badge labels, no overflowing hex input.

### Approach
- **D-08:** CSS-only fix. No JS resize observers, no JS-driven layout. Vanilla constraint holds.
- **D-09:** No new dependencies; no build step.
- **D-10:** Verify against existing v1.0 Phase 5 WCAG AA UI contrast — the responsive changes must not regress contrast at any width.

### Verification
- **D-11:** Manual viewport-resize check at 320 / 360 / 480 / 767 / 991 / 1400 / >1400. Both light + dark preview panels. Both AA and AAA toggle states.
- **D-12:** Re-run existing regression tests (Phase 8 Plan 03) and confirm no behavioural regression.

### Claude's Discretion
- Exact intermediate breakpoint value (480px is a starting recommendation — planner/researcher may pick a different value if measurement shows a better break point).
- Whether to wrap pill labels under the pill, stack them vertically, or both depending on width — implementation detail for planner.
- Whether `clamp()` or a discrete media-query font-size step is cleaner — planner's call.

### Folded Todos
None — no pending todos matched Phase 9 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Responsive UI (RESP) — RESP-01, RESP-02 acceptance criteria
- `.planning/ROADMAP.md` §"Phase 9: Responsive Fixes" — goal + success criteria

### Existing Layout Contract
- `style.css` lines 96–123 — `.hex-input` and text input styles; current `min-width: 0` on the text input
- `style.css` lines 333–380 — ratio row + pills grid; current 4 → 2 col breakpoint at 1400px
- `style.css` lines 434–516 — `@media (max-width: 767px)` mobile block (where `.pills` is forced back to `repeat(4, 1fr)` width:100% — the RESP-01 root cause area)
- `app.js` lines 87–184 — `buildPillHTML` / pill rendering; markup the CSS targets

### Prior Phase Visual Contract (no regression)
- `.planning/phases/05-design-and-accessibility/05-CONTEXT.md` — v1.0 visual + WCAG-AA-on-the-tool contract
- `.planning/phases/05-design-and-accessibility/` plans — focus styles, contrast guarantees Phase 9 must preserve

### Conventions
- `CLAUDE.md` — vanilla HTML/CSS/JS, no frameworks/build, British spelling, modern browsers only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.pills` grid + existing 1400px breakpoint already does 4 → 2 col degradation; extend pattern, do not replace.
- `.hex-input` already has `min-width: 0` on the text input (line 122); the issue is likely upstream flex containers or the `flex: 1` not collapsing.
- Mobile block at 767px already does most of the responsive heavy lifting; Phase 9 is closing gaps below 480px primarily.

### Established Patterns
- All layout uses CSS Grid + Flexbox. No JS layout.
- Media queries grouped by max-width breakpoint. Existing breakpoints: 1400px, 991px, 767px.
- Custom properties for theming; do not introduce new ones for this phase unless required.

### Integration Points
- Single CSS file (`style.css`) — all changes land here.
- Pill markup comes from `buildPillHTML` in `app.js`; if markup change is unavoidable, edit there. Prefer CSS-only.
- No new HTML structure expected in `index.html`.

</code_context>

<specifics>
## Specific Ideas

- The defect was uncovered in v1.1 use; the visual reference is colourcontrast.cc-inspired layout that already handles narrow widths gracefully — match that bar.
- Preserve label fidelity: "AA Normal" reads as full words, not "AAN" or icons-only.

</specifics>

<deferred>
## Deferred Ideas

- Full responsive design audit (touch target sizing, landscape orientation, ultra-wide handling) — out of scope; capture as v1.2 candidate if observed during testing.
- Container queries instead of media queries — modernisation, not a defect fix; defer.

### Reviewed Todos (not folded)
None — no pending todos surfaced for this phase.

</deferred>

---

*Phase: 09-responsive-fixes*
*Context gathered: 2026-04-25*
