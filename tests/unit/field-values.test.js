import { describe, expect, it } from "vitest";
import { getFieldDefinition } from "../../src/catalog/index.js";
import {
  getFieldValue,
  getOtherText,
  getStaleOptionIds,
  hasMeaningfulValue,
  isFieldComplete,
  normalizeFieldValue,
  serializeDisplayValue,
} from "../../src/field-values.js";
import { createInitialState, setField, setFieldCustomValue } from "../../src/state.js";

function contextFor(state) {
  return {
    researchTypeId: state.researchTypeId,
    studyDesignId: state.studyDesignId,
    stageId: state.stageId,
    evidenceMode: state.evidenceMode,
    fields: state.fields,
  };
}

describe("typed field values", () => {
  it("treats strings, arrays, Other text, and Not sure consistently", () => {
    let state = createInitialState();
    state = setField(state, "informationSources", ["medline", "other"]);
    expect(isFieldComplete(state, getFieldDefinition("informationSources"))).toBe(false);
    state = setFieldCustomValue(state, "informationSources", "ThaiJO");
    expect(isFieldComplete(state, getFieldDefinition("informationSources"))).toBe(true);
    state = setField(state, "synthesisMethod", "not-sure");
    expect(isFieldComplete(state, getFieldDefinition("synthesisMethod"))).toBe(true);
  });

  it("normalizes primitive values without losing user choice order", () => {
    const multi = getFieldDefinition("informationSources");
    const single = getFieldDefinition("synthesisMethod");

    expect(normalizeFieldValue(single, "  narrative  ")).toBe("narrative");
    expect(normalizeFieldValue(multi, [" embase ", "medline", "embase", "not-sure", "other"]))
      .toEqual(["not-sure"]);
    expect(() => normalizeFieldValue(single, { selected: "narrative" })).toThrow(TypeError);
    expect(() => normalizeFieldValue(multi, { selected: ["medline"] })).toThrow(TypeError);
    expect(hasMeaningfulValue([])).toBe(false);

    let state = setField(createInitialState(), "informationSources", ["other"]);
    expect(isFieldComplete(state, multi)).toBe(false);
    state = setFieldCustomValue(state, "informationSources", "  ThaiJO ");
    expect(getOtherText(state, "informationSources")).toBe("ThaiJO");
  });

  it("serializes deterministic localized labels instead of IDs", () => {
    let state = createInitialState();
    state = setField(state, "informationSources", ["embase", "medline", "other"]);
    state = setFieldCustomValue(state, "informationSources", "ThaiJO");
    expect(serializeDisplayValue(state, getFieldDefinition("informationSources"), "english"))
      .toBe("MEDLINE/PubMed; Embase; Other: ThaiJO");
  });

  it("reports stale option IDs instead of silently dropping them", () => {
    const state = setField(createInitialState(), "synthesisMethod", "invented-method");
    expect(getStaleOptionIds(state, getFieldDefinition("synthesisMethod"), contextFor(state)))
      .toEqual(["invented-method"]);
  });

  it("reads confirmedDesign directly from the selected design", () => {
    const state = createInitialState();
    expect(getFieldValue(state, "confirmedDesign")).toBe("cohort");
    expect(state.fields.confirmedDesign).toBeUndefined();
  });
});
