import {
  NOT_SURE_OPTION_ID,
  OTHER_OPTION_ID,
  isFieldOptionCompatible,
  resolveFieldOptions,
} from "./catalog/index.js";
import { t } from "./i18n.js";

export function getFieldValue(state, fieldId) {
  if (fieldId === "confirmedDesign") return state.studyDesignId;
  return state.fields?.[fieldId];
}

export function getOtherText(state, fieldId) {
  return state.fieldCustomValues?.[fieldId] ?? "";
}

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

export function getStaleOptionIds(state, field, context) {
  if (!field || !["single-select", "multi-select", "segmented"].includes(field.control)) return [];
  const value = getFieldValue(state, field.id);
  const optionIds = Array.isArray(value) ? value : [value];
  return optionIds.filter(optionId => hasMeaningfulValue(optionId)
    && !isFieldOptionCompatible(field.id, optionId, context));
}

function localesFor(outputLanguage) {
  if (outputLanguage === "thai") return ["th"];
  if (outputLanguage === "bilingual") return ["th", "en"];
  return ["en"];
}

function localizedLabel(key, outputLanguage) {
  return localesFor(outputLanguage).map(locale => {
    const translated = t(locale, key);
    return translated === key ? fallbackLabel(key, locale) : translated;
  }).join(" / ");
}

function fallbackLabel(key, locale) {
  const optionId = key.replace(/^options\./, "");
  const labels = {
    medline: ["MEDLINE/PubMed", "MEDLINE/PubMed"],
    embase: ["Embase", "Embase"],
    other: ["อื่นๆ", "Other"],
    "not-sure": ["ไม่แน่ใจ", "Not sure"],
  };
  if (labels[optionId]) return labels[optionId][locale === "th" ? 0 : 1];
  return optionId.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function serializeFieldLabel(field, outputLanguage) {
  return localizedLabel(field.labelKey, outputLanguage);
}

export function serializeDisplayValue(state, field, outputLanguage) {
  const value = getFieldValue(state, field.id);
  const optionIds = Array.isArray(value) ? value : [value];
  if (!hasMeaningfulValue(value)) return "";
  const context = {
    researchTypeId: state.researchTypeId,
    studyDesignId: state.studyDesignId,
    stageId: state.stageId,
    evidenceMode: state.evidenceMode,
    fields: state.fields,
  };
  const selected = new Set(optionIds.filter(hasMeaningfulValue));
  const orderedIds = field.optionSetId || field.id === "confirmedDesign"
    ? resolveFieldOptions(field.id, context).map(option => option.id).filter(id => selected.has(id))
    : optionIds.filter(hasMeaningfulValue);
  return orderedIds.map(optionId => {
    const label = localizedLabel(`options.${optionId}`, outputLanguage);
    return optionId === OTHER_OPTION_ID ? `${label}: ${getOtherText(state, field.id).trim()}` : label;
  }).join("; ");
}
