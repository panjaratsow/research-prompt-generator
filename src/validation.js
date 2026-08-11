import {
  LIFECYCLE_STAGES,
  getCompatibleFieldIds,
  getFieldDefinition,
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
  "stale-field-option",
]);

function issue(code, messageKey, { fieldId = "", sourceId = "" } = {}) {
  return { code, fieldId, sourceId, messageKey };
}

const DATA_SHARING_RESEARCH_TYPES = new Set(["observational", "prediction", "ai-health-data"]);

function contextualIssue(state, fieldId) {
  if (state.stageId === "outline-methodology") {
    if (fieldId === "feasibilityPeriod") return issue("missing-feasibility", "validation.missingFeasibility", { fieldId });
    if (fieldId === "ethicsGovernance") return issue("missing-ethics", "validation.missingEthics", { fieldId });
  }
  if (state.stageId === "write-proposal") {
    if (fieldId === "proposalTimeline") return issue("missing-feasibility", "validation.missingFeasibility", { fieldId });
    if (fieldId === "registration") return issue("missing-registration", "validation.missingRegistration", { fieldId });
    if (fieldId === "dataSharingPlan" && DATA_SHARING_RESEARCH_TYPES.has(state.researchTypeId)) {
      return issue("missing-data-sharing", "validation.missingDataSharing", { fieldId });
    }
    if (fieldId === "detailedGovernance") return issue("missing-ethics", "validation.missingEthics", { fieldId });
  }
  return null;
}

function requiredIssue(state, field) {
  const value = getFieldValue(state, field.id);
  const includesOther = (Array.isArray(value) ? value : [value]).includes("other");
  if (includesOther) {
    return issue(`missing-${field.id}`, "validation.validationOtherRequired", { fieldId: field.id });
  }
  const contextual = contextualIssue(state, field.id);
  if (contextual) return contextual;
  const { id: fieldId } = field;
  if (fieldId === "topic") return issue("missing-topic", "validation.missingTopic", { fieldId });
  if (fieldId === "researchQuestion") return issue("missing-question", "validation.missingQuestion", { fieldId });
  return issue(`missing-${fieldId}`, "validation.missingRequiredField", { fieldId });
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
  const context = stageContext(typeId, stageId, studyDesignId, evidenceMode, fields);
  const form = getStageFieldDefinitions(context);
  return [
    ...requiredFieldsForStage(context).map(field => field.id),
    ...(form.draft && (form.draft.required || form.draft.designCritical) ? [form.draft.id] : []),
  ];
}

function calculateStageReadiness(state, stageId, globalBlockers) {
  const context = { ...state, stageId, fields: state.fields ?? {} };
  const form = getStageFieldDefinitions(context);
  const required = requiredFieldsForStage(context);
  const missingFieldIds = new Set(required
    .filter(field => !isFieldComplete(state, field))
    .map(field => field.id));
  for (const field of required) {
    if (getStaleOptionIds(state, field, context).length) missingFieldIds.add(field.id);
  }
  const draft = form.draft ? state.drafts?.[form.draft.id] : undefined;
  if (form.draft && (form.draft.required || form.draft.designCritical)
    && (draft?.error === "composition-failed" || !hasMeaningfulValue(draft?.value))) {
    missingFieldIds.add(form.draft.id);
  }
  const missingIds = [...missingFieldIds];
  const started = required.some(field => hasMeaningfulValue(getFieldValue(state, field.id)));

  if (globalBlockers.length) return {
    status: "blocked",
    remaining: missingIds.length,
    missingFieldIds: missingIds,
    reasonCode: globalBlockers[0].code,
  };
  if (!started) return { status: "not-started", remaining: missingIds.length, missingFieldIds: missingIds, reasonCode: "" };
  if (missingIds.length) return { status: "remaining", remaining: missingIds.length, missingFieldIds: missingIds, reasonCode: "" };
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
    else if (!contextualIssue(state, field.id)) {
      warnings.push(issue(`missing-${field.id}`, "validation.missingRequiredField", { fieldId: field.id }));
    }
  }
  if (form.draft && (form.draft.required || form.draft.designCritical)) {
    const draft = state.drafts?.[form.draft.id];
    if (draft?.error === "composition-failed") {
      blocking.push(issue("draft-composition-failed", "validation.validationDraftError", { fieldId: form.draft.id }));
    } else if (!hasMeaningfulValue(draft?.value)) {
      blocking.push(issue("missing-derived-draft", "validation.missingDerivedDraft", { fieldId: form.draft.id }));
    }
  }
}

function addGlobalStaleOptionIssues(state, blocking) {
  const compatibleFieldIds = new Set(getCompatibleFieldIds(state));
  for (const fieldId of Object.keys(state.fields ?? {})) {
    if (!compatibleFieldIds.has(fieldId)) continue;
    const field = getFieldDefinition(fieldId);
    if (getStaleOptionIds(state, field, state).length) {
      blocking.push(issue("stale-field-option", "validation.validationStaleOption", { fieldId }));
    }
  }
}

function addContextualWarnings(state, warnings) {
  const form = getStageFieldDefinitions(state);
  for (const field of form.advanced) {
    const contextual = contextualIssue(state, field.id);
    if (contextual && !isFieldComplete(state, field)) {
      warnings.push(contextual);
    }
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
  addGlobalStaleOptionIssues({ ...state, fields }, blocking);
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
