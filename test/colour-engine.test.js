// test/colour-engine.test.js
// Node 20+ required — ES module import in node:test stable from Node 20.
// Run: node --test test/colour-engine.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHex,
  relativeLuminance,
  contrastRatio,
  passesAA,
  passesAAA,
  passesAALarge,
  passesAAALarge,
  srgbToOklab,
  oklabToSrgb,
  oklabDistance,
} from '../colour-engine.js';

// --- parseHex ---

describe('parseHex', () => {
  it('parses 6-digit hex with hash', () => {
    assert.deepEqual(parseHex('#ffffff'), { r: 255, g: 255, b: 255 });
  });

  it('parses 3-digit hex with hash', () => {
    assert.deepEqual(parseHex('#fff'), { r: 255, g: 255, b: 255 });
  });

  it('parses 6-digit hex without hash', () => {
    assert.deepEqual(parseHex('ffffff'), { r: 255, g: 255, b: 255 });
  });

  it('parses mixed-case hex', () => {
    assert.deepEqual(parseHex('#2563EB'), { r: 37, g: 99, b: 235 });
  });

  it('parses 3-digit black', () => {
    assert.deepEqual(parseHex('#000'), { r: 0, g: 0, b: 0 });
  });

  it('returns null for invalid chars (#xyz)', () => {
    assert.equal(parseHex('#xyz'), null);
  });

  it('returns null for 5-digit hex', () => {
    assert.equal(parseHex('12345'), null);
  });

  it('returns null for empty string', () => {
    assert.equal(parseHex(''), null);
  });

  it('returns null for non-string input (null)', () => {
    assert.equal(parseHex(null), null);
  });

  it('returns null for hex with invalid chars (#gggggg)', () => {
    assert.equal(parseHex('#gggggg'), null);
  });
});

// --- relativeLuminance ---

describe('relativeLuminance', () => {
  it('black -> 0', () => {
    assert.strictEqual(relativeLuminance(0, 0, 0), 0);
  });

  it('white -> 1', () => {
    assert.strictEqual(relativeLuminance(255, 255, 255), 1);
  });

  it('#777777 -> ~0.18447 (verifies 0.04045 threshold and 2.4 exponent)', () => {
    const l = relativeLuminance(0x77, 0x77, 0x77);
    assert.ok(
      Math.abs(l - 0.18447) < 0.0001,
      `Expected ~0.18447, got ${l}`
    );
  });
});

// --- contrastRatio ---

describe('contrastRatio', () => {
  it('black on white -> ~21', () => {
    const ratio = contrastRatio('#000000', '#ffffff');
    assert.ok(Math.abs(ratio - 21) < 0.01, `Expected ~21, got ${ratio}`);
  });

  it('white on white -> ~1', () => {
    const ratio = contrastRatio('#ffffff', '#ffffff');
    assert.ok(Math.abs(ratio - 1) < 0.01, `Expected ~1, got ${ratio}`);
  });

  it('#777777 on white -> ~4.478', () => {
    const ratio = contrastRatio('#777777', '#ffffff');
    assert.ok(Math.abs(ratio - 4.478) < 0.01, `Expected ~4.478, got ${ratio}`);
  });

  it('#777777 on white fails AA (critical smoke test — do not round ratio)', () => {
    const ratio = contrastRatio('#777777', '#ffffff');
    assert.equal(passesAA(ratio), false);
  });

  it('returns null for invalid hex input', () => {
    assert.equal(contrastRatio('#xyz', '#ffffff'), null);
  });
});

// --- threshold checks ---

describe('threshold checks', () => {
  it('passesAA(4.5) -> true', () => assert.equal(passesAA(4.5), true));
  it('passesAA(4.49) -> false', () => assert.equal(passesAA(4.49), false));

  it('passesAAA(7.0) -> true', () => assert.equal(passesAAA(7.0), true));
  it('passesAAA(6.99) -> false', () => assert.equal(passesAAA(6.99), false));

  it('passesAALarge(3.0) -> true', () => assert.equal(passesAALarge(3.0), true));
  it('passesAALarge(2.99) -> false', () => assert.equal(passesAALarge(2.99), false));

  it('passesAAALarge(4.5) -> true', () => assert.equal(passesAAALarge(4.5), true));
  it('passesAAALarge(4.49) -> false', () => assert.equal(passesAAALarge(4.49), false));
});

// --- srgbToOklab ---

describe('srgbToOklab', () => {
  it('black -> {L:0, a:0, b:0}', () => {
    const { L, a, b } = srgbToOklab(0, 0, 0);
    assert.strictEqual(L, 0);
    assert.strictEqual(a, 0);
    assert.strictEqual(b, 0);
  });

  it('white -> {L:~1, a:~0, b:~0}', () => {
    const { L, a, b } = srgbToOklab(255, 255, 255);
    assert.ok(Math.abs(L - 1) < 0.001, `L expected ~1, got ${L}`);
    assert.ok(Math.abs(a) < 0.001, `a expected ~0, got ${a}`);
    assert.ok(Math.abs(b) < 0.001, `b expected ~0, got ${b}`);
  });

  it('red has L > 0 and a > 0 in OKLab', () => {
    const { L, a } = srgbToOklab(255, 0, 0);
    assert.ok(L > 0, `L expected > 0, got ${L}`);
    assert.ok(a > 0, `a expected > 0 for red, got ${a}`);
  });
});

// --- oklabToSrgb ---

describe('oklabToSrgb', () => {
  it('OKLab black -> {r:0, g:0, b:0}', () => {
    assert.deepEqual(oklabToSrgb(0, 0, 0), { r: 0, g: 0, b: 0 });
  });

  it('OKLab white (L=1, a=0, b=0) -> approximately {r:255, g:255, b:255}', () => {
    const { r, g, b } = oklabToSrgb(1, 0, 0);
    assert.ok(Math.abs(r - 255) <= 1, `r expected ~255, got ${r}`);
    assert.ok(Math.abs(g - 255) <= 1, `g expected ~255, got ${g}`);
    assert.ok(Math.abs(b - 255) <= 1, `b expected ~255, got ${b}`);
  });

  it('round-trip: srgbToOklab then oklabToSrgb preserves rgb within tolerance 1', () => {
    const original = { r: 37, g: 99, b: 235 };
    const { L, a, b } = srgbToOklab(original.r, original.g, original.b);
    const result = oklabToSrgb(L, a, b);
    assert.ok(Math.abs(result.r - original.r) <= 1, `r: expected ~${original.r}, got ${result.r}`);
    assert.ok(Math.abs(result.g - original.g) <= 1, `g: expected ~${original.g}, got ${result.g}`);
    assert.ok(Math.abs(result.b - original.b) <= 1, `b: expected ~${original.b}, got ${result.b}`);
  });
});

// --- oklabDistance ---

describe('oklabDistance', () => {
  it('same colour -> 0', () => {
    assert.strictEqual(oklabDistance({ r: 128, g: 64, b: 32 }, { r: 128, g: 64, b: 32 }), 0);
  });

  it('black vs white -> > 0', () => {
    const d = oklabDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    assert.ok(d > 0, `Expected > 0, got ${d}`);
  });

  it('perceptual sanity: distance(red, orange) < distance(red, blue)', () => {
    const red    = { r: 255, g: 0,   b: 0 };
    const orange = { r: 255, g: 165, b: 0 };
    const blue   = { r: 0,   g: 0,   b: 255 };
    const dOrange = oklabDistance(red, orange);
    const dBlue   = oklabDistance(red, blue);
    assert.ok(dOrange < dBlue, `Expected d(red,orange)=${dOrange} < d(red,blue)=${dBlue}`);
  });
});
