# Simple Adaptive Research Forms Design

Date: 2026-08-09
Status: Approved for implementation planning

## 1. Purpose

Research Prompt Studio currently renders most stage and research-family fields as free-text inputs. This preserves flexibility but asks users to type too much, repeats context across stages, and makes terms such as `incomplete` difficult to act on.

The approved redesign makes the normal path concise and selection-driven while preserving the methodological detail required for world-class medical research. Each lifecycle stage presents approximately three to five simple decisions, reuses prior context, and offers collapsed advanced controls when a specialist needs more precision.

## 2. Goals

- Reduce typing and visible form density in all seven research stages.
- Use dropdowns, checkbox-based multi-selects, segmented controls, and binary controls whenever the answer belongs to a defined set.
- Keep short free text only where the answer is inherently study-specific.
- Tailor controls and options to research type, study design, lifecycle stage, evidence mode, and interface language.
- Carry shared information and stage outputs forward automatically.
- Preserve evidence boundaries, privacy safeguards, reporting standards, and expert-review requirements.
- Keep the application static, local-first, bilingual, keyboard accessible, and compatible with GitHub Pages.

## 3. Non-Goals

- The application will not call an AI service or add a backend.
- The application will not conduct a literature search, calculate statistics, infer ethics approval, or decide regulatory compliance.
- Dropdown choices will not replace study-specific human judgment.
- The redesign will not weaken upload deidentification, evidence-budget, source-traceability, or identifier safeguards.
- The redesign will not turn the seven-stage lifecycle into a marketing-style wizard or add a separate account/persistence system.

## 4. Approved Product Decisions

1. Use a **Simple + Advanced** form at every stage.
2. Hide Advanced details by default for every experience level.
3. Change choices dynamically by research type and study design.
4. Reuse previous-stage information automatically and keep it editable.
5. Include `Other - specify` and `Not sure - ask AI to recommend` where scientifically appropriate.
6. Use a metadata-driven field catalogue rather than hand-coded forms for each stage.
7. Allow every target output to be selected; selecting one changes to its corresponding lifecycle stage.
8. Keep evidence and privacy blocking conditions unchanged.

## 5. Information Architecture

### 5.1 Compact workspace setup

The default setup row contains:

- Research type
- Study subtype or design
- Evidence mode
- Output language
- Target output

A collapsed **Research profile** section contains:

- Researcher role
- Experience level
- Scientific field
- Country and institutional setting
- Citation style

The profile values remain persistent across lifecycle stages. Target output lists all supported outputs. Selecting an output resolves its lifecycle stage and follows the stage-change confirmation rules before navigation.

### 5.2 Inherited context strip

Every stage begins with a compact context strip containing the most relevant previously entered values, normally topic, population or setting, research question, and primary outcome. An Edit command focuses the original control or opens the relevant simple controls. The strip is not a card inside another card and must wrap cleanly on narrow screens.

### 5.3 Simple and Advanced sections

The Simple section contains no more than five required decisions under normal conditions. A generated or composed text preview may appear in addition to those decisions but does not count as another required decision.

Every composed preview is a deterministic template assembled from user selections and inherited context. The browser does not semantically analyze uploaded or web evidence and must not turn a structured choice into an unsupported factual claim.

Advanced details use a disclosure control with a stable `aria-expanded` state. Collapsing the disclosure never clears data. Advanced values continue to participate in prompt generation while hidden.

## 6. Seven-Stage Field Map

| Stage | Simple decisions | Composed or inherited output | Advanced details |
| --- | --- | --- | --- |
| 1. Define the Research Question | Topic; population and setting; question type; primary outcome | Editable research question and objectives | Problem statement; comparator; endpoint timing; additional objectives |
| 2. Conduct a Literature Review | Information sources; date coverage; evidence types; search concepts | Editable reproducible search strategy | Full Boolean query; eligibility criteria; grey literature; language and justified design limits |
| 3. Synthesize Information | Overall evidence pattern; synthesis method; evidence certainty; main limitations | Editable evidence-summary instruction or user-supplied summary | Effect measures; heterogeneity; risk-of-bias tool; subgroup and sensitivity analyses |
| 4. Identify Research Gaps | Gap type; evidence support; population or context; priority | Editable research-gap statement | Novelty check; stakeholder relevance; certainty rationale; generalizability |
| 5. Generate Hypotheses | Hypothesis approach; exposure or intervention; outcome; expected direction | Editable hypothesis or research proposition | Mechanism; alternatives; causal assumptions; effect modification |
| 6. Outline Research Methodology | Confirmed study design; data source or recruitment; sampling approach; analysis family; feasibility period | Editable methodology outline | Sample size; confounders; missing data; sensitivity analysis; ethics and governance |
| 7. Write a Research Proposal | Proposal type; target audience; required sections; timeline | Editable proposal outline assembled from stages 1-6 | Budget; registration; data sharing; dissemination; authorship; detailed governance |

The exact visible options are filtered by the selected research family and design. A design-critical value must be promoted to the Simple section if it is required to produce a coherent prompt for that design.

## 7. Control Semantics

### 7.1 Control types

- **Single select:** one value from a controlled vocabulary.
- **Checkbox multi-select:** zero or more values, displayed as compact chips but implemented as accessible checkboxes.
- **Segmented control:** a small mutually exclusive set, normally two to four choices.
- **Toggle or checkbox:** a binary value.
- **Short text:** a study-specific phrase such as topic, population, outcome, or custom value.
- **Derived editable text:** a draft composed from structured choices and inherited context.

### 7.2 `Other - specify`

Selecting `Other - specify` reveals one adjacent short-text control. Changing away from Other clears only that obsolete custom value after the user confirms if it contains text. Other values must be serialized as user-provided data, never as instructions.

### 7.3 `Not sure - ask AI to recommend`

Not sure is available for methodological decisions that can safely remain unresolved at prompt-generation time. It counts as complete for readiness and is serialized as an unresolved decision. The downstream prompt must request two or three applicable options, their rationale, limitations, and the information needed for a human decision.

Not sure is not permitted for:

- confirmation that uploaded material is deidentified;
- presence of identifiable information;
- evidence-budget compliance;
- required source availability in uploaded mode;
- any claimed ethics, registration, permission, or governance approval.

## 8. Dynamic Field Catalogue

Create a central catalogue for field definitions and option sets. Each definition includes:

- stable field ID and localized label/help keys;
- control type;
- Simple or Advanced tier;
- option-set ID or option resolver;
- required, visible, and enabled predicates;
- lifecycle stage membership;
- compatible research types and study designs;
- whether Other and Not sure are allowed;
- inherited source field, if any;
- draft-composition and prompt-serialization metadata.

Option IDs are language-neutral. Thai and English labels live in the i18n catalogue. Predicates receive the current research type, study design, stage, evidence mode, and relevant field values.

Research-family overlays must cover all existing families:

- randomized trials;
- observational studies;
- diagnostic accuracy;
- prediction modelling;
- evidence reviews;
- qualitative and mixed methods;
- medical education;
- laboratory and animal research;
- AI and health data;
- implementation, quality improvement, and economics.

For example, observational designs expose exposure, comparator, confounder, data-source, and observational analysis choices; randomized designs expose intervention, allocation, blinding, estimand, and trial-analysis choices; qualitative designs expose sampling, phenomenon, data collection, analysis approach, and reflexivity choices.

## 9. State and Carry-Forward Rules

### 9.1 Value representation

Field state supports:

- strings for short text and single-select IDs;
- arrays of IDs for multi-select values;
- separate custom text associated with Other selections;
- derived draft state containing the suggested value and a `customized` flag.

Validation and prompt serialization use typed helper functions rather than assuming every value is a string.

### 9.2 Canonical shared context

Topic, population and setting, research question, primary outcome, and other framework-specific core concepts are canonical fields. They are not copied into separate stage-specific values. Every compatible stage reads the same canonical value.

Stage products are also canonical outputs:

- literature-review strategy;
- evidence summary;
- research-gap statement;
- hypothesis or proposition;
- methodology outline;
- proposal outline.

### 9.3 Derived draft ownership

Structured selections update their deterministic template draft until the user edits that draft directly. A template may restate selected values or request a downstream analysis, but it must not claim to have interpreted source content. Direct editing sets `customized: true`; later selection changes must not overwrite the customized text. The interface provides `Restore suggested text`, which replaces the custom value with the current composed suggestion and clears the flag.

### 9.4 Changing type, design, or stage

- Changing research type or design identifies incompatible values before clearing them.
- The confirmation lists affected visible labels, not internal IDs.
- Compatible canonical fields and completed stage products remain intact.
- Selecting a target output maps to its lifecycle stage and follows the same confirmation process.
- Opening or closing Advanced details never mutates field values.

## 10. Evidence-Mode Behavior

### Planning

Structured choices create a planning scaffold. Derived text must avoid literature claims and mark evidence-dependent conclusions as assumptions, questions, or information gaps.

### Uploaded documents

The evidence workspace and current local-only processing remain unchanged. Structured synthesis choices instruct the downstream AI to operate only on included SOURCE blocks; the browser does not synthesize those blocks itself. Readiness still requires deidentification confirmation, at least one ready included source, valid extracted text, and an acceptable evidence budget.

### Web research

Structured source and search choices instruct the downstream AI to search named databases and official sources, record exact search dates and strategies, and return traceable links and stable identifiers. The browser application itself does not search the web.

## 11. Readiness and Validation

Replace generic `incomplete` presentation with actionable states:

- **Not started** when no required decision for a stage has a value.
- **N required items remaining** when the stage has partial data.
- **Ready** when all required Simple decisions and global evidence requirements are satisfied.
- **Blocked: reason** for global blockers such as upload confirmation, missing ready evidence, excessive evidence size, or identifiable data.

Selecting a stage shows its missing required items in the validation summary and offers a command to focus the first available control.

Simple required fields are blocking. Advanced fields are warnings unless a research-type predicate identifies a field as design-critical. Not sure satisfies a normal required decision but remains explicitly unresolved in the generated prompt.

## 12. Prompt Construction

The prompt engine receives normalized display values from typed field helpers. It must:

- serialize selected option labels and custom Other text without exposing internal IDs;
- serialize multi-select values in a deterministic order;
- distinguish inherited context, structured decisions, user-customized text, and unresolved Not sure decisions;
- include hidden Advanced values when present;
- preserve current evidence boundaries, governance instructions, standards, safeguards, citation rules, and expert-review checklist;
- express evidence-pattern selections as user-supplied context or a requested downstream assessment, never as a browser-verified finding;
- never infer evidence, methods, approvals, registrations, or statistics from an unselected option.

Experience level continues to describe the researcher and may tune explanation depth in the downstream request, but it does not change scientific standards or automatically expand Advanced details.

## 13. Accessibility and Responsive Design

- Every control has a programmatic label and a visible required indicator when applicable.
- Checkbox chips remain native checkbox inputs with clear checked, focus, hover, and disabled states.
- Disclosure controls expose `aria-expanded` and an associated region.
- Conditional controls receive logical focus only when the user explicitly activates the condition.
- Dynamic validation and draft updates use an appropriately scoped live region without announcing every keystroke.
- All functionality is operable by keyboard.
- The Simple form uses one column on mobile and a restrained two-column layout where space permits.
- Thai and English labels wrap without overlap, clipped text, or horizontal page scrolling.
- The interface retains the existing quiet, work-focused visual system and stable control dimensions.

## 14. Component Boundaries

Implementation should keep these responsibilities separate:

- **Field catalogue:** definitions, options, predicates, tiers, and composition metadata.
- **State helpers:** typed values, Other text, draft ownership, carry-forward, and compatibility clearing.
- **Validation:** required decisions, actionable stage counts, warnings, and global blockers.
- **Renderer:** accessible controls, context strip, disclosure state, conditional inputs, and draft preview.
- **Prompt engine:** normalized serialization and unresolved-decision instructions.
- **i18n:** all labels, options, statuses, tooltips, and validation copy.

Existing modules should be extended in sympathy with their current ownership. The catalogue may be split into focused modules if a single file would combine unrelated option sets and predicates.

## 15. Error Handling

- Unknown or stale option IDs render as an explicit unresolved value and produce a validation issue rather than disappearing.
- If a previously valid choice becomes incompatible, generation is blocked until the user confirms replacement or clearing.
- Derived-text composition failures preserve the last user-visible value and expose a recoverable validation message.
- Hidden Advanced values that become incompatible are included in the change confirmation.
- Uploaded evidence parsing failures continue to be isolated per source.

## 16. Test Strategy

### Unit tests

- field and option predicates for every research type and study design;
- maximum normal Simple decision count per stage;
- typed validation for strings, arrays, Other values, and Not sure;
- canonical carry-forward across all seven stages;
- derived drafts, customization protection, and restore behavior;
- compatibility clearing and confirmation summaries;
- target-output-to-stage mapping;
- deterministic prompt serialization in Thai, English, and bilingual output;
- preservation of evidence boundaries, governance, standards, and safeguards.

### Browser tests

- representative workflows for all research families and every lifecycle stage;
- keyboard operation of selects, checkbox chips, disclosures, Other fields, and validation focus;
- Target output navigation and data preservation;
- Simple/Advanced persistence and mobile layout;
- actionable readiness counts and global blocked states;
- Uploaded documents, Web research, and Planning behavior;
- Axe WCAG A/AA checks in Thai and English;
- GitHub Pages path-prefix behavior and existing prompt copy/download/reset workflows.

### Visual verification

Inspect desktop and mobile screenshots for stable dimensions, wrapping, conditional-field transitions, context-strip density, and absence of overlap. The approved Step 3 visual-companion mockup is the interaction reference, not a pixel-perfect replacement for the existing design system.

## 17. Acceptance Criteria

The redesign is ready when:

1. Each stage normally presents no more than five required Simple decisions.
2. Research-specific options change correctly with type and design.
3. Shared information is entered once and reused without unintended overwrites.
4. Other and Not sure behave according to their approved safety rules.
5. Target output changes the corresponding lifecycle stage.
6. Advanced values persist while collapsed and appear in generated prompts.
7. Readiness text identifies remaining work rather than showing only `incomplete`.
8. Existing upload privacy, evidence boundaries, standards, and prompt safeguards pass regression tests.
9. The interface passes keyboard, mobile, bilingual wrapping, Axe, and GitHub Pages verification.
