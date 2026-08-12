export const OTHER_OPTION_ID = "other";
export const NOT_SURE_OPTION_ID = "not-sure";

export const BASE_OPTION_SETS = Object.freeze({
  "date-coverage": ["last-5-years", "last-10-years", "from-inception", "custom-range"],
  "evidence-types": ["randomized-trials", "observational-studies", "systematic-reviews", "qualitative-studies", "guidelines", "registries", "grey-literature"],
  "evidence-pattern": ["consistent", "mixed", "limited", "conflicting", "not-yet-assessed"],
  "evidence-certainty": ["high", "moderate", "low", "very-low", "not-yet-assessed"],
  "main-limitations": ["risk-of-bias", "imprecision", "inconsistency", "indirectness", "publication-bias", "sparse-evidence"],
  "grey-literature": ["trial-registry", "thesis", "conference", "government-report", "preprint"],
  "gap-type": ["population", "intervention-exposure", "comparator", "outcome", "method", "setting", "implementation", "equity"],
  "gap-evidence-support": ["multiple-sources", "single-source", "expert-observation", "not-yet-verified"],
  "gap-priority": ["high", "medium", "exploratory"],
  "hypothesis-approach": ["directional", "non-directional", "research-proposition", "exploratory-no-hypothesis"],
  "expected-direction": ["increase", "decrease", "difference-no-direction", "association-no-direction", "not-applicable"],
  "sampling-approach": ["probability", "consecutive", "purposive", "convenience", "census", "theoretical", "not-yet-decided"],
  "feasibility-period": ["under-6-months", "6-12-months", "13-24-months", "over-24-months"],
  "proposal-type": ["student-proposal", "institutional-protocol", "grant-proposal", "ethics-submission-draft", "registry-protocol"],
  "target-audience": ["supervisor-committee", "institutional-review", "funding-panel", "ethics-committee", "multidisciplinary-team"],
  "required-sections": ["background", "objectives", "methods", "analysis", "ethics-governance", "timeline", "budget", "dissemination"],
  "proposal-timeline": ["concept-only", "6-months", "12-months", "24-months", "over-24-months"],
});

export const TYPE_OPTION_SETS = Object.freeze({
  "randomized-trial": {
    questionType: ["effectiveness", "safety", "non-inferiority", "equivalence"],
    informationSources: ["medline", "embase", "central", "trial-registries"],
    synthesisMethod: ["narrative", "pairwise-meta-analysis", "certainty-assessment"],
    analysisFamily: ["intention-to-treat", "per-protocol", "mixed-model", "survival"],
    dataSourceRecruitment: ["clinic-recruitment", "community-recruitment", "registry-recruitment", "cluster-recruitment"],
  },
  observational: {
    questionType: ["association", "risk-factor", "incidence-prevalence", "prognosis"],
    informationSources: ["medline", "embase", "citation-index", "registry-data"],
    synthesisMethod: ["narrative", "quantitative-pooling", "certainty-assessment"],
    analysisFamily: ["regression", "survival", "propensity-score", "causal-inference"],
    dataSourceRecruitment: ["prospective-recruitment", "retrospective-records", "registry-data", "survey-sampling"],
  },
  diagnostic: {
    questionType: ["diagnostic-accuracy", "threshold", "clinical-utility"],
    informationSources: ["medline", "embase", "diagnostic-reviews", "trial-registries"],
    synthesisMethod: ["diagnostic-narrative", "diagnostic-meta-analysis", "certainty-assessment"],
    analysisFamily: ["sensitivity-specificity", "roc-analysis", "likelihood-ratios", "decision-curve"],
    dataSourceRecruitment: ["consecutive-clinical-sample", "case-control-sample", "screening-program", "archived-specimens"],
  },
  prediction: {
    questionType: ["model-development", "internal-validation", "external-validation", "model-updating"],
    informationSources: ["medline", "embase", "model-registries", "citation-index"],
    synthesisMethod: ["prediction-narrative", "performance-pooling", "certainty-assessment"],
    analysisFamily: ["development", "calibration-discrimination", "external-validation", "impact-analysis"],
    dataSourceRecruitment: ["prospective-cohort", "retrospective-dataset", "registry-data", "multicentre-dataset"],
  },
  "evidence-review": {
    questionType: ["effectiveness", "etiology", "diagnosis", "prognosis", "scope-map"],
    informationSources: ["medline", "embase", "central", "cinahl", "psycinfo", "eric", "grey-literature"],
    synthesisMethod: ["narrative", "pairwise-meta-analysis", "network-meta-analysis", "framework-synthesis"],
    analysisFamily: ["narrative-synthesis", "random-effects-meta-analysis", "thematic-synthesis", "evidence-map"],
    dataSourceRecruitment: ["published-literature", "registries", "grey-literature", "stakeholder-sources"],
  },
  "qualitative-mixed": {
    questionType: ["experience", "meaning", "process", "acceptability", "implementation"],
    informationSources: ["medline", "cinahl", "psycinfo", "citation-index", "grey-literature"],
    synthesisMethod: ["thematic-synthesis", "framework-synthesis", "meta-ethnography", "mixed-methods-integration"],
    analysisFamily: ["thematic-analysis", "framework-analysis", "grounded-theory", "mixed-methods-integration"],
    dataSourceRecruitment: ["purposive-recruitment", "maximum-variation", "theoretical-sampling", "survey-plus-interviews"],
  },
  "medical-education": {
    questionType: ["learning-effectiveness", "assessment-validity", "curriculum", "learner-experience"],
    informationSources: ["medline", "eric", "cinahl", "psycinfo", "scopus"],
    synthesisMethod: ["narrative", "quantitative-pooling", "thematic-synthesis", "mixed-methods-integration"],
    analysisFamily: ["group-comparison", "repeated-measures", "psychometric", "qualitative-analysis"],
    dataSourceRecruitment: ["learner-cohort", "course-enrolment", "program-records", "multisite-recruitment"],
  },
  "laboratory-animal": {
    questionType: ["mechanism", "efficacy", "toxicity", "translational-validity"],
    informationSources: ["medline", "embase", "biosis", "preclinical-registries"],
    synthesisMethod: ["narrative", "preclinical-meta-analysis", "mechanistic-synthesis"],
    analysisFamily: ["group-comparison", "dose-response", "repeated-measures", "survival"],
    dataSourceRecruitment: ["laboratory-samples", "animal-colony", "biobank-specimens", "experimental-model"],
  },
  "ai-health-data": {
    questionType: ["model-development", "internal-validation", "external-validation", "fairness", "clinical-utility"],
    informationSources: ["medline", "embase", "ieee-xplore", "model-registries", "trial-registries"],
    synthesisMethod: ["ai-narrative", "performance-pooling", "bias-fairness-synthesis"],
    analysisFamily: ["development", "calibration-discrimination", "external-validation", "fairness-analysis", "impact-analysis"],
    dataSourceRecruitment: ["retrospective-dataset", "prospective-data", "registry-data", "multicentre-external-data"],
  },
  "implementation-qi-economic": {
    questionType: ["implementation-effectiveness", "quality-improvement", "cost-effectiveness", "budget-impact"],
    informationSources: ["medline", "embase", "cinahl", "economic-databases", "grey-literature"],
    synthesisMethod: ["narrative", "realist-synthesis", "economic-synthesis", "mixed-methods-integration"],
    analysisFamily: ["implementation-outcomes", "interrupted-time-series", "cost-effectiveness", "budget-impact"],
    dataSourceRecruitment: ["routine-service-data", "prospective-sites", "quality-registry", "administrative-cost-data"],
  },
});

export const DESIGN_ANALYSIS_FAMILIES = Object.freeze({
  "randomized-controlled-trial": ["intention-to-treat", "per-protocol", "mixed-model", "survival"],
  "cluster-randomized-trial": ["cluster-adjusted-regression", "mixed-model", "generalized-estimating-equations"],
  "pragmatic-randomized-trial": ["intention-to-treat", "mixed-model", "survival", "implementation-outcomes"],
  cohort: ["regression", "survival", "propensity-score", "causal-inference"],
  "case-control": ["logistic-regression", "matched-analysis", "propensity-score"],
  "cross-sectional": ["prevalence-estimation", "regression", "survey-weighted-analysis"],
  "routinely-collected-observational": ["regression", "survival", "causal-inference", "interrupted-time-series"],
  "diagnostic-accuracy": ["sensitivity-specificity", "roc-analysis", "likelihood-ratios", "decision-curve"],
  "prediction-development": ["development", "calibration-discrimination", "internal-validation"],
  "prediction-internal-validation": ["bootstrap-validation", "cross-validation", "calibration-discrimination"],
  "prediction-external-validation": ["external-validation", "calibration-discrimination", "model-updating"],
  "systematic-review": ["narrative-synthesis", "random-effects-meta-analysis", "certainty-assessment"],
  "meta-analysis": ["fixed-effect-meta-analysis", "random-effects-meta-analysis", "network-meta-analysis", "meta-regression"],
  "scoping-review": ["evidence-map", "descriptive-summary", "framework-synthesis"],
  "qualitative-study": ["thematic-analysis", "framework-analysis", "grounded-theory"],
  "mixed-methods": ["convergent-integration", "explanatory-sequential", "exploratory-sequential"],
  "education-observational": ["group-comparison", "regression", "repeated-measures"],
  "education-randomized-trial": ["intention-to-treat", "mixed-model", "repeated-measures"],
  "education-qualitative": ["thematic-analysis", "framework-analysis", "grounded-theory"],
  "education-mixed-methods": ["convergent-integration", "explanatory-sequential", "exploratory-sequential"],
  "education-quality-improvement": ["run-chart", "statistical-process-control", "interrupted-time-series"],
  "animal-study": ["group-comparison", "dose-response", "repeated-measures", "survival"],
  "laboratory-study": ["group-comparison", "dose-response", "repeated-measures", "assay-validation"],
  "ai-model-development": ["development", "calibration-discrimination", "internal-validation"],
  "ai-internal-validation": ["bootstrap-validation", "cross-validation", "calibration-discrimination"],
  "ai-external-validation": ["external-validation", "calibration-discrimination", "fairness-analysis"],
  "ai-medical-imaging": ["development", "calibration-discrimination", "reader-comparison"],
  "ai-imaging-external-validation": ["external-validation", "reader-comparison", "fairness-analysis"],
  "ai-interventional-trial": ["intention-to-treat", "mixed-model", "clinical-impact-analysis"],
  "ai-early-clinical-evaluation": ["usability-analysis", "workflow-analysis", "early-performance-analysis"],
  "ai-routinely-collected-data": ["external-validation", "causal-inference", "fairness-analysis"],
  "implementation-study": ["implementation-outcomes", "mixed-model", "realist-evaluation"],
  "quality-improvement": ["run-chart", "statistical-process-control", "interrupted-time-series"],
  "economic-evaluation": ["cost-effectiveness", "cost-utility", "budget-impact"],
  "implementation-economic-evaluation": ["implementation-outcomes", "cost-effectiveness", "budget-impact"],
});

const DYNAMIC_OPTION_SET_IDS = new Set([
  "questionType",
  "informationSources",
  "synthesisMethod",
  "analysisFamily",
  "dataSourceRecruitment",
]);

export function resolveOptionIds(optionSetId, context = {}) {
  if (optionSetId === "analysisFamily" && DESIGN_ANALYSIS_FAMILIES[context.studyDesignId]) {
    return [...DESIGN_ANALYSIS_FAMILIES[context.studyDesignId]];
  }

  const typeOptions = context.researchTypeId && TYPE_OPTION_SETS[context.researchTypeId];
  const optionIds = DYNAMIC_OPTION_SET_IDS.has(optionSetId)
    ? typeOptions?.[optionSetId] ?? []
    : BASE_OPTION_SETS[optionSetId] ?? [];

  return optionSetId === "informationSources" && context.evidenceMode === "uploaded"
    ? ["uploaded-source-set", ...optionIds]
    : [...optionIds];
}
