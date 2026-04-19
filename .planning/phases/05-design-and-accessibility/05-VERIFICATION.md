---
phase: 5
status: gaps-found
audited: 2026-04-19
---

# Phase 5 — Verification

## Why Gaps

After Plans 05-01 and 05-02 shipped, the user supplied a new design ground truth via a Claude Design handoff bundle at `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/` (primary file: `project/WCAG Colour Finder.html`). The bundle structurally redefines Phase 5 UI scope.

The current on-disk build (post 05-01 + 05-02 + 05-03 Task 1) is accessibility-sound in spirit but visually divergent from the new mockup. The divergence is structural (full-bleed coloured topbar, controls inside the topbar, new specimen, new tag pattern, new alts grid, Google Fonts typography, auto-recompute pipeline) — not a polish pass.

Plan 05-03 Task 1 (unified focus styles + mobile tabs) shipped and is committed at 26ff1ba. Task 2 (human a11y audit) was NOT executed against the current build because that build is about to be replaced. A11y re-audit is deferred to the gap-closure wave.

The phase needs a rebuild wave via `/gsd:plan-phase 5 --gaps` that consumes this file as the gap payload.

## Gaps

### G1. Full-width "T" topbar takes user colour as background

truth: mockup sets `.topbar-wrap { background: var(--topbar-bg, --user-colour); color: var(--topbar-fg, auto-black/white) }` — whole top is coloured; auto-fg derived against topbar bg; bordered-bottom separates topbar from previews
reason: current build uses user colour only in chrome accents; layout uses a bordered control-zone card, not a full-bleed coloured topbar
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 27–46, 517–546
missing: full-width coloured topbar shell, auto fg colour derivation against topbar bg, bordered-bottom separation between topbar and previews
status: failed

### G2. Controls live inside the topbar, not in a separate zone

truth: hex input pill (72px tall), Find 5 button (72px), and AA/AAA segmented toggle sit in a single `.row-one` flex row inside the coloured topbar; 5-swatch alts grid sits beneath them as a 5-column `.alts` grid
reason: current build places hex input + single Find button + dual AA + AAA toggles in a separate monochrome zone; swatch results are placed lower on the page
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 526–544, 201–230
missing: 72px control heights, segmented AA|AAA toggle position inside topbar, alts grid inside topbar
status: failed

### G3. Single segmented AA/AAA toggle, not two separate toggles

truth: `.target-toggle` is a 2-button segmented control (AA | AAA). Active option swaps bg/fg with topbar colours. State drives search threshold (AAA → 7.0, AA → 4.5).
reason: current build has two independent `.aa-toggle-btn` buttons; `currentThreshold` is captured but not consumed (per 05-02 summary)
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 147–176, 536–539, 896–903; algorithm switch at line 754
missing: segmented component, single-select behaviour, threshold wiring into search
status: failed

### G4. Preview panels use fg-tag / bg-tag tag pattern with copy buttons

truth: each preview has two absolute-positioned tags at top 88px — a `.fg-tag` (hex + SVG copy icon) on the left and a `.bg-tag` (editable bg hex input + colour-picker swatch + copy) on the right. Labels "Foreground colour" / "Background colour" sit above at top 64px.
reason: current build uses simpler background inputs, no fg-tag, no copy SVG icons, no tag-labels
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 250–334, 558–600
missing: fg-tag component, bg-tag component with embedded colour picker, tag-label pattern, SVG copy icon with `✓` copied state
status: failed

### G5. Huge 64px mono ratio number + 4-pill grid

truth: `.ratio` is 64px JetBrains Mono, weight 600; `.pills` is a 4-column grid of AA Normal / AA Large / AAA Normal / AAA Large, each a pill with ✓ or ✕ glyph; pass filled with `--specimen`, fail transparent + 0.45 opacity
reason: current build uses smaller ratio display and different pill layout; some labels missing
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 337–378, 569–577, 591–600
missing: 64px ratio typography, 4-column pill grid, filled-pass / transparent-fail pill visual treatment
status: failed

### G6. Typography system is Inter + JetBrains Mono via Google Fonts

truth: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">`; `.mono` applies JetBrains Mono to hex values and ratios; body uses Inter with `font-feature-settings: 'ss01','cv11'`
reason: current build uses system stack only per prior UI-SPEC D-12; no web fonts loaded
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 7–25
missing: Google Fonts stylesheet link, Inter/JetBrains Mono family application, `.mono` utility class; UI-SPEC D-12 override (mockup wins per UI-SPEC line 16)
status: failed

### G7. Specimen content and typography

truth: specimen block is "The quick brown fox" heading (64px, weight 700, letter-spacing -0.03em, line-height 1.02) + readability paragraph (16px, line-height 1.6, max-width 52ch) + digits row (34px mono, weight 600, letter-spacing 0.06em)
reason: current build specimen uses the editable `.sample-text` pattern from earlier UI-SPEC with different copy and typography
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 380–401, 574–576, 596–598
missing: new specimen block (heading + paragraph + digits), digit row component, retirement of `.sample-text` and its dashed-focus treatment
status: failed

### G8. Auto-find on input change; Find button re-rolls

truth: `autoFindAndApply()` runs on every input change; Find button is kept for explicit re-roll with "Searching…" label feedback
reason: current build only runs search on explicit Find button click
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 851–865, 877–879, 933–943
missing: auto-recompute pipeline, disabled/Searching… label state transition
status: failed

### G9. Swatch-pair alt tile format

truth: each alt tile = border 2px, 5-column grid on desktop, 1-column stacked on mobile; shows coloured chips (light chip / dark chip when shades differ) + hex text below; selected state is outline `2px solid --topbar-fg`; placeholder variant uses dashed border + 0.55 opacity
reason: current build tile markup and selection ring differ (3px solid black ring, different layout)
artifacts: `mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 202–230, 706–749
missing: new `.alt` layout, chip-pair rendering, placeholder state, updated selection outline
status: failed

### G10. Retire `.sample-text` editable specimen + dashed focus

truth: mockup has no editable specimen; specimen is fixed copy
reason: 05-UI-SPEC D-03 exception for `.sample-text:focus` dashed `--user-colour` tint was implemented in Plan 05-03 Task 1, but the pattern is obsolete because the specimen is no longer editable in the new ground truth
artifacts: `CLAUDE.md` prior UI-SPEC D-03 section; shipped `style.css` `.sample-text:focus` rule
missing: removal of `.sample-text` pattern entirely (the dashed-focus exception is redundant when the specimen is fixed copy)
status: failed

## A11y Audit Status

axe-core DevTools + keyboard walkthrough + VoiceOver audit — NOT run against the current build.

Rationale: the current build is about to be replaced with a rebuild against the new mockup ground truth. Running a full a11y audit against code that will be thrown away wastes effort and produces findings that may not apply to the rebuild.

A11y re-audit is required against the rebuilt UI and deferred to the gap-closure phase scheduled via `/gsd:plan-phase 5 --gaps`. The rebuild plan must include:

- axe-core DevTools scan at four hex values (default `#2563EB`, `#111111`, `#ffff00`, and after auto-find populates the alts grid)
- Keyboard walkthrough covering the new topbar control row, the segmented AA|AAA toggle, each alt tile, each bg-tag input and colour picker, and each copy button
- VoiceOver smoke test covering hex input, Find re-roll, alts tile activation, copy-button "Copied" announcement, and badge-area polite updates
- Re-application of the unified focus rule (currently using `var(--chrome-dark)` / `var(--chrome-light)`) against the new topbar colour model — focus colour logic may need to derive from `--topbar-fg` / `--topbar-bg` instead

The a11y findings from 05-03 Task 1 (unified focus styles, dark-panel override, mobile tabs ARIA) are NOT wrong in principle — the selector list and ARIA tablist pattern remain valid starting points — but every rule will need reapplying against the new DOM after the rebuild.

## Automated Evidence — Preserved

The automated greps below were captured against the current-on-disk code during the 05-03 Task 1 verification. They apply to the build that is about to be replaced but are retained as a historical record of 05-01/05-02/05-03-Task-1 acceptance.

### UI-01 Monochrome chrome

- [x] `var(--user-colour)` appears only on permitted elements in style.css — evidence: `grep -n "var(--user-colour)" style.css` → 6 lines, all within the permitted list: `--pass-bg` derivation (line 17), `--pass-text` derivation (line 18), `.control-zone` background (line 115), `.hex-pill .swatch-indicator` background (line 185), `.sample-text` colour (line 348), `.sample-text:focus` outline tint (line 386).
- [x] No `--user-colour` on focus rings or selection rings — evidence: `grep -c "outline-color: var(--user-colour)" style.css` → 0. `.swatch-pair--selected` uses `3px solid #000000`.

### UI-02 Clean layout

- [x] Two-zone layout markup present — evidence: `grep -c 'class="control-zone"' index.html` → 1, `grep -c 'class="preview-zone"' index.html` → 1.
- [x] Mobile tablist markup present — evidence: `role="tablist"` → 1, `role="tab"` → 2, `role="tabpanel"` → 2, `aria-controls=` → 2.
- [x] Tab switch handler driven by `matchMedia('(max-width: 700px)')` — evidence: app.js line matches on single occurrence.

### UI-03 British spelling

- [x] `british-spelling.test.js` green — evidence: `node --test test/british-spelling.test.js` → 4 pass / 0 fail on 2026-04-19.
- [x] Full suite green — evidence: `node --test test/*.test.js` → 89 pass / 0 fail on 2026-04-19.

### A11Y-01 WCAG AA self-compliance

- [x] Chrome foreground on top-zone background — `chooseChromeForeground` auto-switches `#000000` → `#ffffff` when the user's colour fails 4.5:1 for black; `#top-zone-warning` surfaces when colour is marginal.
- [x] Pass-badge contrast verified at derivation time — `deriveBadgeColors` falls back to `#15803d` / `#ffffff` (≈5.02:1) when the OKLab-derived pair falls below 4.5:1.

### A11Y-02 Non-colour cues

- [x] Badge markup contract pinned — evidence: `test/app.test.js` asserts `buildBadgeHTML(true, 'AA') === '<span aria-hidden="true">✓</span><span>Pass AA</span>'` across repeated calls (added Plan 02).
- [x] `aria-live="polite"` regions present: 7 total in index.html.
- [x] Large-text badges distinguished — setBadge is called with labels `AA Large` / `AAA Large`, so they render as `Pass AA Large` vs `Pass AA`.

### A11Y-03 Visible focus

- [x] Unified focus rule uses `var(--chrome-dark)` — evidence: `grep -c "outline: 2px solid var(--chrome-dark)" style.css` → 2.
- [x] Dark-panel override uses `var(--chrome-light)` — evidence: `grep -c "outline-color: var(--chrome-light)" style.css` → 1.
- [x] `.sample-text:focus` dashed exception retained — evidence: `grep -c "\.sample-text:focus" style.css` → 1 (rule contains `dashed`). Will be removed during G10 gap closure.
- [x] No `--user-colour` on any focus outline — evidence: `grep -c "outline-color: var(--user-colour)" style.css` → 0.

## Handoff

Run `/gsd:plan-phase 5 --gaps` to consume this file as the gap payload and generate the rebuild wave against the new mockup ground truth at `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html`.

## Rebuild Audit — 2026-04-19

Automated evidence captured against the rebuilt UI (post 05-04 through 05-07). Human audit results (axe-core, keyboard, VoiceOver) filled in during Plan 05-08 Task 2 checkpoint.

### Automated Test Suite

- `node --test test/*.test.js` — **88 pass / 0 fail** (2026-04-19T19:05Z).

### G1. Full-width topbar takes user colour as background

- `grep -c 'class="topbar-wrap"' index.html` → **1** ✅ (topbar-wrap shell present on line 15)
- Topbar wraps every control and uses `--topbar-bg` / `--topbar-fg` tokens (style.css confirmed in 05-05 summary).

### G2. Controls live inside the topbar

- Topbar contains `.row-one` (hex-input, Find btn, target-toggle) and `.row-two` (.alts grid) — both nested inside `.topbar-wrap` per index.html lines 23–41.

### G3. Single segmented AA/AAA toggle

- `grep -c 'target-toggle' index.html` → **1** ✅ (segmented component present)
- `grep -c 'data-target="AAA"' index.html` → **1** ✅ (second segment button present)

### G4. fg-tag / bg-tag tag pattern with copy buttons

- `grep -c 'class="fg-tag"' index.html` → **2** ✅ (both preview panels, expected 2)
- `grep -c 'class="bg-tag"' index.html` → **2** ✅ (expected 2)
- `grep -c 'data-copy-target' index.html` → **2** ✅ (expected 2 — light + dark fg copy buttons)

### G5 + G7. 64px ratio + specimen typography

- `grep -c "font-size: 64px" style.css` → **2** ✅ (expected ≥ 2 — .ratio + .heading)

### G6. Inter + JetBrains Mono via Google Fonts

- `grep -c 'fonts.googleapis.com' index.html` → **2** ✅ (preconnect + stylesheet link; expected ≥ 1)
- `grep -c '\.mono' style.css` → **1** ✅ (expected ≥ 1 — `.mono` utility class)

### G7. Specimen copy

- `grep -c 'The quick brown fox' index.html` → **2** ✅ (expected 2 — light + dark panels)
- `grep -c "0 1 2 3 4 5 6 7 8 9" index.html` → **2** ✅ (expected 2 — both digits rows)

### G8. Auto-find on input change + Find re-roll

- `grep -c 'autoFindAndApply' app.js` → **7** ✅ (expected ≥ 2 — definition + 6 call sites across input/bg/colour-picker listeners)
- `grep -c "'Searching…'" app.js` → **0** — literal ellipsis char not in source, but the behaviour is present at app.js line 325 as `findLabel.textContent = 'Searching\u2026';` (unicode escape for the same glyph). Verified grep: `grep -c "Searching" app.js` → 1. Functional parity with mockup; only the source representation differs.

### G9. Swatch-pair alt tile format

- `grep -c "document.createElement('button')" app.js` → **1** ✅ (alt tiles rebuilt as semantic `<button type="button">` per 05-07)
- `.alt.is-selected` + `button.alt:focus-visible` rules present in style.css (05-07 summary).

### G10. Retirement of `.sample-text` editable specimen

- `grep -c "sample-text" index.html` → **0** ✅ (expected 0 — retired)
- `grep -c "sample-text" style.css` → **0** ✅ (expected 0 — rule removed)
- `grep -c "contenteditable" index.html` → **0** ✅ (expected 0 — specimen is fixed copy)

### UI-01 Monochrome chrome — rebuild-era note

UI-01 is partially superseded by the new topbar model: `--user-colour` legitimately paints the topbar-wrap background by design (mockup ground truth). The "monochrome chrome" spirit of UI-01 now reads as: user colour paints topbar + preview specimen colours only; no unexpected tints on focus rings, borders, selection indicators, or alt-tile chrome outside those two surfaces.

### UI-02 Clean layout — rebuild-era

- Two-zone layout restructured into single topbar-wrap + full-bleed previews (mockup).
- Mobile tablist markup preserved: `role="tablist"` / `role="tab"` / `role="tabpanel"` present in index.html (lines 46–51).

### UI-03 British spelling

- `node --test test/british-spelling.test.js` — pass via full-suite run (88/88).

### A11Y-01 axe-core DevTools scan — **pending human audit (Task 2)**

| Hex value | Critical | Serious | Notes |
| --- | --- | --- | --- |
| `#2563EB` (default blue) | pending | pending | |
| `#111111` (near-black; topbar-fg auto-flips to white) | pending | pending | |
| `#ffff00` (high-L yellow; topbar-fg stays black) | pending | pending | |
| Post-auto-find state (alts grid populated) | pending | pending | |

Target: 0 critical, 0 serious at each.

### A11Y-01 VoiceOver smoke test — **pending human audit (Task 2)**

- [ ] Hex input announces "Hex colour code, edit text, 2563EB"
- [ ] Find button announces "Find 5, button"
- [ ] Each pill announces Pass/Fail + label (AA Normal, AA Large, AAA Normal, AAA Large)
- [ ] Alt tile announces "Apply pair: light #XXXXXX, dark #YYYYYY"
- [ ] Copy button announces "Copy hex, button"; `✓` visual confirmation on press
- [ ] Mobile tabs (< 768px) announce "Light, tab" / "Dark, tab"

### A11Y-02 Non-colour cues — **pending human audit (Task 2)**

- [ ] Pills show ✓ / ✕ glyph plus Pass/Fail text — not colour-only
- [ ] Badge/pills `aria-live="polite"` regions update after recompute
- [ ] Copy-button shows text label via aria-label plus the `✓` state transition

### A11Y-03 Visible focus — **pending human audit (Task 2)**

Keyboard walkthrough stops:

- [ ] Stop 1: hex input — focus ring visible (2px `--topbar-fg`) against topbar bg
- [ ] Stop 2: Find button — focus ring visible
- [ ] Stop 3: AA option — focus ring visible
- [ ] Stop 4: AAA option — focus ring visible; Space toggles + triggers auto-find
- [ ] Stops 5–9: 5 alt tiles — focus ring visible; Enter/Space applies pair
- [ ] Stop 10: light bg colour-picker swatch — focus ring acceptable
- [ ] Stop 11: light bg hex text input — focus ring visible against white panel
- [ ] Stop 12: light panel copy button — focus ring visible; Enter fires copy
- [ ] Stop 13+: dark panel mirrors light (copy-button focus ring against `#111111`)
- [ ] Shift+Tab reverses without trap
- [ ] No dashed outline anywhere (the `.sample-text:focus` exception is gone — confirmed above at G10)

### Status

`status: gaps-found` retained until Task 2 human audit checkpoint approves the above. On approval, Task 2 flips this file's frontmatter to `status: complete`, updates ROADMAP.md Phase 5 row, and closes A11Y-03 in REQUIREMENTS.md.
