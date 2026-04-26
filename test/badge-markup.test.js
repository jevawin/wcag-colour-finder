// test/badge-markup.test.js
// Tests for buildPillHTML markup — structure of the pass/fail pill used in
// the ratio-row pills grid. Per UI-SPEC Badge/Pill Spec + A11Y-02
// (text + icon cue; glyph aria-hidden, word "Pass"/"Fail" screen-reader-readable).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildPillHTML } from '../public/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

describe('buildPillHTML markup', () => {
  it('pass markup has aria-hidden glyph, "Pass" word, and label', () => {
    const html = buildPillHTML('AA Normal', true);
    assert.ok(html.includes('aria-hidden="true"'), 'expected aria-hidden glyph span');
    assert.ok(html.includes('Pass'), 'expected visible "Pass" word');
    assert.ok(html.includes('✓'), 'expected tick glyph');
    assert.ok(html.includes('AA Normal'), 'expected label');
  });

  it('fail markup has "Fail" word and cross glyph', () => {
    const html = buildPillHTML('AAA Large', false);
    assert.ok(html.includes('Fail'), 'expected visible "Fail" word');
    assert.ok(html.includes('✕'), 'expected cross glyph');
    assert.ok(html.includes('aria-hidden="true"'), 'expected aria-hidden glyph span');
  });

  it('uses pill.pass class in pass case', () => {
    const html = buildPillHTML('AA Normal', true);
    assert.ok(html.includes('class="pill pass"'), 'expected pill.pass class');
  });

  it('uses pill.fail class in fail case', () => {
    const html = buildPillHTML('AA Normal', false);
    assert.ok(html.includes('class="pill fail"'), 'expected pill.fail class');
  });

  it('glyph appears before the visible Pass/Fail word', () => {
    const html = buildPillHTML('AA Normal', true);
    const glyphIdx = html.indexOf('✓');
    const wordIdx = html.indexOf('Pass</span>');
    assert.ok(glyphIdx !== -1 && wordIdx !== -1, 'both markers must exist');
    assert.ok(glyphIdx < wordIdx, 'glyph precedes the word');
  });
});

describe('style.css pill rules present (05-05 ground truth)', () => {
  it('style.css contains .pill.pass and .pill.fail rules', () => {
    const css = readFileSync(resolve(ROOT, 'public/style.css'), 'utf8');
    assert.ok(css.includes('.pill.pass'), 'expected .pill.pass selector in style.css');
    assert.ok(css.includes('.pill.fail'), 'expected .pill.fail selector in style.css');
  });
});
