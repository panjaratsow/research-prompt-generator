import {
  createInitialState, resetState, setDeidentificationConfirmed, setEvidenceMode, setField,
  setEvidenceBudget, setInterfaceLocale, setOutputLanguage, setResearchType, setStage, replaceSources,
} from "./src/state.js";
import { getAdaptiveFieldIds } from "./src/catalog/index.js";
import { validateState } from "./src/validation.js";
import { t } from "./src/i18n.js";
import { clearConfirmation, renderConfirmation, renderValidation, renderWorkspace, updateLifecycleReadiness } from "./src/ui/render.js";
import { PARSER_DEPENDENCIES } from "./src/evidence/browser-adapters.js";
import { createSourceRecord, renumberSources } from "./src/evidence/core.js";
import { ingestFiles, renderEvidenceWorkspace } from "./src/ui/evidence-workspace.js";

const root = document;
let state = createInitialState();
let pendingTransition = null;
let pendingFiles = [];
let evidenceIssues = [];

function announce(message) { root.querySelector("#appStatus").textContent = message; }
function render() {
  renderWorkspace(root, state, validateState(state));
  if (state.evidenceMode === "uploaded") {
    renderEvidenceWorkspace(root.querySelector("#evidenceWorkspaceRoot"), state, { pendingFiles, issues: evidenceIssues });
  }
}
function publish(action) { window.dispatchEvent(new CustomEvent("workspace:statechange", { detail: { action, state: structuredClone(state) } })); }
function update(next, action, shouldRender = true) { state = next; if (shouldRender) render(); publish(action); }
function restoreTrigger(transition) {
  const selector = transition.kind === "research-type" ? "#researchType" : transition.kind === "evidence-mode" ? "[data-action=\"evidence-mode\"]" : `[data-action="stage"][data-stage-id="${transition.nextId}"]`;
  root.querySelector(selector)?.focus();
}

function beginConfirmation(kind, nextId, incompatible) {
  pendingTransition = { kind, nextId, incompatible };
  renderConfirmation(root, incompatible.map(id => t(state.interfaceLocale, `fields.${id}`)), state.interfaceLocale);
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
  if (transition.kind === "research-type") next = setResearchType(state, transition.nextId, true).state;
  else if (transition.kind === "evidence-mode") next = setDeidentificationConfirmed(replaceSources(setEvidenceMode(state, transition.nextId), []), false);
  else next = setStage(state, transition.nextId);
  if (transition.kind === "evidence-mode") { pendingFiles = []; evidenceIssues = []; }
  pendingTransition = null;
  clearConfirmation(root);
  update(next, `confirm-${transition.kind}`);
}

function requestEvidenceMode(nextMode) {
  if (state.evidenceMode === "uploaded" && nextMode !== "uploaded" && state.sources.length) {
    beginConfirmation("evidence-mode", nextMode, []);
    return;
  }
  pendingFiles = nextMode === "uploaded" ? pendingFiles : [];
  evidenceIssues = [];
  update(setEvidenceMode(state, nextMode), "set-evidence-mode");
}

async function processEvidenceFiles() {
  if (!state.deidentificationConfirmed || !pendingFiles.length) return;
  const result = await ingestFiles(pendingFiles, state, PARSER_DEPENDENCIES, sources => {
    update(replaceSources(state, sources), "evidence-progress");
  });
  evidenceIssues = result.issues;
  pendingFiles = result.issues.length ? pendingFiles : [];
  update(replaceSources(state, result.sources), "evidence-process");
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
  pendingFiles = event.detail.files;
  evidenceIssues = [];
  render();
});
root.addEventListener("evidence:confirm-deidentified", event => update(setDeidentificationConfirmed(state, event.detail.confirmed), "set-deidentification"));
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

root.addEventListener("click", event => {
  const trigger = event.target.closest("[data-action]");
  const action = trigger?.dataset.action;
  if (action === "cancel-confirmation") cancelConfirmation();
  if (action === "confirm-confirmation") confirmTransition();
  if (event.target.closest("#resetButton")) {
    pendingTransition = null;
    pendingFiles = [];
    evidenceIssues = [];
    clearConfirmation(root);
    update(resetState(), "reset-workspace");
    document.documentElement.lang = state.interfaceLocale;
    announce(t(state.interfaceLocale, "status.reset"));
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
