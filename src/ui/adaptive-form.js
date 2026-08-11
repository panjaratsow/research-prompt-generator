import {
  NOT_SURE_OPTION_ID,
  OTHER_OPTION_ID,
  getInheritedContextFields,
  getStageFieldDefinitions,
} from "../catalog/index.js";
import {
  CITATION_STYLES,
  EXPERIENCE_LEVELS,
  RESEARCHER_ROLES,
} from "../state.js";
import {
  getFieldValue,
  getOtherText,
  getStaleOptionIds,
  hasMeaningfulValue,
} from "../field-values.js";
import { t } from "../i18n.js";
import { element, option } from "./dom.js";

const CONTEXT_FIELD_IDS = ["topic", "population", "researchQuestion", "primaryOutcome"];

function formContext(state) {
  return {
    researchTypeId: state.researchTypeId,
    studyDesignId: state.studyDesignId,
    stageId: state.stageId,
    evidenceMode: state.evidenceMode,
    fields: state.fields,
  };
}

function optionLabel(locale, optionId) {
  if (optionId === OTHER_OPTION_ID) return t(locale, "otherSpecify");
  if (optionId === NOT_SURE_OPTION_ID) return t(locale, "notSureRecommend");
  return t(locale, `options.${optionId}`);
}

function fieldLabel(field, locale, tag = "span") {
  const label = element(tag, { className: "field-label", textContent: t(locale, field.labelKey) });
  if (field.required || field.designCritical) {
    label.append(element("span", { className: "required-marker", textContent: " *", "aria-hidden": "true" }));
  }
  return label;
}

function fieldHelp(field, locale) {
  return element("small", {
    id: `field-${field.id}-help`,
    className: "field-help",
    textContent: t(locale, field.helpKey),
  });
}

function fieldClass(field, preflight) {
  const invalid = preflight?.blocking?.some(issue => issue.fieldId === field.id);
  return `field-control${invalid ? " invalid" : ""}`;
}

function renderOtherInput(field, state, locale) {
  const value = getFieldValue(state, field.id);
  const selected = (Array.isArray(value) ? value : [value]).includes(OTHER_OPTION_ID);
  if (!selected) return null;
  const id = `field-${field.id}-other-text`;
  return element("label", { className: "other-control", htmlFor: id }, [
    element("span", { textContent: t(locale, "otherSpecify") }),
    element("input", {
      id,
      name: `${field.id}-other`,
      type: "text",
      value: getOtherText(state, field.id),
      dataset: { fieldId: field.id, otherFor: field.id },
    }),
  ]);
}

function staleOptionNodes(field, state, locale, control) {
  return getStaleOptionIds(state, field, formContext(state)).map(optionId => {
    const label = t(locale, "previousChoice", { value: optionLabel(locale, optionId) });
    if (control === "select") return option(optionId, label, true, true);
    return { id: optionId, label, stale: true };
  });
}

function renderShortText(field, state, preflight, locale) {
  const id = `field-${field.id}`;
  return element("label", { className: fieldClass(field, preflight), htmlFor: id }, [
    fieldLabel(field, locale),
    element("input", {
      id,
      name: field.id,
      type: "text",
      value: getFieldValue(state, field.id) ?? "",
      required: Boolean(field.required),
      disabled: Boolean(field.readOnly),
      "aria-describedby": `field-${field.id}-help`,
      dataset: { fieldId: field.id },
    }),
    fieldHelp(field, locale),
  ]);
}

function renderSingleSelect(field, state, preflight, locale) {
  const id = `field-${field.id}`;
  const value = getFieldValue(state, field.id) ?? "";
  const stale = staleOptionNodes(field, state, locale, "select");
  const control = element("select", {
    id,
    name: field.id,
    required: Boolean(field.required),
    disabled: Boolean(field.readOnly),
    "aria-describedby": `field-${field.id}-help`,
    dataset: { fieldId: field.id },
  }, [
    option("", t(locale, "chooseOption"), !value, false),
    ...stale,
    ...field.options.map(item => option(item.id, optionLabel(locale, item.id), item.id === value)),
  ]);
  const other = renderOtherInput(field, state, locale);
  return element("div", { className: fieldClass(field, preflight) }, [
    element("label", { htmlFor: id }, [fieldLabel(field, locale)]),
    control,
    fieldHelp(field, locale),
    ...(other ? [other] : []),
  ]);
}

function renderChoiceGroup(field, state, preflight, locale, type) {
  const selected = new Set(Array.isArray(getFieldValue(state, field.id))
    ? getFieldValue(state, field.id)
    : [getFieldValue(state, field.id)].filter(Boolean));
  const choices = [
    ...staleOptionNodes(field, state, locale, type),
    ...field.options.map(item => ({ id: item.id, label: optionLabel(locale, item.id), stale: false })),
  ];
  const controls = choices.map(choice => {
    const id = `field-${field.id}-${choice.id}`;
    return element("label", { className: type === "radio" ? "segmented-option" : "checkbox-chip", htmlFor: id }, [
      element("input", {
        id,
        name: field.id,
        type,
        value: choice.id,
        checked: selected.has(choice.id),
        disabled: Boolean(field.readOnly || choice.stale),
        required: type === "radio" && Boolean(field.required),
        "aria-describedby": `field-${field.id}-help`,
        dataset: { fieldId: field.id },
      }),
      element("span", { textContent: choice.label }),
    ]);
  });
  const other = renderOtherInput(field, state, locale);
  const legend = fieldLabel(field, locale, "legend");
  const requiredGuidance = type === "checkbox" && field.required
    ? element("small", { id: `field-${field.id}-required`, className: "visually-hidden", textContent: t(locale, "requiredGroupGuidance") })
    : null;
  return element("fieldset", {
    className: `${fieldClass(field, preflight)} ${type === "radio" ? "segmented-field" : "checkbox-field"}`,
    "aria-describedby": `field-${field.id}-help${requiredGuidance ? ` field-${field.id}-required` : ""}`,
  }, [
    legend,
    fieldHelp(field, locale),
    ...(requiredGuidance ? [requiredGuidance] : []),
    element("div", { className: type === "radio" ? "segmented-control" : "checkbox-chips" }, controls),
    ...(other ? [other] : []),
  ]);
}

function renderCheckboxGroup(field, state, preflight, locale) {
  return renderChoiceGroup(field, state, preflight, locale, "checkbox");
}

function renderRadioGroup(field, state, preflight, locale) {
  return renderChoiceGroup(field, state, preflight, locale, "radio");
}

function renderToggle(field, state, preflight, locale) {
  const id = `field-${field.id}`;
  return element("div", { className: fieldClass(field, preflight) }, [
    element("label", { className: "check-control", htmlFor: id }, [
      element("input", {
        id,
        name: field.id,
        type: "checkbox",
        checked: getFieldValue(state, field.id) === "true",
        disabled: Boolean(field.readOnly),
        required: Boolean(field.required),
        "aria-describedby": `field-${field.id}-help`,
        dataset: { fieldId: field.id },
      }),
      fieldLabel(field, locale),
    ]),
    fieldHelp(field, locale),
  ]);
}

function renderDerivedText(field, state, preflight, locale) {
  const id = `field-${field.id}`;
  const draft = state.drafts?.[field.id] ?? { value: getFieldValue(state, field.id) ?? "", customized: false };
  return element("section", { className: `${fieldClass(field, preflight)} draft-field` }, [
    element("label", { htmlFor: id }, [fieldLabel(field, locale)]),
    element("textarea", {
      id,
      name: field.id,
      rows: 4,
      value: draft.value,
      required: Boolean(field.required || field.designCritical),
      "aria-describedby": `field-${field.id}-help field-${field.id}-status`,
      dataset: { fieldId: field.id, draftId: field.id },
    }),
    fieldHelp(field, locale),
    element("div", { className: "draft-meta" }, [
      element("span", {
        id: `field-${field.id}-status`,
        className: "draft-status",
        textContent: t(locale, draft.customized ? "customizedDraft" : "suggestedDraft"),
        dataset: { draftStatus: field.id },
        "aria-live": "polite",
      }),
      element("button", {
        type: "button",
        className: "secondary-button",
        hidden: !draft.customized,
        textContent: t(locale, "restoreSuggested"),
        dataset: { action: "restore-draft", restoreDraft: field.id },
      }),
    ]),
  ]);
}

const CONTROL_RENDERERS = {
  "short-text": renderShortText,
  "single-select": renderSingleSelect,
  "multi-select": renderCheckboxGroup,
  segmented: renderRadioGroup,
  toggle: renderToggle,
  "derived-text": renderDerivedText,
};

function renderField(field, state, preflight, locale) {
  const renderer = CONTROL_RENDERERS[field.control];
  if (!renderer) throw new RangeError(`Unsupported field control: ${field.control}`);
  return renderer(field, state, preflight, locale);
}

export function renderContextStrip(state, locale) {
  const inherited = new Set(getInheritedContextFields(formContext(state)).map(field => field.id));
  const items = CONTEXT_FIELD_IDS
    .filter(fieldId => inherited.has(fieldId) && hasMeaningfulValue(getFieldValue(state, fieldId)))
    .map(fieldId => {
      const label = t(locale, `fields.${fieldId}`);
      const value = getFieldValue(state, fieldId);
      return element("li", { className: "context-item", dataset: { contextField: fieldId } }, [
        element("span", { className: "context-copy" }, [
          element("strong", { textContent: label }),
          element("span", { textContent: value }),
        ]),
        element("button", {
          type: "button",
          className: "secondary-button context-edit",
          textContent: t(locale, "edit"),
          "aria-label": t(locale, "editField", { field: label }),
          dataset: { action: "edit-context", fieldId },
        }),
      ]);
    });
  if (!items.length) return element("div", { hidden: true, dataset: { testid: "context-strip" } });
  return element("section", { className: "context-strip", dataset: { testid: "context-strip" } }, [
    element("h3", { textContent: t(locale, "inheritedContext") }),
    element("div", { dataset: { testid: "inherited-context" } }, [element("ul", { className: "context-list" }, items)]),
  ]);
}

function setupSelect(locale, labelKey, fieldId, value, values, optionKey) {
  const id = `profile-${fieldId}`;
  return element("label", { className: "control-label", htmlFor: id }, [
    element("span", { textContent: t(locale, labelKey) }),
    element("select", {
      id,
      dataset: { action: "setup-field", setupField: fieldId },
    }, values.map(item => option(item, t(locale, `${optionKey}.${item}`), item === value))),
  ]);
}

function setupText(locale, labelKey, fieldId, value) {
  const id = `profile-${fieldId}`;
  return element("label", { className: "control-label", htmlFor: id }, [
    element("span", { textContent: t(locale, labelKey) }),
    element("input", {
      id,
      type: "text",
      value,
      dataset: { action: "setup-field", setupField: fieldId },
    }),
  ]);
}

export function renderResearchProfile(state, locale) {
  const regionId = "research-profile-controls";
  const open = Boolean(state.researchProfileOpen);
  const controls = open ? [
    setupSelect(locale, "researcherRole", "researcherRole", state.researcherRole, RESEARCHER_ROLES, "researcherRoles"),
    setupSelect(locale, "experienceLevel", "experienceLevel", state.experienceLevel, EXPERIENCE_LEVELS, "experienceLevels"),
    setupText(locale, "scientificField", "scientificField", state.scientificField),
    setupText(locale, "institutionSetting", "institutionSetting", state.institutionSetting),
    setupSelect(locale, "citationStyle", "citationStyle", state.citationStyle, CITATION_STYLES, "citationStyles"),
  ] : [];
  return element("section", { className: "research-profile" }, [
    element("button", {
      id: "toggle-research-profile",
      type: "button",
      className: "secondary-button disclosure-button",
      textContent: t(locale, "researchProfile"),
      "aria-controls": regionId,
      "aria-expanded": String(open),
      dataset: { action: "toggle-profile" },
    }),
    element("div", {
      id: regionId,
      className: "setup-controls profile-controls",
      hidden: !open,
    }, controls),
  ]);
}

function renderAdvancedDisclosure(fields, state, preflight, locale) {
  const regionId = `advanced-${state.stageId}`;
  const open = Boolean(state.advancedOpenByStage?.[state.stageId]);
  return element("section", { className: "advanced-disclosure" }, [
    element("button", {
      id: "toggle-advanced",
      type: "button",
      className: "secondary-button disclosure-button",
      textContent: t(locale, "advancedDetails"),
      "aria-controls": regionId,
      "aria-expanded": String(open),
      dataset: { action: "toggle-advanced" },
    }),
    element("div", {
      id: regionId,
      className: "advanced-fields",
      hidden: !open,
      dataset: { testid: "advanced-fields" },
    }, fields.map(field => renderField(field, state, preflight, locale))),
  ]);
}

export function renderAdaptiveForm(state, preflight, locale = state.interfaceLocale) {
  const definition = getStageFieldDefinitions(formContext(state));
  return element("form", { className: "adaptive-form", noValidate: true }, [
    renderContextStrip(state, locale),
    element("section", { className: "simple-fields", dataset: { testid: "simple-fields" } },
      definition.simple.map(field => renderField(field, state, preflight, locale))),
    renderDerivedText(definition.draft, state, preflight, locale),
    renderAdvancedDisclosure(definition.advanced, state, preflight, locale),
  ]);
}

export function findFieldControl(root, fieldId) {
  return [...root.querySelectorAll("[data-field-id]")]
    .find(control => control.dataset.fieldId === fieldId && !control.disabled) ?? null;
}
