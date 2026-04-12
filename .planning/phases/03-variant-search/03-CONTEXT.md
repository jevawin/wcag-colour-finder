# Phase 3: Variant Search - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Find the closest accessible colour variants to the user's input hex and display them as clickable swatches below the preview panels. Users click "Find accessible colour" to trigger the search, click a swatch to preview that variant on both panels, and see honest messaging when no close variant exists. No mode toggle, no custom backgrounds, no URL sharing -- those are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Search Trigger
- **D-01:** Manual button press only -- user clicks "Find accessible colour" to trigger search. No auto-search on input change.
- **D-02:** Button sits beside the hex input on the same row (right side). Compact single-line action bar.

### Swatch Display
- **D-03:** Horizontal row of ~5 swatches below the preview panels. Ordered by closeness to original colour (perceptually nearest first).
- **D-04:** Each swatch shows its hex code below/beside it. No contrast ratios or badges on swatches themselves.

### No-Variant Messaging
- **D-05:** Always show best-effort results even when variants are distant from the original. Accompany with a warning message like "These are distant from your original colour" when results exceed a perceptual distance threshold.
- **D-06:** Claude's Discretion: exact distance threshold for "distant" warning and message wording.

### Swatch Interaction
- **D-07:** No hover preview effect -- just a cursor change. Click to preview. Minimal and undistracted.
- **D-08:** Clicking a swatch updates both preview panels to show that variant BUT does not change the hex input field. Original colour stays in the input so user can easily compare/revert.
- **D-09:** Selected swatch gets a visible ring/border highlight to show which variant is currently being previewed.

### Claude's Discretion
Claude has flexibility on: search algorithm approach (OKLCH lightness binary search recommended in CLAUDE.md research), swatch sizing/spacing, exact distance threshold for "distant" warning (D-06), warning message copy, ring/border style for selected state, and how the swatch row handles responsive layout.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Colour Engine (Phase 1 output)
- `colour-engine.js` -- All colour maths: `parseHex`, `contrastRatio`, `passesAA`, `srgbToOklab`, `oklabToSrgb`, `oklabDistance`. Phase 3 search algorithm imports these directly.

### Algorithm Research
- CLAUDE.md "Find Nearest Accessible Colour Algorithm" section -- Recommends OKLCH lightness axis binary search. Chroma/hue shifts change colour identity; lightness preserves character. WCAG contrast is monotonically related to luminance so binary search is valid.
- OKLab by Bjorn Ottosson: https://bottosson.github.io/posts/oklab/

### Phase Dependencies
- `.planning/phases/01-colour-engine/01-CONTEXT.md` -- Conventions: ES modules, American code spelling, null returns for bad input.
- `.planning/phases/02-live-preview-ui/02-CONTEXT.md` -- UI patterns: side-by-side panels, centred hex input with static # prefix, live-as-you-type panel updates.
- `.planning/REQUIREMENTS.md` -- VAR-01 through VAR-05 are this phase's requirements.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `colour-engine.js` -- Exports `srgbToOklab`, `oklabToSrgb`, `oklabDistance`, `contrastRatio`, `passesAA`. All needed for the variant search algorithm.
- `app.js` -- `buildBadgeState()`, `expandHex()`, `formatRatio()` pure functions. Panel update logic already wired -- Phase 3 needs to hook swatch clicks into the same update path.

### Established Patterns
- ES modules (`import`/`export` with `type="module"`)
- American spelling in code identifiers, British in UI text
- Functions return `null` on invalid input
- Pure function extraction pattern: exported above DOM guard for testability
- `node:test` for unit testing

### Integration Points
- Button goes beside existing hex input in `index.html`
- Swatch row added below the existing `.panels` container
- Swatch click calls same panel-update logic as hex input (reuse, don't duplicate)
- Search algorithm can be a new module or added to `colour-engine.js` (Claude's discretion)

</code_context>

<specifics>
## Specific Ideas

- OKLCH lightness binary search recommended by project research (CLAUDE.md) -- lightness adjustment preserves colour character while finding accessible contrast
- #777777 on white = 4.48:1 (fails AA) -- good test case for search finding a slightly darker/lighter variant that passes
- `oklabToSrgb` was explicitly included in Phase 1 for Phase 3's search loop

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 03-variant-search*
*Context gathered: 2026-04-12*
