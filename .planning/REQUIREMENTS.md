# Requirements — v1.1 Polish + Fixes

**Milestone goal:** Fix v1.0 rough edges uncovered in use — search defects, variant spread, auto-find UX, asymmetric search, responsive bugs.

## v1.1 Requirements

### Search (SEARCH)

- [x] **SEARCH-01**: AAA mode returns variant pairs whenever the colour space permits (fix defect where AAA currently never returns results)
- [ ] **SEARCH-02**: The 5 returned variant pairs span a wider L-axis range — nearest preserved, furthest extended — so results offer more visual variety
- [ ] **SEARCH-03**: When the entered colour already passes the active threshold on one background, that background keeps the entered colour; only the failing background gets an alternative searched

### Input and Interaction (INPUT)

- [ ] **INPUT-01**: Search runs automatically on valid 6-char hex entry; the "Find 5" button is removed
- [ ] **INPUT-02**: Toggling AA / AAA re-runs search automatically against the new threshold
- [ ] **INPUT-03**: Hex input accepts 3-char shorthand without auto-expanding mid-typing (promote quick task 260424-tzn)

### Responsive UI (RESP)

- [ ] **RESP-01**: Badge labels (AA Normal / AA Large / AAA Normal / AAA Large) remain fully visible at all supported viewport widths — no off-screen clipping
- [ ] **RESP-02**: Hex input container scales with viewport at narrow widths — no min-width overflow pushing content off-screen

## Future Requirements

_None captured — carry forward from v1.2 scoping if needed._

## Out of Scope

- Search algorithm rewrite beyond AAA fix — OKLab L-axis binary search remains; only defects and spread are in scope
- Variant count change — stays at 5 per search (validated in v1.0)
- New modes / mode toggle — dual-only stays (D-01 from v1.0)
- Colour blindness simulation — different tool
- Palette generation — not scope creep for v1.1
- Framework or build step — vanilla constraint holds

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEARCH-01   | Phase 7 | Complete |
| SEARCH-02   | Phase 7 | Pending |
| SEARCH-03   | Phase 7 | Pending |
| INPUT-01    | Phase 8 | Pending |
| INPUT-02    | Phase 8 | Pending |
| INPUT-03    | Phase 8 | Pending |
| RESP-01     | Phase 9 | Pending |
| RESP-02     | Phase 9 | Pending |

**Coverage:** 8/8 v1.1 requirements mapped ✓
