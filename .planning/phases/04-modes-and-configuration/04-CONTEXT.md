# Phase 4: Modes and Configuration - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Dual-colour mode output (pairs of close shades — one per background), inline custom background hex inputs on each panel, and URL state for shareable links. Replaces Phase 3's single-variant swatch output. No single-colour mode, no mode toggle — user pivoted to dual-only during discussion.

**Scope change from REQUIREMENTS.md:** MODE-01 (single-colour mode) and MODE-03 (mode toggle) are dropped. MODE-02 (dual-colour) is the sole mode. REQUIREMENTS.md needs updating at phase transition.

</domain>

<decisions>
## Implementation Decisions

### Mode Scope
- **D-01:** Dual-colour mode only. No single-colour mode, no toggle. App always shows dual-pair output.
- **D-02:** Phase 3's single-variant swatch row is fully replaced by dual-pair swatches. The existing `findVariants` / swatch rendering path retires or is repurposed.

### Dual-Mode Algorithm
- **D-03:** Each result is a pair of hexes — one shade that passes AA on the light background, one shade that passes AA on the dark background, both close to the input colour and to each other.
- **D-04:** Claude's Discretion: the exact pairing algorithm. Likely extension of Phase 3's OKLCH lightness binary search — search both directions (darker for light-BG pass, lighter for dark-BG pass) from the input, then pair closest results. Perceptual distance between the two shades in a pair should be minimised.

### Dual Result Display
- **D-05:** Paired swatches — each result is two joined swatches side-by-side, light-BG shade then dark-BG shade, as one clickable unit. ~5 pairs in a horizontal row below the panels (same location as Phase 3's swatch row).
- **D-06:** Both hex values shown per pair (e.g. `#2F6FE8 / #4E85F0`). User needs both.
- **D-07:** Clicking a pair previews the light panel with the light-BG shade and the dark panel with the dark-BG shade. Each panel uses the shade intended for it.
- **D-08:** Carry forward from Phase 3: clicking a pair does NOT update the hex input. Selected pair gets a visible ring/border. Distance warning still applies when closest pair is far from original.

### Custom Background Inputs
- **D-09:** Inline on each panel — small hex input at top of each panel showing that panel's background colour. Label: "Background". Direct, no collapse/reveal.
- **D-10:** Default light BG: `#ffffff`. Default dark BG: `#000000` (per CFG-02 requirement). Current hardcoded `#111111` in `app.js` and `variant-search.js` must be updated.
- **D-11:** Invalid BG hex uses the same pattern as the main input (Phase 2 D-09): red border, inline error, panels keep last valid BG.
- **D-12:** BG changes live-update panel contrast ratios and badges. BG changes clear existing pair swatches (swatches depend on old BGs — user re-clicks Find for new pairs). Consistent with Phase 3 D-01 manual-trigger rule.

### URL State
- **D-13:** URL carries full state: foreground hex, light BG, dark BG — in that order. Format: hash path `/#/2563eb/ffffff/000000`. Hash path chosen over true path routing because this is a static site (any static host, even plain `file://`, must support refresh without server rewrites).
- **D-14:** URL updates debounced ~300ms after any valid input change (foreground hex or either BG). Use `history.replaceState` to avoid history spam.
- **D-15:** On page load, hydrate foreground hex and both BGs from URL. Do NOT auto-run Find — user clicks to see pairs. Consistent with manual-trigger rule.
- **D-16:** Hexes in URL are lowercase without `#`. All three values present even when at defaults (simplifies parsing; URL always has same shape when shared).

### Claude's Discretion
Claude has flexibility on: exact dual-pair algorithm (extension of OKLCH search is recommended), visual style of paired swatches (how the two shades are joined — hairline divider, shared border, slight gap), hex label formatting within a pair, exact debounce timing for URL sync, and how the distance warning wording adjusts for pair distance.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Colour Engine (Phase 1 output)
- `colour-engine.js` — `parseHex`, `contrastRatio`, `passesAA`, `srgbToOklab`, `oklabToSrgb`, `oklabDistance`. Phase 4 dual-pair search builds on these.

### Phase 3 Variant Search
- `variant-search.js` — Existing `findVariants` + `searchL` binary search. Phase 4 likely extends this (dual-direction pairing) rather than rewriting. Note: `DARK_BG` currently hardcoded `#111111` — must become a parameter.
- `app.js` — Existing swatch rendering (`renderSwatches`, `clearSelectedSwatch`) and panel update path (`render`, `updatePanel`). Dual-pair display replaces the single-variant row but can reuse the panel update path for click handlers.

### Phase Dependencies
- `.planning/phases/01-colour-engine/01-CONTEXT.md` — Conventions: ES modules, American code spelling, null returns for bad input.
- `.planning/phases/02-live-preview-ui/02-CONTEXT.md` — UI patterns: side-by-side panels, centred hex input with static # prefix, live-as-you-type panel updates, invalid-input red border + inline error + keep last valid.
- `.planning/phases/03-variant-search/03-CONTEXT.md` — Manual button trigger, horizontal swatch row, swatch click previews without changing hex input, selected ring highlight, distance warning pattern.

### Project Requirements
- `.planning/REQUIREMENTS.md` — MODE-02, CFG-01, CFG-02, CFG-03. MODE-01 and MODE-03 dropped per D-01 (update at phase transition).

### Algorithm Research
- CLAUDE.md "Find Nearest Accessible Colour Algorithm" — OKLCH lightness binary search rationale still applies for dual-pair search.
- CLAUDE.md "Web APIs Worth Using" — `URL` / `URLSearchParams` referenced, but D-13 uses hash path instead of query string. `history.replaceState` for debounced URL sync.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `findVariants` in `variant-search.js` — Template for dual-pair algorithm. Currently returns variants passing AA on at least one BG; dual-pair needs both-BG coverage per pair.
- `searchL` binary search — Works per direction (darker/lighter). Dual-pair: darker-direction result pairs with lighter-direction result from same a/b channel.
- `render`, `updatePanel`, `setBadge` in `app.js` — Panel update logic reused unchanged. Pair click handler calls `render` twice (once per panel with its shade) instead of once.
- `clearSelectedSwatch`, `swatch-btn--selected` class — Selection highlight pattern carries to pair swatches.
- Error state pattern (`setErrorState`, `input--error` class, `aria-invalid`, `aria-live="polite"` message) — Reuse for BG input validation.

### Established Patterns
- ES modules, American code spelling, British UI spelling
- Pure functions exported above DOM guard for testability
- `node:test` for unit testing pure logic
- `null` returns for invalid input
- CSS custom property `--user-colour` propagates colour through the cascade (pattern extends to `--light-bg` / `--dark-bg`)

### Integration Points
- BG hex inputs: new elements inside each `.panel` in `index.html`, top of panel
- `LIGHT_BG` / `DARK_BG` constants in `app.js` and `variant-search.js` become mutable state (or parameters passed into `findVariants` and `render`)
- URL sync: new module or inline in `app.js`. Reads `location.hash` on load, writes via `history.replaceState` on debounced change.
- Pair swatch rendering: replaces body of `renderSwatches` in `app.js`. Existing `#swatch-row`, `.swatch-list`, `#distance-warning` containers reused.

### Constraints / Gotchas
- `DARK_BG = '#111111'` appears in BOTH `app.js` and `variant-search.js` — must be kept in sync or refactored to a single source. D-10 changes default to `#000000`.
- `CSS.supports('color: oklch(...)')` not needed — no oklch() CSS used; all OKLab maths is in JS.
- Hash path parser must tolerate empty segments, trailing slash, and case variation.

</code_context>

<specifics>
## Specific Ideas

- User explicitly pivoted mid-discussion from "single + dual + toggle" to "dual only". Simpler product surface — one mode, one output shape.
- Inline BG hex inputs on panels come from the user wanting "quick access without hiding in settings" (PROJECT.md Key Decisions).
- Path-style URL preferred aesthetically — `/2563eb/ffffff/000000` — but implemented via hash `#/` for static-host robustness.
- Colour order in URL is foreground → light BG → dark BG (user-specified).

</specifics>

<deferred>
## Deferred Ideas

- Single-colour mode (one shade passing AA on both BGs simultaneously) — dropped from scope entirely, not deferred. Remove MODE-01/MODE-03 from REQUIREMENTS.md at phase transition rather than parking them.
- Share button / copy-link affordance — not requested; URL always in sync via debounced writes. Could add in Phase 5 design polish if useful.
- Colour picker / RGB/HSL input modes — v2 per REQUIREMENTS.md (INP-05, INP-06).

</deferred>

---

*Phase: 04-modes-and-configuration*
*Context gathered: 2026-04-17*
