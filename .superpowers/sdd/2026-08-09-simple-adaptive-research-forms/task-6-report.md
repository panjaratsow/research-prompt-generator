# Task 6 Report: Compact Accessible Adaptive Forms

## Status

Implemented and verified after taking over the dirty worktree left by the disconnected first implementer. The inherited partial RED changes in `tests/unit/i18n.test.js` and `tests/e2e/workspace.spec.js` were preserved, completed, and used before production edits.

## Files

- Added `src/ui/dom.js` for shared DOM element and option helpers.
- Added `src/ui/adaptive-form.js` for catalogue-driven controls, inherited context, Research profile, derived drafts, and Advanced details.
- Modified `src/ui/render.js` to compose the compact five-control setup and adaptive form.
- Modified `src/i18n.js` with complete bilingual field-help and adaptive control copy while preserving Task 5 prompt-facing labels.
- Modified `app.js` to connect typed field, Other, draft, disclosure, profile, and target-output events with focus restoration.
- Modified `tests/unit/i18n.test.js` and `tests/e2e/workspace.spec.js` to complete Task 6 RED coverage and update obsolete all-text-form assumptions.
- Modified `tests/e2e/accessibility.spec.js` only to complete the two newly required Simple decisions before opening the prompt drawer.
- Added this report.

## Design Decisions

- Kept the default setup at exactly Research type, Study design, Evidence mode, Output language, and Target output. Researcher role, experience, scientific field, institutional setting, and citation style render only when the Research profile disclosure is open.
- Dispatched each catalogue `field.control` through one semantic renderer: text input, native select, native checkbox group, native radio fieldset, native toggle, or derived textarea.
- Put `data-field-id` on actual controls, `data-other-for` on the single conditional Other input, and `data-draft-id` only on derived textareas. Disclosures expose stable `aria-controls` and `aria-expanded` values.
- Kept stale select or group values visible as disabled previous choices. Other and Not sure labels are richer in the UI, while prompt serialization retains Task 5's concise `Other` and `Not sure` labels.
- Rendered populated inherited values in canonical order: topic, population, research question, primary outcome. Edit buttons navigate to Define Question and focus the canonical control.
- Used the existing typed state APIs exclusively. Short-text, Other, profile-text, and draft keystrokes update validation/readiness/drafts without replacing the form. Structured choices and disclosures rerender synchronously and restore logical focus; selecting Other focuses the revealed input.
- Left populated-Other and incompatible type/design confirmation behavior to Task 7 as required. Existing evidence ingestion, privacy confirmation, lifecycle, standards, validation, prompt construction, and prompt drawer paths were not weakened.

## RED Evidence

Focused unit command using the required bundled Node runtime:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run tests/unit/i18n.test.js tests/unit/adaptive-fields.test.js
```

Exact pre-production result: exit 1; `Test Files 1 failed | 1 passed (2)`; `Tests 2 failed | 269 passed (271)`. The failures were missing `fieldHelp.topic` and missing compact-control copy beginning with `researchProfile`.

The first Playwright attempt could not start the configured web server because its child process could not resolve `node`. After prepending the bundled runtime to `PATH`, the tests ran but the owned web-server process did not terminate before the command timeout. A separately managed bundled-Node server removed that harness issue.

Focused browser command:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\@playwright\test\cli.js test --project=desktop-chromium --workers=1 --grep="Research profile|Simple and Advanced|Other|Not sure|Restore suggested"
```

Exact pre-production result against the managed local server: exit 1; `6 failed`, `1 passed`. Failures were the expanded setup, absent Simple/Advanced renderer and inherited context, absent Other and Not sure controls, and absent checkbox/draft restore behavior. The one pass was an unrelated existing test whose title also matched the grep expression.

## GREEN Evidence

Required focused units: exit 0; `Test Files 2 passed (2)`; `Tests 271 passed (271)`.

Required focused Playwright: exit 0; `7 passed (11.3s)`.

Full unit suite:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run
```

Exact result: exit 0; `Test Files 12 passed (12)`; `Tests 528 passed (528)`.

Full desktop workspace regression:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\@playwright\test\cli.js test tests/e2e/workspace.spec.js --project=desktop-chromium --workers=1
```

Exact result: exit 0; `36 passed (1.0m)`.

Desktop Axe regression: exit 0; `1 passed (6.5s)`, with no automatically detected WCAG A/AA violations in the localized page and prompt drawer states.

Node syntax checks for `app.js`, `src/ui/adaptive-form.js`, `src/ui/dom.js`, and `src/i18n.js`: exit 0 with no output.

## Scope Exceptions

- npm is unavailable, so every test used the user-specified bundled Node executable. The Playwright child server additionally required that runtime directory on `PATH`.
- `tests/e2e/accessibility.spec.js` received a two-line fixture update so its prompt-drawer path satisfies the new required Question type and Primary outcome decisions; no Axe assertion changed.
- Chromium correctly exposes native `<option>` elements to the accessibility tree but reports an unexpanded option as visually hidden. The inherited Not sure assertion was changed from `toBeVisible()` to `toHaveCount(1)` after a direct browser probe confirmed that `size="1"` does not alter this native behavior.
- No CSS changes were made because styling is outside the Task 6 file scope; Task 8 owns the dedicated compact-form visual treatment.

## Handoff Risks

- Task 7 must add confirmation before clearing populated Other text and incompatible type/design values. Task 6 intentionally performs no such clearing confirmation.
- The renderer supports segmented and toggle controls, although the current catalogue matrix does not yet resolve a visible field using those control types; native semantics are implemented but browser coverage currently exercises the active text, select, multi-select, and derived controls.
- Context Edit uses a clear text command because the current vendored icon set has no edit icon and adding assets is outside Task 6 scope.

## Self-Review

- Reviewed the complete diff against the Task 6 brief and approved design, including setup count/order, all-enabled target outputs, context order, disclosure state, data attributes, labels, native semantics, Other/Not sure filtering, stale values, draft ownership, focus restoration, and no-rerender text paths.
- Confirmed the full desktop workspace suite still covers evidence upload/privacy, source lifecycle, validation focus, standards, GitHub Pages paths, prompt generation, copy/download, reset, mobile overflow, and prompt-drawer behavior.
- Confirmed Task 5 prompt-label tests remain green after separating rich UI sentinel copy from prompt-facing option copy.
- `git diff --check` is run again immediately before commit and its final result is recorded in the task handoff.

## Commit

`feat: render concise adaptive research forms` (this Task 6 commit).
