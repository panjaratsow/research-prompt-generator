# Seven-Step Research Cycle Design

Date: 2026-08-03
Status: Approved for specification

## Objective

Replace the current ten-stage lifecycle with the following seven-stage research cycle throughout the application. This is a semantic replacement, not a label-only change.

1. Step 1: Define the Research Question
2. Step 2: Conduct a Literature Review
3. Step 3: Synthesize Information
4. Step 4: Identify Research Gaps
5. Step 5: Generate Hypotheses
6. Step 6: Outline Research Methodology
7. Step 7: Write a Research Proposal

The Thai interface will use academically appropriate translations while the English interface will preserve the approved English labels exactly.

## Scope

The change covers:

- lifecycle catalogue and state validation;
- Thai and English labels and task descriptions;
- adaptive fields and required-field validation;
- stage readiness and transition confirmation;
- prompt lifecycle objective, task, standards, governance, and review checklist;
- applicability of medical research standards;
- unit, browser, accessibility, and responsive tests;
- documentation that names or assumes the former ten stages.

Research families, study-design subtypes, evidence modes, local file processing, de-identification safeguards, prompt export, and the privacy-first architecture remain unchanged.

## Lifecycle Model

The lifecycle will use these stable internal identifiers:

| Order | ID | English label | Thai label |
| ---: | --- | --- | --- |
| 1 | `define-question` | Step 1: Define the Research Question | ขั้นที่ 1: กำหนดคำถามวิจัย |
| 2 | `literature-review` | Step 2: Conduct a Literature Review | ขั้นที่ 2: ทบทวนวรรณกรรม |
| 3 | `synthesize-information` | Step 3: Synthesize Information | ขั้นที่ 3: สังเคราะห์ข้อมูล |
| 4 | `identify-gaps` | Step 4: Identify Research Gaps | ขั้นที่ 4: ระบุช่องว่างการวิจัย |
| 5 | `generate-hypotheses` | Step 5: Generate Hypotheses | ขั้นที่ 5: สร้างสมมติฐาน |
| 6 | `outline-methodology` | Step 6: Outline Research Methodology | ขั้นที่ 6: วางโครงร่างระเบียบวิธีวิจัย |
| 7 | `write-proposal` | Step 7: Write a Research Proposal | ขั้นที่ 7: เขียนข้อเสนอโครงการวิจัย |

The initial state will select `define-question`. The former stage identifiers will no longer be accepted because the application does not persist workspace state between sessions.

## Stage Responsibilities

### Step 1: Define the Research Question

Capture the research problem, significance, population, focused research question, and primary outcome or phenomenon. The generated prompt must refine the question using the framework appropriate to the selected research family without inventing evidence.

Required fields: research topic, study population, and research question.

### Step 2: Conduct a Literature Review

Develop a reproducible literature-review plan. In web-research mode, require named databases, exact search date, search concepts or terms, eligibility boundaries, direct links, and stable identifiers where available. In uploaded-evidence mode, use only the uploaded sources.

Required fields: research topic, research question, information sources, and search strategy.

### Step 3: Synthesize Information

Organize and critically synthesize the available information. Separate source-supported findings from interpretation, assess limitations and certainty where appropriate, and prohibit fabricated studies, statistics, citations, or identifiers.

Required fields: research topic, research question, evidence summary, and synthesis method.

### Step 4: Identify Research Gaps

Derive explicit gaps from the reviewed and synthesized information. Classify gaps where useful, such as population, intervention, comparator, outcome, method, setting, implementation, equity, or certainty gaps. Distinguish a documented gap from an unsupported assumption.

Required fields: research topic, research question, and research gaps.

### Step 5: Generate Hypotheses

Generate testable hypotheses that follow from the research question and identified gaps. For exploratory, qualitative, or other designs where a formal hypothesis is inappropriate, produce research propositions, expectations, or a justified statement that no formal hypothesis is required.

Required fields: research topic, research question, and hypotheses or propositions.

### Step 6: Outline Research Methodology

Outline a design-appropriate methodology including population or sample, variables or phenomena, outcomes, data sources, bias controls, analysis approach, ethics and governance, feasibility, and validation where applicable. Apply research-family fields and relevant standards without claiming compliance.

Required fields: research topic, study population, research question, primary outcome, and methodology outline.

### Step 7: Write a Research Proposal

Integrate the outputs of Steps 1-6 into a structured research proposal. Include rationale, objectives, evidence and gaps, hypotheses or justified alternatives, methodology, analysis, ethics and governance, resources, timeline, dissemination, limitations, and unresolved decisions as applicable.

Required fields: research topic, problem statement, study population, research question, primary outcome, methodology outline, and resources and timeline.

## New Adaptive Fields

The shared field catalogue will add:

- `searchStrategy`: databases, concepts, terms, limits, dates, and reproducibility details;
- `evidenceSummary`: concise source-grounded synthesis of available information;
- `evidenceCertainty`: certainty, quality, limitations, and inconsistency where applicable;
- `researchGaps`: documented gaps and the evidence supporting each gap;
- `hypotheses`: hypotheses, propositions, expectations, or a justified non-hypothesis approach;
- `methodologyOutline`: integrated design and methods outline.

These fields will have Thai and English labels. Existing research-family fields remain available so each stage can adapt to randomized trials, observational research, diagnostic studies, prediction modelling, evidence reviews, qualitative and mixed methods, medical education, laboratory and animal research, AI and health data, and implementation, quality-improvement, and economic research.

The exact shared-field mapping is:

| Stage ID | Shared adaptive fields |
| --- | --- |
| `define-question` | `topic`, `problemStatement`, `population`, `researchQuestion`, `primaryOutcome` |
| `literature-review` | `topic`, `population`, `researchQuestion`, `informationSources`, `searchStrategy`, `eligibilityCriteria` |
| `synthesize-information` | `topic`, `researchQuestion`, `existingInformation`, `evidenceSummary`, `evidenceCertainty`, `synthesisMethod` |
| `identify-gaps` | `topic`, `researchQuestion`, `evidenceSummary`, `evidenceCertainty`, `researchGaps` |
| `generate-hypotheses` | `topic`, `researchQuestion`, `researchGaps`, `hypotheses`, `primaryOutcome` |
| `outline-methodology` | `topic`, `problemStatement`, `population`, `researchQuestion`, `hypotheses`, `primaryOutcome`, `methodologyOutline`, `resourcesTimeline`, `existingInformation` |
| `write-proposal` | `topic`, `problemStatement`, `population`, `researchQuestion`, `evidenceSummary`, `researchGaps`, `hypotheses`, `primaryOutcome`, `methodologyOutline`, `resourcesTimeline`, `existingInformation` |

The existing fields defined by the selected research family are appended to this shared set. Duplicate fields are removed while preserving order.

## Target Outputs

Target-output choices will be aligned with the new cycle and limited to:

- stage-appropriate deliverable;
- research question and objectives;
- literature-review strategy;
- evidence synthesis;
- research-gap analysis;
- hypotheses or research propositions;
- research methodology outline;
- research proposal.

Former target outputs for a standalone ethics plan, analysis plan, journal manuscript, or dissemination plan will be removed. Ethics, analysis, and dissemination remain required proposal components when applicable rather than separate lifecycle outputs.

## Standards and Governance

Stage applicability will be remapped to the seven-stage planning cycle:

- PRISMA 2020 and PRISMA-ScR apply to `literature-review` and `synthesize-information` for matching evidence-review subtypes; PRISMA-P applies to `outline-methodology` and `write-proposal`;
- GRADE applies to `synthesize-information` and `identify-gaps` for matching systematic-review and meta-analysis subtypes;
- all matching protocol, conduct, and reporting guidance, including SPIRIT, CONSORT, STROBE, RECORD, STARD, TRIPOD, COREQ, SRQR, ARRIVE, CLAIM, StaRI, SQUIRE, TIDieR, CHEERS, and their AI or education extensions, applies to `outline-methodology` and `write-proposal` as a design and proposal checklist;
- ICH-GCP, ethics, local IRB or institutional policy, Thai PDPA, animal welfare, and AI governance instructions remain conditional on design, data, participants, jurisdiction, and institutional context;
- the application must continue to describe standards as decision support and must never claim approval, certification, registration, or compliance.

Registration, ethics approval, data sharing, and external validation controls remain contextual. Registration is shown in methodology and proposal, plus literature review for evidence-review research. Ethics approval, data sharing, and external validation are shown in methodology and proposal when the selected family or design makes them applicable. Feasibility and ethics warnings are surfaced in methodology and proposal. The proposal prompt requests a dissemination and reporting plan without restoring the removed reporting and dissemination lifecycle stages.

## Data Flow and Transitions

`LIFECYCLE_STAGES` remains the single ordered source of truth. State, rendering, readiness, validation, prompt generation, standards resolution, and tests will consume the same seven identifiers.

Changing stages will preserve fields shared by both stages. If a populated field is incompatible with the destination stage, the existing confirmation modal will list the affected fields before clearing them. Research type, study design, researcher setup, evidence mode, uploaded-source state, citation style, and language choices remain persistent across stage transitions.

## User Interface

The lifecycle rail will render exactly seven stable buttons with visible step number, translated label, readiness text, icon, and accessible name. The selected button retains `aria-current="step"`.

The existing compact operational layout remains. No landing page, nested cards, or additional navigation layer will be introduced. Desktop and mobile layouts must show all seven stages without page-level horizontal overflow; the lifecycle rail may retain its intentional contained horizontal scrolling on narrow screens.

## Prompt Contract

Generated prompts will serialize the selected stage label and stage objective. Each prompt will:

- enforce the active evidence boundary;
- use the chosen research family and design;
- request only the deliverable appropriate to the selected step;
- distinguish supplied information, evidence-supported statements, synthesis, assumptions, and gaps;
- retain citation, governance, methodological-quality, limitations, and expert-review sections;
- state that hypotheses may be replaced by propositions or a justified non-hypothesis approach when required by the design;
- avoid references to removed lifecycle stages.

## Error Handling and Privacy

Unknown or former stage IDs will fail validation and cannot enter state through public controls. Uploaded files remain memory-only and locally parsed. No network request, storage, cookie, analytics, backend, or automatic literature retrieval will be added.

Malformed or unsupported files, encrypted files, image-only files, evidence-budget overflow, possible identifiers, and de-identification blockers retain their existing bounded and localized behavior.

## Testing and Acceptance Criteria

Implementation will follow test-driven development.

Unit tests must prove:

- exactly seven ordered lifecycle stages exist with the approved IDs;
- both locales contain the approved labels and task descriptions;
- initial state selects Step 1 and rejects former stage IDs;
- adaptive and required fields match each step;
- readiness contains exactly seven entries;
- standards resolve only for applicable family, subtype, and new stage;
- prompts contain the selected stage objective and no former stage identifiers or labels;
- governance and evidence-boundary behavior remains intact.

Browser tests must prove:

- exactly seven lifecycle buttons render in order in Thai and English;
- each button can be selected and updates the adaptive form;
- stage transitions preserve compatible data and confirm before clearing incompatible data;
- uploaded-evidence mode remains usable within the new cycle;
- prompt generation, copy, download, accessibility, and responsive overflow checks still pass.

Release acceptance requires the complete unit suite, all configured Playwright projects, Axe checks, `git diff --check`, a clean worktree, and visual verification of the deployed GitHub Pages URL.

## Out of Scope

- Adding study conduct, data analysis, manuscript writing, or dissemination as extra lifecycle stages;
- server-side file upload or AI execution;
- automatic database searching or citation retrieval;
- claiming scientific, statistical, ethics, legal, privacy, Thai PDPA, IRB, animal-welfare, reporting-standard, or AI-governance certification.
