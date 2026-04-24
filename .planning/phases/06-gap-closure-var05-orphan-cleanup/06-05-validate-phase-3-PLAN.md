---
phase: 06-gap-closure-var05-orphan-cleanup
plan: 05
type: execute
wave: 2
depends_on:
  - 01
  - 02
files_modified:
  - .planning/phases/03-variant-search/03-VALIDATION.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "Phase 3 VALIDATION.md frontmatter shows nyquist_compliant: true and wave_0_complete: true after running /gsd:validate-phase 3."
  artifacts:
    - path: ".planning/phases/03-variant-search/03-VALIDATION.md"
      provides: "Phase 3 validation record"
      contains: "nyquist_compliant: true"
  key_links: []
---

<objective>
Run `/gsd:validate-phase 3` to backfill Nyquist validation for Phase 3 (Variant Search) against final v1.0 code (post 06-02 orphan cleanup). Flip both Nyquist flags to `true` in `.planning/phases/03-variant-search/03-VALIDATION.md`.

Purpose: Closes audit tech-debt item #3 (Nyquist backfill) for Phase 3. Depends on 06-02 so validation runs against the cleaned variant-search.js (no orphan export).

Output: Updated `.planning/phases/03-variant-search/03-VALIDATION.md` frontmatter.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/v1.0-MILESTONE-AUDIT.md
@.planning/phases/06-gap-closure-var05-orphan-cleanup/06-CONTEXT.md
@.planning/phases/03-variant-search/03-VALIDATION.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Run /gsd:validate-phase 3</name>
  <files>.planning/phases/03-variant-search/03-VALIDATION.md</files>
  <read_first>
    - .planning/phases/03-variant-search/03-VALIDATION.md (draft state + coverage strategy)
    - variant-search.js (post-06-02 — confirm orphan constant is gone before validating)
    - .planning/v1.0-MILESTONE-AUDIT.md (Phase 3 Nyquist row)
  </read_first>
  <action>
    (1) Pre-flight check: `grep "DISTANCE_WARNING_THRESHOLD" variant-search.js` must return 0 matches. If not, 06-02 has not completed — abort this plan (wave dependency violation).

    (2) Invoke `/gsd:validate-phase 3`. Let it run the standard Nyquist workflow.

    (3) After completion, re-read the VALIDATION.md frontmatter and confirm both flags are `true`.

    (4) If the validator errors or is unavailable, stop and report in SUMMARY — no hand-edits.
  </action>
  <verify>
    <automated>
      grep -c "DISTANCE_WARNING_THRESHOLD" variant-search.js   # expect 0 (pre-flight)
      grep -c "nyquist_compliant: true" .planning/phases/03-variant-search/03-VALIDATION.md  # expect 1
      grep -c "wave_0_complete: true" .planning/phases/03-variant-search/03-VALIDATION.md    # expect 1
    </automated>
  </verify>
  <acceptance_criteria>
    - Pre-flight: `DISTANCE_WARNING_THRESHOLD` absent from variant-search.js.
    - `.planning/phases/03-variant-search/03-VALIDATION.md` frontmatter contains `nyquist_compliant: true` and `wave_0_complete: true`.
    - Validator was invoked via `/gsd:validate-phase 3` (not hand-edited).
  </acceptance_criteria>
  <done>
    Phase 3 Nyquist flags flipped to true by the validator, running against cleaned variant-search.js.
  </done>
</task>

</tasks>

<verification>
- `grep "nyquist_compliant: true" .planning/phases/03-variant-search/03-VALIDATION.md` → 1 match
- `grep "wave_0_complete: true" .planning/phases/03-variant-search/03-VALIDATION.md` → 1 match
</verification>

<success_criteria>
Phase 3 VALIDATION.md shows both Nyquist flags true.
</success_criteria>

<output>
Create `.planning/phases/06-gap-closure-var05-orphan-cleanup/06-05-SUMMARY.md`.
</output>
