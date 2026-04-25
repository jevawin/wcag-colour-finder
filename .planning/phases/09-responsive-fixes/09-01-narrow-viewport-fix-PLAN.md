---
phase: 09-responsive-fixes
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - style.css
autonomous: false
requirements:
  - RESP-01
  - RESP-02
nyquist_compliant: true
must_haves:
  truths:
    - "User at 320px viewport sees all four pill labels (AA Normal, AA Large, AAA Normal, AAA Large) fully readable on both light and dark preview panels"
    - "User at 320px viewport sees the hex input fully visible inside the topbar with no horizontal scrollbar on the document"
    - "User at 360 / 480 / 767 / 991 / 1400 / >1400 widths sees no clipped pill labels and no overflowing hex input"
    - "User toggling AA / AAA at any width sees both states behave identically with respect to layout fit"
    - "Tool continues to pass WCAG AA chrome contrast at all widths (no regression of #555555 / #d1d5db pill-label fallbacks set in Phase 5)"
    - "Existing Phase 7/8 regression tests stay green after CSS edits"
  artifacts:
    - path: "style.css"
      provides: "New @media (max-width: 480px) block appended after the existing 767 block, before the focus-styles section"
      contains: "@media (max-width: 480px)"
  key_links:
    - from: "style.css @media (max-width: 480px) block"
      to: ".pills"
      via: "grid-template-columns: repeat(2, 1fr) override of the 767 block's repeat(4, 1fr)"
      pattern: "grid-template-columns:\\s*repeat\\(2,\\s*1fr\\)"
    - from: "style.css @media (max-width: 480px) block"
      to: ".row-one, .hex-input"
      via: "min-width: 0 propagation up the flex chain"
      pattern: "min-width:\\s*0"
    - from: "style.css @media (max-width: 480px) block"
      to: ".hex-input input[type=\"text\"]"
      via: "font-size: clamp(16px, 4.5vw, 22px) — iOS-safe floor"
      pattern: "clamp\\(16px,\\s*4\\.5vw,\\s*22px\\)"
---

<objective>
Close RESP-01 and RESP-02 by adding a narrow-viewport CSS block to `style.css`. Pills relax from 4-col to 2-col below 480px so the labels "AA Normal" / "AA Large" / "AAA Normal" / "AAA Large" stay fully visible. The hex input shrinks fluidly down to 320px without pushing content off-screen.

Purpose: the layout currently breaks below 480px — `@media (max-width: 767px)` forces `.pills` back to `repeat(4, 1fr)` width:100% which clips the four full-text labels, and `.hex-input` lacks `min-width: 0` on its flex container so the 22px monospace input refuses to shrink.

Output:
- One new `@media (max-width: 480px)` block in `style.css`, appended after line 516 (end of existing 767 block) and before line 518 (focus-styles section).
- No changes to `index.html` or `app.js`.
- No new dependencies; no build step.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-responsive-fixes/09-CONTEXT.md
@.planning/phases/09-responsive-fixes/09-RESEARCH.md
@.planning/phases/09-responsive-fixes/09-VALIDATION.md
@CLAUDE.md
@style.css
@app.js
@index.html

<interfaces>
<!-- The exact shape of the surface this plan touches. Executor uses these directly — no exploration needed. -->

style.css existing breakpoint ladder (cascade order matters; max-width queries are NOT specificity-ordered):
- Line 341–343: @media (max-width: 991px) — `.ratio-row { flex-wrap: wrap; }`
- Line 360–362: @media (max-width: 1400px) — `.pills { grid-template-columns: repeat(2, auto); }`
- Line 434–516: @media (max-width: 767px) — large mobile reflow block. Sets `.pills { grid-template-columns: repeat(4, 1fr); width: 100%; }` at 508–511, which is the RESP-01 root cause at <480px.
- Line 518: `/* --- Unified focus — A11Y-03 --- */` — focus-styles section starts. NEW BLOCK GOES IMMEDIATELY BEFORE THIS LINE.

style.css base rules touched by the new block:
- Line 73–78: `.row-one { display: flex; gap: 12px; align-items: stretch; margin-bottom: 32px; max-width: 720px; }`
- Line 97–105: `.hex-input { flex: 1; display: flex; align-items: center; gap: 10px; … padding: 0 16px; height: 72px; }`
- Line 114: `.hex-input .hash { … font-size: 22px; }`
- Line 115–123: `.hex-input input[type="text"] { flex: 1; … font-size: 22px; min-width: 0; }`
- Line 353–359: `.pills { display: grid; grid-template-columns: repeat(4, auto); gap: 10px 18px; justify-content: start; }`
- Line 363: `.pill-wrap { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }`
- Line 364–371: `.pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 5px; font-size: 17px; font-weight: 700; … }`
- Line 375: `.pill-label { font-size: 16px; … }`
- Line 377–380: AA-fallback overrides — `#555555` on `.preview.is-light .pill-label / .pill.fail`, `#d1d5db` on `.preview.is-dark` equivalents. DO NOT TOUCH.

Pill markup contract (app.js buildPillHTML, lines 93–97):
```html
<div class="pill-wrap">
  <span class="pill (pass|fail)">
    <span class="glyph" aria-hidden="true">✓ or ✕</span>
    Pass or Fail
  </span>
  <span class="pill-label">AA Normal | AA Large | AAA Normal | AAA Large</span>
</div>
```

Out-of-scope CSS surfaces (DO NOT touch in the new block):
- `.alts`, `.alt`, `.alt .chips`, `.alt .hex` (lines 179–219, 454–461)
- `.preview`, `.previews`, `.preview-tabs`, `.preview-inner` (lines 221–238, 405–432, 463–505)
- `.bg-tag`, `.fg-tag`, `.tag-label` (lines 239–331, 484–505)
- Specimen typography `.heading`, `.para`, `.digits` (lines 382–403, 512–515)
- Focus styles (lines 518–547)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Add @media (max-width: 480px) block to style.css for RESP-01 + RESP-02</name>
  <files>style.css</files>
  <read_first>
    - .planning/phases/09-responsive-fixes/09-CONTEXT.md (locked decisions D-01..D-12 — vanilla CSS only, preserve label text, 320px floor, iOS 16px floor)
    - .planning/phases/09-responsive-fixes/09-RESEARCH.md §"Concrete Change Recipe" + §"Code Examples" — exact CSS to insert
    - style.css lines 70–125 (.row-one, .hex-input, .target-toggle — current rules)
    - style.css lines 333–380 (.ratio-row, .pills, .pill, .pill-wrap, .pill-label — current rules)
    - style.css lines 434–516 (existing 767 block — the one being narrowed below 480)
    - style.css lines 516–520 (insertion point — between end of 767 block and `/* --- Unified focus --- */`)
  </read_first>
  <action>
    Append a new media block to `style.css` immediately after the closing `}` of the `@media (max-width: 767px)` block (currently line 516) and immediately before the `/* --- Unified focus — A11Y-03 --- */` comment (currently line 518). Source order MUST place this new block AFTER the 767 block — `max-width` media queries are not specificity-ordered, the later block wins (Pitfall 3 in research).

    Insert exactly this block (preserve declarations and comments verbatim — addresses D-01..D-08):

    ```css

    /* RESP-01 + RESP-02 — narrow-viewport fixes (Phase 9) */
    @media (max-width: 480px) {
      /* RESP-01: pills relax from 4-col to 2-col so full label text fits */
      .pills {
        grid-template-columns: repeat(2, 1fr);
      }
      .pill-wrap { min-width: 0; }            /* allow grid cell to shrink and contain wrapping label */
      .pill {
        flex-wrap: wrap;                       /* allow glyph + Pass/Fail to wrap if cell is very narrow */
        padding: 6px 12px;                     /* trim padding so 2-col fits the 320px floor */
      }
      .pill-label {
        overflow-wrap: anywhere;               /* defensive: break long words if they ever appear */
      }

      /* RESP-02: hex input scales fluidly down to the 320px floor */
      .row-one { min-width: 0; }
      .hex-input {
        min-width: 0;
        padding: 0 12px;                       /* trim from 16px so 320px viewport fits */
      }
      .hex-input input[type="text"],
      .hex-input .hash {
        font-size: clamp(16px, 4.5vw, 22px);   /* iOS-safe floor (≥16px avoids Safari focus zoom — D-05) */
      }
    }
    ```

    Constraints:
    - Do NOT modify any existing rule outside this new block. Per D-08/D-09, surface must stay minimal.
    - Do NOT add `white-space: nowrap` anywhere in this block (D-03 guard; research Pitfall 1).
    - Do NOT add `text-overflow: ellipsis` or any abbreviation/truncation (D-02 — preserve full label text).
    - Do NOT touch `.alts`, `.preview`, `.previews`, `.bg-tag`, `.fg-tag`, `.tag-label`, `.preview-tabs`, `.heading`, `.para`, `.digits`, focus styles (research §"Out of scope edits").
    - Do NOT touch `.target-toggle` / `.target-opt`. The 767 block already wraps the toggle to its own row; verify in Task 3 that it survives below 480px without further edits (D-06). Only revisit if Task 3 finds overflow.
    - British spelling — no UI text added in this task.
  </action>
  <verify>
    <automated>cd /Users/jamiepersonal/Developer/wcag-colour-finder && grep -E "@media \(max-width: 480px\)" style.css && grep -E "grid-template-columns:\s*repeat\(2,\s*1fr\)" style.css && grep -E "min-width:\s*0" style.css | grep -E "(hex-input|row-one)" && grep -E "clamp\(16px,\s*4\.5vw,\s*22px\)" style.css && (grep -nE "white-space:\s*nowrap" style.css | grep -i "pill" && echo "FAIL: nowrap on pill scope" && exit 1; true) && (grep -nE "text-overflow:\s*ellipsis" style.css && echo "FAIL: ellipsis introduced" && exit 1; true) && node --test test/</automated>
  </verify>
  <acceptance_criteria>
    - `grep -E "@media \(max-width: 480px\)" style.css` returns at least one match.
    - `grep -E "grid-template-columns:\s*repeat\(2,\s*1fr\)" style.css` returns a match (new 2-col rule).
    - `grep -E "min-width:\s*0" style.css | grep -E "(hex-input|row-one)"` returns at least 2 matches (one each for `.hex-input` and `.row-one` inside the new block).
    - `grep -E "clamp\(16px,\s*4\.5vw,\s*22px\)" style.css` returns a match (font-size floor for input + hash).
    - `grep -nE "white-space:\s*nowrap" style.css | grep -i "pill"` returns NOTHING (no nowrap on pill/pill-label scope — D-03).
    - `grep -nE "text-overflow:\s*ellipsis" style.css` returns NOTHING (no truncation — D-02).
    - The new block appears AFTER the line containing `@media (max-width: 767px)` and BEFORE the line containing `/* --- Unified focus`. Verify with: `awk '/@media \(max-width: 767px\)/{a=NR} /@media \(max-width: 480px\)/{b=NR} /Unified focus/{c=NR} END{ if(a<b && b<c) print "ORDER OK"; else print "ORDER BAD a="a" b="b" c="c }' style.css` prints `ORDER OK`.
    - `node --test test/` runs and all existing Phase 7/8 tests stay green (regression gate per 09-VALIDATION.md row 9-01-01/02).
    - File `style.css` line count increased by approximately 18–22 lines from previous 547.
  </acceptance_criteria>
  <done>
    style.css contains the new 480px breakpoint block in the correct cascade position, all five static-grep assertions in 09-VALIDATION.md (rows 9-01-03, 9-01-04, 9-01-05) pass, and the existing node:test suite stays green.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Run regression suite + grep audit to confirm no regression</name>
  <files>(no file edits — verification only)</files>
  <read_first>
    - .planning/phases/09-responsive-fixes/09-VALIDATION.md §"Per-Task Verification Map" (rows 9-01-01..9-01-05) and §"Sampling Rate"
    - .planning/phases/09-responsive-fixes/09-RESEARCH.md §"Risks / Regressions to Watch"
  </read_first>
  <action>
    Run the full validation gate from `.planning/phases/09-responsive-fixes/09-VALIDATION.md`. Do NOT modify any file in this task. If any check fails, return to Task 1 to fix; do not patch around failures here.

    Execute, in order:

    1. `node --test test/` — full Phase 1–8 regression suite. MUST be all green. This is the behavioural-regression gate (D-12).
    2. `grep -E "@media \(max-width: 480px\)" style.css` — must return ≥1 match (9-VALIDATION row 9-01-03).
    3. `grep -nE "white-space:\s*nowrap" style.css | grep -i "pill"` — must return nothing (9-VALIDATION row 9-01-04, D-03 guard).
    4. `grep -E "min-width:\s*0" style.css | grep -E "(hex-input|row-one|base-row)"` — must return ≥2 matches across `.hex-input` / `.row-one` (9-VALIDATION row 9-01-05). `.base-row` is fine if absent (it's the bg-tag row, not the hex-input flex chain — D-04 lists it for safety; current chain analysis in 09-RESEARCH §"Pattern 2" confirms only `.row-one` and `.hex-input` need it).
    5. `grep -nE "text-overflow:\s*ellipsis" style.css` — must return nothing (D-02 guard).
    6. `awk '/@media \(max-width: 767px\)/{a=NR} /@media \(max-width: 480px\)/{b=NR} /Unified focus/{c=NR} END{ if(a<b && b<c) print "ORDER OK"; else print "ORDER BAD a="a" b="b" c="c }' style.css` — must print `ORDER OK` (cascade-order check, Pitfall 3).
    7. `grep -cE "^\.alts\b|^\.alt\b|^\.preview\b|^\.bg-tag\b|^\.fg-tag\b|^\.heading\b|^\.para\b|^\.digits\b" style.css` — record value before and after; must be unchanged (no new selectors added on out-of-scope surfaces). If unchanged, the new block did not stray.

    Report results in the task summary using the row IDs from 09-VALIDATION.md.
  </action>
  <verify>
    <automated>cd /Users/jamiepersonal/Developer/wcag-colour-finder && node --test test/ && grep -E "@media \(max-width: 480px\)" style.css && (grep -nE "white-space:\s*nowrap" style.css | grep -i "pill" && exit 1; true) && grep -E "min-width:\s*0" style.css | grep -E "(hex-input|row-one)" && (grep -nE "text-overflow:\s*ellipsis" style.css && exit 1; true) && awk '/@media \(max-width: 767px\)/{a=NR} /@media \(max-width: 480px\)/{b=NR} /Unified focus/{c=NR} END{ if(a<b && b<c) exit 0; else exit 1 }' style.css</automated>
  </verify>
  <acceptance_criteria>
    - `node --test test/` exits 0 with all existing tests passing (Phase 7/8 regression gate).
    - All 6 grep / awk audits above produce the expected results documented in `09-VALIDATION.md` rows 9-01-01 through 9-01-05.
    - No new selectors introduced on `.alts`, `.alt`, `.preview`, `.bg-tag`, `.fg-tag`, `.heading`, `.para`, `.digits` (research "Out of scope edits").
    - Task summary records each check with PASS/FAIL and links rows in 09-VALIDATION.md.
  </acceptance_criteria>
  <done>
    Full regression suite green; all six static-grep / cascade-order audits PASS; no out-of-scope surfaces touched. Ready for the human verification gate in Task 3.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human viewport sweep at 320 / 360 / 480 / 767 / 991 / 1400 / >1400 (D-11)</name>
  <files>(no file edits — manual verification only)</files>
  <read_first>
    - .planning/phases/09-responsive-fixes/09-CONTEXT.md §"Verification" (D-11)
    - .planning/phases/09-responsive-fixes/09-VALIDATION.md §"Manual-Only Verifications"
    - .planning/phases/09-responsive-fixes/09-RESEARCH.md §"Verification per D-11 (full sweep)"
  </read_first>
  <what-built>
    A new `@media (max-width: 480px)` block in `style.css` (Task 1) that:
    - Drops `.pills` to 2-col below 480px so all four pill labels fit (RESP-01).
    - Trims `.pill` padding to 6px 12px and allows wrap.
    - Adds `min-width: 0` on `.row-one` and `.hex-input` so the hex input shrinks (RESP-02).
    - Trims `.hex-input` padding to 0 12px and clamps the input + `#` font-size at `clamp(16px, 4.5vw, 22px)` (iOS-safe floor).
    Regression suite (Task 2) is green; cascade order audited.
  </what-built>
  <action>
    PAUSE for human visual verification. Do not proceed past this checkpoint without an explicit "approved" reply (or "approved (iOS skipped)") from the user. Present the `<how-to-verify>` instructions verbatim, then wait for the resume signal.
  </action>
  <how-to-verify>
    1. From the project root, serve the file (e.g. `python3 -m http.server 8000` in a separate terminal) or open `index.html` directly. Visit in Chrome.
    2. Open Chrome DevTools → toggle Device Toolbar (Cmd+Shift+M) → set "Responsive".
    3. Enter the test hex `#3366cc` in the hex input. (Default `#2563EB` also works.)
    4. At each width below, verify all checks pass for BOTH light and dark preview panels AND in BOTH AA and AAA toggle states. Use the AA/AAA toggle next to the hex input to flip threshold.

       **Width sweep — sized in this exact order to catch cascade transitions:**
       - 1500px (above 1400)
       - 1400px (1400 boundary)
       - 991px (991 boundary)
       - 767px (767 boundary)
       - 480px (480 boundary — NEW)
       - 360px (between 480 floor and 320 floor)
       - 320px (D-07 floor — tightest test)

       **Per-width checks:**
       a. All four pill labels — "AA Normal", "AA Large", "AAA Normal", "AAA Large" — fully readable on both panels. No clipping, no ellipsis, no missing characters. Wrapping onto a second line is acceptable; abbreviation is NOT.
       b. Hex input is fully visible inside the topbar. The cursor reaches the end of the value. The swatch (36px) and `#` glyph remain fixed-size; only the input text scales.
       c. No horizontal scrollbar on the document. Run `document.documentElement.scrollWidth === window.innerWidth` in the DevTools console — should return `true` at every width.
       d. AA/AAA toggle still works — clicking it changes the active state and re-runs search. Layout does not break when toggling at any width.

    5. Spot-check accessibility: at 320px and 767px, run an axe DevTools scan. No NEW critical/serious issues vs the v1.0 Phase 5 baseline. The fail-pill colours `#555555` (light) and `#d1d5db` (dark) must remain readable (lines 377–380, untouched).

    6. iOS focus-zoom check (D-05): if a real iPhone or Safari iOS Simulator is available, open the page on iOS Safari at narrow width and tap the hex input. The page MUST NOT zoom. (Desktop DevTools cannot reproduce this — skip if no iOS device, but note the skip in the resume signal.)

    7. (Out-of-scope regression check, sanity) At 481px and 479px, the `.alts` row, `.preview-tabs`, and `.preview` panels should look identical at both widths — the 480 block does not touch these surfaces.
  </how-to-verify>
  <verify>
    <automated>MANUAL — see &lt;how-to-verify&gt;. No automated check available; layout regressions require a real browser layout engine (JSDOM does not implement layout). Cross-referenced in 09-VALIDATION.md §"Manual-Only Verifications". Do NOT mark this task complete without explicit user "approved" reply.</automated>
  </verify>
  <acceptance_criteria>
    - User has explicitly replied "approved" (or "approved (iOS skipped)") in the chat.
    - All seven widths × both panels × both AA/AAA states verified per `<how-to-verify>` steps 4a–4d.
    - axe DevTools spot-checks at 320px and 767px show no new critical/serious issues.
    - Out-of-scope surfaces (`.alts`, `.preview`, `.preview-tabs`) look identical at 481px and 479px.
    - If user describes a failure, return to Task 1 to fix; do NOT mark this task done.
  </acceptance_criteria>
  <done>
    User has approved. Manual sweep documented in plan SUMMARY with per-width × per-panel × per-state results recorded. iOS test status (pass / skip) noted.
  </done>
  <resume-signal>
    Reply "approved" if ALL widths × both panels × both AA/AAA states show: full pill labels, fully visible hex input, no horizontal scrollbar, working toggle, and no contrast regression. If iOS could not be tested, reply "approved (iOS skipped)". Otherwise describe the failing width + panel + state precisely so Task 1 can be revisited.
  </resume-signal>
</task>

</tasks>

<verification>
Phase-level checks (run after Task 3 approves):

1. `node --test test/` — full suite still green.
2. Manual sweep at 320 / 360 / 480 / 767 / 991 / 1400 / 1500 documented in this plan's SUMMARY.
3. Static-grep gate (matches 09-VALIDATION.md rows 9-01-03..9-01-05):
   - `grep -E "@media \(max-width: 480px\)" style.css` → ≥1
   - `grep -nE "white-space:\s*nowrap" style.css | grep -i "pill"` → 0 matches
   - `grep -E "min-width:\s*0" style.css | grep -E "(hex-input|row-one)"` → ≥2
4. Cascade-order check (awk one-liner above) prints `ORDER OK`.
5. RESP-01, RESP-02 boxes in `.planning/REQUIREMENTS.md` Traceability table flipped to Complete.
</verification>

<success_criteria>
- All four pill labels remain fully visible at 320 / 360 / 480 / 767 / 991 / 1400 / 1500 widths on both light and dark panels in both AA and AAA toggle states (RESP-01).
- Hex input fully visible at all widths down to 320px floor with no horizontal document scroll (RESP-02).
- iOS Safari does NOT zoom on focus when a real iOS device is tested (D-05; skip permitted with note).
- Phase 7/8 regression suite stays green (D-12).
- WCAG AA chrome contrast unchanged from Phase 5 (`#555555`, `#d1d5db` fallbacks intact at lines 377–380).
- One CSS file modified (`style.css`); no `index.html` or `app.js` changes.
</success_criteria>

<output>
After completion, create `.planning/phases/09-responsive-fixes/09-01-SUMMARY.md` covering:
- Files touched (style.css only) + line range of new block.
- Static-grep results (5 rows from 09-VALIDATION.md).
- Manual sweep results: 7 widths × 2 panels × 2 toggle states grid.
- Any deviation from research recipe + reason.
- iOS test result (or skip).
- Confirmation that RESP-01 and RESP-02 are closed.
</output>
