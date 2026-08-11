# Content Review Matrix

## Scope and Method

This document defines bounded human review for prompts produced by the local, static application. It does not change bilingual app labels, retain uploaded materials, add backend services, or create storage. Uploaded files remain memory-only and local to the active session.

The seven scenarios below correspond to the implemented research stages. They are decision support only. They never imply approval, certification, legal compliance, ethics approval, registration, or standards compliance. A generated prompt must be reviewed by qualified humans before use.

## 2026-08-09 Adaptive Forms Review

Review basis: the approved adaptive-forms design, the rendered all-family/all-stage matrix, and generated prompt behavior for all seven stages and the Planning, Uploaded, and Web research evidence boundaries. `Pass` means the rendered decisions and generated instructions were inspected for scientific coherence, evidence discipline, governance language, and an explicit expert human-review path. It is not approval of any research protocol.

| Stage | Simple decisions | Dynamic family check | Derived text boundary | Advanced safeguards | Reviewer result |
| --- | --- | --- | --- | --- | --- |
| Define the Research Question | Topic; population and setting; question type; primary outcome. Four required decisions. | Question-type vocabularies were inspected for all 10 research families and their default designs; family-specific choices remain clinically and methodologically interpretable. | The editable question is a deterministic restatement of supplied concepts. It does not establish significance, feasibility, causality, or an evidence-supported effect. | Problem statement, comparator, endpoint timing, and additional objectives persist while collapsed and are serialized only when supplied. | **Pass** - rendered design and generated prompt inspected; framework selection, missing-information language, standards, governance, citation limits, and methodologist/subject-expert/analytical review remain explicit. |
| Conduct a Literature Review | Information sources; date coverage; evidence types; search concepts. Four required decisions. | Source choices vary by research family; Uploaded mode adds the local source set without replacing family-relevant databases. | The editable search strategy is a proposed reproducible plan, not a claim that a search was run or that records were found, screened, or eligible. | Boolean query, eligibility criteria, grey literature, language, and justified design limits persist and serialize without creating search results or identifiers. | **Pass** - rendered design and generated output inspected; Web research requires named databases, exact search dates, direct links, and stable identifiers, while Planning prohibits literature claims and citations. |
| Synthesize Information | Evidence pattern; synthesis method; evidence certainty; main limitations. Four required decisions. | Synthesis methods vary by family, including diagnostic, prediction, qualitative, preclinical, AI, implementation, and economic approaches. | Pattern and certainty choices remain user-supplied provisional assessments. The browser does not synthesize sources; the downstream request must verify them within the selected evidence boundary. | Effect measures, heterogeneity, risk-of-bias tool, and subgroup/sensitivity plans remain hidden until requested but continue to serialize when populated. | **Pass** - rendered design and generated output inspected; Uploaded mode includes only selected ready SOURCE blocks, treats them as untrusted data, and preserves evidence-budget blocking. |
| Identify Research Gaps | Gap type; evidence support; population or context; priority. Four required decisions. | Shared gap categories were inspected within each family context so population, intervention/exposure, method, setting, implementation, and equity gaps do not imply the same evidence standard. | The gap statement distinguishes documented support, provisional interpretation, and unverified inquiry; it cannot manufacture novelty or infer a gap from absence in the workspace. | Novelty check, stakeholder relevance, certainty rationale, and generalizability remain explicit specialist considerations and serialize only as supplied context or requested review. | **Pass** - rendered design and generated prompt inspected; unsupported gap claims are prohibited and information-specialist, subject-expert, methodologist, and analytical review remain applicable. |
| Generate Hypotheses | Hypothesis approach; intervention or exposure; outcome; expected direction. Four required decisions. | Family/design context preserves directional, non-directional, proposition, and justified exploratory paths; qualitative or descriptive work is not forced into a causal hypothesis. | The editable product is a hypothesis, proposition, aim, or question assembled from user choices, not a verified mechanism, effect, or causal conclusion. | Mechanism, alternatives, causal assumptions, and effect modification remain available for expert refinement without being inferred from an unselected option. | **Pass** - rendered design and generated prompt inspected; uncertainty, alternatives, design appropriateness, and human methodological review remain explicit. |
| Outline Research Methodology | Confirmed design; data source or recruitment; sampling approach; analysis family; feasibility period. Five required decisions. | Default design, recruitment/data-source, and analysis options were inspected for all 10 families. Review initially **failed** because recruitment/data source rendered as free text despite its dynamic catalogue; it was corrected to the owning family-specific select and the full matrix passed. | The methodology outline is a deterministic planning template. It does not calculate sample size, select a valid estimand, prove feasibility, or claim ethics/governance approval. | Sample size, confounders, missing data, sensitivity analysis, and ethics/governance persist and serialize as questions or supplied plans; applicable EQUATOR, Helsinki, ICH-GCP, animal-welfare, AI, IRB, and Thai PDPA review remains conditional. | **Pass after correction** - rendered design and generated prompt reinspected; no unresolved failure remains, and qualified methodologist, biostatistical/analytical, institutional, privacy, and domain review are required as applicable. |
| Write a Research Proposal | Proposal type; target audience; required sections; timeline. Four required decisions. | Proposal choices preserve the selected family, design, inherited products, applicable standards, and target audience rather than applying one generic biomedical template. | The proposal outline integrates user-supplied stage products but does not certify evidence, approvals, registration, authorship, data sharing, feasibility, or compliance. | Budget, registration, data sharing, dissemination, authorship, and detailed governance remain collapsed, persistent, and serialized when populated; absent approvals remain missing information. | **Pass** - rendered design and generated prompt inspected; standards are decision support, governance is non-certifying, citations remain traceable, limitations are explicit, and the expert human-review checklist is retained. |

Scientific release judgement: the adaptive form is suitable as a prompt-construction aid in a world-class medical university only when outputs remain subject to qualified methodological, subject-matter, statistical or analytical, information-specialist, ethics/IRB, privacy/data-governance, animal-welfare, and AI/ML review as applicable. The application does not replace any of those reviewers.

## 1. Focused Medical Research Question

**Expected:** A stage-specific question structure appropriate to the selected research type, explicit population or context, intervention/exposure or phenomenon where relevant, comparator where relevant, outcome or purpose, evidence boundary, uncertainties, applicable standards, and required human reviewers.

**Forbidden:** Invented evidence or identifiers; unsupported gap claims; a forced hypothesis when the selected design does not call for one; implied ethics, legal, registration, or standards compliance.

**Review:** Subject expert and methodologist. Include a statistician for quantitative questions, an information specialist when searchability or terminology needs review, IRB/privacy review for sensitive human data, animal-welfare review for animal work, and AI review for AI-enabled research.

## 2. Reproducible Literature Review

**Expected:** A reproducible review structure with the research question, sources and search boundary, eligibility logic, planned screening and extraction approach, uncertainty handling, applicable review standards, and required human reviewers. The prompt distinguishes supplied evidence from information still needed.

**Forbidden:** Invented citations, source identifiers, search results, or eligibility decisions; unsupported gap claims; forced hypotheses for inappropriate designs; implied ethics, legal, registration, or standards compliance.

**Review:** Subject expert and methodologist. Include an information specialist for search strategy and reproducibility, a statistician for quantitative synthesis, IRB/privacy review when source handling includes sensitive data, animal-welfare review when applicable, and AI review for AI-enabled review workflows.

## 3. Source-Grounded Synthesis

**Expected:** A synthesis limited to the selected or supplied sources, with traceable claims, explicit evidence boundary, uncertainty and disagreement handling, applicable reporting standards, and required human reviewers. Missing information remains marked as unavailable rather than inferred.

**Forbidden:** Invented evidence or identifiers; claims beyond the available sources; unsupported gap claims; forced hypotheses for inappropriate designs; implied ethics, legal, registration, or standards compliance.

**Review:** Subject expert and methodologist. Include a statistician for pooled estimates or quantitative interpretation, an information specialist for source traceability, IRB/privacy review for sensitive sources, animal-welfare review for animal evidence, and AI review for AI-generated or AI-health-data synthesis.

## 4. Documented Gaps

**Expected:** A gap record tied to the reviewed evidence, including what is known, what remains uncertain, why the limitation matters, the evidence boundary, applicable standards, and required human reviewers. The prompt distinguishes an evidence-supported gap from a proposed area for inquiry.

**Forbidden:** Invented evidence or identifiers; unsupported gap claims; forced hypotheses for inappropriate designs; implied ethics, legal, registration, or standards compliance.

**Review:** Subject expert and methodologist. Include an information specialist when adequacy of the search or source coverage is in question, a statistician for gaps involving effect precision or heterogeneity, IRB/privacy review for human-data implications, animal-welfare review when applicable, and AI review for AI-related gaps.

## 5. Design-Appropriate Hypotheses or Propositions

**Expected:** Hypotheses or propositions that fit the selected design, research question, evidence boundary, uncertainty, applicable standards, and required human reviewers. Exploratory, qualitative, descriptive, or implementation designs may use aims, propositions, or questions instead of a causal or testable hypothesis.

**Forbidden:** Invented evidence or identifiers; unsupported gap claims; hypotheses forced onto inappropriate designs; implied ethics, legal, registration, or standards compliance.

**Review:** Subject expert and methodologist. Include a statistician for estimands, hypotheses, and analysis implications, an information specialist when propositions depend on a review boundary, IRB/privacy review for sensitive human research, animal-welfare review for animal studies, and AI review for AI-enabled interventions or datasets.

## 6. Methodology With Applicable Standards and Governance

**Expected:** A design-appropriate methodology with study population or setting, procedures, outcomes or analytic focus, evidence boundary, uncertainties, applicable standards, governance considerations, and required human reviewers. Standards guide planning and reporting choices; governance items are presented as questions to assess, not as completed obligations.

**Forbidden:** Invented evidence or identifiers; unsupported gap claims; forced hypotheses for inappropriate designs; implied ethics, legal, registration, animal-care, privacy, or standards compliance.

**Review:** Subject expert and methodologist. Include a statistician for design, sample size, estimands, and analysis; an information specialist for evidence-review methods; IRB/privacy review for human participants, personal data, or local data rules; animal-welfare review for animal work; and AI review for AI models, datasets, deployment, bias, or fairness.

## 7. Integrated Proposal

**Expected:** An integrated, stage-linked proposal that connects the question, evidence review, synthesis, gaps, hypotheses or propositions where appropriate, and methodology. It states the evidence boundary, uncertainties, applicable standards, governance questions, and required human reviewers.

**Forbidden:** Invented evidence or identifiers; unsupported gap claims; forced hypotheses for inappropriate designs; implied ethics, legal, registration, animal-care, privacy, or standards compliance.

**Review:** Subject expert and methodologist. Include a statistician for quantitative design and analysis, an information specialist for literature-review integrity, IRB/privacy review for human participants or data, animal-welfare review for animal research, and AI review for AI-enabled methods, data, or clinical decision support.

## Release-Use Boundary

Reviewing a generated prompt against this matrix is not approval or certification of a study, protocol, review, analysis, clinical action, legal position, ethics submission, registration, or standard. It supports informed human decision-making only.
