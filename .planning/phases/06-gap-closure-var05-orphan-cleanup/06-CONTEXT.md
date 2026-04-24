# Phase 06: Gap Closure — VAR-05 + Orphan Cleanup - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Close v1.0 audit tech-debt. Three deliverables:
1. Restore VAR-05 empty-state copy + SR announcement when `state.alts.length === 0`.
2. Remove `DISTANCE_WARNING_THRESHOLD` orphan export from `variant-search.js` (+ test).
3. Backfill Nyquist validation for phases 1–5 so all VALIDATION.md files reach `nyquist_compliant: true`.

Out of scope: new features, UI redesign, threshold-warning UI (explicitly rejected — orphan is removed, not wired).

</domain>

<decisions>
## Implementation Decisions

### VAR-05 Empty-State (Area 1)
- **D-01:** Copy is exactly `No accessible pair found for this colour` (British, matches audit recommendation).
- **D-02:** When `state.alts.length === 0`, `renderAlts()` replaces the 5 em-dash placeholder tiles entirely with a single message element. No placeholder tiles render alongside the message.
- **D-03:** Markup is `<p class="alts-empty">…</p>` inserted into `#alts`. No `role="status"` / `aria-live` on the element itself — SR handled by explicit `announce()` call to existing `#sr-status` region. Avoids double live regions.

### Announce Trigger (Area 2)
- **D-04:** Announce fires only on transition from `alts.length >= 1` to `alts.length === 0`. Track previous length (or previous non-empty state) to suppress repeated announcements while input remains unresolvable.
- **D-05:** Announced string matches visible copy exactly: `No accessible pair found for this colour`. Mirrors existing `'N pairs found'` grammar pattern in `announce()` sites (app.js:336, 349).

### Orphan Cleanup (Area 3)
- **D-06:** Remove `DISTANCE_WARNING_THRESHOLD` from `variant-search.js` exports (line 24). Remove the JSDoc reference (line 11). Delete the `'DISTANCE_WARNING_THRESHOLD is 0.12'` test block (test/variant-search.test.js:113-115) and drop the symbol from the import on line 8. No UI wiring — explicitly chosen over re-wire.

### Nyquist Backfill (Area 4)
- **D-07:** Five separate plans, one per phase, all inside Phase 06. Plan files: `06-03-validate-phase-1-PLAN.md` through `06-07-validate-phase-5-PLAN.md`. Atomic commits per phase, easier to bisect a failing backfill.
- **D-08:** Plan sequence: 06-01 empty-state copy → 06-02 orphan cleanup → 06-03..07 `/gsd:validate-phase 1..5`. Code fixes land before validation sweep so Nyquist runs against final v1.0 code.

### Claude's Discretion
- CSS styling of `.alts-empty` (typography, spacing). Keep British-spelling compliant. Match mockup rhythm.
- Whether previous-length tracking lives on `state` object or as a closure var inside `renderAlts`/`autoFindAndApply`. Pick whichever integrates cleanest with existing state shape.
- How announce deduplication interacts with the `'N pairs found'` announcement in `autoFindAndApply` — don't double-announce on the empty transition.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope + Audit
- `.planning/v1.0-MILESTONE-AUDIT.md` — tech_debt source of truth; VAR-05 recommended-fix text, orphan export note, Nyquist table.
- `.planning/ROADMAP.md` §"Phase 6: Gap Closure" — success criteria SC1–SC5.
- `.planning/REQUIREMENTS.md` — VAR-05 acceptance criteria.
- `.planning/PROJECT.md` — British spelling non-negotiable; key decisions table.

### Prior Phase Context
- `.planning/phases/03-variant-search/` CONTEXT + VERIFICATION — original `#distance-warning` container + `DISTANCE_WARNING_THRESHOLD = 0.12` decision.
- `.planning/phases/05-design-and-accessibility/` VERIFICATION + SUMMARY — rebuild wave that removed the distance-warning container; `announce()` + `#sr-status` pattern; post-filter in `autoFindAndApply`.

### Code Touchpoints
- `app.js:186-235` — `renderAlts()` (placeholder render site, modify here).
- `app.js:244-262` — `autoFindAndApply()` (`state.alts` assignment site; trigger point for empty-transition announce).
- `app.js:108-111` — `announce()` helper + `#sr-status` ref.
- `variant-search.js:11, 24` — orphan export + JSDoc.
- `test/variant-search.test.js:8, 113-115` — orphan import + test.
- `index.html` — `#alts` grid container (needs CSS selector for `.alts-empty`).
- `style.css` — add `.alts-empty` styles.

No external specs beyond audit + roadmap; all decisions fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `announce(msg)` helper (app.js:109) — writes to `#sr-status`. Reuse for D-05.
- `state.alts` already centralised (app.js:256) — single site to observe transition.
- Existing `altHint` pattern in mockup (mockup line 941) confirmed non-binding — D-02 replaces the tile row instead.

### Established Patterns
- `announce()` grammar: short sentence, matches visible copy (Phase 5 pattern).
- Post-filter in `autoFindAndApply` is the only site where `alts` becomes `[]` via threshold — empty transitions always flow through here OR through explicit Find re-roll.
- British spelling: "colour" throughout UI strings (PROJECT.md non-negotiable).

### Integration Points
- `#sr-status` already exists in index.html.
- `#alts` grid CSS already handles flex/grid layout — `.alts-empty` needs typography + spacing only, no layout rewrite.

</code_context>

<specifics>
## Specific Ideas

- Audit verbatim copy preferred (D-01): "No accessible pair found for this colour".
- Explicit rejection of re-wiring `DISTANCE_WARNING_THRESHOLD` into UI — orphan removal is cleaner than invented UI (D-06).
- Fix before validate sequence (D-08) — Nyquist runs against final code, not pre-fix code.

</specifics>

<deferred>
## Deferred Ideas

- Threshold-based "variants are a long way from your colour" warning UI — rejected as scope expansion; if ever wanted, belongs in its own phase (new capability, not audit gap closure).
- Per-phase Nyquist plan structure deferred to plan-phase; this CONTEXT locks the count (5) and ordering only.

</deferred>

---

*Phase: 06-gap-closure-var05-orphan-cleanup*
*Context gathered: 2026-04-24*
