# Phase 06: Gap Closure — VAR-05 + Orphan Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 06-gap-closure-var05-orphan-cleanup
**Areas discussed:** Empty-state copy + placement, Announce trigger + frequency, DISTANCE_WARNING_THRESHOLD fate, Nyquist backfill scope

---

## Empty-state Copy + Placement

### Copy text
| Option | Description | Selected |
|--------|-------------|----------|
| No accessible pair found for this colour | Audit verbatim. British. | ✓ |
| No accessible pair found — try different backgrounds | Mockup altHint style with action hint. | |
| No AA pair found. Try a different target or backgrounds. | Names threshold context + both levers. | |

**User's choice:** No accessible pair found for this colour
**Notes:** Matches audit recommendation.

### Placement
| Option | Description | Selected |
|--------|-------------|----------|
| Replace the 5 placeholder tiles entirely | Single message element instead of 5 em-dash tiles. | ✓ |
| Above the placeholder row | Keep tiles, add text line above `#alts`. | |
| Replace altHint copy only | Repurpose existing altHint line (mockup 941). | |

**User's choice:** Replace the 5 placeholder tiles entirely

### Markup
| Option | Description | Selected |
|--------|-------------|----------|
| `<p class="alts-empty">` + announce() | Visible paragraph; SR via existing `#sr-status` call. | ✓ |
| `<p role="status" aria-live="polite">` | Self-contained live region. Adds second region. | |
| Inline `role="alert"` | Assertive. Overkill. | |

**User's choice:** `<p class="alts-empty">` + announce()

---

## Announce Trigger + Frequency

### Trigger
| Option | Description | Selected |
|--------|-------------|----------|
| Only on transition to empty | Fire when length goes N≥1 → 0. | ✓ |
| Every autoFindAndApply where length===0 | Fire on every yield-zero call. | |
| Only on explicit Find button click | Ignore input-driven re-finds. | |

**User's choice:** Only on transition to empty

### SR text
| Option | Description | Selected |
|--------|-------------|----------|
| 'No accessible pair found for this colour' | Matches visible copy. | ✓ |
| '0 pairs found. Try different backgrounds.' | Extends 'N pairs found' grammar with action. | |
| 'No accessible pair found' | Shorter. | |

**User's choice:** 'No accessible pair found for this colour'

---

## DISTANCE_WARNING_THRESHOLD Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Remove export + delete test | Drop from `variant-search.js`, delete assertion test, drop test import. | ✓ |
| Re-wire into UI as subtle warning | New UI element when distance > 0.12. Scope expansion. | |
| Keep export, drop test only | Preserve public API; still unused. | |

**User's choice:** Remove export + delete test
**Notes:** Orphan cleanup per audit; threshold-warning UI explicitly deferred.

---

## Nyquist Backfill Scope

### Structure
| Option | Description | Selected |
|--------|-------------|----------|
| Separate plan per phase, same Phase 6 | 5 plans (one per phase). Atomic commits. | ✓ |
| Single plan, all 5 phases sequentially | One plan loops phases 1–5. | |
| Defer Nyquist to separate phase | Phase 7 Nyquist. Breaks SC4+SC5. | |

**User's choice:** Separate plan per phase, same Phase 6

### Order
| Option | Description | Selected |
|--------|-------------|----------|
| VAR-05 + orphan first, then Nyquist 1→5 | Ship code fixes first; validate against final code. | ✓ |
| Nyquist first, then VAR-05 + orphan | Validate pre-fix, amend after. Risks double-run. | |

**User's choice:** VAR-05 + orphan first, then Nyquist 1→5

---

## Claude's Discretion

- `.alts-empty` CSS (typography, spacing) within mockup rhythm and British copy.
- Previous-length tracking mechanism (state field vs closure var).
- Announce-deduplication interaction with `'N pairs found'` announce site.

## Deferred Ideas

- Threshold-based distance-warning UI — rejected; belongs in its own phase if ever revived.
