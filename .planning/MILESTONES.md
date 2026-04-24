# Milestones

## v1.0 MVP (Shipped: 2026-04-24)

**Phases completed:** 7 phases, 23 plans, 19 tasks
**Timeline:** 2026-04-12 → 2026-04-24 (12 days, 137 commits)
**Codebase:** ~3,200 LOC vanilla JS/HTML/CSS, zero runtime deps

**Delivered:** A working WCAG colour-finder web tool. Enter any hex, see live light/dark previews with WCAG AA/AAA pass/fail badges, find the closest accessible variant pairs via OKLab perceptual search, share results via URL.

**Key accomplishments:**

- **Phase 1 — Colour Engine:** Pure JS OKLab maths library — hex parsing, WCAG 2.1 luminance and contrast ratios, Ottosson OKLab forward/inverse, Euclidean perceptual distance. 35 node:test tests, zero deps.
- **Phase 2 — Live Preview UI:** Hex input → live light + dark specimen previews with AA/AAA contrast badges; pure-function extraction pattern enables headless testing.
- **Phase 3 — Variant Search:** OKLab L-axis binary search produces 5 closest accessible variants per panel; click-to-apply swatches reuse the main render path.
- **Phase 4 — Modes and Configuration:** Dual-colour pair search with `max(distLight, distDark)` metric; custom light/dark backgrounds; URL hash sharing (`#/<fg>/<lightBg>/<darkBg>`); MODE-01/MODE-03 formally DROPPED for dual-only scope.
- **Phase 5 — Design and Accessibility:** Mockup-aligned full-bleed topbar shell, split panels, OKLab-derived badge colour tokens, semantic alt-tile buttons, axe 0/0 critical/serious across 4 hex values, full keyboard nav, VoiceOver-verified.
- **Phase 5.1 — Editable Specimens:** Six contenteditable specimens with real-time cross-panel mirror; rich-text paste stripped to plain text at source.
- **Phase 6 — Gap Closure:** VAR-05 empty-state copy + SR announce restored; orphan `DISTANCE_WARNING_THRESHOLD` export removed; Nyquist validation backfilled across phases 1–5.

**Tests:** 87/87 passing.
**Audit:** `.planning/milestones/v1.0-MILESTONE-AUDIT.md` — passed, 25/25 active requirements (2 DROPPED).

---
