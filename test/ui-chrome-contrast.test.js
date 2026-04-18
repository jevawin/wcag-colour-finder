// test/ui-chrome-contrast.test.js
// Tests for chooseChromeForeground and deriveBadgeColors pure helpers.
// Addresses UI-01 (monochrome chrome), A11Y-01 (top-zone contrast),
// A11Y-02 badge colour derivation safety.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chooseChromeForeground, deriveBadgeColors } from '../app.js';
import { contrastRatio } from '../colour-engine.js';

describe('chooseChromeForeground', () => {
  it('returns #000000 on pure white background', () => {
    assert.equal(chooseChromeForeground('#ffffff'), '#000000');
  });

  it('returns #ffffff on pure black background', () => {
    assert.equal(chooseChromeForeground('#000000'), '#ffffff');
  });

  it('returns #ffffff on near-black #111111 (black fails AA)', () => {
    assert.equal(chooseChromeForeground('#111111'), '#ffffff');
  });

  it('returns #ffffff on default app colour #2563eb (black on blue fails AA)', () => {
    assert.equal(chooseChromeForeground('#2563eb'), '#ffffff');
  });

  it('returns #000000 on yellow #ffff00 (black wins)', () => {
    assert.equal(chooseChromeForeground('#ffff00'), '#000000');
  });

  it('accepts input without leading #', () => {
    assert.equal(chooseChromeForeground('ffffff'), '#000000');
    assert.equal(chooseChromeForeground('000000'), '#ffffff');
  });
});

describe('deriveBadgeColors', () => {
  it('returns a pair whose contrast >= 4.5 for user colour #2563eb', () => {
    const { passBg, passText } = deriveBadgeColors('#2563eb');
    assert.ok(typeof passBg === 'string' && /^#[0-9a-f]{6}$/i.test(passBg), 'passBg hex');
    assert.ok(typeof passText === 'string' && /^#[0-9a-f]{6}$/i.test(passText), 'passText hex');
    assert.ok(contrastRatio(passText, passBg) >= 4.5,
      `contrast >= 4.5 required; got ${contrastRatio(passText, passBg)}`);
  });

  it('returns a pair >= 4.5 for #ffffff (fallback path allowed)', () => {
    const { passBg, passText } = deriveBadgeColors('#ffffff');
    assert.ok(contrastRatio(passText, passBg) >= 4.5);
  });

  it('returns a pair >= 4.5 for #000000 (fallback path allowed)', () => {
    const { passBg, passText } = deriveBadgeColors('#000000');
    assert.ok(contrastRatio(passText, passBg) >= 4.5);
  });

  it('returns fallback green pair on invalid input', () => {
    const result = deriveBadgeColors('not-a-hex');
    assert.ok(contrastRatio(result.passText, result.passBg) >= 4.5);
  });
});
