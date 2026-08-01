import {
  createInitialState, resetState, setEvidenceMode, setField, setInterfaceLocale,
  setOutputLanguage, setResearchType, setStage,
} from "./src/state.js";
import { validateState } from "./src/validation.js";
import { t } from "./src/i18n.js";
import { clearConfirmation, renderConfirmation, renderWorkspace } from "./src/ui/render.js";

const root = document;
let state = createInitialState();
let pendingResearchType = null;

function announce(message) { root.querySelector("#appStatus").textContent = message; }
function render() { renderWorkspace(root, state, validateState(state)); }
function publish(action) { window.dispatchEvent(new CustomEvent("workspace:statechange", { detail: { action, state: structuredClone(state) } })); }
function update(next, action) { state = next; render(); publish(action); }

root.addEventListener("input", event => {
  const fieldId = event.target.dataset.fieldId;
  if (fieldId) update(setField(state, fieldId, event.target.value), "set-field");
});

root.addEventListener("change", event => {
  if (event.target.id === "interfaceLanguage") {
    update(setInterfaceLocale(state, event.target.value), "set-interface-locale");
    document.documentElement.lang = event.target.value;
    return;
  }
  if (event.target.dataset.action === "evidence-mode") update(setEvidenceMode(state, event.target.value), "set-evidence-mode");
  if (event.target.dataset.action === "output-language") update(setOutputLanguage(state, event.target.value), "set-output-language");
  if (event.target.dataset.action === "research-type") {
    const transition = setResearchType(state, event.target.value);
    if (transition.needsConfirmation) {
      pendingResearchType = event.target.value;
      renderConfirmation(root, transition.incompatible.map(id => t(state.interfaceLocale, `fields.${id}`)), state.interfaceLocale);
      root.querySelector("[data-action='cancel-type-change']").focus();
    } else update(transition.state, "set-research-type");
  }
});

root.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "stage") update(setStage(state, event.target.closest("[data-action]").dataset.stageId), "set-stage");
  if (action === "cancel-type-change") { pendingResearchType = null; clearConfirmation(root); render(); announce(t(state.interfaceLocale, "cancel")); }
  if (action === "confirm-type-change" && pendingResearchType) {
    update(setResearchType(state, pendingResearchType, true).state, "confirm-research-type");
    pendingResearchType = null;
    clearConfirmation(root);
  }
  if (event.target.closest("#resetButton")) { pendingResearchType = null; clearConfirmation(root); update(resetState(), "reset-workspace"); announce("Workspace reset."); }
});

render();
