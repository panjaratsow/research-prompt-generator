# World-Class Medical Research Prompt Generator Design

**Date:** 2026-08-01  
**Status:** Approved design  
**Deployment:** Static GitHub Pages site  
**Primary context:** Thai medical university aligned with international research standards

## 1. Purpose

Upgrade the existing generic seven-step prompt generator into an adaptive, evidence-first research workspace suitable for a world-class medical university. The application will help researchers construct rigorous prompts across the full research lifecycle while preserving privacy, source traceability, study-design appropriateness, and human accountability.

The application generates prompts. It does not perform research autonomously, analyze identifiable patient data, replace subject-matter or statistical review, provide clinical advice, or replace institutional ethics review.

## 2. Product Principles

1. **Study-design aware:** Questions, methods, standards, and outputs change according to the selected research design.
2. **Evidence first:** Source-backed work is clearly distinguished from planning without evidence.
3. **Traceable:** Extracted evidence receives stable source identifiers that are carried into the generated prompt.
4. **Privacy first:** Files are processed locally in the browser, are not persisted, and are never sent by the application.
5. **Human accountable:** Generated content must be reviewed by qualified researchers and, where relevant, statisticians, information specialists, data stewards, and ethics committees.
6. **Thai and international:** Default governance reflects Thai PDPA and local IRB requirements alongside international standards.
7. **Transparent:** The interface states which guideline, framework, assumptions, and evidence boundaries were used.

## 3. Users

The workspace supports postgraduate students, research fellows, faculty researchers, clinical investigators, health professionals, laboratory scientists, medical educators, statisticians, systematic reviewers, implementation scientists, and health-data/AI researchers.

The user's role changes the level of explanation and expected output, but never relaxes evidence, privacy, ethics, or citation safeguards.

## 4. Supported Research Types

The first release supports these research families:

1. Randomized clinical trial
2. Observational study, including cohort, case-control, and cross-sectional designs
3. Diagnostic accuracy study
4. Prognostic study or prediction model
5. Systematic review, meta-analysis, or scoping review
6. Qualitative or mixed-methods study
7. Medical education research
8. Laboratory, translational, or animal research
9. AI, machine-learning, or routinely collected health-data research
10. Implementation research, quality improvement, or economic evaluation

Medical education research uses the underlying methodological design as its primary classification. Domain-specific guidance is added as a supplement.

## 5. Adaptive Research Lifecycle

The fixed seven-step workflow is replaced by these selectable lifecycle stages:

1. Frame the problem, significance, and research question
2. Discover, appraise, and synthesize evidence
3. Develop the protocol and study design
4. Plan ethics, governance, registration, and data stewardship
5. Develop the statistical or analytical plan
6. Draft a proposal or grant application
7. Plan study conduct, monitoring, and quality assurance
8. Analyze and interpret findings
9. Write and report the study
10. Disseminate, implement, and evaluate impact

The application does not imply that every study follows the stages in a simple linear sequence. Users may move directly to any stage, and the prompt records the selected stage and available upstream information.

## 6. Evidence Modes

The user must choose one evidence mode:

### 6.1 Uploaded evidence

The application extracts text locally and includes user-selected sources in the prompt. Claims must be traceable to those sources.

### 6.2 Verifiable web research

The generated prompt instructs a web-enabled AI system to search appropriate databases and official sources, provide direct source links or stable identifiers, document the search date, and distinguish retrieved evidence from synthesis. The application itself does not browse or retrieve research literature.

### 6.3 Planning without evidence

The generated prompt is limited to frameworks, questions, assumptions, search strategies, feasibility considerations, and information requirements. It must not present literature claims or citations as established evidence.

## 7. Evidence Workspace

### 7.1 Supported formats

- Searchable PDF
- DOCX
- TXT and Markdown
- CSV for deidentified, non-row-level evidence tables
- RIS and BibTeX

Encrypted documents, legacy DOC files, image-only scans, and unsupported formats produce a clear error and remain excluded from the prompt.

The workspace accepts up to 10 files, with a maximum of 20 MB per file and 60 MB in total. Files that exceed these limits are rejected before parsing with an explanation that no content was processed.

### 7.2 Local processing

- Files are held in memory only.
- No file contents, extracted text, filenames, or form data are saved to local storage, cookies, analytics, a backend, or a third-party endpoint.
- Refreshing or closing the page clears the evidence workspace.
- PDF and DOCX parsing libraries are pinned and served from the same site, with their licenses included. No runtime CDN is used.

### 7.3 Source inventory

Each successfully parsed file receives a source ID (`S1`, `S2`, and so on) and displays:

- filename and file type;
- file size;
- extraction status;
- extracted character count;
- inclusion state;
- parsing warnings.

Removing a source regenerates sequential source IDs to avoid references to missing evidence.

### 7.4 Prompt budget

The interface shows the extracted character count and a clearly labeled token estimate. The default evidence budget is 60,000 characters, with user-selectable 25,000, 60,000, and 120,000 character budgets.

The application never silently truncates a source. If selected evidence exceeds the budget, prompt generation is blocked until the user deselects sources or increases the budget. The source inventory explains which sources are responsible for the excess.

### 7.5 Privacy and untrusted content

Before first upload, the interface warns users not to upload names, hospital numbers, dates of birth, contact details, images, free text, or any other information that can identify a patient or participant. The user must actively confirm that the selected files are deidentified before parsing begins. A lightweight pattern check may add warnings for likely identifiers, but the interface explicitly states that this check cannot establish deidentification and does not replace the user's responsibility.

Uploaded content is treated as untrusted evidence, not as executable instructions. The generated prompt encloses each source in explicit delimiters and instructs the target AI to ignore instructions found inside source documents. Delimiter-like text in extracted content is escaped before prompt construction.

## 8. Standards Mapping

The standards catalogue records the version review date (`2026-08-01`) and links to the official source. It selects only standards relevant to the chosen design and lifecycle stage.

| Research type | Core framework or reporting standard |
| --- | --- |
| Randomized trial | PICO, SPIRIT 2025, CONSORT 2025, ICH-GCP E6(R3) |
| Observational or routine data | PECO, STROBE, RECORD when applicable |
| Diagnostic accuracy | PIRD, STARD |
| Prognostic/prediction | PICOTS or CHARMS, TRIPOD or TRIPOD+AI |
| Systematic/scoping review | PRISMA-P, PRISMA 2020, PRISMA-ScR, GRADE when applicable |
| Qualitative/mixed methods | SPIDER, COREQ, SRQR |
| Medical education | Underlying study-design standard plus GREET or SQUIRE-EDU when applicable |
| Laboratory/animal | ARRIVE 2.0 and relevant rigor/reproducibility principles |
| AI/health data | TRIPOD+AI, SPIRIT-AI, CONSORT-AI, DECIDE-AI, CLAIM, or RECORD as appropriate |
| Implementation/QI/economic | StaRI, SQUIRE, TIDieR, or CHEERS as appropriate |

Ethics and publication safeguards draw from the 2024 Declaration of Helsinki, applicable Thai law and local IRB policy, ICH-GCP E6(R3), ICMJE Recommendations updated in January 2026, WHO AI-for-health governance guidance, and EQUATOR reporting guidance.

The application presents standards as decision support, not as a certification of compliance. Researchers must check funder, regulator, registry, institution, and target-journal requirements.

## 9. Adaptive Input Model

### 9.1 Persistent setup fields

- Researcher role and experience level
- Medical or scientific field
- Research topic
- Research type
- Lifecycle stage
- Evidence mode
- Country and institutional setting, defaulting to Thailand and a medical university or teaching hospital
- Target output
- Output language
- Citation style

### 9.2 Common study fields

- Problem statement and significance
- Population and setting
- Research question or objective
- Primary outcome or phenomenon of interest
- Available resources, timeline, and feasibility constraints
- Existing protocol, registration, ethics, or analysis information

### 9.3 Adaptive fields

The catalogue supplies fields only when relevant. Examples include intervention/comparator for randomized trials, index/reference tests for diagnostic studies, eligibility and synthesis method for reviews, sampling and reflexivity for qualitative work, dataset provenance and validation for AI studies, and implementation context for implementation research.

Changing the research type preserves compatible common fields and clears incompatible hidden fields after a visible confirmation. This prevents stale data from silently entering a prompt.

## 10. Prompt Contract

Every generated prompt uses the same ordered contract:

1. **Role and expertise required**
2. **Research context and selected design**
3. **Lifecycle objective**
4. **Evidence mode and permitted evidence boundary**
5. **Delimited source material and source inventory, when present**
6. **Task instructions tailored to the design and stage**
7. **Required output structure**
8. **Applicable frameworks and standards**
9. **Methodological quality checks**
10. **Ethics, privacy, and governance checks**
11. **Citation and traceability rules**
12. **Assumptions, missing information, limitations, and human-review checklist**

The target AI must:

- cite uploaded evidence by source ID;
- provide DOI, PMID, registry number, or bibliographic details only when present in a source or verified through an authorized search;
- never invent studies, data, statistics, identifiers, ethics approval, registration, or institutional policy;
- distinguish source-backed statements, analytical interpretations, assumptions, and missing evidence in dedicated sections;
- state when evidence is insufficient;
- report effect estimates and uncertainty rather than relying on statistical significance alone, when applicable;
- ask only for missing information that would materially affect validity, and otherwise proceed with the requested output;
- end with a concise human-review checklist tailored to the task.

The previous requirement to label every sentence as `FACT` or `INFERENCE` is removed. Traceability is maintained through source IDs, an evidence-to-claim table where appropriate, and separate interpretation and assumption sections.

## 11. Methodological Quality Checks

Checks are activated only when applicable and may include:

- estimand and endpoint definition;
- effect size and confidence interval;
- confounder identification and causal assumptions;
- sampling frame and selection bias;
- measurement validity and reliability;
- missing-data assumptions and sensitivity analyses;
- multiplicity and prespecified subgroup analyses;
- internal and external validation;
- calibration and discrimination;
- reflexivity and information power for qualitative work;
- heterogeneity, publication bias, and certainty of evidence for reviews;
- sex, gender, age, disability, ethnicity, socioeconomic context, and health-equity considerations;
- clinical relevance, feasibility, implementation context, sustainability, and environmental impact.

## 12. User Interface

The approved layout is the **Hybrid Workspace**.

### 12.1 Desktop

- A compact header contains the product name, language control, privacy status, and reset action.
- A persistent setup bar contains research type, lifecycle stage, and evidence mode.
- A left lifecycle rail shows stage names and readiness states.
- The main workspace contains the adaptive form, evidence workspace, standards summary, and preflight results.
- Prompt preview opens in a right-side drawer so the form retains adequate working width.

### 12.2 Mobile

- The setup bar becomes a compact summary control.
- The lifecycle rail becomes a menu or stage selector.
- Form sections remain single-column.
- The prompt preview opens as a full-screen sheet.

### 12.3 Interaction and visual style

- Quiet, professional, work-focused visual design suitable for a medical university.
- No marketing hero, decorative panels, nested cards, or excessive color decoration.
- Icons are used for familiar commands such as upload, remove, copy, download, reset, and close, with tooltips and accessible labels.
- Controls have stable dimensions and visible keyboard focus.
- Thai and English text wrap without overlap at supported widths.
- Readiness, warning, and error states use text and icons in addition to color.

## 13. Preflight Validation

Prompt generation is blocked when:

- the research type or lifecycle stage is missing;
- a stage-specific critical field is missing;
- uploaded-evidence mode has no successfully parsed, selected source;
- selected evidence exceeds the chosen prompt budget;
- a selected file has no extractable text;
- the user has not confirmed that uploaded files are deidentified;
- the user reports or the workflow otherwise indicates that identifiable participant data are present.

Warnings that do not block generation include incomplete feasibility information, missing protocol or registration details for planning-stage work, and standards that require confirmation from the user's institution or target journal.

Validation messages explain the problem and identify the exact field or source requiring action. The interface focuses the first blocking item when the user requests generation.

## 14. Error Handling

- Parsing failures are isolated per file; one bad file does not remove successful sources.
- Unsupported, encrypted, or image-only files remain visible with an exclusion reason and a remove action.
- Clipboard failure falls back to selecting the prompt and explaining the manual copy action.
- Download failure leaves the generated prompt visible and does not clear user input.
- Unexpected errors produce a concise local message without exposing document content or stack traces.
- The browser console may contain technical diagnostics, but never extracted evidence text.

## 15. Accessibility and Internationalization

- Semantic headings, labels, fieldsets, buttons, status regions, and dialogs are required.
- All functionality is operable by keyboard.
- Focus is trapped and restored correctly for the prompt drawer and confirmation dialogs.
- Text and controls meet WCAG AA contrast targets.
- Status changes are announced through appropriate live regions.
- The user can choose Thai, English, or bilingual output. Interface labels are available in Thai and English.
- Language selection changes instructions and output expectations, not methodological requirements.

## 16. Technical Architecture

The application remains a static HTML/CSS/JavaScript site hosted by GitHub Pages.

Responsibilities are separated into focused modules:

- `research-catalog`: study types, lifecycle stages, adaptive fields, standards, and validation rules;
- `evidence-parser`: local file validation, extraction, source inventory, budgeting, and delimiter escaping;
- `prompt-engine`: deterministic prompt construction from validated state;
- `ui-state`: current selections, form state, readiness, and drawer behavior;
- `app`: event wiring and rendering.

PDF.js handles searchable PDFs, Mammoth handles DOCX, and native text decoding handles TXT, Markdown, CSV, RIS, and BibTeX. Parser builds are pinned and vendored locally with license notices.

The generated prompt is a deterministic function of validated application state. File parsing is asynchronous and cancellable at the UI level. Prompt generation never waits on a network request.

## 17. Testing and Acceptance Criteria

### 17.1 Unit tests

- Every research type maps to at least one valid question framework and stage-appropriate standard.
- Irrelevant standards are not added.
- Adaptive required fields change correctly by research type and stage.
- Each evidence mode produces the correct evidence boundary.
- Citation, fabrication, privacy, and human-review rules are always present.
- Language and citation-style selections produce deterministic instructions.
- Source delimiters are escaped safely.
- Prompt-budget calculations and blocking behavior are correct.

### 17.2 Parser tests

- Valid fixtures for PDF, DOCX, TXT, Markdown, CSV, RIS, and BibTeX extract expected text.
- Empty, malformed, encrypted, unsupported, and image-only fixtures produce the correct status.
- Multiple-file parsing preserves successful sources when another file fails.
- Extracted text is never written to persistent browser storage or logs.

### 17.3 Browser and accessibility tests

- Core workflow: choose design and stage, upload evidence, resolve preflight issues, generate, copy, and download.
- Research-type changes preserve only compatible fields.
- Keyboard-only operation covers upload control, navigation, form, drawer, copy, download, reset, and dialogs.
- Desktop and mobile layouts have no overlap, clipped controls, or unreadable text.
- Prompt drawer focus behavior and live status announcements are correct.
- The page works on current Chromium, Firefox, and Safari-family browsers supported by GitHub Pages users.

### 17.4 Content review

Representative prompts are reviewed for at least one scenario in every research family by checking:

- methodological fit;
- evidence boundaries;
- ethics and privacy prompts;
- reporting-guideline selection;
- citation traceability;
- missing-information handling;
- clarity in Thai and English.

## 18. Deployment and Maintenance

- GitHub Pages continues to deploy from the repository's `main` branch and root directory.
- The public URL remains `https://panjaratsow.github.io/research-prompt-generator/`.
- Parser dependencies are committed to the repository so the site remains self-contained at runtime.
- Standards display their review date. A maintainer reviews the catalogue at least annually and when a major guideline update is published.
- The README documents privacy behavior, supported files, browser requirements, limitations, local serving, testing, and publication.

## 19. Primary Standards Sources

- World Medical Association, Declaration of Helsinki 2024: <https://www.wma.net/policy-types/declaration/>
- ICMJE Recommendations, January 2026 update: <https://www.icmje.org/news-and-editorials/updated_recommendations_jan2026.html>
- EQUATOR Network reporting guidelines: <https://www.equator-network.org/reporting-guidelines/>
- CONSORT and SPIRIT 2025: <https://www.consort-spirit.org/>
- ICH E6(R3) Good Clinical Practice: <https://www.ich.org/page/efficacy-guidelines>
- WHO ethics and governance of AI for health: <https://www.who.int/publications/i/item/9789240029200>
- NIH rigor and reproducibility: <https://www.grants.nih.gov/policy-and-compliance/policy-topics/reproducibility>
- NIH data management and sharing: <https://www.grants.nih.gov/policy-and-compliance/policy-topics/sharing-policies/dms>

## 20. Explicit Non-Goals

- User accounts, cloud storage, analytics, or a backend database
- Sending documents or prompts directly to an AI provider
- Automatic literature searching by the application
- OCR for scanned documents in the first release
- Reference-manager synchronization
- Statistical computation or patient-level data analysis
- Automated IRB submission, trial registration, journal submission, or compliance certification
