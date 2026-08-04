export const LIFECYCLE_STAGES = [
  { id: "define-question", task: "Define a focused, significant, and feasible research question.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome"] },
  { id: "literature-review", task: "Plan and conduct a reproducible, critical review of relevant literature.", commonFields: ["topic", "population", "researchQuestion", "informationSources", "searchStrategy", "eligibilityCriteria"] },
  { id: "synthesize-information", task: "Critically synthesize source-supported information, limitations, and certainty.", commonFields: ["topic", "researchQuestion", "existingInformation", "evidenceSummary", "evidenceCertainty", "synthesisMethod"] },
  { id: "identify-gaps", task: "Identify and justify research gaps from the reviewed and synthesized information.", commonFields: ["topic", "researchQuestion", "evidenceSummary", "evidenceCertainty", "researchGaps"] },
  { id: "generate-hypotheses", task: "Generate testable hypotheses, research propositions, or a justified non-hypothesis approach.", commonFields: ["topic", "researchQuestion", "researchGaps", "hypotheses", "primaryOutcome"] },
  { id: "outline-methodology", task: "Outline a rigorous, feasible, ethical, and design-appropriate research methodology.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "hypotheses", "primaryOutcome", "methodologyOutline", "resourcesTimeline", "existingInformation"] },
  { id: "write-proposal", task: "Integrate the research question, evidence, gaps, hypotheses, and methodology into a research proposal.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "evidenceSummary", "researchGaps", "hypotheses", "primaryOutcome", "methodologyOutline", "resourcesTimeline", "existingInformation"] },
];

export const STAGE_IDS = LIFECYCLE_STAGES.map(stage => stage.id);

export const STAGE_TARGET_OUTPUTS = Object.freeze({
  "define-question": "research-question",
  "literature-review": "literature-review-strategy",
  "synthesize-information": "evidence-synthesis",
  "identify-gaps": "research-gap-analysis",
  "generate-hypotheses": "hypotheses-propositions",
  "outline-methodology": "methodology-outline",
  "write-proposal": "research-proposal",
});
