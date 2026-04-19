// test/app.test.js
// Pure logic tests for app.js helper functions.
// No DOM required — tests target exported functions only.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadgeState, expandHex, formatRatio, buildPillHTML } from '../app.js';

describe('buildBadgeState', () => {
  it('returns all true for ratio 8.0 (passes AA, AAA, AA large, AAA large)', () => {
    const state = buildBadgeState(8.0);
    assert.equal(state.aa, true);
    assert.equal(state.aaa, true);
    assert.equal(state.aaLarge, true);
    assert.equal(state.aaaLarge, true);
  });

  it('returns aa=true, aaa=false, aaLarge=true, aaaLarge=true for ratio 4.6', () => {
    const state = buildBadgeState(4.6);
    assert.equal(state.aa, true);
    assert.equal(state.aaa, false);
    assert.equal(state.aaLarge, true);
    assert.equal(state.aaaLarge, true);
  });

  it('returns all false for ratio 2.5 (below all thresholds)', () => {
    const state = buildBadgeState(2.5);
    assert.equal(state.aa, false);
    assert.equal(state.aaa, false);
    assert.equal(state.aaLarge, false);
    assert.equal(state.aaaLarge, false);
  });

  it('returns aa=false, aaa=false, aaLarge=true, aaaLarge=false for ratio 3.1', () => {
    const state = buildBadgeState(3.1);
    assert.equal(state.aa, false);
    assert.equal(state.aaa, false);
    assert.equal(state.aaLarge, true);
    assert.equal(state.aaaLarge, false);
  });
});

describe('expandHex', () => {
  it('expands 3-digit hex to 6-digit uppercase', () => {
    assert.equal(expandHex('fff'), 'FFFFFF');
  });

  it('returns 6-digit hex unchanged (uppercased)', () => {
    assert.equal(expandHex('2563EB'), '2563EB');
  });

  it('expands abc to AABBCC', () => {
    assert.equal(expandHex('abc'), 'AABBCC');
  });
});

describe('formatRatio', () => {
  it('formats 4.478 as "4.48:1"', () => {
    assert.equal(formatRatio(4.478), '4.48:1');
  });

  it('formats 1.0 as "1.00:1"', () => {
    assert.equal(formatRatio(1.0), '1.00:1');
  });
});

describe('buildPillHTML', () => {
  it('pass case contains "pass", "✓", "Pass", aria-hidden glyph, and the label', () => {
    const html = buildPillHTML('AA Normal', true);
    assert.ok(html.includes('pass'), 'expected pass class');
    assert.ok(html.includes('✓'), 'expected tick glyph');
    assert.ok(html.includes('Pass'), 'expected visible "Pass" word for screen readers');
    assert.ok(html.includes('AA Normal'), 'expected label text');
    assert.ok(html.includes('aria-hidden="true"'), 'expected aria-hidden on glyph');
  });

  it('fail case contains "fail", "✕", "Fail", and the label', () => {
    const html = buildPillHTML('AAA Large', false);
    assert.ok(html.includes('fail'), 'expected fail class');
    assert.ok(html.includes('✕'), 'expected cross glyph');
    assert.ok(html.includes('Fail'), 'expected visible "Fail" word');
    assert.ok(html.includes('AAA Large'), 'expected label text');
    assert.ok(html.includes('aria-hidden="true"'), 'expected aria-hidden on glyph');
  });

  it('renders the exact contract string for (AA Normal, true)', () => {
    const expected = '<div class="pill-wrap"><span class="pill pass"><span class="glyph" aria-hidden="true">\u2713</span>Pass</span><span class="pill-label">AA Normal</span></div>';
    assert.equal(buildPillHTML('AA Normal', true), expected);
  });

  it('renders the exact contract string for (AA Large, false)', () => {
    const expected = '<div class="pill-wrap"><span class="pill fail"><span class="glyph" aria-hidden="true">\u2715</span>Fail</span><span class="pill-label">AA Large</span></div>';
    assert.equal(buildPillHTML('AA Large', false), expected);
  });
});
