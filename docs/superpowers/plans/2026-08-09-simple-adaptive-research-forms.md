# Simple Adaptive Research Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current text-heavy seven-stage forms with concise, metadata-driven Simple + Advanced controls that carry research context forward, generate editable deterministic drafts, and preserve all evidence, privacy, standards, and expert-review safeguards.

**Architecture:** Keep the static browser-only architecture and make one adaptive field catalogue the source of truth for stage placement, control type, option compatibility, requiredness, and prompt serialization. Extend immutable state with typed field values, custom Other text, disclosure state, and owned derived drafts; then let validation, rendering, transitions, and prompt generation consume the same catalogue so UI behavior and generated prompts cannot drift.

**Tech Stack:** Static HTML/CSS, browser ES modules, Vitest 4, Playwright 1.62, Axe, GitHub Pages; no new runtime dependency and no backend or AI API.

## Global Constraints

- Design reference: `docs/superpowers/specs/2026-08-09-simple-adaptive-research-forms-design.md`.
- The ordered lifecycle remains exactly the approved seven stages from `define-question` through `write-proposal`.
- The normal Simple section has at most five required decisions per stage; a derived editable preview does not count as a decision.
- Advanced details remain collapsed by default for every experience level, and collapsing never clears values.
- `Other - specify` requires adjacent custom text and confirms before clearing populated custom text.
- `Not sure - ask AI to recommend` satisfies normal methodological decisions but is forbidden for deidentification, identifiable-data, evidence-budget, uploaded-source availability, and approval or registration claims.
- Derived drafts are deterministic templates only; the browser never interprets uploaded or web evidence and never converts a selection into a verified factual claim.
- A user-edited derived draft is protected by `customized: true` until `Restore suggested text` is activated.
- Target output lists all supported outputs; selecting an explicit output navigates to its mapped lifecycle stage.
- Research-type and study-design transitions list and confirm every incompatible populated value, including hidden Advanced values, before clearing it.
- Uploaded files remain memory-only and locally parsed; downstream AI receives only included ready `SOURCE` blocks in uploaded mode.
- Existing evidence boundaries, privacy blockers, evidence budgets, source traceability, standards, governance instructions, citation rules, and human-review checklists remain intact.
- The interface remains bilingual, keyboard operable, WCAG A/AA clean under Axe, mobile-safe, and compatible with the `/research-prompt-generator/` GitHub Pages prefix.
- Every production change follows RED, GREEN, REFACTOR and receives a focused test before implementation.

## File Map

- `src/catalog/adaptive-options.js`: language-neutral option IDs and research-family option overlays.
- `src/catalog/adaptive-fields.js`: field definitions, stage placements, predicates, tier, requiredness, and option resolution.
- `src/catalog/index.js`: public exports for adaptive catalogue queries.
- `src/field-values.js`: typed value normalization, completeness, display-label serialization, Other, Not sure, and stale-option detection.
- `src/draft-composer.js`: deterministic seven-stage draft composition and draft ownership helpers.
- `src/state.js`: immutable typed fields, custom values, drafts, disclosures, target-output navigation, and compatibility transitions.
- `src/validation.js`: catalogue-driven required decisions, actionable readiness objects, stale values, draft errors, warnings, and unchanged global evidence blockers.
- `src/prompt-engine.js`: normalized inherited, structured, Advanced, customized, and unresolved-decision prompt sections.
- `src/ui/adaptive-form.js`: accessible control renderers, context strip, profile and Advanced disclosures, conditional Other input, and draft preview.
- `src/ui/dom.js`: shared DOM element/option helpers used by the workspace and adaptive renderer.
- `src/ui/render.js`: workspace composition, lifecycle readiness text, validation summary, standards, and focus helpers.
- `src/i18n.js`: bilingual labels, help, option names, readiness text, disclosure copy, and validation messages.
- `app.js`: delegated typed-field events, disclosure actions, draft restore, focus restoration, and confirmed type/design/target transitions.
- `styles.css`: compact setup, context strip, checkbox chips, segmented controls, disclosures, draft states, responsive layout, and visible focus.
- `tests/unit/adaptive-fields.test.js`: stage maps, all-family/design option resolution, Simple limits, and Not sure safety.
- `tests/unit/field-values.test.js`: typed values, custom Other, stale IDs, Not sure, and deterministic labels.
- `tests/unit/draft-composer.test.js`: seven composers, customization protection, locale updates, and recovery behavior.
- `tests/unit/state.test.js`: carry-forward, disclosures, target navigation, and transition clearing.
- `tests/unit/validation.test.js`: actionable readiness, typed requiredness, design-critical fields, and global blockers.
- `tests/unit/prompt-engine.test.js`: structured serialization and safeguard regressions in all evidence and output-language modes.
- `tests/unit/i18n.test.js`: exact bilingual UI and option copy.
- `tests/e2e/workspace.spec.js`: all-family workflows, controls, target navigation, carry-forward, Advanced persistence, confirmation, and mobile behavior.
- `tests/e2e/accessibility.spec.js`: Axe and keyboard coverage for Simple, Advanced, Other, and prompt drawer states.
- `docs/content-review.md`: scientific and release review evidence for the new adaptive forms.

---

### Task 1: Adaptive Field and Option Catalogue

**Files:**
- Create: `src/catalog/adaptive-options.js`
- Create: `src/catalog/adaptive-fields.js`
- Create: `tests/unit/adaptive-fields.test.js`
- Modify: `src/catalog/index.js`

**Interfaces:**
- Produces: `OTHER_OPTION_ID`, `NOT_SURE_OPTION_ID`, `DERIVED_FIELD_BY_STAGE`, `getFieldDefinition(fieldId)`, `getStageFieldDefinitions(context)`, `getInheritedContextFields(context)`, `getCompatibleFieldIds(context)`, `resolveFieldOptions(fieldId, context)`, and `isFieldOptionCompatible(fieldId, optionId, context)`.
- `context` is `{ researchTypeId: string, studyDesignId: string, stageId: string, evidenceMode: "planning" | "uploaded" | "web-research", fields: Record<string, string | string[]> }`.
- `getStageFieldDefinitions()` returns `{ simple: ResolvedFieldDefinition[], advanced: ResolvedFieldDefinition[], draft: ResolvedFieldDefinition }` in deterministic display order; each resolved definition flattens the active placement's `required` and `designCritical` flags onto the base definition.
- A `FieldDefinition` has `{ id, labelKey, helpKey, control, tier, placements, optionSetId?, allowOther?, allowNotSure?, canonical?, inherited?, composeInto? }`; each placement has `{ stageId, tier, required, visible?, designCritical? }`.

- [ ] **Step 1: Write the failing stage-map and Simple-limit tests**

Create `tests/unit/adaptive-fields.test.js` with the exact stage contract:

```js
import { describe, expect, it } from "vitest";
import { LIFECYCLE_STAGES, RESEARCH_TYPES, getStageFieldDefinitions } from "../../src/catalog/index.js";

const SIMPLE_FIELDS = {
  "define-question": ["topic", "population", "questionType", "primaryOutcome"],
  "literature-review": ["informationSources", "dateCoverage", "evidenceTypes", "searchConcepts"],
  "synthesize-information": ["evidencePattern", "synthesisMethod", "evidenceCertainty", "mainLimitations"],
  "identify-gaps": ["gapType", "gapEvidenceSupport", "gapContext", "gapPriority"],
  "generate-hypotheses": ["hypothesisApproach", "interventionOrExposure", "hypothesisOutcome", "expectedDirection"],
  "outline-methodology": ["confirmedDesign", "dataSourceRecruitment", "samplingApproach", "analysisFamily", "feasibilityPeriod"],
  "write-proposal": ["proposalType", "targetAudience", "requiredSections", "proposalTimeline"],
};

const DRAFT_FIELDS = {
  "define-question": "researchQuestion",
  "literature-review": "searchStrategy",
  "synthesize-information": "evidenceSummary",
  "identify-gaps": "researchGaps",
  "generate-hypotheses": "hypotheses",
  "outline-methodology": "methodologyOutline",
  "write-proposal": "proposalOutline",
};

for (const type of RESEARCH_TYPES) {
  for (const design of type.designs) {
    for (const stage of LIFECYCLE_STAGES) {
      it(`${type.id}/${design.id}/${stage.id} resolves an ordered usable form`, () => {
        const form = getStageFieldDefinitions({
          researchTypeId: type.id,
          studyDesignId: design.id,
          stageId: stage.id,
          evidenceMode: "planning",
          fields: {},
        });
        expect(form.simple.filter(field => field.required).length).toBeGreaterThan(0);
        expect(form.simple.filter(field => field.required).length).toBeLessThanOrEqual(5);
        expect(form.draft.id).toBe(DRAFT_FIELDS[stage.id]);
        expect(form.simple.map(field => field.id)).toEqual(expect.arrayContaining(SIMPLE_FIELDS[stage.id]));
      });
    }
  }
}
```

Add an explicit assertion that every field ID is unique, every placement references an approved stage, every select/multi-select/segmented field resolves at least one option, and every catalogued field has label and help keys. Also union every ID returned by the current `getAdaptiveFieldIds()` matrix and assert that `getFieldDefinition(id)` exists, so the catalogue migration cannot break an existing visible field before the new renderer lands.

Add design/mode assertions:

```js
function context(researchTypeId, studyDesignId, evidenceMode) {
  return { researchTypeId, studyDesignId, stageId: "outline-methodology", evidenceMode, fields: {} };
}

expect(resolveFieldOptions("analysisFamily", context("observational", "cohort", "planning")))
  .not.toEqual(resolveFieldOptions("analysisFamily", context("observational", "case-control", "planning")));
expect(resolveFieldOptions("informationSources", context("observational", "cohort", "uploaded")).map(option => option.id))
  .toContain("uploaded-source-set");
expect(resolveFieldOptions("informationSources", context("observational", "cohort", "planning")).map(option => option.id))
  .not.toContain("uploaded-source-set");
```

- [ ] **Step 2: Run the catalogue test and verify RED**

Run:

```powershell
npm test -- tests/unit/adaptive-fields.test.js
```

Expected: FAIL because the adaptive catalogue modules and exports do not exist.

- [ ] **Step 3: Implement the option constants and research-family overlays**

Create `src/catalog/adaptive-options.js` with stable sentinels and deterministic arrays. Use these exact cross-family sets:

```js
export const OTHER_OPTION_ID = "other";
export const NOT_SURE_OPTION_ID = "not-sure";

export const BASE_OPTION_SETS = Object.freeze({
  "date-coverage": ["last-5-years", "last-10-years", "from-inception", "custom-range"],
  "evidence-types": ["randomized-trials", "observational-studies", "systematic-reviews", "qualitative-studies", "guidelines", "registries", "grey-literature"],
  "evidence-pattern": ["consistent", "mixed", "limited", "conflicting", "not-yet-assessed"],
  "evidence-certainty": ["high", "moderate", "low", "very-low", "not-yet-assessed"],
  "main-limitations": ["risk-of-bias", "imprecision", "inconsistency", "indirectness", "publication-bias", "sparse-evidence"],
  "grey-literature": ["trial-registry", "thesis", "conference", "government-report", "preprint"],
  "gap-type": ["population", "intervention-exposure", "comparator", "outcome", "method", "setting", "implementation", "equity"],
  "gap-evidence-support": ["multiple-sources", "single-source", "expert-observation", "not-yet-verified"],
  "gap-priority": ["high", "medium", "exploratory"],
  "hypothesis-approach": ["directional", "non-directional", "research-proposition", "exploratory-no-hypothesis"],
  "expected-direction": ["increase", "decrease", "difference-no-direction", "association-no-direction", "not-applicable"],
  "sampling-approach": ["probability", "consecutive", "purposive", "convenience", "census", "theoretical", "not-yet-decided"],
  "feasibility-period": ["under-6-months", "6-12-months", "13-24-months", "over-24-months"],
  "proposal-type": ["student-proposal", "institutional-protocol", "grant-proposal", "ethics-submission-draft", "registry-protocol"],
  "target-audience": ["supervisor-committee", "institutional-review", "funding-panel", "ethics-committee", "multidisciplinary-team"],
  "required-sections": ["background", "objectives", "methods", "analysis", "ethics-governance", "timeline", "budget", "dissemination"],
  "proposal-timeline": ["concept-only", "6-months", "12-months", "24-months", "over-24-months"],
});
```

Implement `TYPE_OPTION_SETS` with one entry for every current research family. Each entry must provide `questionType`, `informationSources`, `synthesisMethod`, `analysisFamily`, and `dataSourceRecruitment` arrays.

| Research type | `questionType` | `informationSources` | `synthesisMethod` | `analysisFamily` |
| --- | --- | --- | --- | --- |
| randomized-trial | effectiveness, safety, non-inferiority, equivalence | medline, embase, central, trial-registries | narrative, pairwise-meta-analysis, certainty-assessment | intention-to-treat, per-protocol, mixed-model, survival |
| observational | association, risk-factor, incidence-prevalence, prognosis | medline, embase, citation-index, registry-data | narrative, quantitative-pooling, certainty-assessment | regression, survival, propensity-score, causal-inference |
| diagnostic | diagnostic-accuracy, threshold, clinical-utility | medline, embase, diagnostic-reviews, trial-registries | diagnostic-narrative, diagnostic-meta-analysis, certainty-assessment | sensitivity-specificity, roc-analysis, likelihood-ratios, decision-curve |
| prediction | model-development, internal-validation, external-validation, model-updating | medline, embase, model-registries, citation-index | prediction-narrative, performance-pooling, certainty-assessment | development, calibration-discrimination, external-validation, impact-analysis |
| evidence-review | effectiveness, etiology, diagnosis, prognosis, scope-map | medline, embase, central, cinahl, psycinfo, eric, grey-literature | narrative, pairwise-meta-analysis, network-meta-analysis, framework-synthesis | narrative-synthesis, random-effects-meta-analysis, thematic-synthesis, evidence-map |
| qualitative-mixed | experience, meaning, process, acceptability, implementation | medline, cinahl, psycinfo, citation-index, grey-literature | thematic-synthesis, framework-synthesis, meta-ethnography, mixed-methods-integration | thematic-analysis, framework-analysis, grounded-theory, mixed-methods-integration |
| medical-education | learning-effectiveness, assessment-validity, curriculum, learner-experience | medline, eric, cinahl, psycinfo, scopus | narrative, quantitative-pooling, thematic-synthesis, mixed-methods-integration | group-comparison, repeated-measures, psychometric, qualitative-analysis |
| laboratory-animal | mechanism, efficacy, toxicity, translational-validity | medline, embase, biosis, preclinical-registries | narrative, preclinical-meta-analysis, mechanistic-synthesis | group-comparison, dose-response, repeated-measures, survival |
| ai-health-data | model-development, internal-validation, external-validation, fairness, clinical-utility | medline, embase, ieee-xplore, model-registries, trial-registries | ai-narrative, performance-pooling, bias-fairness-synthesis | development, calibration-discrimination, external-validation, fairness-analysis, impact-analysis |
| implementation-qi-economic | implementation-effectiveness, quality-improvement, cost-effectiveness, budget-impact | medline, embase, cinahl, economic-databases, grey-literature | narrative, realist-synthesis, economic-synthesis, mixed-methods-integration | implementation-outcomes, interrupted-time-series, cost-effectiveness, budget-impact |

Use these exact `dataSourceRecruitment` overlays:

```js
{
  "randomized-trial": ["clinic-recruitment", "community-recruitment", "registry-recruitment", "cluster-recruitment"],
  observational: ["prospective-recruitment", "retrospective-records", "registry-data", "survey-sampling"],
  diagnostic: ["consecutive-clinical-sample", "case-control-sample", "screening-program", "archived-specimens"],
  prediction: ["prospective-cohort", "retrospective-dataset", "registry-data", "multicentre-dataset"],
  "evidence-review": ["published-literature", "registries", "grey-literature", "stakeholder-sources"],
  "qualitative-mixed": ["purposive-recruitment", "maximum-variation", "theoretical-sampling", "survey-plus-interviews"],
  "medical-education": ["learner-cohort", "course-enrolment", "program-records", "multisite-recruitment"],
  "laboratory-animal": ["laboratory-samples", "animal-colony", "biobank-specimens", "experimental-model"],
  "ai-health-data": ["retrospective-dataset", "prospective-data", "registry-data", "multicentre-external-data"],
  "implementation-qi-economic": ["routine-service-data", "prospective-sites", "quality-registry", "administrative-cost-data"],
}
```

Add `DESIGN_ANALYSIS_FAMILIES` so study subtype changes the available analysis choices as well as the research-family overlay:

```js
export const DESIGN_ANALYSIS_FAMILIES = Object.freeze({
  "randomized-controlled-trial": ["intention-to-treat", "per-protocol", "mixed-model", "survival"],
  "cluster-randomized-trial": ["cluster-adjusted-regression", "mixed-model", "generalized-estimating-equations"],
  "pragmatic-randomized-trial": ["intention-to-treat", "mixed-model", "survival", "implementation-outcomes"],
  cohort: ["regression", "survival", "propensity-score", "causal-inference"],
  "case-control": ["logistic-regression", "matched-analysis", "propensity-score"],
  "cross-sectional": ["prevalence-estimation", "regression", "survey-weighted-analysis"],
  "routinely-collected-observational": ["regression", "survival", "causal-inference", "interrupted-time-series"],
  "diagnostic-accuracy": ["sensitivity-specificity", "roc-analysis", "likelihood-ratios", "decision-curve"],
  "prediction-development": ["development", "calibration-discrimination", "internal-validation"],
  "prediction-internal-validation": ["bootstrap-validation", "cross-validation", "calibration-discrimination"],
  "prediction-external-validation": ["external-validation", "calibration-discrimination", "model-updating"],
  "systematic-review": ["narrative-synthesis", "random-effects-meta-analysis", "certainty-assessment"],
  "meta-analysis": ["fixed-effect-meta-analysis", "random-effects-meta-analysis", "network-meta-analysis", "meta-regression"],
  "scoping-review": ["evidence-map", "descriptive-summary", "framework-synthesis"],
  "qualitative-study": ["thematic-analysis", "framework-analysis", "grounded-theory"],
  "mixed-methods": ["convergent-integration", "explanatory-sequential", "exploratory-sequential"],
  "education-observational": ["group-comparison", "regression", "repeated-measures"],
  "education-randomized-trial": ["intention-to-treat", "mixed-model", "repeated-measures"],
  "education-qualitative": ["thematic-analysis", "framework-analysis", "grounded-theory"],
  "education-mixed-methods": ["convergent-integration", "explanatory-sequential", "exploratory-sequential"],
  "education-quality-improvement": ["run-chart", "statistical-process-control", "interrupted-time-series"],
  "animal-study": ["group-comparison", "dose-response", "repeated-measures", "survival"],
  "laboratory-study": ["group-comparison", "dose-response", "repeated-measures", "assay-validation"],
  "ai-model-development": ["development", "calibration-discrimination", "internal-validation"],
  "ai-internal-validation": ["bootstrap-validation", "cross-validation", "calibration-discrimination"],
  "ai-external-validation": ["external-validation", "calibration-discrimination", "fairness-analysis"],
  "ai-medical-imaging": ["development", "calibration-discrimination", "reader-comparison"],
  "ai-imaging-external-validation": ["external-validation", "reader-comparison", "fairness-analysis"],
  "ai-interventional-trial": ["intention-to-treat", "mixed-model", "clinical-impact-analysis"],
  "ai-early-clinical-evaluation": ["usability-analysis", "workflow-analysis", "early-performance-analysis"],
  "ai-routinely-collected-data": ["external-validation", "causal-inference", "fairness-analysis"],
  "implementation-study": ["implementation-outcomes", "mixed-model", "realist-evaluation"],
  "quality-improvement": ["run-chart", "statistical-process-control", "interrupted-time-series"],
  "economic-evaluation": ["cost-effectiveness", "cost-utility", "budget-impact"],
  "implementation-economic-evaluation": ["implementation-outcomes", "cost-effectiveness", "budget-impact"],
});
```

`resolveOptionIds(optionSetId, context)` must prefer the design override for `analysisFamily`, then use the type overlay for the five dynamic sets and a base set otherwise. When `fieldId === "informationSources"` and `evidenceMode === "uploaded"`, prefix `uploaded-source-set`; do not expose that option in Planning or Web research. Append `other` and `not-sure` only when the field definition permits them.

- [ ] **Step 4: Implement the field catalogue and query functions**

Create `src/catalog/adaptive-fields.js` with these exact stage placements:

```js
export const STAGE_FORM_FIELDS = Object.freeze({
  "define-question": {
    simple: ["topic", "population", "questionType", "primaryOutcome"],
    advanced: ["problemStatement", "comparator", "endpointTiming", "additionalObjectives"],
    draft: "researchQuestion",
  },
  "literature-review": {
    simple: ["informationSources", "dateCoverage", "evidenceTypes", "searchConcepts"],
    advanced: ["booleanQuery", "eligibilityCriteria", "greyLiterature", "languageDesignLimits"],
    draft: "searchStrategy",
  },
  "synthesize-information": {
    simple: ["evidencePattern", "synthesisMethod", "evidenceCertainty", "mainLimitations"],
    advanced: ["effectMeasures", "heterogeneity", "riskOfBiasTool", "subgroupSensitivity"],
    draft: "evidenceSummary",
  },
  "identify-gaps": {
    simple: ["gapType", "gapEvidenceSupport", "gapContext", "gapPriority"],
    advanced: ["noveltyCheck", "stakeholderRelevance", "certaintyRationale", "generalizability"],
    draft: "researchGaps",
  },
  "generate-hypotheses": {
    simple: ["hypothesisApproach", "interventionOrExposure", "hypothesisOutcome", "expectedDirection"],
    advanced: ["mechanism", "alternativeHypotheses", "causalAssumptions", "effectModification"],
    draft: "hypotheses",
  },
  "outline-methodology": {
    simple: ["confirmedDesign", "dataSourceRecruitment", "samplingApproach", "analysisFamily", "feasibilityPeriod"],
    advanced: ["sampleSizePlan", "confounders", "missingDataPlan", "sensitivityAnalysis", "ethicsGovernance"],
    draft: "methodologyOutline",
  },
  "write-proposal": {
    simple: ["proposalType", "targetAudience", "requiredSections", "proposalTimeline"],
    advanced: ["budget", "registration", "dataSharingPlan", "disseminationPlan", "authorshipPlan", "detailedGovernance"],
    draft: "proposalOutline",
  },
});

export const DERIVED_FIELD_BY_STAGE = Object.freeze(Object.fromEntries(
  Object.entries(STAGE_FORM_FIELDS).map(([stageId, config]) => [stageId, config.draft])
));

export const INHERITED_FIELDS_BY_STAGE = Object.freeze({
  "define-question": [],
  "literature-review": ["topic", "population", "researchQuestion", "primaryOutcome"],
  "synthesize-information": ["topic", "population", "researchQuestion", "primaryOutcome", "searchStrategy"],
  "identify-gaps": ["topic", "population", "researchQuestion", "primaryOutcome", "evidenceSummary"],
  "generate-hypotheses": ["topic", "population", "researchQuestion", "primaryOutcome", "researchGaps"],
  "outline-methodology": ["topic", "population", "researchQuestion", "primaryOutcome", "hypotheses"],
  "write-proposal": ["topic", "population", "researchQuestion", "primaryOutcome", "searchStrategy", "evidenceSummary", "researchGaps", "hypotheses", "methodologyOutline"],
});
```

Define all listed fields. Use `short-text` for topic, population, primary outcome, search concepts, gap context, intervention/exposure, hypothesis outcome, and study-specific Advanced prose; use `single-select` for question type, date coverage, evidence pattern, synthesis method, evidence certainty, gap type/support/priority, hypothesis approach/direction, sampling, analysis family, feasibility, proposal type/audience/timeline; use `multi-select` for information sources, evidence types, main limitations, grey literature, and required sections; use `derived-text` for the seven draft fields. Give every legacy ID from `LIFECYCLE_STAGES`, `RESEARCH_TYPES[*].fields`, and `getContextFieldIds()` a non-rendered compatibility definition with its existing type restrictions so current sessions and tests remain valid during migration. Set `allowNotSure: false` on `ethicsGovernance`, `registration`, `detailedGovernance`, and every evidence/privacy control outside this catalogue.

`confirmedDesign` must render the current design as a read-only single-select value sourced from `getStudyDesignOptions()`. `dataSourceRecruitment` resolves type-specific choices; `informationSources`, `synthesisMethod`, `questionType`, and `analysisFamily` use the overlays from Step 3. `getInheritedContextFields(context)` resolves the ordered list above. `getCompatibleFieldIds(context)` must union all seven stage definitions plus canonical fields for the selected type/design so changing stages never destroys prior work.

- [ ] **Step 5: Run catalogue tests and verify GREEN**

Run:

```powershell
npm test -- tests/unit/adaptive-fields.test.js tests/unit/catalog.test.js
```

Expected: PASS; all 10 families, every design, and all 7 stages resolve without an empty option set or more than five required Simple decisions.

- [ ] **Step 6: Commit the catalogue**

```powershell
git add src/catalog/adaptive-options.js src/catalog/adaptive-fields.js src/catalog/index.js tests/unit/adaptive-fields.test.js
git commit -m "feat: add adaptive research field catalogue"
```

---

### Task 2: Typed Values, Carry-Forward, and Confirmed Transitions

**Files:**
- Create: `src/field-values.js`
- Create: `tests/unit/field-values.test.js`
- Modify: `src/state.js`
- Modify: `app.js`
- Modify: `tests/unit/state.test.js`

**Interfaces:**
- Produces: `getFieldValue(state, fieldId)`, `getOtherText(state, fieldId)`, `normalizeFieldValue(field, value)`, `hasMeaningfulValue(value)`, `isFieldComplete(state, field)`, `getStaleOptionIds(state, field, context)`, `serializeFieldLabel(field, outputLanguage)`, and `serializeDisplayValue(state, field, outputLanguage)`.
- State adds `fieldCustomValues: Record<string, string>`, `drafts: Record<string, { suggested: string, value: string, customized: boolean, error: string }>`, `advancedOpenByStage: Record<string, boolean>`, and `researchProfileOpen: boolean`.
- Produces immutable state APIs and constants: `TARGET_OUTPUT_STAGES`, `setField(state, fieldId, value)`, `setFieldCustomValue(state, fieldId, value)`, `setAdvancedOpen(state, stageId, open)`, `setResearchProfileOpen(state, open)`, `setTargetOutput(state, outputId)`, `analyzeContextTransition(state, nextContext)`, and `applyContextTransition(state, nextContext, analysis)`.
- Transition analysis returns `{ fieldIds: string[], optionIdsByField: Record<string, string[]> }`; clearing operates from that exact analysis so a later state change cannot clear unrelated data.

- [ ] **Step 1: Write failing typed-value tests**

Create `tests/unit/field-values.test.js` with these cases:

```js
it("treats strings, arrays, Other text, and Not sure consistently", () => {
  let state = createInitialState();
  state = setField(state, "informationSources", ["medline", "other"]);
  expect(isFieldComplete(state, getFieldDefinition("informationSources"))).toBe(false);
  state = setFieldCustomValue(state, "informationSources", "ThaiJO");
  expect(isFieldComplete(state, getFieldDefinition("informationSources"))).toBe(true);
  state = setField(state, "synthesisMethod", "not-sure");
  expect(isFieldComplete(state, getFieldDefinition("synthesisMethod"))).toBe(true);
});

it("serializes deterministic localized labels instead of IDs", () => {
  let state = createInitialState();
  state = setField(state, "informationSources", ["embase", "medline", "other"]);
  state = setFieldCustomValue(state, "informationSources", "ThaiJO");
  expect(serializeDisplayValue(state, getFieldDefinition("informationSources"), "english"))
    .toBe("MEDLINE/PubMed; Embase; Other: ThaiJO");
});

it("reports stale option IDs instead of silently dropping them", () => {
  const state = setField(createInitialState(), "synthesisMethod", "invented-method");
  expect(getStaleOptionIds(state, getFieldDefinition("synthesisMethod"), contextFor(state)))
    .toEqual(["invented-method"]);
});

function contextFor(state) {
  return {
    researchTypeId: state.researchTypeId,
    studyDesignId: state.studyDesignId,
    stageId: state.stageId,
    evidenceMode: state.evidenceMode,
    fields: state.fields,
  };
}
```

Add a test that `normalizeFieldValue()` trims strings, deduplicates arrays without reordering the user's choices, makes `not-sure` exclusive when it appears in a multi-select, rejects objects, and never treats an empty array or `other` without custom text as complete. `serializeDisplayValue()` independently orders multi-select labels by catalogue order for deterministic prompts.

- [ ] **Step 2: Write failing state-transition tests**

Update `tests/unit/state.test.js` to require:

```js
it("carries canonical and completed stage products through all seven stages", () => {
  let state = createInitialState();
  state = setField(state, "topic", "Cardiac remodelling");
  state = setField(state, "researchQuestion", "What is the association?");
  state = setField(state, "searchStrategy", "Search MEDLINE and Embase");
  for (const stageId of STAGE_IDS) state = setStage(state, stageId);
  expect(state.fields).toMatchObject({
    topic: "Cardiac remodelling",
    researchQuestion: "What is the association?",
    searchStrategy: "Search MEDLINE and Embase",
  });
});

it("maps every explicit target output to its lifecycle stage", () => {
  for (const [targetOutput, stageId] of Object.entries(TARGET_OUTPUT_STAGES)) {
    expect(setTargetOutput(createInitialState(), targetOutput)).toMatchObject({ targetOutput, stageId });
  }
});

it("keeps disclosures independent from experience and field values", () => {
  const initial = createInitialState();
  const open = setAdvancedOpen(initial, "synthesize-information", true);
  const closed = setAdvancedOpen(open, "synthesize-information", false);
  expect(initial.advancedOpenByStage["synthesize-information"]).toBe(false);
  expect(closed.fields).toBe(open.fields);
  expect(closed.drafts).toBe(open.drafts);
});
```

Replace the old test that only two target outputs are enabled. Assert that changing research type or study design returns a confirmation analysis containing populated incompatible field IDs, stale dynamic option IDs, custom Other values, and hidden Advanced values; after confirmation, compatible canonical fields and all compatible stage products remain.

- [ ] **Step 3: Run typed state tests and verify RED**

Run:

```powershell
npm test -- tests/unit/field-values.test.js tests/unit/state.test.js
```

Expected: FAIL because typed helpers, disclosures, all-output stage mapping, design confirmation, and cross-stage preservation are absent.

- [ ] **Step 4: Implement typed helpers and the expanded initial state**

Use primitive field values plus a separate custom-value map:

```js
export function normalizeFieldValue(field, value) {
  if (field.control === "multi-select") {
    if (!Array.isArray(value)) throw new TypeError(`${field.id} requires an array`);
    const normalized = [...new Set(value.map(String).map(item => item.trim()).filter(Boolean))];
    return normalized.includes(NOT_SURE_OPTION_ID) ? [NOT_SURE_OPTION_ID] : normalized;
  }
  if (typeof value !== "string") throw new TypeError(`${field.id} requires a string`);
  return value.trim();
}

export function hasMeaningfulValue(value) {
  return Array.isArray(value)
    ? value.some(item => typeof item === "string" && item.trim())
    : typeof value === "string" && Boolean(value.trim());
}

export function isFieldComplete(state, field) {
  const value = getFieldValue(state, field.id);
  if (!hasMeaningfulValue(value)) return false;
  if ((Array.isArray(value) ? value : [value]).includes(OTHER_OPTION_ID)) {
    return Boolean(getOtherText(state, field.id).trim());
  }
  return true;
}
```

Initialize every stage disclosure to `false`, keep `researchProfileOpen: false`, and initialize all seven drafts with empty `suggested`, `value`, and `error` plus `customized: false`. `createPublicWorkspaceState()` must clone typed arrays and draft metadata but continue excluding uploaded text, File objects, internal source keys, and identifier content.

`getFieldValue(state, "confirmedDesign")` returns `state.studyDesignId`; it does not store a duplicate in `state.fields`. All other fields read their primitive or array value from `state.fields`.

- [ ] **Step 5: Implement carry-forward and compatibility transactions**

Replace stage-based field filtering with catalogue-wide type/design compatibility:

```js
export function setStage(state, nextStageId) {
  assertEnum(nextStageId, STAGE_IDS);
  return {
    ...state,
    stageId: nextStageId,
    targetOutput: "stage-appropriate-deliverable",
  };
}

export const TARGET_OUTPUT_STAGES = Object.freeze({
  "research-question": "define-question",
  "literature-review-strategy": "literature-review",
  "evidence-synthesis": "synthesize-information",
  "research-gap-analysis": "identify-gaps",
  "hypotheses-propositions": "generate-hypotheses",
  "methodology-outline": "outline-methodology",
  "research-proposal": "write-proposal",
});

export function setTargetOutput(state, targetOutput) {
  assertEnum(targetOutput, TARGET_OUTPUTS);
  if (targetOutput === "stage-appropriate-deliverable") return { ...state, targetOutput };
  return { ...state, targetOutput, stageId: TARGET_OUTPUT_STAGES[targetOutput] };
}
```

`analyzeContextTransition()` must compare populated field compatibility and selected option compatibility using the next type/design context. `applyContextTransition()` clears only reported incompatible field values and their custom values; `confirmedDesign` always reads the canonical `state.studyDesignId` rather than storing a duplicate field value. It never filters fields by current stage. Make `setResearchType()` and `setStudyDesign()` return the same `{ state, needsConfirmation, analysis }` shape.

Adapt the current `app.js` type/design handlers in this task so the intermediate commit remains runnable: map `analysis.fieldIds` to the existing confirmation dialog and unwrap `transition.state` only after confirmation. Keep the existing `incompatible` array as a temporary alias of `analysis.fieldIds` until Task 7 removes it after the full transition orchestration lands.

- [ ] **Step 6: Run typed state tests and verify GREEN**

Run:

```powershell
npm test -- tests/unit/field-values.test.js tests/unit/state.test.js tests/unit/evidence-core.test.js
```

Expected: PASS, including source-redaction and structural-sharing regressions.

- [ ] **Step 7: Commit typed state and transitions**

```powershell
git add src/field-values.js src/state.js app.js tests/unit/field-values.test.js tests/unit/state.test.js
git commit -m "feat: add typed adaptive form state"
```

---

### Task 3: Deterministic Derived Drafts and Ownership

**Files:**
- Create: `src/draft-composer.js`
- Create: `tests/unit/draft-composer.test.js`
- Modify: `src/state.js`

**Interfaces:**
- Produces: `composeSuggestedDraft(state, draftId, locale) -> string`, `syncDrafts(state, locale) -> state`, `setDraftValue(state, draftId, value) -> state`, and `restoreDraft(state, draftId, locale) -> state`.
- Every composer only restates user selections or requests downstream work. It returns a string and never reads `state.sources[*].text`.
- `syncDrafts()` replaces `{ suggested, value }` only when `customized === false`; on composition failure it retains the previous visible value and records a metadata-only `error` code.

- [ ] **Step 1: Write failing composer and ownership tests**

Create `tests/unit/draft-composer.test.js` with one case for every draft ID. Use exact non-claiming expectations:

```js
const cases = [
  ["researchQuestion", "Draft a focused association question"],
  ["searchStrategy", "Build a reproducible literature search"],
  ["evidenceSummary", "Ask the downstream assistant to assess the evidence pattern"],
  ["researchGaps", "Draft a population research-gap statement"],
  ["hypotheses", "Draft a directional hypothesis"],
  ["methodologyOutline", "Outline a cohort study methodology"],
  ["proposalOutline", "Assemble a grant proposal outline"],
];

function completeStructuredState() {
  return {
    ...createInitialState(),
    interfaceLocale: "en",
    fields: {
      topic: "Cardiac remodelling",
      population: "Children with craniopharyngioma",
      questionType: "association",
      primaryOutcome: "Left-ventricular mass index",
      informationSources: ["medline", "embase"],
      dateCoverage: "last-10-years",
      evidenceTypes: ["observational-studies"],
      searchConcepts: "craniopharyngioma, obesity, cardiac remodelling",
      evidencePattern: "not-yet-assessed",
      synthesisMethod: "narrative",
      evidenceCertainty: "not-yet-assessed",
      mainLimitations: ["sparse-evidence"],
      gapType: "population",
      gapEvidenceSupport: "not-yet-verified",
      gapContext: "pediatric tertiary care",
      gapPriority: "high",
      hypothesisApproach: "directional",
      interventionOrExposure: "hypothalamic obesity",
      hypothesisOutcome: "cardiac remodelling",
      expectedDirection: "increase",
      dataSourceRecruitment: "prospective-recruitment",
      samplingApproach: "consecutive",
      analysisFamily: "regression",
      feasibilityPeriod: "13-24-months",
      proposalType: "grant-proposal",
      targetAudience: "funding-panel",
      requiredSections: ["background", "objectives", "methods", "analysis", "ethics-governance"],
      proposalTimeline: "24-months",
    },
  };
}

for (const [draftId, expected] of cases) {
  expect(composeSuggestedDraft(completeStructuredState(), draftId, "en")).toContain(expected);
}

expect(composeSuggestedDraft(completeStructuredState(), "evidenceSummary", "en"))
  .toContain("Treat the selected pattern as provisional unless supported by permitted sources");
```

Add tests proving source text such as `PRIVATE-EVIDENCE` never appears in a browser-composed draft, user edits set `customized: true`, later structured changes update `suggested` but not `value`, `restoreDraft()` adopts the current suggestion, and locale changes recompute only uncustomized drafts.

- [ ] **Step 2: Run composer tests and verify RED**

Run:

```powershell
npm test -- tests/unit/draft-composer.test.js
```

Expected: FAIL because the composer module and draft ownership behavior do not exist.

- [ ] **Step 3: Implement the seven deterministic composer templates**

Implement a map keyed by draft ID. The English templates must begin with the phrases tested above; Thai templates use localized field and option labels from `t()` and retain the same epistemic boundary. Use this pattern for synthesis:

```js
function display(state, fieldId, locale) {
  return serializeDisplayValue(
    state,
    getFieldDefinition(fieldId),
    locale === "th" ? "thai" : "english"
  ) || (locale === "th" ? "ยังไม่ระบุ" : "Not specified");
}

function composeEvidenceSummary(state, locale) {
  const pattern = display(state, "evidencePattern", locale);
  const method = display(state, "synthesisMethod", locale);
  const certainty = display(state, "evidenceCertainty", locale);
  const limitations = display(state, "mainLimitations", locale);
  return locale === "th"
    ? `ขอให้ผู้ช่วยปลายทางประเมินรูปแบบหลักฐานด้วยวิธี ${method} รายงานความเชื่อมั่น ${certainty} และข้อจำกัด ${limitations} โดยถือว่ารูปแบบที่เลือก (${pattern}) เป็นข้อมูลเบื้องต้นจนกว่าจะมีแหล่งหลักฐานที่อนุญาตรองรับ`
    : `Ask the downstream assistant to assess the evidence pattern using ${method}, report ${certainty} certainty and ${limitations}, and treat the selected pattern (${pattern}) as provisional unless supported by permitted sources.`;
}
```

The other templates must include available inherited topic, population, research question, and primary outcome, omit empty fragments, and use `Not specified` / `ยังไม่ระบุ` rather than inventing content. Literature review also consumes the Step 1 research-question draft; synthesis consumes the search-strategy draft; gap analysis consumes the evidence-summary draft; hypothesis generation consumes the gap draft; methodology consumes the hypothesis draft; and the proposal composer includes every available canonical product from Steps 1-6. Each upstream draft is quoted as user-visible workspace context, never treated as verified evidence.

- [ ] **Step 4: Implement draft synchronization in state updates**

After `setField()`, `setFieldCustomValue()`, research type, study design, interface locale, and target-output transitions, call `syncDrafts()` with the current interface locale. Implement ownership exactly:

```js
function nextDraft(previous, suggested) {
  if (previous.customized) return { ...previous, suggested, error: "" };
  return { suggested, value: suggested, customized: false, error: "" };
}

export function setDraftValue(state, draftId, value) {
  const previous = state.drafts[draftId];
  return {
    ...state,
    drafts: {
      ...state.drafts,
      [draftId]: { ...previous, value, customized: value !== previous.suggested },
    },
    fields: { ...state.fields, [draftId]: value },
  };
}
```

Keep `fields[draftId]` synchronized with the visible draft for backward-compatible validation and prompt generation.

- [ ] **Step 5: Run composer and state tests and verify GREEN**

Run:

```powershell
npm test -- tests/unit/draft-composer.test.js tests/unit/state.test.js tests/unit/field-values.test.js
```

Expected: PASS; changing a structured selection updates only non-customized drafts and never reads evidence content.

- [ ] **Step 6: Commit deterministic drafts**

```powershell
git add src/draft-composer.js src/state.js tests/unit/draft-composer.test.js tests/unit/state.test.js
git commit -m "feat: compose protected stage drafts"
```

---

### Task 4: Catalogue-Driven Validation and Actionable Readiness

**Files:**
- Modify: `src/validation.js`
- Modify: `tests/unit/validation.test.js`
- Modify: `src/i18n.js`
- Modify: `tests/unit/i18n.test.js`

**Interfaces:**
- `getRequiredFieldIds(typeId, stageId, studyDesignId, evidenceMode, fields) -> string[]` now reads the field catalogue.
- `validateState(state)` continues returning `{ blocking, warnings, readinessByStage }`.
- Each readiness entry becomes `{ status: "not-started" | "remaining" | "ready" | "blocked", remaining: number, missingFieldIds: string[], reasonCode: string }`.
- Global evidence blockers remain metadata-only and keep their existing focusable field/source IDs.

- [ ] **Step 1: Replace old readiness tests with actionable-state tests**

Add exact expectations:

```js
const empty = validateState(createInitialState()).readinessByStage["define-question"];
expect(empty).toEqual({
  status: "not-started",
  remaining: 4,
  missingFieldIds: ["topic", "population", "questionType", "primaryOutcome"],
  reasonCode: "",
});

const partialState = setField(createInitialState(), "topic", "Cardiac remodelling");
expect(validateState(partialState).readinessByStage["define-question"]).toMatchObject({
  status: "remaining",
  remaining: 3,
});

const notSureState = setField(partialState, "questionType", "not-sure");
expect(validateState(notSureState).readinessByStage["define-question"].missingFieldIds)
  .not.toContain("questionType");
```

Add tests that Other without text remains missing, a stale option creates `stale-field-option`, a draft composition error creates `draft-composition-failed`, hidden Advanced values generate warnings unless `designCritical` is true, and uploaded global blockers produce `status: "blocked"` with the first blocker code as `reasonCode`.

- [ ] **Step 2: Run validation tests and verify RED**

Run:

```powershell
npm test -- tests/unit/validation.test.js tests/unit/i18n.test.js
```

Expected: FAIL because readiness is currently a three-value string and required fields are hard-coded.

- [ ] **Step 3: Implement typed requiredness and readiness objects**

Replace `STAGE_REQUIRED_FIELDS`, `DESIGN_REQUIRED_FIELDS`, and string readiness with catalogue queries:

```js
function calculateStageReadiness(state, stageId, globalBlockers) {
  const context = { ...state, stageId };
  const required = getStageFieldDefinitions(context).simple
    .filter(field => field.required || field.designCritical);
  const missingFieldIds = required
    .filter(field => !isFieldComplete(state, field))
    .map(field => field.id);
  const started = required.some(field => hasMeaningfulValue(getFieldValue(state, field.id)));
  if (globalBlockers.length) return {
    status: "blocked",
    remaining: missingFieldIds.length,
    missingFieldIds,
    reasonCode: globalBlockers[0].code,
  };
  if (!started) return { status: "not-started", remaining: missingFieldIds.length, missingFieldIds, reasonCode: "" };
  if (missingFieldIds.length) return { status: "remaining", remaining: missingFieldIds.length, missingFieldIds, reasonCode: "" };
  return { status: "ready", remaining: 0, missingFieldIds: [], reasonCode: "" };
}
```

For the current stage, create required issues with the exact field ID so focus can reach selects, checkbox groups, Other inputs, and derived drafts. Keep all current uploaded evidence checks unchanged. Add stale-option and draft-error checks without serializing user content in issue objects.

- [ ] **Step 4: Add bilingual actionable readiness and validation copy**

Add these keys to both locales:

```js
stageNotStarted: { th: "ยังไม่เริ่ม", en: "Not started" },
stageRemaining: { th: "เหลือ {count} รายการที่จำเป็น", en: "{count} required items remaining" },
stageReady: { th: "พร้อม", en: "Ready" },
stageBlocked: { th: "ถูกระงับ: {reason}", en: "Blocked: {reason}" },
validationStaleOption: { th: "ตัวเลือกเดิมไม่เข้ากับการตั้งค่าปัจจุบัน กรุณาเลือกใหม่", en: "A previous choice is incompatible with the current setup. Choose a replacement." },
validationOtherRequired: { th: "กรุณาระบุรายละเอียดสำหรับตัวเลือกอื่น", en: "Specify the Other choice." },
validationDraftError: { th: "ไม่สามารถปรับข้อความร่างได้ ข้อมูลเดิมยังคงอยู่", en: "The draft could not be refreshed; the previous text is preserved." },
```

Do not interpolate source text, field values, or filenames into readiness labels.

- [ ] **Step 5: Run validation and localization tests and verify GREEN**

Run:

```powershell
npm test -- tests/unit/validation.test.js tests/unit/i18n.test.js tests/unit/state.test.js
```

Expected: PASS with actionable readiness for every family/stage and all existing evidence blockers preserved.

- [ ] **Step 6: Commit actionable validation**

```powershell
git add src/validation.js src/i18n.js tests/unit/validation.test.js tests/unit/i18n.test.js
git commit -m "feat: add actionable adaptive form readiness"
```

---

### Task 5: Structured Prompt Serialization Without Unsupported Claims

**Files:**
- Modify: `src/prompt-engine.js`
- Modify: `tests/unit/prompt-engine.test.js`

**Interfaces:**
- Produces: `buildStructuredContext(state) -> string` and `buildUnresolvedDecisionInstruction(state) -> string` for use inside `buildPrompt(state)`.
- `buildStructuredContext()` emits deterministic sections named `Inherited context`, `Structured decisions`, `Derived stage product`, and `Advanced details`.
- `buildUnresolvedDecisionInstruction()` lists each Not sure decision by localized display label and requests 2-3 applicable options, rationale, limitations, and information needed for a human decision.
- Existing `buildEvidenceBlock()`, evidence boundaries, quality checks, standards, governance, citation, and human-review functions retain their current contracts.

- [ ] **Step 1: Write failing normalized prompt tests**

Add tests that a bilingual state containing a select, multi-select, Other text, hidden Advanced value, customized draft, and Not sure serializes as labels rather than IDs:

```js
expect(prompt).toContain("Structured decisions");
expect(prompt).toContain("Information sources: MEDLINE/PubMed / MEDLINE/PubMed; Embase / Embase; อื่น / Other: ThaiJO");
expect(prompt).not.toContain("informationSources: medline,embase,other");
expect(prompt).toContain("Derived stage product (user-customized)");
expect(prompt).toContain("Advanced details");
expect(prompt).toContain("Unresolved decision: Synthesis method");
expect(prompt).toContain("Provide 2-3 applicable options with rationale, limitations, and information needed for a human decision");
```

Add deterministic-order tests in Thai, English, and bilingual output. Add a synthesis test proving a selected `consistent` pattern is labeled as user-supplied/provisional and never stated as a browser-verified finding. Retain and run every existing evidence-boundary, SOURCE escaping, Thai PDPA, IRB, ICMJE, EQUATOR, AI governance, standards, citation, and expert-review assertion.

- [ ] **Step 2: Run prompt tests and verify RED**

Run:

```powershell
npm test -- tests/unit/prompt-engine.test.js
```

Expected: FAIL because the current context formatter prints raw field IDs/array coercions and cannot distinguish tiers, ownership, or unresolved decisions.

- [ ] **Step 3: Implement normalized structured context**

Replace `formatContext(fields)` with catalogue-driven serialization:

```js
function contextLines(state, fields) {
  return fields
    .filter(field => isFieldComplete(state, field))
    .map(field => `- ${serializeFieldLabel(field, state.outputLanguage)}: ${serializeDisplayValue(state, field, state.outputLanguage)}`);
}

function linesOrNone(lines) {
  return lines.length ? lines.join("\n") : "No supplied values.";
}

export function buildStructuredContext(state) {
  const context = { ...state, stageId: state.stageId };
  const { simple, advanced, draft } = getStageFieldDefinitions(context);
  const inherited = getInheritedContextFields(context);
  const sections = [
    section("Inherited context", linesOrNone(contextLines(state, inherited))),
    section("Structured decisions", linesOrNone(contextLines(state, simple))),
    section(
      `Derived stage product (${state.drafts[draft.id]?.customized ? "user-customized" : "suggested template"})`,
      state.drafts[draft.id]?.value || "Not specified"
    ),
    section("Advanced details", linesOrNone(contextLines(state, advanced))),
  ];
  return sections.join("\n\n");
}
```

Exclude Not sure values from ordinary decision lines and list them in a dedicated unresolved block. Hidden Advanced fields are included when populated. `evidencePattern` gets the prefix `User-supplied provisional assessment:` and the TASK section instructs downstream verification using only the selected evidence mode.

```js
export function buildUnresolvedDecisionInstruction(state) {
  const context = { ...state, fields: state.fields };
  const fields = [
    ...getInheritedContextFields(context),
    ...getStageFieldDefinitions(context).simple,
    ...getStageFieldDefinitions(context).advanced,
  ];
  const unresolved = [...new Map(fields.map(field => [field.id, field])).values()]
    .filter(field => {
      const value = getFieldValue(state, field.id);
      return (Array.isArray(value) ? value : [value]).includes(NOT_SURE_OPTION_ID);
    });
  if (!unresolved.length) return "No unresolved structured decisions.";
  return unresolved.map(field => [
    `Unresolved decision: ${serializeFieldLabel(field, state.outputLanguage)}`,
    "Provide 2-3 applicable options with rationale, limitations, and information needed for a human decision.",
  ].join("\n")).join("\n\n");
}
```

- [ ] **Step 4: Preserve every existing safety section and add explanation-depth guidance**

Keep the 11/12-section prompt ordering and all current evidence-mode text. Add only this experience instruction to section 1:

```js
const explanationDepth = {
  novice: "Explain methodological terms briefly and surface the next human decision.",
  intermediate: "Use concise methodological rationale and identify consequential trade-offs.",
  advanced: "Use specialist terminology concisely and foreground assumptions, estimands, and sensitivity decisions.",
};
```

Do not alter scientific quality requirements, standards resolution, Advanced visibility, or governance based on experience level.

- [ ] **Step 5: Run prompt and evidence regressions and verify GREEN**

Run:

```powershell
npm test -- tests/unit/prompt-engine.test.js tests/unit/evidence-core.test.js tests/unit/parsers.test.js
```

Expected: PASS; structured values are human-readable and every existing evidence/privacy safeguard remains present.

- [ ] **Step 6: Commit structured prompt serialization**

```powershell
git add src/prompt-engine.js tests/unit/prompt-engine.test.js
git commit -m "feat: serialize adaptive research decisions"
```

---

### Task 6: Compact Setup and Accessible Simple + Advanced Renderer

**Files:**
- Create: `src/ui/dom.js`
- Create: `src/ui/adaptive-form.js`
- Modify: `src/ui/render.js`
- Modify: `src/i18n.js`
- Modify: `app.js`
- Modify: `tests/unit/i18n.test.js`
- Modify: `tests/e2e/workspace.spec.js`

**Interfaces:**
- Produces: `renderAdaptiveForm(state, preflight, locale)`, `renderContextStrip(state, locale)`, `renderResearchProfile(state, locale)`, and `findFieldControl(root, fieldId)`.
- `src/ui/dom.js` produces `element(tag, options, children)` and `option(value, label, selected, disabled)`; move the existing implementations out of `render.js` so renderer modules share one helper without a circular import.
- Every rendered input carries `data-field-id`; custom Other inputs also carry `data-other-for`; derived text carries `data-draft-id`; disclosures carry `data-action="toggle-advanced"` or `data-action="toggle-profile"`.
- Multi-select chips use native checkboxes; segmented controls use native radios with one `<fieldset>` and `<legend>`.

- [ ] **Step 1: Write failing browser-renderer tests**

Update `tests/e2e/workspace.spec.js` to assert:

```js
await expect(page.getByTestId("setup-bar").getByLabel("Researcher role")).toHaveCount(0);
await page.getByRole("button", { name: "Research profile" }).click();
await expect(page.getByLabel("Researcher role")).toBeVisible();

const simple = page.getByTestId("simple-fields");
await expect(simple.locator("[data-field-id]")).toHaveCount(4);
await expect(page.getByRole("button", { name: "Advanced details" })).toHaveAttribute("aria-expanded", "false");
await expect(page.getByTestId("advanced-fields")).toBeHidden();
```

Add tests that selecting Other reveals one labeled short input, Not sure appears for synthesis method but not for ethics/registration controls, checkbox chips expose checked state to the accessibility tree, and a customized draft shows `Restore suggested text`. The confirmation required when changing away from populated Other text is covered in Task 7 with the transition controller.

- [ ] **Step 2: Run renderer browser tests and verify RED**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="Research profile|Simple and Advanced|Other|Not sure|Restore suggested"
```

Expected: FAIL because setup is fully expanded and every adaptive field is currently a text input or textarea.

- [ ] **Step 3: Implement generic accessible field controls**

Create `src/ui/adaptive-form.js` and dispatch by `field.control`:

```js
const CONTROL_RENDERERS = {
  "short-text": renderShortText,
  "single-select": renderSingleSelect,
  "multi-select": renderCheckboxGroup,
  segmented: renderRadioGroup,
  toggle: renderToggle,
  "derived-text": renderDerivedText,
};

export function renderAdaptiveForm(state, preflight, locale) {
  const definition = getStageFieldDefinitions({ ...state, fields: state.fields });
  return element("form", { className: "adaptive-form", noValidate: true }, [
    renderContextStrip(state, locale),
    element("section", { className: "simple-fields", dataset: { testid: "simple-fields" } },
      definition.simple.map(field => renderField(field, state, preflight, locale))),
    renderDerivedText(definition.draft, state, preflight, locale),
    renderAdvancedDisclosure(definition.advanced, state, preflight, locale),
  ]);
}
```

For selects and checkbox groups, render labels from `options.<optionSetId>.<optionId>`. Render stale values as disabled selected options labeled `Previous choice - select a replacement`. Other custom input IDs use `field-${fieldId}-other`. Advanced uses a button with `aria-controls="advanced-${stageId}"`; the region uses `hidden: !open` and retains controls in the DOM state model.

- [ ] **Step 4: Compact workspace setup and add inherited context**

In `renderWorkspace()`, keep only Research type, Study design, Evidence mode, Output language, and Target output in the default setup grid. Put role, experience, field, setting, and citation style under a `Research profile` disclosure. Render all target-output options enabled.

```js
const primarySetupControls = [researchType, studyDesign, evidenceMode, outputLanguage, targetOutput];
const profileControls = [researcherRole, experienceLevel, scientificField, institutionSetting, citationStyle];
setupBar.replaceChildren(
  element("div", { className: "panel-kicker", textContent: t(locale, "setup") }),
  element("div", { className: "setup-controls" }, primarySetupControls),
  renderResearchProfile(state, locale, profileControls)
);
```

The context strip lists populated canonical values in this order: topic, population, research question, primary outcome. Each item is a text label plus an Edit icon button whose accessible name is `Edit <field label>` and whose `data-action="edit-context"` carries the canonical field ID. Do not wrap the strip in a decorative card.

- [ ] **Step 5: Add complete bilingual control copy**

Add keys for every field and option ID introduced in Task 1 plus:

```js
researchProfile: { th: "ข้อมูลผู้วิจัย", en: "Research profile" },
advancedDetails: { th: "รายละเอียดขั้นสูง", en: "Advanced details" },
inheritedContext: { th: "บริบทที่ใช้ต่อเนื่อง", en: "Inherited context" },
otherSpecify: { th: "อื่น ๆ โปรดระบุ", en: "Other - specify" },
notSureRecommend: { th: "ยังไม่แน่ใจ - ให้ AI แนะนำ", en: "Not sure - ask AI to recommend" },
restoreSuggested: { th: "คืนค่าข้อความแนะนำ", en: "Restore suggested text" },
suggestedDraft: { th: "ข้อความร่างที่ระบบประกอบให้", en: "Suggested draft" },
customizedDraft: { th: "ข้อความร่างที่ผู้ใช้แก้ไข", en: "User-customized draft" },
```

Every label/help/option key must be asserted by iterating the catalogue in `tests/unit/i18n.test.js`; `t("th", key)` and `t("en", key)` must not return the key itself.

- [ ] **Step 6: Connect basic field, draft, and disclosure events**

Update `app.js` so short text, select, multi-select checkbox, segmented radio, Other custom text, draft editing, draft restore, Advanced disclosure, Research profile disclosure, and direct target-output stage mapping use the typed state APIs. Preserve text-input focus by avoiding a full render on ordinary keystrokes; rerender after structured selection/disclosure changes and restore the initiating control's focus. Do not implement incompatible-value confirmation for populated Other/type/design changes here; that remains Task 7.

```js
function readControlValue(target, field) {
  if (field.control === "multi-select") {
    return [...root.querySelectorAll(`[name="${field.id}"]:checked`)].map(input => input.value);
  }
  return target.type === "checkbox" ? String(target.checked) : target.value;
}

function updateFieldFromControl(target) {
  const field = getFieldDefinition(target.dataset.fieldId);
  const next = setField(state, field.id, readControlValue(target, field));
  update(next, "set-field", field.control !== "short-text");
}
```

- [ ] **Step 7: Run renderer and localization tests and verify GREEN**

Run:

```powershell
npm test -- tests/unit/i18n.test.js tests/unit/adaptive-fields.test.js
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="Research profile|Simple and Advanced|Other|Not sure|Restore suggested"
```

Expected: PASS; the default workspace is compact, controls are semantic, and Advanced is collapsed.

- [ ] **Step 8: Commit renderer and copy**

```powershell
git add src/ui/dom.js src/ui/adaptive-form.js src/ui/render.js src/i18n.js app.js tests/unit/i18n.test.js tests/e2e/workspace.spec.js
git commit -m "feat: render concise adaptive research forms"
```

---

### Task 7: Event Orchestration, Focus, and Safe Conditional Clearing

**Files:**
- Modify: `app.js`
- Modify: `src/ui/render.js`
- Modify: `tests/e2e/workspace.spec.js`

**Interfaces:**
- `app.js` handles `data-field-id`, `data-other-for`, `data-draft-id`, `toggle-advanced`, `toggle-profile`, `restore-draft`, `edit-context`, target output, research type, and study design through one delegated event flow.
- Confirmation transitions use `{ kind, nextContext, analysis, restoreSelector }`; the dialog always lists localized visible field labels and never internal IDs or field values.
- After a rerender caused by a select, checkbox, radio, disclosure, or conditional field, focus returns to the initiating control unless the user explicitly revealed Other, in which case focus moves to its short-text input.

- [ ] **Step 1: Write failing navigation, carry-forward, and keyboard tests**

Add browser tests for:

```js
await page.getByLabel("Target output").selectOption("evidence-synthesis");
await expect(page.locator('[data-action="stage"][data-stage-id="synthesize-information"]'))
  .toHaveAttribute("aria-current", "step");

await page.locator('[data-action="stage"][data-stage-id="define-question"]').click();
await expect(page.getByLabel("Research topic")).toHaveValue("Cardiac remodelling");
await page.locator('[data-action="stage"][data-stage-id="literature-review"]').click();
await expect(page.getByTestId("inherited-context")).toContainText("Cardiac remodelling");
```

Add keyboard cases for Space toggling checkbox chips, Arrow keys moving segmented radios, Enter opening Advanced, Escape cancelling Other/type/design confirmation, and `Edit Research topic` returning focus to the original control after stage navigation. Add a design-transition test where a hidden Advanced option becomes incompatible and is named in the confirmation.

- [ ] **Step 2: Run orchestration tests and verify RED**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="Target output navigation|carry-forward|keyboard adaptive|hidden Advanced"
```

Expected: FAIL because current events assume text values, design changes clear immediately, and target output cannot navigate.

- [ ] **Step 3: Harden rerender focus and conditional-field behavior**

Wrap every structured rerender with an explicit focus snapshot. Preserve text selection only for text-like controls; use the control ID for selects, checkboxes, radios, and disclosure buttons:

```js
function captureFocus() {
  const active = document.activeElement;
  return active?.id ? {
    id: active.id,
    start: typeof active.selectionStart === "number" ? active.selectionStart : null,
    end: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
  } : null;
}

function restoreFocus(snapshot) {
  const control = snapshot ? document.getElementById(snapshot.id) : null;
  control?.focus();
  if (control && snapshot.start != null && typeof control.setSelectionRange === "function") {
    control.setSelectionRange(snapshot.start, snapshot.end);
  }
}
```

When Other is newly selected, override the ordinary restore target and focus `field-${fieldId}-other`. Draft Restore focuses the draft textarea after adopting the current suggestion.

- [ ] **Step 4: Implement disclosure, context edit, and target-output events**

Advanced and profile actions update only disclosure state. `edit-context` resolves the source stage from field metadata, calls `setStage()`, rerenders, and focuses `findFieldControl(root, fieldId)`. Target output calls `setTargetOutput()` and routes through the same transition confirmation helper used by direct stage navigation if an analysis exists.

```js
if (action === "toggle-advanced") {
  update(setAdvancedOpen(state, state.stageId, trigger.getAttribute("aria-expanded") !== "true"), "toggle-advanced");
}
if (action === "toggle-profile") {
  update(setResearchProfileOpen(state, !state.researchProfileOpen), "toggle-profile");
}
if (action === "edit-context") {
  const field = getFieldDefinition(trigger.dataset.fieldId);
  const sourceStage = field.inherited?.sourceStageId ?? field.placements[0].stageId;
  update(setStage(state, sourceStage), "edit-context");
  findFieldControl(root, field.id)?.focus();
}
```

- [ ] **Step 5: Implement confirmed type/design/Other clearing**

Use one pending transition:

```js
pendingTransition = {
  kind,
  nextContext,
  analysis,
  restoreSelector,
};
```

For research type and study design, call `analyzeContextTransition()` first; confirmation lists `analysis.fieldIds` after localizing them. For Other, store `{ fieldId, replacementValue }`, confirm only when custom text is non-empty, then clear only `fieldCustomValues[fieldId]`. Cancel restores the prior selected value and focus. Confirm applies the snapshot analysis and announces the localized change.

- [ ] **Step 6: Run orchestration and existing workflow tests and verify GREEN**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="Target output navigation|carry-forward|keyboard adaptive|hidden Advanced|focus|reset|prompt"
```

Expected: PASS with no page errors, no focus loss while typing, and no unintended data clearing.

- [ ] **Step 7: Commit orchestration behavior**

```powershell
git add app.js src/ui/render.js tests/e2e/workspace.spec.js
git commit -m "feat: orchestrate adaptive form interactions"
```

---

### Task 8: Responsive Visual System and Accessibility Verification

**Files:**
- Modify: `styles.css`
- Modify: `tests/e2e/workspace.spec.js`
- Modify: `tests/e2e/accessibility.spec.js`

**Interfaces:**
- Simple fields use a stable one-column mobile and restrained two-column desktop grid.
- Checkbox chips and segmented radios preserve native inputs in the accessibility tree and expose visible focus.
- Dynamic readiness/draft announcements use the existing scoped polite live region and do not announce every text keystroke.

- [ ] **Step 1: Write failing layout and Axe tests**

Add Playwright assertions at `1440x900`, `1024x768`, and `412x915` for no horizontal overflow, no overlapping rectangles, and stable disclosure dimensions. At mobile width, require each Simple field, draft, and Advanced region to be one column. At desktop width, require no more than two field columns.

Add Chromium screenshot assertions after selecting Step 3 and opening Advanced:

```js
await expect(page).toHaveScreenshot("adaptive-synthesis-desktop.png", { fullPage: true });
await page.setViewportSize({ width: 412, height: 915 });
await expect(page).toHaveScreenshot("adaptive-synthesis-mobile.png", { fullPage: true });
```

Extend `tests/e2e/accessibility.spec.js` to run Axe after:

```js
await page.getByRole("button", { name: "Advanced details" }).click();
const sources = page.getByRole("group", { name: /Information sources/ });
await sources.getByLabel("Other - specify").check();
await page.getByLabel("Specify Other information source").fill("ThaiJO");
```

Run the same scan in Thai and English, plus a keyboard-only path from setup through Simple fields, Advanced disclosure, Other input, generated prompt, and Escape close.

- [ ] **Step 2: Run visual/accessibility tests and verify RED**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --project=mobile-chromium --workers=1 --grep="responsive adaptive|WCAG|keyboard-only"
```

Expected: FAIL until the new controls have final layout, focus, grouping, and wrapping styles.

- [ ] **Step 3: Implement the compact responsive styles**

Add focused styles with stable dimensions:

```css
.simple-fields,.advanced-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.context-strip{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;border-block:1px solid var(--line);padding:10px 0}
.choice-group{display:flex;flex-wrap:wrap;gap:8px;min-width:0}
.choice-chip{position:relative;display:inline-flex;align-items:center;min-height:38px;padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:var(--surface)}
.choice-chip:has(input:checked){border-color:var(--accent);background:var(--accent-soft)}
.choice-chip:has(input:focus-visible){outline:3px solid var(--focus);outline-offset:2px}
.advanced-toggle,.profile-toggle{display:inline-flex;align-items:center;gap:8px;min-height:40px}
.derived-field{grid-column:1/-1}
@media (max-width:560px){.simple-fields,.advanced-fields{grid-template-columns:1fr}.context-strip{align-items:flex-start}.choice-chip{max-width:100%}}
```

Use existing palette variables, maximum 8px radii, zero negative letter spacing, and no decorative cards or gradients. Ensure long Thai/English labels wrap inside their own control and do not change adjacent control dimensions when selected.

- [ ] **Step 4: Run Axe and multi-viewport tests and verify GREEN**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --project=mobile-chromium --workers=1 --grep="responsive adaptive|WCAG|keyboard-only"
```

Expected: PASS with no WCAG A/AA violations, no horizontal scrolling, and no overlapping controls.

- [ ] **Step 5: Capture and inspect desktop/mobile screenshots**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --project=mobile-chromium --workers=1 --grep="responsive adaptive" --update-snapshots
```

Inspect the produced desktop and mobile PNGs for header fit, setup density, context-strip wrapping, checkbox/segmented focus states, Advanced expansion, draft height, lifecycle labels, and standards-column alignment. Delete any diagnostic screenshots that are not asserted test artifacts before committing.

- [ ] **Step 6: Commit responsive and accessible styling**

```powershell
git add styles.css tests/e2e/workspace.spec.js tests/e2e/accessibility.spec.js tests/e2e/workspace.spec.js-snapshots
git commit -m "feat: polish accessible adaptive form layout"
```

---

### Task 9: Full Regression, Scientific Review, and Release Readiness

**Files:**
- Modify: `tests/e2e/workspace.spec.js`
- Modify: `docs/content-review.md`
- Modify: `README.md`

**Interfaces:**
- The release candidate must pass all Vitest and all four Playwright projects without changing upload privacy, evidence extraction, prompt copy/download, reset, standards, path-prefix, or source-redaction behavior.
- `README.md` describes the new Simple + Advanced workflow without claiming that the browser conducts AI analysis.

- [ ] **Step 1: Add the final cross-family and evidence-mode matrix**

In `tests/e2e/workspace.spec.js`, add a table-driven test over all 10 research families. For each family, select its default design, visit all 7 stages, assert the resolved draft ID and at most 5 required Simple controls, fill required short-text fixtures with `Test <field label>`, choose the first compatible non-sentinel option in each required select/multi-select, and verify no stale-option blocker appears.

```js
for (const researchType of RESEARCH_TYPE_CASES) {
  test(`${researchType.id} resolves every adaptive stage`, async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("interface-language").selectOption("en");
    await page.getByLabel("Research type").selectOption(researchType.id);
    for (const stage of STAGE_CASES) {
      await page.locator(`[data-action="stage"][data-stage-id="${stage.id}"]`).click();
      const required = page.locator('[data-testid="simple-fields"] [data-required="true"]');
      expect(await required.count()).toBeLessThanOrEqual(5);
      await completeVisibleRequiredControls(required);
      await expect(page.locator(`[data-draft-id="${stage.draftId}"]`)).toBeVisible();
      await expect(page.getByTestId("validation-summary")).not.toContainText("previous choice is incompatible");
    }
  });
}
```

Define `RESEARCH_TYPE_CASES` from the 10 stable type IDs, `STAGE_CASES` from the 7 stage/draft pairs in Task 1, and `completeVisibleRequiredControls()` to fill text controls and choose the first enabled option whose value is neither `other` nor `not-sure`.

Add three end-to-end prompt cases:

```js
[
  ["planning", "Planning mode does not permit literature claims or citations"],
  ["uploaded", "Use only the uploaded SOURCE blocks as evidence"],
  ["web-research", "Search for and cite verifiable external sources"],
]
```

The uploaded case must use `tests/fixtures/searchable-evidence.pdf`, require fresh deidentification confirmation, include only ready selected SOURCE blocks, and keep evidence-budget blocking. The web case must require named databases, exact search date, direct links, and stable identifiers. All three must contain standards, governance, citation, limitations, and the human-review checklist.

- [ ] **Step 2: Run focused final tests and correct any regression**

Run:

```powershell
npm test
npm run test:e2e -- --project=desktop-chromium --workers=1
```

Expected: all unit tests and desktop Chromium tests PASS. If a regression appears, add the smallest focused failing test to the owning unit or browser suite before changing production code, then rerun these commands.

- [ ] **Step 3: Update user and scientific documentation**

In `README.md`, document:

- five compact setup controls plus collapsed Research profile;
- no more than five normal Simple decisions per stage;
- collapsed Advanced details that remain in prompts;
- Other and Not sure behavior;
- target-output stage navigation;
- local-only document parsing and the fact that the browser does not perform AI analysis.

In `docs/content-review.md`, add a dated `2026-08-09 Adaptive Forms Review` table with rows for all seven stages and columns `Simple decisions`, `Dynamic family check`, `Derived text boundary`, `Advanced safeguards`, and `Reviewer result`. Record `Pass` only after checking each row against the approved design and generated prompt output; keep any failed row explicit until corrected.

- [ ] **Step 4: Run the complete release matrix**

Run:

```powershell
npm run test:all
```

Expected: Vitest PASS and Playwright PASS on desktop Chromium, mobile Chromium, desktop Firefox, and desktop WebKit.

- [ ] **Step 5: Verify GitHub Pages prefix and production assets**

Run:

```powershell
npm run test:e2e -- --project=desktop-chromium --workers=1 --grep="GitHub Pages path prefix"
```

Expected: PASS with no 4xx assets and all module, icon, logo, PDF worker, manifest, and favicon requests under `/research-prompt-generator/`.

- [ ] **Step 6: Review the final diff for scope and privacy**

Run:

```powershell
git status --short
git diff --check
git diff --stat
git diff -- src/evidence src/prompt-engine.js src/state.js src/validation.js
```

Expected: no whitespace errors, no generated upload artifacts, no source text in state-change events or validation objects, no new network/AI dependency, and only files named in this plan changed.

- [ ] **Step 7: Commit release documentation and final regression coverage**

```powershell
git add README.md docs/content-review.md tests/e2e/workspace.spec.js
git commit -m "test: verify adaptive research form workflows"
```

- [ ] **Step 8: Stop before publishing and request release approval**

Report the full Vitest and four-project Playwright totals, the current branch and commit, and the public URL that would be updated. Do not merge, push to `main`, or publish GitHub Pages until the user explicitly approves the verified release candidate.
