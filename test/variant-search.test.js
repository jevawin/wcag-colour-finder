// test/variant-search.test.js
// Unit tests for findVariantPairs — dual-pair OKLCH lightness binary search.
// Run: node --test test/variant-search.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, srgbToOklab, parseHex } from '../colour-engine.js';
import { findVariantPairs } from '../variant-search.js';

const HEX_PATTERN = /^#[0-9A-F]{6}$/;

// --- Basic contract ---

describe('findVariantPairs — basic contract', () => {
  it('returns an array for a valid hex', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000');
    assert.ok(Array.isArray(results), 'should return an array');
  });

  it('returns at least 1 entry for a valid hex', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000');
    assert.ok(results.length >= 1, `expected >= 1, got ${results.length}`);
  });

  it('every entry has shape { lightHex, darkHex, distance }', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000');
    for (const p of results) {
      assert.ok(typeof p.lightHex === 'string', 'lightHex should be a string');
      assert.ok(typeof p.darkHex === 'string', 'darkHex should be a string');
      assert.ok(typeof p.distance === 'number', 'distance should be a number');
    }
  });

  it('returns null for invalid hex input', () => {
    assert.strictEqual(findVariantPairs('not-a-hex', '#ffffff', '#000000'), null);
  });

  it('respects the count parameter', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000', 3);
    assert.ok(results.length <= 3, `expected <= 3, got ${results.length}`);
  });
});

// --- AA compliance on supplied BGs (MODE-02) ---

describe('findVariantPairs — AA compliance', () => {
  it('every lightHex passes AA on the supplied light BG', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000');
    for (const p of results) {
      assert.ok(HEX_PATTERN.test(p.lightHex), `lightHex "${p.lightHex}" not valid hex`);
      const ratio = contrastRatio(p.lightHex, '#ffffff');
      assert.ok(
        ratio !== null && ratio >= 4.5,
        `${p.lightHex} on #ffffff: ratio=${ratio?.toFixed(3)} fails AA`
      );
    }
  });

  it('every darkHex passes AA on the supplied dark BG', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000');
    for (const p of results) {
      assert.ok(HEX_PATTERN.test(p.darkHex), `darkHex "${p.darkHex}" not valid hex`);
      const ratio = contrastRatio(p.darkHex, '#000000');
      assert.ok(
        ratio !== null && ratio >= 4.5,
        `${p.darkHex} on #000000: ratio=${ratio?.toFixed(3)} fails AA`
      );
    }
  });
});

// --- Sort order ---

describe('findVariantPairs — sort order', () => {
  it('pairs are sorted by ascending distance', () => {
    const results = findVariantPairs('#2563EB', '#ffffff', '#000000');
    for (let i = 1; i < results.length; i++) {
      assert.ok(
        results[i].distance >= results[i - 1].distance,
        `result[${i}].distance (${results[i].distance}) < result[${i-1}].distance (${results[i-1].distance})`
      );
    }
  });
});

// --- BG parameter respected (Pitfall 5) ---

describe('findVariantPairs — BG parameter honoured', () => {
  it('different darkBg produces a different pair set', () => {
    const aPairs = findVariantPairs('#2563EB', '#ffffff', '#000000');
    const bPairs = findVariantPairs('#2563EB', '#ffffff', '#111111');
    assert.ok(aPairs && aPairs.length >= 1, 'need at least one pair for #000000 BG');
    assert.ok(bPairs && bPairs.length >= 1, 'need at least one pair for #111111 BG');
    const aDarkHexes = new Set(aPairs.map(p => p.darkHex));
    const bDarkHexes = new Set(bPairs.map(p => p.darkHex));
    // At least one darkHex should differ between the two BG configurations.
    let differs = false;
    for (const hex of aDarkHexes) {
      if (!bDarkHexes.has(hex)) { differs = true; break; }
    }
    if (!differs) {
      for (const hex of bDarkHexes) {
        if (!aDarkHexes.has(hex)) { differs = true; break; }
      }
    }
    assert.ok(differs, 'expected at least one differing darkHex between #000000 and #111111 BGs');
  });
});

// --- SEARCH-01: AAA returns pairs when colour space permits ---

describe('findVariantPairs — AAA (targetRatio = 7.0)', () => {
  it('returns >= 1 pair for #2563EB on default BGs at AAA', () => {
    const results = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
    assert.ok(Array.isArray(results), 'should return an array');
    assert.ok(results.length >= 1, `expected >= 1 AAA pair, got ${results.length}`);
  });

  it('every lightHex at AAA passes 7.0 on the light BG', () => {
    const results = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
    for (const p of results) {
      const r = contrastRatio(p.lightHex, '#ffffff');
      assert.ok(r !== null && r >= 7.0,
        `${p.lightHex} on #ffffff: ${r?.toFixed(3)} fails AAA`);
    }
  });

  it('every darkHex at AAA passes 7.0 on the dark BG', () => {
    const results = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
    for (const p of results) {
      const r = contrastRatio(p.darkHex, '#000000');
      assert.ok(r !== null && r >= 7.0,
        `${p.darkHex} on #000000: ${r?.toFixed(3)} fails AAA`);
    }
  });

  it('default targetRatio remains 4.5 (back-compat)', () => {
    const aaDefault  = findVariantPairs('#777777', '#ffffff', '#000000');
    const aaExplicit = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
    assert.strictEqual(aaDefault.length, aaExplicit.length);
  });
});

// --- SEARCH-02: L-axis spread ---

describe('findVariantPairs — L-axis spread (SEARCH-02)', () => {
  it('#777777 AA: lightHex L-span across 5 results >= 0.12 in OKLab', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
    assert.ok(results.length >= 2, 'need >= 2 results to measure spread');
    const Ls = results.map(p => {
      const rgb = parseHex(p.lightHex);
      return srgbToOklab(rgb.r, rgb.g, rgb.b).L;
    });
    const span = Math.max(...Ls) - Math.min(...Ls);
    assert.ok(span >= 0.12,
      `expected L-span >= 0.12, got ${span.toFixed(3)} from Ls=${Ls.map(l => l.toFixed(3)).join(',')}`);
  });

  it('result[0] has the smallest distance (nearest preserved)', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[0].distance <= results[i].distance,
        `result[0].distance (${results[0].distance}) > result[${i}].distance (${results[i].distance})`);
    }
  });

  it('all results are distinct by lightHex+darkHex key', () => {
    const results = findVariantPairs('#777777', '#ffffff', '#000000', 5, 4.5);
    const keys = new Set(results.map(p => p.lightHex + '|' + p.darkHex));
    assert.strictEqual(keys.size, results.length, 'duplicate pair(s) found');
  });
});

// --- SEARCH-03: Asymmetric + both-pass ---

describe('findVariantPairs — asymmetric search (SEARCH-03)', () => {
  it('#000000 on #ffffff at AAA: all lightHex equal #000000 (light side locked)', () => {
    // Black on white = 21:1 — passes AAA on light. Dark side fails; must be searched.
    const results = findVariantPairs('#000000', '#ffffff', '#000000', 5, 7.0);
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 1, `expected >= 1 result, got ${results.length}`);
    for (const p of results) {
      assert.strictEqual(p.lightHex, '#000000',
        `lightHex should be locked to #000000, got ${p.lightHex}`);
    }
  });

  it('#000000 asymmetric case: all darkHex values pass AAA on #000000', () => {
    const results = findVariantPairs('#000000', '#ffffff', '#000000', 5, 7.0);
    const darkHexes = new Set(results.map(p => p.darkHex));
    assert.ok(darkHexes.size >= 1, 'expected at least 1 distinct darkHex');
    for (const hex of darkHexes) {
      const r = contrastRatio(hex, '#000000');
      assert.ok(r !== null && r >= 7.0,
        `${hex} on #000000: ${r?.toFixed(3)} fails AAA`);
    }
  });

  it('#ffffff on #000000 at AAA: all darkHex equal #FFFFFF (dark side locked)', () => {
    // White on black = 21:1 — passes AAA on dark. Light side fails; must be searched.
    const results = findVariantPairs('#ffffff', '#ffffff', '#000000', 5, 7.0);
    assert.ok(Array.isArray(results));
    assert.ok(results.length >= 1);
    for (const p of results) {
      assert.strictEqual(p.darkHex, '#FFFFFF',
        `darkHex should be locked to #FFFFFF, got ${p.darkHex}`);
    }
  });

  it('both-pass case returns { alreadyAccessible: true, pairs: [] } sentinel', () => {
    // #000000 vs #ffffff = 21:1 (passes AA), #000000 vs #888888 = 5.92:1 (passes AA).
    // Both pass at 4.5 → expect sentinel object, not bare array (D-12).
    const result = findVariantPairs('#000000', '#ffffff', '#888888', 5, 4.5);
    assert.strictEqual(Array.isArray(result), false,
      'sentinel must NOT be an array — guards consumers from treating it as one');
    assert.strictEqual(result.alreadyAccessible, true,
      'sentinel must have alreadyAccessible === true');
    assert.ok(Array.isArray(result.pairs), 'sentinel must expose a pairs array');
    assert.strictEqual(result.pairs.length, 0, 'pairs array must be empty for sentinel');
  });

  it('genuine no-solution returns plain empty Array (not sentinel)', () => {
    // Input hex equals BOTH backgrounds → contrast 1:1 on both sides, neither
    // already-accessible nor solvable inside the colour family. The both-pass
    // gate is false (lightPasses=false), so we fall through into the search;
    // because input == BG on both sides, both fail and the result is a plain
    // empty array — the genuine no-solution signal (distinct from sentinel).
    const result = findVariantPairs('#777777', '#777777', '#777777', 5, 7.0);
    assert.ok(Array.isArray(result),
      'no-solution case must return a plain Array, not the sentinel');
    assert.strictEqual(result.length, 0, 'no-solution Array must be empty');
    assert.strictEqual(result.alreadyAccessible, undefined,
      'plain Array must not carry the alreadyAccessible flag');
  });

  it('threshold toggle flips lock state', () => {
    // #2563EB vs #ffffff = 5.17:1 — passes AA (light locked at AA) but fails AAA.
    // #2563EB vs #000000 = 4.06:1 — fails AA and AAA (dark always searched).
    // At AA: light side locked; at AAA: light side searched.
    const aaResults  = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 4.5);
    const aaaResults = findVariantPairs('#2563EB', '#ffffff', '#000000', 5, 7.0);
    // At AA: lightHex should equal normalised input (locked).
    if (aaResults.length > 0) {
      for (const p of aaResults) {
        assert.strictEqual(p.lightHex, '#2563EB',
          `AA: lightHex should be locked to input, got ${p.lightHex}`);
      }
    }
    // At AAA: at least one lightHex should differ from input (searched).
    if (aaaResults.length > 0) {
      const anyDiffers = aaaResults.some(p => p.lightHex !== '#2563EB');
      assert.ok(anyDiffers, 'AAA: expected at least one searched lightHex different from input');
    }
  });
});
