# Feature Landscape

**Domain:** WCAG colour contrast tool — find accessible colour variants
**Researched:** 2026-04-12

## Table Stakes

Features users expect from any contrast tool. Missing = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hex colour input | Universal input format for web colours | Low | Should also accept 3-digit hex (#fff) |
| Live contrast ratio display | Every tool does this; users arrive expecting a number | Low | Format as e.g. "4.52:1" |
| AA pass/fail for normal text (4.5:1) | Most common WCAG target; what devs/designers care about most | Low | |
| AAA pass/fail for normal text (7:1) | Secondary standard; users want to know how far ahead they are | Low | |
| AA/AAA for large text (3:1 / 4.5:1) | Frequently asked about; missing it looks incomplete | Low | Large text = 18pt+/14pt+ bold |
| Text preview (sample text in the chosen colour) | Users need to see the colour in context, not just a swatch | Low | Real UI copy beats Lorem Ipsum |
| Preview on both light and dark backgrounds | Half the tools do this; users have both use cases | Low | Split-screen is a clean pattern |
| Custom background colour input | Defaults of #fff and #000 never match real projects | Low | Inline hex input, not hidden in settings |
| Colour swatch / visual preview | Need to see the actual colour, not just a hex string | Low | |

## Differentiators

Features that set a tool apart. Not expected by default, but clearly valuable once seen.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Find closest accessible variant | The core differentiator of this tool — not just "your colour fails" but "here's what works" | High | This is the whole point; accessible-colors.com and Contrast Finder do this but with limited UX |
| Multiple variant suggestions (~5 swatches) | One suggestion is brittle; show options so the designer can choose the best fit for their palette | Medium | Cluster around the original hue, vary lightness |
| Click swatch to preview | Direct manipulation — select a candidate and see it applied immediately | Low | Standard pattern once suggestions are shown |
| Single-colour mode (pass AA on both light AND dark) | Useful for design systems needing one universal text colour | Medium | Rare — most tools only check one background at a time |
| Dual-colour mode (separate light/dark shades, each passing AA) | Better matches real design practice — use one shade on white, another on dark | Medium | Very few tools address this scenario explicitly |
| Shareable URL with colour state | Low friction sharing — no accounts, just copy the URL | Low | Query param e.g. `?colour=2563EB`; WebAIM does this |
| Show if a variant also passes AAA | Bonus information — costs nothing if the ratio is already calculated | Low | Surface as a secondary badge |
| Real text sample (heading + paragraph) | Shows the colour doing actual work, not "Aa" or Lorem Ipsum | Low | Inspired by colourcontrast.cc's approach |

## Anti-Features

Things to explicitly not build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Colour blindness simulation | Different problem, different tool; scope creep that adds complexity without serving the core use case | Link to dedicated tools (e.g. Coblis, Accessible Perch) |
| Full palette generation | Palette tools (Coolors, Realtime Colors) do this well; we make one colour accessible, not a whole system | Stay focused on single-colour and dual-colour modes |
| User accounts / saved colours | Stateless tools are simpler and faster to reach; accounts add friction and maintenance burden | URL-based sharing covers the legitimate use case |
| APCA support (next-gen contrast model) | APCA is not yet in WCAG 2.x; including it confuses users about which standard they need to pass | Revisit if WCAG 3 ships and is adopted |
| Colour picker / eyedropper | Adds native browser API complexity, inconsistent cross-browser UX; direct hex input is faster for designers who already have a colour | Accept typed hex; browser's built-in `<input type="color">` can supplement if needed |
| Batch/multi-combination testing (contrast grid) | Contrast Grid tools (Contrast Grid by Eightshapes) do this; it's a different workflow | Out of scope |
| Browser extension / bookmarklet | Maintenance overhead; the URL-sharing pattern serves the same "come back to this" use case | Ship the web tool first |
| RGB / HSL input modes | Most web designers work in hex; supporting RGB and HSL adds UI complexity for rare benefit | Accept hex only; handle conversions internally |

## Feature Dependencies

```
Colour input → Contrast ratio calculation → AA/AAA badges
Contrast ratio calculation → Text preview (need the colour to preview)
Text preview → Split-screen layout (need two backgrounds to compare)
Custom background inputs → Contrast ratio calculation (recalculate when BG changes)

Find accessible variant (button) → Variant suggestions (swatches)
Variant suggestions (swatches) → Click-to-preview (needs swatches to exist)
Single/dual-colour toggle → Different variant search logic

URL state → All of the above (serialise colour + mode into URL params)
```

## MVP Recommendation

Prioritise:

1. Hex input, live contrast ratio, AA/AAA badges (normal + large text) — without this it's not a contrast tool
2. Split-screen preview with real text samples — table stakes; the visual is the whole point
3. Custom background colour inputs — defaults are never right for real projects
4. Find accessible variant — this is the differentiator; without it the tool is just another checker
5. ~5 variant swatches with click-to-preview — the suggestion feature only works with real options to choose from

Defer:
- Single/dual-colour toggle: implement single-colour mode first, add dual as a second mode once core is solid
- URL state: useful, but add it after the core interaction is working — it's a one-liner enhancement, not a blocker
- AAA badge: trivial to add once AA is working — compute both at the same time

## Sources

- colourcontrast.cc (direct inspection)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) (direct inspection)
- [accessible-colors GitHub](https://github.com/moroshko/accessible-colors) — lightness-adjustment approach to finding closest accessible colour
- [Contrast Finder](https://app.contrast-finder.org/?lang=en) — proximity vs range-based suggestion algorithms
- [Learn UI Design Accessible Color Generator](https://www.learnui.design/tools/accessible-color-generator.html) — prescriptive vs descriptive framing
- [Accesstive: Best Color Contrast Checker Tools](https://accesstive.com/blog/best-color-contrast-checker-tools/) — tool landscape overview
- [Stark for Figma](https://www.getstark.co/figma/) — contrast checking in design tool context
