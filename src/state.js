import {
  RESEARCH_TYPE_IDS,
  STAGE_IDS,
  STAGE_TARGET_OUTPUTS,
  getAdaptiveFieldIds,
  getResearchType,
  getStudyDesign,
} from "./catalog/index.js";

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

function filterCompatibleFields(fields, typeId, stageId, studyDesignId) {
  const allowed = new Set(getAdaptiveFieldIds(typeId, stageId, studyDesignId));
  return Object.fromEntries(Object.entries(fields).filter(([id]) => allowed.has(id)));
}

function hasMeaningfulFieldValue(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulFieldValue);
  return value != null;
}

export function getIncompatiblePopulatedFieldIds(fields, allowedFieldIds) {
  const allowed = allowedFieldIds instanceof Set ? allowedFieldIds : new Set(allowedFieldIds);
  return Object.entries(fields ?? {})
    .filter(([id, value]) => !allowed.has(id) && hasMeaningfulFieldValue(value))
    .map(([id]) => id);
}

export function getCompatibleTargetOutputs(stageId) {
  assertEnum(stageId, STAGE_IDS);
  return ["stage-appropriate-deliverable", STAGE_TARGET_OUTPUTS[stageId]];
}

export function resolveTargetOutput(stageId, targetOutput) {
  assertEnum(stageId, STAGE_IDS);
  assertEnum(targetOutput, TARGET_OUTPUTS);
  return STAGE_TARGET_OUTPUTS[stageId];
}

function cloneFieldValue(value) {
  return Array.isArray(value) ? [...value] : value;
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
    sources: [],
    promptDrawer: "closed",
  };
}

export function setField(state, fieldId, value) {
  return { ...state, fields: { ...state.fields, [fieldId]: cloneFieldValue(value) } };
}

export function setSetupField(state, fieldId, value) {
  if (!SETUP_FIELDS.has(fieldId)) throw new RangeError(`Unknown setup field: ${fieldId}`);
  if (SETUP_ENUMS[fieldId]) assertEnum(value, SETUP_ENUMS[fieldId]);
  if (fieldId === "targetOutput" && !getCompatibleTargetOutputs(state.stageId).includes(value)) {
    throw new RangeError(`Target output ${value} is incompatible with stage ${state.stageId}`);
  }
  return { ...state, [fieldId]: value };
}

export function setStudyDesign(state, studyDesignId) {
  if (!getStudyDesign(state.researchTypeId, studyDesignId)) {
    throw new RangeError(`Unknown study design for ${state.researchTypeId}: ${studyDesignId}`);
  }
  return {
    ...state,
    studyDesignId,
    fields: filterCompatibleFields(state.fields, state.researchTypeId, state.stageId, studyDesignId),
  };
}

export function setResearchType(state, nextTypeId, confirmed = false) {
  assertEnum(nextTypeId, RESEARCH_TYPE_IDS);
  const nextType = getResearchType(nextTypeId);
  const allowed = new Set(getAdaptiveFieldIds(nextTypeId, state.stageId, nextType.defaultStudyDesignId));
  const incompatible = getIncompatiblePopulatedFieldIds(state.fields, allowed);
  if (incompatible.length && !confirmed) {
    return { state, needsConfirmation: true, incompatible };
  }

  return {
    state: {
      ...state,
      researchTypeId: nextTypeId,
      studyDesignId: nextType.defaultStudyDesignId,
      fields: filterCompatibleFields(state.fields, nextTypeId, state.stageId, nextType.defaultStudyDesignId),
    },
    needsConfirmation: false,
    incompatible,
  };
}

export function setStage(state, nextStageId) {
  assertEnum(nextStageId, STAGE_IDS);
  const compatibleTargetOutputs = getCompatibleTargetOutputs(nextStageId);
  return {
    ...state,
    stageId: nextStageId,
    targetOutput: compatibleTargetOutputs.includes(state.targetOutput)
      ? state.targetOutput
      : "stage-appropriate-deliverable",
    fields: filterCompatibleFields(state.fields, state.researchTypeId, nextStageId, state.studyDesignId),
  };
}

export function setInterfaceLocale(state, locale) {
  assertEnum(locale, INTERFACE_LOCALES);
  return { ...state, interfaceLocale: locale };
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
