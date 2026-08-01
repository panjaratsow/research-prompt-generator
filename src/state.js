import {
  RESEARCH_TYPE_IDS,
  STAGE_IDS,
  getAdaptiveFieldIds,
} from "./catalog/index.js";

const INTERFACE_LOCALES = ["th", "en"];
const EVIDENCE_MODES = ["uploaded", "web-research", "planning"];
const OUTPUT_LANGUAGES = ["thai", "english", "bilingual"];
const EVIDENCE_BUDGETS = [25000, 60000, 120000];
const PROMPT_DRAWER_STATES = ["closed", "open"];

function assertEnum(value, values) {
  if (!values.includes(value)) {
    throw new RangeError(`Unknown value: ${value}`);
  }
}

function filterCompatibleFields(fields, typeId, stageId) {
  const allowed = new Set(getAdaptiveFieldIds(typeId, stageId));
  return Object.fromEntries(Object.entries(fields).filter(([id]) => allowed.has(id)));
}

function cloneState(state) {
  return structuredClone(state);
}

export function createInitialState() {
  return {
    researchTypeId: "observational",
    stageId: "question",
    interfaceLocale: "th",
    evidenceMode: "planning",
    outputLanguage: "bilingual",
    evidenceBudget: 60000,
    deidentificationConfirmed: false,
    fields: {},
    sources: [],
    promptDrawer: "closed",
  };
}

export function setField(state, fieldId, value) {
  const next = cloneState(state);
  next.fields[fieldId] = structuredClone(value);
  return next;
}

export function setResearchType(state, nextTypeId, confirmed = false) {
  assertEnum(nextTypeId, RESEARCH_TYPE_IDS);

  const allowed = new Set(getAdaptiveFieldIds(nextTypeId, state.stageId));
  const incompatible = Object.keys(state.fields).filter(id => !allowed.has(id));
  if (incompatible.length && !confirmed) {
    return { state, needsConfirmation: true, incompatible };
  }

  const next = cloneState(state);
  next.researchTypeId = nextTypeId;
  next.fields = filterCompatibleFields(state.fields, nextTypeId, state.stageId);
  return { state: next, needsConfirmation: false, incompatible };
}

export function setStage(state, nextStageId) {
  assertEnum(nextStageId, STAGE_IDS);

  const next = cloneState(state);
  next.stageId = nextStageId;
  next.fields = filterCompatibleFields(state.fields, state.researchTypeId, nextStageId);
  return next;
}

export function setInterfaceLocale(state, locale) {
  assertEnum(locale, INTERFACE_LOCALES);
  return { ...cloneState(state), interfaceLocale: locale };
}

export function setEvidenceMode(state, mode) {
  assertEnum(mode, EVIDENCE_MODES);
  return { ...cloneState(state), evidenceMode: mode };
}

export function setOutputLanguage(state, language) {
  assertEnum(language, OUTPUT_LANGUAGES);
  return { ...cloneState(state), outputLanguage: language };
}

export function setEvidenceBudget(state, budget) {
  assertEnum(budget, EVIDENCE_BUDGETS);
  return { ...cloneState(state), evidenceBudget: budget };
}

export function setDeidentificationConfirmed(state, confirmed) {
  return { ...cloneState(state), deidentificationConfirmed: Boolean(confirmed) };
}

export function setPromptDrawer(state, value) {
  assertEnum(value, PROMPT_DRAWER_STATES);
  return { ...cloneState(state), promptDrawer: value };
}

export function replaceSources(state, sources) {
  return { ...cloneState(state), sources: structuredClone(sources) };
}

export function resetState() {
  return createInitialState();
}
