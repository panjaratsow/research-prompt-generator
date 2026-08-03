# Task 1 Implementation Report

## Status

DONE_WITH_CONCERNS

## Files Changed

- `src/catalog/lifecycle-stages.js`
- `src/state.js`
- `src/i18n.js`
- `src/catalog/index.js`
- `src/validation.js`
- `src/catalog/standards.js`
- `src/prompt-engine.js`
- `tests/unit/catalog.test.js`
- `tests/unit/state.test.js`
- `tests/unit/i18n.test.js`
- `tests/unit/validation.test.js`
- `tests/unit/prompt-engine.test.js`
- `tests/unit/prompt-drawer.test.js`
- `tests/e2e/workspace.spec.js`
- `task-1-report.md`

## RED Evidence

Command attempted before production changes:

```powershell
npm test -- tests/unit/catalog.test.js tests/unit/state.test.js tests/unit/i18n.test.js
```

Result: `npm` was not available on `PATH` (`The term 'npm' is not recognized...`), so the expected assertion-level RED failure could not be captured at that point. The requested new lifecycle, state, localization, validation, standards, prompt, and browser tests were added before production changes. The host subsequently supplied the Node/npm launcher used for GREEN verification.

The requested initial browser RED command could not be run before the launcher was supplied:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved seven-step|uploaded synthesis"
```

Expected feature-level RED causes were the former ten IDs, `question` default, absent translations/targets, and unavailable approved stages.

## GREEN Evidence

```powershell
npm test -- tests/unit/validation.test.js tests/unit/catalog.test.js tests/unit/state.test.js
```

Result: `3 passed`, `114 passed`.

```powershell
npm test -- tests/unit/prompt-engine.test.js tests/unit/prompt-drawer.test.js
```

Result: `2 passed`, `22 passed`.

```powershell
npm test -- --reporter=dot
```

Result: `9 passed`, `207 passed`. Vitest emitted the existing PDF.js `standardFontDataUrl` warning from `tests/unit/parsers.test.js`, with no test failure.

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved seven-step|uploaded synthesis"
```

Result: both requested scenarios passed: seven-step bilingual lifecycle (`503ms`) and uploaded synthesis SOURCE block (`919ms`). The Playwright process did not exit afterward, so the outer command timed out after `120.6s` with exit code `124`.

## Commits

`a80d9e6 feat: replace research lifecycle with seven-step cycle` contains the atomic core contract. The required report is committed separately because `.superpowers` is ignored.

## Self-Review

- Confirmed one seven-ID contract now drives lifecycle state, validation readiness, contextual fields, standards resolution, i18n, and prompt generation; no compatibility aliases were introduced.
- Confirmed target outputs and English/Thai lifecycle labels match the task brief.
- Confirmed context controls and warnings are limited to methodology/proposal, except evidence-review registration during literature review.
- Confirmed all 25 standards retain their existing order, URLs, versions, families, and designs while moving to the approved stages.
- Confirmed prompt instructions preserve evidence boundaries, source escaping, citation rules, governance wording, and human review.
- Ran `git diff --check`; no whitespace errors.

## Concerns

- Strict assertion-level RED evidence was blocked because the shell lacked `npm` until the host supplied a launcher after production work began.
- Targeted Playwright assertions pass, but the runner hangs after completion in this sandbox and causes the outer command timeout. Task 2 owns the full browser matrix.

## Fix Round 1/5

### Status

DONE

### Files Changed

- `src/prompt-engine.js`
- `tests/unit/prompt-engine.test.js`
- `tests/e2e/workspace.spec.js`
- `task-1-report.md`

### Lifecycle Objective And Task Separation

`stage.task` remains the complete `3. LIFECYCLE OBJECTIVE` content. The `6. TASK` section now contains only the task command, an explicit `Stage-specific instructions:` line, and the shared safeguards. The regression covers every `LIFECYCLE_STAGES` entry and verifies that its objective is exact, its task command names the approved ID, and its objective text is not duplicated in the task section.

RED command:

```powershell
$env:PATH='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH; & 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.superpowers\npm-cli\package\bin\npm-cli.js' test -- tests/unit/prompt-engine.test.js
```

RED output:

```text
Test Files  1 failed (1)
Tests  1 failed | 19 passed (20)
FAIL ... keeps lifecycle objectives and task-only guidance separate
AssertionError: expected '6. TASK\nComplete the define-question…' to contain 'Complete the define-question task for…'
```

GREEN command:

```powershell
$env:PATH='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH; & 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.superpowers\npm-cli\package\bin\npm-cli.js' test -- tests/unit/prompt-engine.test.js
```

GREEN output:

```text
Test Files  1 passed (1)
Tests  20 passed (20)
```

### E2E Fixture Migration

The persistent setup scenario now selects and asserts `research-proposal`, and remaining removed lifecycle selectors in this task file were mapped to `define-question`, `literature-review`, `outline-methodology`, or `write-proposal` according to the scenario intent.

Covering command:

```powershell
$env:PATH='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH; & 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.superpowers\npm-cli\package\bin\npm-cli.js' run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved seven-step|uploaded synthesis|preserves persistent setup|applicability-aware official standards|updates question readiness"
```

Covering output:

```text
Running 5 tests using 1 worker
ok ... approved seven-step lifecycle renders exactly seven bilingual buttons in order (497ms)
ok ... uploaded synthesis includes the searchable-PDF SOURCE block (884ms)
ok ... preserves persistent setup and structured design across transitions (680ms)
ok ... shows applicability-aware official standards links and review date (540ms)
ok ... updates question readiness while the final required field remains focused (587ms)
5 passed (5.2s)
```

### Retrospective Test Sensitivity

This is retrospective evidence only, not original RED evidence. With the approved source restored immediately afterward, the first lifecycle ID was temporarily mutated from `define-question` to `question` and the original lifecycle contract command was run unchanged:

```powershell
$env:PATH='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH; & 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.superpowers\npm-cli\package\bin\npm-cli.js' test -- tests/unit/catalog.test.js tests/unit/state.test.js tests/unit/i18n.test.js
```

Exact result:

```text
Test Files  2 failed | 1 passed (3)
Tests  3 failed | 104 passed (107)
FAIL ... contains the ten approved research families and seven approved lifecycle stages
AssertionError: expected [ 'question', …(6) ] to deeply equal [ 'define-question', …(6) ]
FAIL ... rejects former lifecycle identifiers
AssertionError: expected function to throw an error, but it didn't
FAIL ... preserves compatible fields across research-type and stage transitions
AssertionError: expected undefined to be 'Adults in Bangkok'
```

The complete unit count moved from `229` to `207` in the original task because the catalogue resolution matrix creates one test per research-family/stage pair: replacing 10 stages with 7 removes `10 * 3 = 30` generated tests, while Task 1 added 8 explicit unit tests (`229 - 30 + 8 = 207`). This round adds one prompt-separation test, so the current total is `208`.

### Teardown Diagnosis And Owned-Server Verification

The managed-web-server invocation completed both targeted assertions but did not exit, producing exit `124` after `120.6s`. The owned-server workflow demonstrates the cause is Playwright managed-server teardown, not application or test assertions:

1. Direct Node static server process was started for port `4173`; reachable HTTP status was `200` and the owned PID was `3040`.
2. The covering Chromium command above exited `0` with all five assertions passing.
3. Only PID `3040` was stopped and port `4173` no longer responded.

Exact cleanup output:

```text
Owned server PID 3040 stopped; port 4173 no longer responds.
```

### Complete Unit Verification

```powershell
$env:PATH='C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH; & 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.superpowers\npm-cli\package\bin\npm-cli.js' test -- --reporter=dot
```

Exact result:

```text
Test Files  9 passed (9)
Tests  208 passed (208)
```

Vitest retains the existing PDF.js `standardFontDataUrl` warning from `tests/unit/parsers.test.js`; it does not fail the suite.
