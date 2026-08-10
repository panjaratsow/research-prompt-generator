import {
  RESEARCH_TYPE_IDS,
  STAGE_IDS,
  STAGE_TARGET_OUTPUTS,
  DERIVED_FIELD_BY_STAGE,
  getCompatibleFieldIds,
  getFieldDefinition,
  getResearchType,
  getStudyDesign,
} from "./catalog/index.js";
import { syncDrafts as syncComposedDrafts } from "./draft-composer.js";
import { getOtherText, getStaleOptionIds, hasMeaningfulValue, normalizeFieldValue } from "./field-values.js";

export const RESEARCHER_ROLES = Object.freeze([
  "postgraduate-student", "research-fellow", "faculty-researcher",
  "clinician-investigator", "health-professional", "statistician",
]);
export const EXPERIENCE_LEVELS = Object.freeze(["novice", "intermediate", "advanced"]);
export const TARGET_OUTPUTS = Object.freeze([
  "stage-appropriate-deliverable", "research-question", "literature-review-strategy",
  "evidence-synthesis", "research-gap-analysis", "hypotheses-propositions",
  "methodology-outline", "research-proposal",
]);
export const CITATION_STYLES = Object.freeze(["Vancouver", "AMA", "APA 7", "None"]);
export const TARGET_OUTPUT_STAGES = Object.freeze({
  "research-question": "define-question",
  "literature-review-strategy": "literature-review",
  "evidence-synthesis": "synthesize-information",
  "research-gap-analysis": "identify-gaps",
  "hypotheses-propositions": "generate-hypotheses",
  "methodology-outline": "outline-methodology",
  "research-proposal": "write-proposal",
});

const INTERFACE_LOCALES = ["th", "en"];
const EVIDENCE_MODES = ["uploaded", "web-research", "planning"];
const OUTPUT_LANGUAGES = ["thai", "english", "bilingual"];
const EVIDENCE_BUDGETS = [25000, 60000, 120000];
const PROMPT_DRAWER_STATES = ["closed", "open"];
const SETUP_FIELDS = new Set([
  "researcherRole", "experienceLevel", "scientificField",
  "institutionSetting", "targetOutput", "citationStyle",
]);
const SETUP_ENUMS = {
  researcherRole: RESEARCHER_ROLES,
  experienceLevel: EXPERIENCE_LEVELS,
  targetOutput: TARGET_OUTPUTS,
  citationStyle: CITATION_STYLES,
};

function assertEnum(value, values) {
  if (!values.includes(value)) throw new RangeError(`Unknown value: ${value}`);
}

export function getIncompatiblePopulatedFieldIds(fields, allowedFieldIds) {
  const allowed = allowedFieldIds instanceof Set ? allowedFieldIds : new Set(allowedFieldIds);
  return Object.entries(fields ?? {})
    .filter(([id, value]) => !allowed.has(id) && hasMeaningfulValue(value))
    .map(([id]) => id);
}

export function getCompatibleTargetOutputs(stageId) {
  assertEnum(stageId, STAGE_IDS);
  return TARGET_OUTPUTS;
}

export function resolveTargetOutput(stageId, targetOutput) {
  assertEnum(stageId, STAGE_IDS);
  assertEnum(targetOutput, TARGET_OUTPUTS);
  return STAGE_TARGET_OUTPUTS[stageId];
}

function cloneFieldValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

function createDrafts() {
  return Object.fromEntries(Object.values(DERIVED_FIELD_BY_STAGE).map(fieldId => [fieldId, {
    suggested: "", value: "", customized: false, error: "",
  }]));
}

function contextFor(state, overrides = {}) {
  return {
    researchTypeId: state.researchTypeId,
    studyDesignId: state.studyDesignId,
    stageId: state.stageId,
    evidenceMode: state.evidenceMode,
    fields: state.fields,
    ...overrides,
  };
}

function transitionResult(state, nextContext, confirmed, analysis) {
  const needsConfirmation = analysis.fieldIds.length > 0 || Object.keys(analysis.optionIdsByField).length > 0;
  return {
    state: confirmed || !needsConfirmation ? syncDrafts(applyContextTransition(state, nextContext, analysis)) : state,
    needsConfirmation: !confirmed && needsConfirmation,
    analysis,
    incompatible: analysis.fieldIds,
  };
}

function cloneSource(source) {
  return {
    ...source,
    ...(Array.isArray(source.warnings) ? { warnings: [...source.warnings] } : {}),
    ...(Array.isArray(source.identifierHints) ? { identifierHints: [...source.identifierHints] } : {}),
  };
}

export function createInitialState() {
  const researchType = getResearchType("observational");
  return {
    researchTypeId: researchType.id,
    studyDesignId: researchType.defaultStudyDesignId,
    stageId: "define-question",
    interfaceLocale: "th",
    evidenceMode: "planning",
    outputLanguage: "bilingual",
    researcherRole: "faculty-researcher",
    experienceLevel: "intermediate",
    scientificField: "",
    institutionSetting: "Thailand; medical university or teaching hospital",
    targetOutput: "stage-appropriate-deliverable",
    citationStyle: "Vancouver",
    evidenceBudget: 60000,
    deidentificationConfirmed: false,
    fields: {},
    fieldCustomValues: {},
    drafts: createDrafts(),
    advancedOpenByStage: Object.fromEntries(STAGE_IDS.map(stageId => [stageId, false])),
    researchProfileOpen: false,
    sources: [],
    promptDrawer: "closed",
  };
}

export function setField(state, fieldId, value) {
  const field = getFieldDefinition(fieldId);
  if (!field) throw new RangeError(`Unknown field: ${fieldId}`);
  if (field.readOnly) throw new RangeError(`${fieldId} is read-only`);
  const normalized = normalizeFieldValue(field, value);
  if (state.drafts?.[fieldId]) return setDraftValue(state, fieldId, normalized);
  return syncDrafts({ ...state, fields: { ...state.fields, [fieldId]: normalized } });
}

export function setFieldCustomValue(state, fieldId, value) {
  if (!getFieldDefinition(fieldId)) throw new RangeError(`Unknown field: ${fieldId}`);
  if (typeof value !== "string") throw new TypeError(`${fieldId} requires a string`);
  return syncDrafts({ ...state, fieldCustomValues: { ...state.fieldCustomValues, [fieldId]: value.trim() } });
}

export function setAdvancedOpen(state, stageId, open) {
  assertEnum(stageId, STAGE_IDS);
  return { ...state, advancedOpenByStage: { ...state.advancedOpenByStage, [stageId]: Boolean(open) } };
}

export function setResearchProfileOpen(state, open) {
  return { ...state, researchProfileOpen: Boolean(open) };
}

export function setSetupField(state, fieldId, value) {
  if (!SETUP_FIELDS.has(fieldId)) throw new RangeError(`Unknown setup field: ${fieldId}`);
  if (SETUP_ENUMS[fieldId]) assertEnum(value, SETUP_ENUMS[fieldId]);
  if (fieldId === "targetOutput") return setTargetOutput(state, value);
  return { ...state, [fieldId]: value };
}

export function setStudyDesign(state, studyDesignId, confirmed = false, analysis) {
  if (!getStudyDesign(state.researchTypeId, studyDesignId)) {
    throw new RangeError(`Unknown study design for ${state.researchTypeId}: ${studyDesignId}`);
  }
  const nextContext = contextFor(state, { studyDesignId });
  return transitionResult(state, nextContext, confirmed, analysis ?? analyzeContextTransition(state, nextContext));
}

export function setResearchType(state, nextTypeId, confirmed = false, analysis) {
  assertEnum(nextTypeId, RESEARCH_TYPE_IDS);
  const nextType = getResearchType(nextTypeId);
  const nextContext = contextFor(state, {
    researchTypeId: nextTypeId,
    studyDesignId: nextType.defaultStudyDesignId,
  });
  return transitionResult(state, nextContext, confirmed, analysis ?? analyzeContextTransition(state, nextContext));
}

export function setStage(state, nextStageId) {
  assertEnum(nextStageId, STAGE_IDS);
  return {
    ...state,
    stageId: nextStageId,
    targetOutput: "stage-appropriate-deliverable",
  };
}

export function setTargetOutput(state, targetOutput) {
  assertEnum(targetOutput, TARGET_OUTPUTS);
  if (targetOutput === "stage-appropriate-deliverable") return syncDrafts({ ...state, targetOutput });
  return syncDrafts({ ...state, targetOutput, stageId: TARGET_OUTPUT_STAGES[targetOutput] });
}

export function analyzeContextTransition(state, nextContext) {
  const next = contextFor(state, nextContext);
  const compatibleIds = new Set(getCompatibleFieldIds(next));
  const fieldIds = [];
  const optionIdsByField = {};
  const fieldIdsWithValues = new Set([...Object.keys(state.fields ?? {}), ...Object.keys(state.fieldCustomValues ?? {})]);

  for (const fieldId of fieldIdsWithValues) {
    const field = getFieldDefinition(fieldId);
    const value = state.fields?.[fieldId];
    const customValue = getOtherText(state, fieldId);
    if (!field || !compatibleIds.has(fieldId)) {
      if (hasMeaningfulValue(value) || Boolean(customValue.trim())) fieldIds.push(fieldId);
      continue;
    }
    const staleOptionIds = getStaleOptionIds(state, field, next);
    if (staleOptionIds.length) optionIdsByField[fieldId] = staleOptionIds;
  }
  return { fieldIds, optionIdsByField };
}

export function applyContextTransition(state, nextContext, analysis) {
  const next = contextFor(state, nextContext);
  const nextFields = { ...state.fields };
  const nextCustomValues = { ...state.fieldCustomValues };
  const clearedFields = new Set(analysis.fieldIds);

  for (const fieldId of clearedFields) {
    delete nextFields[fieldId];
    delete nextCustomValues[fieldId];
  }
  for (const [fieldId, staleOptionIds] of Object.entries(analysis.optionIdsByField)) {
    if (clearedFields.has(fieldId)) continue;
    const value = nextFields[fieldId];
    const stale = new Set(staleOptionIds);
    if (Array.isArray(value)) {
      const remaining = value.filter(optionId => !stale.has(optionId));
      if (remaining.length) nextFields[fieldId] = remaining;
      else delete nextFields[fieldId];
      if (!remaining.includes("other")) delete nextCustomValues[fieldId];
    } else if (stale.has(value)) {
      delete nextFields[fieldId];
      delete nextCustomValues[fieldId];
    }
  }
  return {
    ...state,
    researchTypeId: next.researchTypeId,
    studyDesignId: next.studyDesignId,
    stageId: next.stageId,
    evidenceMode: next.evidenceMode,
    fields: nextFields,
    fieldCustomValues: nextCustomValues,
  };
}

export function setInterfaceLocale(state, locale) {
  assertEnum(locale, INTERFACE_LOCALES);
  return syncDrafts({ ...state, interfaceLocale: locale }, locale, "locale");
}

export function syncDrafts(state, locale = state.interfaceLocale, mode = "structured") {
  return syncComposedDrafts(state, locale, mode);
}

export function setDraftValue(state, draftId, value) {
  const previous = state.drafts?.[draftId];
  if (!previous) throw new RangeError(`Unknown draft: ${draftId}`);
  if (typeof value !== "string") throw new TypeError(`${draftId} requires a string`);
  return syncDrafts({
    ...state,
    drafts: {
      ...state.drafts,
      [draftId]: { ...previous, value, customized: value !== previous.suggested },
    },
    fields: { ...state.fields, [draftId]: value },
  });
}

export function restoreDraft(state, draftId, locale = state.interfaceLocale) {
  const current = syncDrafts(state, locale);
  const previous = current.drafts?.[draftId];
  if (!previous) throw new RangeError(`Unknown draft: ${draftId}`);
  return syncDrafts({
    ...current,
    drafts: {
      ...current.drafts,
      [draftId]: { ...previous, value: previous.suggested, customized: false, error: "" },
    },
    fields: { ...current.fields, [draftId]: previous.suggested },
  }, locale);
}

export function setEvidenceMode(state, mode) {
  assertEnum(mode, EVIDENCE_MODES);
  return { ...state, evidenceMode: mode };
}

export function setOutputLanguage(state, language) {
  assertEnum(language, OUTPUT_LANGUAGES);
  return { ...state, outputLanguage: language };
}

export function setEvidenceBudget(state, budget) {
  assertEnum(budget, EVIDENCE_BUDGETS);
  return { ...state, evidenceBudget: budget };
}

export function setDeidentificationConfirmed(state, confirmed) {
  return { ...state, deidentificationConfirmed: Boolean(confirmed) };
}

export function setPromptDrawer(state, value) {
  assertEnum(value, PROMPT_DRAWER_STATES);
  return { ...state, promptDrawer: value };
}

export function replaceSources(state, sources) {
  return { ...state, sources: Array.from(sources ?? [], cloneSource) };
}

export function createPublicWorkspaceState(state) {
  return {
    ...state,
    fields: Object.fromEntries(Object.entries(state.fields ?? {}).map(([id, value]) => [id, cloneFieldValue(value)])),
    fieldCustomValues: { ...state.fieldCustomValues },
    drafts: Object.fromEntries(Object.entries(state.drafts ?? {}).map(([id, draft]) => [id, { ...draft }])),
    advancedOpenByStage: { ...state.advancedOpenByStage },
    sources: Array.from(state.sources ?? [], source => ({
      id: source.id ?? "",
      filename: source.filename ?? "",
      type: source.type ?? "",
      size: source.size,
      status: source.status ?? "",
      included: Boolean(source.included),
      warnings: Array.isArray(source.warnings) ? [...source.warnings] : [],
      error: source.error ?? "",
      extractedCharacters: typeof source.text === "string" ? source.text.length : 0,
    })),
  };
}

export function resetState() {
  return createInitialState();
}
