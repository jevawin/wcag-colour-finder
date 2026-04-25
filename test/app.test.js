// test/app.test.js
// Pure logic tests for app.js helper functions.
// No DOM required — tests target exported functions only.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadgeState, expandHex, formatRatio, buildPillHTML } from '../app.js';
import { findVariantPairs } from '../variant-search.js';
import { contrastRatio } from '../colour-engine.js';

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

// --- Phase 7 integration: autoFindAndApply call shape ---
// autoFindAndApply is inside the DOMContentLoaded IIFE and not directly
// exportable. These tests exercise findVariantPairs with the exact 5-arg
// call pattern app.js now uses, covering the AA/AAA threshold wiring and
// the already-accessible empty-array contract that the "already accessible"
// status announcement depends on (D-12).

describe('app.js integration — findVariantPairs call pattern', () => {
  it('mirrors autoFindAndApply AA call: 5 args with targetRatio=4.5', () => {
    const result = findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 4.5);
    assert.ok(Array.isArray(result), 'should return an array for valid input');
  });

  it('mirrors autoFindAndApply AAA call: 5 args with targetRatio=7.0', () => {
    const result = findVariantPairs('#2563EB', '#FFFFFF', '#000000', 5, 7.0);
    assert.ok(Array.isArray(result), 'should return an array for valid input');
    for (const p of result) {
      const lr = contrastRatio(p.lightHex, '#FFFFFF');
      const dr = contrastRatio(p.darkHex,  '#000000');
      assert.ok(lr !== null && lr >= 7.0, `${p.lightHex} fails AAA on #FFFFFF (ratio ${lr})`);
      assert.ok(dr !== null && dr >= 7.0, `${p.darkHex} fails AAA on #000000 (ratio ${dr})`);
    }
  });

  it('alreadyAccessible sentinel — autoFindAndApply pattern recognises object shape, not array', () => {
    // #000000 passes AA on both #FFFFFF (21:1) and #888888 (5.92:1).
    // Post-disambiguation: result is the sentinel object, NOT a bare empty Array.
    // autoFindAndApply must distinguish this branch from a genuine empty array.
    const result = findVariantPairs('#000000', '#FFFFFF', '#888888', 5, 4.5);
    assert.strictEqual(Array.isArray(result), false,
      'sentinel must NOT be an array — guards consumers from treating it as one');
    assert.strictEqual(result.alreadyAccessible, true,
      'sentinel must carry alreadyAccessible === true');
    assert.ok(Array.isArray(result.pairs) && result.pairs.length === 0,
      'sentinel must expose an empty pairs array');
  });

  it('Default dark BG #000000 enables AAA pairs for #2563EB on fresh load', () => {
    // Phase 7 D-10 set the dark default to #000000. With #111111 the search
    // could not reach AAA inside the gamut tolerance for #2563EB; with
    // #000000 it can. This test documents that the new default reaches AAA.
    const result = findVariantPairs('#2563EB', '#FFFFFF', '#000000', 5, 7.0);
    assert.ok(Array.isArray(result), 'expected Array result for AAA search');
    assert.ok(result.length >= 1,
      `default dark BG must enable >=1 AAA pair for #2563EB, got ${result.length}`);
  });
});
