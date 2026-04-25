# Phase 9: Responsive Fixes - Research

**Researched:** 2026-04-25
**Domain:** CSS responsive layout — flex/grid narrow-viewport behaviour
**Confidence:** HIGH (root cause directly readable in existing CSS; techniques are standard CSS)

## Summary

Two narrow-viewport defects, one root cause family each, both fixable with CSS-only edits in `style.css`. Phase 9 closes RESP-01 (badge label clipping) and RESP-02 (hex input overflow) without touching `index.html` or `app.js` markup.

RESP-01 root cause: at viewports below 1400px the `.pills` grid drops to 2 columns (good), but the `@media (max-width: 767px)` block at lines 508–511 forces it back to `repeat(4, 1fr)` with `width: 100%` — squeezing four full-text labels ("AA Normal", "AAA Normal" etc.) into quarter-width tracks. The `.pill` itself uses `inline-flex` and `padding: 8px 16px` with no wrap allowance, so the pill gets clipped by its column. The `.pill-label` is in its own row beneath the pill (`.pill-wrap` is `flex-direction: column`), so it can wrap on its own — but it inherits the same narrow column width.

RESP-02 root cause: `.hex-input` (line 97) is `flex: 1` inside `.row-one` (line 73, `display: flex`), with `max-width: 720px` on `.row-one`. Below ~480px the 22px monospace font + swatch (36px) + `#` glyph + horizontal padding (16px each side) sums to a minimum content width that exceeds the viewport. Although `min-width: 0` is set on the inner text input (line 122) — correct — the `.hex-input` flex container itself has no `min-width: 0`, so it does not shrink below its intrinsic content size. The `.row-one` flex container also lacks an explicit `min-width: 0`, but at 767px it switches to `flex-wrap: wrap` so the hex input gets a full row — overflow is therefore most visible just above 767px down to ~480px and below the 320px floor on landscape narrow phones with 22px content.

**Primary recommendation:** Add a new `@media (max-width: 480px)` block that (a) drops `.pills` from 4-col to a wider 2-col layout (`repeat(2, 1fr)` width:100%) so labels fit, and (b) propagates `min-width: 0` through `.row-one` and `.hex-input`, plus `clamp()` on the input font-size with a 16px floor. Allow `.pill` to wrap or shrink padding on narrow widths. Verify at 320 / 360 / 480 / 767 / 991 / 1400 / >1400.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**RESP-01 Badge Label Visibility**
- **D-01:** Fix via CSS-only — pills + labels wrap inside their grid cell; introduce intermediate breakpoint (~480px) so 4-col → 2-col → 1-col grid degrades cleanly. Existing 1400px breakpoint already drops to 2-col; mobile (≤767px) currently forces `repeat(4, 1fr)` width:100% which is the clipping culprit at <480px.
- **D-02:** Preserve full label text ("AA Normal" etc.) — do NOT abbreviate. Wrapping or stacking is acceptable; truncation/ellipsis is not.
- **D-03:** `.pill` and `.pill-label` must allow `flex-wrap`/text wrap; remove any `white-space: nowrap` that prevents this in the affected scope.

**RESP-02 Hex Input Scaling**
- **D-04:** Hex input must scale fluidly down to the supported viewport floor. Ensure `min-width: 0` propagates through the flex chain (`.row-one`, `.base-row`, `.hex-input`) so the text input shrinks.
- **D-05:** Use `clamp()` on input font-size if needed to prevent the 22px monospace hex from forcing horizontal overflow on narrow widths. Keep readable floor (≥16px to avoid iOS zoom on focus).
- **D-06:** Swatch + `#` prefix stay fixed-size — only the text input flexes. Toggle (AA/AAA) wraps to its own row at the existing 767px breakpoint (already implemented); confirm it survives below 480px.

**Supported Viewport Floor**
- **D-07:** Floor = 320px width. Above the floor: no horizontal scroll, no clipped badge labels, no overflowing hex input.

**Approach**
- **D-08:** CSS-only fix. No JS resize observers, no JS-driven layout. Vanilla constraint holds.
- **D-09:** No new dependencies; no build step.
- **D-10:** No regression of v1.0 Phase 5 WCAG AA UI contrast.

**Verification**
- **D-11:** Manual viewport-resize check at 320 / 360 / 480 / 767 / 991 / 1400 / >1400. Both light + dark preview panels. Both AA and AAA toggle states.
- **D-12:** Re-run existing regression tests (Phase 8 Plan 03) and confirm no behavioural regression.

### Claude's Discretion

- Exact intermediate breakpoint value (480px is a starting recommendation — researcher/planner may pick a different value if measurement shows a better break point).
- Whether to wrap pill labels under the pill, stack them vertically, or both depending on width.
- Whether `clamp()` or a discrete media-query font-size step is cleaner.

### Deferred Ideas (OUT OF SCOPE)

- Full responsive design audit (touch target sizing, landscape orientation, ultra-wide handling) — capture as v1.2 candidate if observed during testing.
- Container queries instead of media queries — modernisation, not a defect fix.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RESP-01 | Badge labels (AA Normal / AA Large / AAA Normal / AAA Large) remain fully visible at all supported viewport widths — no off-screen clipping | Root cause: `.pills` grid forced to `repeat(4, 1fr)` width:100% at ≤767px (style.css:508–511). Fix: new ≤480px breakpoint relaxes to 2-col; allow `.pill` content to wrap; ensure `.pill-wrap` cells have `min-width: 0`. |
| RESP-02 | Hex input container scales with viewport at narrow widths — no min-width overflow pushing content off-screen | Root cause: `.hex-input` (style.css:97) is `flex: 1` but lacks `min-width: 0` on container; 22px monospace input pushes intrinsic min content width past 320px. Fix: propagate `min-width: 0` up the flex chain; `clamp()` font-size with 16px floor. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Vanilla HTML/CSS/JS** — no frameworks, no build tools, no dependencies. CSS edits land directly in `style.css`.
- **British spelling** in UI text (colour, not color). No new UI strings expected this phase.
- **Modern browsers only** — Chrome, Firefox, Safari, Edge current versions. No IE.
- **Accessibility:** the tool itself must remain WCAG AA compliant — no contrast regression from Phase 5.
- **GSD workflow** — file edits go through plan execution, not direct edits.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| CSS Grid | Native (Baseline 2017) | `.pills` 4/2/1 column ladder | Already used; auto-fits content. |
| CSS Flexbox | Native (Baseline 2015) | `.row-one`, `.base-row`, `.hex-input` | Already used; `min-width: 0` is the canonical narrow-viewport fix. |
| `clamp()` | Native CSS (Baseline 2020) | Fluid font-size with hard floor + ceiling | One declaration replaces a media-query ladder; supported in every browser the project targets. |
| Media queries (`max-width`) | Native CSS | Breakpoint ladder (480/767/991/1400) | Project already uses this pattern; do not switch to container queries (deferred). |

### Supporting
| Technique | Purpose | When to Use |
|-----------|---------|-------------|
| `min-width: 0` on flex children | Override default `min-width: auto` so flex items shrink below intrinsic content size | Any flex child that holds shrinkable text content. Apply up the whole chain — a single missing link blocks shrinking. |
| `flex-wrap: wrap` on pill content | Let pill text break onto a second line inside its grid cell | When label cannot fit in cell width and abbreviation is forbidden (D-02). |
| `font-size: clamp(16px, Xvw, 22px)` | Floor at iOS-safe 16px, scale up to current 22px on wide viewports | RESP-02 hex input. Floor ≥16px avoids iOS Safari focus zoom. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Media-query ladder (480/767/...) | Container queries on `.controls` / `.ratio-row` | Cleaner intent, but DEFERRED per CONTEXT.md. |
| `clamp()` on font-size | Discrete font-size step inside a `@media (max-width: 480px)` block | Discrete is easier to debug; `clamp()` is fewer lines. Researcher leans `clamp()` (D-05 endorses it); planner's call. |
| Wrapping `.pill` content | Two-line `.pill-wrap` (pill on row 1, label on row 2 — already the structure) | The existing column structure already lets the label wrap; the issue is *cell width*, not pill structure. Fix the column count, not the pill internals. |

**No installation needed.** All techniques are native CSS, supported in every targeted browser.

## Architecture Patterns

### Existing Project Structure (do not reorganise)
```
style.css
├── :root + reset (lines 1–22)
├── Top bar + title (24–69)
├── Controls row — .row-one, .hex-input, .target-toggle (70–177)
├── Alts grid (179–219)
├── Previews + tags (221–331)
├── Ratio row + pills (333–380)        ← RESP-01 surface
├── Specimen typography (382–403)
├── Mobile tabs (405–432)
├── @media (max-width: 991px)          ← .ratio-row wrap
├── @media (max-width: 767px) (434–516)  ← RESP-01 root cause: forces .pills to 4-col 100%
└── Focus styles (518–547)
```

### Pattern 1: Breakpoint Ladder (current)
**What:** Existing breakpoints at 1400 / 991 / 767. Each is a discrete `@media (max-width: N)` block in source order.
**When to use:** Phase 9 should slot the new ~480px block *after* the 767px block (cascade order matters — narrower breakpoint must win). Do not nest, do not use min-width.
**Pattern:**
```css
/* style.css — append after line 516 (end of 767 block) */
@media (max-width: 480px) {
  .pills {
    grid-template-columns: repeat(2, 1fr);   /* override the 767 block's repeat(4, 1fr) */
    /* width: 100% inherited from 767 block — leave alone */
  }
  .pill-wrap { min-width: 0; }                /* allow grid cell to shrink */
  .pill { flex-wrap: wrap; }                  /* allow Pass/Fail glyph + word to wrap if needed */
  /* RESP-02 */
  .row-one, .base-row { min-width: 0; }
  .hex-input { min-width: 0; }
  .hex-input input[type="text"] {
    font-size: clamp(16px, 4.5vw, 22px);      /* floor at iOS-safe 16px */
  }
  .hex-input .hash { font-size: clamp(16px, 4.5vw, 22px); }   /* keep `#` aligned with input */
}
```

### Pattern 2: `min-width: 0` Propagation
**What:** Default flex/grid `min-width` is `auto` (intrinsic content size). A nested flex child with long content refuses to shrink below its content. Set `min-width: 0` on every flex/grid container in the chain to allow shrinking.
**Chain for hex input:**
```
.controls (block)            ← grid/flex? actually display:block — no propagation needed here
  └── .row-one (flex)        ← needs min-width: 0
        └── .hex-input (flex container, also flex child) ← needs min-width: 0
              └── input[type=text] (flex child)         ← already has min-width: 0 (line 122) ✓
```
Note: `.base-row` (line 96) is the `.bg-tag` row inside the previews — separate from the hex input chain. CONTEXT.md D-04 lists it for safety; verify the actual chain when planning.

### Anti-Patterns to Avoid
- **Adding `overflow: hidden` to fix overflow.** Hides the bug, doesn't fix it. Content gets clipped silently — labels still missing.
- **Truncating with `text-overflow: ellipsis`.** Forbidden by D-02 (preserve full label text).
- **Switching to icons-only at narrow widths.** Forbidden by D-02. Also breaks A11Y-02 (Phase 5) which requires text + icon redundancy.
- **`white-space: nowrap` anywhere on `.pill` or `.pill-label` scope.** Verified: no `nowrap` exists on these classes today (only on `.alt .hex` line 198 and `.sr-only` line 5). D-03 says "remove if found" — currently nothing to remove, but planner must guard against introducing it.
- **Using `vw` font-size without a floor.** Causes content < 16px on narrow phones → iOS zoom on focus + readability fail. Always wrap in `clamp(16px, Xvw, max)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fluid font sizing | JS `resize` listener that sets font-size on a range | `clamp(min, fluid, max)` | Native CSS, runs on every paint, no JS. |
| Detecting narrow viewport | `window.innerWidth` check | `@media (max-width: 480px)` | Project is vanilla CSS; matches existing breakpoint ladder. |
| Element shrinking below content | Custom min-width calculation | `min-width: 0` on flex/grid children | Browsers do this for free once you opt out of `min-width: auto`. |

**Key insight:** every defect in scope has a single-property CSS solution. Resist any temptation to introduce JS or new markup.

## Common Pitfalls

### Pitfall 1: `min-width: 0` set only on the deepest flex item
**What goes wrong:** input gets `min-width: 0` but parent container does not — parent still refuses to shrink, so the input never gets the chance to shrink either.
**Why it happens:** `min-width: auto` is the default on every flex/grid item. Setting it once doesn't propagate.
**How to avoid:** Set `min-width: 0` on every container in the chain from viewport down to the shrinkable content. Audit by walking the DOM in DevTools and checking computed `min-width` at each level.
**Warning sign:** the inner input has `min-width: 0` (line 122 today) but content still overflows — a clear signal that an ancestor is the bottleneck.

### Pitfall 2: iOS Safari focus zoom
**What goes wrong:** when an `<input>` has `font-size < 16px`, iOS Safari auto-zooms the page when the user taps to focus. Disorientating, breaks layout.
**Why it happens:** Apple's accessibility heuristic — small input fonts are presumed too small to read.
**How to avoid:** floor any responsive input font-size at `16px`. `clamp(16px, 4.5vw, 22px)` is safe. `clamp(14px, ...)` is not.
**Warning sign:** test on a real iOS device or in Safari iOS simulator — DevTools desktop emulation will not reproduce the zoom.

### Pitfall 3: Cascade order with narrower breakpoint blocks
**What goes wrong:** new `@media (max-width: 480px)` block placed *before* the existing `(max-width: 767px)` block. Both match at 480px, but the later block wins by source order — the 767 block's `repeat(4, 1fr)` overrides the new 2-col rule.
**Why it happens:** `max-width` media queries are not specificity-ordered; cascade order applies.
**How to avoid:** append the new 480px block *after* the 767px block (line 516). Do this last in the file before the focus-styles section, OR right at the end of the 767 block — but appending after the closing brace of the 767 block is cleanest.
**Warning sign:** changes don't take effect when narrowing the viewport past 480px.

### Pitfall 4: Forcing `.pills` to 1-col without checking the ratio number
**What goes wrong:** if `.pills` becomes 1-col at 320px, the four pill rows stack vertically and push the specimen content way down. May still look OK because `.ratio-row` already wraps at 991px (line 341–343).
**Why it happens:** `.ratio-row` has `flex-wrap: wrap` enabled below 991px — `.pills` falls to its own line. Below 480px, `.pills` having many rows is fine, but verify visual rhythm at 320px.
**How to avoid:** prefer 2-col at 480px (label cells now wide enough). Drop to 1-col only if 320px tests show 2-col still clips.

### Pitfall 5: Breaking the alts grid at the new breakpoint
**What goes wrong:** the 767 block sets `.alts { grid-template-columns: 1fr; }` (line 455). New 480 block must not re-touch `.alts` unless intentional.
**How to avoid:** scope new 480 block strictly to `.pills`, `.pill`, `.pill-wrap`, `.row-one`, `.hex-input`, `.hex-input input[type="text"]`. Do not touch `.alts`, `.preview`, `.previews`, `.ratio-row`.
**Warning sign:** alts cards change layout at 480px without intent.

## Code Examples

### Example 1: Add the 480px breakpoint (RESP-01 + RESP-02 combined)
```css
/* style.css — append after line 516, before "/* --- Unified focus --- */" */
@media (max-width: 480px) {
  /* RESP-01: pills relax from 4-col to 2-col so labels fit */
  .pills {
    grid-template-columns: repeat(2, 1fr);
  }
  .pill-wrap {
    min-width: 0;            /* allow grid cell to shrink and contain wrapping label */
  }
  .pill {
    flex-wrap: wrap;         /* allow glyph + Pass/Fail to wrap if cell is very narrow */
    padding: 6px 12px;       /* trim padding so 2-col fits 320px viewport */
  }
  .pill-label {
    overflow-wrap: anywhere; /* break long words if needed — defensive */
  }

  /* RESP-02: hex input scales fluidly */
  .row-one { min-width: 0; }
  .hex-input {
    min-width: 0;
    padding: 0 12px;         /* trim from 16px so 320px viewport fits */
  }
  .hex-input input[type="text"],
  .hex-input .hash {
    font-size: clamp(16px, 4.5vw, 22px);  /* iOS-safe floor */
  }
}
```

### Example 2: Verify the flex chain (planner sanity check)
```
viewport (320px)
└── body (flex column, no min-width:0 needed — vertical)
    └── main (block)
        └── .topbar-wrap (block)
            └── .topbar (block, padding: 32px 24px @ 767 → 64px combined)
                └── .controls (block)
                    └── .row-one (flex row, gap:12px)        ← needs min-width: 0
                        └── .hex-input (flex row, flex:1)    ← needs min-width: 0
                            ├── .swatch (36px fixed)         ← stays fixed (D-06) ✓
                            ├── .hash (intrinsic ~14px)      ← stays fixed (D-06) ✓
                            └── input[type=text] (flex:1)    ← min-width:0 already (line 122) ✓
```
Available width at 320px: 320 - 64 (padding) - 12 (gap) - 36 (swatch) - ~14 (hash) - 32 (input padding) ≈ 162px for input text. With 22px font, that holds ~7 monospace chars. Six-char hex fits. With 16px font: ~10 chars. Comfortable.

### Example 3: Test that `.pills` stays 2-col at 480px
```css
/* devtools quick check — paste in console with viewport at 480px */
getComputedStyle(document.querySelector('.pills')).gridTemplateColumns
/* Expected: two equal track widths, e.g. "150px 150px" — not four. */
```

## Runtime State Inventory

Skipped — Phase 9 is a CSS-only defect fix. No data migration, no service config, no OS-registered state, no secrets, no installed packages. CSS changes take effect on next browser load.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Modern browser DevTools (responsive mode) | Manual viewport verification (D-11) | ✓ | Chrome/Firefox/Safari current | — |
| Node + node:test | Phase 8 regression tests (D-12) | ✓ (project already uses) | Node 24+ | — |

No new external dependencies. No missing tools.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24+) |
| Config file | None — `node --test test/**/*.test.js` per project convention |
| Quick run command | `node --test test/app.test.js` |
| Full suite command | `node --test test/**/*.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RESP-01 | Badge labels visible at narrow widths — no clipping | manual-only | DevTools responsive mode at 320/360/480/767/991/1400/>1400 | n/a — visual regression |
| RESP-02 | Hex input does not push content off-screen at narrow widths | manual-only | DevTools responsive mode at same widths; check `document.documentElement.scrollWidth === window.innerWidth` | n/a — layout regression |
| RESP-01/02 (no behaviour regression) | Phase 8 tests still pass | unit | `node --test test/**/*.test.js` | ✅ existing tests |

**Justification for manual-only RESP-01/RESP-02:** layout regressions are visual + computed-style assertions. The project has no JSDOM + headless rendering pipeline; adding one is a new dependency (forbidden by D-09). A simple DOM-style assertion (`getComputedStyle(.pills).gridTemplateColumns`) requires a real browser layout engine — JSDOM does not implement layout. Manual verification at the seven widths is the appropriate gate.

### Sampling Rate
- **Per task commit:** `node --test test/**/*.test.js` — guarantees no regression of Phase 7/8 behaviour from incidental CSS-related changes (none expected, but cheap to run).
- **Per wave merge:** same + manual viewport sweep at 320 / 480 / 767 / 1400.
- **Phase gate:** full manual sweep at all seven widths (D-11), both AA and AAA toggle states, both light and dark panels visible.

### Wave 0 Gaps
None — existing test infrastructure covers behavioural regression. Visual/layout verification is human-driven by design (D-11). No new test files needed.

## Risks / Regressions to Watch

| Risk | Where | How to Detect |
|------|-------|---------------|
| `.alts` grid breaks | style.css 454–457 (existing 767 block sets 1-col). New 480 block must not touch `.alts`. | Visual check: alts row should look identical at 481px and 479px. |
| `.preview-tabs` mobile tab visibility | style.css 463–465 (`.preview-tabs { display: block }` at ≤767). Unchanged. | Manual: tabs still appear at 767, both tabs work. |
| `.ratio-row` re-flow | style.css 341–343 (wraps at 991), 507 (wraps at 767 — already). | Manual at 991px and 767px transitions. |
| AA contrast regression of pills | Phase 5 set `.pill-label` to `#555555` on light, `#d1d5db` on dark (style.css 377–380). Smaller font-size does NOT change contrast — colour pair unchanged. | Spot check with axe DevTools at 320px. |
| iOS focus zoom on hex input | `clamp(16px, ...)` floor. | Real iOS Safari test (or Safari Responsive Design Mode with iOS user agent). |
| Pill `padding` reduction breaks visual rhythm at >480px | New 480 block scoped, so >480 untouched. | Verify at 481px the pill padding is the original 8px 16px. |
| 320px floor — content still overflows | Tightest test. Check after applying clamp + padding trims. | DevTools responsive at exactly 320px width. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Discrete font-size steps per breakpoint | `clamp(min, fluid, max)` single declaration | CSS clamp Baseline 2020 | Fewer breakpoints needed, smoother scaling. |
| `width: auto` flex children that refuse to shrink | `min-width: 0` opt-out of `min-width: auto` default | Documented in CSS Flexbox spec, widely understood since ~2018 | Unblocks fluid input scaling. |
| Media queries on viewport size | Container queries on parent component | Baseline 2023 | Cleaner intent — but DEFERRED per Phase 9 CONTEXT.md (modernisation, not defect fix). |

**Deprecated/outdated:** none — all techniques used here are current best practice.

## Concrete Change Recipe

**File:** `style.css` only. No `index.html` or `app.js` changes expected.

**Insertion point:** append new `@media (max-width: 480px)` block immediately after line 516 (end of existing 767 block, before `/* --- Unified focus --- */` comment at line 518).

**Lines that may need adjustment in existing scope (planner's call, only if 480 block alone isn't enough):**
- Line 364–371 (`.pill`): if any `white-space: nowrap` is added during planning, remove it (D-03 guard).
- Line 97–105 (`.hex-input`): consider adding `min-width: 0` here unconditionally (not just inside the 480 block) — defensive, matches what `.hex-input input[type="text"]` already does at line 122. Trade-off: changes baseline behaviour very slightly. Researcher recommendation: keep it scoped inside the 480 block to minimise surface change. Planner's call.
- Line 73–78 (`.row-one`): same — could add `min-width: 0` unconditionally. Same trade-off.

**Out of scope edits (do not touch):**
- `.alts` and `.alt` rules (lines 179–219, 454–461)
- `.preview-tabs` (405–432, 463–465)
- `.preview` / `.previews` (221–238, 467–505)
- `.bg-tag`, `.fg-tag`, `.tag-label` (239–331, 484–505)
- Focus styles (518–547)
- Specimen typography (382–403, 512–515)

**Verification per D-11 (full sweep):**
1. Open `index.html` in Chrome DevTools.
2. Toggle Device Toolbar → Responsive.
3. Set widths in order: 1400, 991, 767, 480, 360, 320, 1500.
4. At each width, verify:
   - All four pill labels readable on both panels (light + dark, AA + AAA states).
   - Hex input fully visible inside the topbar; cursor reaches end of value.
   - No horizontal scrollbar (`document.documentElement.scrollWidth <= window.innerWidth`).
   - AA toggle, then AAA toggle — both work at every width.
5. Run `node --test test/**/*.test.js` — confirm Phase 7/8 tests stay green.

## Open Questions

1. **Does the 320px viewport hold with the swatch at 36px fixed (D-06)?**
   - What we know: 320 - 64 padding - 12 gap - 36 swatch - 14 hash - 32 input padding ≈ 162px text width. Holds for 16px font.
   - What's unclear: AA/AAA toggle (`.target-toggle`) at 767 block sits on its own row (`flex-wrap: wrap` line 447). At 320px it should also fit.
   - Recommendation: verify in plan; if toggle overflows at 320, drop `.target-opt` `padding: 0 16px` to `0 10px` inside the 480 block.

2. **Should the 480px block be 480px or a different value?**
   - What we know: D-01 says "~480px starting point". Empirical: at 600px, 4-col already crowds labels (visible in current build); at 480px, 4-col definitely clips. 600px would be a safer breakpoint, but it overlaps with 767.
   - Recommendation: 480px is the right value. Above 480 (481–767), pills are already in `repeat(4, 1fr)` width:100% inside the 767 block — keep that, since at 481–767 the cell width is just barely enough. If verification at 600px shows clipping, raise the new breakpoint to 600px.

3. **Should the new breakpoint use `min-width` instead of `max-width` (mobile-first)?**
   - Project convention: all existing media queries are `max-width`. Match the convention.

## Sources

### Primary (HIGH confidence)
- `style.css` (project) — root cause directly readable in source. Lines cited above.
- `index.html` (project) — markup confirms no `nowrap` on pills, confirms flex chain.
- `app.js` lines 87–100 — `buildPillHTML` confirms label is in a `.pill-wrap` column under the pill, supports D-02 wrapping strategy.
- `.planning/phases/09-responsive-fixes/09-CONTEXT.md` — locked decisions D-01 to D-12.
- `.planning/phases/05-design-and-accessibility/05-CONTEXT.md` — Phase 5 visual contract; chrome contrast pairs `#555555` / `#d1d5db` are fixed and unchanged.

### Secondary (MEDIUM confidence)
- MDN: `min-width: auto` is the default for flex items — well-documented, stable since 2017.
- Apple Human Interface Guidelines / Safari iOS docs: 16px font-size threshold for input zoom — widely documented community knowledge, stable since ~2014.
- `clamp()` Baseline 2020 — caniuse.com.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all techniques are native CSS, supported in every targeted browser.
- Architecture: HIGH — root cause is directly visible in style.css; no speculation.
- Pitfalls: HIGH — pitfalls are well-documented standard CSS gotchas (min-width:auto, iOS zoom, cascade order).
- Validation strategy: HIGH — manual visual sweep is the appropriate verification for layout fixes; existing node:test suite covers behaviour regression.

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (CSS specs stable; only invalidated if project tech stack changes)
