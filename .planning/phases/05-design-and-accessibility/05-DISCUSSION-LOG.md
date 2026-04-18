# Phase 5: Design and Accessibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 05-design-and-accessibility
**Areas discussed:** Monochrome scope, Pass/fail non-colour cues, Focus + visual polish, A11Y audit method

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Monochrome scope | Lock rule on what `--user-colour` can tint. | ✓ |
| Pass/fail non-colour cues | Icons, badge style, SR announcements for A11Y-02. | ✓ |
| Focus + visual polish | Unified focus spec plus UI-02 polish scope. | ✓ |
| A11Y audit method | How to prove A11Y-01 passes. | ✓ |

---

## Monochrome scope

### Focus outlines — tint or monochrome?
| Option | Description | Selected |
|--------|-------------|----------|
| Monochrome only | All focus outlines black/white. | ✓ |
| User-colour allowed | Keep current --user-colour tint on Find/selection. | |
| Mixed — selection only | Selection rings tinted, other focus monochrome. | |

**User's choice:** Monochrome only.

### Selected swatch ring colour
| Option | Description | Selected |
|--------|-------------|----------|
| --user-colour (current) | Ring uses selected pair's colour. | |
| Solid black/white | Monochrome ring. | ✓ |
| Double border, no colour | Thicker border, no colour signal. | |

**User's choice:** Solid black/white.

### Sample text dashed focus outline
| Option | Description | Selected |
|--------|-------------|----------|
| Keep (blended --user-colour) | Dashed outline at 50% user colour. | ✓ |
| Solid monochrome | Match other focus rings. | |

**User's choice:** Keep blended. Rationale: the text *is* the user colour.

### Distance-warning glyph
| Option | Description | Selected |
|--------|-------------|----------|
| Keep ⚠ glyph | Text + icon already non-colour cue. | ✓ |
| Drop, text-only | Cleaner typography. | |

**User's choice:** Keep ⚠.

---

## Pass/fail non-colour cues

### Badge icon
| Option | Description | Selected |
|--------|-------------|----------|
| Text + icon (✓ Pass / ✗ Fail) | Redundant cue. | ✓ |
| Text only | Current wording already meets A11Y-02. | |
| Icon only | Compact but weaker for SR. | |

**User's choice:** Text + icon.

### Badge visual style
| Option | Description | Selected |
|--------|-------------|----------|
| Solid (Pass) vs outline (Fail) | Shape contrast beyond colour. | ✓ |
| Weight only — bold Pass, regular Fail | Typography-only distinction. | |
| Keep current styling | No change. | |

**User's choice:** Solid vs outline.

### Ratio number annotation
| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is | Pure number, adjacent badges carry status. | ✓ |
| Add prefix ✓/✗ | Glyph next to ratio. | |

**User's choice:** Keep as-is.

### Screen-reader announcements
| Option | Description | Selected |
|--------|-------------|----------|
| aria-live=polite on badge area | Announce Pass/Fail on change. | ✓ |
| Skip — labels only | Static aria-labels only. | |

**User's choice:** aria-live=polite on badge area.

---

## Focus + visual polish

### Focus outline spec
| Option | Description | Selected |
|--------|-------------|----------|
| 2px solid, 2px offset, chrome colour | Unified spec across elements. | ✓ |
| Keep current per-element variance | Small inconsistencies fine. | |
| Browser default :focus-visible only | Let UA decide. | |

**User's choice:** 2px solid, 2px offset, chrome colour.

### Layout polish scope
| Option | Description | Selected |
|--------|-------------|----------|
| Tidy pass | Audit typography, spacing, proportions. No restructure. | ✓ |
| Full redesign vs colourcontrast.cc | Rework layout. | |
| Skip — already fine | No polish. | |

**User's choice:** Tidy pass.

### Mobile/narrow viewport
| Option | Description | Selected |
|--------|-------------|----------|
| Stack below ~700px | Vertical stack on mobile. | ✓ |
| Keep side-by-side always | Horizontal scroll on mobile. | |
| Claude's discretion | Pick breakpoint during implementation. | |

**User's choice:** Stack below ~700px.

### Typography
| Option | Description | Selected |
|--------|-------------|----------|
| System stack | No external fetch, respects user prefs. | ✓ |
| One web font | Adds network request. | |

**User's choice:** System stack.

---

## A11Y audit method

### Audit tool
| Option | Description | Selected |
|--------|-------------|----------|
| axe-core DevTools + manual keyboard | Thorough automated + manual tab walkthrough. | ✓ |
| Lighthouse a11y audit | One-click but shallower. | |
| Manual only | Risk of missing issues. | |
| Combo: axe + Lighthouse + manual | Most thorough but slow. | |

**User's choice:** axe-core DevTools + manual keyboard.

### Screen reader smoke test
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, VoiceOver on macOS | Native spot check. | ✓ |
| Skip | Rely on aria-label review. | |

**User's choice:** VoiceOver smoke test.

### Capture audit results
| Option | Description | Selected |
|--------|-------------|----------|
| Phase VERIFICATION.md checklist | Standard GSD close-out. | ✓ |
| Separate ACCESSIBILITY.md | Standalone, ongoing doc. | |

**User's choice:** Phase VERIFICATION.md checklist.

### Fail policy
| Option | Description | Selected |
|--------|-------------|----------|
| Fix within phase if small | Small fixes inline, structural → deferred. | ✓ |
| Fix everything axe flags | Zero-issue bar. | |
| Log all, fix none here | Audit-only. | |

**User's choice:** Fix within phase if small.

---

## Claude's Discretion

- Exact CSS for solid-vs-outline pill badges.
- Numeric spacing / typography scale values.
- Icon glyph selection (`✓`/`✗` vs variants).
- Mobile breakpoint within 600–800px.
- Order of implementation.

## Deferred Ideas

- Print stylesheet.
- Animation/transition polish.
- Global dark-mode for chrome.
- Empty-state copy for pre-search swatch row.
- Web font upgrade.
