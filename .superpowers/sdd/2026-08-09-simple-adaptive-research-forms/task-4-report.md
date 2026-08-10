# Task 4 Report: Catalogue-Driven Validation and Actionable Readiness

## Status

Implemented and committed.

## Files

- Modified `src/validation.js`
- Modified `tests/unit/validation.test.js`
- Modified `src/i18n.js`
- Modified `tests/unit/i18n.test.js`
- Modified `src/ui/render.js` only to consume the required readiness object contract without a runtime string-method failure.

## Design Choices

- Required IDs and readiness now derive from `getStageFieldDefinitions()` simple fields; readiness entries use the specified object shape and preserve the first global blocker code as `reasonCode`.
- Required simple omissions and design-critical draft composition failures block. Advanced omissions create focusable warnings.
- Stale choices, Other-without-text, and draft composition failures contain only code, field ID, source ID, and message key metadata; no value, source text, or filename is serialized.
- Existing evidence blockers, source focus IDs, evidence-budget behavior, identifier warnings, and contextual governance warnings remain intact.
- Added the exact Thai and English actionable status and validation strings; the renderer supplies only count and stable reason code replacements.

## RED Evidence

`npm test -- tests/unit/validation.test.js tests/unit/i18n.test.js`

Result: failed because `npm` is not installed: `npm : The term 'npm' is not recognized as the name of a cmdlet, function, script file, or operable program.`

`& '.\\node_modules\\.bin\\vitest.cmd' run tests/unit/validation.test.js tests/unit/i18n.test.js`

Result: failed because its launcher could not find Node: `'"node"' is not recognized as an internal or external command, operable program or batch file.`

The bundled runtime path was discovered after these attempts. A post-implementation baseline-restoration attempt was refused by Git because it could not create the worktree `index.lock`, so no valid behavioural RED output was captured. The implementation was left unchanged.

## GREEN Evidence

`& 'C:\\Users\\panja\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe' 'node_modules\\vitest\\vitest.mjs' run 'tests/unit/validation.test.js' 'tests/unit/i18n.test.js' 'tests/unit/state.test.js'`

Result: `Test Files 3 passed (3)` and `Tests 58 passed (58)`.

Full suite result: `11 passed`, `1 failed`; `481 passed`, `28 failed`. All failures are in `tests/unit/prompt-engine.test.js`: its existing fixtures only populate retired legacy required fields, so prompt generation is now correctly blocked by Task 4's new catalogue requirements. The binding constraints prohibit modifying those fixtures or the prompt engine.

## Commit

`aa0273c feat: add actionable adaptive form readiness`

## Self-Review

- `git diff --check` is clean.
- Reviewed every issue path to confirm it contains no user or source value.
- Confirmed the only out-of-scope source edit is the renderer adapter required by the object-readiness contract.
- Remaining concern: the unrelated prompt-engine fixtures need a later task to populate the new simple fields before the full suite can pass.

## Round 1/5: Invalid Decisions in Readiness

### Status

Fixed stale required options and current design-critical draft composition failures so they contribute one deduplicated unsatisfied decision to stage readiness. Non-global invalidity now yields `remaining`; true global blockers still yield `blocked` with the original first `reasonCode`.

### RED Evidence

`& 'C:\\Users\\panja\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe' 'node_modules\\vitest\\vitest.mjs' run 'tests/unit/validation.test.js'`

Result: `Test Files 1 failed (1)`; `Tests 2 failed | 20 passed (22)`.

- `counts a stale required option as one remaining decision` received `ready`, `remaining: 0`, and no missing IDs instead of `remaining`, `remaining: 1`, and `questionType`.
- `counts a current design-critical draft error as one remaining decision` received `ready`, `remaining: 0`, and no missing IDs instead of `remaining`, `remaining: 1`, and `researchQuestion`.

The duplicate-count regression passed under the baseline because incompleteness already contributed the field once; it guards the new stale-invalidity merge from adding the same field again.

### GREEN Evidence

`& 'C:\\Users\\panja\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe' 'node_modules\\vitest\\vitest.mjs' run 'tests/unit/validation.test.js'`

Result: `Test Files 1 passed (1)`; `Tests 22 passed (22)`.

`& 'C:\\Users\\panja\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe' 'node_modules\\vitest\\vitest.mjs' run 'tests/unit/validation.test.js' 'tests/unit/i18n.test.js' 'tests/unit/state.test.js'`

Result: `Test Files 3 passed (3)`; `Tests 61 passed (61)`.

### Self-Review

- `missingFieldIds` is assembled with a `Set`, preserving required-field order while deduplicating incomplete and invalid states.
- Stale detection is limited to required fields under each stage's own catalogue context.
- Draft composition failure contributes only for the selected stage's design-critical derived draft.
- The global blocker filter and first-code `reasonCode` behavior are unchanged.
- Prompt-engine fixture failures remain explicitly deferred to Task 5 per the round constraints.
