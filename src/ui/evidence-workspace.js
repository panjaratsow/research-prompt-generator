import { calculateEvidenceBudget, createSourceRecord, renumberSources, validateFileBatch } from "../evidence/core.js";
import { parseEvidenceFile } from "../evidence/parsers.js";
import { t } from "../i18n.js";

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { dataset, ...properties } = options;
  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    if (key.includes("-")) node.setAttribute(key, value);
    else node[key] = value;
  }
  if (dataset) Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
}

function emit(container, type, detail = {}) {
  container.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
}

function createPendingSource(file) {
  return {
    filename: typeof file?.name === "string" ? file.name : "",
    size: file?.size,
    type: typeof file?.type === "string" ? file.type : "",
    file,
    text: "",
    warnings: [],
    identifierHints: [],
    included: false,
    status: "extracting",
  };
}

function sourceRow(source, locale, container) {
  const included = element("input", {
    type: "checkbox",
    checked: source.included,
    disabled: source.status !== "ready",
    "aria-label": t(locale, "evidence.includeSource", { source: source.id }),
  });
  included.addEventListener("change", () => emit(container, "evidence:toggle", { id: source.id, included: included.checked }));
  const remove = element("button", {
    type: "button",
    className: "icon-button",
    "aria-label": t(locale, "evidence.removeSource", { source: source.id }),
    title: t(locale, "evidence.removeSource", { source: source.id }),
  }, [element("img", { src: "vendor/icons/trash-2.svg", alt: "" })]);
  remove.addEventListener("click", () => emit(container, "evidence:remove", { id: source.id }));
  const status = source.status === "error"
    ? `${t(locale, "uploadStates.error")} (${source.error ?? "malformed-file"}: ${t(locale, `evidence.errors.${source.error ?? "malformed-file"}`)})`
    : t(locale, `uploadStates.${source.status ?? "idle"}`);
  const warnings = [
    ...(source.warnings ?? []).map(warning => t(locale, `evidence.warnings.${warning}`)),
    ...(source.identifierHints?.length ? [t(locale, "evidence.identifierHint")] : []),
  ].filter(Boolean);
  return element("li", { className: "evidence-source", dataset: { testid: `source-${source.id}`, ...(source.status === "error" ? { errorCode: source.error ?? "malformed-file" } : {}) } }, [
    element("label", { className: "source-include" }, [included, element("span", { textContent: source.id })]),
    element("div", { className: "source-details" }, [
      element("strong", { textContent: source.filename }),
      element("span", { className: `source-status ${source.status}`, textContent: status }),
      ...warnings.map(warning => element("small", { className: "source-warning", textContent: warning })),
    ]),
    remove,
  ]);
}

export async function ingestFiles(files, state, dependencies, onProgress) {
  const issues = validateFileBatch(files, state.sources);
  if (issues.length) return { sources: state.sources, issues };
  const pending = Array.from(files, createPendingSource);
  const sources = [...state.sources, ...pending];
  for (const source of pending) {
    onProgress(renumberSources(sources));
    try {
      const parsed = await parseEvidenceFile(source.file, dependencies);
      Object.assign(source, createSourceRecord(source.file, parsed.text, parsed.warnings));
    } catch (error) {
      Object.assign(source, { status: "error", text: "", included: false, error: error?.code ?? "malformed-file", warnings: [] });
    }
    delete source.file;
  }
  return { sources: renumberSources(sources), issues: [] };
}

export function renderEvidenceWorkspace(container, state, { pendingFiles = [], issues = [], processing = false } = {}) {
  if (!container) return;
  const locale = state.interfaceLocale;
  const budget = calculateEvidenceBudget(state.sources, state.evidenceBudget);
  const input = element("input", { id: "evidenceInput", type: "file", multiple: true, accept: ".pdf,.docx,.txt,.md,.csv,.ris,.bib", dataset: { testid: "evidence-input" } });
  input.addEventListener("change", () => emit(container, "evidence:add", { files: Array.from(input.files ?? []) }));
  const budgetSelect = element("select", { id: "evidenceBudget", "aria-label": t(locale, "evidence.budget") }, [25000, 60000, 120000].map(value => element("option", { value, selected: state.evidenceBudget === value, textContent: t(locale, "evidence.budgetOption", { value: value.toLocaleString() }) })));
  budgetSelect.addEventListener("change", () => emit(container, "evidence:set-budget", { budget: Number(budgetSelect.value) }));
  const confirmation = pendingFiles.length ? element("section", { className: "privacy-confirmation", dataset: { testid: "privacy-confirmation" } }, [
    element("h3", { textContent: t(locale, "evidence.confirmTitle") }),
    element("p", { textContent: t(locale, "evidence.confirmText") }),
    element("ul", { className: "pending-files" }, pendingFiles.map(file => element("li", { textContent: file.name }))),
    (() => {
      const checkbox = element("input", { id: "evidenceDeidentified", type: "checkbox", checked: state.deidentificationConfirmed });
      checkbox.addEventListener("change", () => emit(container, "evidence:confirm-deidentified", { confirmed: checkbox.checked }));
      return element("label", { className: "check-control", htmlFor: "evidenceDeidentified" }, [checkbox, document.createTextNode(t(locale, "evidence.confirmLabel"))]);
    })(),
    (() => {
      const process = element("button", { type: "button", className: "primary-button", disabled: processing || !state.deidentificationConfirmed, dataset: { action: "evidence-process" }, textContent: t(locale, "evidence.process") });
      process.addEventListener("click", () => emit(container, "evidence:process"));
      return process;
    })(),
  ]) : null;
  const issueItems = issues.map(issue => element("li", { textContent: t(locale, `evidence.errors.${issue.code}`) }));
  if (budget.exceeded) issueItems.push(element("li", { textContent: t(locale, "evidence.budgetExceeded") }));
  const dropZone = element("label", { className: "evidence-drop-zone", htmlFor: "evidenceInput" }, [element("span", { textContent: t(locale, "evidence.addFiles") }), element("small", { textContent: t(locale, "evidence.localOnly") }), input]);
  dropZone.addEventListener("dragover", event => event.preventDefault());
  dropZone.addEventListener("drop", event => {
    event.preventDefault();
    emit(container, "evidence:add", { files: Array.from(event.dataTransfer?.files ?? []) });
  });
  container.replaceChildren(element("section", { className: "evidence-workspace", "aria-labelledby": "evidenceWorkspaceTitle" }, [
    element("div", { className: "evidence-heading" }, [
      element("div", {}, [element("div", { className: "panel-kicker", textContent: t(locale, "evidence.kicker") }), element("h2", { id: "evidenceWorkspaceTitle", textContent: t(locale, "evidence.title") })]),
      element("label", { className: "control-label", htmlFor: "evidenceBudget", textContent: t(locale, "evidence.budget") }, [budgetSelect]),
    ]),
    dropZone,
    confirmation,
    issueItems.length ? element("section", { className: "evidence-issues", dataset: { testid: "preflight-blocking" }, "aria-live": "polite" }, [element("ul", {}, issueItems)]) : null,
    element("div", { className: "evidence-counts", "aria-live": "polite" }, [
      element("span", { textContent: t(locale, "evidence.selectedChars", { value: budget.selectedChars.toLocaleString() }) }),
      element("span", { textContent: t(locale, "evidence.estimatedTokens", { value: budget.estimatedTokens.toLocaleString() }) }),
    ]),
    element("ul", { className: "evidence-sources", "aria-label": t(locale, "evidence.sources") }, state.sources.map(source => sourceRow(source, locale, container))),
  ].filter(Boolean)));
}
