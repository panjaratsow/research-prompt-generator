# Content Review Matrix

## Scope and Method

This is a release-content review of prompts generated locally on 2026-08-02. Each scenario used the application prompt engine with bilingual output, Vancouver citation setting, the listed lifecycle stage and evidence mode, and structured fields that identify unavailable details as information to be supplied. Uploaded-mode scenarios used a deidentified synthetic source. Expected frameworks and standards were resolved from the application catalogue.

`Pass` means the generated prompt contained the stated application-level instruction. It is not a certification of a study, a standard, a translation, legal compliance, ethics approval, local IRB approval, Thai PDPA compliance, or downstream AI output. Expert human review remains required before use.

## Scenario Design

| # | Topic | Research type / stage / evidence mode | Expected framework and standards | Required methodological checks | Ethics and privacy checks |
| --- | --- | --- | --- | --- | --- |
| 1 | Pragmatic randomized trial of postpartum haemorrhage training | Randomized trial / Protocol / Planning | PICO; SPIRIT 2025, ICH E6(R3) | Estimand, effect estimate, randomization, allocation concealment, blinding, missing data, multiplicity, equity, feasibility, clinical relevance | Do not claim ethics approval or registration; assess consent, Thai PDPA, local IRB, data governance, and training-risk safeguards as applicable. |
| 2 | Multicentre cohort of neonatal iron status | Observational / Reporting / Web research | PECO; STROBE, RECORD | Estimand, target comparison, time zero, confounding, residual confounding, missing data, multiplicity, equity | Verify consent or lawful basis, Thai PDPA, site governance, local IRB requirements, and no unsupported cohort claims. |
| 3 | Diagnostic accuracy of a sepsis biomarker | Diagnostic / Reporting / Uploaded | PIRD; STARD | Accuracy measures with uncertainty, reference standard, threshold, spectrum bias, verification bias, missing data | Use only selected deidentified sources; do not reproduce identifiers or infer approvals, consent, or diagnostic claims. |
| 4 | External validation of a cardiovascular risk model | Prediction / Reporting / Web research | PICOTS, CHARMS; TRIPOD, TRIPOD+AI | Outcome timing, predictors, discrimination, calibration, internal and external validation, overfitting, updating | Check governance for validation data, equity, Thai PDPA, local IRB, and no claim of validated clinical use without evidence. |
| 5 | Systematic review of simulation-based medical education | Evidence review / Reporting / Uploaded | PICO, PCC; PRISMA 2020, PRISMA-ScR, GRADE | Eligibility, search, selection, extraction, risk of bias, heterogeneity, certainty, publication bias | Restrict evidence to selected deidentified sources; preserve source IDs and do not invent bibliographic details. |
| 6 | Qualitative study of family decision-making in intensive care | Qualitative or mixed methods / Reporting / Planning | SPIDER; COREQ, SRQR | Sampling, data collection, analytic rigor, reflexivity, researcher-participant relationship, integration if mixed methods | Require sensitive-participant protections, consent, Thai PDPA, local IRB review, and no inference from absent evidence. |
| 7 | Mixed-methods evaluation of competency-based assessment | Medical education / Reporting / Web research | PICO, CIMO; GREET, SQUIRE-EDU | Educational outcomes, comparison, assessment validity, missing data, multiplicity, equity, feasibility | Consider learner privacy, consent, Thai PDPA, institutional approvals, and safe handling of assessment data. |
| 8 | Animal model of ischemia-reperfusion injury | Laboratory or animal / Protocol / Planning | FINER; ARRIVE 2.0 | Experimental unit, randomization, blinding, sample-size rationale, attrition, reagent validation, welfare | Require applicable animal-care approval and institutional governance; never claim approval or compliance without supplied evidence. |
| 9 | External validation of an AI chest-radiograph model | AI and health data / Reporting / Uploaded | PICOTS; RECORD, TRIPOD+AI, CONSORT-AI, DECIDE-AI, CLAIM | Intended use, dataset provenance, reference standard, leakage prevention, performance, calibration, validation, fairness | Use only selected deidentified sources; assess data rights, Thai PDPA, local IRB, bias, fairness, and clinical deployment governance. |
| 10 | Implementation and cost evaluation of antimicrobial stewardship | Implementation, QI, or economic evaluation / Reporting / Web research | PICO, CIMO; StaRI, SQUIRE, TIDieR, CHEERS 2022 | Strategy, context, outcomes, fidelity, feasibility, perspective, time horizon, uncertainty, equity | Assess site governance, operational data permissions, Thai PDPA, local IRB or QI review, and no unsupported cost claims. |

## Generated-Prompt Review

| # | Methodological fit | Evidence boundary | Ethics/privacy | Guideline selection | Citation traceability | Missing-information handling | Thai clarity | English clarity | Reviewer sign-off |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 2 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 3 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 4 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 5 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 6 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 7 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 8 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 9 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |
| 10 | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Not signed: expert human review required |

There are no remaining `Revise` values in the application-output review. The unsigned reviewer column is intentional: the release review cannot replace qualified scientific, ethics, privacy, legal, Thai PDPA, or local IRB review.
