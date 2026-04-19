---
phase: 05-design-and-accessibility
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - index.html
autonomous: true
gap_closure: true
requirements:
  - UI-01
  - UI-02
  - UI-03
must_haves:
  truths:
    - "Page loads with Google Fonts Inter + JetBrains Mono"
    - "DOM matches mockup structure: .topbar-wrap > .topbar > .title-row + .controls(.row-one + .row-two > .alts) + .previews > .preview.is-light + .preview.is-dark"
    - "Hex input, Find button, segmented AA|AAA toggle live inside .topbar"
    - "Each preview has fg-tag (label + swatch + hex span + copy button SVG) and bg-tag (colour-input + hash + text input)"
    - "Each preview has a .ratio span + .pills container + .heading 'The quick brown fox' + .para + .digits row '0 1 2 3 4 5 6 7 8 9'"
    - "No .sample-text contenteditable elements remain in markup"
  artifacts:
    - path: "index.html"
      provides: "New mockup-aligned DOM skeleton with Google Fonts link"
      contains: "topbar-wrap"
  key_links:
    - from: "index.html <head>"
      to: "fonts.googleapis.com"
      via: "<link href> stylesheet"
      pattern: "fonts.googleapis.com/css2.*Inter.*JetBrains\\+Mono"
    - from: "index.html"
      to: "app.js"
      via: "element IDs (base-text, base-color, find-btn, find-btn-label, target-toggle, alts, preview-light, preview-dark, light-ratio, light-pills, dark-ratio, dark-pills, light-fg-hex, dark-fg-hex, light-bg-text, light-bg-color, dark-bg-text, dark-bg-color)"
      pattern: "id=\"base-text\""
---

<objective>
Rebuild index.html from scratch to match the new Claude Design mockup ground truth. Replace the current two-zone monochrome layout with the mockup's full-bleed coloured topbar + split preview structure. Load Google Fonts (Inter + JetBrains Mono). Retire the editable .sample-text pattern — specimen copy is now fixed.

Purpose: Close gaps G1 (topbar shell), G2 (controls inside topbar), G6 (typography system), G7 (new specimen), G10 markup-side (retire .sample-text). DOM must expose the exact IDs and classes the mockup script queries — later waves wire CSS and JS against them.

Output: new index.html that visually matches the mockup skeleton (CSS comes in 05-05, JS in 05-06).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-design-and-accessibility/05-VERIFICATION.md
@.planning/phases/05-design-and-accessibility/05-UI-SPEC.md
@.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html
@index.html
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace index.html with mockup-aligned skeleton</name>
  <files>index.html</files>
  <read_first>
    - `.planning/phases/05-design-and-accessibility/mockup/wcag-colour-finder/project/WCAG Colour Finder.html` lines 1-25 (font links + `.mono` utility), 517-601 (full body markup including topbar, tabs, previews)
    - `.planning/phases/05-design-and-accessibility/05-VERIFICATION.md` gaps G1, G2, G6, G7, G10
    - current `index.html` (entire file — will be replaced)
    - `.planning/phases/05-design-and-accessibility/05-UI-SPEC.md` line 16 (mockup wins over UI-SPEC on conflict)
  </read_first>
  <action>
    Replace the entire contents of `index.html` with a new document matching the mockup body structure. Keep the existing `<script type="module" src="app.js"></script>` reference and `<link rel="stylesheet" href="style.css">` — we retain the external CSS/JS split (mockup is a single-file demo; our build stays split).

    Required `<head>`:
    - `<meta charset="utf-8">`
    - `<meta name="viewport" content="width=device-width, initial-scale=1">`
    - `<title>WCAG Colour Finder</title>`
    - `<link rel="preconnect" href="https://fonts.googleapis.com">`
    - `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
    - `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`
    - `<link rel="stylesheet" href="style.css">`
    - `<script type="module" src="app.js"></script>`

    Required `<body>` — copy structure verbatim from mockup lines 518-601, with these deltas:

    1. Topbar — `<div class="topbar-wrap" id="topbar-wrap"> <div class="topbar"> ... </div> </div>`. Inside `.topbar`:
       - `<span class="credit">Inspired by <a href="https://colourcontrast.cc" target="_blank" rel="noopener">colourcontrast.cc</a></span>`
       - `<div class="title-row"> <h1>WCAG colour finder</h1> <p class="subtitle">Enter a hex code then press "Find 5" to find close pairs accessible on light and dark backgrounds.</p> </div>` — use a straight double-quote character around Find 5 (mockup uses curly quotes; we use straight to match prior project copy conventions and avoid encoding issues).
       - `<div class="controls">` containing:
         - `<div class="row-one">` with:
           - `<label class="hex-input" for="base-text"> <span class="swatch" id="base-swatch" style="background:#2563EB"> <input type="color" id="base-color" value="#2563EB" aria-label="Pick base colour"> </span> <span class="hash mono">#</span> <input id="base-text" type="text" value="2563EB" maxlength="6" spellcheck="false" autocomplete="off" aria-label="Hex colour code"> </label>`
           - `<button class="btn" id="find-btn"><span id="find-btn-label">Find 5</span><span>→</span></button>`
           - `<div class="target-toggle" id="target-toggle" role="group" aria-label="Target WCAG level"> <button type="button" class="target-opt is-active" data-target="AA">AA</button> <button type="button" class="target-opt" data-target="AAA">AAA</button> </div>`
         - `<div class="row-two card"> <div class="alts" id="alts"></div> </div>`

       Default base colour stays `#2563EB` (project default per INP-03). The mockup hardcodes `#6BD4AC`; use our default.

    2. Mobile tabs — outside `.topbar-wrap`, before `.previews`:
       `<div class="preview-tabs" role="tablist" aria-label="Preview background"> <div class="preview-tabs-inner"> <button type="button" class="tab-btn is-active" data-tab="light" role="tab" aria-selected="true">Light</button> <button type="button" class="tab-btn" data-tab="dark" role="tab" aria-selected="false">Dark</button> </div> </div>`

    3. Previews — `<section class="previews">` containing:
       - `<div class="preview is-light is-visible" id="preview-light">` with children in this order:
         - `<span class="tag-label is-fg">Foreground colour</span>`
         - `<span class="tag-label is-bg">Background colour</span>`
         - `<div class="fg-tag"> <span class="fg-swatch"></span> <span id="light-fg-hex">#2563EB</span> <button class="copy-btn" type="button" data-copy-target="light-fg-hex" aria-label="Copy hex"> <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="9" rx="1.2"/><path d="M3 10V3.2A1.2 1.2 0 0 1 4.2 2H10"/></svg> </button> </div>`
         - `<div class="bg-tag"> <span class="swatch-sm" style="background:#ffffff"> <input type="color" id="light-bg-color" value="#ffffff" aria-label="Light background"> </span> <span class="hash-sm mono">#</span> <input id="light-bg-text" type="text" value="FFFFFF" maxlength="6" spellcheck="false" autocomplete="off" aria-label="Light background hex colour"> </div>`
         - `<div class="preview-inner"> <div class="ratio-row"> <div class="ratio mono"><span id="light-ratio">—</span></div> <div class="pills" id="light-pills"></div> </div> <h2 class="heading">The quick brown fox</h2> <p class="para">Typography should be readable first. This paragraph uses the current base colour at 16&nbsp;px against the chosen background — the small-text benchmark for WCAG body copy.</p> <p class="digits">0 1 2 3 4 5 6 7 8 9</p> </div>`
       - `<div class="preview is-dark" id="preview-dark">` — mirror structure with `dark-fg-hex`, `dark-bg-color` (value="#111111"), `dark-bg-text` (value="111111", aria-label="Dark background hex colour"), `dark-ratio`, `dark-pills`.

    Remove entirely from the current file: `.control-zone`, `.preview-zone`, `.aa-toggle`, `.hex-pill` (old pattern), all `contenteditable` attributes, all `.sample-text` / `.sample-heading` / `.sample-para` / `.numerals` classes, `#swatch-row` / `.swatch-list` / `.distance-warning` / `#top-zone-warning` / `#copy-live`, the old `.preview-field` / `.badge-area` / `.badge` markup.

    Keep British spelling everywhere in visible copy (D-14, UI-03): "colour", "Background colour", "Foreground colour", "Copy hex". Page title stays "WCAG Colour Finder" (title case).

    The default base is `#2563EB` per INP-03 — override the mockup's `#6BD4AC`. Both `#base-swatch` inline background and `#base-color` value must be `#2563EB`; `#base-text` value must be `2563EB`; `#light-fg-hex` and `#dark-fg-hex` text contents both `#2563EB`.
  </action>
  <acceptance_criteria>
    - `grep -c 'fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600' index.html` → 1
    - `grep -c 'class="topbar-wrap" id="topbar-wrap"' index.html` → 1
    - `grep -c 'class="target-toggle"' index.html` → 1
    - `grep -c 'data-target="AA"' index.html` → 1 and `grep -c 'data-target="AAA"' index.html` → 1
    - `grep -c 'id="alts"' index.html` → 1
    - `grep -c 'class="fg-tag"' index.html` → 2
    - `grep -c 'class="bg-tag"' index.html` → 2
    - `grep -c 'data-copy-target="light-fg-hex"' index.html` → 1 and same for dark
    - `grep -c 'id="light-ratio"' index.html` → 1, `grep -c 'id="dark-ratio"' index.html` → 1
    - `grep -c 'class="pills"' index.html` → 2
    - `grep -c 'class="heading"' index.html` → 2
    - `grep -c 'class="digits"' index.html` → 2
    - `grep -c 'The quick brown fox' index.html` → 2
    - `grep -c 'contenteditable' index.html` → 0
    - `grep -c 'sample-text' index.html` → 0
    - `grep -c 'sample-heading' index.html` → 0
    - `grep -c 'sample-para' index.html` → 0
    - `grep -c 'control-zone' index.html` → 0
    - `grep -c 'preview-zone' index.html` → 0
    - `grep -c 'aa-toggle' index.html` → 0
    - `grep -c '2563EB' index.html` → at least 4 (base-swatch style, base-color value, base-text value, light-fg-hex, dark-fg-hex)
    - `grep -c '<link rel="stylesheet" href="style.css">' index.html` → 1
    - `grep -c '<script type="module" src="app.js">' index.html` → 1
    - `node --test test/british-spelling.test.js` — smoke assertion "colour appears in index.html" must still pass (test expects /\bcolour\b/i)
  </acceptance_criteria>
  <verify>
    <automated>node --test test/british-spelling.test.js</automated>
  </verify>
  <done>index.html contains the new mockup-aligned DOM skeleton with Google Fonts loaded, IDs/classes match mockup, no legacy patterns remain, British-spelling test still green.</done>
</task>

</tasks>

<verification>
- index.html has the new structure verified by greps above
- british-spelling test still green (no new American spellings introduced)
- Full test suite (`node --test test/*.test.js`) will break temporarily — app.js still references old IDs (#hex-input, #find-btn current wiring, .sample-text). That's expected; 05-05 and 05-06 fix CSS and JS. Run the full suite at end of 05-06.
</verification>

<success_criteria>
All acceptance_criteria greps pass. index.html visibly matches the mockup skeleton when opened in a browser (though unstyled until 05-05 ships).
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-04-SUMMARY.md`.
</output>
</content>
</invoke>