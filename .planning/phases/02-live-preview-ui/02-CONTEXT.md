# Phase 2: Live Preview UI - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Hex colour input with split-screen preview panels showing the user's colour as text on light and dark backgrounds. Each panel displays live contrast ratios and AA/AAA pass/fail badges for normal and large text. User can edit the sample text directly. No variant search, no mode toggle, no custom backgrounds — those are Phases 3-4.

</domain>

<decisions>
## Implementation Decisions

### Panel Layout
- **D-01:** Side-by-side panels — light (left), dark (right). Equal width.
- **D-02:** Centred hex input above the panels, prominent and obvious.
- **D-03:** Max-width container (~1200px), centred on page. Not full bleed.

### Badge Presentation
- **D-04:** Compact row below the text samples in each panel. Format: ratio number + inline AA/AAA badges (e.g. "4.52:1 Pass AA Fail AAA").
- **D-05:** Normal text badges have primary visual weight. Large text badges shown smaller or secondary — most users care about normal text first.

### Text Samples and Editing
- **D-06:** Default text is realistic UI copy (e.g. "The quick brown fox" heading, a short readable paragraph). Not lorem ipsum.
- **D-07:** Click-to-edit uses `contenteditable` — native in-place editing, no modal or separate input field.

### Input and Feedback
- **D-08:** Live as-you-type updates — panels update on every keystroke once input is valid hex. Invalid input triggers error state without updating panels.
- **D-09:** Error state: red border on input + inline message below ("Enter a valid hex colour"). Panels keep showing last valid colour.
- **D-10:** Static non-editable `#` prefix before the input field. User types "2563EB", sees "#2563EB".

### Claude's Discretion
Claude has flexibility on: responsive breakpoint for panel stacking on narrow screens, exact sample text wording, badge icon/text treatment (checkmarks vs text), exact error message copy, file organisation (single HTML file vs separate CSS/JS files).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Colour Engine (Phase 1 output)
- `colour-engine.js` — All colour maths: `parseHex`, `contrastRatio`, `passesAA`, `passesAAA`, `passesAALarge`, `passesAAALarge`. Import these — do not reimplement.

### Project Requirements
- `.planning/REQUIREMENTS.md` — INP-01 through INP-04, CON-01 through CON-05, PNL-01 through PNL-03 are this phase's requirements.

### Phase 1 Context
- `.planning/phases/01-colour-engine/01-CONTEXT.md` — Conventions established: ES modules, American code spelling, null returns for bad input.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `colour-engine.js` — Full colour maths library at project root. Exports: `parseHex`, `relativeLuminance`, `contrastRatio`, `passesAA`, `passesAAA`, `passesAALarge`, `passesAAALarge`, `srgbToOklab`, `oklabToSrgb`, `oklabDistance`. Phase 2 needs `parseHex`, `contrastRatio`, and the four `passes*` functions.

### Established Patterns
- ES modules (`export`/`import` with `type="module"`)
- American spelling in code identifiers (`color` in variable names), British in UI text ("colour")
- Functions return `null` on invalid input — UI layer handles display

### Integration Points
- HTML file imports `colour-engine.js` as ES module
- No existing HTML, CSS, or UI files — this phase creates the first UI
- `test/colour-engine.test.js` exists using `node:test` — test pattern established

</code_context>

<specifics>
## Specific Ideas

- Inspired by colourcontrast.cc's clean aesthetic — minimal chrome, colour only from user input
- Default colour on load: #2563EB (from PROJECT.md requirements)
- #777777 on white = 4.48:1 (fails AA) — engine handles this correctly, UI must show it as a fail

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-live-preview-ui*
*Context gathered: 2026-04-12*
