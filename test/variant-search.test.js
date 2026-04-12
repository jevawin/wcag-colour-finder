// test/variant-search.test.js
// Unit tests for findVariants — the OKLCH lightness binary search algorithm.
// Run: node --test test/variant-search.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio } from '../colour-engine.js';
import { findVariants, DISTANCE_WARNING_THRESHOLD } from '../variant-search.js';

// --- Basic contract ---

describe('findVariants — basic contract', () => {
  it('returns an array for a valid hex', () => {
    const results = findVariants('#2563EB');
    assert.ok(Array.isArray(results), 'should return an array');
  });

  it('returns at most 5 results', () => {
    const results = findVariants('#2563EB');
    assert.ok(results.length <= 5, `expected at most 5, got ${results.length}`);
  });

  it('returns at least 1 result', () => {
    const results = findVariants('#2563EB');
    assert.ok(results.length >= 1, 'should return at least 1 result');
  });

  it('each result has hex and distance properties', () => {
    const results = findVariants('#2563EB');
    for (const r of results) {
      assert.ok(typeof r.hex === 'string', 'hex should be a string');
      assert.ok(typeof r.distance === 'number', 'distance should be a number');
    }
  });

  it('each result.hex is a 7-char string starting with # and 6 uppercase hex digits', () => {
    const results = findVariants('#2563EB');
    const pattern = /^#[0-9A-F]{6}$/;
    for (const r of results) {
      assert.ok(pattern.test(r.hex), `hex "${r.hex}" does not match expected format`);
    }
  });

  it('results are sorted by ascending distance', () => {
    const results = findVariants('#2563EB');
    for (let i = 1; i < results.length; i++) {
      assert.ok(
        results[i].distance >= results[i - 1].distance,
        `result[${i}].distance (${results[i].distance}) < result[${i-1}].distance (${results[i-1].distance})`
      );
    }
  });

  it('returns null for null input', () => {
    assert.equal(findVariants(null), null);
  });

  it('returns null for invalid string input', () => {
    assert.equal(findVariants('xyz'), null);
  });

  it('returns null for empty string input', () => {
    assert.equal(findVariants(''), null);
  });
});

// --- AA compliance (VAR-02) ---

describe('findVariants — AA compliance', () => {
  it('every result passes AA on #ffffff or #111111 (or both)', () => {
    const results = findVariants('#2563EB');
    for (const r of results) {
      const onLight = contrastRatio(r.hex, '#ffffff');
      const onDark  = contrastRatio(r.hex, '#111111');
      assert.ok(
        onLight >= 4.5 || onDark >= 4.5,
        `${r.hex}: onLight=${onLight?.toFixed(3)}, onDark=${onDark?.toFixed(3)} — neither passes AA`
      );
    }
  });

  it('every result for #777777 passes AA on #ffffff or #111111', () => {
    const results = findVariants('#777777');
    assert.ok(results !== null && results.length >= 1, 'should return results for #777777');
    for (const r of results) {
      const onLight = contrastRatio(r.hex, '#ffffff');
      const onDark  = contrastRatio(r.hex, '#111111');
      assert.ok(
        onLight >= 4.5 || onDark >= 4.5,
        `${r.hex}: onLight=${onLight?.toFixed(3)}, onDark=${onDark?.toFixed(3)} — neither passes AA`
      );
    }
  });
});

// --- Perceptual closeness (VAR-04) ---

describe('findVariants — perceptual closeness', () => {
  it('#2563EB: first result distance < 0.15 (blue nearly passes)', () => {
    const results = findVariants('#2563EB');
    assert.ok(results[0].distance < 0.15, `expected < 0.15, got ${results[0].distance}`);
  });

  it('#777777: first result distance < 0.05 (very close to passing)', () => {
    const results = findVariants('#777777');
    assert.ok(results[0].distance < 0.05, `expected < 0.05, got ${results[0].distance}`);
  });

  it('no two results have the same hex value (deduplication)', () => {
    const results = findVariants('#2563EB');
    const hexes = results.map(r => r.hex);
    const unique = new Set(hexes);
    assert.equal(unique.size, hexes.length, `duplicate hex values found: ${hexes}`);
  });
});

// --- Distance warning (VAR-05) ---

describe('findVariants — distance warning', () => {
  it('result objects do NOT have a distantWarning property', () => {
    const results = findVariants('#2563EB');
    for (const r of results) {
      assert.ok(!('distantWarning' in r), `result should not have distantWarning property`);
    }
  });

  it('DISTANCE_WARNING_THRESHOLD is exported and equals 0.12', () => {
    assert.equal(DISTANCE_WARNING_THRESHOLD, 0.12);
  });

  it('#777777: first result distance < DISTANCE_WARNING_THRESHOLD', () => {
    const results = findVariants('#777777');
    assert.ok(
      results[0].distance < DISTANCE_WARNING_THRESHOLD,
      `expected distance < ${DISTANCE_WARNING_THRESHOLD}, got ${results[0].distance}`
    );
  });

  it('#808080: results exist (grey that fails AA — search should find variants)', () => {
    const results = findVariants('#808080');
    assert.ok(results !== null, 'should not return null');
    assert.ok(results.length >= 1, 'should return at least 1 result');
  });
});

// --- Edge cases ---

describe('findVariants — edge cases', () => {
  it('#000000: returns variants (search toward lighter)', () => {
    const results = findVariants('#000000');
    assert.ok(results !== null && results.length >= 1, 'should return variants for black');
  });

  it('#ffffff: returns variants (search toward darker)', () => {
    const results = findVariants('#ffffff');
    assert.ok(results !== null && results.length >= 1, 'should return variants for white');
  });

  it('works without # prefix', () => {
    const results = findVariants('2563EB');
    assert.ok(results !== null && results.length >= 1, 'should work without #');
  });

  it('works with 3-digit hex', () => {
    const results = findVariants('abc');
    // 'abc' expands to #aabbcc — a light grey/purple, should find variants
    assert.ok(results !== null && results.length >= 1, 'should work with 3-digit hex');
  });
});

// --- Gamut safety ---

describe('findVariants — gamut safety', () => {
  it('for vivid red #ff0000, all returned hex values are valid 6-digit hex', () => {
    const results = findVariants('#ff0000');
    assert.ok(results !== null, 'should return results for #ff0000');
    const pattern = /^#[0-9A-F]{6}$/;
    for (const r of results) {
      assert.ok(pattern.test(r.hex), `hex "${r.hex}" is not valid`);
      // Check no NaN-derived characters
      assert.ok(!/[^0-9A-F#]/.test(r.hex), `hex "${r.hex}" contains invalid characters`);
    }
  });
});
