export { RESEARCH_TYPES, RESEARCH_TYPE_IDS } from "./research-types.js";
export { LIFECYCLE_STAGES, STAGE_IDS } from "./lifecycle-stages.js";
export { STANDARD_IDS, STANDARDS } from "./standards.js";

import { LIFECYCLE_STAGES } from "./lifecycle-stages.js";
import { RESEARCH_TYPES } from "./research-types.js";
import { STANDARDS } from "./standards.js";

export function getResearchType(id) {
  return RESEARCH_TYPES.find(type => type.id === id);
}

export function getLifecycleStage(id) {
  return LIFECYCLE_STAGES.find(stage => stage.id === id);
}

export function resolveStandards(typeId, stageId) {
  return STANDARDS.filter(standard =>
    standard.researchTypes.includes(typeId) && standard.stages.includes(stageId)
  );
}

export function getAdaptiveFieldIds(typeId, stageId) {
  const type = getResearchType(typeId);
  const stage = getLifecycleStage(stageId);
  if (!type || !stage) return [];
  return [...new Set([...stage.commonFields, ...type.fields])];
}
