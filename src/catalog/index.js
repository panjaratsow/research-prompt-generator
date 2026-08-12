export { RESEARCH_TYPES, RESEARCH_TYPE_IDS } from "./research-types.js";
export { LIFECYCLE_STAGES, STAGE_IDS, STAGE_TARGET_OUTPUTS } from "./lifecycle-stages.js";
export { STANDARD_IDS, STANDARDS, STANDARDS_REVIEWED_ON } from "./standards.js";
export {
  BASE_OPTION_SETS,
  DESIGN_ANALYSIS_FAMILIES,
  NOT_SURE_OPTION_ID,
  OTHER_OPTION_ID,
  TYPE_OPTION_SETS,
  resolveOptionIds,
} from "./adaptive-options.js";
export {
  DERIVED_FIELD_BY_STAGE,
  FIELD_DEFINITIONS,
  INHERITED_FIELDS_BY_STAGE,
  STAGE_FORM_FIELDS,
  getCompatibleFieldIds,
  getFieldDefinition,
  getInheritedContextFields,
  getStageFieldDefinitions,
  isFieldOptionCompatible,
  resolveFieldOptions,
} from "./adaptive-fields.js";

import { LIFECYCLE_STAGES } from "./lifecycle-stages.js";
import { RESEARCH_TYPES } from "./research-types.js";
import { STANDARDS } from "./standards.js";

export function getResearchType(id) {
  return RESEARCH_TYPES.find(type => type.id === id);
}

export function getLifecycleStage(id) {
  return LIFECYCLE_STAGES.find(stage => stage.id === id);
}

export function getStudyDesignOptions(typeId) {
  return getResearchType(typeId)?.designs ?? [];
}

export function getStudyDesign(typeId, studyDesignId) {
  return getStudyDesignOptions(typeId).find(design => design.id === studyDesignId);
}

export function isStandardApplicable(standard, { typeId, stageId = "", studyDesignId }) {
  return standard.applicability.some(rule =>
    rule.researchTypeId === typeId
    && (!stageId || rule.stages.includes(stageId))
    && (!rule.studyDesignIds.length || rule.studyDesignIds.includes(studyDesignId))
  );
}

export function resolveStandards(typeId, stageId, studyDesignId) {
  const type = getResearchType(typeId);
  if (!type || !getLifecycleStage(stageId)) return [];
  const designId = studyDesignId ?? type.defaultStudyDesignId;
  if (!getStudyDesign(typeId, designId)) return [];
  return STANDARDS.filter(standard => isStandardApplicable(standard, { typeId, stageId, studyDesignId: designId }));
}

export function resolveStandardsForDesign(typeId, studyDesignId) {
  const type = getResearchType(typeId);
  if (!type) return [];
  const designId = studyDesignId ?? type.defaultStudyDesignId;
  if (!getStudyDesign(typeId, designId)) return [];
  return STANDARDS.filter(standard => isStandardApplicable(standard, { typeId, studyDesignId: designId }));
}

export function getContextFieldIds(typeId, stageId, studyDesignId) {
  const type = getResearchType(typeId);
  const designId = studyDesignId ?? type?.defaultStudyDesignId;
  if (!type || !getLifecycleStage(stageId) || !getStudyDesign(typeId, designId)) return [];
  const fields = [];
  const methodsStages = ["outline-methodology", "write-proposal"];
  if (methodsStages.includes(stageId)) fields.push("registration", "ethicsApproval");
  if (typeId === "evidence-review" && stageId === "literature-review") fields.push("registration");
  if (methodsStages.includes(stageId) && ["observational", "prediction", "ai-health-data"].includes(typeId)) fields.push("dataSharingPlan");
  if (methodsStages.includes(stageId) && ["prediction-external-validation", "ai-external-validation", "ai-imaging-external-validation"].includes(designId)) fields.push("externalValidation");
  return [...new Set(fields)];
}

export function getAdaptiveFieldIds(typeId, stageId, studyDesignId) {
  const type = getResearchType(typeId);
  const stage = getLifecycleStage(stageId);
  if (!type || !stage) return [];
  return [...new Set([...stage.commonFields, ...type.fields, ...getContextFieldIds(typeId, stageId, studyDesignId)])];
}
