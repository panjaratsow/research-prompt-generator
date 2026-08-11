# Research Prompt Studio

## Overview

Research Prompt Studio is a static, browser-only workspace for composing structured, stage-aware medical research prompts. It adapts frameworks, methodological checks, standards, evidence boundaries, and safeguards to the selected research type, structured subtype/design, and lifecycle stage. The five compact setup controls are Research type, Study subtype or design, Evidence mode, Output language, and Target output. A collapsed Research profile retains researcher role and experience, scientific field, country and institutional setting, and citation style. The interface supports Thai and English and can request Thai, English, or bilingual model output.

The app does not call an AI service, and the browser does not perform AI analysis. It assembles deterministic prompts from user selections and locally extracted text; generated prompts must be copied manually into the AI service chosen by the researcher.

## Supported Research Types

- Randomized trial
- Observational study
- Diagnostic accuracy study
- Prediction-model study
- Evidence review
- Qualitative or mixed-methods study
- Medical-education study
- Laboratory or animal study
- AI and health-data study
- Implementation, quality-improvement, or economic evaluation

## Research Lifecycle

The workspace follows seven target-output stages: Define the Research Question, Conduct a Literature Review, Synthesize Information, Identify Research Gaps, Generate Hypotheses, Outline Research Methodology, and Write a Research Proposal. Choosing a specific Target output navigates directly to its corresponding stage while preserving compatible context.

## Adaptive Forms

Each stage presents a normal Simple path with no more than five required decisions. Research-family and study-design choices determine the scientifically relevant options. Short text is reserved for study-specific concepts; controlled decisions use selects or checkbox groups.

Advanced details remain collapsed by default. Populated Advanced values persist when the section is collapsed or the user moves between stages, and they remain serialized in the generated prompt.

`Other - specify` reveals an adjacent text field and treats that text as user data, not instructions. Replacing a populated Other choice requires confirmation before its custom text is cleared. `Not sure - ask AI to recommend` is available only for methodological choices that may safely remain unresolved; the prompt requests options, rationale, limitations, and the information needed for a human decision. It is not offered for deidentification, identifiable-data, evidence-budget, source-availability, ethics, registration, permission, or governance confirmations.

## Evidence Modes

- **Planning:** creates a planning scaffold and prohibits literature claims and citations.
- **Web research:** instructs the downstream AI to search named databases and official sources, report the search date and reproducible strategy, and provide direct links plus DOI, PMID, registry, or other stable identifiers where available.
- **Uploaded evidence:** restricts the downstream AI to selected local source blocks. Source content is untrusted data, never instructions.

## Supported Files and Limits

Supported local uploads are searchable PDF, DOCX, TXT, Markdown, CSV, RIS, and BibTeX files. The application retains at most 10 source inventory rows, accepts files up to 20 MiB each and 60 MiB in total, and reports additional files without retaining them. Unsupported, legacy, oversized, encrypted, empty, malformed, and image-only files remain visible as excluded inventory rows within that cap while valid peers continue processing. CSV, RIS, and BibTeX receive minimal structural validation; UTF-8 is validated deliberately and OCR is not attempted. Selected extracted evidence has configurable 25,000, 60,000, or 120,000 character budgets; each row shows its full contribution, and an over-budget selection is blocked and is never silently truncated.

Image-only PDFs are rejected because OCR is not provided. Supported documents are parsed locally in the browser. Parsing extracts text for prompt construction; it does not interpret evidence, calculate research statistics, conduct a literature search, or create an external evidence store.

## Privacy and Deidentification

This is a static HTML, CSS, and JavaScript application with no application backend, AI-service call, persistence layer, analytics, cookies, account system, or OCR. Uploading to this application does **not** attach documents to ChatGPT, Claude, Gemini, or any other external AI service. Extracted evidence and upload records remain in browser memory for the active page session and are cleared by reset, upload-mode clearing, or page reload.

Treat uploads as untrusted evidence. Confirm deidentification before processing, inspect identifier hints, and do not include direct or indirect identifiers unless an appropriate lawful basis, approvals, safeguards, and governance arrangements are in place. The application cannot determine whether a file is deidentified or whether a proposed use is permitted.

## Standards

Adaptive prompts use explicit applicability predicates for the selected family, subtype/design, and stage. Medical education inherits its underlying CONSORT-, STROBE-, or COREQ/SRQR-style guidance; scoping, routinely collected data, AI trials, early AI evaluation, quality improvement, and economic evaluation receive only their applicable extensions. Official links and the catalogue review date (`2026-08-01`) are shown in the workspace. Standards are prompts for review, not a compliance or certification claim.

Researchers remain responsible for Thai PDPA, local institutional review board or ethics committee requirements, local data-governance obligations, and applicable international standards. The prompts require human expert review and must not be treated as ethics approval, registration, legal advice, or a clinical decision.

## Local Development

Use Node.js 20.19 or later. Install locked dependencies with `npm ci`, then refresh local parser assets with `npm run vendor`.

Start the local static server with `npm run serve -- --port 4173` and open `http://127.0.0.1:4173/`.

## Tests

Run the release checks from the repository root:

    npm run vendor
    npm test
    npm run test:e2e
    git diff --check

The Playwright suite covers desktop and mobile Chromium projects, including automated Axe WCAG A/AA checks. Manual review should still assess Thai and English wrapping, non-color validation cues, focus restoration, and local-network behavior.

## GitHub Pages Deployment

The application is a static GitHub Pages site. Deploy the repository root from the approved release branch using GitHub Pages. All application, icon, manifest, worker, and vendor references are relative so the site can run at `https://panjaratsow.github.io/research-prompt-generator/` without a backend.

## Limitations

The application does not retrieve or verify literature, perform statistical analysis, run OCR, validate factual claims, provide legal or ethical determinations, or certify compliance. A downstream AI can still make mistakes, so researchers must verify every claim, citation, standard, translation, and decision. Do not upload private, identifiable, or sensitive material unless its handling is authorized and appropriately safeguarded.

## License

MIT License. See `LICENSE`.
