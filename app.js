import {
  createInitialState, createPublicWorkspaceState, resetState, setDeidentificationConfirmed, setEvidenceMode, setField,
  restoreDraft, setAdvancedOpen, setDraftValue, setEvidenceBudget, setFieldCustomValue,
  setInterfaceLocale, setOutputLanguage, setPromptDrawer, setResearchProfileOpen, setResearchType,
  analyzeContextTransition, setSetupField, setStage, setStudyDesign, setTargetOutput, replaceSources,
} from "./src/state.js";
import { getFieldDefinition, getResearchType, resolveStandards } from "./src/catalog/index.js";
import { readFieldInputValue } from "./src/field-values.js";
import { buildPrompt, buildQualityChecklist } from "./src/prompt-engine.js";
import { validateState } from "./src/validation.js";
import { t } from "./src/i18n.js";
import { clearConfirmation, confirmationKindKey, focusFirstBlockingIssue, renderConfirmation, renderValidation, renderWorkspace, resolveIssueControl, updateLifecycleReadiness } from "./src/ui/render.js";
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
function captureFocus() {
  const active = document.activeElement;
  return active?.id ? {
    id: active.id,
    start: typeof active.selectionStart === "number" ? active.selectionStart : null,
    end: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
  } : null;
}

function restoreFocus(snapshot) {
  const control = snapshot ? document.getElementById(snapshot.id) : null;
  control?.focus();
  if (control && snapshot.start != null && typeof control.setSelectionRange === "function") {
    control.setSelectionRange(snapshot.start, snapshot.end);
  }
}

function update(next, action, shouldRender = true, focusSnapshot = null) {
  state = next;
  if (shouldRender) {
    render();
    restoreFocus(focusSnapshot);
  }
  publish(action);
}
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
function restoreTrigger(transition) { root.querySelector(transition.restoreSelector)?.focus(); }

function focusValidationIssue(issue) {
  const resolution = resolveIssueControl(root, issue);
  if (!resolution) return false;
  if (resolution.advanced) {
    update(setAdvancedOpen(state, state.stageId, true), "focus-validation-issue");
    const revealed = resolveIssueControl(root, issue);
    revealed?.control.focus();
    return Boolean(revealed);
  }
  resolution.control.focus();
  return true;
}

function affectedFieldIds(analysis) {
  return [...new Set([...analysis.fieldIds, ...Object.keys(analysis.optionIdsByField ?? {})])];
}

function beginConfirmation({ kind, nextId = "", nextContext = null, analysis = { fieldIds: [], optionIdsByField: {} }, restoreSelector, fieldId, replacementValue }) {
  pendingTransition = { kind, nextId, nextContext, analysis, restoreSelector, fieldId, replacementValue };
  renderConfirmation(root, affectedFieldIds(analysis).map(id => t(state.interfaceLocale, `fields.${id}`)), state.interfaceLocale, kind);
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
  else if (transition.kind === "other") {
    next = setField(state, transition.fieldId, transition.replacementValue);
    next = { ...next, fieldCustomValues: Object.fromEntries(Object.entries(next.fieldCustomValues).filter(([id]) => id !== transition.fieldId)) };
  }
  else if (transition.kind === "evidence-mode") {
    cancelEvidenceProcessing();
    const transitioned = setEvidenceMode(state, transition.nextId, true, transition.analysis).state;
    next = setDeidentificationConfirmed(replaceSources(transitioned, []), false);
  }
  else if (transition.kind === "target-output") next = setTargetOutput(state, transition.nextId);
  else next = setStage(state, transition.nextId);
  if (transition.kind === "evidence-mode") { pendingFiles = []; evidenceIssues = []; }
  pendingTransition = null;
  clearConfirmation(root);
  update(next, `confirm-${transition.kind}`);
  if (transition.kind !== "reset") restoreTrigger(transition);
  if (transition.kind === "reset") {
    document.documentElement.lang = state.interfaceLocale;
    announce(t(state.interfaceLocale, "status.reset"));
  } else {
    announce(t(state.interfaceLocale, `status.transition.${confirmationKindKey(transition.kind)}`));
  }
}

function requestEvidenceMode(nextMode) {
  const transition = setEvidenceMode(state, nextMode);
  const leavingUploaded = state.evidenceMode === "uploaded" && nextMode !== "uploaded";
  if (transition.needsConfirmation || (leavingUploaded && state.sources.length)) {
    beginConfirmation({
      kind: "evidence-mode",
      nextId: nextMode,
      nextContext: { evidenceMode: nextMode },
      analysis: transition.analysis,
      restoreSelector: "#evidenceMode",
    });
    return;
  }
  if (leavingUploaded) cancelEvidenceProcessing();
  pendingFiles = nextMode === "uploaded" ? pendingFiles : [];
  evidenceIssues = [];
  const next = state.evidenceMode === nextMode
    ? transition.state
    : setDeidentificationConfirmed(transition.state, false);
  update(next, "set-evidence-mode");
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

function requestStage(nextId, restoreSelector = `[data-action="stage"][data-stage-id="${nextId}"]`) {
  const nextContext = { stageId: nextId };
  const analysis = analyzeContextTransition(state, nextContext);
  if (affectedFieldIds(analysis).length) {
    beginConfirmation({ kind: "stage", nextId, nextContext, analysis, restoreSelector });
    return;
  }
  update(setStage(state, nextId), "set-stage", true, captureFocus());
  root.querySelector(restoreSelector)?.focus();
}

function requestTargetOutput(nextId) {
  const next = setTargetOutput(state, nextId);
  const nextContext = { stageId: next.stageId, targetOutput: nextId };
  const analysis = analyzeContextTransition(state, nextContext);
  if (affectedFieldIds(analysis).length) {
    beginConfirmation({ kind: "target-output", nextId, nextContext, analysis, restoreSelector: "#setup-targetOutput" });
    return;
  }
  update(next, "set-target-output", true, captureFocus());
  root.querySelector("#setup-targetOutput")?.focus();
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
  const selectedBefore = state.fields?.[field.id];
  const hadOther = (Array.isArray(selectedBefore) ? selectedBefore : [selectedBefore]).includes("other");
  const choseOther = (Array.isArray(next.fields[field.id]) ? next.fields[field.id] : [next.fields[field.id]])
    .includes("other");
  const focusSnapshot = captureFocus();
  if (hadOther && !choseOther && state.fieldCustomValues?.[field.id]?.trim()) {
    beginConfirmation({
      kind: "other",
      fieldId: field.id,
      replacementValue: next.fields[field.id],
      nextContext: { fieldId: field.id, value: next.fields[field.id] },
      restoreSelector: target.id ? `#${target.id}` : `[data-field-id="${field.id}"]`,
      analysis: { fieldIds: [field.id], optionIdsByField: {} },
    });
    return;
  }
  update(next, "set-field", true, focusSnapshot);
  if (choseOther) root.querySelector(`[data-other-for="${field.id}"]`)?.focus();
}

function handleDelegatedInteraction(event) {
  const { target } = event;
  if (event.type === "input") {
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
    return;
  }

  if (event.type === "change") {
  if (target.dataset.fieldId) {
    const field = getFieldDefinition(target.dataset.fieldId);
    if (!target.dataset.otherFor && field && !["short-text", "derived-text"].includes(field.control)) {
      updateStructuredField(target);
    } else publish("commit-field");
    return;
  }
  if (target.dataset.action === "setup-field" && target.tagName === "SELECT") {
    const setupField = target.dataset.setupField;
    if (setupField === "targetOutput") requestTargetOutput(target.value);
    else {
      update(setSetupField(state, setupField, target.value), "set-setup-field", target.tagName === "SELECT", captureFocus());
      root.querySelector(`[data-setup-field="${setupField}"]`)?.focus();
    }
    return;
  }
  if (target.id === "interfaceLanguage") {
    update(setInterfaceLocale(state, target.value), "set-interface-locale", true, captureFocus());
    document.documentElement.lang = state.interfaceLocale;
    root.querySelector("#interfaceLanguage")?.focus();
    return;
  }
  if (target.dataset.action === "evidence-mode") { requestEvidenceMode(target.value); return; }
  if (target.dataset.action === "output-language") {
    update(setOutputLanguage(state, target.value), "set-output-language", true, captureFocus());
    root.querySelector("#outputLanguage")?.focus();
    return;
  }
  if (target.dataset.action === "study-design") {
    const transition = setStudyDesign(state, target.value);
    if (transition.needsConfirmation) beginConfirmation({
      kind: "study-design", nextId: target.value, nextContext: { studyDesignId: target.value }, analysis: transition.analysis, restoreSelector: "#studyDesign",
    });
    else {
      update(transition.state, "set-study-design", true, captureFocus());
    }
    return;
  }
  if (target.dataset.action === "deidentification") { update(setDeidentificationConfirmed(state, target.checked), "set-deidentification"); return; }
  if (target.dataset.action === "research-type") {
    const transition = setResearchType(state, target.value);
    if (transition.needsConfirmation) beginConfirmation({
      kind: "research-type", nextId: target.value,
      nextContext: { researchTypeId: target.value, studyDesignId: getResearchType(target.value).defaultStudyDesignId },
      analysis: transition.analysis, restoreSelector: "#researchType",
    });
    else {
      update(transition.state, "set-research-type", true, captureFocus());
    }
    return;
  }
  }

  if (event.type !== "click") return;
  const trigger = target.closest("[data-action]");
  const action = trigger?.dataset.action;
  if (action === "toggle-advanced") {
    update(setAdvancedOpen(state, state.stageId, trigger.getAttribute("aria-expanded") !== "true"), "toggle-advanced", true, { id: trigger.id, start: null, end: null });
    return;
  }
  if (action === "toggle-profile") {
    update(setResearchProfileOpen(state, !state.researchProfileOpen), "toggle-profile", true, { id: trigger.id, start: null, end: null });
    return;
  }
  if (action === "restore-draft") {
    const draftId = trigger.dataset.restoreDraft;
    update(restoreDraft(state, draftId), "restore-draft");
    findFieldControl(root, draftId)?.focus();
    return;
  }
  if (action === "edit-context") {
    const field = getFieldDefinition(trigger.dataset.fieldId);
    const sourceStage = field?.placements?.[0]?.stageId ?? "define-question";
    update(setStage(state, sourceStage), "edit-context");
    findFieldControl(root, field.id)?.focus();
    return;
  }
  if (action === "cancel-confirmation") { cancelConfirmation(); return; }
  if (action === "confirm-confirmation") { confirmTransition(); return; }
  if (action === "focus-validation-issue") {
    const preflight = validateState(state);
    const issue = [...preflight.blocking, ...preflight.warnings]
      .find(candidate => candidate.code === trigger.dataset.issueCode && candidate.fieldId === trigger.dataset.fieldId);
    if (issue) focusValidationIssue(issue);
    return;
  }
  if (action === "stage") { requestStage(trigger.dataset.stageId); return; }
  if (action === "generate-prompt") {
    const preflight = validateState(state);
    if (preflight.blocking.length) {
      focusFirstBlockingIssue(root, preflight, focusValidationIssue);
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
    return;
  }
  if (target.closest("#resetButton")) {
    if (Object.keys(state.fields).length || state.sources.length) beginConfirmation({ kind: "reset", restoreSelector: "#resetButton" });
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
}

root.addEventListener("input", handleDelegatedInteraction);
root.addEventListener("change", handleDelegatedInteraction);
root.addEventListener("click", handleDelegatedInteraction);

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
    setFieldValue(fieldId, value) {
      update(setField(state, fieldId, value), "test-set-field");
    },
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
