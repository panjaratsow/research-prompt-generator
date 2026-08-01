# Task 4: Deterministic Prompt Engine

## RED

Command:

```powershell
npm test -- tests/unit/prompt-engine.test.js
```

Result: failed as expected because `../../src/prompt-engine.js` could not be imported. Vitest reported one failed suite and no collected tests; the production module did not yet exist.

## GREEN

Command:

```powershell
npm test -- tests/unit/prompt-engine.test.js
```

Result: passed with 1 suite and 7 tests.

## Full Verification

Command:

```powershell
npm test
```

Result: passed with 4 suites and 29 tests.

## Delivered

- Added `PreflightError`, deterministic ordered twelve-section `buildPrompt`, evidence blocks, and research-family quality checks.
- Preserved preflight safeguards, emitted no source text in preflight errors, escaped source delimiters and XML-sensitive filenames, and kept the three evidence modes distinct.
- Added contract tests for strict section ordering, safeguards, uploaded data handling, evidence boundaries, selected output language and citation style, and review-methodology selection.

## Concerns

None for Task 4. Citation style is honored from optional `state.citationStyle` and defaults explicitly to Vancouver until a later state/UI task persists the user selection.
