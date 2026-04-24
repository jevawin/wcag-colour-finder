---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 07
type: execute
wave: 2
depends_on:
  - 01
  - 02
files_modified:
  - .planning/phases/05-design-and-accessibility/05-VALIDATION.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "Phase 5 VALIDATION.md frontmatter shows nyquist_compliant: true and wave_0_complete: true after running /gsd:validate-phase 5."
    - "Validation samples run against post-06-01 code — includes the reinstated .alts-empty empty-state path."
  artifacts:
    - path: ".planning/phases/05-design-and-accessibility/05-VALIDATION.md"
      provides: "Phase 5 validation record"
      contains: "nyquist_compliant: true"
  key_links: []
---

<objective>
Run `/gsd:validate-phase 5` to backfill Nyquist validation for Phase 5 (Design and Accessibility). Must run AFTER 06-01 so that the reinstated VAR-05 empty-state code path (app.js `.alts-empty` branch + announce transition) is part of the sampled surface. Flip both Nyquist flags to `true` in `.planning/phases/05-design-and-accessibility/05-VALIDATION.md`.

Purpose: Closes audit tech-debt item #3 (Nyquist backfill) for Phase 5 — the phase that regressed VAR-05, now re-validated against the fixed code.

Output: Updated `.planning/phases/05-design-and-accessibility/05-VALIDATION.md` frontmatter.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/v1.0-MILESTONE-AUDIT.md
@.planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md
@.planning/phases/05-design-and-accessibility/05-VALIDATION.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Run /gsd:validate-phase 5</name>
  <files>.planning/phases/05-design-and-accessibility/05-VALIDATION.md</files>
  <read_first>
    - .planning/phases/05-design-and-accessibility/05-VALIDATION.md (draft state + coverage strategy)
    - app.js (post-06-01 — confirm .alts-empty branch exists before validating)
    - .planning/v1.0-MILESTONE-AUDIT.md (Phase 5 Nyquist row)
  </read_first>
  <action>
    (1) Pre-flight check: `grep "alts-empty" app.js` must return >= 1 match. If not, 06-01 has not completed — abort this plan (wave dependency violation).

    (2) Invoke `/gsd:validate-phase 5`. Let it run the standard Nyquist workflow.

    (3) After completion, re-read the VALIDATION.md frontmatter and confirm both flags are `true`.

    (4) If the validator errors or is unavailable, stop and report in SUMMARY — no hand-edits.
  </action>
  <verify>
    <automated>
      grep -c "alts-empty" app.js    # expect >= 1 (pre-flight)
      grep -c "nyquist_compliant: true" .planning/phases/05-design-and-accessibility/05-VALIDATION.md  # expect 1
      grep -c "wave_0_complete: true" .planning/phases/05-design-and-accessibility/05-VALIDATION.md    # expect 1
    </automated>
  </verify>
  <acceptance_criteria>
    - Pre-flight: `.alts-empty` code path present in app.js (06-01 landed).
    - `.planning/phases/05-design-and-accessibility/05-VALIDATION.md` frontmatter contains `nyquist_compliant: true` and `wave_0_complete: true`.
    - Validator was invoked via `/gsd:validate-phase 5` (not hand-edited).
  </acceptance_criteria>
  <done>
    Phase 5 Nyquist flags flipped to true by the validator, running against the v1.0 code that includes the VAR-05 fix.
  </done>
</task>

</tasks>

<verification>
- `grep "nyquist_compliant: true" .planning/phases/05-design-and-accessibility/05-VALIDATION.md` → 1 match
- `grep "wave_0_complete: true" .planning/phases/05-design-and-accessibility/05-VALIDATION.md` → 1 match
</verification>

<success_criteria>
Phase 5 VALIDATION.md shows both Nyquist flags true. With 06-03..06-07 all green, the audit's Nyquist gap closes completely.
</success_criteria>

<output>
Create `.planning/phases/06-gap-closure-var05-orphan-cleanup/06-07-SUMMARY.md`.
</output>
