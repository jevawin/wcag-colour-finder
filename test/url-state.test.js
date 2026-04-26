// test/url-state.test.js
// Unit tests for parseHashState and buildHashPath pure functions.
// Run: node --test test/url-state.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseHashState, buildHashPath } from '../public/url-state.js';

// --- parseHashState: valid inputs ---

describe('parseHashState — valid inputs', () => {
  it('parses canonical hash with three lowercase segments', () => {
    assert.deepStrictEqual(
      parseHashState('#/2563eb/ffffff/000000'),
      { fg: '2563eb', lightBg: 'ffffff', darkBg: '000000' }
    );
  });

  it('normalises uppercase hex to lowercase', () => {
    assert.deepStrictEqual(
      parseHashState('#/2563EB/FFFFFF/000000'),
      { fg: '2563eb', lightBg: 'ffffff', darkBg: '000000' }
    );
  });

  it('tolerates a trailing slash', () => {
    assert.deepStrictEqual(
      parseHashState('#/2563eb/ffffff/000000/'),
      { fg: '2563eb', lightBg: 'ffffff', darkBg: '000000' }
    );
  });
});

// --- parseHashState: invalid inputs ---

describe('parseHashState — invalid inputs', () => {
  it('returns null for empty string', () => {
    assert.strictEqual(parseHashState(''), null);
  });

  it('returns null for bare hash', () => {
    assert.strictEqual(parseHashState('#/'), null);
  });

  it('returns null when only 2 segments present', () => {
    assert.strictEqual(parseHashState('#/2563eb/ffffff'), null);
  });

  it('returns null when 4 segments present', () => {
    assert.strictEqual(parseHashState('#/2563eb/ffffff/000000/extra'), null);
  });

  it('returns null for invalid hex characters', () => {
    assert.strictEqual(parseHashState('#/xyz123/ffffff/000000'), null);
  });

  it('returns null for 3-digit hex (D-16 requires 6-digit only)', () => {
    assert.strictEqual(parseHashState('#/2563/ffffff/000000'), null);
  });

  it('returns null for null input', () => {
    assert.strictEqual(parseHashState(null), null);
  });

  it('returns null for undefined input', () => {
    assert.strictEqual(parseHashState(undefined), null);
  });
});

// --- buildHashPath ---

describe('buildHashPath', () => {
  it('builds hash path from lowercase segments', () => {
    assert.strictEqual(
      buildHashPath({ fg: '2563eb', lightBg: 'ffffff', darkBg: '000000' }),
      '#/2563eb/ffffff/000000'
    );
  });

  it('lowercases uppercase input', () => {
    assert.strictEqual(
      buildHashPath({ fg: '2563EB', lightBg: 'FFFFFF', darkBg: '000000' }),
      '#/2563eb/ffffff/000000'
    );
  });
});

// --- round-trip ---

describe('parseHashState + buildHashPath — round-trip', () => {
  it('parseHashState(buildHashPath(state)) deep-equals state', () => {
    const state = { fg: 'abc123', lightBg: 'def456', darkBg: '789abc' };
    assert.deepStrictEqual(parseHashState(buildHashPath(state)), state);
  });
});
