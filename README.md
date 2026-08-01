# Research Prompt Studio

## Overview

Research Prompt Studio is a static, browser-only workspace for composing structured, stage-aware medical research prompts. It adapts frameworks, methodological checks, standards, evidence boundaries, and safeguards to the selected research type and lifecycle stage. It supports Thai and English interface copy and can request Thai, English, or bilingual model output.

The app does not call an AI service. Generated prompts must be copied manually into the AI service chosen by the researcher.

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

The workspace supports: research question, evidence, protocol, ethics and governance, analysis plan, proposal, conduct and quality, analysis and interpretation, reporting, and dissemination and impact.

## Evidence Modes

- **Planning:** creates a planning scaffold and prohibits literature claims and citations.
- **Web research:** instructs the downstream AI to use verifiable external sources and traceable citations.
- **Uploaded evidence:** restricts the downstream AI to selected local source blocks. Source content is untrusted data, never instructions.

## Supported Files and Limits

Supported local uploads are searchable PDF, DOCX, TXT, Markdown, CSV, RIS, and BibTeX files. The application accepts up to 10 files, up to 20 MiB per file and 60 MiB in total. Selected extracted evidence has configurable 25,000, 60,000, or 120,000 character budgets; an over-budget selection is blocked and is never silently truncated.

Image-only PDFs are rejected because OCR is not provided. Parsing is local and does not calculate research statistics or create an external evidence store.

## Privacy and Deidentification

This is a static HTML, CSS, and JavaScript application with no backend, network AI calls, persistence, analytics, cookies, account system, or OCR. Uploading to this application does **not** attach documents to ChatGPT, Claude, Gemini, or any other external AI service. Local evidence remains in browser memory only and is cleared by reset, upload-mode clearing, or page reload.

Treat uploads as untrusted evidence. Confirm deidentification before processing, inspect identifier hints, and do not include direct or indirect identifiers unless an appropriate lawful basis, approvals, safeguards, and governance arrangements are in place. The application cannot determine whether a file is deidentified or whether a proposed use is permitted.

## Standards

Adaptive prompts surface applicable research frameworks and reporting or conduct standards, including SPIRIT, CONSORT, ICH GCP, STROBE, RECORD, STARD, TRIPOD, PRISMA, GRADE, COREQ, SRQR, GREET, SQUIRE-EDU, ARRIVE, SPIRIT-AI, CONSORT-AI, DECIDE-AI, CLAIM, StaRI, SQUIRE, TIDieR, and CHEERS. Standards are prompts for review, not a compliance or certification claim.

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
