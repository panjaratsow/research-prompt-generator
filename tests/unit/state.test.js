import { describe, expect, it } from "vitest";
import {
  createInitialState,
  replaceSources,
  resetState,
  setEvidenceBudget,
  setEvidenceMode,
  setField,
  setInterfaceLocale,
  setOutputLanguage,
  setPromptDrawer,
  setResearchType,
  setStage,
} from "../../src/state.js";

describe("state transitions", () => {
  it("uses approved defaults", () => {
    expect(createInitialState()).toMatchObject({
      researchTypeId: "observational",
      stageId: "question",
      interfaceLocale: "th",
      evidenceMode: "planning",
      outputLanguage: "bilingual",
      evidenceBudget: 60000,
      deidentificationConfirmed: false,
      sources: [],
      promptDrawer: "closed",
    });
  });

  it("requires confirmation before clearing incompatible fields", () => {
    const withExposure = setField(createInitialState(), "exposure", "Diabetes");
    const pending = setResearchType(withExposure, "qualitative-mixed", false);
    expect(pending.needsConfirmation).toBe(true);
    expect(pending.state.fields.exposure).toBe("Diabetes");

    const confirmed = setResearchType(withExposure, "qualitative-mixed", true);
    expect(confirmed.needsConfirmation).toBe(false);
    expect(confirmed.state.fields.exposure).toBeUndefined();
  });

  it("preserves compatible fields across research-type and stage transitions", () => {
    const state = setField(createInitialState(), "population", "Adults in Bangkok");
    const typeTransition = setResearchType(state, "randomized-trial", true);
    const stageTransition = setStage(typeTransition.state, "protocol");

    expect(typeTransition.state.fields.population).toBe("Adults in Bangkok");
    expect(stageTransition.fields.population).toBe("Adults in Bangkok");
  });

  it("rejects unknown enum values", () => {
    const state = createInitialState();

    expect(() => setResearchType(state, "unknown", true)).toThrow(RangeError);
    expect(() => setStage(state, "unknown")).toThrow(RangeError);
    expect(() => setInterfaceLocale(state, "fr")).toThrow(RangeError);
    expect(() => setEvidenceMode(state, "offline")).toThrow(RangeError);
    expect(() => setOutputLanguage(state, "latin")).toThrow(RangeError);
    expect(() => setEvidenceBudget(state, 100)).toThrow(RangeError);
    expect(() => setPromptDrawer(state, "minimized")).toThrow(RangeError);
  });

  it("creates and resets independent state containers", () => {
    const initial = createInitialState();
    const reset = resetState();
    const source = { id: "S1", warnings: [] };
    const withSources = replaceSources(initial, [source]);

    expect(reset).not.toBe(initial);
    expect(reset.fields).not.toBe(initial.fields);
    expect(reset.sources).not.toBe(initial.sources);
    expect(withSources).not.toBe(initial);
    expect(withSources.sources).not.toBe(initial.sources);
    expect(withSources.sources[0]).not.toBe(source);
    source.warnings.push("changed externally");
    expect(withSources.sources[0].warnings).toEqual([]);
  });
});
