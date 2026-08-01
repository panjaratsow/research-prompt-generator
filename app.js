import {
  createInitialState, resetState, setDeidentificationConfirmed, setEvidenceMode, setField,
  setInterfaceLocale, setOutputLanguage, setResearchType, setStage,
} from "./src/state.js";
import { getAdaptiveFieldIds } from "./src/catalog/index.js";
import { validateState } from "./src/validation.js";
import { t } from "./src/i18n.js";
import { clearConfirmation, renderConfirmation, renderValidation, renderWorkspace } from "./src/ui/render.js";

const root = document;
let state = createInitialState();
let pendingTransition = null;

function announce(message) { root.querySelector("#appStatus").textContent = message; }
function render() { renderWorkspace(root, state, validateState(state)); }
function publish(action) { window.dispatchEvent(new CustomEvent("workspace:statechange", { detail: { action, state: structuredClone(state) } })); }
function update(next, action, shouldRender = true) { state = next; if (shouldRender) render(); publish(action); }
function restoreTrigger(transition) { const selector = transition.kind === "research-type" ? "#researchType" : `[data-action="stage"][data-stage-id="${transition.nextId}"]`; root.querySelector(selector)?.focus(); }

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
  const next = transition.kind === "research-type" ? setResearchType(state, transition.nextId, true).state : setStage(state, transition.nextId);
  pendingTransition = null;
  clearConfirmation(root);
  update(next, `confirm-${transition.kind}`);
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
    renderValidation(root, validateState(state), state.interfaceLocale);
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
  if (target.dataset.action === "evidence-mode") update(setEvidenceMode(state, target.value), "set-evidence-mode");
  if (target.dataset.action === "output-language") update(setOutputLanguage(state, target.value), "set-output-language");
  if (target.dataset.action === "deidentification") update(setDeidentificationConfirmed(state, target.checked), "set-deidentification");
  if (target.dataset.action === "research-type") {
    const transition = setResearchType(state, target.value);
    if (transition.needsConfirmation) beginConfirmation("research-type", target.value, transition.incompatible);
    else update(transition.state, "set-research-type");
  }
});

root.addEventListener("click", event => {
  const trigger = event.target.closest("[data-action]");
  const action = trigger?.dataset.action;
  if (action === "cancel-confirmation") cancelConfirmation();
  if (action === "confirm-confirmation") confirmTransition();
  if (event.target.closest("#resetButton")) {
    pendingTransition = null;
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
render();
