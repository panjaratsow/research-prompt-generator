import {
  LIFECYCLE_STAGES,
  getResearchType,
  getStageFieldDefinitions,
} from "./catalog/index.js";
import { calculateEvidenceBudget } from "./evidence/core.js";
import {
  getFieldValue,
  getStaleOptionIds,
  hasMeaningfulValue,
  isFieldComplete,
} from "./field-values.js";

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

function requiredIssue(state, field) {
  const value = getFieldValue(state, field.id);
  const includesOther = (Array.isArray(value) ? value : [value]).includes("other");
  if (includesOther) {
    return issue(`missing-${field.id}`, "validation.validationOtherRequired", { fieldId: field.id });
  }
  const { id: fieldId } = field;
  if (fieldId === "topic") return issue("missing-topic", "validation.missingTopic", { fieldId });
  if (fieldId === "researchQuestion") return issue("missing-question", "validation.missingQuestion", { fieldId });
  return issue(`missing-${fieldId}`, "validation.missingRequiredField", { fieldId });
}

function warningForMissingField(warnings, state, fieldId, code, messageKey) {
  if (!hasMeaningfulValue(getFieldValue(state, fieldId))) warnings.push(issue(code, messageKey, { fieldId }));
}

function stageContext(typeId, stageId, studyDesignId, evidenceMode, fields) {
  return {
    researchTypeId: typeId,
    studyDesignId: studyDesignId ?? getResearchType(typeId)?.defaultStudyDesignId,
    stageId,
    evidenceMode,
    fields: fields ?? {},
  };
}

function requiredFieldsForStage(context) {
  return getStageFieldDefinitions(context).simple
    .filter(field => field.required || field.designCritical);
}

export function getRequiredFieldIds(typeId, stageId, studyDesignId, evidenceMode, fields) {
  return requiredFieldsForStage(stageContext(typeId, stageId, studyDesignId, evidenceMode, fields))
    .map(field => field.id);
}

function calculateStageReadiness(state, stageId, globalBlockers) {
  const context = { ...state, stageId, fields: state.fields ?? {} };
  const required = requiredFieldsForStage(context);
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

function calculateReadiness(state, blocking) {
  const globalBlockers = blocking.filter(entry => GLOBAL_BLOCKING_CODES.has(entry.code));
  return Object.fromEntries(LIFECYCLE_STAGES.map(({ id }) => {
    return [id, calculateStageReadiness(state, id, globalBlockers)];
  }));
}

function addAdaptiveFieldIssues(state, blocking, warnings) {
  const form = getStageFieldDefinitions(state);
  const required = requiredFieldsForStage(state);

  for (const field of required) {
    if (!isFieldComplete(state, field)) blocking.push(requiredIssue(state, field));
  }
  for (const field of form.advanced) {
    if (isFieldComplete(state, field)) continue;
    if (field.designCritical) blocking.push(requiredIssue(state, field));
    else warnings.push(issue(`missing-${field.id}`, "validation.missingRequiredField", { fieldId: field.id }));
  }
  for (const field of [...form.simple, ...form.advanced]) {
    if (getStaleOptionIds(state, field, state).length) {
      blocking.push(issue("stale-field-option", "validation.validationStaleOption", { fieldId: field.id }));
    }
  }
  if (form.draft?.designCritical && state.drafts?.[form.draft.id]?.error) {
    blocking.push(issue("draft-composition-failed", "validation.validationDraftError", { fieldId: form.draft.id }));
  }
}

function addContextualWarnings(state, warnings) {
  const { researchTypeId, stageId } = state;
  const methodsStages = new Set(["outline-methodology", "write-proposal"]);

  if (methodsStages.has(stageId)) {
    warningForMissingField(warnings, state, "resourcesTimeline", "missing-feasibility", "validation.missingFeasibility");
    warningForMissingField(warnings, state, "registration", "missing-registration", "validation.missingRegistration");
    warningForMissingField(warnings, state, "ethicsApproval", "missing-ethics", "validation.missingEthics");
    if (["observational", "prediction", "ai-health-data"].includes(researchTypeId)) {
      warningForMissingField(warnings, state, "dataSharingPlan", "missing-data-sharing", "validation.missingDataSharing");
    }
    if (["prediction-external-validation", "ai-external-validation", "ai-imaging-external-validation"].includes(state.studyDesignId)) {
      warningForMissingField(warnings, state, "externalValidation", "missing-external-validation", "validation.missingExternalValidation");
    }
  }
  if (researchTypeId === "evidence-review" && stageId === "literature-review") {
    warningForMissingField(warnings, state, "registration", "missing-registration", "validation.missingRegistration");
  }
}

export function validateState(state) {
  const blocking = [];
  const warnings = [];
  const fields = state.fields ?? {};

  if (!getResearchType(state.researchTypeId)) {
    blocking.push(issue("missing-research-type", "validation.missingResearchType", { fieldId: "researchTypeId" }));
  }
  if (!LIFECYCLE_STAGES.some(stage => stage.id === state.stageId)) {
    blocking.push(issue("missing-stage", "validation.missingStage", { fieldId: "stageId" }));
  }
  addAdaptiveFieldIssues({ ...state, fields }, blocking, warnings);
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
