# Phase 1: Colour Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 01-colour-engine
**Areas discussed:** Module structure, Testing approach, API surface design, Error handling

---

## Module Structure

### Q1: How should the engine code be organised?

| Option | Description | Selected |
|--------|-------------|----------|
| Single file | One colour-engine.js with all functions — simplest, no import coordination | |
| Split by concern | Separate files: hex.js, luminance.js, contrast.js, oklab.js — cleaner separation | |
| You decide | Claude picks based on what works best for a no-build-step vanilla JS project | ✓ |

**User's choice:** You decide
**Notes:** Deferred to Claude's discretion

### Q2: Should engine files use ES modules or plain script tags?

| Option | Description | Selected |
|--------|-------------|----------|
| ES modules | Use import/export with type="module" on script tags — modern, clean | ✓ |
| Plain scripts + global | IIFE or namespace pattern (window.ColourEngine) — simpler but messier | |
| You decide | Claude picks the approach that fits the project constraints | |

**User's choice:** ES modules
**Notes:** None

---

## Testing Approach

### Q1: What test runner for a vanilla JS project with no build step?

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight HTML runner | Custom test.html that runs assertions in the browser — zero dependencies | |
| Node test runner | Use Node's built-in node:test module — run from CLI, no npm install needed | |
| You decide | Claude picks what fits the no-dependency constraint best | ✓ |

**User's choice:** You decide
**Notes:** Deferred to Claude's discretion

### Q2: Should tests verify against known reference values?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, spec values | Test against WCAG spec's own examples and known contrast ratios | ✓ |
| Basic sanity checks | Test that functions return expected types and handle edge cases | |
| Both | Spec reference values for core calculations + sanity checks for edge cases | |

**User's choice:** Yes, spec values
**Notes:** None

---

## API Surface Design

### Q1: Naming convention for engine functions?

| Option | Description | Selected |
|--------|-------------|----------|
| Verb-first camelCase | parseHex(), getRelativeLuminance(), calcContrastRatio() | |
| Short noun-style | luminance(), contrast(), toOklab() — terser | |
| You decide | Claude picks a consistent convention | ✓ |

**User's choice:** You decide
**Notes:** Deferred to Claude's discretion

### Q2: British spelling in code identifiers?

| Option | Description | Selected |
|--------|-------------|----------|
| British everywhere | colour in code AND UI — consistent but unconventional in code | |
| American in code, British in UI | color in variable/function names, colour in user-facing strings only | ✓ |
| You decide | Claude picks based on project context | |

**User's choice:** American in code, British in UI
**Notes:** None

### Q3: What colour representation should functions pass around internally?

| Option | Description | Selected |
|--------|-------------|----------|
| RGB arrays [r, g, b] | Simple arrays with 0-255 values — lightweight | |
| Objects {r, g, b} | Named properties — more readable, self-documenting | |
| Linear RGB arrays [0-1] | Pre-linearised floats — closer to how the maths works | |
| You decide | Claude picks what makes the maths cleanest | ✓ |

**User's choice:** You decide
**Notes:** Deferred to Claude's discretion

---

## Error Handling

### Q1: How should the engine handle bad input?

| Option | Description | Selected |
|--------|-------------|----------|
| Return null | parseHex('#xyz') returns null — caller decides what to do | ✓ |
| Throw errors | Throw on invalid input — fail loud, force callers to handle | |
| You decide | Claude picks based on how the UI layer will consume the engine | |

**User's choice:** Return null
**Notes:** None

---

## Claude's Discretion

- File organisation (single vs split)
- Test runner choice
- Function naming convention
- Internal colour representation format

## Deferred Ideas

None — discussion stayed within phase scope
