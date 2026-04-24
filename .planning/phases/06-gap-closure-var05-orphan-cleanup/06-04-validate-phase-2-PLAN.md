---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 04
type: execute
wave: 2
depends_on:
  - 01
  - 02
files_modified:
  - .planning/phases/02-live-preview-ui/02-VALIDATION.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "Phase 2 VALIDATION.md frontmatter shows nyquist_compliant: true and wave_0_complete: true after running /gsd:validate-phase 2."
  artifacts:
    - path: ".planning/phases/02-live-preview-ui/02-VALIDATION.md"
      provides: "Phase 2 validation record"
      contains: "nyquist_compliant: true"
  key_links: []
---

<objective>
Run `/gsd:validate-phase 2` to backfill Nyquist validation for Phase 2 (Live Preview UI) against final v1.0 code (post 06-01 + 06-02 fixes). Flip `nyquist_compliant: false` and `wave_0_complete: false` → `true` in `.planning/phases/02-live-preview-ui/02-VALIDATION.md`.

Purpose: Closes audit tech-debt item #3 (Nyquist backfill) for Phase 2. Runs after code fixes per D-08 so validation samples current v1.0 code, not pre-fix.

Output: Updated `.planning/phases/02-live-preview-ui/02-VALIDATION.md` frontmatter.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/v1.0-MILESTONE-AUDIT.md
@.planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md
@.planning/phases/02-live-preview-ui/02-VALIDATION.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Run /gsd:validate-phase 2</name>
  <files>.planning/phases/02-live-preview-ui/02-VALIDATION.md</files>
  <read_first>
    - .planning/phases/02-live-preview-ui/02-VALIDATION.md (current draft state + coverage strategy)
    - .planning/v1.0-MILESTONE-AUDIT.md (Nyquist table row for Phase 2)
  </read_first>
  <action>
    (1) Invoke `/gsd:validate-phase 2`. Let the command execute its standard Nyquist validation workflow (sample coverage, run tests, update frontmatter).

    (2) If the command prompts for confirmation on any sample selection, accept defaults unless the coverage strategy in the VALIDATION.md explicitly requires manual selection.

    (3) After the command completes, re-read `.planning/phases/02-live-preview-ui/02-VALIDATION.md` and confirm both frontmatter flags now show `true`.

    (4) If `/gsd:validate-phase 2` errors or is unavailable, stop and report the blocker in SUMMARY — do NOT hand-edit the frontmatter (GSD workflow enforcement per CLAUDE.md).

    (5) Only this VALIDATION.md file should be modified. If the validator touches other files (e.g., creates a sample log), that's fine but note it in SUMMARY.
  </action>
  <verify>
    <automated>
      grep -c "nyquist_compliant: true" .planning/phases/02-live-preview-ui/02-VALIDATION.md  # expect 1
      grep -c "wave_0_complete: true" .planning/phases/02-live-preview-ui/02-VALIDATION.md    # expect 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/02-live-preview-ui/02-VALIDATION.md` frontmatter contains `nyquist_compliant: true`.
    - Same file contains `wave_0_complete: true`.
    - Validator was invoked via `/gsd:validate-phase 2` (not hand-edited).
  </acceptance_criteria>
  <done>
    Phase 2 Nyquist flags flipped to true by the validator.
  </done>
</task>

</tasks>

<verification>
- `grep "nyquist_compliant: true" .planning/phases/02-live-preview-ui/02-VALIDATION.md` → 1 match
- `grep "wave_0_complete: true" .planning/phases/02-live-preview-ui/02-VALIDATION.md` → 1 match
</verification>

<success_criteria>
Phase 2 VALIDATION.md shows both Nyquist flags true.
</success_criteria>

<output>
Create `.planning/phases/06-gap-closure-var05-orphan-cleanup/06-04-SUMMARY.md`.
</output>
