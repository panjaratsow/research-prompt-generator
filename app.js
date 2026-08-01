import {
  createInitialState, resetState, setDeidentificationConfirmed, setEvidenceMode, setField,
  setEvidenceBudget, setInterfaceLocale, setOutputLanguage, setPromptDrawer, setResearchType, setStage, replaceSources,
} from "./src/state.js";
import { getAdaptiveFieldIds, resolveStandards } from "./src/catalog/index.js";
import { buildPrompt, buildQualityChecklist } from "./src/prompt-engine.js";
import { validateState } from "./src/validation.js";
import { t } from "./src/i18n.js";
import { clearConfirmation, focusFirstBlockingIssue, renderConfirmation, renderValidation, renderWorkspace, updateLifecycleReadiness } from "./src/ui/render.js";
import { PARSER_DEPENDENCIES } from "./src/evidence/browser-adapters.js";
import { createSourceRecord, renumberSources } from "./src/evidence/core.js";
import { ingestFiles, renderEvidenceWorkspace } from "./src/ui/evidence-workspace.js";
import { closePromptDrawer, copyPrompt, downloadPrompt, openPromptDrawer } from "./src/ui/prompt-drawer.js";

const root = document;
let state = createInitialState();
let pendingTransition = null;
let pendingFiles = [];
let evidenceIssues = [];
let evidenceOperationGeneration = 0;
let evidenceProcessing = false;

function announce(message) { root.querySelector("#appStatus").textContent = message; }
function render() {
  renderWorkspace(root, state, validateState(state));
  if (state.evidenceMode === "uploaded") {
    renderEvidenceWorkspace(root.querySelector("#evidenceWorkspaceRoot"), state, { pendingFiles, issues: evidenceIssues, processing: evidenceProcessing });
  }
}
function publish(action) { window.dispatchEvent(new CustomEvent("workspace:statechange", { detail: { action, state: structuredClone(state) } })); }
function update(next, action, shouldRender = true) { state = next; if (shouldRender) render(); publish(action); }
function cancelEvidenceProcessing() {
  evidenceOperationGeneration += 1;
  evidenceProcessing = false;
}
function updateDeidentificationConfirmation(confirmed) {
  state = setDeidentificationConfirmed(state, confirmed);
  const preflight = validateState(state);
  renderValidation(root, preflight, state.interfaceLocale);
  updateLifecycleReadiness(root, preflight, state.interfaceLocale);
  root.querySelector("[data-action='evidence-process']").disabled = evidenceProcessing || !state.deidentificationConfirmed;
  publish("set-deidentification");
}
function restoreTrigger(transition) {
  const selector = transition.kind === "research-type" ? "#researchType" : transition.kind === "evidence-mode" ? "[data-action=\"evidence-mode\"]" : transition.kind === "reset" ? "#resetButton" : `[data-action="stage"][data-stage-id="${transition.nextId}"]`;
  root.querySelector(selector)?.focus();
}

function beginConfirmation(kind, nextId, incompatible) {
  pendingTransition = { kind, nextId, incompatible };
  renderConfirmation(root, incompatible.map(id => t(state.interfaceLocale, `fields.${id}`)), state.interfaceLocale, kind);
}

function cancelConfirmation() {
  const transition = pendingTransition;
  pendingTransition = null;
  clearConfirmation(root);
  render();
  if (transition) restoreTrigger(transition);
}

function confirmTransition() {
  const transition = pendingTransition;
  if (!transition) return;
  let next;
  if (transition.kind === "reset") {
    cancelEvidenceProcessing();
    pendingFiles = [];
    evidenceIssues = [];
    closePromptDrawer(root);
    next = resetState();
  } else if (transition.kind === "research-type") next = setResearchType(state, transition.nextId, true).state;
  else if (transition.kind === "evidence-mode") {
    cancelEvidenceProcessing();
    next = setDeidentificationConfirmed(replaceSources(setEvidenceMode(state, transition.nextId), []), false);
  }
  else next = setStage(state, transition.nextId);
  if (transition.kind === "evidence-mode") { pendingFiles = []; evidenceIssues = []; }
  pendingTransition = null;
  clearConfirmation(root);
  update(next, `confirm-${transition.kind}`);
  if (transition.kind === "reset") {
    document.documentElement.lang = state.interfaceLocale;
    announce(t(state.interfaceLocale, "status.reset"));
  }
}

function requestEvidenceMode(nextMode) {
  if (state.evidenceMode === "uploaded" && nextMode !== "uploaded" && state.sources.length) {
    beginConfirmation("evidence-mode", nextMode, []);
    return;
  }
  if (state.evidenceMode === "uploaded" && nextMode !== "uploaded") cancelEvidenceProcessing();
  pendingFiles = nextMode === "uploaded" ? pendingFiles : [];
  evidenceIssues = [];
  const next = setEvidenceMode(state, nextMode);
  update(nextMode === "uploaded" ? next : setDeidentificationConfirmed(next, false), "set-evidence-mode");
}

async function processEvidenceFiles() {
  if (evidenceProcessing || !state.deidentificationConfirmed || !pendingFiles.length) return;
  const generation = ++evidenceOperationGeneration;
  const files = [...pendingFiles];
  evidenceProcessing = true;
  root.querySelector("[data-action='evidence-process']").disabled = true;
  const isCurrent = () => evidenceProcessing && generation === evidenceOperationGeneration;
  try {
    const result = await ingestFiles(files, state, PARSER_DEPENDENCIES, sources => {
      if (isCurrent()) {
        update(replaceSources(state, sources), "evidence-progress");
        const extracting = sources.find(source => source.status === "extracting");
        if (extracting) announce(t(state.interfaceLocale, "status.extracting", { sourceId: extracting.id }));
      }
    });
    if (!isCurrent()) return;
    evidenceIssues = result.issues;
    pendingFiles = result.issues.length ? files : [];
    evidenceProcessing = false;
    update(replaceSources(state, result.sources), "evidence-process");
    announce(t(state.interfaceLocale, "status.evidenceReady", {
      ready: result.sources.filter(source => source.status === "ready").length,
      error: result.sources.filter(source => source.status === "error").length,
    }));
  } finally {
    if (generation === evidenceOperationGeneration && evidenceProcessing) {
      evidenceProcessing = false;
      render();
    }
  }
}

function requestStage(nextId) {
  const allowed = new Set(getAdaptiveFieldIds(state.researchTypeId, nextId));
  const incompatible = Object.keys(state.fields).filter(id => !allowed.has(id));
  if (incompatible.length) beginConfirmation("stage", nextId, incompatible);
  else update(setStage(state, nextId), "set-stage");
}

root.addEventListener("input", event => {
  const fieldId = event.target.dataset.fieldId;
  if (fieldId) {
    update(setField(state, fieldId, event.target.value), "set-field", false);
    const preflight = validateState(state);
    renderValidation(root, preflight, state.interfaceLocale);
    updateLifecycleReadiness(root, preflight, state.interfaceLocale);
  }
});

root.addEventListener("change", event => {
  const { target } = event;
  if (target.dataset.fieldId) { publish("commit-field"); return; }
  if (target.id === "interfaceLanguage") {
    update(setInterfaceLocale(state, target.value), "set-interface-locale");
    document.documentElement.lang = state.interfaceLocale;
    return;
  }
  if (target.dataset.action === "evidence-mode") requestEvidenceMode(target.value);
  if (target.dataset.action === "output-language") update(setOutputLanguage(state, target.value), "set-output-language");
  if (target.dataset.action === "deidentification") update(setDeidentificationConfirmed(state, target.checked), "set-deidentification");
  if (target.dataset.action === "research-type") {
    const transition = setResearchType(state, target.value);
    if (transition.needsConfirmation) beginConfirmation("research-type", target.value, transition.incompatible);
    else update(transition.state, "set-research-type");
  }
});

root.addEventListener("evidence:add", event => {
  cancelEvidenceProcessing();
  pendingFiles = event.detail.files;
  evidenceIssues = [];
  const retainedSources = state.sources.filter(source => source.status !== "extracting");
  update(setDeidentificationConfirmed(replaceSources(state, retainedSources), false), "evidence-add");
  announce(t(state.interfaceLocale, "status.evidenceAdded", { count: pendingFiles.length }));
});
root.addEventListener("evidence:confirm-deidentified", event => updateDeidentificationConfirmation(event.detail.confirmed));
root.addEventListener("evidence:process", () => { void processEvidenceFiles(); });
root.addEventListener("evidence:set-budget", event => update(setEvidenceBudget(state, event.detail.budget), "set-evidence-budget"));
root.addEventListener("evidence:toggle", event => {
  const sources = state.sources.map(source => source.id === event.detail.id ? { ...source, included: event.detail.included } : source);
  update(replaceSources(state, sources), "evidence-toggle");
});
root.addEventListener("evidence:remove", event => {
  const sources = renumberSources(state.sources.filter(source => source.id !== event.detail.id));
  update(replaceSources(state, sources), "evidence-remove");
});
root.addEventListener("prompt:closed", () => {
  if (state.promptDrawer === "open") update(setPromptDrawer(state, "closed"), "close-prompt-drawer", false);
});
root.addEventListener("prompt:copy", event => {
  void copyPrompt(event.detail.prompt).then(status => {
    if (status === "manual-copy-required") event.detail.output.select();
    announce(t(state.interfaceLocale, status === "copied" ? "status.copied" : "status.manualCopyRequired"));
  }).catch(() => {
    event.detail.output.select();
    announce(t(state.interfaceLocale, "status.manualCopyRequired"));
  });
});
root.addEventListener("prompt:download", event => {
  const download = downloadPrompt(event.detail.prompt, state);
  const anchor = document.createElement("a");
  anchor.href = download.url;
  anchor.download = download.filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(download.url), 0);
  announce(t(state.interfaceLocale, "status.downloaded"));
});

root.addEventListener("click", event => {
  const trigger = event.target.closest("[data-action]");
  const action = trigger?.dataset.action;
  if (action === "cancel-confirmation") cancelConfirmation();
  if (action === "confirm-confirmation") confirmTransition();
  if (action === "generate-prompt") {
    const preflight = validateState(state);
    if (preflight.blocking.length) {
      focusFirstBlockingIssue(preflight);
      announce(t(state.interfaceLocale, "status.preflightBlocked", { count: preflight.blocking.length }));
      return;
    }
    const prompt = buildPrompt(state);
    update(setPromptDrawer(state, "open"), "open-prompt-drawer", false);
    openPromptDrawer(root, prompt, trigger, {
      locale: state.interfaceLocale,
      selectedEvidenceCount: state.sources.filter(source => source.included && source.status === "ready").length,
      standards: resolveStandards(state.researchTypeId, state.stageId),
      qualityChecklist: buildQualityChecklist(state),
    });
  }
  if (event.target.closest("#resetButton")) {
    if (Object.keys(state.fields).length || state.sources.length) beginConfirmation("reset", "", []);
    else {
      cancelEvidenceProcessing();
      pendingFiles = [];
      evidenceIssues = [];
      closePromptDrawer(root);
      update(resetState(), "reset-workspace");
      document.documentElement.lang = state.interfaceLocale;
      announce(t(state.interfaceLocale, "status.reset"));
    }
  }
});

root.querySelector("#lifecycleRail").addEventListener("click", event => {
  const stage = event.target.closest("[data-action='stage']");
  if (stage) requestStage(stage.dataset.stageId);
});

root.addEventListener("keydown", event => {
  if (!pendingTransition) return;
  if (event.key === "Escape") { event.preventDefault(); cancelConfirmation(); return; }
  if (event.key !== "Tab") return;
  const controls = [...root.querySelectorAll("#dialogRoot button")];
  if (!controls.length) return;
  const index = controls.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
  if (!event.shiftKey && (index === -1 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
});

document.documentElement.lang = state.interfaceLocale;
if (["127.0.0.1", "localhost"].includes(window.location.hostname)) {
  window.__TEST_ONLY__ = {
    loadSyntheticEvidence(text) {
      const source = createSourceRecord({ name: "synthetic-evidence.txt", size: text.length, type: "text/plain" }, text, []);
      update(replaceSources(state, renumberSources([...state.sources, source])), "test-load-evidence");
    },
  };
}
render();
