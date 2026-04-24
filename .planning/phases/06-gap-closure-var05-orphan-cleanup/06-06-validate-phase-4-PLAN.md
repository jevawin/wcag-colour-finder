---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 06
type: execute
wave: 2
depends_on:
  - 01
  - 02
files_modified:
  - .planning/phases/04-modes-and-configuration/04-VALIDATION.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "Phase 4 VALIDATION.md frontmatter shows nyquist_compliant: true and wave_0_complete: true after running /gsd:validate-phase 4."
  artifacts:
    - path: ".planning/phases/04-modes-and-configuration/04-VALIDATION.md"
      provides: "Phase 4 validation record"
      contains: "nyquist_compliant: true"
  key_links: []
---

<objective>
Run `/gsd:validate-phase 4` to backfill Nyquist validation for Phase 4 (Modes and Configuration). Flip both Nyquist flags to `true` in `.planning/phases/04-modes-and-configuration/04-VALIDATION.md`.

Purpose: Closes audit tech-debt item #3 (Nyquist backfill) for Phase 4.

Output: Updated `.planning/phases/04-modes-and-configuration/04-VALIDATION.md` frontmatter.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/v1.0-MILESTONE-AUDIT.md
@.planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md
@.planning/phases/04-modes-and-configuration/04-VALIDATION.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Run /gsd:validate-phase 4</name>
  <files>.planning/phases/04-modes-and-configuration/04-VALIDATION.md</files>
  <read_first>
    - .planning/phases/04-modes-and-configuration/04-VALIDATION.md (draft state + coverage strategy)
    - .planning/v1.0-MILESTONE-AUDIT.md (Phase 4 Nyquist row)
  </read_first>
  <action>
    (1) Invoke `/gsd:validate-phase 4`. Let the command execute its standard Nyquist workflow.

    (2) After completion, re-read the VALIDATION.md frontmatter and confirm both `nyquist_compliant` and `wave_0_complete` are `true`.

    (3) Only `.planning/phases/04-modes-and-configuration/04-VALIDATION.md` should be modified (plus any sample logs the validator creates inside that phase dir).

    (4) If `/gsd:validate-phase 4` errors or is unavailable, stop and report in SUMMARY — no hand-edits.
  </action>
  <verify>
    <automated>
      grep -c "nyquist_compliant: true" .planning/phases/04-modes-and-configuration/04-VALIDATION.md  # expect 1
      grep -c "wave_0_complete: true" .planning/phases/04-modes-and-configuration/04-VALIDATION.md    # expect 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/04-modes-and-configuration/04-VALIDATION.md` frontmatter contains `nyquist_compliant: true` and `wave_0_complete: true`.
    - Validator was invoked via `/gsd:validate-phase 4` (not hand-edited).
  </acceptance_criteria>
  <done>
    Phase 4 Nyquist flags flipped to true by the validator.
  </done>
</task>

</tasks>

<verification>
- `grep "nyquist_compliant: true" .planning/phases/04-modes-and-configuration/04-VALIDATION.md` → 1 match
- `grep "wave_0_complete: true" .planning/phases/04-modes-and-configuration/04-VALIDATION.md` → 1 match
</verification>

<success_criteria>
Phase 4 VALIDATION.md shows both Nyquist flags true.
</success_criteria>

<output>
Create `.planning/phases/06-gap-closure-var05-orphan-cleanup/06-06-SUMMARY.md`.
</output>
