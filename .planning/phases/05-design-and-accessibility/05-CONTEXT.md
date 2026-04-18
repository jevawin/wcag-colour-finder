# Phase 5: Design and Accessibility - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the existing UI to a strict monochrome aesthetic, tidy layout/typography/focus styling against colourcontrast.cc, and prove the tool itself passes WCAG AA through an axe-core + manual keyboard + VoiceOver audit captured in phase verification.

Phase 5 is a polish + audit pass over existing working code (`index.html`, `style.css`, `app.js`). No new features. No structural rewrites. Scope: UI-01, UI-02, UI-03, A11Y-01, A11Y-02, A11Y-03.

</domain>

<decisions>
## Implementation Decisions

### Monochrome Scope (UI-01)
- **D-01:** All focus outlines use chrome colour (black on light panel, white on dark panel). Drop current `--user-colour` tint on Find button, swatch focus, etc. Strict read of "chrome is monochrome".
- **D-02:** Selected swatch-pair ring is solid black/white, not `--user-colour`. Selection signalled by monochrome ring; the panels already show the user-colour preview.
- **D-03:** Exception — contenteditable sample text keeps its current dashed outline blended with `--user-colour`. Rationale: that text *is* the user colour, so the focus hint legitimately tints.
- **D-04:** Distance-warning keeps the `⚠` glyph prefix. Already meets A11Y-02 (non-colour cue) cleanly.

### Pass/Fail Non-Colour Cues (A11Y-02)
- **D-05:** Badges get both text and icon — `✓ Pass AA`, `✗ Fail AA`. Redundant cue.
- **D-06:** Pass badges render as solid (filled pill); Fail badges render as outline (stroked pill). Shape contrast in addition to text + icon.
- **D-07:** Ratio number stays a pure number (e.g. `4.48:1`). Adjacent badges carry pass/fail.
- **D-08:** Wrap each panel's `.badge-area` in `aria-live="polite"` so screen readers announce Pass/Fail changes as the user types. Mirrors existing `#hex-error` / `#light-bg-error` live-region pattern.

### Focus and Visual Polish (UI-02, A11Y-03)
- **D-09:** Unify focus spec: **2px solid outline, 2px offset, chrome colour** across `#hex-input`, `#find-btn`, `.bg-input`, `.swatch-pair`. Sample text keeps its blended dashed exception (D-03). Error state uses `var(--error)` outline (already in place).
- **D-10:** Polish scope = tidy pass. Audit typography scale, spacing rhythm, panel proportions. No structural change, no redesign.
- **D-11:** Mobile: stack panels vertically below ~700px. Keep side-by-side on desktop.
- **D-12:** Typography: keep system font stack. No web font.
- **D-13:** Claude's Discretion: exact numeric spacing scale, precise breakpoint (~700px), badge pill dimensions, icon glyph choice (`✓`/`✗` vs `✔`/`✘`).

### British Spelling Sweep (UI-03)
- **D-14:** UI strings in British English (already largely in place per Phase 1 convention). Code identifiers stay American. Part of phase work: grep-audit visible copy for stray American spelling and fix.

### A11Y Audit Method (A11Y-01)
- **D-15:** Audit combo: **axe-core DevTools** (primary tool — thorough WCAG 2.1 automated checks) **+ manual keyboard walkthrough** (Tab / Shift+Tab / Enter / Space order and reachability) **+ VoiceOver smoke test** on macOS (hex input, badge announcements, swatch-pair labels).
- **D-16:** Audit results captured in `05-VERIFICATION.md` as a checklist per success criterion (UI-01…A11Y-03) with evidence.
- **D-17:** Fail policy: fix any axe findings that are small and in scope within this phase. Structural or out-of-scope findings → deferred ideas, not scope creep.

### Claude's Discretion
- Exact CSS for solid-vs-outline pill badges (border-radius, padding, weight).
- Specific spacing and typography scale values for the tidy pass.
- Icon glyph selection.
- Mobile breakpoint within 600–800px band.
- Order of implementation (markup first vs CSS first).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 5 Requirements
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, UI-03, A11Y-01, A11Y-02, A11Y-03. Success criteria from ROADMAP.md Phase 5 section.

### Existing Implementation (what Phase 5 polishes)
- `index.html` — Current markup. Badge structure at lines 39–50 / 67–78. Sample text contenteditable at 37–38 / 65–66. Swatch-list at 83–90.
- `style.css` — 416 lines. Focus outlines currently at lines 102–143, 256–302, 356–362, 389–396. Uses `--user-colour`, `--chrome-dark`, `--chrome-light`, `--error` custom properties.
- `app.js` — Badge rendering (`setBadge`), error state (`setErrorState`), swatch-pair rendering with `aria-label` at lines 194–205. `aria-invalid` toggling at 155, 161.

### Prior Phase Context
- `.planning/phases/02-live-preview-ui/02-CONTEXT.md` — UI patterns: centred hex input, side-by-side panels, error-state red border + aria-live inline message.
- `.planning/phases/03-variant-search/03-CONTEXT.md` — Swatch selection ring pattern (currently `--user-colour` — Phase 5 changes per D-02).
- `.planning/phases/04-modes-and-configuration/04-CONTEXT.md` — Dual-pair swatch markup, BG input validation pattern, URL-state hydration.

### Project Principles
- `.planning/PROJECT.md` — Minimal monochrome UI, British spelling, colourcontrast.cc aesthetic.
- `CLAUDE.md` — Tech stack constraint (vanilla HTML/CSS/JS, no build step).

### A11Y Reference
- WCAG 2.1 quickref: https://www.w3.org/WAI/WCAG21/quickref/
- axe-core rules: https://dequeuniversity.com/rules/axe/
- Success criterion 1.4.1 Use of Colour (A11Y-02 anchor).
- Success criterion 2.4.7 Focus Visible (A11Y-03 anchor).
- Success criterion 1.4.3 Contrast (Minimum) (A11Y-01 anchor).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `--chrome-dark`, `--chrome-light`, `--user-colour`, `--error` CSS custom properties already defined. Phase 5 narrows which properties each element uses.
- `aria-live="polite"` pattern on `#hex-error` / `#light-bg-error` / `#dark-bg-error` — extend to `.badge-area`.
- `.input--error` / `aria-invalid` pattern carries unchanged; polish does not affect error UX.
- `.swatch-btn--selected` and `.swatch-pair--selected` classes drive the selection ring; change is CSS-only (swap `--user-colour` → chrome colour).
- `sr-only` class already used for heading-only-for-SR pattern (`panel--light h2.sr-only`).

### Established Patterns
- American code spelling, British UI copy (Phase 1 D-).
- Pure CSS custom properties as theming channel.
- No build step — all CSS edits land directly in `style.css`.
- Panel-scoped custom properties (`.panel--light`, `.panel--dark`) swap chrome colour automatically.

### Integration Points
- Badge markup: add icon span inside existing `.badge` elements in `index.html`; or construct in `app.js` `setBadge` function.
- `.badge-area` wrapper: add `aria-live="polite"` attribute in `index.html`.
- Focus unification: edit `style.css` focus rules — remove `--user-colour` from Find button, swatch, Hex input focus. Keep on `.sample-text:focus` (D-03).
- Mobile stack: add `@media (max-width: 700px)` block altering `.panels` flex direction.

### Constraints / Gotchas
- `aria-live="polite"` on `.badge-area` will announce on every keystroke during typing — debounce or accept chatter. Matches current error-msg behaviour.
- Changing badge markup (adding icon span) may shift layout; verify ratio row and large-text row alignment still reads cleanly.
- Removing `--user-colour` from focus rings means focus outline must itself pass AA contrast against whichever background it sits on — verify during audit.

</code_context>

<specifics>
## Specific Ideas

- Reference aesthetic: colourcontrast.cc — clean, minimal, monochrome chrome, tight typography, generous whitespace between input and result areas.
- Pass/Fail icons: `✓` and `✗` as inline text glyphs, not SVG (keeps zero dependency).
- Pill style: solid = `background: currentColor; color: panel-bg`; outline = `background: transparent; border: 1px solid currentColor`. `currentColor` carries chrome colour from panel.

</specifics>

<deferred>
## Deferred Ideas

- Print stylesheet — out of scope; not in requirements.
- Animation/transition polish (e.g. swatch fade-in) — out of scope; no motion requirements.
- Dark-mode (system colour-scheme) for chrome itself — tool already has a light and dark panel side-by-side; a global dark mode is a new capability, candidate for future milestone.
- Empty-state copy for pre-search swatch row — current row is hidden until Find clicked; no empty state shown. Revisit if product direction changes.
- Web font upgrade — deferred per D-12.

</deferred>

---

*Phase: 05-design-and-accessibility*
*Context gathered: 2026-04-18*
