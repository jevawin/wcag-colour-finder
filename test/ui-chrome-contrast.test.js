// test/ui-chrome-contrast.test.js
// Tests for chooseChromeForeground (UI-01 monochrome topbar chrome; A11Y-01
// top-zone contrast). deriveBadgeColors was retired in 05-06 (mockup pills
// use --specimen / --bg-for-specimen tokens directly, no tinted pass-bg).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chooseChromeForeground } from '../app.js';

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
