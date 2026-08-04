import {
  LIFECYCLE_STAGES,
  RESEARCH_TYPES,
  STANDARDS_REVIEWED_ON,
  getAdaptiveFieldIds,
  getStudyDesignOptions,
  resolveStandards,
  resolveStandardsForDesign,
} from "../catalog/index.js";
import { CITATION_STYLES, EXPERIENCE_LEVELS, RESEARCHER_ROLES, TARGET_OUTPUTS, getCompatibleTargetOutputs } from "../state.js";
import { getRequiredFieldIds } from "../validation.js";
import { t } from "../i18n.js";
import { renderEvidenceWorkspace } from "./evidence-workspace.js";

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

function option(value, label, selected, disabled = false) {
  return element("option", { value, textContent: label, selected, disabled });
}

function fieldControl(id, state, required, locale) {
  const wide = ["topic", "problemStatement", "researchQuestion", "existingInformation", "resourcesTimeline", "eligibilityCriteria", "informationSources"].includes(id);
  const label = element("label", { className: `field-control${wide ? " wide" : ""}`, dataset: { fieldId: id } });
  const text = element("span", { textContent: id === "population" && locale === "en" ? "Population and setting" : t(locale, `fields.${id}`) });
  if (required) text.append(element("span", { className: "required-marker", textContent: " *" }));
  const control = element(wide ? "textarea" : "input", { id: `field-${id}`, name: id, value: state.fields[id] ?? "", dataset: { fieldId: id }, required });
  if (wide) control.rows = 3;
  label.append(text, control);
  return label;
}

function controlLabel(label, control) {
  return element("label", { className: "control-label", textContent: label }, [control]);
}

function setupSelect(locale, labelKey, fieldId, value, values, optionKey, enabledValues = values) {
  const enabled = new Set(enabledValues);
  const control = element("select", { dataset: { action: "setup-field", setupField: fieldId } }, values.map(id => option(id, t(locale, `${optionKey}.${id}`), id === value, !enabled.has(id))));
  return controlLabel(t(locale, labelKey), control);
}

function setupText(locale, labelKey, fieldId, value) {
  return controlLabel(t(locale, labelKey), element("input", {
    type: "text",
    value,
    dataset: { action: "setup-field", setupField: fieldId },
  }));
}

function standardList(standards, locale) {
  return element("ul", { className: "summary-list" }, standards.map(standard => element("li", {}, [
    element("a", {
      href: standard.officialUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      textContent: standard.version,
      "aria-label": t(locale, "officialSource", { standard: standard.version }),
    }),
    element("small", { textContent: standard.name }),
  ])));
}

export function focusFirstBlockingIssue(preflight) {
  for (const issue of preflight.blocking) {
    const byId = issue.fieldId ? document.getElementById(issue.fieldId) : null;
    const byField = issue.fieldId
      ? document.querySelector(`[data-field-id="${issue.fieldId}"] input, [data-field-id="${issue.fieldId}"] textarea, [data-field-id="${issue.fieldId}"] select`)
      : null;
    const bySource = issue.sourceId ? document.querySelector(`[data-testid="source-${issue.sourceId}"]`) : null;
    const control = byId ?? byField ?? bySource;
    if (control && !control.disabled) {
      control.focus();
      return true;
    }
  }
  return false;
}

export function renderValidation(root, preflight, locale) {
  const summary = root.querySelector("[data-testid='validation-summary']");
  if (!summary) return;
  const blockers = preflight.blocking;
  const warnings = preflight.warnings;
  summary.replaceChildren(
    element("section", { dataset: { testid: "preflight-blockers" } }, [
      element("h3", { textContent: t(locale, "validationHeading") }),
      blockers.length ? element("ul", { className: "validation-list" }, blockers.map(issue => element("li", { textContent: t(locale, issue.messageKey) }))) : element("p", { className: "empty-note", textContent: t(locale, "noIssues") }),
    ]),
    element("section", { className: "validation-warnings", dataset: { testid: "preflight-warnings" } }, [
      element("h3", { textContent: t(locale, "warningsHeading") }),
      warnings.length ? element("ul", { className: "warning-list" }, warnings.map(issue => element("li", { textContent: t(locale, issue.messageKey) }))) : element("p", { className: "empty-note", textContent: "-" }),
    ])
  );
}

function readinessIcon(readiness) {
  return readiness === "ready" ? "vendor/icons/circle-check.svg" : "vendor/icons/triangle-alert.svg";
}

export function updateLifecycleReadiness(root, preflight, locale) {
  root.querySelectorAll("[data-action='stage']").forEach(button => {
    const readiness = preflight.readinessByStage[button.dataset.stageId] ?? "incomplete";
    const statusKey = `stage${readiness[0].toUpperCase()}${readiness.slice(1)}`;
    const stageLabel = t(locale, `stages.${button.dataset.stageId}`);
    const icon = button.querySelector("[data-stage-icon]");
    icon.src = readinessIcon(readiness);
    icon.className = `stage-icon ${readiness}`;
    button.querySelector("[data-stage-status]").textContent = t(locale, statusKey);
    button.setAttribute("aria-label", `${stageLabel}: ${t(locale, statusKey)}`);
  });
}

export function renderWorkspace(root, state, preflight) {
  const locale = state.interfaceLocale;
  root.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(locale, node.dataset.i18n); });
  root.querySelector("#interfaceLanguage").value = locale;
  const reset = root.querySelector("#resetButton");
  reset.setAttribute("aria-label", t(locale, "actions.reset"));
  reset.title = t(locale, "actions.reset");

  const researchType = element("select", { id: "researchType", dataset: { action: "research-type" } }, RESEARCH_TYPES.map(type => option(type.id, t(locale, `researchTypes.${type.id}`), type.id === state.researchTypeId)));
  const studyDesign = element("select", { dataset: { action: "study-design" } }, getStudyDesignOptions(state.researchTypeId).map(design => option(design.id, t(locale, `studyDesigns.${design.id}`), design.id === state.studyDesignId)));
  const evidenceMode = element("select", { dataset: { action: "evidence-mode" } }, ["planning", "uploaded", "web-research"].map(id => option(id, t(locale, `evidenceModes.${id}`), id === state.evidenceMode)));
  const outputLanguage = element("select", { dataset: { action: "output-language" } }, ["thai", "english", "bilingual"].map(id => option(id, t(locale, `outputLanguages.${id}`), id === state.outputLanguage)));
  const controls = [
    controlLabel(t(locale, "researchType"), researchType),
    controlLabel(t(locale, "studyDesign"), studyDesign),
    setupSelect(locale, "researcherRole", "researcherRole", state.researcherRole, RESEARCHER_ROLES, "researcherRoles"),
    setupSelect(locale, "experienceLevel", "experienceLevel", state.experienceLevel, EXPERIENCE_LEVELS, "experienceLevels"),
    setupText(locale, "scientificField", "scientificField", state.scientificField),
    setupText(locale, "institutionSetting", "institutionSetting", state.institutionSetting),
    setupSelect(locale, "targetOutput", "targetOutput", state.targetOutput, TARGET_OUTPUTS, "targetOutputs", getCompatibleTargetOutputs(state.stageId)),
    setupSelect(locale, "citationStyle", "citationStyle", state.citationStyle, CITATION_STYLES, "citationStyles"),
    controlLabel(t(locale, "evidenceMode"), evidenceMode),
    controlLabel(t(locale, "outputLanguage"), outputLanguage),
  ];
  root.querySelector("#setupBar").replaceChildren(element("div", { className: "panel-kicker", textContent: t(locale, "setup") }), element("div", { className: "setup-controls" }, controls));

  root.querySelector("#lifecycleRail").replaceChildren(
    element("div", { className: "rail-heading", textContent: t(locale, "lifecycle") }),
    ...LIFECYCLE_STAGES.map(stage => {
      const readiness = preflight.readinessByStage[stage.id] ?? "incomplete";
      const statusKey = `stage${readiness[0].toUpperCase()}${readiness.slice(1)}`;
      return element("button", {
      type: "button",
      className: `stage-button${stage.id === state.stageId ? " active" : ""}`,
      dataset: { action: "stage", stageId: stage.id },
      "aria-current": stage.id === state.stageId ? "step" : null,
      }, [
        element("img", { className: `stage-icon ${readiness}`, src: readinessIcon(readiness), alt: "", dataset: { stageIcon: "" } }),
        element("span", { className: "stage-label", textContent: t(locale, `stages.${stage.id}`) }),
        element("span", { className: "stage-status", textContent: t(locale, statusKey), dataset: { stageStatus: "" } }),
      ]);
    })
  );
  updateLifecycleReadiness(root, preflight, locale);

  const fieldIds = getAdaptiveFieldIds(state.researchTypeId, state.stageId, state.studyDesignId);
  const required = new Set(getRequiredFieldIds(state.researchTypeId, state.stageId));
  const form = element("form", { className: "adaptive-form", noValidate: true });
  fieldIds.forEach(id => form.append(fieldControl(id, state, required.has(id), locale)));
  const validationSummary = element("section", { className: "validation-summary", "aria-label": t(locale, "validationHeading"), dataset: { testid: "validation-summary" } });
  const generate = element("button", { type: "button", className: "primary-button", dataset: { action: "generate-prompt" }, textContent: t(locale, "actions.generate") });
  root.querySelector("#workspaceMain").replaceChildren(
    element("div", { className: "form-heading" }, [element("div", {}, [
      element("div", { className: "panel-kicker", textContent: t(locale, `stages.${state.stageId}`) }),
      element("h2", { textContent: t(locale, `researchTypes.${state.researchTypeId}`) }),
      element("p", { className: "form-description", textContent: t(locale, `stageTasks.${state.stageId}`) }),
    ])]),
    ...(state.evidenceMode === "uploaded" ? [element("div", { id: "evidenceWorkspaceRoot" })] : []),
    form,
    validationSummary,
    element("div", { className: "button-row prompt-action-row" }, [generate])
  );
  renderValidation(root, preflight, locale);
  if (state.evidenceMode === "uploaded") renderEvidenceWorkspace(root.querySelector("#evidenceWorkspaceRoot"), state);

  const applicable = resolveStandards(state.researchTypeId, state.stageId, state.studyDesignId);
  const typeStandards = resolveStandardsForDesign(state.researchTypeId, state.studyDesignId);
  root.querySelector("#standardsSummary").replaceChildren(
    element("section", { className: "summary-section" }, [
      element("h2", { textContent: t(locale, "standards") }),
      element("p", { className: "standards-review-date", textContent: t(locale, "standardsReviewed", { date: STANDARDS_REVIEWED_ON }) }),
      standardList(typeStandards, locale),
    ]),
    element("section", { className: "summary-section" }, [element("h2", { textContent: t(locale, "stageMatch") }), applicable.length ? standardList(applicable, locale) : element("p", { className: "empty-note", textContent: t(locale, "noStageStandard") })])
  );
  if (state.promptDrawer !== "open") root.querySelector("#promptDrawerRoot").replaceChildren(element("div", { className: "drawer-placeholder", textContent: t(locale, "promptPlaceholder") }));
}

export function renderConfirmation(root, labels, locale, kind = "transition") {
  const dialogRoot = root.querySelector("#dialogRoot");
  const cancel = element("button", { type: "button", className: "secondary-button", dataset: { action: "cancel-confirmation" }, textContent: t(locale, "cancel") });
  const clearingEvidence = labels.length === 0 && kind === "evidence-mode";
  const resetting = kind === "reset";
  const confirm = element("button", { type: "button", className: "primary-button", dataset: { action: "confirm-confirmation" }, textContent: clearingEvidence ? t(locale, "evidence.clearConfirm") : resetting ? t(locale, "resetConfirm") : t(locale, "confirm") });
  dialogRoot.replaceChildren(element("div", { className: "dialog-backdrop" }, [element("section", { className: "dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "confirmTitle" }, [
    element("h2", { id: "confirmTitle", textContent: clearingEvidence ? t(locale, "evidence.clearTitle") : resetting ? t(locale, "resetConfirmTitle") : t(locale, "confirmTitle") }),
    element("p", { textContent: clearingEvidence ? t(locale, "evidence.clearText") : resetting ? t(locale, "resetConfirmText") : t(locale, kind === "stage" ? "stageConfirmText" : "confirmText") }),
    ...(labels.length ? [element("ul", {}, labels.map(label => element("li", { textContent: label })))] : []),
    element("div", { className: "dialog-actions" }, [cancel, confirm]),
  ])]));
  cancel.focus();
}

export function clearConfirmation(root) { root.querySelector("#dialogRoot").replaceChildren(); }
