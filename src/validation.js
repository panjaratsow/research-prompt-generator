import { LIFECYCLE_STAGES, getResearchType } from "./catalog/index.js";
import { calculateEvidenceBudget } from "./evidence/core.js";

const STAGE_REQUIRED_FIELDS = {
  question: ["topic", "population", "researchQuestion"],
  evidence: ["topic", "population", "researchQuestion", "informationSources"],
  protocol: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome", "resourcesTimeline"],
  "ethics-governance": ["topic", "population", "researchQuestion", "existingInformation"],
  "analysis-plan": ["topic", "population", "researchQuestion", "primaryOutcome"],
  proposal: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome", "resourcesTimeline"],
  "conduct-quality": ["topic", "population", "researchQuestion", "primaryOutcome", "existingInformation"],
  "analysis-interpretation": ["topic", "population", "researchQuestion", "primaryOutcome", "existingInformation"],
  reporting: ["topic", "population", "researchQuestion", "primaryOutcome", "existingInformation"],
  "dissemination-impact": ["topic", "population", "researchQuestion", "primaryOutcome", "resourcesTimeline"],
};

const DESIGN_REQUIRED_FIELDS = {
  diagnostic: ["targetCondition", "indexTest", "referenceStandard", "diagnosticThreshold"],
  prediction: ["predictors", "primaryOutcome", "endpointTiming", "developmentDataset", "validationDataset"],
  "qualitative-mixed": ["sample", "phenomenon", "qualitativeDesign", "dataCollection", "analysisApproach", "reflexivity"],
  "evidence-review": ["reviewType", "reviewQuestion", "eligibilityCriteria", "informationSources", "synthesisMethod"],
  "ai-health-data": ["intendedUse", "targetPopulation", "datasetProvenance", "referenceStandard", "modelInputs", "validationDataset", "performanceMeasures"],
};

const GLOBAL_BLOCKING_CODES = new Set([
  "missing-research-type",
  "missing-stage",
  "deidentification-unconfirmed",
  "uploaded-evidence-empty",
  "selected-source-empty",
  "evidence-budget-exceeded",
  "identifiable-data-present",
]);

function issue(code, messageKey, { fieldId = "", sourceId = "" } = {}) {
  return { code, fieldId, sourceId, messageKey };
}

function hasValue(fields, fieldId) {
  const value = fields[fieldId];
  return typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
}

function requiredIssue(fieldId) {
  if (fieldId === "topic") return issue("missing-topic", "validation.missingTopic", { fieldId });
  if (fieldId === "researchQuestion") return issue("missing-question", "validation.missingQuestion", { fieldId });
  return issue(`missing-${fieldId}`, "validation.missingRequiredField", { fieldId });
}

function warningForMissingField(warnings, state, fieldId, code, messageKey) {
  if (!hasValue(state.fields, fieldId)) warnings.push(issue(code, messageKey, { fieldId }));
}

export function getRequiredFieldIds(typeId, stageId) {
  const stageFields = STAGE_REQUIRED_FIELDS[stageId] ?? [];
  const designFields = DESIGN_REQUIRED_FIELDS[typeId] ?? [];
  return [...new Set([...stageFields, ...designFields])];
}

function calculateReadiness(state, blocking) {
  const globallyBlocked = blocking.some(issue => GLOBAL_BLOCKING_CODES.has(issue.code));

  return Object.fromEntries(LIFECYCLE_STAGES.map(({ id }) => {
    if (globallyBlocked) return [id, "blocked"];
    const fieldsReady = getRequiredFieldIds(state.researchTypeId, id)
      .every(fieldId => hasValue(state.fields, fieldId));
    return [id, fieldsReady ? "ready" : "incomplete"];
  }));
}

function addContextualWarnings(state, warnings) {
  const { researchTypeId, stageId } = state;
  const planningStages = new Set(["question", "evidence", "protocol", "proposal"]);
  const ethicsStages = new Set(["protocol", "ethics-governance", "conduct-quality"]);

  if (["protocol", "proposal", "dissemination-impact"].includes(stageId)) {
    warningForMissingField(warnings, state, "resourcesTimeline", "missing-feasibility", "validation.missingFeasibility");
  }
  if (planningStages.has(stageId)) {
    warningForMissingField(warnings, state, "registration", "missing-registration", "validation.missingRegistration");
  }
  if (ethicsStages.has(stageId)) {
    warningForMissingField(warnings, state, "ethicsApproval", "missing-ethics", "validation.missingEthics");
  }
  if (["observational", "prediction", "ai-health-data"].includes(researchTypeId)) {
    warningForMissingField(warnings, state, "dataSharingPlan", "missing-data-sharing", "validation.missingDataSharing");
  }
  if (["prediction-external-validation", "ai-external-validation", "ai-imaging-external-validation"].includes(state.studyDesignId)) {
    warningForMissingField(warnings, state, "externalValidation", "missing-external-validation", "validation.missingExternalValidation");
  }
}

export function validateState(state) {
  const blocking = [];
  const warnings = [];
  const fields = state.fields ?? {};

  if (!getResearchType(state.researchTypeId)) {
    blocking.push(issue("missing-research-type", "validation.missingResearchType", { fieldId: "researchTypeId" }));
  }
  if (!STAGE_REQUIRED_FIELDS[state.stageId]) {
    blocking.push(issue("missing-stage", "validation.missingStage", { fieldId: "stageId" }));
  }
  for (const fieldId of getRequiredFieldIds(state.researchTypeId, state.stageId)) {
    if (!hasValue(fields, fieldId)) blocking.push(requiredIssue(fieldId));
  }
  if (state.evidenceMode === "uploaded" && !state.deidentificationConfirmed) {
    blocking.push(issue("deidentification-unconfirmed", "validation.confirmDeidentification", { fieldId: "evidenceDeidentified" }));
  }

  const readySources = (state.sources ?? []).filter(source => source.status === "ready" && source.included);
  if (state.evidenceMode === "uploaded" && !readySources.length) {
    blocking.push(issue("uploaded-evidence-empty", "validation.uploadEvidence", { fieldId: "evidenceInput" }));
  }
  for (const source of readySources.filter(source => typeof source.text !== "string" || !source.text.trim())) {
    blocking.push(issue("selected-source-empty", "validation.emptySourceText", { sourceId: source.id }));
  }
  if (state.evidenceMode === "uploaded" && calculateEvidenceBudget(state.sources ?? [], state.evidenceBudget).exceeded) {
    blocking.push(issue("evidence-budget-exceeded", "validation.evidenceBudgetExceeded", { fieldId: "evidenceBudget" }));
  }
  if (state.identifiableDataPresent || readySources.some(source => source.identifiableDataPresent)) {
    blocking.push(issue("identifiable-data-present", "validation.identifiableDataPresent"));
  }
  for (const source of state.sources ?? []) {
    if (Array.isArray(source.identifierHints) && source.identifierHints.length) {
      warnings.push(issue("source-identifier-hint", "validation.sourceIdentifierHint", { sourceId: source.id }));
    }
  }

  addContextualWarnings({ ...state, fields }, warnings);
  return { blocking, warnings, readinessByStage: calculateReadiness({ ...state, fields }, blocking) };
}
