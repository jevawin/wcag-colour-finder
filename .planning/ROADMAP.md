# Roadmap: WCAG Colour Finder

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-04-24) → [archive](./milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Polish + Fixes** — Phases 7-9 (active)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6, 5.1) — SHIPPED 2026-04-24</summary>

- [x] Phase 1: Colour Engine (1/1 plan) — completed 2026-04-12
- [x] Phase 2: Live Preview UI (1/1 plan) — completed 2026-04-12
- [x] Phase 3: Variant Search (2/2 plans) — completed 2026-04-12
- [x] Phase 4: Modes and Configuration (3/3 plans) — completed 2026-04-15
- [x] Phase 5: Design and Accessibility (8/8 plans) — completed 2026-04-23
- [x] Phase 5.1: Reinstate Editable Specimens (1/1 plan) — completed 2026-04-23
- [x] Phase 6: Gap Closure — VAR-05 + Orphan Cleanup (7/7 plans) — completed 2026-04-24

Full details: [.planning/milestones/v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

</details>

### 🚧 v1.1 Polish + Fixes (active)

- [ ] **Phase 7: Search Correctness & Spread** — Fix AAA search defect, widen variant L-axis spread, keep accessible side when only one BG fails
- [ ] **Phase 8: Auto-Find UX** — Remove "Find 5" button; search runs on valid hex and on AA/AAA toggle; 3-char shorthand no longer auto-expands
- [ ] **Phase 9: Responsive Fixes** — Badge labels visible at all widths; hex input does not push container off-screen

## Phase Details

### Phase 7: Search Correctness & Spread
**Goal**: Variant search returns correct, varied, and minimally-disruptive results across AA/AAA and per-background pass states
**Depends on**: v1.0 Phase 3 (variant search), v1.0 Phase 4 (pair metric)
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03
**Success Criteria** (what must be TRUE):
  1. User toggles AAA and sees variant pairs returned whenever the colour space permits a solution (no false empty state)
  2. User sees 5 variants that visibly span a wider L-axis range — first result nearest the input, last result a clearly distinct shade
  3. User enters a colour that already passes on one background; that background keeps the entered colour and only the failing side shows an alternative
  4. Existing AA dual-pair behaviour continues to work for colours that fail on both backgrounds
**Plans**: 3 plans
- [ ] 07-01-colour-engine-threshold-PLAN.md — Add passesThreshold helper + tests
- [ ] 07-02-variant-search-refactor-PLAN.md — Threshold-aware search, L-stretch seeds, asymmetric gating
- [ ] 07-03-app-integration-PLAN.md — Remove post-filter, plumb threshold, already-accessible status

### Phase 8: Auto-Find UX
**Goal**: Search feels live — triggered by typing and threshold changes, with no explicit action button and no mid-typing hex rewrites
**Depends on**: Phase 7 (auto-find must exercise corrected search)
**Requirements**: INPUT-01, INPUT-02, INPUT-03
**Success Criteria** (what must be TRUE):
  1. User types a valid 6-char hex; search runs automatically with no "Find 5" button press
  2. User toggles between AA and AAA; results re-compute against the new threshold without further action
  3. User types a 3-char shorthand hex; the input does not auto-expand mid-typing
  4. "Find 5" button no longer appears in the UI
**Plans**: 3 plans
- [ ] 07-01-colour-engine-threshold-PLAN.md — Add passesThreshold helper + tests
- [ ] 07-02-variant-search-refactor-PLAN.md — Threshold-aware search, L-stretch seeds, asymmetric gating
- [ ] 07-03-app-integration-PLAN.md — Remove post-filter, plumb threshold, already-accessible status
**UI hint**: yes

### Phase 9: Responsive Fixes
**Goal**: Layout holds together at narrow viewport widths — no clipped badge labels, no horizontal overflow from the hex input
**Depends on**: Phase 8 (auto-find UI must be in place before verifying responsive behaviour)
**Requirements**: RESP-01, RESP-02
**Success Criteria** (what must be TRUE):
  1. User resizes to narrow viewport widths; all badge labels (AA Normal / AA Large / AAA Normal / AAA Large) remain fully visible
  2. User resizes to narrow viewport widths; the hex input container scales with the viewport and does not push content off-screen
  3. Tool continues to pass WCAG AA at all supported widths (no regression from v1.0 Phase 5)
**Plans**: 3 plans
- [ ] 07-01-colour-engine-threshold-PLAN.md — Add passesThreshold helper + tests
- [ ] 07-02-variant-search-refactor-PLAN.md — Threshold-aware search, L-stretch seeds, asymmetric gating
- [ ] 07-03-app-integration-PLAN.md — Remove post-filter, plumb threshold, already-accessible status
**UI hint**: yes

## Progress

| Phase                           | Milestone | Plans Complete | Status      | Completed  |
| ------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Colour Engine                | v1.0      | 1/1            | Complete    | 2026-04-12 |
| 2. Live Preview UI              | v1.0      | 1/1            | Complete    | 2026-04-12 |
| 3. Variant Search               | v1.0      | 2/2            | Complete    | 2026-04-12 |
| 4. Modes and Configuration      | v1.0      | 3/3            | Complete    | 2026-04-15 |
| 5. Design and Accessibility     | v1.0      | 8/8            | Complete    | 2026-04-23 |
| 5.1. Editable Specimens         | v1.0      | 1/1            | Complete    | 2026-04-23 |
| 6. Gap Closure                  | v1.0      | 7/7            | Complete    | 2026-04-24 |
| 7. Search Correctness & Spread  | v1.1      | 0/3            | Planned     | -          |
| 8. Auto-Find UX                 | v1.1      | 0/0            | Not started | -          |
| 9. Responsive Fixes             | v1.1      | 0/0            | Not started | -          |
