# Task 2 Report: Typed Values, Carry-Forward, and Confirmed Transitions

## Status

Complete.

## Files Changed

- `src/field-values.js` (new)
- `src/state.js`
- `app.js`
- `tests/unit/field-values.test.js` (new)
- `tests/unit/state.test.js`

## Design Choices

- Kept every form value as either a trimmed string or a normalized string array. `fieldCustomValues` holds the text accompanying `Other`, and `confirmedDesign` is derived directly from `studyDesignId` rather than duplicated in `fields`.
- Made stage changes a lifecycle-only update. They retain field and draft containers by reference, reset the target output to the stage-appropriate option, and therefore preserve canonical fields and completed stage products across all seven stages.
- Modelled type/design changes as immutable two-phase transactions. `analyzeContextTransition()` records incompatible field IDs and stale option IDs, and `applyContextTransition()` clears only the supplied snapshot. `setResearchType()` and `setStudyDesign()` expose the shared `{ state, needsConfirmation, analysis }` shape and retain `incompatible` as the temporary alias of `analysis.fieldIds`.
- Added every explicit target-output-to-stage mapping, independent disclosure state, cloned public typed arrays and draft metadata, and kept public source redaction unchanged.

## RED Evidence

The brief command could not start because `npm` is unavailable in this environment:

```text
npm : The term 'npm' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

Fallback command:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run tests\unit\field-values.test.js tests\unit\state.test.js
```

Result: failed as expected. `tests/unit/field-values.test.js` could not import the missing `src/field-values.js`; `tests/unit/state.test.js` had 8 failed and 10 passed tests because typed state, target-output mapping, disclosures, transition analysis, and stage carry-forward were absent.

## GREEN Evidence

Focused command:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run tests\unit\field-values.test.js tests\unit\state.test.js tests\unit\evidence-core.test.js
```

Result: `Test Files 3 passed (3)`; `Tests 41 passed (41)`.

Final unit-suite command:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run
```

Result: `Test Files 11 passed (11)`; `Tests 484 passed (484)`.

Browser entrypoint syntax check:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
```

Result: exited 0.

## Final Commit

`4c41f80 feat: add typed adaptive form state`

## Self-Review

- Reviewed the staged five-file diff and ran `git diff --cached --check`; no whitespace errors.
- Verified changes are scoped to the five requested Task 2 code/test files. This report is intentionally outside that commit, as requested staging named only those five files.
- Confirmed the app handlers preserve the temporary `incompatible` alias while passing the stored analysis snapshot through confirmation for both research-type and study-design changes.
- Confirmed source redaction and structural sharing remain covered by the focused evidence test and the final 484-test unit suite.

## Fix Round 1/5

### Status

Complete.

### Findings Addressed

- `normalizeFieldValue()` now rejects every non-string entry in a multi-select array with `TypeError` before trimming or deduplication. Objects can no longer enter state as `[object Object]`.
- Added the pure `readFieldInputValue()` adapter and wired it into `app.js`. Native checkbox groups produce arrays of checked values; catalogue multi-selects still rendered as legacy text controls produce a one-item array, or `[]` when empty. Non-multi controls retain scalar values. Full adaptive control rendering remains deferred to Task 6.
- Added a study-design transition regression that confirms a populated `analysisFamily` option is reported and cleared only after confirmation when the next design makes it incompatible.
- Added a public-state regression that verifies typed arrays and draft records are cloned independently while uploaded source text, internal keys, and File objects remain excluded.

### Files Changed

- `src/field-values.js`
- `app.js`
- `tests/unit/field-values.test.js`
- `tests/unit/state.test.js`
- `.superpowers/sdd/2026-08-09-simple-adaptive-research-forms/task-2-report.md`

### Root-Cause Evidence

- Multi-select normalization validated only that the outer value was an array, then called `String()` on every item. This made object entries valid strings instead of rejecting malformed typed values.
- The browser input handler passed `event.target.value` directly to `setField()` for every field. Catalogue multi-select normalization therefore received a scalar from both current legacy text controls and future native checkbox controls.

### RED Command And Result

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run tests\unit\field-values.test.js tests\unit\state.test.js tests\unit\evidence-core.test.js
```

Result: exit 1; `Test Files 1 failed | 2 passed (3)`; `Tests 2 failed | 43 passed (45)`. The object-entry test failed because no error was thrown, and the adapter test failed because `readFieldInputValue` did not exist.

### GREEN Commands And Results

Focused suite:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run tests\unit\field-values.test.js tests\unit\state.test.js tests\unit\evidence-core.test.js
```

Result: exit 0; `Test Files 3 passed (3)`; `Tests 45 passed (45)`.

Full unit suite:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vitest\vitest.mjs run
```

Result: exit 0; `Test Files 11 passed (11)`; `Tests 488 passed (488)`.

Browser entrypoint syntax:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
```

Result: exit 0 with no syntax errors.

### Self-Review

- Confirmed strict validation occurs before trimming and deduplication, so malformed entries never reach state.
- Confirmed the adapter uses `getFieldDefinition()` and has no DOM dependency; `app.js` supplies the matching native checkbox controls while preserving the current no-full-render behavior.
- Confirmed the new transition test exercises the stored analysis snapshot through confirmation rather than recomputing compatibility.
- Confirmed the public-state clone test mutates published arrays and draft metadata without affecting private state and rechecks source redaction.
- `git diff --check` reported no whitespace errors. The fix commit message is `fix: harden typed field input handling`.
