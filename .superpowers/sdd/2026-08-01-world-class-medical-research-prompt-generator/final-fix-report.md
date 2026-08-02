# Final Fix Wave Report

Date: 2026-08-02
Status: DONE
Worktree: `C:\Users\panja\OneDrive\Documents\Research assistant\.worktrees\world-class-medical-research`

## Scope and release posture

This single fix wave addresses every Important and Minor item in `final-review-findings.md`. The implementation remains a static browser application with no backend, accounts, persistence, analytics, cookies, network AI, or literature retrieval. Uploaded files and extracted evidence remain memory-only and source text is treated as untrusted data.

The result is application-level decision support, not scientific, statistical, ethics, legal, Thai PDPA, IRB, reporting-standard, animal-welfare, or AI-governance certification. Expert review remains required before use.

## Findings map

### Important 1: prompt governance and web evidence

- Code: `src/prompt-engine.js` now emits applicability-aware Thai PDPA, local IRB/institutional policy, Declaration of Helsinki 2024, ICMJE January 2026, WHO AI, EQUATOR, ICH-GCP, and animal-governance instructions.
- Code: web-research mode requires named databases and official sources, an exact search date, reproducible search terms, direct links, and DOI/PMID/registry or other stable identifiers where available. It explicitly forbids invented identifiers.
- Code: the final prompt section is a design-, stage-, evidence-, jurisdiction-, and family-tailored checkbox review list.
- Tests: `tests/unit/prompt-engine.test.js` covers planning, uploaded, web-research, governance, setup serialization, citations, and tailored reviewer scenarios. `tests/unit/catalog.test.js` covers the standards inputs consumed by the prompt.

### Important 2: persistent setup

- Code: `src/state.js` owns researcher role, experience level, scientific field, country/institution setting, target output, citation style, and structured study design as top-level persistent state.
- Code: `src/ui/render.js`, `src/i18n.js`, and `app.js` provide Thai/English controls and preserve values across research-family and lifecycle transitions.
- Code: `src/prompt-engine.js` serializes every setup value into the generated prompt; citation style is a real workspace control rather than a test-only value.
- Tests: `tests/unit/state.test.js`, `tests/unit/prompt-engine.test.js`, and `tests/e2e/workspace.spec.js` cover enum safety, transition persistence, focus stability, and prompt output.

### Important 3: structured design and applicability-aware standards

- Code: `src/catalog/research-types.js` preserves all 10 research families and adds explicit subtype/design choices, including underlying medical-education designs and combined implementation/economic evaluation.
- Code: `src/catalog/standards.js` defines explicit family/stage/design applicability predicates for all 25 catalogued standards and review date `2026-08-01`.
- Code: `src/catalog/index.js` resolves stage-specific and design-wide standards. `src/ui/render.js` shows official links and the review date.
- Tests: `tests/unit/catalog.test.js` has positive and forbidden mappings, including systematic review without PRISMA-ScR, cohort without RECORD, prediction external validation without TRIPOD+AI, AI imaging external validation without CONSORT-AI/DECIDE-AI/RECORD, medical-education inheritance, and implementation plus economics without SQUIRE.
- Tests: `tests/e2e/workspace.spec.js` verifies design persistence and live applicability changes in the standards panel.

### Important 4: in-flight parsing races

- Code: `src/evidence/core.js` creates stable internal source keys and merges parser updates only into currently existing keys while preserving current IDs and unrelated source objects.
- Code: `src/ui/evidence-workspace.js` emits keyed progress/final updates. `app.js` cancels operations by generation and never replaces current state with a stale whole-batch snapshot.
- Privacy: internal keys are omitted from public events and never shown in the UI.
- Tests: deterministic delayed-parser scenarios in `tests/e2e/workspace.spec.js` cover clearing uploaded mode, removing an extracting source, changing/removing existing sources during another parse, repeated Process activation, and per-batch cancellation.

### Important 5: mixed valid and invalid batches

- Code: `src/evidence/core.js` partitions each batch into accepted, retained rejected, and global-limit outcomes. Valid peers continue parsing.
- Code: excluded rows retain filename, type, size, localized reason, and remove action but no `File` object or extracted text.
- Safety: retained ready and excluded inventory is bounded at 10 rows across repeated batches; additional files produce a global `too-many-files` issue. Valid bytes remain bounded at 20 MiB per file and 60 MiB total.
- Tests: `tests/unit/evidence-core.test.js` covers mixed batches, count/byte boundaries, malformed sizes, repeated invalid batches, and bounded retained rows. `tests/e2e/workspace.spec.js` verifies valid peers and rejected inventory together.

### Important 6: empty and malformed non-PDF parsing

- Code: `src/evidence/parsers.js` uses fatal UTF-8 decoding, rejects empty text and image-only DOCX, distinguishes encrypted OOXML compound files, and performs minimal CSV, RIS, and BibTeX structural validation.
- Code: stable codes are translated in `src/i18n.js`; visible rows show only localized reasons while preserving a non-visible diagnostic attribute.
- Fixtures: `scripts/create-test-fixtures.mjs` and `tests/fixtures/` add real empty, invalid UTF-8, malformed CSV/RIS/BibTeX, image-only DOCX, and encrypted-OOXML signatures.
- OCR: no OCR path was added. Image-only PDF and DOCX remain excluded.
- Tests: `tests/unit/parsers.test.js`, `tests/unit/i18n.test.js`, and the image-only browser scenario cover these outcomes.

### Important 7: contextual warnings and resolvable controls

- Code: `src/catalog/index.js` exposes registration, ethics, data-sharing, and external-validation context controls only where applicable.
- Code: `src/validation.js` separates blockers from contextual warnings and limits external-validation warnings to external-validation designs.
- Code: `src/ui/render.js` renders blockers and considerations in separate regions.
- Tests: `tests/unit/validation.test.js`, `tests/unit/state.test.js`, and `tests/e2e/workspace.spec.js` verify applicability, visibility, resolution, and focus behavior.

### Important 8: release claims and browser coverage

- Documentation: `docs/content-review.md` records the six pre-fix Revise scenarios, corrected expected and forbidden outcomes, the bounded meaning of Pass, and unsigned expert review honestly.
- Config: `playwright.config.js` contains desktop Chromium, mobile Chromium, desktop Firefox, and desktop WebKit projects.
- Harness: the clipboard success test uses the real Chromium permission path and a standards-shaped clipboard spy on engines where Playwright does not expose `clipboard-write`; the application behavior assertion is unchanged.
- Execution: all four projects completed independently against the same owned external server with 28/28 tests each.

### Minor 1: source inventory and budget contributors

- Code: `src/ui/evidence-workspace.js` displays type, byte size, extracted character count, and full per-source budget contribution.
- Code: `src/evidence/core.js` identifies every selected ready contributor; over-budget UI names each source and its full count without truncation.
- Tests: `tests/unit/evidence-core.test.js` and `tests/e2e/workspace.spec.js` cover contribution math, labels, and no silent truncation.

### Minor 2: focus targets and non-color lifecycle status

- Code: `src/validation.js` maps upload, deidentification, and budget blockers to real control IDs.
- Code: `src/ui/render.js` searches for the first enabled focus target and supports source-row focus as a fallback.
- Code: lifecycle controls include a local Lucide icon, visible readiness text, and an accessible label; status is not communicated by color alone.
- Tests: browser tests cover upload/deidentification focus and visible icon/text status. Axe covers the rendered page and prompt drawer.

### Minor 3: structural sharing and event redaction

- Code: `src/state.js` uses structural sharing for field/setup transitions so source text is not cloned on each keystroke.
- Code: `createPublicWorkspaceState` emits source metadata and extracted length only. It excludes source text, `File` objects, and internal keys.
- Code: `app.js` publishes only the public projection in `workspace:statechange`.
- Tests: `tests/unit/state.test.js` verifies source identity preservation and exact public metadata. `tests/e2e/workspace.spec.js` proves the secret source string, file, and key do not enter public events.

## TDD evidence

All behavior changes began with a failing focused test. No existing requirement was weakened.

| Behavior wave | RED evidence | GREEN evidence |
| --- | --- | --- |
| Setup, prompt governance, and standards | Unit: 12 failed / 121 passed across the focused files. Browser: 2 targeted scenarios failed because controls/applicability were absent. | Unit: 133/133. Browser: 2/2. |
| Parser ownership, races, and mixed batches | Unit: 10 failed / 25 passed. Browser: three targeted regressions reproduced source resurrection/state overwrite/whole-batch rejection. | Unit: 35/35. Browser: 3/3. |
| Warnings, inventory, focus, lifecycle, event redaction, structural sharing | Unit: 4 failed / 147 passed. Browser: 4/4 new scenarios failed before implementation. | Unit: 151/151. Browser: 4/4. |
| Combined implementation/economic design | Catalog: 1 failed / 108 passed because the combined design and predicates were absent. | Catalog: 109/109. |
| Parser outcome localization | i18n: 7 failed / 1 passed because stable codes fell through untranslated. | i18n: 8/8. |
| Repeated invalid-batch inventory cap | Evidence core: 1 failed / 16 passed because excluded rows did not consume the retained-row cap. | Evidence core plus parser: 37/37. |
| Visible parser code removal | Chromium: 1/1 failed because `image-only-pdf` appeared in row text. | Chromium: 1/1; the localized reason remains and the code is diagnostic-only. |
| WebKit clipboard portability | WebKit full run: 27/28 passed; one harness failure reported `Unknown permission: clipboard-write`. | Targeted WebKit: 1/1, then full WebKit: 28/28. Chromium retains the real clipboard permission path. |

The pre-wave baseline was 166/166 unit tests and 20/20 tests in each configured Chromium project at that time.

## Final verification

### Literal scripts

- `npm run vendor`: PASS using the bundled Node/npm launcher paths from the task reports.
- `npm test`: PASS, 9 files and 200/200 tests.

### Focused suites

- Parser and evidence core: 37/37.
- Catalog, prompt governance, and validation: 139/139.
- Broader parser/core/catalog/prompt/state/validation set: 187/187 before the final inventory-cap test was added; the final complete unit run supersedes it at 200/200.
- Deterministic browser race/mixed-batch grep: 10/10 across desktop and mobile Chromium.
- Localized image-only outcome: 1/1 targeted Chromium after the visible-code fix.

### Playwright projects

Final isolated runs used one worker and the owned static server on `127.0.0.1:4173`.

| Project | Result | Axe included |
| --- | ---: | ---: |
| `desktop-chromium` | 28/28 passed | 1/1 passed |
| `mobile-chromium` | 28/28 passed | 1/1 passed |
| `desktop-firefox` | 28/28 passed | 1/1 passed |
| `desktop-webkit` | 28/28 passed | 1/1 passed |
| Total | 112/112 passed | 4/4 passed |

Browser installation evidence:

- Initial `install --list` contained Chromium only.
- The first Playwright-only `install firefox webkit` attempt failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
- Retrying the same command with the established `NODE_USE_SYSTEM_CA=1` convention succeeded and installed Firefox 153.0 (`firefox-1538`) and WebKit 26.5 (`webkit-2336`). TLS verification was not disabled.
- Firefox headless launch inside the restricted process sandbox timed out with Mozilla SWGL framebuffer initialization. A minimal permitted launch outside that process sandbox returned Firefox 153.0 in two seconds, and the complete project then passed 28/28 in that context.
- A later unified four-project run was manually interrupted mid-Firefox. Read-only command-line inspection proved the runner tree rooted at PID 29412; only that tree was stopped. Its incomplete output was not counted. Each project was then rerun independently to the final counts above.

### Responsive inspection

Live in-app browser inspection covered 1440x1000, 1024x768, 390x844, and 360x800, including top, form, validation, and standards views.

- 1440x1000: three-column workspace at 240 px / flexible / 280 px; no document overflow or incoherent overlap.
- 1024x768: regions measured 240 px / 489 px / 280 px within a 1009 px document; no horizontal overflow.
- 390x844: document width 375 px, setup/form/standards right edge 375 px, no page-level horizontal overflow. Lifecycle navigation intentionally scrolls within its own 375 px rail.
- 360x800: document width 345 px, zero setup controls out of bounds, no page-level horizontal overflow. Validation and standards stack below the form without overlap.
- Temporary viewport overrides were reset and the inspection tab was closed.

### Privacy, path, and hygiene

- `git diff --check`: PASS before this report; rerun after report and before commit.
- Static/privacy scan found no app `fetch`, `XMLHttpRequest`, storage, cookie, beacon, or console logging. The only `fetch` matches are local asset assertions in the GitHub Pages path E2E test.
- Every browser project passed the local-assets/GitHub Pages prefix test and the source-event redaction test.
- Operation cancellation, fresh per-batch deidentification, no-truncation, mixed parsing, and prompt source boundaries pass in every browser project.
- `test-results`, `playwright-report`, and `blob-report` were checked and removed. Owned server PID 4420 was stopped after the final runs. Unrelated PIDs 16820 and 24968 were left untouched.
- No ledger file was edited.

## Remaining conditions

No code or automated-test failure remains in scope. Qualified scientific, statistical, information-specialist, Thai-language, ethics, privacy, legal, Thai PDPA, local IRB, animal-welfare, and AI-governance review remains required before real-world use, as stated in the application and content-review matrix.
