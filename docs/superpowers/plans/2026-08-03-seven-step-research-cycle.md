# Seven-Step Research Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current ten-stage medical research lifecycle with the approved seven-step bilingual research cycle across state, adaptive forms, standards, prompts, tests, and the published GitHub Pages application.

**Architecture:** Treat the stage ID set as one shared contract and switch every unit-level consumer atomically so no commit leaves state, validation, standards, or prompt generation incompatible. Keep `src/catalog/lifecycle-stages.js` as the ordered source of truth; rendering and transitions remain catalogue-driven, while a second task covers browser behavior and accessibility end to end.

**Tech Stack:** Static HTML/CSS/ES modules, Vitest 4, Playwright 1.62, Axe, GitHub Pages.

## Global Constraints

- English lifecycle labels must match the seven approved labels exactly; Thai mode must use the approved academic translations.
- Lifecycle IDs must be exactly `define-question`, `literature-review`, `synthesize-information`, `identify-gaps`, `generate-hypotheses`, `outline-methodology`, and `write-proposal` in that order.
- The application must remain static, backend-free, account-free, analytics-free, cookie-free, and storage-free.
- Uploaded files must remain memory-only and locally parsed; no automatic literature retrieval or network AI may be introduced.
- Research families, structured study-design subtypes, evidence modes, de-identification safeguards, prompt export, and privacy behavior must remain functional.
- Standards remain decision support and must never be presented as approval, certification, registration, or compliance.
- Every production behavior change follows RED, GREEN, REFACTOR and receives a focused test before implementation.
- Design reference: `docs/superpowers/specs/2026-08-03-seven-step-research-cycle-design.md`.

## File Map

- `src/catalog/lifecycle-stages.js`: seven ordered IDs, English objectives, and shared adaptive fields.
- `src/state.js`: initial stage and target-output enum validation.
- `src/i18n.js`: bilingual stage labels, objectives, field labels, and target-output labels.
- `src/catalog/index.js`: contextual registration, ethics, data-sharing, and validation fields.
- `src/validation.js`: required fields, seven-entry readiness, and stage-aware warnings.
- `src/catalog/standards.js`: new-stage applicability for all 25 standards.
- `src/prompt-engine.js`: target-output serialization and seven-step task/governance contract.
- `src/ui/render.js`: generic lifecycle rendering and accessible names.
- `app.js`: generic stage transitions and focus restoration.
- `tests/unit/catalog.test.js`: lifecycle, adaptive fields, context fields, and standards mappings.
- `tests/unit/state.test.js`: initial state, stage/target enums, and transition preservation.
- `tests/unit/i18n.test.js`: exact bilingual copy and new field labels.
- `tests/unit/validation.test.js`: required fields, readiness, contextual controls, and warnings.
- `tests/unit/prompt-engine.test.js`: objectives, targets, stage-specific tasks, evidence boundaries, and governance.
- `tests/unit/prompt-drawer.test.js`: new-stage download metadata.
- `tests/e2e/workspace.spec.js`: seven-button UI, transitions, upload mode, prompt actions, and responsiveness.
- `tests/e2e/accessibility.spec.js`: Axe coverage of page and prompt drawer.
- `docs/content-review.md`: seven-step scientific content-review matrix and release evidence.

---

### Task 1: Atomic Seven-Step Core Contract

**Files:**
- Modify: `tests/unit/catalog.test.js`
- Modify: `tests/unit/state.test.js`
- Modify: `tests/unit/i18n.test.js`
- Modify: `tests/unit/validation.test.js`
- Modify: `tests/unit/prompt-engine.test.js`
- Modify: `tests/unit/prompt-drawer.test.js`
- Modify: `tests/e2e/workspace.spec.js`
- Modify: `src/catalog/lifecycle-stages.js`
- Modify: `src/state.js`
- Modify: `src/i18n.js`
- Modify: `src/catalog/index.js`
- Modify: `src/validation.js`
- Modify: `src/catalog/standards.js`
- Modify: `src/prompt-engine.js`

**Interfaces:**
- Produces: `LIFECYCLE_STAGES`, `STAGE_IDS`, `TARGET_OUTPUTS`, `createInitialState()`, `getContextFieldIds(typeId, stageId, studyDesignId)`, `getRequiredFieldIds(typeId, stageId)`, `resolveStandards(typeId, stageId, studyDesignId)`, and `buildPrompt(state)` using one compatible seven-ID contract.
- Stage object shape remains `{ id: string, task: string, commonFields: string[] }`.

- [ ] **Step 1: Write failing lifecycle, state, and localization tests**

Add these exact expectations before changing production code:

```js
const expectedStageIds = [
  "define-question",
  "literature-review",
  "synthesize-information",
  "identify-gaps",
  "generate-hypotheses",
  "outline-methodology",
  "write-proposal",
];

expect(LIFECYCLE_STAGES.map(stage => stage.id)).toEqual(expectedStageIds);
expect(LIFECYCLE_STAGES).toHaveLength(7);
expect(createInitialState().stageId).toBe("define-question");
expect(() => setStage(createInitialState(), "question")).toThrow(RangeError);

expect(t("en", "stages.define-question")).toBe("Step 1: Define the Research Question");
expect(t("en", "stages.write-proposal")).toBe("Step 7: Write a Research Proposal");
expect(t("th", "stages.define-question")).toBe("ขั้นที่ 1: กำหนดคำถามวิจัย");
expect(t("th", "stages.write-proposal")).toBe("ขั้นที่ 7: เขียนข้อเสนอโครงการวิจัย");
```

Assert that `TARGET_OUTPUTS` equals:

```js
[
  "stage-appropriate-deliverable",
  "research-question",
  "literature-review-strategy",
  "evidence-synthesis",
  "research-gap-analysis",
  "hypotheses-propositions",
  "methodology-outline",
  "research-proposal",
]
```

In `tests/e2e/workspace.spec.js`, add two tests before production changes: one expects exactly seven bilingual lifecycle buttons in the approved order; the other selects `synthesize-information`, runs the searchable-PDF uploaded-evidence flow, and expects a synthesis prompt containing the uploaded SOURCE block.

- [ ] **Step 2: Run lifecycle tests and verify RED**

Run:

```powershell
npm test -- tests/unit/catalog.test.js tests/unit/state.test.js tests/unit/i18n.test.js
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved seven-step|uploaded synthesis"
```

Expected: FAIL because ten former IDs exist, the initial state is `question`, the new translation and target keys are absent, and the two new browser scenarios cannot select the approved stages.

- [ ] **Step 3: Write failing adaptive-field and validation tests**

Add these exact shared requirements:

```js
expect(getRequiredFieldIds("observational", "define-question")).toEqual(["topic", "population", "researchQuestion"]);
expect(getRequiredFieldIds("observational", "literature-review")).toEqual(["topic", "researchQuestion", "informationSources", "searchStrategy"]);
expect(getRequiredFieldIds("observational", "synthesize-information")).toEqual(["topic", "researchQuestion", "evidenceSummary", "synthesisMethod"]);
expect(getRequiredFieldIds("observational", "identify-gaps")).toEqual(["topic", "researchQuestion", "researchGaps"]);
expect(getRequiredFieldIds("observational", "generate-hypotheses")).toEqual(["topic", "researchQuestion", "hypotheses"]);
expect(getRequiredFieldIds("observational", "outline-methodology")).toEqual(["topic", "population", "researchQuestion", "primaryOutcome", "methodologyOutline"]);
expect(getRequiredFieldIds("observational", "write-proposal")).toEqual(["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome", "methodologyOutline", "resourcesTimeline"]);
```

Add context assertions:

```js
expect(getContextFieldIds("evidence-review", "literature-review", "systematic-review")).toEqual(["registration"]);
expect(getContextFieldIds("observational", "literature-review", "cohort")).toEqual([]);
expect(getContextFieldIds("ai-health-data", "outline-methodology", "ai-external-validation")).toEqual(["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"]);
expect(getContextFieldIds("ai-health-data", "write-proposal", "ai-external-validation")).toEqual(["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"]);
```

Assert that `readinessByStage` has exactly the seven approved keys. Feasibility and ethics warnings must be limited to methodology/proposal; evidence-review registration must also appear during literature review.

- [ ] **Step 4: Run validation tests and verify RED**

Run:

```powershell
npm test -- tests/unit/validation.test.js tests/unit/catalog.test.js tests/unit/state.test.js
```

Expected: FAIL because required fields, context fields, readiness, and warnings still use former IDs.

- [ ] **Step 5: Write failing medical-standards mapping tests**

Add exact ordered assertions:

```js
expect(resolveStandards("observational", "define-question", "cohort").map(s => s.id)).toEqual([]);
expect(resolveStandards("observational", "outline-methodology", "cohort").map(s => s.id)).toEqual(["strobe"]);
expect(resolveStandards("ai-health-data", "outline-methodology", "ai-imaging-external-validation").map(s => s.id)).toEqual(["tripod-ai", "claim"]);
expect(resolveStandards("evidence-review", "literature-review", "systematic-review").map(s => s.id)).toEqual(["prisma-2020"]);
expect(resolveStandards("evidence-review", "synthesize-information", "systematic-review").map(s => s.id)).toEqual(["prisma-2020", "grade"]);
expect(resolveStandards("evidence-review", "identify-gaps", "systematic-review").map(s => s.id)).toEqual(["grade"]);
expect(resolveStandards("evidence-review", "write-proposal", "systematic-review").map(s => s.id)).toEqual(["prisma-p"]);
expect(resolveStandards("evidence-review", "literature-review", "scoping-review").map(s => s.id)).toEqual(["prisma-scr"]);
```

Retain independent negative assertions that cohort excludes RECORD, non-AI prediction excludes TRIPOD+AI, and AI imaging excludes unrelated AI trial guidance.

- [ ] **Step 6: Run catalogue tests and verify RED**

Run:

```powershell
npm test -- tests/unit/catalog.test.js
```

Expected: FAIL because all standards still refer to former stages.

- [ ] **Step 7: Write failing prompt-contract tests**

For `literature-review` in web-research mode, require the exact stage objective, named databases, exact search date, reproducible strategy, direct links, stable identifiers, and `Target output: Literature-review strategy`.

For `synthesize-information` with uploaded sources, require source-grounded synthesis, evidence-versus-interpretation separation, Source ID citation, and no web-search instruction.

For `generate-hypotheses`, assert:

```js
expect(prompt).toContain("testable hypotheses");
expect(prompt).toContain("research propositions");
expect(prompt).toContain("justified non-hypothesis approach");
```

For methodology and proposal, preserve applicable IRB, Thai PDPA, ICH-GCP, animal-welfare, AI-governance, standards, and expert-review wording. Check removed lifecycle serialization narrowly so ordinary scientific use of words such as evidence or proposal remains allowed:

```js
expect(prompt).not.toMatch(/Complete the (question|evidence|protocol|ethics-governance|analysis-plan|proposal|conduct-quality|analysis-interpretation|reporting|dissemination-impact) task/);
expect(prompt).toContain("Complete the write-proposal task");
```

- [ ] **Step 8: Run prompt tests and verify RED**

Run:

```powershell
npm test -- tests/unit/prompt-engine.test.js tests/unit/prompt-drawer.test.js
```

Expected: FAIL because target-output maps and governance checks still use former IDs and hypothesis alternatives are not explicit.

- [ ] **Step 9: Implement the seven-stage catalogue and bilingual copy**

Replace `LIFECYCLE_STAGES` with:

```js
export const LIFECYCLE_STAGES = [
  { id: "define-question", task: "Define a focused, significant, and feasible research question.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome"] },
  { id: "literature-review", task: "Plan and conduct a reproducible, critical review of relevant literature.", commonFields: ["topic", "population", "researchQuestion", "informationSources", "searchStrategy", "eligibilityCriteria"] },
  { id: "synthesize-information", task: "Critically synthesize source-supported information, limitations, and certainty.", commonFields: ["topic", "researchQuestion", "existingInformation", "evidenceSummary", "evidenceCertainty", "synthesisMethod"] },
  { id: "identify-gaps", task: "Identify and justify research gaps from the reviewed and synthesized information.", commonFields: ["topic", "researchQuestion", "evidenceSummary", "evidenceCertainty", "researchGaps"] },
  { id: "generate-hypotheses", task: "Generate testable hypotheses, research propositions, or a justified non-hypothesis approach.", commonFields: ["topic", "researchQuestion", "researchGaps", "hypotheses", "primaryOutcome"] },
  { id: "outline-methodology", task: "Outline a rigorous, feasible, ethical, and design-appropriate research methodology.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "hypotheses", "primaryOutcome", "methodologyOutline", "resourcesTimeline", "existingInformation"] },
  { id: "write-proposal", task: "Integrate the research question, evidence, gaps, hypotheses, and methodology into a research proposal.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "evidenceSummary", "researchGaps", "hypotheses", "primaryOutcome", "methodologyOutline", "resourcesTimeline", "existingInformation"] },
];
```

Set initial state to `define-question` and replace both target-output maps with the eight values from Step 1. Add these field labels:

```js
searchStrategy: ["กลยุทธ์การสืบค้น", "Search strategy"],
evidenceSummary: ["สรุปหลักฐาน", "Evidence summary"],
evidenceCertainty: ["ความเชื่อมั่นของหลักฐาน", "Evidence certainty"],
researchGaps: ["ช่องว่างการวิจัย", "Research gaps"],
hypotheses: ["สมมติฐานหรือข้อเสนอเชิงวิจัย", "Hypotheses or research propositions"],
methodologyOutline: ["โครงร่างระเบียบวิธีวิจัย", "Research methodology outline"],
```

Use the seven approved English labels and these Thai labels:

```js
[
  "ขั้นที่ 1: กำหนดคำถามวิจัย",
  "ขั้นที่ 2: ทบทวนวรรณกรรม",
  "ขั้นที่ 3: สังเคราะห์ข้อมูล",
  "ขั้นที่ 4: ระบุช่องว่างการวิจัย",
  "ขั้นที่ 5: สร้างสมมติฐาน",
  "ขั้นที่ 6: วางโครงร่างระเบียบวิธีวิจัย",
  "ขั้นที่ 7: เขียนข้อเสนอโครงการวิจัย",
]
```

- [ ] **Step 10: Implement validation and contextual controls**

Replace `STAGE_REQUIRED_FIELDS` with the seven arrays from Step 3. Preserve the existing research-family requirement merge.

Implement this context contract:

```js
const methodsStages = ["outline-methodology", "write-proposal"];
if (methodsStages.includes(stageId)) fields.push("registration", "ethicsApproval");
if (typeId === "evidence-review" && stageId === "literature-review") fields.push("registration");
if (methodsStages.includes(stageId) && ["observational", "prediction", "ai-health-data"].includes(typeId)) fields.push("dataSharingPlan");
if (methodsStages.includes(stageId) && ["prediction-external-validation", "ai-external-validation", "ai-imaging-external-validation"].includes(designId)) fields.push("externalValidation");
return [...new Set(fields)];
```

Match warning stages to the same conditions and continue deriving readiness from `LIFECYCLE_STAGES`.

- [ ] **Step 11: Remap all 25 standards**

Define:

```js
const METHODS_AND_PROPOSAL = ["outline-methodology", "write-proposal"];
const REVIEW_AND_SYNTHESIS = ["literature-review", "synthesize-information"];
const SYNTHESIS_AND_GAPS = ["synthesize-information", "identify-gaps"];
```

Map PRISMA 2020 and PRISMA-ScR to `REVIEW_AND_SYNTHESIS`, GRADE to `SYNTHESIS_AND_GAPS`, PRISMA-P to `METHODS_AND_PROPOSAL`, and every other standard's existing matching family/design rule to `METHODS_AND_PROPOSAL`. Preserve order, URLs, versions, family restrictions, and design restrictions.

- [ ] **Step 12: Implement the seven-step prompt contract**

Add a `STAGE_INSTRUCTIONS` map keyed by all seven IDs. The literature-review task must enforce reproducibility according to evidence mode; synthesis must separate sources from interpretation; gaps must distinguish documented gaps from assumptions; hypotheses must permit propositions or a justified non-hypothesis approach; methodology and proposal must request applicable analysis, ethics, governance, feasibility, reporting, and dissemination components.

Replace former reporting/dissemination governance checks with methodology/proposal checks. Keep `stage.task` as the lifecycle objective and retain all evidence boundaries, source escaping, citation rules, and human-review requirements.

- [ ] **Step 13: Update existing unit fixtures to new IDs**

Use semantic replacements in unit test state fixtures:

```text
question -> define-question
evidence -> literature-review
protocol -> outline-methodology
reporting -> write-proposal
```

Choose `synthesize-information`, `identify-gaps`, or `generate-hypotheses` instead when the test's behavior specifically concerns synthesis, gaps, or hypotheses. Do not add compatibility aliases for old IDs.

- [ ] **Step 14: Run the complete unit suite and verify GREEN**

Run:

```powershell
npm test -- --reporter=dot
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="approved seven-step|uploaded synthesis"
```

Expected: every unit test and both targeted browser scenarios pass; output contains no failed test file; `createInitialState()` passes preflight only after the new required fields are supplied.

- [ ] **Step 15: Commit the atomic core contract**

```powershell
git add src/catalog/lifecycle-stages.js src/state.js src/i18n.js src/catalog/index.js src/validation.js src/catalog/standards.js src/prompt-engine.js tests/unit/catalog.test.js tests/unit/state.test.js tests/unit/i18n.test.js tests/unit/validation.test.js tests/unit/prompt-engine.test.js tests/unit/prompt-drawer.test.js tests/e2e/workspace.spec.js
git commit -m "feat: replace research lifecycle with seven-step cycle"
```

### Task 2: Browser Workspace, Transitions, and Accessibility

**Files:**
- Modify: `tests/e2e/workspace.spec.js`
- Modify: `tests/e2e/accessibility.spec.js`
- Modify only if a failing test proves necessary: `src/ui/render.js`
- Modify only if a failing test proves necessary: `app.js`

**Interfaces:**
- Consumes: the seven-stage core contract from Task 1.
- Produces: verified lifecycle UI, stage transitions, upload workspace, prompt drawer, and responsive accessibility behavior.

- [ ] **Step 1: Complete the browser migration from the RED scenarios captured in Task 1**

Expand the existing RED rail test so it selects every `data-stage-id` and asserts `aria-current="step"`, the translated task description, and a unique adaptive field for that stage. Complete the uploaded-synthesis scenario with de-identification, processing, source inclusion, prompt generation, copy, and download checks.

- [ ] **Step 2: Update every former-stage browser selector**

Use the same semantic replacements as Task 1 Step 13. The transition modal test must move from `define-question` to `literature-review`: populate `problemStatement`, verify the modal names it, cancel once, then confirm and verify it is cleared while role, design, evidence mode, and citation style remain unchanged.

- [ ] **Step 3: Preserve the complete evidence and prompt regression surface**

Keep mixed-batch, race, cancellation, parser-localization, copy fallback, source redaction, and download scenarios. Update only the stage IDs and fields required by the new contract; do not weaken privacy or race assertions.

- [ ] **Step 4: Run desktop Chromium and make only evidence-backed corrections**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1
```

If accessible names fail, build each button name from the translated stage label plus readiness text while preserving the Lucide icon, visible status, stable dimensions, `aria-current`, focus restoration, and confirmation modal. If generic rendering already passes, do not edit `render.js` or `app.js`.

- [ ] **Step 5: Run all browser projects and Axe checks**

Run each project with one worker against one owned local server:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1
npm run test:e2e -- --project=mobile-chromium --workers=1
npm run test:e2e -- --project=desktop-firefox --workers=1
npm run test:e2e -- --project=desktop-webkit --workers=1
```

Expected: every configured test and all four Axe scenarios pass. On this Windows host, run Firefox in the established permitted process context if restricted SWGL framebuffer initialization times out.

- [ ] **Step 6: Commit browser coverage**

```powershell
git add tests/e2e/workspace.spec.js tests/e2e/accessibility.spec.js
git add src/ui/render.js app.js
git commit -m "test: verify seven-step research workspace"
```

The second `git add` stages nothing when no production UI correction was required.

### Task 3: Scientific Content Review and Documentation

**Files:**
- Modify: `docs/content-review.md`

**Interfaces:**
- Consumes: completed seven-step application.
- Produces: review scenarios that define bounded, expert-reviewed use of every new step.

- [ ] **Step 1: Replace former lifecycle scenarios**

Document seven scenarios: focused medical research question, reproducible literature review, source-grounded synthesis, documented gaps, design-appropriate hypotheses/propositions, methodology with applicable standards/governance, and integrated proposal.

For each scenario list:

```text
Expected: stage-specific structure, evidence boundary, uncertainties, applicable standards, and required human reviewers.
Forbidden: invented evidence or identifiers; unsupported gap claims; forced hypotheses for inappropriate designs; implied ethics, legal, registration, or standards compliance.
Review: subject expert plus methodologist, with statistician, information specialist, IRB/privacy, animal-welfare, or AI reviewer when applicable.
```

- [ ] **Step 2: Scan for stale lifecycle serialization**

Run:

```powershell
rg -n 'ethics-governance|analysis-plan|conduct-quality|analysis-interpretation|dissemination-impact|data-stage-id="question"|data-stage-id="evidence"|data-stage-id="protocol"|data-stage-id="reporting"' src app.js tests docs/content-review.md
```

Expected: no removed ID is used as lifecycle metadata. Domain phrases such as analysis plan or dissemination may remain only as proposal content.

- [ ] **Step 3: Commit content review**

```powershell
git add docs/content-review.md
git commit -m "docs: review seven-step research cycle"
```

### Task 4: Full Verification and GitHub Pages Publication

**Files:**
- Verify: every file changed in Tasks 1-3.

**Interfaces:**
- Consumes: completed implementation and review documentation.
- Produces: clean repository, pushed branch and `main`, and verified public application.

- [ ] **Step 1: Run vendor, unit, and hygiene checks**

Run:

```powershell
npm run vendor
npm test -- --reporter=dot
git diff --check
git status --short
```

Expected: vendor exits `0` without tracked changes; every unit test passes; diff check exits `0`; worktree is clean.

- [ ] **Step 2: Run the complete browser matrix again**

Run all four Playwright projects with one worker. Expected: all tests and Axe checks pass, no owned local server remains running, and generated `test-results`, `playwright-report`, or `blob-report` directories are removed after result capture.

- [ ] **Step 3: Verify the remote ancestry and publish**

Run:

```powershell
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
git push origin codex/world-class-medical-research
git push origin HEAD:main
```

Expected: remote `main` is an ancestor of `HEAD`; both pushes fast-forward without force.

- [ ] **Step 4: Verify the public GitHub Pages application**

Reload `https://panjaratsow.github.io/research-prompt-generator/` after deployment. Confirm exactly seven bilingual lifecycle buttons, select uploaded-document mode, confirm the local-only multi-file control renders, generate one planning-mode prompt using a new stage, and verify no browser console errors. Keep the public app tab open for the user.
