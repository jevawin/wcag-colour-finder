// test/app.test.js
// Pure logic tests for app.js helper functions.
// No DOM required — tests target exported functions only.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadgeState, expandHex, formatRatio, buildPillHTML, expandShorthandIfValid } from '../public/app.js';
import { findVariantPairs } from '../public/variant-search.js';
import { contrastRatio } from '../public/colour-engine.js';

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

describe('expandShorthandIfValid', () => {
  it('expands valid 3-char hex to 6-char uppercase', () => {
    assert.equal(expandShorthandIfValid('abc'), 'AABBCC');
  });

  it('strips a leading # before expanding', () => {
    assert.equal(expandShorthandIfValid('#f0a'), 'FF00AA');
  });

  it('returns null for 6-char input (no double-expand)', () => {
    assert.equal(expandShorthandIfValid('AABBCC'), null);
    assert.equal(expandShorthandIfValid('2563EB'), null);
  });

  it('returns null for 4 or 5 char input', () => {
    assert.equal(expandShorthandIfValid('abcd'), null);
    assert.equal(expandShorthandIfValid('abcde'), null);
  });

  it('returns null for invalid chars at length 3', () => {
    assert.equal(expandShorthandIfValid('xyz'), null);
    assert.equal(expandShorthandIfValid('a1g'), null);
  });

  it('returns null for empty string', () => {
    assert.equal(expandShorthandIfValid(''), null);
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

// --- Phase 8 regression: auto-find UX wiring ---
// INPUT-01: Search runs on valid 6-char hex (no Find 5 button required).
//   Verifies the call shape autoFindAndApply uses (app.js:253-259) with
//   targetRatio=4.5 returns variant pairs for an input that fails on both
//   default backgrounds. The button-removal half of INPUT-01 is verified by
//   grep on index.html / app.js / style.css (see 08-02 PLAN acceptance).
// INPUT-02: AA / AAA toggle re-runs search against the new threshold.
//   The toggle handler at app.js:366 calls autoFindAndApply with the
//   updated state.target. These tests prove the targetRatio parameter is
//   honoured by findVariantPairs — without that, the toggle would be a
//   no-op and INPUT-02 would silently regress.

describe('Phase 8 — auto-find UX (INPUT-01, INPUT-02)', () => {
  it('INPUT-01: AA call (targetRatio=4.5) returns Array of variant pairs for a both-fail input', () => {
    const result = findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 4.5);
    assert.ok(Array.isArray(result),
      'AA search must return an Array (not null, not alreadyAccessible sentinel) for a both-fail input');
    assert.ok(result.length >= 1,
      'AA search must return at least one variant pair for #777777 on default backgrounds');
  });

  it('INPUT-02: AAA call (targetRatio=7.0) returns Array of variant pairs for the same input', () => {
    const result = findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 7.0);
    assert.ok(Array.isArray(result),
      'AAA search must return an Array for an input that fails AAA on both BGs');
    for (const p of result) {
      const lr = contrastRatio(p.lightHex, '#FFFFFF');
      const dr = contrastRatio(p.darkHex,  '#000000');
      assert.ok(lr !== null && lr >= 7.0,
        `${p.lightHex} fails AAA on #FFFFFF (ratio ${lr})`);
      assert.ok(dr !== null && dr >= 7.0,
        `${p.darkHex} fails AAA on #000000 (ratio ${dr})`);
    }
  });

  it('INPUT-02: AA and AAA calls for the same input produce different result sets (toggle drives recompute)', () => {
    const aa  = findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 4.5);
    const aaa = findVariantPairs('#777777', '#FFFFFF', '#000000', 5, 7.0);
    assert.ok(Array.isArray(aa) && Array.isArray(aaa),
      'both calls must succeed for the divergence comparison to be meaningful');
    // AAA is strictly harder than AA — first variant lightHex MUST differ
    // OR result lengths MUST differ. If both match, the targetRatio param
    // is being ignored and INPUT-02 has silently regressed.
    const sameFirst = aa.length > 0 && aaa.length > 0
      && aa[0].lightHex === aaa[0].lightHex
      && aa[0].darkHex === aaa[0].darkHex;
    const sameLength = aa.length === aaa.length;
    assert.ok(!(sameFirst && sameLength),
      'AA and AAA results must differ in either first variant or length — same result set means targetRatio is ignored');
  });
});
