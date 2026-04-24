// test/variant-search.test.js
// Unit tests for findVariantPairs — dual-pair OKLCH lightness binary search.
// Run: node --test test/variant-search.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from '../colour-engine.js';
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

