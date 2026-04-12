# Domain Pitfalls

**Domain:** WCAG colour contrast tool (vanilla JS)
**Researched:** 2026-04-12

---

## Critical Pitfalls

Mistakes that produce wrong results or require a rewrite.

---

### Pitfall 1: Wrong sRGB linearisation

**What goes wrong:**
The WCAG relative luminance formula requires converting sRGB channel values to linear light before applying the luminance weighting. This involves two branches — a simple division for dark values, and a power function for bright ones. Getting any part of this wrong produces contrast ratios that look plausible but are quietly incorrect.

**Why it happens:**
The formula has four distinct places to get wrong:
1. Forgetting to normalise 8-bit values (0–255) to the 0–1 range before anything else
2. Using the wrong threshold: the current W3C spec says 0.04045, not 0.03928 (an old typo, corrected May 2021 — the practical difference is near zero but using 0.03928 signals stale code)
3. Using the wrong exponent: must be 2.4, not 2.2 or 2.0
4. Applying the power function to the already-normalised value but forgetting to add the offset: the formula is `((val + 0.055) / 1.055) ^ 2.4`

**Consequences:**
Contrast ratios that differ from authoritative tools (WebAIM, colourcontrast.cc). Colours reported as passing AA that don't, or vice versa. Completely breaks the colour-finding algorithm.

**Prevention:**
Implement the formula once in a single function, unit-test it against known values from the W3C spec page and WebAIM. At minimum, verify:
- `#000000` → luminance 0
- `#ffffff` → luminance 1
- `#777777` → luminance ≈ 0.2158 (contrast with white ≈ 4.48:1)

**Detection:**
Your results disagree with WebAIM's contrast checker on the same input pair. The #777777 test case is a good canary — it sits right at the AA boundary.

**Phase:** Core calculation phase (implement and test before anything else).

---

### Pitfall 2: Wrong contrast ratio formula

**What goes wrong:**
The contrast ratio is `(L1 + 0.05) / (L2 + 0.05)` where L1 is the *higher* of the two luminance values. Three common errors:

1. Putting the lower luminance on top (gets you the inverse ratio)
2. Omitting the 0.05 offset (breaks the 1:1 minimum for identical colours — you'd get 1/0 = division by zero for two blacks)
3. Not ensuring L1 ≥ L2 before dividing (you get ratios below 1:1)

**Why it happens:**
The formula looks simple and developers write it from memory incorrectly.

**Consequences:**
Ratios that are always below 1.0 (clearly wrong), or occasional NaN/Infinity when comparing identical or near-black colours.

**Prevention:**
Always `const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)`. Test with black-on-black (should return 1:1) and white-on-black (should return 21:1).

**Detection:**
Any ratio below 1.0 is a bug. White on black returning anything other than 21:1 is a bug.

**Phase:** Core calculation phase.

---

### Pitfall 3: Hex parsing silently swallowing bad input

**What goes wrong:**
User types a partial or malformed hex string. `parseInt("GG", 16)` returns NaN. `parseInt("1", 16)` returns 1 (not 17 as you'd want from a 2-char pair). Downstream luminance calculation gets NaN or a completely wrong number, and the UI shows nothing useful — no error, just a broken ratio display.

**Why it happens:**
Developers parse hex with `parseInt(hex.slice(i, i+2), 16)` and trust it to always work. No NaN guard. 3-digit shorthand (#RGB) is also common user input and the naive 2-char slice produces wrong channel values.

**Specific edge cases to handle:**
- 3-digit hex: `#abc` → expand to `#aabbcc` before parsing
- 4-digit and 8-digit hex (with alpha): strip the alpha channel, or explicitly reject and tell the user why
- Hash character: strip the `#` before parsing, but handle if user omits it
- Uppercase, lowercase, mixed: normalise to lowercase (or uppercase) before parsing
- Leading zeros: `#001122` — `parseInt("00", 16)` returns 0 correctly, but test it
- Invalid characters: `parseInt` silently stops at the first invalid char and returns whatever it parsed up to that point

**Consequences:**
NaN propagating through the luminance calculation, producing NaN ratios. UI shows "NaN:1" or blank output. Or worse, wrong-but-plausible values if invalid chars are mid-string.

**Prevention:**
Validate with a strict regex before parsing: `/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`. Expand 3-digit to 6-digit first. Strip the hash. Then parse with `parseInt(pair, 16)`. Reject anything that doesn't match with a clear inline error.

**Detection:**
Test with: `#fff`, `#FFF`, `fff`, `#12345g`, `#1234`, `#12345678`, empty string.

**Phase:** Input/UI phase — but the parsing function itself should be implemented and tested in the core calculation phase since the colour-finding algorithm depends on it.

---

### Pitfall 4: Using HSL lightness to search for accessible variants

**What goes wrong:**
The obvious approach is to take the input colour in HSL, walk the L (lightness) value up or down until the contrast ratio passes, then return that result. This is wrong for two reasons:

1. **HSL is not perceptually uniform.** Blue at HSL(240, 100%, 50%) is perceived as far darker than yellow at HSL(60, 100%, 50%), despite identical L values. Walking L does not produce predictable or consistent contrast changes across hues.

2. **The search can get stuck or overshoot.** Near-black and near-white inputs may require jumping to the extreme ends of the range to find a passing colour. A naive linear walk takes many steps and may return colours far from the original.

**Why it happens:**
HSL is intuitive for developers. It maps directly to how colour pickers work. "Adjust lightness" sounds right.

**Consequences:**
Colours that feel very different from the input (e.g., you wanted a dark blue, you get near-black). For some hues, the closest accessible variant may still look wrong to a designer because HSL-adjacent doesn't mean perceptually adjacent.

**Better approach:**
Walk lightness in **HSL** but validate using the actual WCAG luminance calculation (not HSL lightness as a proxy for contrast). Use a binary search between the current L and the extreme (0 or 100) to find the boundary efficiently. This is faster than a linear walk and avoids overshooting.

For a tool that claims perceptual closeness, consider LCh or HSLuv instead of HSL. But for a pragmatic first implementation, HSL walk + WCAG validation is fine — just don't conflate HSL L with WCAG luminance.

**Detection:**
Test with pure yellow (#ffff00), pure blue (#0000ff), and pure red (#ff0000). Check whether the "closest accessible variant" for each actually looks close to the input, or whether it's been pushed to near-black or near-white.

**Phase:** Colour-finding algorithm phase.

---

### Pitfall 5: Returning only black or white as accessible variants

**What goes wrong:**
For many saturated mid-tone colours (e.g., a bright red or medium green), no nearby colour passes AA on *both* light and dark backgrounds simultaneously. A naive algorithm that just adjusts lightness will shoot past the plausible range and land on near-black or near-white, which passes but is useless to the user.

**Why it happens:**
The search algorithm doesn't constrain how far it's allowed to deviate from the input. It finds *an* accessible colour, not the *closest* useful one.

**Consequences:**
In single-colour mode, the tool returns #1a1a1a or #f5f5f5 for a vivid input colour. The user wanted a usable variant, not black. This is the most common complaint in existing contrast tools.

**Prevention:**
- In single-colour mode, search outward from the input and stop early if the result would change hue significantly or move more than X lightness steps
- Be honest with the user: if no nearby variant exists, say so and show the closest passing colour even if it's distant
- Consider dual-colour mode as the pragmatic path for colours where simultaneous light+dark AA is impossible
- Show how far the returned colour has deviated from the input

**Detection:**
Test with #ff6600 (orange), #cc0000 (red), #00aa44 (green). These mid-tone saturated colours are unlikely to pass both simultaneously without going very dark or very light.

**Phase:** Colour-finding algorithm phase + UX phase (communication to user).

---

## Moderate Pitfalls

---

### Pitfall 6: Rounding that creates disagreement with other tools

**What goes wrong:**
A contrast ratio of 4.483:1 rounded to one decimal place becomes 4.5:1 — a pass. But WCAG does not allow rounding up. The official position is that 4.499:1 is a failure. Some older tools round and some don't, which creates confusion when users compare results.

The canonical problem case is #777777 on white: some tools report 4.48:1 (fail), others report 4.5:1 (pass). This is a real, documented inconsistency in the ecosystem.

**Prevention:**
Do not round the contrast ratio when evaluating pass/fail. Use the raw floating-point result. Display the ratio rounded to two decimal places for readability, but the pass/fail badge must use the unrounded value.

**Detection:**
Test #777777 on #ffffff. It should report 4.48:1 and fail AA normal text.

**Phase:** Core calculation phase.

---

### Pitfall 7: URL state out of sync with UI state

**What goes wrong:**
The URL is supposed to be a shareable link representing the current state. If the URL is only written on form submit and not on every colour change, or if it's written before input validation passes, the shared link either misses changes or encodes invalid state.

**Prevention:**
Update the URL hash on every valid colour change, not on submit. Use `history.replaceState` (not `pushState`) to avoid polluting the browser history with every keystroke. On page load, read from the URL hash first before applying defaults.

**Detection:**
Type a hex code, copy the URL, open it in a new tab. The colour should match exactly.

**Phase:** URL state / sharing phase.

---

### Pitfall 8: The tool itself fails its own accessibility audit

**What goes wrong:**
A tool that checks colour contrast uses light-grey labels on a white background, or relies on colour alone to communicate pass/fail status. This is embarrassing and undermines trust.

**Why it happens:**
Developers focus on the contrast calculation logic, not the UI chrome.

**Prevention:**
- The tool's own text must meet WCAG AA
- Pass/fail status must be communicated with text or iconography, not just green/red colour
- All interactive elements need visible focus states
- Run the finished UI through WebAIM's contrast checker before shipping

**Detection:**
Use a screen reader. Check pass/fail badges with a colour-blind simulation. Check focus order with Tab key.

**Phase:** UI phase and final review.

---

## Minor Pitfalls

---

### Pitfall 9: Colour preview text is too short to judge real readability

**What goes wrong:**
A single letter or a short word like "Aa" doesn't tell you whether a colour is readable in a real paragraph. The mathematical contrast can pass while the colour still looks washed out in practice.

**Prevention:**
Show a realistic text sample — a heading and a sentence or two of body copy — in the preview panel. This is what colourcontrast.cc does well.

**Phase:** UI phase.

---

### Pitfall 10: Not handling background colour input errors gracefully

**What goes wrong:**
User sets a custom background colour and makes a typo. The foreground contrast calculation runs against NaN and the whole panel breaks. Or the background input accepts anything and the error only surfaces in the ratio display.

**Prevention:**
Validate background hex inputs with the same strict regex as the foreground input. Fall back to the previous valid value on invalid input, not to white or black silently. Show an inline error on the input itself.

**Phase:** UI phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core luminance function | Wrong exponent or missing normalisation (Pitfall 1) | Unit-test against W3C reference values before wiring to UI |
| Contrast ratio function | Inverted L1/L2 or missing 0.05 offset (Pitfall 2) | Test black-on-black (1:1) and white-on-black (21:1) |
| Hex input parsing | NaN from invalid input, 3-digit shorthand not handled (Pitfall 3) | Strict regex validation, expand shorthand before parsing |
| Colour-finding algorithm | HSL lightness ≠ perceived brightness; results drift to black/white (Pitfalls 4, 5) | Binary search on HSL L, validate with WCAG function not HSL proxy |
| Pass/fail badge logic | Rounding up to 4.5 on borderline values (Pitfall 6) | Compare unrounded float against threshold |
| URL shareable links | URL written on submit not on change (Pitfall 7) | `replaceState` on every valid input change |
| UI chrome | Tool fails its own contrast checks (Pitfall 8) | Run finished UI through WebAIM before shipping |

---

## Sources

- W3C WCAG 2.1 Relative Luminance definition: https://www.w3.org/TR/WCAG21/relative-luminance.html
- W3C contrast ratio rounding issue (GitHub): https://github.com/w3c/wcag/issues/200
- WCAG contrast formula explained (Hallonbacka): https://mallonbacka.com/blog/2023/03/wcag-contrast-formula/
- Twitch algorithm for accessible colour variants: https://blog.twitch.tv/en/2021/11/30/using-algorithms-to-meet-accessibility-requirements-for-color-contrast/
- Accessible Palette — HSL problems: https://www.wildbit.com/blog/accessible-palette-stop-using-hsl-for-color-systems
- Contrast Ratio Math Issues (WCAG3 GitHub): https://github.com/w3c/wcag3/issues/192
- WebAIM contrast article: https://webaim.org/articles/contrast/
- CSS-Tricks WCAG contrast guide: https://css-tricks.com/understanding-web-accessibility-color-contrast-guidelines-and-ratios/
