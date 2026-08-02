function researchType(id, frameworks, fields, designs) {
  return Object.freeze({
    id,
    frameworks: Object.freeze(frameworks),
    fields: Object.freeze(fields),
    designs: Object.freeze(designs.map(design => Object.freeze(design))),
    defaultStudyDesignId: designs[0].id,
  });
}

export const RESEARCH_TYPES = Object.freeze([
  researchType("randomized-trial", ["PICO"], ["population", "intervention", "comparator", "primaryOutcome", "endpointTiming", "allocation", "blinding"], [
    { id: "randomized-controlled-trial", name: "Randomized controlled trial" },
    { id: "cluster-randomized-trial", name: "Cluster-randomized trial" },
    { id: "pragmatic-randomized-trial", name: "Pragmatic randomized trial" },
  ]),
  researchType("observational", ["PECO"], ["population", "exposure", "comparator", "primaryOutcome", "endpointTiming", "confounders", "dataSource"], [
    { id: "cohort", name: "Cohort study" },
    { id: "case-control", name: "Case-control study" },
    { id: "cross-sectional", name: "Cross-sectional study" },
    { id: "routinely-collected-observational", name: "Routinely collected observational data" },
  ]),
  researchType("diagnostic", ["PIRD"], ["population", "targetCondition", "indexTest", "referenceStandard", "diagnosticThreshold"], [
    { id: "diagnostic-accuracy", name: "Diagnostic accuracy study" },
  ]),
  researchType("prediction", ["PICOTS", "CHARMS"], ["population", "predictors", "primaryOutcome", "endpointTiming", "developmentDataset", "validationDataset"], [
    { id: "prediction-development", name: "Prediction model development" },
    { id: "prediction-internal-validation", name: "Internal validation" },
    { id: "prediction-external-validation", name: "External validation" },
  ]),
  researchType("evidence-review", ["PICO", "PCC"], ["reviewType", "reviewQuestion", "eligibilityCriteria", "informationSources", "synthesisMethod"], [
    { id: "systematic-review", name: "Systematic review" },
    { id: "meta-analysis", name: "Systematic review with meta-analysis" },
    { id: "scoping-review", name: "Scoping review" },
  ]),
  researchType("qualitative-mixed", ["SPIDER"], ["sample", "phenomenon", "qualitativeDesign", "dataCollection", "analysisApproach", "reflexivity"], [
    { id: "qualitative-study", name: "Qualitative study" },
    { id: "mixed-methods", name: "Mixed-methods study" },
  ]),
  researchType("medical-education", ["PICO", "CIMO"], ["learners", "educationalIntervention", "comparison", "learningOutcomes", "educationContext", "underlyingDesign"], [
    { id: "education-observational", name: "Medical education observational study" },
    { id: "education-randomized-trial", name: "Medical education randomized trial" },
    { id: "education-qualitative", name: "Medical education qualitative study" },
    { id: "education-mixed-methods", name: "Medical education mixed-methods study" },
    { id: "education-quality-improvement", name: "Medical education quality improvement" },
  ]),
  researchType("laboratory-animal", ["FINER"], ["modelSystem", "experimentalUnit", "intervention", "comparator", "primaryOutcome", "randomization", "blinding", "reagentValidation"], [
    { id: "animal-study", name: "In vivo animal study" },
    { id: "laboratory-study", name: "Laboratory or translational study" },
  ]),
  researchType("ai-health-data", ["PICOTS"], ["intendedUse", "targetPopulation", "datasetProvenance", "referenceStandard", "modelInputs", "validationDataset", "performanceMeasures"], [
    { id: "ai-model-development", name: "AI model development" },
    { id: "ai-internal-validation", name: "AI internal validation" },
    { id: "ai-external-validation", name: "AI external validation" },
    { id: "ai-medical-imaging", name: "Medical imaging AI study" },
    { id: "ai-imaging-external-validation", name: "Medical imaging AI external validation" },
    { id: "ai-interventional-trial", name: "AI interventional trial" },
    { id: "ai-early-clinical-evaluation", name: "Early clinical AI evaluation" },
    { id: "ai-routinely-collected-data", name: "AI using routinely collected health data" },
  ]),
  researchType("implementation-qi-economic", ["PICO", "CIMO"], ["implementationProblem", "intervention", "implementationContext", "implementationOutcomes", "economicPerspective", "timeHorizon"], [
    { id: "implementation-study", name: "Implementation study" },
    { id: "quality-improvement", name: "Quality improvement study" },
    { id: "economic-evaluation", name: "Economic evaluation" },
    { id: "implementation-economic-evaluation", name: "Implementation study with economic evaluation" },
  ]),
]);

export const RESEARCH_TYPE_IDS = Object.freeze(RESEARCH_TYPES.map(type => type.id));
