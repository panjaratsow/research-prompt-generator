# Task 5 Report: Structured Prompt Serialization

## Status

Implemented and verified; this report is included in the Task 5 commit described below.

## Files

- Modified `src/prompt-engine.js`.
- Modified `tests/unit/prompt-engine.test.js`.
- Added this required Task 5 report.

## Design Choices

- Replaced raw `fields` object formatting with catalogue-driven `Inherited context`, `Structured decisions`, `Derived stage product`, and `Advanced details` sections.
- Reused the typed field-value contract for localized field/option labels, custom Other text, and deterministic catalogue-order multi-select output. Populated Advanced fields serialize even while their disclosure is closed.
- Read current derived product text and ownership from `state.drafts`; customized text is labelled `user-customized`, while an owned default remains a `suggested template`.
- Excluded Not sure values from ordinary context and emitted only catalogue fields that explicitly permit Not sure in the unresolved block. Evidence-mode, deidentification, privacy, registration, approval, and governance blockers are not converted into optional decision support.
- Marked `evidencePattern` as a user-supplied provisional assessment and instructed downstream verification only within the selected Planning, Uploaded SOURCE-only, or Web research evidence boundary. The prompt never treats the selection as a browser-verified finding.
- Added experience-specific explanation depth only in section 1. Methodological quality, Advanced serialization, standards, evidence boundaries, governance, citations, limitations, and human review remain independent of experience.
- Preserved the existing 11-section non-uploaded and 12-section uploaded ordering and all SOURCE escaping, named-database, search-date, link/identifier, Thai PDPA, IRB, ICMJE, EQUATOR, AI governance, standards, citation, limitations, and expert-review text.
- Added no dependency, API, storage, or network behavior.

## RED Evidence

Requested command:

```powershell
npm test -- tests/unit/prompt-engine.test.js
```

Exact result: exit 1 because npm is unavailable: `npm : The term 'npm' is not recognized as the name of a cmdlet, function, script file, or operable program.`

Bundled-runtime handoff baseline:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run tests/unit/prompt-engine.test.js
```

Exact result: exit 1; `Test Files 1 failed (1)`; `Tests 28 failed | 2 passed (30)`. Every failure was a preflight `PreflightError` caused by fixtures that omitted or used retired values for the new required Simple decisions.

After repairing fixtures and adding Task 5 assertions, before production edits, the same bundled-runtime command produced: exit 1; `Test Files 1 failed (1)`; `Tests 9 failed | 30 passed (39)`. The failures were the expected missing structured context, missing exported builders, missing unresolved-decision instructions, and missing explanation-depth guidance.

## GREEN Evidence

Prompt suite:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run tests/unit/prompt-engine.test.js
```

Exact result: exit 0; `Test Files 1 passed (1)`; `Tests 39 passed (39)`.

Focused prompt/evidence/parser rail:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run tests/unit/prompt-engine.test.js tests/unit/evidence-core.test.js tests/unit/parsers.test.js
```

Exact result: exit 0; `Test Files 3 passed (3)`; `Tests 100 passed (100)`.

Full unit suite:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run
```

Exact result: exit 0; `Test Files 12 passed (12)`; `Tests 521 passed (521)`.

Syntax check:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src/prompt-engine.js
```

Exact result: exit 0 with no output.

## Commit

`feat: serialize adaptive research decisions` (this Task 5 commit).

## Self-Review

- Reviewed the complete scoped diff and confirmed no evidence-boundary, SOURCE block, standards, governance, citation, limitations, or human-review function was weakened or removed.
- Confirmed populated hidden Advanced fields serialize independently of `advancedOpenByStage`, and experience changes only the explanation-depth sentence.
- Confirmed selected evidence patterns remain explicitly user-supplied and provisional in every evidence mode; Planning mode still forbids evidence claims and Uploaded mode remains SOURCE-only.
- Confirmed unresolved instructions are emitted only for fields with `allowNotSure`, are deduplicated in catalogue order, and request exactly 2-3 options plus rationale, limitations, and information needed for a human decision.
- Confirmed the repaired fixtures use valid typed decision IDs and arrays under the Task 4 validation contract while retaining every prior prompt safeguard assertion.
- `git diff --check` reported no whitespace errors; Node syntax and all required tests pass.

## Review Fix: Localized Labels and Verbatim Text

### Status

Resolved the Task 5 high finding. Prompt serialization now preserves short-text and derived-text state values verbatim, while every canonical adaptive field and every prompt-facing base, research-family, design-analysis, study-design, uploaded-source, Other, and Not sure option resolves through authored Thai and English copy.

### Files

- Modified `src/prompt-engine.js`.
- Modified `src/i18n.js` under the approved essential scope expansion for Task 6 bilingual copy.
- Modified `tests/unit/prompt-engine.test.js`.
- Modified `tests/unit/i18n.test.js`.
- Updated this report.

### Design Choices

- Kept free-text handling in the prompt engine: `short-text` and `derived-text` controls read their normalized state string directly, so medical punctuation and casing such as `anti-HBs and eGFR` are not treated as option IDs or localized twice.
- Kept select and multi-select handling on `serializeDisplayValue()` so deterministic catalogue order, custom Other text, Not sure behavior, and localized option labels remain unchanged.
- Added explicit Thai/English field and option copy in `src/i18n.js`; study-design option copy reuses the existing localized design catalogue, with a concise authored `Cohort`/`โคฮอร์ต` prompt label to preserve the existing draft-composer grammar.
- Added an exhaustive i18n test generated from the catalogue rather than a hand-maintained subset. A newly added adaptive key now fails tests if either locale returns the raw key.
- Did not change evidence boundaries, SOURCE escaping, provisional evidence-pattern handling, standards, governance, citations, limitations, or human-review instructions.

### RED Evidence

Command:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run tests/unit/prompt-engine.test.js tests/unit/i18n.test.js
```

Exact result before production edits: exit 1; `Test Files 2 failed (2)`; `Tests 5 failed | 56 passed (61)`. Failures showed `fields.questionType`, English-only `Prognosis`, and mutated/duplicated `Anti HBs and eGFR` output instead of authored localized labels and verbatim text.

### GREEN Evidence

Required focused prompt+i18n command:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run tests/unit/prompt-engine.test.js tests/unit/i18n.test.js
```

Exact result: exit 0; `Test Files 2 passed (2)`; `Tests 61 passed (61)`.

The first full-suite run exposed one draft-composer grammar regression (`cohort study study methodology`), caused by reusing the setup control's full design name as an inline option. After adding the concise authored prompt label, the focused prompt+i18n+draft rail produced: `Test Files 3 passed (3)`; `Tests 76 passed (76)`.

Full unit suite:

```powershell
& 'C:\Users\panja\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run
```

Exact result: exit 0; `Test Files 12 passed (12)`; `Tests 526 passed (526)`.

### Commit

`fix: preserve localized research prompt values` (this review-fix commit).

### Self-Review

- Confirmed the prompt-engine diff changes only display-value selection for text controls; section ordering and every safety/evidence/governance function are untouched.
- Confirmed Thai, English, and bilingual prompt tests cover a normal dynamic select, hyphenated mixed-case short text, and inherited derived text without raw `fields.*` or `options.*` keys.
- Confirmed exhaustive catalogue localization covers both locales, including study designs and sentinel options.
- `git diff --check` reports no whitespace errors; focused and full unit verification are green.
