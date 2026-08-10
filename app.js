import {
  createInitialState, createPublicWorkspaceState, resetState, setDeidentificationConfirmed, setEvidenceMode, setField,
  restoreDraft, setAdvancedOpen, setDraftValue, setEvidenceBudget, setFieldCustomValue,
  setInterfaceLocale, setOutputLanguage, setPromptDrawer, setResearchProfileOpen, setResearchType,
  setSetupField, setStage, setStudyDesign, replaceSources,
} from "./src/state.js";
import { getFieldDefinition, resolveStandards } from "./src/catalog/index.js";
import { readFieldInputValue } from "./src/field-values.js";
import { buildPrompt, buildQualityChecklist } from "./src/prompt-engine.js";
import { validateState } from "./src/validation.js";
import { t } from "./src/i18n.js";
import { clearConfirmation, focusFirstBlockingIssue, renderConfirmation, renderValidation, renderWorkspace, updateLifecycleReadiness } from "./src/ui/render.js";
import { PARSER_DEPENDENCIES } from "./src/evidence/browser-adapters.js";
import { createSourceRecord, mergeSourceUpdates, renumberSources } from "./src/evidence/core.js";
import { ingestFiles, renderEvidenceWorkspace } from "./src/ui/evidence-workspace.js";
import { closePromptDrawer, copyPrompt, downloadPrompt, openPromptDrawer } from "./src/ui/prompt-drawer.js";
import { findFieldControl } from "./src/ui/adaptive-form.js";

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
function publish(action) { window.dispatchEvent(new CustomEvent("workspace:statechange", { detail: { action, state: createPublicWorkspaceState(state) } })); }
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
  const selector = transition.kind === "research-type" ? "#researchType" : transition.kind === "study-design" ? "[data-action=\"study-design\"]" : transition.kind === "evidence-mode" ? "[data-action=\"evidence-mode\"]" : transition.kind === "reset" ? "#resetButton" : `[data-action="stage"][data-stage-id="${transition.nextId}"]`;
  root.querySelector(selector)?.focus();
}

function beginConfirmation(kind, nextId, incompatible, analysis) {
  pendingTransition = { kind, nextId, incompatible, analysis };
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
  } else if (transition.kind === "research-type") next = setResearchType(state, transition.nextId, true, transition.analysis).state;
  else if (transition.kind === "study-design") next = setStudyDesign(state, transition.nextId, true, transition.analysis).state;
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
  root.querySelector('[data-action="evidence-mode"]')?.focus();
}

async function processEvidenceFiles() {
  if (evidenceProcessing || !state.deidentificationConfirmed || !pendingFiles.length) return;
  const generation = ++evidenceOperationGeneration;
  const files = [...pendingFiles];
  evidenceProcessing = true;
  root.querySelector("[data-action='evidence-process']").disabled = true;
  const isCurrent = () => evidenceProcessing && generation === evidenceOperationGeneration;
  try {
    const result = await ingestFiles(files, state, PARSER_DEPENDENCIES, (sourceUpdates, progress) => {
      if (isCurrent()) {
        const sources = progress.initial
          ? renumberSources([...state.sources, ...sourceUpdates.filter(update => !state.sources.some(source => source._key === update._key))])
          : mergeSourceUpdates(state.sources, sourceUpdates);
        update(replaceSources(state, sources), "evidence-progress");
        const extracting = state.sources.find(source => source.status === "extracting");
        if (extracting) announce(t(state.interfaceLocale, "status.extracting", { sourceId: extracting.id }));
      }
    });
    if (!isCurrent()) return;
    evidenceIssues = result.issues;
    pendingFiles = [];
    evidenceProcessing = false;
    update(state, "evidence-process");
    announce(t(state.interfaceLocale, "status.evidenceReady", {
      ready: state.sources.filter(source => source.status === "ready").length,
      error: state.sources.filter(source => ["error", "excluded"].includes(source.status)).length,
    }));
  } finally {
    if (generation === evidenceOperationGeneration && evidenceProcessing) {
      evidenceProcessing = false;
      render();
    }
  }
}

function requestStage(nextId) {
  update(setStage(state, nextId), "set-stage");
}

function refreshDynamicStatus() {
  const preflight = validateState(state);
  renderValidation(root, preflight, state.interfaceLocale);
  updateLifecycleReadiness(root, preflight, state.interfaceLocale);
}

function refreshDraftControls() {
  root.querySelectorAll("[data-draft-id]").forEach(control => {
    const draft = state.drafts?.[control.dataset.draftId];
    if (!draft) return;
    if (document.activeElement !== control && control.value !== draft.value) control.value = draft.value;
    const status = root.querySelector(`[data-draft-status="${control.dataset.draftId}"]`);
    if (status) status.textContent = t(state.interfaceLocale, draft.customized ? "customizedDraft" : "suggestedDraft");
    const restore = root.querySelector(`[data-action="restore-draft"][data-restore-draft="${control.dataset.draftId}"]`);
    if (restore) restore.hidden = !draft.customized;
  });
}

function refreshAfterTextInput() {
  refreshDraftControls();
  refreshDynamicStatus();
}

function readControlValue(target, field) {
  if (field.control === "multi-select") {
    const related = [...root.querySelectorAll("input[type='checkbox'][data-field-id]")]
      .filter(control => control.dataset.fieldId === field.id && !control.disabled);
    return readFieldInputValue(target, related);
  }
  if (field.control === "toggle") return String(target.checked);
  return target.value;
}

function updateStructuredField(target) {
  const field = getFieldDefinition(target.dataset.fieldId);
  if (!field) return;
  const next = setField(state, field.id, readControlValue(target, field));
  const choseOther = (Array.isArray(next.fields[field.id]) ? next.fields[field.id] : [next.fields[field.id]])
    .includes("other");
  update(next, "set-field");
  if (choseOther) root.querySelector(`[data-other-for="${field.id}"]`)?.focus();
  else {
    const matchingChoice = [...root.querySelectorAll("[data-field-id]")]
      .find(control => control.dataset.fieldId === field.id && control.value === target.value && !control.disabled);
    (matchingChoice ?? findFieldControl(root, field.id))?.focus();
  }
}

root.addEventListener("input", event => {
  const { target } = event;
  if (target.dataset.otherFor) {
    update(setFieldCustomValue(state, target.dataset.otherFor, target.value), "set-field-custom", false);
    refreshAfterTextInput();
    return;
  }
  if (target.dataset.draftId) {
    update(setDraftValue(state, target.dataset.draftId, target.value), "set-draft", false);
    refreshAfterTextInput();
    return;
  }
  const field = getFieldDefinition(target.dataset.fieldId);
  if (field?.control === "short-text") {
    update(setField(state, field.id, target.value), "set-field", false);
    refreshAfterTextInput();
    return;
  }
  const setupField = target.dataset.setupField;
  if (setupField && target.tagName !== "SELECT") {
    update(setSetupField(state, setupField, target.value), "set-setup-field", false);
  }
});

root.addEventListener("change", event => {
  const { target } = event;
  if (target.dataset.fieldId) {
    const field = getFieldDefinition(target.dataset.fieldId);
    if (!target.dataset.otherFor && field && !["short-text", "derived-text"].includes(field.control)) {
      updateStructuredField(target);
    } else publish("commit-field");
    return;
  }
  if (target.dataset.action === "setup-field") {
    const setupField = target.dataset.setupField;
    update(setSetupField(state, setupField, target.value), "set-setup-field", target.tagName === "SELECT");
    root.querySelector(`[data-setup-field="${setupField}"]`)?.focus();
    return;
  }
  if (target.id === "interfaceLanguage") {
    update(setInterfaceLocale(state, target.value), "set-interface-locale");
    document.documentElement.lang = state.interfaceLocale;
    root.querySelector("#interfaceLanguage")?.focus();
    return;
  }
  if (target.dataset.action === "evidence-mode") requestEvidenceMode(target.value);
  if (target.dataset.action === "output-language") {
    update(setOutputLanguage(state, target.value), "set-output-language");
    root.querySelector('[data-action="output-language"]')?.focus();
  }
  if (target.dataset.action === "study-design") {
    const transition = setStudyDesign(state, target.value);
    if (transition.needsConfirmation) beginConfirmation("study-design", target.value, transition.analysis.fieldIds, transition.analysis);
    else {
      update(transition.state, "set-study-design");
      root.querySelector('[data-action="study-design"]')?.focus();
    }
  }
  if (target.dataset.action === "deidentification") update(setDeidentificationConfirmed(state, target.checked), "set-deidentification");
  if (target.dataset.action === "research-type") {
    const transition = setResearchType(state, target.value);
    if (transition.needsConfirmation) beginConfirmation("research-type", target.value, transition.analysis.fieldIds, transition.analysis);
    else {
      update(transition.state, "set-research-type");
      root.querySelector("#researchType")?.focus();
    }
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
  const sources = state.sources.map(source => source._key === event.detail.sourceKey ? { ...source, included: event.detail.included } : source);
  update(replaceSources(state, sources), "evidence-toggle");
});
root.addEventListener("evidence:remove", event => {
  const sources = renumberSources(state.sources.filter(source => source._key !== event.detail.sourceKey));
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
  if (action === "toggle-advanced") {
    update(setAdvancedOpen(state, state.stageId, !state.advancedOpenByStage[state.stageId]), "toggle-advanced");
    root.querySelector('[data-action="toggle-advanced"]')?.focus();
  }
  if (action === "toggle-profile") {
    update(setResearchProfileOpen(state, !state.researchProfileOpen), "toggle-profile");
    root.querySelector('[data-action="toggle-profile"]')?.focus();
  }
  if (action === "restore-draft") {
    const draftId = trigger.dataset.restoreDraft;
    update(restoreDraft(state, draftId), "restore-draft");
    findFieldControl(root, draftId)?.focus();
  }
  if (action === "edit-context") {
    const fieldId = trigger.dataset.fieldId;
    update(setStage(state, "define-question"), "edit-context");
    findFieldControl(root, fieldId)?.focus();
  }
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
      standards: resolveStandards(state.researchTypeId, state.stageId, state.studyDesignId),
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
    sourceStorageMetadata() {
      return state.sources.map(source => ({
        id: source.id,
        status: source.status,
        hasFile: Object.prototype.hasOwnProperty.call(source, "file"),
      }));
    },
  };
}
render();
