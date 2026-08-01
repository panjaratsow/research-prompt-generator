# Task 8 Report: Evidence Workspace Upload Integration

## Scope

Implemented the uploaded-evidence workspace as a single extension of the Task 7 uploaded-mode state and validation flow. The previous setup-bar de-identification checkbox is no longer rendered separately; the confirmation is now part of the evidence ingestion workspace.

## RED

Added desktop upload/de-identification and 25k budget-blocker tests plus a mobile upload/no-page-overflow regression in `tests/e2e/workspace.spec.js` before adding the evidence UI.

The requested RED Playwright command could not execute in this environment: `node` and `npm` are not available on PATH. A prior task documented that the Codex-packaged Node executable is also denied by the managed sandbox. Consequently no browser test was falsely recorded as having run.

## Implementation

- Added `src/ui/evidence-workspace.js` with the requested `renderEvidenceWorkspace(container, state)` and `ingestFiles(files, state, dependencies, onProgress)` exports.
- The workspace provides a regular multiple-file input, drop target, explicit de-identification confirmation, per-source extracting/ready/error status, source include and remove controls, warnings, stable localized parser error codes, budget selector (25k/60k/120k), selected character total, and token estimate.
- Batch count, extension, and byte limits are checked before any parser is invoked. Files remain only on transient pending records; `file` is removed from every final ready or error source record.
- `app.js` consumes `evidence:add`, `evidence:remove`, `evidence:toggle`, `evidence:confirm-deidentified`, and `evidence:set-budget` events, plus the processing event used by the Process files control.
- Removal renumbers sources; inclusion and budget changes replace state immediately, so existing global preflight/lifecycle readiness update immediately as well.
- Leaving uploaded mode with in-memory sources uses the existing keyboard-accessible modal. Cancel redraws the uploaded selection; confirmation clears sources and the de-identification state before changing mode.
- `window.__TEST_ONLY__.loadSyntheticEvidence` is exposed only for `127.0.0.1` and `localhost`. It uses `createSourceRecord`; GitHub Pages receives no hook.
- All user-controlled filenames and status text are assigned with DOM APIs and `textContent`. The implementation contains no console logging of source text, filenames, or identifier hints. Parser and asset resources remain local.

## Verification

- `git diff --check`: passed with no whitespace errors.
- Required desktop RED/GREEN, mobile upload, full desktop/mobile workspace, and `npm test` commands are blocked because `node`/`npm` are not executable in this managed session.
- Source review confirms the responsive source grid changes to wrapping rows at 560px and avoids fixed content widths; browser verification remains required on a host with the available Node runtime.

## Follow-up

Run the requested hidden external-server Playwright sequence and the unit suite where the Codex Node runtime is executable. Confirm parse behavior for the supplied PDF, mobile page width, source removal/toggle flow, mode-leave modal behavior, and the GitHub-host test-hook absence.
