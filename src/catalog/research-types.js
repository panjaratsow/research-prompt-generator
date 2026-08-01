export const RESEARCH_TYPES = [
  { id: "randomized-trial", frameworks: ["PICO"], fields: ["population", "intervention", "comparator", "primaryOutcome", "endpointTiming", "allocation", "blinding"] },
  { id: "observational", frameworks: ["PECO"], fields: ["population", "exposure", "comparator", "primaryOutcome", "endpointTiming", "confounders", "dataSource"] },
  { id: "diagnostic", frameworks: ["PIRD"], fields: ["population", "targetCondition", "indexTest", "referenceStandard", "diagnosticThreshold"] },
  { id: "prediction", frameworks: ["PICOTS", "CHARMS"], fields: ["population", "predictors", "primaryOutcome", "endpointTiming", "developmentDataset", "validationDataset"] },
  { id: "evidence-review", frameworks: ["PICO", "PCC"], fields: ["reviewType", "reviewQuestion", "eligibilityCriteria", "informationSources", "synthesisMethod"] },
  { id: "qualitative-mixed", frameworks: ["SPIDER"], fields: ["sample", "phenomenon", "qualitativeDesign", "dataCollection", "analysisApproach", "reflexivity"] },
  { id: "medical-education", frameworks: ["PICO", "CIMO"], fields: ["learners", "educationalIntervention", "comparison", "learningOutcomes", "educationContext", "underlyingDesign"] },
  { id: "laboratory-animal", frameworks: ["FINER"], fields: ["modelSystem", "experimentalUnit", "intervention", "comparator", "primaryOutcome", "randomization", "blinding", "reagentValidation"] },
  { id: "ai-health-data", frameworks: ["PICOTS"], fields: ["intendedUse", "targetPopulation", "datasetProvenance", "referenceStandard", "modelInputs", "validationDataset", "performanceMeasures"] },
  { id: "implementation-qi-economic", frameworks: ["PICO", "CIMO"], fields: ["implementationProblem", "intervention", "implementationContext", "implementationOutcomes", "economicPerspective", "timeHorizon"] },
];

export const RESEARCH_TYPE_IDS = RESEARCH_TYPES.map(type => type.id);
