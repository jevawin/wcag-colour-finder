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
import { findVariantPairs, DISTANCE_WARNING_THRESHOLD } from './variant-search.js';
import { parseHashState, buildHashPath } from './url-state.js';

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
  const HEX_DEFAULT      = '2563EB';
  const LIGHT_BG_DEFAULT = '#ffffff';
  const DARK_BG_DEFAULT  = '#000000';
  const URL_DEBOUNCE_MS  = 300;

  // Cache element references — select once
  const hexInput     = document.querySelector('#hex-input');
  const errorMsg     = document.querySelector('#hex-error');
  const lightPanel   = document.querySelector('.panel--light');
  const darkPanel    = document.querySelector('.panel--dark');
  const findBtn      = document.querySelector('#find-btn');
  const swatchRow    = document.querySelector('#swatch-row');
  const swatchList   = document.querySelector('.swatch-list');
  const distWarning  = document.querySelector('#distance-warning');
  const lightBgInput = document.querySelector('#light-bg-input');
  const lightBgError = document.querySelector('#light-bg-error');
  const darkBgInput  = document.querySelector('#dark-bg-input');
  const darkBgError  = document.querySelector('#dark-bg-error');

  let lastValidHex     = HEX_DEFAULT;
  let lastValidLightBg = LIGHT_BG_DEFAULT;
  let lastValidDarkBg  = DARK_BG_DEFAULT;
  let urlSyncTimer     = null;

  /**
   * Apply the user's hex as the CSS custom property for colour propagation.
   * One update — cascade handles all sample-text elements.
   */
  function applyColor(hex) {
    document.documentElement.style.setProperty('--user-colour', '#' + hex);
  }

  function applyLightBg(hex) {
    document.documentElement.style.setProperty('--light-bg', hex);
  }

  function applyDarkBg(hex) {
    document.documentElement.style.setProperty('--dark-bg', hex);
  }

  /**
   * Set pass/fail text and class on a single badge element.
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
   * Render both panels for a given hex colour against the current BGs.
   *
   * @param {string} hex - 6-digit uppercase hex without #
   */
  function render(hex) {
    applyColor(hex);
    const ratioLight = contrastRatio('#' + hex, lastValidLightBg);
    const ratioDark  = contrastRatio('#' + hex, lastValidDarkBg);
    updatePanel(lightPanel, ratioLight);
    updatePanel(darkPanel, ratioDark);
  }

  function renderLightPanel(hex) {
    const r = contrastRatio('#' + hex, lastValidLightBg);
    updatePanel(lightPanel, r);
  }

  function renderDarkPanel(hex) {
    const r = contrastRatio('#' + hex, lastValidDarkBg);
    updatePanel(darkPanel, r);
  }

  /**
   * Toggle error state on the main hex input and error message.
   */
  function setErrorState(isError) {
    hexInput.setAttribute('aria-invalid', isError ? 'true' : 'false');
    hexInput.classList.toggle('input--error', isError);
    errorMsg.hidden = !isError;
  }

  function setBgErrorState(input, errorEl, isError) {
    input.setAttribute('aria-invalid', isError ? 'true' : 'false');
    input.classList.toggle('input--error', isError);
    errorEl.hidden = !isError;
  }

  /**
   * Remove the selected ring from whichever swatch is currently active.
   */
  function clearSelectedSwatch() {
    const prev1 = swatchList.querySelector('.swatch-btn--selected');
    if (prev1) prev1.classList.remove('swatch-btn--selected');
    const prev2 = swatchList.querySelector('.swatch-pair--selected');
    if (prev2) prev2.classList.remove('swatch-pair--selected');
  }

  function clearPairs() {
    swatchList.innerHTML = '';
    distWarning.hidden = true;
    swatchRow.hidden = true;
  }

  /**
   * Render the pair swatch row from an array of { lightHex, darkHex, distance }.
   */
  function renderPairs(pairs) {
    swatchList.innerHTML = '';
    for (const p of pairs) {
      const li = document.createElement('li');
      li.className = 'swatch-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-pair';
      btn.setAttribute('aria-label',
        'Variant pair ' + p.lightHex + ' on light, ' + p.darkHex + ' on dark \u2014 click to preview');

      const lightHalf = document.createElement('span');
      lightHalf.className = 'swatch-pair__half swatch-pair__half--light';
      lightHalf.style.background = p.lightHex;
      lightHalf.setAttribute('aria-hidden', 'true');

      const darkHalf = document.createElement('span');
      darkHalf.className = 'swatch-pair__half swatch-pair__half--dark';
      darkHalf.style.background = p.darkHex;
      darkHalf.setAttribute('aria-hidden', 'true');

      btn.appendChild(lightHalf);
      btn.appendChild(darkHalf);

      btn.addEventListener('click', () => {
        // D-07: each panel uses its own shade; D-08: do NOT update hex input
        const lightNoHash = p.lightHex.slice(1);
        const darkNoHash  = p.darkHex.slice(1);
        // visual: --user-colour follows the light shade for the light panel
        applyColor(lightNoHash);
        renderLightPanel(lightNoHash);
        // For dark panel, set sample colour locally via direct style on dark panel
        // sample text — overrides the --user-colour cascade until user types a new hex.
        darkPanel.querySelectorAll('.sample-text').forEach(el => el.style.color = p.darkHex);
        renderDarkPanel(darkNoHash);
        clearSelectedSwatch();
        btn.classList.add('swatch-pair--selected');
      });

      const label = document.createElement('span');
      label.className = 'swatch-pair-hex';
      label.textContent = p.lightHex + ' / ' + p.darkHex;

      li.appendChild(btn);
      li.appendChild(label);
      swatchList.appendChild(li);
    }

    const showWarning = pairs.length > 0 && pairs[0].distance > DISTANCE_WARNING_THRESHOLD;
    distWarning.hidden = !showWarning;
    swatchRow.hidden = false;
  }

  /**
   * Debounced write of current state to window.location.hash.
   */
  function scheduleUrlSync() {
    if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
    urlSyncTimer = setTimeout(() => {
      const hash = buildHashPath({
        fg: lastValidHex.toLowerCase(),
        lightBg: lastValidLightBg.replace(/^#/, '').toLowerCase(),
        darkBg:  lastValidDarkBg.replace(/^#/, '').toLowerCase(),
      });
      history.replaceState(null, '', hash);
      urlSyncTimer = null;
    }, URL_DEBOUNCE_MS);
  }

  // --- BG input handlers ---

  lightBgInput.addEventListener('input', () => {
    const raw = lightBgInput.value.trim();
    const parsed = parseHex(raw);
    if (parsed !== null) {
      lastValidLightBg = '#' + expandHex(raw.replace(/^#/, '')).toLowerCase();
      setBgErrorState(lightBgInput, lightBgError, false);
      applyLightBg(lastValidLightBg);
      render(lastValidHex);
      clearPairs();          // D-12
      scheduleUrlSync();
    } else {
      setBgErrorState(lightBgInput, lightBgError, true);
    }
  });

  darkBgInput.addEventListener('input', () => {
    const raw = darkBgInput.value.trim();
    const parsed = parseHex(raw);
    if (parsed !== null) {
      lastValidDarkBg = '#' + expandHex(raw.replace(/^#/, '')).toLowerCase();
      setBgErrorState(darkBgInput, darkBgError, false);
      applyDarkBg(lastValidDarkBg);
      render(lastValidHex);
      clearPairs();          // D-12
      scheduleUrlSync();
    } else {
      setBgErrorState(darkBgInput, darkBgError, true);
    }
  });

  // --- Main hex input handler ---
  hexInput.addEventListener('input', () => {
    clearSelectedSwatch();
    // Clear inline dark-panel preview colour so the cascade reasserts.
    darkPanel.querySelectorAll('.sample-text').forEach(el => el.style.color = '');
    const raw = hexInput.value.trim();
    const parsed = parseHex(raw);

    if (parsed !== null) {
      lastValidHex = expandHex(raw.replace(/^#/, ''));
      setErrorState(false);
      render(lastValidHex);
      scheduleUrlSync();
    } else {
      setErrorState(true);
      // Do not call render — panels keep displaying lastValidHex
    }
  });

  // --- Find button handler — D-01: manual trigger ---
  findBtn.addEventListener('click', () => {
    findBtn.disabled = true;
    findBtn.textContent = 'Finding\u2026';

    const results = findVariantPairs('#' + lastValidHex, lastValidLightBg, lastValidDarkBg);

    findBtn.disabled = false;
    findBtn.textContent = 'Find accessible colour';

    if (results && results.length > 0) {
      renderPairs(results);
    } else {
      // Empty state per UI-SPEC Copywriting
      swatchList.innerHTML = '';
      distWarning.hidden = false;
      distWarning.textContent = 'No accessible pair found for this colour.';
      swatchRow.hidden = false;
    }
  });

  // --- Page load hydration ---
  function hydrateFromUrl() {
    const parsed = parseHashState(window.location.hash);
    const state = parsed ?? {
      fg: HEX_DEFAULT.toLowerCase(),
      lightBg: 'ffffff',
      darkBg: '000000',
    };
    lastValidHex     = state.fg.toUpperCase();
    lastValidLightBg = '#' + state.lightBg;
    lastValidDarkBg  = '#' + state.darkBg;
    hexInput.value      = lastValidHex;
    lightBgInput.value  = state.lightBg;
    darkBgInput.value   = state.darkBg;
    applyLightBg(lastValidLightBg);
    applyDarkBg(lastValidDarkBg);
    render(lastValidHex);
  }
  document.addEventListener('DOMContentLoaded', hydrateFromUrl);
  // belt-and-braces immediate call (script is a module, defer applies)
  hydrateFromUrl();
}
