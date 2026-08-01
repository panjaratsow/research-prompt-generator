import { describe, expect, it } from "vitest";
import {
  createInitialState,
  replaceSources,
  resetState,
  setEvidenceBudget,
  setEvidenceMode,
  setDeidentificationConfirmed,
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

  it("does not mutate input state when confirming deidentification", () => {
    const state = createInitialState();
    const next = setDeidentificationConfirmed(state, true);

    expect(next).not.toBe(state);
    expect(next.deidentificationConfirmed).toBe(true);
    expect(state.deidentificationConfirmed).toBe(false);
  });

  it("leaves original fields unchanged when setting a field", () => {
    const state = { ...createInitialState(), fields: { topic: "Original topic" } };
    const next = setField(state, "researchQuestion", "What is the effect?");

    expect(next).not.toBe(state);
    expect(next.fields).not.toBe(state.fields);
    expect(next.fields).toEqual({
      topic: "Original topic",
      researchQuestion: "What is the effect?",
    });
    expect(state.fields).toEqual({ topic: "Original topic" });
  });

  it("leaves stage input unchanged while filtering incompatible fields", () => {
    const state = {
      ...createInitialState(),
      fields: { population: "Thai adults", problemStatement: "Delayed diagnosis" },
    };
    const next = setStage(state, "evidence");

    expect(next).not.toBe(state);
    expect(next.fields).not.toBe(state.fields);
    expect(next.stageId).toBe("evidence");
    expect(next.fields).toEqual({ population: "Thai adults" });
    expect(state.stageId).toBe("question");
    expect(state.fields).toEqual({
      population: "Thai adults",
      problemStatement: "Delayed diagnosis",
    });
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
