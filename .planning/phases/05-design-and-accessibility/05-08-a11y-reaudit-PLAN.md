---
phase: 05-design-and-accessibility
plan: 08
type: execute
wave: 5
depends_on:
  - 05-07
files_modified:
  - .planning/phases/05-design-and-accessibility/05-VERIFICATION.md
autonomous: false
gap_closure: true
requirements:
  - A11Y-01
  - A11Y-02
  - A11Y-03
must_haves:
  truths:
    - "axe-core DevTools reports 0 critical/serious violations at #2563EB"
    - "axe-core DevTools reports 0 critical/serious violations at #111111"
    - "axe-core DevTools reports 0 critical/serious violations at #ffff00"
    - "axe-core DevTools reports 0 critical/serious violations after auto-find populates alts"
    - "Keyboard walkthrough covers every interactive element with no traps and visible focus at every stop"
    - "VoiceOver smoke test confirms hex input label, Find re-roll, alts tile activation, copy 'Copied' feedback, badge/pills polite updates"
    - "Phase 5 VERIFICATION.md status flips from gaps-found to complete"
  artifacts:
    - path: ".planning/phases/05-design-and-accessibility/05-VERIFICATION.md"
      provides: "Updated phase verification with rebuild audit results and status: complete"
      contains: "status: complete"
  key_links:
    - from: "VERIFICATION.md rebuild audit section"
      to: "ROADMAP.md Phase 5 status"
      via: "status update propagated"
      pattern: "Phase 5.*Complete"
---

<objective>
Run the formal a11y re-audit against the rebuilt UI. Walk axe-core + keyboard + VoiceOver at four hex values. Capture evidence in `05-VERIFICATION.md`. Flip phase status to complete.

Purpose: Close A11Y-01 / A11Y-02 / A11Y-03 formally. The 05-03 audit was deferred because the build was about to be replaced; this wave audits the rebuild.

Output: updated VERIFICATION.md with rebuild-era evidence; ROADMAP.md and REQUIREMENTS.md status flipped.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-VERIFICATION.md
@.planning/phases/05-design-and-accessibility/05-UI-SPEC.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@index.html
@style.css
@app.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Pre-audit automated evidence</name>
  <files>.planning/phases/05-design-and-accessibility/05-VERIFICATION.md</files>
  <read_first>
    - current `05-VERIFICATION.md` (entire file — we append a new "Rebuild Audit" section, preserve existing history)
    - rebuilt `index.html`, `style.css`, `app.js` (to run greps against)
  </read_first>
  <action>
    Before the human audit checkpoint, capture automated evidence by running greps and the full test suite. Append to `05-VERIFICATION.md` a new section titled `## Rebuild Audit — ${today}` with subsections for each gap G1–G10 and each requirement UI-01, UI-02, UI-03, A11Y-01, A11Y-02, A11Y-03. Under each, record the grep + test evidence.

    Run and record these commands (use exact output counts):
    - `grep -c 'class="topbar-wrap"' index.html` (G1)
    - `grep -c 'target-toggle' index.html` (G3)
    - `grep -c "data-target=\"AAA\"" index.html` (G3)
    - `grep -c 'class="fg-tag"' index.html` (G4) — expect 2
    - `grep -c 'class="bg-tag"' index.html` (G4) — expect 2
    - `grep -c 'data-copy-target' index.html` (G4) — expect 2
    - `grep -c "font-size: 64px" style.css` (G5, G7) — expect ≥ 2
    - `grep -c 'fonts.googleapis.com' index.html` (G6) — expect 1
    - `grep -c "\\.mono" style.css` (G6) — expect ≥ 1
    - `grep -c 'The quick brown fox' index.html` (G7) — expect 2
    - `grep -c "0 1 2 3 4 5 6 7 8 9" index.html` (G7) — expect 2
    - `grep -c 'autoFindAndApply' app.js` (G8) — expect ≥ 2
    - `grep -c "'Searching…'" app.js` (G8) — expect 1
    - `grep -c "document.createElement('button')" app.js` (G9)
    - `grep -c "sample-text" index.html` (G10) — expect 0
    - `grep -c "sample-text" style.css` (G10) — expect 0
    - `grep -c "contenteditable" index.html` (G10) — expect 0
    - `node --test test/*.test.js` — must pass entirely

    Do NOT mark status: complete yet — wait for the human audit checkpoint (Task 2) to confirm.
  </action>
  <acceptance_criteria>
    - `05-VERIFICATION.md` contains a new `## Rebuild Audit` section with today's date
    - Every grep result is recorded next to the gap it evidences (G1–G10)
    - `node --test test/*.test.js` output captured (N pass / 0 fail)
    - File remains `status: gaps-found` — checkpoint flips it
  </acceptance_criteria>
  <verify>
    <automated>node --test test/*.test.js</automated>
  </verify>
  <done>Rebuild Audit section drafted in VERIFICATION.md with all automated greps + test-suite output captured.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human a11y audit — axe-core + keyboard + VoiceOver at 4 hex values</name>
  <files>.planning/phases/05-design-and-accessibility/05-VERIFICATION.md</files>
  <read_first>
    - `05-VERIFICATION.md` A11y Audit Status section (lines 101-114) — the deferred audit plan
    - `05-UI-SPEC.md` Accessibility Audit Targets section
  </read_first>
  <what-built>
    Rebuilt UI matching the new Claude Design mockup: full-bleed coloured topbar, auto-derived topbar-fg, segmented AA|AAA toggle, fg-tag/bg-tag with copy buttons, 64px ratio + 4-pill grid, Inter + JetBrains Mono typography, new specimen copy, auto-find on input change, alts grid with keyboard-accessible buttons.
  </what-built>
  <how-to-verify>
    1. **axe-core DevTools scan — 4 hex values.** Open `index.html` in Chrome with axe DevTools extension. For each of these hex values, paste into the hex input, wait for auto-find to settle, then run axe scan on the full page. Record violation counts (critical + serious) for each:
       - `#2563EB` (default blue)
       - `#111111` (near-black — topbar should auto-flip to white fg)
       - `#ffff00` (high-lightness yellow — topbar should keep black fg)
       - Post-auto-find state (click Find re-roll, wait for alts + first pair applied)

       Expected: 0 critical, 0 serious at every value. Record the actual counts next to each value under `## Rebuild Audit — A11Y-01 axe-core` in VERIFICATION.md.

    2. **Keyboard walkthrough.** With DevTools closed, press Tab from page load. Confirm:
       - Stop 1: hex input — focus ring visible (2px --topbar-fg) against topbar bg
       - Stop 2: Find button — focus ring visible
       - Stop 3: AA option in segmented toggle — focus ring visible
       - Stop 4: AAA option — focus ring visible; Space toggles state.target and triggers auto-find
       - Stops 5-9: each of 5 alt tiles — focus ring visible; Enter/Space applies pair
       - Stop 10: light bg colour-picker swatch (native opens OS picker — okay)
       - Stop 11: light bg hex text input — focus ring visible against white panel
       - Stop 12: light panel copy button — focus ring visible; Enter fires copy
       - Stop 13+: same for dark panel (copy button focus ring should be --specimen colour, visible against #111111)
       - Shift+Tab back works, no focus trap
       - `.sample-text:focus` dashed exception is GONE — confirm no dashed outline appears anywhere

    3. **VoiceOver smoke test (macOS).** Cmd+F5 to start VoiceOver. Navigate with VO+arrow:
       - Hex input announces "Hex colour code, edit text, 2563EB"
       - Find button announces "Find 5, button"
       - Each pill announces "Pass AA Normal" / "Fail AAA Large" etc. (the word Pass/Fail + the label — NOT the glyph)
       - Alt tile announces the aria-label: "Apply pair: light #XXXXXX, dark #YYYYYY"
       - Copy button announces "Copy hex, button"; after pressing, the button briefly shows ✓ (no audio announcement required — visual confirmation is enough; if we added a polite live region, it should announce "Copied")
       - Tabs (mobile, resize window <768px) announce "Light, tab" / "Dark, tab" and activation switches the visible panel

    Record each item as ✅ / ❌ in `## Rebuild Audit — A11Y-02 Non-colour cues` and `## Rebuild Audit — A11Y-03 Visible focus` and `## Rebuild Audit — A11Y-01 VoiceOver` subsections.

    If any item fails: capture the failure, create a follow-up gap entry, and type "gaps" as the resume signal (I'll re-plan). If all items pass, flip VERIFICATION.md frontmatter `status: gaps-found` → `status: complete`, update ROADMAP.md Phase 5 entry from `Gaps-found` to `Complete` with today's date, flip REQUIREMENTS.md A11Y-03 traceability row from Pending to Complete, and update STATE.md progress.
  </how-to-verify>
  <acceptance_criteria>
    - VERIFICATION.md `Rebuild Audit` section has concrete axe-core counts (not placeholders) at 4 hex values
    - Keyboard walkthrough checklist completed with ✅/❌ per item
    - VoiceOver checklist completed with ✅/❌ per item
    - If all pass: `grep -c "status: complete" .planning/phases/05-design-and-accessibility/05-VERIFICATION.md` → 1
    - If all pass: ROADMAP.md Phase 5 row says "Complete" with date
    - If all pass: REQUIREMENTS.md row for A11Y-03 status says "Complete"
  </acceptance_criteria>
  <resume-signal>Type "approved" when all four hex values + keyboard + VoiceOver pass. Type "gaps" with a list of failures to trigger another gap-closure wave. Type specific failure descriptions if individual items fail.</resume-signal>
</task>

</tasks>

<verification>
- VERIFICATION.md has the Rebuild Audit section with concrete evidence
- Phase 5 status: complete if audit passes
- All 10 gaps G1–G10 closed and audited
</verification>

<success_criteria>
axe-core clean at all 4 hex values. Keyboard walkthrough passes all stops. VoiceOver smoke test passes all announcements. Phase 5 flips to complete status.
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-08-SUMMARY.md` and update `.planning/STATE.md` progress + status.
</output>
</content>
</invoke>