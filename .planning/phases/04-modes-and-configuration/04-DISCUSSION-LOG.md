# Phase 4: Modes and Configuration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 04-modes-and-configuration
**Areas discussed:** Mode toggle + switch behaviour, Dual-mode result display, Custom BG input placement, URL state scheme

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Mode toggle + switch behaviour | Toggle UI, placement, switch side-effects | ✓ |
| Dual-mode result display | Paired swatches, two rows, labels | ✓ |
| Custom BG input placement | Inline vs row vs reveal, defaults | ✓ |
| URL state scheme | What + timing + format | ✓ |

**User's choice:** All four.

---

## Mode Toggle + Switch Behaviour

| Option | Description | Selected |
|--------|-------------|----------|
| Segmented control | Two-button pill, recommended | |
| Tabs above panels | Full-width tabs | |
| Radio buttons inline | Native radios | |
| Placement: left of Find | Compact action bar | |
| Placement: above input row | Dedicated mode row | |
| Placement: below panels | Closer to results | |
| Switch: clear swatches + re-click Find | Manual-trigger consistent | |
| Switch: auto re-run find | Faster | |
| Switch: keep stale swatches | Cheapest | |
| Single-mode UI: reuse 5-variant row | Minimal new UI | |
| Single-mode UI: single best match | One swatch | |
| Single-mode UI: Claude decides | — | |

**User's choice:** "scrap single mode always do dual mode so no toggle needed" — for every sub-question.
**Notes:** Major scope reduction. MODE-01 (single mode) and MODE-03 (toggle) dropped. MODE-02 (dual) is the sole mode. Downstream: update REQUIREMENTS.md at phase transition.

---

## Dual-Mode Result Display

| Option | Description | Selected |
|--------|-------------|----------|
| Paired swatches (joined side-by-side) | ~5 pairs, click pair = preview both panels | ✓ |
| Two rows (light / dark aligned) | Columns = pair | |
| Single swatch = average/blend | Click to reveal | |
| Both hexes shown per pair | User needs both | ✓ |
| One combined label | Hexes on click | |
| Claude decides label | — | |
| Pair click: preview both panels respectively | Light panel gets light shade, dark gets dark | ✓ |
| Pair click: preview one shade on both | Phase 3 style | |
| Keep Phase 3 single-swatch UI as secondary | More cluttered | |
| Replace Phase 3 UI fully | Simpler | ✓ |

**User's choice:** Paired swatches / both hexes shown / click previews both respectively / replace Phase 3 fully.
**Notes:** All recommended options taken.

---

## Custom Background Inputs

| Option | Description | Selected |
|--------|-------------|----------|
| Inline on each panel | Direct, no reveal | ✓ |
| Second input row | Centralised | |
| Reveal/collapse panel | Clean default, extra click | |
| Default dark BG: #000000 | Match requirement | ✓ |
| Default dark BG: keep #111111 | Current behaviour | |
| Invalid BG: red border + inline error | Match Phase 2 pattern | ✓ |
| Invalid BG: silent revert | Less feedback | |
| Live update panels, swatches go stale | Panels responsive, manual-trigger preserved | ✓ |
| Live update panels + auto re-find | Most responsive | |
| Everything waits for Find click | Most consistent | |

**User's choice:** All recommended options.
**Notes:** DARK_BG hardcoded to #111111 in both app.js and variant-search.js must change to #000000.

---

## URL State Scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Full state: hex + BGs | Share reproduces setup | ✓ |
| Just foreground hex | Literal CFG-03 reading | |
| Hex + BGs only if non-default | Shorter URLs on defaults | |
| Query string `?c=&lbg=&dbg=` | Standard URLSearchParams | |
| Hash fragment `#c=&lbg=` | Client-only | |
| Path style `/c/value` | Needs rewrites | |
| Debounced on valid change (~300ms) | replaceState, always shareable | ✓ |
| Immediate on keystroke | History churn | |
| Explicit Share button | Extra step | |
| Restore hex + BGs, no auto-Find | Manual-trigger consistent | ✓ |
| Restore + auto-Find | Immediate | |
| Restore hex only | Ignore BG params | |

**User's choice:** Full state / debounced / restore without auto-Find.
**User-specified format:** "path style and ordered so it's just /2563eb/ffffff/000000 user colour first then light dark".

### Follow-up: Path-Style Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Hash path `/#/2563eb/ffffff/000000` | Static-host safe, survives refresh | ✓ |
| True path + server rewrite | Cleaner but fragile on plain static | |
| Query string fallback | Works everywhere, less pretty | |

**User's choice:** Hash path.
**Notes:** Resolves static-hosting refresh issue while keeping user's preferred path ordering (foreground → light BG → dark BG).

---

## Claude's Discretion

- Exact dual-pair algorithm (D-04)
- Visual style joining the two swatches in a pair
- Hex label formatting within a pair
- Exact debounce timing for URL sync
- Distance warning wording adjusted for pair distance

## Deferred Ideas

- Single-colour mode — dropped, not parked. Remove MODE-01/MODE-03 from REQUIREMENTS.md.
- Share button / copy-link UI — not requested.
- RGB/HSL/colour-picker inputs — v2.
