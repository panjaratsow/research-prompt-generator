const steps = [
  {
    title: "Finding Research Idea and Research Gap",
    role: "research trend analyst and PhD-level research advisor",
    task: `Review and critically analyze the latest trends and recent developments in the topic, focusing on changes within the past 3-5 years that have reshaped existing theories or practices.

For each of three specific research gaps:
1. Describe the gap and why it matters.
2. Propose a research question that could clarify, challenge, or expand current understanding.
3. Justify the theoretical and practical impact.
4. Provide a brief methodological approach, including data sources, analytical methods, or interdisciplinary considerations.`,
    output: "A gap table, 3 research questions, impact justification, and brief methods for each question."
  },
  {
    title: "Literature Review",
    role: "literature review expert and PhD-level research advisor",
    task: `Write a critical literature review that synthesizes current evidence on the topic. Cover pathophysiology or conceptual mechanisms where relevant, biomarkers or key variables, clinical or practical significance, research gaps, and implications for future studies.

Use high-quality sources such as peer-reviewed articles, clinical guidelines, systematic reviews, and primary studies. Prioritize PubMed/MEDLINE, Embase, Scopus, Web of Science, Cochrane Library, and Google Scholar when web research is available.`,
    output: "A 500-800 word analytical literature review with in-text citations and a reference list."
  },
  {
    title: "Synthesize Information",
    role: "systematic literature review expert and evidence synthesis advisor",
    task: `Analyze the available literature-review evidence and synthesize it without inventing papers, findings, or citations.

Provide:
1. Overview of included studies, designs, populations, exposures, biomarkers/outcomes, and key findings.
2. Three to five major themes.
3. Supporting papers and key evidence for each theme.
4. Areas of agreement and contradiction.
5. Key methodological limitations.`,
    output: "Evidence synthesis matrix, theme summary, agreement/contradiction notes, and limitation summary."
  },
  {
    title: "Identify Research Gaps",
    role: "PhD-level research gap evaluator and methodology advisor",
    task: `Using only the available evidence, identify high-quality research gaps suitable for a proposal.

Classify each gap as knowledge, methodological, population, measurement, or clinical practice gap. Prioritize gaps using novelty, clinical or practical significance, feasibility, methodological rigor, and potential impact.`,
    output: "Gap classification table, prioritization table, 3-5 proposed research questions, and a final synthesis paragraph."
  },
  {
    title: "Generate Hypotheses",
    role: "clinical epidemiologist, field specialist, and research methodology advisor",
    task: `Generate 3-6 testable, directional hypotheses based only on the available literature.

For each hypothesis:
1. Write a clear directional statement.
2. Specify population, exposure, comparator, and outcome where applicable.
3. Explain the scientific or clinical mechanism in 2-3 sentences.
4. Link the mechanism to available evidence.
5. Define the primary endpoint and timing.
6. State whether it can realistically be tested with available data.
7. Recommend study design and statistical methods.
8. Rate priority as high, moderate, or low.`,
    output: "Hypothesis table with mechanism, endpoint, feasibility, design, analysis, and priority."
  },
  {
    title: "Research Methodology",
    role: "PhD-level clinical epidemiologist and research methodology advisor",
    task: `Propose the most appropriate methodology for the study.

Include:
1. Best-fit study design and justification.
2. Study population and setting.
3. Sampling frame, recruitment strategy, inclusion criteria, and exclusion criteria.
4. Exposure and outcome definitions.
5. Sample-size calculation approach and required assumptions.
6. Data collection plan.
7. Covariates and confounders.
8. Primary and secondary statistical analysis plan.
9. Missing data, outliers, non-normal distributions, diagnostics, and multiple comparisons.
10. Bias, validity, and mitigation strategies.
11. Ethical considerations.
12. Timeline, resources, and methodological limitations.`,
    output: "Proposal-ready methodology section with practical feasibility notes."
  },
  {
    title: "Write Research Proposal",
    role: "academic research writer and proposal development advisor",
    task: `Write a structured research proposal section for the topic using the provided research question, background, significance, literature synthesis, gaps, hypothesis, and methodology.

Integrate only verified user-provided evidence and clearly mark where additional literature verification is required. Emphasize the research gap and the contribution of the proposed study.`,
    output: "A structured proposal draft with background, significance, research gap, objectives, hypothesis, methods overview, expected contribution, and reference notes."
  }
];

const fields = [
  "role",
  "field",
  "topic",
  "setting",
  "targetOutput",
  "citation",
  "expertise",
  "evidence",
  "objective"
];

let activeStep = 0;
let language = "bilingual";

const stepList = document.querySelector("#stepList");
const stepKicker = document.querySelector("#stepKicker");
const stepTitle = document.querySelector("#stepTitle");
const promptOutput = document.querySelector("#promptOutput");
const statusText = document.querySelector("#statusText");

function valueOf(id) {
  const value = document.querySelector(`#${id}`).value.trim();
  return value || `[please provide ${id}]`;
}

function guardrails() {
  const selected = [];
  if (document.querySelector("#guardFact").checked) {
    selected.push("Separate every claim into [FACT: from user/source] and [INFERENCE: your analytical interpretation] where appropriate.");
  }
  if (document.querySelector("#guardNoFake").checked) {
    selected.push("Do not fabricate citations, author names, article titles, DOIs, page numbers, data, statistics, or study findings.");
  }
  if (document.querySelector("#guardVerify").checked) {
    selected.push('If uncertain, write "This requires verification in Google Scholar/doi.org" and end with: "Human must verify all outputs before academic use."');
  }
  return selected;
}

function languageInstruction() {
  if (language === "english") return "Write the output in scholarly academic English.";
  if (language === "thai") return "Write the output in formal scholarly Thai.";
  return "Use Thai for explanations and English for academic writing sections.";
}

function buildPrompt() {
  const step = steps[activeStep];
  const guards = guardrails();
  return `Act as: ${step.role}.

Researcher profile:
- Role: ${valueOf("role")}
- Field: ${valueOf("field")}
- Research topic: ${valueOf("topic")}
- Context / setting: ${valueOf("setting")}
- Target output: ${valueOf("targetOutput")}
- Citation style: ${valueOf("citation")}
- AI expertise level: ${valueOf("expertise")}
- Available evidence: ${valueOf("evidence")}
- Specific objective or question: ${valueOf("objective")}

Task:
${step.task}

Required output:
${step.output}

Writing requirements:
- ${languageInstruction()}
- Use a scholarly, critical, and practical tone suitable for peer-reviewed research or a PhD proposal.
- Prefer tables, numbered lists, and concise synthesis where appropriate.
${guards.map(item => `- ${item}`).join("\n")}

Before answering, ask me for any missing critical information that would materially change the quality or validity of the output.`;
}

function renderSteps() {
  stepList.innerHTML = "";
  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `step-button${index === activeStep ? " active" : ""}`;
    button.innerHTML = `<span class="step-number">${index + 1}</span><span class="step-name">${step.title}</span>`;
    button.addEventListener("click", () => {
      activeStep = index;
      render();
    });
    stepList.appendChild(button);
  });
}

function render() {
  const step = steps[activeStep];
  stepKicker.textContent = `Step ${activeStep + 1}`;
  stepTitle.textContent = step.title;
  renderSteps();
  promptOutput.value = buildPrompt();
}

function copyPrompt() {
  navigator.clipboard.writeText(promptOutput.value).then(() => {
    statusText.textContent = "Prompt copied.";
    window.setTimeout(() => statusText.textContent = "", 1800);
  }).catch(() => {
    promptOutput.select();
    document.execCommand("copy");
    statusText.textContent = "Prompt selected and copied.";
  });
}

function downloadPrompt() {
  const blob = new Blob([promptOutput.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `research-prompt-step-${activeStep + 1}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  statusText.textContent = "Prompt downloaded.";
  window.setTimeout(() => statusText.textContent = "", 1800);
}

fields.forEach(id => document.querySelector(`#${id}`).addEventListener("input", render));
document.querySelectorAll(".segmented").forEach(button => {
  button.addEventListener("click", () => {
    language = button.dataset.language;
    document.querySelectorAll(".segmented").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});
document.querySelectorAll(".ethics-box input").forEach(input => input.addEventListener("change", render));
document.querySelector("#copyBtn").addEventListener("click", copyPrompt);
document.querySelector("#downloadBtn").addEventListener("click", downloadPrompt);

render();
