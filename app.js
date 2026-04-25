// app.js
// UI wiring for WCAG Colour Finder — drives the 05-04 mockup DOM.
// Imports colour maths from colour-engine.js — does not reimplement any formula.
//
// Conventions:
//   - American spelling in code identifiers (color, ratio) — CSS/DOM API reality.
//   - British spelling in UI text (colour).
//   - Store hex without # prefix in state; pass `'#' + hex` into contrastRatio.
//   - Pass raw contrastRatio float to passesAA etc — never round before threshold check.

import { parseHex, contrastRatio, passesAA, passesAAA, passesAALarge, passesAAALarge } from './colour-engine.js';
import { findVariantPairs } from './variant-search.js';
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

/**
 * Pick a monochrome foreground (#000000 or #ffffff) that meets AA against the
 * supplied user hex used as a background. Black wins when it passes AA (4.5:1)
 * against userHex; otherwise white.
 *
 * @param {string} userHex - '#rrggbb' or 'rrggbb'
 * @returns {string} '#000000' or '#ffffff'
 */
function chooseChromeForeground(userHex) {
  const hex = userHex.startsWith('#') ? userHex : '#' + userHex;
  return contrastRatio('#000000', hex) >= 4.5 ? '#000000' : '#ffffff';
}

/**
 * Build the HTML for a single pass/fail pill in the ratio-row pills grid.
 * A11Y-02: glyph is aria-hidden, word "Pass"/"Fail" is screen-reader-readable,
 * visible label (e.g. "AA Normal") is rendered alongside.
 *
 * @param {string} label - e.g. 'AA Normal', 'AAA Large'
 * @param {boolean} passes
 * @returns {string}
 */
function buildPillHTML(label, passes) {
  return '<div class="pill-wrap"><span class="pill ' + (passes ? 'pass' : 'fail') +
    '"><span class="glyph" aria-hidden="true">' + (passes ? '\u2713' : '\u2715') + '</span>' +
    (passes ? 'Pass' : 'Fail') + '</span><span class="pill-label">' + label + '</span></div>';
}

// Named exports for testing — pure functions with no DOM dependency
export { buildBadgeState, expandHex, formatRatio, chooseChromeForeground, buildPillHTML };

// --- DOM wiring (browser only) ---

if (typeof document !== 'undefined') {
  const URL_DEBOUNCE_MS = 300;
  const DEFAULT_BASE = '2563EB';
  const DEFAULT_LIGHT = 'FFFFFF';
  const DEFAULT_DARK = '000000';

  // Element cache
  const baseText      = document.getElementById('base-text');
  // Picker inputs use the HTML <input type="color"> element; identifiers use
  // "Picker" to keep British spelling compliance (UI-03) while still driving
  // the native picker.
  const basePicker    = document.getElementById('base-color');
  const baseSwatch    = document.getElementById('base-swatch');
  const findBtn       = document.getElementById('find-btn');
  const findLabel     = document.getElementById('find-btn-label');
  const altsEl        = document.getElementById('alts');
  const srStatus      = document.getElementById('sr-status');

  /** Announce a message to screen readers via the sr-status live region. */
  function announce(msg) {
    srStatus.textContent = '';
    // brief delay ensures live region re-fires even for repeated identical strings
    requestAnimationFrame(() => { srStatus.textContent = msg; });
  }
  const targetToggle  = document.getElementById('target-toggle');
  const topbar        = document.getElementById('topbar-wrap');
  const previewLight  = document.getElementById('preview-light');
  const previewDark   = document.getElementById('preview-dark');
  const lightFgHex    = document.getElementById('light-fg-hex');
  const darkFgHex     = document.getElementById('dark-fg-hex');
  const lightBgPicker = document.getElementById('light-bg-color');
  const lightBgText   = document.getElementById('light-bg-text');
  const darkBgPicker  = document.getElementById('dark-bg-color');
  const darkBgText    = document.getElementById('dark-bg-text');
  const lightRatioEl  = document.getElementById('light-ratio');
  const darkRatioEl   = document.getElementById('dark-ratio');
  const lightPillsEl  = document.getElementById('light-pills');
  const darkPillsEl   = document.getElementById('dark-pills');

  let prevAltsLen = 0;

  const state = {
    base: DEFAULT_BASE,
    light: DEFAULT_LIGHT,
    dark: DEFAULT_DARK,
    target: 'AA',       // 'AA' | 'AAA'
    alts: [],           // Array<{ lightHex, darkHex, distance }>
    appliedLight: null, // selected alt's lightHex (6-digit uppercase, no #)
    appliedDark: null,  // selected alt's darkHex
  };
  let urlSyncTimer = null;

  /**
   * Set --topbar-bg to the user's hex and derive --topbar-fg for WCAG AA chrome.
   */
  function applyTopbar(hex) {
    topbar.style.setProperty('--topbar-bg', '#' + hex);
    topbar.style.setProperty('--topbar-fg', chooseChromeForeground(hex));
  }

  /**
   * Render one preview panel: ratio + 4 pills + fg hex label + specimen colour.
   *
   * @param {HTMLElement} panelEl
   * @param {string} fgHex - 6-digit hex no #
   * @param {string} bgHex - 6-digit hex no #
   * @param {HTMLElement} ratioEl
   * @param {HTMLElement} pillsEl
   * @param {HTMLElement} fgHexLabelEl
   */
  function renderPanel(panelEl, fgHex, bgHex, ratioEl, pillsEl, fgHexLabelEl) {
    panelEl.style.background = '#' + bgHex;
    panelEl.style.setProperty('--specimen', '#' + fgHex);
    panelEl.style.setProperty('--bg-for-specimen', '#' + bgHex);
    const ratio = contrastRatio('#' + fgHex, '#' + bgHex) || 0;
    ratioEl.textContent = ratio.toFixed(2);
    fgHexLabelEl.textContent = '#' + fgHex;
    const bs = buildBadgeState(ratio);
    pillsEl.innerHTML =
      buildPillHTML('AA Normal',  bs.aa) +
      buildPillHTML('AA Large',   bs.aaLarge) +
      buildPillHTML('AAA Normal', bs.aaa) +
      buildPillHTML('AAA Large',  bs.aaaLarge);
  }

  function renderPreviews() {
    applyTopbar(state.base);
    baseSwatch.style.background = '#' + state.base;
    basePicker.value = '#' + state.base;
    if (document.activeElement !== baseText) baseText.value = state.base;

    const lightSpecHex = state.appliedLight || state.base;
    const darkSpecHex  = state.appliedDark  || state.base;

    renderPanel(previewLight, lightSpecHex, state.light, lightRatioEl, lightPillsEl, lightFgHex);
    renderPanel(previewDark,  darkSpecHex,  state.dark,  darkRatioEl,  darkPillsEl,  darkFgHex);
  }

  function renderAlts() {
    altsEl.innerHTML = '';
    if (state.alts.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'alts-empty';
      msg.textContent = 'No accessible pair found for this colour';
      altsEl.appendChild(msg);
      return;
    }
    state.alts.forEach(a => {
      const el = document.createElement('button');
      el.type = 'button';
      const isShade = a.lightHex !== a.darkHex;
      el.className = 'alt' + (isShade ? '' : ' single');
      el.style.setProperty('--alt-colour', '#' + a.lightHex);
      el.style.setProperty('--alt-light',  '#' + a.lightHex);
      el.style.setProperty('--alt-dark',   '#' + a.darkHex);
      el.title = isShade ? 'Light #' + a.lightHex + ' \u00b7 Dark #' + a.darkHex : '#' + a.lightHex;
      // A11Y-03: keyboard + screen-reader label. Button element gives Enter/Space
      // activation natively; aria-label describes the pair being applied.
      el.setAttribute('aria-label', isShade
        ? 'Apply pair: light #' + a.lightHex + ', dark #' + a.darkHex
        : 'Apply single #' + a.lightHex);
      el.innerHTML =
        '<div class="chips">' +
          '<span class="chip light"></span>' +
          (isShade ? '<span class="chip dark"></span>' : '') +
        '</div>' +
        '<div class="hex mono">' +
          (isShade ? (a.lightHex + ' / ' + a.darkHex) : ('#' + a.lightHex)) +
        '</div>';
      const isSelected = state.appliedLight === a.lightHex && state.appliedDark === a.darkHex;
      el.setAttribute('aria-pressed', String(isSelected));
      el.addEventListener('click', () => {
        state.appliedLight = a.lightHex;
        state.appliedDark  = a.darkHex;
        renderPreviews();
        renderAlts();
        announce(isShade
          ? 'Applied pair: light #' + a.lightHex + ', dark #' + a.darkHex
          : 'Applied #' + a.lightHex);
      });
      if (isSelected) {
        el.classList.add('is-selected');
      }
      altsEl.appendChild(el);
    });
  }

  /**
   * Run findVariantPairs with the active threshold and apply results to state.
   *
   * Phase 7: search is threshold-aware (D-01 / D-02). No post-filter.
   *
   * findVariantPairs returns one of three discriminated shapes (D-12):
   *   - null                                       → invalid base hex
   *   - { alreadyAccessible: true, pairs: [] }     → input passes on both BGs
   *   - Array<pair>                                → search result (possibly empty = no solution)
   *
   * The sentinel lets us announce "already accessible" only for the both-pass
   * branch, and "No accessible pair found" only for a genuine empty array —
   * no array-emptiness heuristic needed.
   */
  function autoFindAndApply() {
    const targetRatio = state.target === 'AAA' ? 7.0 : 4.5;
    const raw = findVariantPairs(
      '#' + state.base,
      '#' + state.light,
      '#' + state.dark,
      5,
      targetRatio,
    );

    if (raw === null) return; // invalid hex — should not normally reach here

    const alreadyAccessible = !Array.isArray(raw) && raw.alreadyAccessible === true;
    const pairs = Array.isArray(raw) ? raw : raw.pairs;

    state.alts = pairs.map(p => ({
      lightHex: p.lightHex.replace(/^#/, '').toUpperCase(),
      darkHex:  p.darkHex.replace(/^#/, '').toUpperCase(),
      distance: p.distance,
    }));

    if (state.alts.length > 0) {
      if (state.appliedLight === null || state.appliedDark === null) {
        state.appliedLight = state.alts[0].lightHex;
        state.appliedDark  = state.alts[0].darkHex;
      }
    } else {
      state.appliedLight = null;
      state.appliedDark  = null;
    }

    // Status announcements driven by the discriminated return shape, not by
    // array-emptiness. The prevAltsLen guard keeps idempotent re-renders
    // (same threshold, same input) from re-announcing on every keystroke.
    if (alreadyAccessible) {
      // Announce on first-load (sr-status empty) or whenever we transition
      // from a result list back into already-accessible territory.
      if (prevAltsLen !== 0 || srStatus.textContent === '') {
        announce('This colour is already accessible on both backgrounds');
      }
    } else if (state.alts.length === 0 && prevAltsLen > 0) {
      announce('No accessible pair found for this colour');
    }
    prevAltsLen = state.alts.length;

    renderAlts();
    renderPreviews();
  }

  function setBase(hex) {
    const parsed = parseHex(hex);
    if (!parsed) return;
    state.base = expandHex(hex.replace(/^#/, ''));
    baseText.value = state.base;
    basePicker.value = '#' + state.base;
    baseSwatch.style.background = '#' + state.base;
    state.appliedLight = null;
    state.appliedDark = null;
    autoFindAndApply();
    scheduleUrlSync();
  }

  function setLightBg(hex) {
    const parsed = parseHex(hex);
    if (!parsed) return;
    state.light = expandHex(hex.replace(/^#/, ''));
    lightBgText.value = state.light;
    lightBgPicker.value = '#' + state.light;
    // Parent .swatch-sm span holds the visible swatch background.
    if (lightBgPicker.parentElement) lightBgPicker.parentElement.style.background = '#' + state.light;
    autoFindAndApply();
    scheduleUrlSync();
  }

  function setDarkBg(hex) {
    const parsed = parseHex(hex);
    if (!parsed) return;
    state.dark = expandHex(hex.replace(/^#/, ''));
    darkBgText.value = state.dark;
    darkBgPicker.value = '#' + state.dark;
    if (darkBgPicker.parentElement) darkBgPicker.parentElement.style.background = '#' + state.dark;
    autoFindAndApply();
    scheduleUrlSync();
  }

  /**
   * Wire a hex text input: sanitise on input and call setter when we have
   * a valid 3- or 6-char hex.
   */
  function wireHexInput(inputEl, setter) {
    inputEl.addEventListener('input', (e) => {
      const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6);
      e.target.value = v;
      if (v.length === 6 && parseHex(v)) setter(v);
    });
  }
  wireHexInput(baseText,    setBase);
  wireHexInput(lightBgText, setLightBg);
  wireHexInput(darkBgText,  setDarkBg);

  basePicker.addEventListener('input',    (e) => setBase(e.target.value));
  lightBgPicker.addEventListener('input', (e) => setLightBg(e.target.value));
  darkBgPicker.addEventListener('input',  (e) => setDarkBg(e.target.value));

  // AA / AAA segmented toggle — reads the data-target attribute via .dataset.target
  targetToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.target-opt');
    if (!btn) return;
    state.target = btn.dataset.target;
    targetToggle.querySelectorAll('.target-opt').forEach(b => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    state.appliedLight = null;
    state.appliedDark  = null;
    autoFindAndApply();
    announce('Target ' + state.target + ' selected. ' + state.alts.length + ' pairs found.');
  });

  // Find button — re-roll with "Searching…" label
  findBtn.addEventListener('click', () => {
    findBtn.disabled = true;
    findLabel.textContent = 'Searching\u2026';
    setTimeout(() => {
      state.appliedLight = null;
      state.appliedDark  = null;
      autoFindAndApply();
      findBtn.disabled = false;
      findLabel.textContent = 'Find 5';
      if (state.alts.length > 0) announce(state.alts.length + ' pairs found.');
    }, 20);
  });

  // Copy buttons — delegated. Reads textContent of #[data-copy-target], strips leading #.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    e.preventDefault();
    const targetId = btn.dataset.copyTarget;
    if (!targetId) return;
    const src = document.getElementById(targetId);
    if (!src) return;
    const text = (src.textContent || '').trim().replace(/^#/, '');
    if (!text) return;
    const done = () => {
      btn.classList.add('copied');
      announce('Copied');
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => btn.classList.remove('copied'), 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  });

  // Mobile tabs — swap .is-visible between the two preview panels
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const which = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => {
        const active = b.dataset.tab === which;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      previewLight.classList.toggle('is-visible', which === 'light');
      previewDark.classList.toggle('is-visible',  which === 'dark');
    });
  });

  // --- Specimen cross-panel sync (UI-04) ---
  // Edits in one preview panel mirror to the twin element in the other panel.
  // textContent is used (not innerHTML) to strip any pasted markup on the twin.
  // A mirroring-guard flag prevents the programmatic textContent write from
  // re-entering its own input handler.
  function wireSpecimenSync() {
    const light = document.getElementById('preview-light');
    const dark  = document.getElementById('preview-dark');
    if (!light || !dark) return;

    const classes = ['.heading', '.para', '.digits'];
    let mirroring = false;

    // Paste handler: strip formatting by inserting plain text at caret.
    // Guarantees the input event fires and the source panel stays clean.
    const handlePaste = (el) => (e) => {
      e.preventDefault();
      const cd = e.clipboardData || window.clipboardData;
      const text = cd ? cd.getData('text/plain') : '';
      const selx = window.getSelection();
      if (selx && selx.rangeCount > 0) {
        const range = selx.getRangeAt(0);
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        selx.removeAllRanges();
        selx.addRange(range);
      } else {
        el.textContent = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    for (const sel of classes) {
      const a = light.querySelector(sel);
      const b = dark.querySelector(sel);
      if (!a || !b) continue;

      a.addEventListener('input', () => {
        if (mirroring) return;
        mirroring = true;
        b.textContent = a.textContent;
        mirroring = false;
      });
      b.addEventListener('input', () => {
        if (mirroring) return;
        mirroring = true;
        a.textContent = b.textContent;
        mirroring = false;
      });

      a.addEventListener('paste', handlePaste(a));
      b.addEventListener('paste', handlePaste(b));
    }
  }
  wireSpecimenSync();

  // URL hash hydrate + debounced sync
  function scheduleUrlSync() {
    if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
    urlSyncTimer = setTimeout(() => {
      const hash = buildHashPath({
        fg: state.base.toLowerCase(),
        lightBg: state.light.toLowerCase(),
        darkBg:  state.dark.toLowerCase(),
      });
      history.replaceState(null, '', hash);
      urlSyncTimer = null;
    }, URL_DEBOUNCE_MS);
  }

  function hydrateFromUrl() {
    const parsed = parseHashState(window.location.hash);
    if (parsed) {
      state.base  = parsed.fg.toUpperCase();
      state.light = parsed.lightBg.toUpperCase();
      state.dark  = parsed.darkBg.toUpperCase();
    }
    // Sync visible inputs to state
    baseText.value      = state.base;
    basePicker.value     = '#' + state.base;
    baseSwatch.style.background = '#' + state.base;
    lightBgText.value   = state.light;
    lightBgPicker.value  = '#' + state.light;
    if (lightBgPicker.parentElement) lightBgPicker.parentElement.style.background = '#' + state.light;
    darkBgText.value    = state.dark;
    darkBgPicker.value   = '#' + state.dark;
    if (darkBgPicker.parentElement) darkBgPicker.parentElement.style.background = '#' + state.dark;
  }

  // Initial boot
  hydrateFromUrl();
  autoFindAndApply();
}
