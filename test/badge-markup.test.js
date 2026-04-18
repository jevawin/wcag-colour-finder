// test/badge-markup.test.js
// Tests for buildBadgeHTML — structure of the pass/fail badge markup.
// Per UI-SPEC Badge Spec + A11Y-02 (text + icon cue).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadgeHTML } from '../app.js';

describe('buildBadgeHTML', () => {
  it('pass-AA markup includes aria-hidden icon span and visible "Pass AA" label', () => {
    const html = buildBadgeHTML(true, 'AA');
    assert.ok(html.includes('aria-hidden="true"'), 'expected literal aria-hidden="true" attribute');
    assert.ok(html.includes('Pass AA'), 'expected visible "Pass AA" label text');
    assert.ok(html.includes('✓'), 'expected tick glyph for pass state');
  });

  it('fail-AA markup contains "Fail AA" label and cross glyph', () => {
    const html = buildBadgeHTML(false, 'AA');
    assert.ok(html.includes('Fail AA'), 'expected visible "Fail AA" label');
    assert.ok(html.includes('✗'), 'expected cross glyph for fail state');
    assert.ok(html.includes('aria-hidden="true"'), 'expected aria-hidden icon span');
  });

  it('pass-AAA-Large label variant renders "Pass AAA Large"', () => {
    const html = buildBadgeHTML(true, 'AAA Large');
    assert.ok(html.includes('Pass AAA Large'), 'expected "Pass AAA Large" label');
  });

  it('icon glyph appears only inside the aria-hidden span (before the text span)', () => {
    const html = buildBadgeHTML(true, 'AA');
    const iconIdx = html.indexOf('✓');
    const ariaIdx = html.indexOf('aria-hidden="true"');
    const passIdx = html.indexOf('Pass AA');
    assert.ok(ariaIdx !== -1 && iconIdx !== -1 && passIdx !== -1, 'all markers must exist');
    // aria-hidden attribute appears before the icon glyph
    assert.ok(ariaIdx < iconIdx, 'aria-hidden span opens before the icon');
    // icon appears before the visible text label
    assert.ok(iconIdx < passIdx, 'icon glyph precedes the text label');
  });

  it('returns two span elements (icon + text)', () => {
    const html = buildBadgeHTML(false, 'AAA');
    const spanOpens = (html.match(/<span/g) || []).length;
    assert.equal(spanOpens, 2, 'expected exactly two <span> openings');
  });
});
