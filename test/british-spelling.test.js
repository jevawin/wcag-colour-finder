// test/british-spelling.test.js
// Grep-style audit: scan visible UI sources for American spellings.
// Per D-14 (CONTEXT 05): British spelling in UI copy, American spelling allowed
// for CSS properties and JS function identifiers that are American-by-spec/convention.
// Addresses UI-03.
//
// Allow-list rationale (D-14):
//   - CSS property names containing "color": color-mix, outline-color, border-color,
//     background-color, text-decoration-color, accent-color, caret-color, fill-color,
//     box-shadow-color. The bare property `color:` is also allowed (CSS spec).
//   - JS DOM/CSSOM identifiers: .style.color, getPropertyValue, setProperty.
//   - Known American JS identifiers already shipped: applyColor, clearColor,
//     checkTopZoneContrast.
//   - CSS values: `center` is a CSS keyword value for alignment (text-align, align-items,
//     justify-content, justify-items, place-items) — allowed in CSS value context.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TARGETS = ['index.html', 'app.js', 'style.css'];

// Forbidden American tokens (case-insensitive, word-boundary).
// `color` is handled separately because it appears in legitimate CSS/JS identifiers.
const FORBIDDEN = [
  /\bgray\b/i,
  /\bbehavior\b/i,
  /\bfavorite\b/i,
  /\borganize\b/i,
  /\banalyze\b/i,
];

// `center` allow-list: lines where `center` is a CSS value keyword.
const CENTER_ALLOW = [
  'text-align: center',
  'text-align:center',
  'align-items: center',
  'align-items:center',
  'justify-content: center',
  'justify-content:center',
  'justify-items: center',
  'justify-items:center',
  'place-items: center',
  'place-items:center',
  'place-content: center',
  'place-content:center',
  'align-self: center',
  'align-self:center',
];

// `color` allow-list: CSS property names, JS identifiers, and comment markers.
const COLOR_ALLOW = [
  'color-mix',
  'outline-color',
  'border-color',
  'background-color',
  'text-decoration-color',
  'accent-color',
  'caret-color',
  'fill-color',
  'box-shadow',
  '.style.color',
  'style.color',
  'el.style.color',
  'getPropertyValue',
  'setProperty',
  'applyColor',
  'clearColor',
  'checkTopZoneContrast',
  'American spelling', // the CLAUDE convention comment in app.js
];

function isAllowed(line, allowList) {
  return allowList.some(s => line.includes(s));
}

// Returns true if a `color` match on this line is a bare `color:` CSS declaration.
// Allow that as an American-by-spec CSS property name.
function isBareColorProperty(line) {
  return /(^|[\s;{])color\s*:/.test(line);
}

describe('British spelling audit', () => {
  it('smoke: the word "colour" appears in index.html (confirms file read works)', () => {
    const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
    assert.ok(/\bcolour\b/i.test(html), 'expected "colour" somewhere in index.html');
  });

  for (const file of TARGETS) {
    it(`${file} contains no forbidden American tokens`, () => {
      const src = readFileSync(resolve(ROOT, file), 'utf8');
      const lines = src.split('\n');
      const offenders = [];

      lines.forEach((line, idx) => {
        const lineNo = idx + 1;

        for (const re of FORBIDDEN) {
          const m = line.match(re);
          if (m) offenders.push(`${file}:${lineNo}: ${m[0]} -- ${line.trim()}`);
        }

        // center
        const centerM = line.match(/\bcenter\b/i);
        if (centerM && !isAllowed(line, CENTER_ALLOW)) {
          offenders.push(`${file}:${lineNo}: ${centerM[0]} -- ${line.trim()}`);
        }

        // color
        const colorM = line.match(/\bcolor\b/i);
        if (colorM && !isAllowed(line, COLOR_ALLOW) && !isBareColorProperty(line)) {
          offenders.push(`${file}:${lineNo}: ${colorM[0]} -- ${line.trim()}`);
        }
      });

      assert.equal(
        offenders.length,
        0,
        `Found ${offenders.length} American-spelling offender(s):\n  ${offenders.join('\n  ')}`
      );
    });
  }
});
