# Task 8 Report: Evidence Workspace Upload Integration

## Scope

Implemented the uploaded-evidence workspace as a single extension of the Task 7 uploaded-mode state and validation flow. The previous setup-bar de-identification checkbox is no longer rendered separately; the confirmation is now part of the evidence ingestion workspace.

## RED

Added desktop upload/de-identification and 25k budget-blocker tests plus a mobile upload/no-page-overflow regression in `tests/e2e/workspace.spec.js` before adding the evidence UI.

Verification used the Codex-packaged Node runtime with a hidden external server and direct Playwright CLI. The prior Task 7 Thai localization test initially failed because it expected a setup-bar checkbox before a file was selected. The updated test selects `searchable-evidence.pdf`, confirms that processing has not begun, and verifies that confirmation removes its validation blocker without duplicating the dedicated parsing test.

The strengthened Pixel 7 regression reproduced a production defect: `evidence:confirm-deidentified` called the full `update()` render path, replacing the focused checkbox and all of `#workspaceMain`. The replacement left Playwright's mobile visual viewport offset from layout scroll coordinates; the checkbox lost focus and subsequent pointer coordinates could hit unrelated content.

## Implementation

- Added `src/ui/evidence-workspace.js` with the requested `renderEvidenceWorkspace(container, state)` and `ingestFiles(files, state, dependencies, onProgress)` exports.
- The workspace provides a regular multiple-file input, drop target, explicit de-identification confirmation, per-source extracting/ready/error status, source include and remove controls, warnings, stable localized parser error codes, budget selector (25k/60k/120k), selected character total, and token estimate.
- Batch count, extension, and byte limits are checked before any parser is invoked. Files remain only on transient pending records; `file` is removed from every final ready or error source record.
- `app.js` consumes `evidence:add`, `evidence:remove`, `evidence:toggle`, `evidence:confirm-deidentified`, and `evidence:set-budget` events, plus the processing event used by the Process files control.
- De-identification confirmation now updates state, validation, lifecycle readiness, and the Process files disabled state in place. It preserves the focused checkbox and still publishes `workspace:statechange`; it does not replace the evidence workspace DOM.
- Removal renumbers sources; inclusion and budget changes replace state immediately, so existing global preflight/lifecycle readiness update immediately as well.
- Leaving uploaded mode with in-memory sources uses the existing keyboard-accessible modal. Cancel redraws the uploaded selection; confirmation clears sources and the de-identification state before changing mode.
- `window.__TEST_ONLY__.loadSyntheticEvidence` is exposed only for `127.0.0.1` and `localhost`. It uses `createSourceRecord`; GitHub Pages receives no hook.
- All user-controlled filenames and status text are assigned with DOM APIs and `textContent`. The implementation contains no console logging of source text, filenames, or identifier hints. Parser and asset resources remain local.

## Verification

- `git diff --check`: passed with no whitespace errors.
- RED: targeted Pixel 7 upload test failed with `expect(locator).toBeFocused()` after de-identification confirmation, proving the focused checkbox was replaced.
- GREEN: targeted Pixel 7 upload test passed after the in-place update. It verifies the checkbox is attached and focused, Process files is enabled, and its center resolves to its stable `data-action="evidence-process"` target before activation.
- Unit: `59/59` passed.
- Desktop Playwright: `9/9` passed.
- Mobile Playwright: `9/9` passed.
- Follow-up commit: `dccb19c492a9a237523c1e0c3853e07e8fdad0e4` (`fix: preserve evidence confirmation focus`).

## Follow-up

No remaining verification follow-up.
