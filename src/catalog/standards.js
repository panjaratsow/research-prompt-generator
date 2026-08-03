export const STANDARDS_REVIEWED_ON = "2026-08-01";

export const STANDARD_IDS = Object.freeze([
  "spirit-2025", "consort-2025", "ich-gcp-e6-r3", "strobe", "record",
  "stard", "tripod", "tripod-ai", "prisma-p", "prisma-2020", "prisma-scr",
  "grade", "coreq", "srqr", "greet", "squire-edu", "arrive-2",
  "spirit-ai", "consort-ai", "decide-ai", "claim", "stari", "squire",
  "tidier", "cheers-2022",
]);

function applicability(researchTypeId, stages, studyDesignIds = []) {
  return Object.freeze({
    researchTypeId,
    stages: Object.freeze(stages),
    studyDesignIds: Object.freeze(studyDesignIds),
  });
}

function standard(id, name, version, officialUrl, rules) {
  const applicabilityRules = Object.freeze(rules);
  return Object.freeze({
    id,
    name,
    version,
    officialUrl,
    reviewedOn: STANDARDS_REVIEWED_ON,
    applicability: applicabilityRules,
    researchTypes: Object.freeze([...new Set(rules.map(rule => rule.researchTypeId))]),
    stages: Object.freeze([...new Set(rules.flatMap(rule => rule.stages))]),
  });
}

const METHODS_AND_PROPOSAL = ["outline-methodology", "write-proposal"];
const REVIEW_AND_SYNTHESIS = ["literature-review", "synthesize-information"];
const SYNTHESIS_AND_GAPS = ["synthesize-information", "identify-gaps"];

export const STANDARDS = Object.freeze([
  standard("spirit-2025", "Standard Protocol Items: Recommendations for Interventional Trials", "SPIRIT 2025", "https://www.consort-spirit.org/", [
    applicability("randomized-trial", METHODS_AND_PROPOSAL),
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-randomized-trial"]),
  ]),
  standard("consort-2025", "Consolidated Standards of Reporting Trials", "CONSORT 2025", "https://www.consort-spirit.org/", [
    applicability("randomized-trial", METHODS_AND_PROPOSAL),
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-randomized-trial"]),
  ]),
  standard("ich-gcp-e6-r3", "Good Clinical Practice", "ICH E6(R3)", "https://www.ich.org/page/efficacy-guidelines", [
    applicability("randomized-trial", METHODS_AND_PROPOSAL),
  ]),
  standard("strobe", "Strengthening the Reporting of Observational Studies in Epidemiology", "STROBE Statement", "https://www.strobe-statement.org/", [
    applicability("observational", METHODS_AND_PROPOSAL),
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-observational"]),
  ]),
  standard("record", "REporting of studies Conducted using Observational Routinely-collected health Data", "RECORD Statement", "https://www.record-statement.org/", [
    applicability("observational", METHODS_AND_PROPOSAL, ["routinely-collected-observational"]),
    applicability("ai-health-data", METHODS_AND_PROPOSAL, ["ai-routinely-collected-data"]),
  ]),
  standard("stard", "Standards for Reporting Diagnostic Accuracy Studies", "STARD 2015", "https://www.equator-network.org/reporting-guidelines/stard/", [
    applicability("diagnostic", METHODS_AND_PROPOSAL),
  ]),
  standard("tripod", "Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis", "TRIPOD Statement", "https://www.tripod-statement.org/", [
    applicability("prediction", METHODS_AND_PROPOSAL),
  ]),
  standard("tripod-ai", "Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis using Artificial Intelligence", "TRIPOD+AI", "https://www.tripod-statement.org/", [
    applicability("ai-health-data", METHODS_AND_PROPOSAL, ["ai-model-development", "ai-internal-validation", "ai-external-validation", "ai-medical-imaging", "ai-imaging-external-validation"]),
  ]),
  standard("prisma-p", "Preferred Reporting Items for Systematic Review and Meta-Analysis Protocols", "PRISMA-P 2015", "https://www.prisma-statement.org/protocols", [
    applicability("evidence-review", METHODS_AND_PROPOSAL, ["systematic-review", "meta-analysis", "scoping-review"]),
  ]),
  standard("prisma-2020", "Preferred Reporting Items for Systematic Reviews and Meta-Analyses", "PRISMA 2020", "https://www.prisma-statement.org/prisma-2020", [
    applicability("evidence-review", REVIEW_AND_SYNTHESIS, ["systematic-review", "meta-analysis"]),
  ]),
  standard("prisma-scr", "Preferred Reporting Items for Systematic Reviews and Meta-Analyses extension for Scoping Reviews", "PRISMA-ScR", "https://www.prisma-statement.org/scoping", [
    applicability("evidence-review", REVIEW_AND_SYNTHESIS, ["scoping-review"]),
  ]),
  standard("grade", "Grading of Recommendations Assessment, Development and Evaluation", "GRADE", "https://www.gradeworkinggroup.org/", [
    applicability("evidence-review", SYNTHESIS_AND_GAPS, ["systematic-review", "meta-analysis"]),
  ]),
  standard("coreq", "Consolidated Criteria for Reporting Qualitative Research", "COREQ", "https://www.equator-network.org/reporting-guidelines/coreq/", [
    applicability("qualitative-mixed", METHODS_AND_PROPOSAL, ["qualitative-study", "mixed-methods"]),
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-qualitative", "education-mixed-methods"]),
  ]),
  standard("srqr", "Standards for Reporting Qualitative Research", "SRQR", "https://www.equator-network.org/reporting-guidelines/srqr/", [
    applicability("qualitative-mixed", METHODS_AND_PROPOSAL, ["qualitative-study", "mixed-methods"]),
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-qualitative", "education-mixed-methods"]),
  ]),
  standard("greet", "Guideline for Reporting Evidence-based practice Educational interventions and Teaching", "GREET", "https://www.equator-network.org/reporting-guidelines/greet/", [
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-randomized-trial"]),
  ]),
  standard("squire-edu", "Standards for Quality Improvement Reporting Excellence in Education", "SQUIRE-EDU", "https://www.squire-statement.org/", [
    applicability("medical-education", METHODS_AND_PROPOSAL, ["education-quality-improvement"]),
  ]),
  standard("arrive-2", "Animal Research: Reporting of In Vivo Experiments", "ARRIVE 2.0", "https://arriveguidelines.org/", [
    applicability("laboratory-animal", METHODS_AND_PROPOSAL, ["animal-study"]),
  ]),
  standard("spirit-ai", "Standard Protocol Items: Recommendations for Interventional Trials-Artificial Intelligence", "SPIRIT-AI", "https://www.nature.com/articles/s41591-020-1037-7", [
    applicability("ai-health-data", METHODS_AND_PROPOSAL, ["ai-interventional-trial"]),
  ]),
  standard("consort-ai", "Consolidated Standards of Reporting Trials-Artificial Intelligence", "CONSORT-AI", "https://www.nature.com/articles/s41591-020-1034-x", [
    applicability("ai-health-data", METHODS_AND_PROPOSAL, ["ai-interventional-trial"]),
  ]),
  standard("decide-ai", "Reporting guidelines for early-stage clinical evaluation of decision support systems driven by artificial intelligence", "DECIDE-AI", "https://www.nature.com/articles/s41591-022-01772-9", [
    applicability("ai-health-data", METHODS_AND_PROPOSAL, ["ai-early-clinical-evaluation"]),
  ]),
  standard("claim", "Checklist for Artificial Intelligence in Medical Imaging", "CLAIM", "https://pubs.rsna.org/doi/10.1148/ryai.2020200029", [
    applicability("ai-health-data", METHODS_AND_PROPOSAL, ["ai-medical-imaging", "ai-imaging-external-validation"]),
  ]),
  standard("stari", "Standards for Reporting Implementation Studies", "StaRI", "https://www.equator-network.org/reporting-guidelines/stari-statement/", [
    applicability("implementation-qi-economic", METHODS_AND_PROPOSAL, ["implementation-study", "implementation-economic-evaluation"]),
  ]),
  standard("squire", "Standards for Quality Improvement Reporting Excellence", "SQUIRE 2.0", "https://www.squire-statement.org/", [
    applicability("implementation-qi-economic", METHODS_AND_PROPOSAL, ["quality-improvement"]),
  ]),
  standard("tidier", "Template for Intervention Description and Replication", "TIDieR", "https://www.equator-network.org/reporting-guidelines/tidier/", [
    applicability("implementation-qi-economic", METHODS_AND_PROPOSAL, ["implementation-study", "quality-improvement", "implementation-economic-evaluation"]),
  ]),
  standard("cheers-2022", "Consolidated Health Economic Evaluation Reporting Standards", "CHEERS 2022", "https://www.ispor.org/heor-resources/cheers", [
    applicability("implementation-qi-economic", METHODS_AND_PROPOSAL, ["economic-evaluation", "implementation-economic-evaluation"]),
  ]),
]);
