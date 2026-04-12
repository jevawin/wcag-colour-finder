// app.js
// UI wiring for WCAG Colour Finder.
// Imports colour maths from colour-engine.js — does not reimplement any formula.
//
// Conventions:
//   - American spelling in code identifiers (color, ratio)
//   - British spelling in UI text (colour)
//   - Store hex without # prefix; call contrastRatio('#' + hex, BG)
//   - Pass raw contrastRatio float to passesAA etc — never round before threshold check

import { parseHex, contrastRatio, passesAA, passesAAA, passesAALarge, passesAAALarge } from './colour-engine.js';
import { findVariants, DISTANCE_WARNING_THRESHOLD } from './variant-search.js';

// --- Pure functions (exported for testing) ---

/**
 * Build a badge state object from a raw contrast ratio.
 * All threshold checks delegated to colour-engine.js.
 *
 * @param {number} ratio - Raw contrast ratio float
 * @returns {{ aa: boolean, aaa: boolean, aaLarge: boolean, aaaLarge: boolean }}
 */
function buildBadgeState(ratio) {
  return {
    aa:       passesAA(ratio),
    aaa:      passesAAA(ratio),
    aaLarge:  passesAALarge(ratio),
    aaaLarge: passesAAALarge(ratio),
  };
}

/**
 * Expand a 3-digit hex string to 6-digit uppercase.
 * If already 6 digits, returns it uppercased unchanged.
 * No validation — parseHex already validated the input.
 *
 * @param {string} hex - 3 or 6 character hex string (no #)
 * @returns {string} 6-character uppercase hex
 */
function expandHex(hex) {
  if (hex.length === 3) {
    return hex.split('').map(c => c + c).join('').toUpperCase();
  }
  return hex.toUpperCase();
}

/**
 * Format a contrast ratio float for display.
 *
 * @param {number} ratio
 * @returns {string} e.g. "4.48:1"
 */
function formatRatio(ratio) {
  return ratio.toFixed(2) + ':1';
}

// Named exports for testing — pure functions with no DOM dependency
export { buildBadgeState, expandHex, formatRatio };

// --- DOM wiring (browser only) ---

if (typeof document !== 'undefined') {
  const LIGHT_BG = '#ffffff';
  const DARK_BG  = '#111111';
  const HEX_DEFAULT = '2563EB';

  // Cache element references — select once
  const hexInput  = document.querySelector('#hex-input');
  const errorMsg  = document.querySelector('#hex-error');
  const lightPanel = document.querySelector('.panel--light');
  const darkPanel  = document.querySelector('.panel--dark');
  const findBtn     = document.querySelector('#find-btn');
  const swatchRow   = document.querySelector('#swatch-row');
  const swatchList  = document.querySelector('.swatch-list');
  const distWarning = document.querySelector('#distance-warning');

  let lastValidHex = HEX_DEFAULT;

  /**
   * Apply the user's hex as the CSS custom property for colour propagation.
   * One update — cascade handles all sample-text elements.
   */
  function applyColor(hex) {
    document.documentElement.style.setProperty('--user-colour', '#' + hex);
  }

  /**
   * Set pass/fail text and class on a single badge element.
   *
   * @param {Element} root - Panel element to scope the query
   * @param {string} selector - CSS selector for the badge
   * @param {boolean} passes - Whether this threshold is met
   * @param {string} label - 'AA' or 'AAA'
   */
  function setBadge(root, selector, passes, label) {
    const el = root.querySelector(selector);
    if (!el) return;
    el.textContent = (passes ? 'Pass ' : 'Fail ') + label;
    el.classList.toggle('badge--pass', passes);
    el.classList.toggle('badge--fail', !passes);
  }

  /**
   * Update all badge elements and the ratio display for a single panel.
   *
   * @param {Element} panelEl - The panel section element
   * @param {number} ratio - Raw contrast ratio
   */
  function updatePanel(panelEl, ratio) {
    panelEl.querySelector('.ratio').textContent = formatRatio(ratio);

    const state = buildBadgeState(ratio);
    setBadge(panelEl, '.badge-aa',     state.aa,       'AA');
    setBadge(panelEl, '.badge-aaa',    state.aaa,      'AAA');
    setBadge(panelEl, '.badge-aa-lg',  state.aaLarge,  'AA');
    setBadge(panelEl, '.badge-aaa-lg', state.aaaLarge, 'AAA');
  }

  /**
   * Render all panels for a given hex colour.
   *
   * @param {string} hex - 6-digit uppercase hex without #
   */
  function render(hex) {
    applyColor(hex);
    const ratioLight = contrastRatio('#' + hex, LIGHT_BG);
    const ratioDark  = contrastRatio('#' + hex, DARK_BG);
    updatePanel(lightPanel, ratioLight);
    updatePanel(darkPanel, ratioDark);
  }

  /**
   * Toggle error state on the hex input and error message.
   *
   * @param {boolean} isError
   */
  function setErrorState(isError) {
    hexInput.setAttribute('aria-invalid', isError ? 'true' : 'false');
    hexInput.classList.toggle('input--error', isError);
    errorMsg.hidden = !isError;
  }

  /**
   * Remove the selected ring from whichever swatch is currently active.
   */
  function clearSelectedSwatch() {
    const prev = swatchList.querySelector('.swatch-btn--selected');
    if (prev) prev.classList.remove('swatch-btn--selected');
  }

  /**
   * Render the swatch row from an array of { hex, distance } objects.
   * Shows the distance warning if the closest variant exceeds the threshold.
   *
   * @param {Array<{ hex: string, distance: number }>} variants
   */
  function renderSwatches(variants) {
    swatchList.innerHTML = '';
    for (const v of variants) {
      const li = document.createElement('li');
      li.className = 'swatch-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn';
      btn.style.background = v.hex;
      btn.setAttribute('aria-label', 'Variant ' + v.hex + ' \u2014 click to preview');

      btn.addEventListener('click', () => {
        // D-08: update panels but NOT hex input
        const hexNoHash = v.hex.slice(1); // render() expects no # prefix
        render(hexNoHash);
        // D-09: highlight selected swatch
        clearSelectedSwatch();
        btn.classList.add('swatch-btn--selected');
      });

      const span = document.createElement('span');
      span.className = 'swatch-hex';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = v.hex;

      li.appendChild(btn);
      li.appendChild(span);
      swatchList.appendChild(li);
    }

    // D-05/D-06: distance warning when closest variant > 0.12
    const showWarning = variants.length > 0 && variants[0].distance > DISTANCE_WARNING_THRESHOLD;
    distWarning.hidden = !showWarning;

    swatchRow.hidden = false;
  }

  // Find button click handler — D-01: manual button press only
  findBtn.addEventListener('click', () => {
    findBtn.disabled = true;
    findBtn.textContent = 'Finding\u2026';

    const results = findVariants('#' + lastValidHex);

    findBtn.disabled = false;
    findBtn.textContent = 'Find accessible colour';

    if (results && results.length > 0) {
      renderSwatches(results);
    }
  });

  // Input event handler — fires on every keystroke
  hexInput.addEventListener('input', () => {
    clearSelectedSwatch();
    const raw = hexInput.value.trim();
    const parsed = parseHex(raw);

    if (parsed !== null) {
      lastValidHex = expandHex(raw.replace(/^#/, ''));
      setErrorState(false);
      render(lastValidHex);
    } else {
      setErrorState(true);
      // Do not call render — panels keep displaying lastValidHex
    }
  });

  // Initial render on page load
  document.addEventListener('DOMContentLoaded', () => {
    hexInput.value = HEX_DEFAULT;
    render(HEX_DEFAULT);
  });

  // Immediate render in case DOMContentLoaded already fired
  // (script is a module, which defers — but belt-and-braces)
  render(HEX_DEFAULT);
}
