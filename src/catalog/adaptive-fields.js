import { LIFECYCLE_STAGES } from "./lifecycle-stages.js";
import { RESEARCH_TYPES } from "./research-types.js";
import { getStudyDesignOptions } from "./index.js";
import {
  NOT_SURE_OPTION_ID,
  OTHER_OPTION_ID,
  resolveOptionIds,
} from "./adaptive-options.js";

export const STAGE_FORM_FIELDS = Object.freeze({
  "define-question": { simple: ["topic", "population", "questionType", "primaryOutcome"], advanced: ["problemStatement", "comparator", "endpointTiming", "additionalObjectives"], draft: "researchQuestion" },
  "literature-review": { simple: ["informationSources", "dateCoverage", "evidenceTypes", "searchConcepts"], advanced: ["booleanQuery", "eligibilityCriteria", "greyLiterature", "languageDesignLimits"], draft: "searchStrategy" },
  "synthesize-information": { simple: ["evidencePattern", "synthesisMethod", "evidenceCertainty", "mainLimitations"], advanced: ["effectMeasures", "heterogeneity", "riskOfBiasTool", "subgroupSensitivity"], draft: "evidenceSummary" },
  "identify-gaps": { simple: ["gapType", "gapEvidenceSupport", "gapContext", "gapPriority"], advanced: ["noveltyCheck", "stakeholderRelevance", "certaintyRationale", "generalizability"], draft: "researchGaps" },
  "generate-hypotheses": { simple: ["hypothesisApproach", "interventionOrExposure", "hypothesisOutcome", "expectedDirection"], advanced: ["mechanism", "alternativeHypotheses", "causalAssumptions", "effectModification"], draft: "hypotheses" },
  "outline-methodology": { simple: ["confirmedDesign", "dataSourceRecruitment", "samplingApproach", "analysisFamily", "feasibilityPeriod"], advanced: ["sampleSizePlan", "confounders", "missingDataPlan", "sensitivityAnalysis", "ethicsGovernance"], draft: "methodologyOutline" },
  "write-proposal": { simple: ["proposalType", "targetAudience", "requiredSections", "proposalTimeline"], advanced: ["budget", "registration", "dataSharingPlan", "disseminationPlan", "authorshipPlan", "detailedGovernance"], draft: "proposalOutline" },
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

const STAGE_FIELD_IDS = new Set(Object.values(STAGE_FORM_FIELDS).flatMap(config => [
  ...config.simple,
  ...config.advanced,
  config.draft,
]));

const SELECT_FIELDS = new Set([
  "questionType", "dateCoverage", "evidencePattern", "synthesisMethod", "evidenceCertainty",
  "gapType", "gapEvidenceSupport", "gapPriority", "hypothesisApproach", "expectedDirection",
  "dataSourceRecruitment", "samplingApproach", "analysisFamily", "feasibilityPeriod", "proposalType", "targetAudience",
  "proposalTimeline", "confirmedDesign",
]);
const MULTI_SELECT_FIELDS = new Set([
  "informationSources", "evidenceTypes", "mainLimitations", "greyLiterature", "requiredSections",
]);
const DERIVED_FIELDS = new Set(Object.values(DERIVED_FIELD_BY_STAGE));
const OPTION_SET_BY_FIELD = Object.freeze({
  dateCoverage: "date-coverage", evidenceTypes: "evidence-types", evidencePattern: "evidence-pattern",
  evidenceCertainty: "evidence-certainty", mainLimitations: "main-limitations", greyLiterature: "grey-literature",
  gapType: "gap-type", gapEvidenceSupport: "gap-evidence-support", gapPriority: "gap-priority",
  hypothesisApproach: "hypothesis-approach", expectedDirection: "expected-direction",
  samplingApproach: "sampling-approach", feasibilityPeriod: "feasibility-period", proposalType: "proposal-type",
  targetAudience: "target-audience", requiredSections: "required-sections", proposalTimeline: "proposal-timeline",
  questionType: "questionType", informationSources: "informationSources", synthesisMethod: "synthesisMethod",
  analysisFamily: "analysisFamily", dataSourceRecruitment: "dataSourceRecruitment",
});

function placementsFor(fieldId) {
  return Object.entries(STAGE_FORM_FIELDS).flatMap(([stageId, config]) => {
    if (config.simple.includes(fieldId)) return [{ stageId, tier: "simple", required: true, visible: true }];
    if (config.advanced.includes(fieldId)) return [{ stageId, tier: "advanced", required: false, visible: true }];
    if (config.draft === fieldId) return [{ stageId, tier: "draft", required: false, visible: true, designCritical: true }];
    return [];
  });
}

function fieldDefinition(id, overrides = {}) {
  const control = DERIVED_FIELDS.has(id)
    ? "derived-text"
    : MULTI_SELECT_FIELDS.has(id)
      ? "multi-select"
      : SELECT_FIELDS.has(id)
        ? "single-select"
        : "short-text";
  const selectable = control === "single-select" || control === "multi-select" || control === "segmented";
  return Object.freeze({
    id,
    labelKey: `fields.${id}`,
    helpKey: `fieldHelp.${id}`,
    control,
    tier: placementsFor(id)[0]?.tier ?? "compatibility",
    placements: placementsFor(id),
    optionSetId: OPTION_SET_BY_FIELD[id],
    allowOther: selectable,
    allowNotSure: selectable,
    canonical: STAGE_FIELD_IDS.has(id),
    inherited: Object.values(INHERITED_FIELDS_BY_STAGE).some(ids => ids.includes(id)),
    composeInto: DERIVED_FIELDS.has(id) ? id : undefined,
    ...overrides,
  });
}

const CATALOGUE_FIELDS = [...STAGE_FIELD_IDS].map(id => fieldDefinition(id, id === "confirmedDesign" ? {
  readOnly: true,
  allowOther: false,
  allowNotSure: false,
} : id === "ethicsGovernance" || id === "registration" || id === "detailedGovernance" ? {
  allowNotSure: false,
} : {}));

const LEGACY_STAGE_FIELDS = LIFECYCLE_STAGES.flatMap(stage => stage.commonFields);
const LEGACY_TYPE_FIELDS = RESEARCH_TYPES.flatMap(type => type.fields);
const LEGACY_CONTEXT_FIELDS = ["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"];
const LEGACY_FIELD_IDS = [...new Set([...LEGACY_STAGE_FIELDS, ...LEGACY_TYPE_FIELDS, ...LEGACY_CONTEXT_FIELDS])]
  .filter(id => !STAGE_FIELD_IDS.has(id));

function legacyRestrictions(id) {
  const researchTypeIds = RESEARCH_TYPES.filter(type => type.fields.includes(id)).map(type => type.id);
  const placements = LIFECYCLE_STAGES
    .filter(stage => stage.commonFields.includes(id))
    .map(stage => ({ stageId: stage.id, tier: "compatibility", required: false, visible: false }));
  if (id === "registration") {
    placements.push(
      { stageId: "literature-review", tier: "compatibility", required: false, visible: false, researchTypeIds: ["evidence-review"] },
      { stageId: "outline-methodology", tier: "compatibility", required: false, visible: false },
      { stageId: "write-proposal", tier: "compatibility", required: false, visible: false },
    );
  }
  if (id === "ethicsApproval") {
    placements.push(
      { stageId: "outline-methodology", tier: "compatibility", required: false, visible: false },
      { stageId: "write-proposal", tier: "compatibility", required: false, visible: false },
    );
  }
  if (id === "dataSharingPlan") {
    placements.push(
      { stageId: "outline-methodology", tier: "compatibility", required: false, visible: false, researchTypeIds: ["observational", "prediction", "ai-health-data"] },
      { stageId: "write-proposal", tier: "compatibility", required: false, visible: false, researchTypeIds: ["observational", "prediction", "ai-health-data"] },
    );
  }
  if (id === "externalValidation") {
    placements.push(
      { stageId: "outline-methodology", tier: "compatibility", required: false, visible: false, studyDesignIds: ["prediction-external-validation", "ai-external-validation", "ai-imaging-external-validation"] },
      { stageId: "write-proposal", tier: "compatibility", required: false, visible: false, studyDesignIds: ["prediction-external-validation", "ai-external-validation", "ai-imaging-external-validation"] },
    );
  }
  return { placements, researchTypeIds };
}

const COMPATIBILITY_FIELDS = LEGACY_FIELD_IDS.map(id => {
  const { placements, researchTypeIds } = legacyRestrictions(id);
  const sensitive = ["ethicsApproval", "dataSharingPlan", "externalValidation", "deidentificationConfirmed"].includes(id);
  return fieldDefinition(id, {
    placements,
    canonical: false,
    inherited: false,
    researchTypeIds,
    allowOther: false,
    allowNotSure: !sensitive,
  });
});

export const FIELD_DEFINITIONS = Object.freeze([...CATALOGUE_FIELDS, ...COMPATIBILITY_FIELDS]);
const FIELD_BY_ID = new Map(FIELD_DEFINITIONS.map(field => [field.id, field]));

export function getFieldDefinition(fieldId) {
  return FIELD_BY_ID.get(fieldId);
}

function isPlacementCompatible(placement, context) {
  return (!placement.researchTypeIds || placement.researchTypeIds.includes(context.researchTypeId))
    && (!placement.studyDesignIds || placement.studyDesignIds.includes(context.studyDesignId));
}

function resolvePlacement(field, context) {
  return field.placements.find(placement => placement.stageId === context.stageId && isPlacementCompatible(placement, context));
}

export function resolveFieldOptions(fieldId, context = {}) {
  const field = getFieldDefinition(fieldId);
  if (!field) return [];
  const selectedDesign = getStudyDesignOptions(context.researchTypeId)
    .find(design => design.id === context.studyDesignId);
  const optionIds = fieldId === "confirmedDesign"
    ? selectedDesign ? [selectedDesign.id] : []
    : resolveOptionIds(field.optionSetId, context);
  const permitted = [
    ...optionIds,
    ...(field.allowOther ? [OTHER_OPTION_ID] : []),
    ...(field.allowNotSure ? [NOT_SURE_OPTION_ID] : []),
  ];
  return permitted.map(id => ({ id, labelKey: `options.${id}` }));
}

export function isFieldOptionCompatible(fieldId, optionId, context = {}) {
  return resolveFieldOptions(fieldId, context).some(option => option.id === optionId);
}

function resolveField(fieldId, context) {
  const field = getFieldDefinition(fieldId);
  const placement = field && resolvePlacement(field, context);
  if (!field || !placement) return undefined;
  return Object.freeze({
    ...field,
    required: placement.required,
    designCritical: placement.designCritical ?? false,
    visible: placement.visible ?? true,
    options: resolveFieldOptions(fieldId, context),
  });
}

export function getStageFieldDefinitions(context) {
  const config = STAGE_FORM_FIELDS[context.stageId];
  if (!config) return { simple: [], advanced: [], draft: undefined };
  return {
    simple: config.simple.map(id => resolveField(id, context)).filter(Boolean),
    advanced: config.advanced.map(id => resolveField(id, context)).filter(Boolean),
    draft: resolveField(config.draft, context),
  };
}

export function getInheritedContextFields(context) {
  return (INHERITED_FIELDS_BY_STAGE[context.stageId] ?? [])
    .map(id => getFieldDefinition(id))
    .filter(Boolean);
}

function matchesTypeAndDesign(field, context) {
  const typeCompatible = !field.researchTypeIds?.length || field.researchTypeIds.includes(context.researchTypeId);
  const placementCompatible = field.placements.length === 0
    ? Boolean(field.researchTypeIds?.length)
    : field.placements.some(placement => isPlacementCompatible(placement, context));
  return typeCompatible && placementCompatible;
}

export function getCompatibleFieldIds(context) {
  const stageIds = Object.values(STAGE_FORM_FIELDS).flatMap(config => [
    ...config.simple,
    ...config.advanced,
    config.draft,
  ]);
  const compatibleIds = FIELD_DEFINITIONS
    .filter(field => matchesTypeAndDesign(field, context))
    .map(field => field.id);
  return [...new Set([...stageIds, ...compatibleIds])];
}
