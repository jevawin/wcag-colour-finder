// test/app.test.js
// Pure logic tests for app.js helper functions.
// No DOM required — tests target exported functions only.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadgeState, expandHex, formatRatio, buildBadgeHTML } from '../app.js';

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

describe('buildBadgeHTML (smoke)', () => {
  it('renders "Pass AAA Large" label variant', () => {
    const html = buildBadgeHTML(true, 'AAA Large');
    assert.ok(html.includes('Pass AAA Large'));
    assert.ok(html.includes('aria-hidden="true"'));
  });

  it('renders stable markup across runs for (true, "AA") — contract guard for setBadge', () => {
    // setBadge now writes this string via innerHTML; pin the exact shape.
    const expected = '<span aria-hidden="true">\u2713</span><span>Pass AA</span>';
    assert.equal(buildBadgeHTML(true, 'AA'), expected);
    // Idempotent — repeated calls return identical output
    assert.equal(buildBadgeHTML(true, 'AA'), buildBadgeHTML(true, 'AA'));
  });
});
