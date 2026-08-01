import { LIFECYCLE_STAGES, RESEARCH_TYPES, STANDARDS, getAdaptiveFieldIds, resolveStandards } from "../catalog/index.js";
import { getRequiredFieldIds } from "../validation.js";
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

function option(value, label, selected) {
  return element("option", { value, textContent: label, selected });
}

function fieldControl(id, state, required, locale) {
  const wide = ["topic", "problemStatement", "researchQuestion", "existingInformation", "resourcesTimeline", "eligibilityCriteria", "informationSources"].includes(id);
  const label = element("label", { className: `field-control${wide ? " wide" : ""}`, dataset: { fieldId: id } });
  const text = element("span", { textContent: t(locale, `fields.${id}`) });
  if (required) text.append(element("span", { className: "required-marker", textContent: " *" }));
  const control = element(wide ? "textarea" : "input", { id: `field-${id}`, name: id, value: state.fields[id] ?? "", dataset: { fieldId: id }, required });
  if (wide) control.rows = 3;
  label.append(text, control);
  return label;
}

function controlLabel(label, control) {
  return element("label", { className: "control-label", textContent: label }, [control]);
}

export function focusFirstBlockingIssue(preflight) {
  const issue = preflight.blocking.find(item => item.fieldId);
  const control = issue && document.querySelector(`[data-field-id="${issue.fieldId}"] input, [data-field-id="${issue.fieldId}"] textarea, [data-field-id="${issue.fieldId}"] select`);
  control?.focus();
  return Boolean(control);
}

export function renderValidation(root, preflight, locale) {
  const summary = root.querySelector("[data-testid='validation-summary']");
  if (!summary) return;
  const issues = preflight.blocking;
  summary.replaceChildren(
    element("h3", { textContent: t(locale, "validationHeading") }),
    issues.length ? element("ul", { className: "validation-list" }, issues.map(issue => element("li", { textContent: t(locale, issue.messageKey) }))) : element("p", { className: "empty-note", textContent: t(locale, "noIssues") })
  );
}

export function renderWorkspace(root, state, preflight) {
  const locale = state.interfaceLocale;
  root.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(locale, node.dataset.i18n); });
  root.querySelector("#interfaceLanguage").value = locale;
  const reset = root.querySelector("#resetButton");
  reset.setAttribute("aria-label", t(locale, "actions.reset"));
  reset.title = t(locale, "actions.reset");

  const researchType = element("select", { id: "researchType", dataset: { action: "research-type" } }, RESEARCH_TYPES.map(type => option(type.id, t(locale, `researchTypes.${type.id}`), type.id === state.researchTypeId)));
  const evidenceMode = element("select", { dataset: { action: "evidence-mode" } }, ["planning", "uploaded", "web-research"].map(id => option(id, t(locale, `evidenceModes.${id}`), id === state.evidenceMode)));
  const outputLanguage = element("select", { dataset: { action: "output-language" } }, ["thai", "english", "bilingual"].map(id => option(id, t(locale, `outputLanguages.${id}`), id === state.outputLanguage)));
  const controls = [controlLabel(t(locale, "researchType"), researchType), controlLabel(t(locale, "evidenceMode"), evidenceMode), controlLabel(t(locale, "outputLanguage"), outputLanguage)];
  if (state.evidenceMode === "uploaded") {
    const deidentified = element("input", { type: "checkbox", checked: state.deidentificationConfirmed, dataset: { action: "deidentification" } });
    controls.push(element("label", { className: "check-control" }, [deidentified, document.createTextNode(t(locale, "fields.deidentificationConfirmed"))]));
  }
  root.querySelector("#setupBar").replaceChildren(element("div", { className: "panel-kicker", textContent: t(locale, "setup") }), element("div", { className: "setup-controls" }, controls));

  root.querySelector("#lifecycleRail").replaceChildren(
    element("div", { className: "rail-heading", textContent: t(locale, "lifecycle") }),
    ...LIFECYCLE_STAGES.map(stage => element("button", {
      type: "button",
      className: `stage-button${stage.id === state.stageId ? " active" : ""}`,
      dataset: { action: "stage", stageId: stage.id },
      "aria-current": stage.id === state.stageId ? "step" : null,
    }, [element("span", { className: `stage-dot ${preflight.readinessByStage[stage.id]}` }), element("span", { className: "stage-label", textContent: t(locale, `stages.${stage.id}`) })]))
  );

  const fieldIds = getAdaptiveFieldIds(state.researchTypeId, state.stageId);
  const required = new Set(getRequiredFieldIds(state.researchTypeId, state.stageId));
  const form = element("form", { className: "adaptive-form", noValidate: true });
  fieldIds.forEach(id => form.append(fieldControl(id, state, required.has(id), locale)));
  const validationSummary = element("section", { className: "validation-summary", "aria-label": t(locale, "validationHeading"), dataset: { testid: "validation-summary" } });
  root.querySelector("#workspaceMain").replaceChildren(
    element("div", { className: "form-heading" }, [element("div", {}, [
      element("div", { className: "panel-kicker", textContent: t(locale, `stages.${state.stageId}`) }),
      element("h2", { textContent: t(locale, `researchTypes.${state.researchTypeId}`) }),
      element("p", { className: "form-description", textContent: t(locale, `stageTasks.${state.stageId}`) }),
    ])]),
    form,
    validationSummary
  );
  renderValidation(root, preflight, locale);

  const applicable = resolveStandards(state.researchTypeId, state.stageId);
  const typeStandards = STANDARDS.filter(standard => standard.researchTypes.includes(state.researchTypeId));
  root.querySelector("#standardsSummary").replaceChildren(
    element("section", { className: "summary-section" }, [element("h2", { textContent: t(locale, "standards") }), element("ul", { className: "summary-list" }, typeStandards.map(standard => element("li", { textContent: standard.version }, [element("small", { textContent: standard.name })]))) ]),
    element("section", { className: "summary-section" }, [element("h2", { textContent: t(locale, "stageMatch") }), applicable.length ? element("ul", { className: "summary-list" }, applicable.map(standard => element("li", { textContent: standard.version }))) : element("p", { className: "empty-note", textContent: t(locale, "noStageStandard") })])
  );
  root.querySelector("#promptDrawerRoot").replaceChildren(element("div", { className: "drawer-placeholder", textContent: t(locale, "promptPlaceholder") }));
}

export function renderConfirmation(root, labels, locale) {
  const dialogRoot = root.querySelector("#dialogRoot");
  const cancel = element("button", { type: "button", className: "secondary-button", dataset: { action: "cancel-confirmation" }, textContent: t(locale, "cancel") });
  const confirm = element("button", { type: "button", className: "primary-button", dataset: { action: "confirm-confirmation" }, textContent: t(locale, "confirm") });
  dialogRoot.replaceChildren(element("div", { className: "dialog-backdrop" }, [element("section", { className: "dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "confirmTitle" }, [
    element("h2", { id: "confirmTitle", textContent: t(locale, "confirmTitle") }),
    element("p", { textContent: t(locale, "confirmText") }),
    element("ul", {}, labels.map(label => element("li", { textContent: label }))),
    element("div", { className: "dialog-actions" }, [cancel, confirm]),
  ])]));
  cancel.focus();
}

export function clearConfirmation(root) { root.querySelector("#dialogRoot").replaceChildren(); }
