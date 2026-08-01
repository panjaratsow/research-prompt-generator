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

## Review Fix Round 1

### RED

Command:

```powershell
npm test -- tests/unit/prompt-engine.test.js tests/unit/validation.test.js
```

Result: failed with two expected regressions: a malicious source ID was interpolated into the SOURCE opening tag, and case/whitespace SOURCE delimiter variants were not escaped. The focused run had 2 failed and 16 passed tests.

### GREEN

Command:

```powershell
npm test -- tests/unit/prompt-engine.test.js tests/unit/validation.test.js
```

Result: passed with 2 suites and 18 tests after sharing XML-attribute escaping for source IDs and filenames and hardening delimiter escaping for case/whitespace variants.

### Full Verification

Command:

```powershell
npm test
```

Result: passed with 4 suites and 30 tests.

### Fixes

- Escaped source IDs and filenames through the same XML-attribute helper.
- Escaped SOURCE-like opening and closing tags case-insensitively, including whitespace variants, while preserving the established closing-delimiter encoding.
- Captured `PreflightError.issues` in tests to assert the metadata-only `selected-source-empty` contract and exclude source/user content from serialization.
- Added an anchored exact twelve-heading count assertion.
