---
phase: 09-responsive-fixes
verified: 2026-04-25T00:00:00Z
status: human_needed
score: 4/6 must-haves verified (2 require human visual sweep)
human_verification:
  - test: "Viewport sweep at 320 / 360 / 480 / 767 / 991 / 1400 / 1500 widths in a real browser"
    expected: "All four pill labels (AA Normal, AA Large, AAA Normal, AAA Large) fully readable on both light and dark preview panels in both AA and AAA toggle states. Hex input fully visible in topbar with no horizontal document scrollbar at any width. document.documentElement.scrollWidth === window.innerWidth at every width. AA/AAA toggle still works at every width. Out-of-scope surfaces (.alts, .preview, .preview-tabs) look identical at 481px vs 479px."
    why_human: "RESP-01 and RESP-02 are inherently visual layout requirements. Browser layout engines render media-query breakpoints and clamp() font-size scaling that JSDOM does not implement. CONTEXT.md decision D-11 mandates this seven-width manual sweep and Plan 09-01 Task 3 was a checkpoint:human-verify gate. SUMMARY.md states the gate was auto-approved under --auto without an actual visual sweep being performed."
  - test: "iOS Safari focus-zoom check on a real iPhone or iOS Simulator"
    expected: "Tapping the hex input at narrow viewport must NOT trigger Safari focus-zoom. The clamp(16px, 4.5vw, 22px) floor of 16px is the iOS-safe threshold (D-05)."
    why_human: "Desktop DevTools cannot reproduce iOS Safari's focus-zoom heuristic. Decision D-05 requires confirmation on a real iOS device."
  - test: "axe DevTools accessibility scan at 320px and 767px"
    expected: "No new critical/serious issues vs the v1.0 Phase 5 baseline. Fail-pill colours #555555 (light) and #d1d5db (dark) at style.css lines 377-380 remain readable."
    why_human: "Tool runs in browser DevTools UI; not callable from headless static checks for this project."
---

# Phase 9: Responsive Fixes Verification Report

**Phase Goal:** Layout holds together at narrow viewport widths — no clipped badge labels, no horizontal overflow from the hex input.
**Verified:** 2026-04-25
**Status:** human_needed
**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | User at 320px sees all four pill labels fully readable on both panels | ? UNCERTAIN | CSS shape supports it (`.pills { repeat(2, 1fr) }`, `.pill { flex-wrap: wrap; padding: 6px 12px }`, `.pill-label { overflow-wrap: anywhere }` at style.css 519-543) but visual fit cannot be asserted by static analysis. Needs human sweep at the seven D-11 widths. |
| 2 | User at 320px sees hex input fully visible inside topbar with no document scrollbar | ? UNCERTAIN | CSS shape supports it (`.row-one { min-width: 0 }`, `.hex-input { min-width: 0; padding: 0 12px }`, `font-size: clamp(16px, 4.5vw, 22px)` at style.css 534-542). Real layout outcome needs human verification. |
| 3 | User at 360 / 480 / 767 / 991 / 1400 / >1400 sees no clipped labels and no overflowing input | ? UNCERTAIN | Cascade order verified (767 < 480 < focus, awk: `ORDER OK 434<519<545`). No regression-causing rules introduced. Width-by-width visual outcome needs human sweep. |
| 4 | AA/AAA toggle behaves identically with respect to layout fit at all widths | ? UNCERTAIN | No CSS coupling between toggle state and the new 480px block. Toggle handler logic is JS (untouched). Visual confirmation manual. |
| 5 | Tool continues to pass WCAG AA chrome contrast at all widths (no regression of #555555 / #d1d5db pill-label fallbacks from Phase 5) | ✓ VERIFIED | style.css lines 377-380 (Phase 5 fallback overrides for `.preview.is-light .pill-label / .pill.fail` and dark equivalents) untouched. New block at 519-543 contains no colour declarations. Static-grep confirms no out-of-scope selectors changed. |
| 6 | Existing Phase 7/8 regression tests stay green after CSS edits | ✓ VERIFIED | `node --test test/*.test.js` returns 121/121 pass, 0 fail across 30 suites. |

**Score:** 2/6 fully VERIFIED, 4/6 UNCERTAIN pending human sweep.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `style.css` | New `@media (max-width: 480px)` block appended after the 767 block, before focus-styles section | ✓ VERIFIED | Block present at lines 519-543. Contains `@media (max-width: 480px)`. Sits immediately after the 767 block (ends line 516) and before `/* --- Unified focus --- */` at line 545. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| style.css 480px block | `.pills` | `grid-template-columns: repeat(2, 1fr)` overriding the 767 block's `repeat(4, 1fr)` | ✓ WIRED | Match found at line 522. Cascade order verified: 767 block (line 434) precedes 480 block (line 519). Later block wins for `max-width` queries — addresses Pitfall 3. |
| style.css 480px block | `.row-one`, `.hex-input` | `min-width: 0` propagation up the flex chain | ✓ WIRED | `.row-one { min-width: 0 }` at line 534, `.hex-input { min-width: 0 }` at line 536. Both inside the new media block. |
| style.css 480px block | `.hex-input input[type="text"]` and `.hex-input .hash` | `font-size: clamp(16px, 4.5vw, 22px)` iOS-safe floor | ✓ WIRED | Match at line 541 inside the combined selector at lines 539-542. |

### Data-Flow Trace (Level 4)

Not applicable — phase produces CSS only, no dynamic data rendering paths introduced.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| 480px block present | `grep -E "@media \(max-width: 480px\)" style.css` | match found | ✓ PASS |
| 2-col pill grid override | `grep -E "grid-template-columns:\s*repeat\(2,\s*1fr\)" style.css` | match found at line 522 | ✓ PASS |
| min-width 0 on flex chain | `grep -nE "min-width:\s*0" style.css \| grep -E "(hex-input\|row-one)"` | 2 matches (lines 534, 536) | ✓ PASS |
| iOS-safe clamp floor | `grep -E "clamp\(16px,\s*4\.5vw,\s*22px\)" style.css` | match at line 541 | ✓ PASS |
| No nowrap on pill scope (D-03 guard) | `grep -nE "white-space:\s*nowrap" style.css \| grep -i pill` | 0 matches | ✓ PASS |
| No ellipsis truncation (D-02 guard) | `grep -nE "text-overflow:\s*ellipsis" style.css` | 0 matches | ✓ PASS |
| Cascade order 767 < 480 < focus | awk one-liner | `ORDER OK 434<519<545` | ✓ PASS |
| Regression suite | `node --test test/*.test.js` | 121/121 pass, 0 fail, 30 suites | ✓ PASS |
| Visual layout fit at 7 widths | n/a — requires real browser | — | ? SKIP (routed to human_verification) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| RESP-01 | 09-01 | Badge labels remain fully visible at all supported viewport widths — no off-screen clipping | ? NEEDS HUMAN | CSS implementation lands at style.css 519-531 (2-col grid, padding trim, flex-wrap, overflow-wrap). Static gates pass. Visual fit at 320/360/480/767/991/1400/1500 needs human eye. |
| RESP-02 | 09-01 | Hex input scales with viewport at narrow widths — no min-width overflow | ? NEEDS HUMAN | CSS implementation lands at style.css 534-542 (min-width:0 on row-one and hex-input, clamp font-size). Static gates pass. Document overflow check needs real browser. |

REQUIREMENTS.md already shows both as Complete (lines 21-22, 47-48), based on the auto-approved checkpoint. Verifier flags this as premature — the human sweep mandated by D-11 has not occurred.

No orphaned requirements — REQUIREMENTS.md maps RESP-01 and RESP-02 to Phase 9, both claimed in plan 09-01 frontmatter.

### Anti-Patterns Found

None. Static-grep audit clean:
- No `white-space: nowrap` on pill scope (D-03 guard intact).
- No `text-overflow: ellipsis` anywhere in style.css (D-02 guard intact, no abbreviation).
- No new selectors on out-of-scope surfaces (`.alts`, `.preview`, `.bg-tag`, `.fg-tag`, `.heading`, `.para`, `.digits`).
- No TODO/FIXME/placeholder strings introduced in the new block.

### Human Verification Required

#### 1. Seven-width visual sweep (D-11)

**Test:** Serve `index.html` (e.g. `python3 -m http.server 8000`), open in Chrome, toggle Device Toolbar (Cmd+Shift+M), enter hex `#3366cc`. Resize to 1500 → 1400 → 991 → 767 → 480 → 360 → 320. At each width check both light and dark preview panels in both AA and AAA toggle states.

**Expected:**
- All four pill labels ("AA Normal", "AA Large", "AAA Normal", "AAA Large") fully readable. Wrapping acceptable, abbreviation not.
- Hex input fully visible inside topbar; cursor reaches end of value. Swatch (36px) and `#` glyph stay fixed-size.
- `document.documentElement.scrollWidth === window.innerWidth` returns `true` in DevTools console at every width.
- AA/AAA toggle still flips state and re-runs search at every width.
- Out-of-scope surfaces (`.alts`, `.preview-tabs`, `.preview` panels) look identical at 481px vs 479px.

**Why human:** Browser layout engine behaviour. JSDOM does not implement layout. The plan flags this as `checkpoint:human-verify gate="blocking"`.

#### 2. iOS Safari focus-zoom (D-05)

**Test:** Open the page on a real iPhone or iOS Simulator at narrow width. Tap the hex input.

**Expected:** Page does NOT zoom on focus. The 16px floor in `clamp(16px, 4.5vw, 22px)` is the iOS-safe threshold.

**Why human:** Cannot be reproduced in desktop DevTools. Decision D-05 explicitly requires real-device verification.

#### 3. axe DevTools accessibility scan at 320px and 767px

**Test:** With the page open at 320px and again at 767px, run an axe DevTools scan.

**Expected:** No new critical or serious issues compared to the v1.0 Phase 5 baseline. Fail-pill colours `#555555` (light) and `#d1d5db` (dark) at style.css lines 377-380 remain readable.

**Why human:** axe DevTools runs in the browser extension UI; not currently scripted in this project.

### Gaps Summary

The CSS landed correctly. All static-grep audits and the 121-test regression suite pass. The two requirements RESP-01 and RESP-02 are visual-layout requirements whose final acceptance depends on rendering in a real browser at the seven D-11 widths. Plan 09-01's Task 3 was a `checkpoint:human-verify` gate that was auto-approved under the orchestrator's `--auto` chain. SUMMARY.md flags this and recommends `human_needed`.

No code gaps. The blocker is the missing human visual sweep plus the iOS focus-zoom and axe spot-checks. Once a human runs the sweep documented above and reports back, the phase can be promoted to `passed` (or to `gaps_found` if a width fails).

---

_Verified: 2026-04-25_
_Verifier: Claude (gsd-verifier)_
