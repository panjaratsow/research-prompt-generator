# Task 8 Report: Responsive Visual System and Accessibility Verification

## Status

Implemented and verified on `codex/simple-adaptive-forms` from base `55fd8ee`.

## Files

- Modified `styles.css`.
- Modified `tests/e2e/workspace.spec.js`.
- Modified `tests/e2e/accessibility.spec.js`.
- Added the two asserted Chromium screenshot baselines under `tests/e2e/workspace.spec.js-snapshots/`.
- Added this report.

No change was required in `index.html` or `src/ui/adaptive-form.js`; their existing semantic hooks, native inputs, disclosures, logo, and header structure were sufficient.

## CSS Decisions

- Changed the adaptive form into a one-column section stack, with nested two-column Simple and Advanced grids above 560px and one-column grids at 560px and below. Draft and disclosure regions use the full workspace width.
- Kept the inherited context unframed, using only block borders and a wrapping list. Context values use `overflow-wrap` and collapse to one column on mobile.
- Styled the existing native checkbox/radio labels as 38px chips with 6px radii, visible checked backgrounds/borders, and a 3px container focus ring driven by `:focus-visible`.
- Made disclosure buttons a stable 40px minimum height and preserved the hidden Advanced region with a scoped `.advanced-fields[hidden]` cascade rule.
- Used a six-track desktop Research profile grid, with the institutional setting spanning two tracks, so the long value remains visible. All setup controls become one column on mobile.
- Used only existing palette colors. Added no cards, gradients, ornamental elements, viewport-scaled fonts, negative letter spacing, or radii above 8px.

## TDD Evidence

### RED

Required bundled-Node command:

```powershell
& '<bundled-node>\node.exe' node_modules\@playwright\test\cli.js test --project=desktop-chromium --project=mobile-chromium --workers=1 --grep='responsive adaptive|WCAG|keyboard-only'
```

Initial pre-CSS result: exit 1; `12 failed`, `2 passed` (14 total). The expected product failures showed 36px disclosures, unstyled inline chip labels, and absent desktop/mobile baselines. Six viewport cases also had the new layout assertions queued behind the disclosure failure. Both bilingual Axe cases passed.

The initial keyboard failure was isolated to the test helper reading native `value` as `data-value`. Correcting the helper required no production change; the desktop keyboard-only path then passed against the original CSS.

During full regression, the new `display:grid` rule exposed a real collapse regression: exit 1; `4 failed`, `98 passed`. Existing tests proved hidden Advanced controls were visible. The scoped hidden-state CSS fix made the four affected desktop/mobile tests pass before the full matrix was rerun.

### GREEN

- Exact focused desktop/mobile command: exit 0; `14 passed (37.1s)`.
- Full unit suite: exit 0; `Test Files 12 passed (12)`; `Tests 528 passed (528)`.
- Full desktop/mobile workspace and accessibility regression: exit 0; `102 passed (2.4m)`.
- Node syntax checks for both changed E2E files: exit 0.
- `git diff --check`: exit 0; only expected CRLF conversion notices.

## Viewport Results

- `1440x900`: two Simple columns, two Advanced columns, full-width context/draft/disclosure regions, 40px stable disclosures, no peer rectangle intersections, no horizontal page overflow, and the full institutional-setting value visible.
- `1024x768`: the same two-column maximum and full-width region behavior passed without intersections or horizontal page overflow.
- `412x915`: one Simple column, one Advanced column, one-column setup/profile/context, wrapping chips, stable disclosures, no intersections, and no horizontal page overflow.

The geometry assertions run in both Chromium projects and verify no more than two field columns at desktop widths, exactly one at mobile width, full-width derived/disclosure regions, and unchanged disclosure dimensions before and after expansion.

## Screenshot Baselines

- `adaptive-synthesis-desktop-desktop-chromium-win32.png`
- `adaptive-synthesis-mobile-mobile-chromium-win32.png`

Visual inspection at original resolution:

- Desktop English: Faculty emblem and product header are clear in the first viewport; compact setup and expanded profile fit without clipped values; lifecycle rail, active Step 3, standards column, unframed context, two-column fields, draft height, Advanced fields, and validation content align without overlap. The checked Risk of bias chip has both selected styling and a visible keyboard focus ring.
- Mobile Thai: Faculty branding and actions fit; setup/profile controls are one column; the horizontal lifecycle rail keeps active Step 3 visible between Steps 2 and 4; Thai labels and checkbox chips wrap within their controls; context, draft, Advanced fields, validation, standards, and footer remain full-width with no clipping, overlap, or horizontal page scroll. No information was hidden for the baseline.

## Accessibility and Keyboard

- Axe analyzed Thai and English with Research profile open, Advanced open, Information sources Other checked, and the active Other text set to `ThaiJO`; it also analyzed the English prompt drawer. Desktop and mobile reported no automatically detected WCAG A/AA violations.
- The keyboard-only test tabs from setup to Step 2, activates Other with Space, types `ThaiJO`, completes the Simple fields, opens Advanced with Enter, enters an Advanced query, opens the prompt drawer with Enter, closes it with Escape, and verifies focus returns to Generate prompt. It passed in desktop and mobile Chromium.

## Risks

- Screenshot baselines are Chromium/Windows-specific and may need deliberate regeneration after font or browser-rendering updates.
- The active catalogue still has no segmented-radio field, so browser interaction coverage demonstrates native checkbox chips; the shared segmented-radio CSS follows the same checked/focus rules but remains dormant, consistent with the Task 7 re-review.
- Axe is automated coverage, not a substitute for assistive-technology testing. Keyboard and visual checks cover the requested interaction states.

## Review Finding Fix (2026-08-11)

`responsiveGeometry()` now audits visible-only geometry at `1440x900`, `1024x768`, and `412x915` instead of only comparing a few direct form children. It verifies header brand/emblem/product text against the action group, language selector, and reset control; setup and expanded profile controls; workspace, lifecycle, and standards boundaries; Simple and Advanced field peers; choice controls; derived draft; disclosure; inherited-context items; validation sections; and nested interactive descendants. The audit rejects peer intersections, horizontal viewport/container escapes, and per-container horizontal overflow with a one-pixel rounding tolerance. Parent/child containment and a label wrapping its input are not treated as peer overlap. Hidden elements are excluded. The mobile lifecycle rail remains intentionally horizontally scrollable; its fully visible stage buttons are checked for bounds, while the non-scrolling required regions use `scrollWidth <= clientWidth + 1`.

### RED/GREEN Evidence

- RED: added an isolated `1024x768` fixture that shifts `.header-actions` over `.brand-lockup`. With the pre-fix helper, the test failed as intended: expected `header: .brand-lockup intersects .header-actions`, received `[]`. The initial stylesheet-injection fixture was blocked by the page CSP, so the final fixture uses a direct DOM position mutation and does not weaken production policy.
- GREEN: the same fixture passes with the expanded helper because the header peer collision is reported. The unmodified UI then passed the focused matrix with the new empty `overlaps`, `outOfBounds`, and `overflows` assertions: `6 passed` across desktop/mobile Chromium and all three target viewports. Existing column limits, full-width-region, institution-value, and stable-disclosure assertions remain in place.
- No real CSS issue was exposed, so `styles.css` and screenshot baselines were intentionally left unchanged.
