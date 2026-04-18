---
phase: 05-design-and-accessibility
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app.js
  - test/app.test.js
  - test/british-spelling.test.js
  - test/badge-markup.test.js
  - test/ui-chrome-contrast.test.js
autonomous: true
requirements: [UI-03, A11Y-01, A11Y-02]
must_haves:
  truths:
    - "Pure helpers buildBadgeHTML, deriveBadgeColors, chooseChromeForeground exist and are exported from app.js"
    - "buildBadgeHTML returns markup with aria-hidden icon span and visible text label"
    - "chooseChromeForeground returns '#ffffff' for dark user colours (<4.5:1 vs #000000) and '#000000' otherwise"
    - "British-spelling test file greps index.html, app.js, style.css and fails on stray American words"
    - "All node:test suites run green"
  artifacts:
    - path: "app.js"
      provides: "Exported buildBadgeHTML, deriveBadgeColors, chooseChromeForeground pure functions"
      contains: "export { buildBadgeState, expandHex, formatRatio, buildBadgeHTML, deriveBadgeColors, chooseChromeForeground }"
    - path: "test/badge-markup.test.js"
      provides: "Tests for buildBadgeHTML structure"
      min_lines: 20
    - path: "test/ui-chrome-contrast.test.js"
      provides: "Tests for chooseChromeForeground + deriveBadgeColors"
      min_lines: 25
    - path: "test/british-spelling.test.js"
      provides: "grep-style audit test for stray American spelling"
      min_lines: 20
    - path: "test/app.test.js"
      provides: "Extended tests covering new helper exports"
      contains: "buildBadgeHTML"
  key_links:
    - from: "test/badge-markup.test.js"
      to: "app.js buildBadgeHTML"
      via: "import"
      pattern: "from '../app.js'"
    - from: "test/ui-chrome-contrast.test.js"
      to: "app.js chooseChromeForeground / deriveBadgeColors"
      via: "import"
      pattern: "from '../app.js'"
---

<objective>
Extract three pure helpers from the Phase 5 polish scope so that later waves (HTML/CSS edits) can reuse tested, DOM-free logic. This is Wave 0 of Phase 5 — test scaffolding plus a minimal code surface to import against.

Purpose: Per 05-VALIDATION.md, Phase 5 needs three new test stubs (british-spelling, badge-markup, ui-chrome-contrast). RESEARCH.md Open Question 1 and Validation Architecture recommend computing pass-badge colours in JS (not reading getComputedStyle) and extracting buildBadgeHTML as a testable pure string function. This plan extracts and tests those helpers before Plan 02 wires them into the DOM.

Output: Three new pure exports in app.js, three new test files under test/, extended tests in test/app.test.js. No markup or CSS changes yet.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/05-design-and-accessibility/05-CONTEXT.md
@.planning/phases/05-design-and-accessibility/05-RESEARCH.md
@.planning/phases/05-design-and-accessibility/05-UI-SPEC.md
@.planning/phases/05-design-and-accessibility/05-VALIDATION.md
@app.js
@colour-engine.js
@test/app.test.js

<interfaces>
Existing pure exports in app.js (lines 15–59):
```javascript
export { buildBadgeState, expandHex, formatRatio };
// All declared above the `if (typeof document !== 'undefined')` DOM guard.
```

Existing colour-engine.js (relevant for this plan):
```javascript
export function contrastRatio(hexA, hexB): number;  // accepts '#rrggbb' or 'rrggbb'
export function parseHex(hex): { r: number, g: number, b: number };
export function srgbToOklab(r, g, b): { L, a, b };
export function oklabToSrgb(L, a, b): { r, g, b };
```

Existing test pattern (test/app.test.js) — ESM imports with node:test:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadgeState, expandHex, formatRatio } from '../app.js';
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add buildBadgeHTML + badge-markup tests</name>
  <files>app.js, test/badge-markup.test.js, test/app.test.js</files>
  <read_first>
    - app.js lines 15–59 (existing pure-function block and export list)
    - app.js lines 107–126 (current setBadge to understand inputs it must replace)
    - 05-UI-SPEC.md "Badge Spec" section (structure, labels table, aria-hidden rule)
    - 05-CONTEXT.md D-05 (text + icon cue), D-06 overridden by UI-SPEC
    - test/app.test.js (existing ESM + node:test pattern)
  </read_first>
  <behavior>
    - buildBadgeHTML(passes=true,  label='AA')       → '&lt;span aria-hidden="true"&gt;✓&lt;/span&gt;&lt;span&gt;Pass AA&lt;/span&gt;'
    - buildBadgeHTML(passes=false, label='AA')       → '&lt;span aria-hidden="true"&gt;✗&lt;/span&gt;&lt;span&gt;Fail AA&lt;/span&gt;'
    - buildBadgeHTML(passes=true,  label='AAA Large')→ '&lt;span aria-hidden="true"&gt;✓&lt;/span&gt;&lt;span&gt;Pass AAA Large&lt;/span&gt;'
    - Returned string contains literal `aria-hidden="true"` (exact attribute form)
    - Returned string contains the visible word 'Pass' or 'Fail' (A11Y-02 text cue)
  </behavior>
  <action>
    1. In app.js above the DOM guard, add:
       ```
       function buildBadgeHTML(passes, label) {
         const icon = passes ? '✓' : '✗';
         const word = passes ? 'Pass' : 'Fail';
         return `&lt;span aria-hidden="true"&gt;${icon}&lt;/span&gt;&lt;span&gt;${word} ${label}&lt;/span&gt;`;
       }
       ```
       NOTE: write actual unescaped HTML characters in source — the escape above is documentation. The function returns `<span aria-hidden="true">✓</span><span>Pass AA</span>` for passes=true, label='AA'.
    2. Add `buildBadgeHTML` to the existing `export { ... }` list in app.js (line 59).
    3. Create test/badge-markup.test.js with node:test cases asserting:
       - pass case contains 'aria-hidden="true"' substring
       - pass case contains 'Pass AA' substring
       - fail case contains 'Fail AA' substring
       - icon glyph '✓' appears only inside the aria-hidden span (assert via indexOf ordering)
    4. Add one extra assertion to test/app.test.js importing buildBadgeHTML and verifying the 'Pass AAA Large' label variant.
    5. Do NOT modify setBadge in Plan 01. setBadge will be rewired to call buildBadgeHTML in Plan 02.
    Addresses UI-SPEC Badge Spec, D-05.
  </action>
  <verify>
    <automated>node --test test/badge-markup.test.js test/app.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `grep -n "export {" app.js` output contains `buildBadgeHTML`
    - `grep -n "function buildBadgeHTML" app.js` returns exactly one match
    - `node --test test/badge-markup.test.js` exits 0 with ≥3 tests passing
    - `node --test test/app.test.js` exits 0 with no regressions (existing buildBadgeState/expandHex/formatRatio tests still pass)
    - test/badge-markup.test.js imports from `'../app.js'`
  </acceptance_criteria>
  <done>
    buildBadgeHTML exported from app.js, covered by at least 3 node:test assertions, all existing tests still green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add chooseChromeForeground + deriveBadgeColors + ui-chrome-contrast tests</name>
  <files>app.js, test/ui-chrome-contrast.test.js</files>
  <read_first>
    - colour-engine.js — confirm contrastRatio signature and hex formats it accepts
    - 05-RESEARCH.md Open Question 2 (auto-switch chrome foreground) and Pattern 3 (pass-badge derivation)
    - 05-UI-SPEC.md "Colour" section lines 136–150 (pass-badge derivation) and lines 478–482 (top-zone contrast rule)
    - 05-CONTEXT.md D-01 (monochrome chrome)
  </read_first>
  <behavior>
    - chooseChromeForeground('#ffffff') returns '#000000'
    - chooseChromeForeground('#000000') returns '#ffffff'
    - chooseChromeForeground('#111111') returns '#ffffff'  (black on near-black fails AA)
    - chooseChromeForeground('#2563eb') returns '#ffffff'  (default app colour is dark-ish — verify via contrastRatio)
    - chooseChromeForeground('#ffff00') returns '#000000'  (yellow — black wins)
    - deriveBadgeColors('#2563eb') returns { passBg, passText } where contrastRatio(passText, passBg) >= 4.5
    - deriveBadgeColors('#ffffff') returns a pair whose contrast >= 4.5 (fallback path allowed)
    - deriveBadgeColors('#000000') returns a pair whose contrast >= 4.5 (fallback path allowed)
  </behavior>
  <action>
    1. Add to app.js above the DOM guard, next to buildBadgeHTML:
       ```
       import { contrastRatio, parseHex, srgbToOklab, oklabToSrgb } from './colour-engine.js';

       function chooseChromeForeground(userHex) {
         // Return '#000000' if black-on-userHex hits AA (4.5:1), else '#ffffff'.
         const hex = userHex.startsWith('#') ? userHex : '#' + userHex;
         return contrastRatio('#000000', hex) >= 4.5 ? '#000000' : '#ffffff';
       }

       function deriveBadgeColors(userHex) {
         // Derive pass-badge bg/text from user colour using OKLCH lightness shifts.
         // Per RESEARCH.md recommended simplification: compute in JS, verify with contrastRatio,
         // fall back to static green when derived contrast < 4.5.
         const FALLBACK = { passBg: '#16a34a', passText: '#ffffff' };
         try {
           const hex = userHex.startsWith('#') ? userHex : '#' + userHex;
           const { r, g, b } = parseHex(hex);
           const oklab = srgbToOklab(r / 255, g / 255, b / 255);
           // Push L toward 0.90 for bg (light tint), 0.30 for text (dark saturated)
           const bg   = oklabToSrgb(0.90, oklab.a * 0.4, oklab.b * 0.4);
           const text = oklabToSrgb(0.30, oklab.a,       oklab.b);
           const toHex = (c) =&gt; {
             const v = Math.max(0, Math.min(255, Math.round(c * 255)));
             return v.toString(16).padStart(2, '0');
           };
           const passBg   = '#' + toHex(bg.r)   + toHex(bg.g)   + toHex(bg.b);
           const passText = '#' + toHex(text.r) + toHex(text.g) + toHex(text.b);
           if (contrastRatio(passText, passBg) >= 4.5) return { passBg, passText };
           return FALLBACK;
         } catch (_e) {
           return FALLBACK;
         }
       }
       ```
       NOTE: use real `=>` arrows in source, not the escape shown above. Use real template literals.
    2. Add `chooseChromeForeground` and `deriveBadgeColors` to the export list.
    3. Create test/ui-chrome-contrast.test.js with node:test importing both helpers from '../app.js' and asserting every bullet in the <behavior> block above. Use `import { contrastRatio } from '../colour-engine.js'` for the pair-contrast assertion.
    Addresses UI-01 (chrome stays monochrome), A11Y-01 (top-zone contrast), A11Y-02 badge colour derivation safety.
  </action>
  <verify>
    <automated>node --test test/ui-chrome-contrast.test.js</automated>
  </verify>
  <acceptance_criteria>
    - `grep -n "function chooseChromeForeground" app.js` = 1 match
    - `grep -n "function deriveBadgeColors" app.js` = 1 match
    - `grep -n "export {" app.js` output contains both new names
    - `node --test test/ui-chrome-contrast.test.js` exits 0 with ≥7 passing assertions
    - `node --test test/` (all existing suites) still green
  </acceptance_criteria>
  <done>
    Both helpers exported, test file green, every deriveBadgeColors output verified to hit 4.5:1 or fall back.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add british-spelling grep audit test</name>
  <files>test/british-spelling.test.js</files>
  <read_first>
    - 05-RESEARCH.md "British Spelling Grep Audit" code example
    - 05-CONTEXT.md D-14 (British UI copy, American code identifiers)
    - index.html, app.js, style.css — to know what exists and what the test should scan
    - 05-UI-SPEC.md "Copywriting Contract" table (all expected British copy)
  </read_first>
  <action>
    1. Create test/british-spelling.test.js as a node:test suite that reads each target file via `fs.readFileSync` and fails if any American-spelling token appears in visible UI copy.
    2. Scan these files: 'index.html', 'app.js', 'style.css'.
    3. Forbidden words (regex, case-insensitive, word-boundary): `\bgray\b`, `\bcenter\b`, `\bbehavior\b`, `\bfavorite\b`, `\borganize\b`, `\banalyze\b`, `\bcolor\b` (filtered below).
    4. For `\bcolor\b` only, allow lines that match ANY of these allow-list substrings (CSS property names and JS function identifiers are American by spec/convention per D-14):
       - 'color-mix', 'outline-color', 'border-color', 'background-color', 'text-decoration-color', 'accent-color', 'caret-color', 'box-shadow', 'fill-color'
       - 'getPropertyValue', 'setProperty'
       - `applyColor`, `clearColor`, `checkTopZoneContrast` (JS identifiers — keep American)
       - Leading `//` or `/*` comment lines (dev-facing; optional — keep strict if you prefer)
    5. Emit a clear failure message listing `file:line:offending-text` for each hit.
    6. Add one smoke-assertion: the word `colour` appears at least once in index.html (confirms the test is actually reading the file).
    Addresses UI-03, D-14.
  </action>
  <verify>
    <automated>node --test test/british-spelling.test.js</automated>
  </verify>
  <acceptance_criteria>
    - File exists at test/british-spelling.test.js
    - `node --test test/british-spelling.test.js` exits 0 against current tree OR, if violations exist in current copy, the test reports them clearly (Plan 02 will fix any hits — this plan just installs the guard)
    - The test reads all three target files (grep for `readFileSync` returns ≥3 matches)
    - Allow-list is documented in a comment at the top of the file referencing D-14
  </acceptance_criteria>
  <done>
    British-spelling audit test installed. Either green against current tree, or red with a precise list of offenders for Plan 02 to fix.
  </done>
</task>

</tasks>

<verification>
Run the full test suite:
```
node --test test/
```
All of: colour-engine.test.js, app.test.js, url-state.test.js, variant-search.test.js, badge-markup.test.js, ui-chrome-contrast.test.js, british-spelling.test.js must exit green (or british-spelling may surface fixable offenders that Plan 02 addresses — document any such hits in the summary).
</verification>

<success_criteria>
1. `grep -nE "function (buildBadgeHTML|chooseChromeForeground|deriveBadgeColors)" app.js` returns 3 matches
2. All three helpers are in the app.js export list
3. `node --test test/badge-markup.test.js test/ui-chrome-contrast.test.js test/british-spelling.test.js` exits 0
4. `node --test test/` (full suite) exits 0 (or fails only on british-spelling with an explicit list of strings for Plan 02)
5. No DOM/CSS changes — this plan touches only app.js (above the DOM guard) and test files
</success_criteria>

<output>
After completion, create `.planning/phases/05-design-and-accessibility/05-01-SUMMARY.md` listing: new exports, new test files, assertion counts, and any British-spelling offenders discovered (as a handoff list for Plan 02).
</output>
