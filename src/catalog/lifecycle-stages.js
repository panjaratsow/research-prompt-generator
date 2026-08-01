export const LIFECYCLE_STAGES = [
  { id: "question", task: "Frame the problem, significance, and research question.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome"] },
  { id: "evidence", task: "Discover, appraise, and synthesize evidence.", commonFields: ["topic", "population", "researchQuestion", "informationSources"] },
  { id: "protocol", task: "Develop the protocol and study design.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome", "resourcesTimeline", "existingInformation"] },
  { id: "ethics-governance", task: "Plan ethics, governance, registration, and data stewardship.", commonFields: ["topic", "population", "researchQuestion", "existingInformation"] },
  { id: "analysis-plan", task: "Develop the statistical or analytical plan.", commonFields: ["topic", "population", "researchQuestion", "primaryOutcome"] },
  { id: "proposal", task: "Draft a proposal or grant application.", commonFields: ["topic", "problemStatement", "population", "researchQuestion", "primaryOutcome", "resourcesTimeline"] },
  { id: "conduct-quality", task: "Plan study conduct, monitoring, and quality assurance.", commonFields: ["topic", "population", "researchQuestion", "primaryOutcome", "existingInformation"] },
  { id: "analysis-interpretation", task: "Analyze and interpret findings.", commonFields: ["topic", "population", "researchQuestion", "primaryOutcome", "existingInformation"] },
  { id: "reporting", task: "Write and report the study.", commonFields: ["topic", "population", "researchQuestion", "primaryOutcome", "existingInformation"] },
  { id: "dissemination-impact", task: "Disseminate, implement, and evaluate impact.", commonFields: ["topic", "population", "researchQuestion", "primaryOutcome", "resourcesTimeline"] },
];

export const STAGE_IDS = LIFECYCLE_STAGES.map(stage => stage.id);
