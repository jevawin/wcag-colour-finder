# Phase 1: Colour Engine - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure JS colour maths library — hex parsing, relative luminance, contrast ratio calculation, OKLab/OKLCH conversions, and perceptual distance. No DOM, no UI. All functions are pure and testable in isolation. This is the foundation every other phase depends on.

</domain>

<decisions>
## Implementation Decisions

### Module Structure
- **D-01:** Use ES modules (`import`/`export` with `type="module"` on script tags)
- **D-02:** Claude's Discretion: file organisation (single file vs split by concern) and naming conventions

### Testing Approach
- **D-03:** Tests must verify against known WCAG spec reference values and published contrast ratios — correctness against the standard is the bar
- **D-04:** Claude's Discretion: choice of test runner/framework (options: Node built-in `node:test`, lightweight HTML runner, or other zero-dependency approach)

### API Surface Design
- **D-05:** American spelling in code identifiers (`color`, not `colour`), British spelling in UI-facing strings only
- **D-06:** Claude's Discretion: function naming convention (verb-first camelCase vs short noun-style)
- **D-07:** Claude's Discretion: internal colour representation format (RGB arrays, objects, or linear floats)

### Error Handling
- **D-08:** Engine functions return `null` on bad input (e.g. `parseHex('#xyz')` returns `null`) — no thrown exceptions for expected invalid input. Callers decide how to handle.

### Claude's Discretion
Claude has flexibility on: file organisation (D-02), test runner choice (D-04), function naming convention (D-06), and internal colour representation (D-07). These should be decided during planning based on what makes the code cleanest and simplest.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WCAG Specification
- WCAG 2.1 relative luminance spec: https://www.w3.org/TR/WCAG21/relative-luminance.html
- W3C threshold correction (0.03928 to 0.04045): https://github.com/w3c/wcag/issues/308

### OKLab Colour Space
- OKLab by Bjorn Ottosson: https://bottosson.github.io/posts/oklab/

### Project Research
- `.planning/RESEARCH.md` — Domain research with conversion formulas, algorithm recommendations, and library comparisons

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is the first phase, no existing code

### Established Patterns
- None yet — patterns established here will set conventions for all subsequent phases

### Integration Points
- Phase 2 (Live Preview UI) will import engine functions as ES modules
- Phase 3 (Variant Search) will use OKLab distance and contrast ratio functions

</code_context>

<specifics>
## Specific Ideas

- Linearisation threshold MUST be 0.04045 (W3C correction), not 0.03928 — flagged in STATE.md as a verification point
- #777777 on white should produce 4.48:1 (a fail) — use this as a smoke test for contrast ratio correctness
- OKLab/OKLCH chosen for perceptual distance over CIELAB or HSL (research recommendation)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-colour-engine*
*Context gathered: 2026-04-12*
