import { describe, expect, it } from "vitest";
import {
  createInitialState,
  createPublicWorkspaceState,
  replaceSources,
  resetState,
  TARGET_OUTPUTS,
  setEvidenceBudget,
  setEvidenceMode,
  setDeidentificationConfirmed,
  setField,
  setInterfaceLocale,
  setOutputLanguage,
  setPromptDrawer,
  setResearchType,
  setSetupField,
  setStage,
  setStudyDesign,
} from "../../src/state.js";

describe("state transitions", () => {
  it("offers the approved target outputs", () => {
    expect(TARGET_OUTPUTS).toEqual([
      "stage-appropriate-deliverable",
      "research-question",
      "literature-review-strategy",
      "evidence-synthesis",
      "research-gap-analysis",
      "hypotheses-propositions",
      "methodology-outline",
      "research-proposal",
    ]);
  });

  it("uses approved defaults", () => {
    expect(createInitialState()).toMatchObject({
      researchTypeId: "observational",
      stageId: "define-question",
      interfaceLocale: "th",
      evidenceMode: "planning",
      outputLanguage: "bilingual",
      studyDesignId: "cohort",
      researcherRole: "faculty-researcher",
      experienceLevel: "intermediate",
      scientificField: "",
      institutionSetting: "Thailand; medical university or teaching hospital",
      targetOutput: "stage-appropriate-deliverable",
      citationStyle: "Vancouver",
      evidenceBudget: 60000,
      deidentificationConfirmed: false,
      sources: [],
      promptDrawer: "closed",
    });
  });

  it("rejects former lifecycle identifiers", () => {
    expect(() => setStage(createInitialState(), "question")).toThrow(RangeError);
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
    const stageTransition = setStage(typeTransition.state, "outline-methodology");

    expect(typeTransition.state.fields.population).toBe("Adults in Bangkok");
    expect(stageTransition.fields.population).toBe("Adults in Bangkok");
  });

  it("preserves persistent setup across type and stage transitions", () => {
    let state = createInitialState();
    state = setSetupField(state, "researcherRole", "postgraduate-student");
    state = setSetupField(state, "experienceLevel", "advanced");
    state = setSetupField(state, "scientificField", "Neonatology");
    state = setSetupField(state, "institutionSetting", "Thailand, university teaching hospital");
    state = setSetupField(state, "targetOutput", "research-proposal");
    state = setSetupField(state, "citationStyle", "AMA");

    const nextType = setResearchType(state, "medical-education", true).state;
    const nextStage = setStage(nextType, "write-proposal");

    expect(nextStage).toMatchObject({
      researcherRole: "postgraduate-student",
      experienceLevel: "advanced",
      scientificField: "Neonatology",
      institutionSetting: "Thailand, university teaching hospital",
      targetOutput: "research-proposal",
      citationStyle: "AMA",
      studyDesignId: "education-observational",
    });
  });

  it("validates structured study-design and setup enum values", () => {
    const state = createInitialState();
    const externalValidation = setStudyDesign(
      setResearchType(state, "ai-health-data", true).state,
      "ai-imaging-external-validation"
    );

    expect(externalValidation.studyDesignId).toBe("ai-imaging-external-validation");
    expect(() => setStudyDesign(state, "scoping-review")).toThrow(RangeError);
    expect(() => setSetupField(state, "citationStyle", "Invented style")).toThrow(RangeError);
  });

  it("uses structural sharing for evidence text during unrelated updates", () => {
    const source = { id: "S1", text: "private evidence", warnings: [] };
    const withSources = replaceSources(createInitialState(), [source]);
    const afterField = setField(withSources, "topic", "New topic");
    const afterSetup = setSetupField(afterField, "scientificField", "Cardiology");

    expect(afterField.sources).toBe(withSources.sources);
    expect(afterField.sources[0]).toBe(withSources.sources[0]);
    expect(afterSetup.sources).toBe(afterField.sources);
  });

  it("publishes redacted source metadata without internal keys, files, or source text", () => {
    const file = { name: "private.txt" };
    const state = replaceSources(createInitialState(), [{
      _key: "internal-source-key",
      id: "S1",
      filename: "private.txt",
      type: "text/plain",
      size: 19,
      status: "ready",
      included: true,
      text: "private source text",
      file,
      warnings: [],
    }]);

    const publicState = createPublicWorkspaceState(state);

    expect(publicState.sources[0]).toEqual({
      id: "S1",
      filename: "private.txt",
      type: "text/plain",
      size: 19,
      status: "ready",
      included: true,
      warnings: [],
      error: "",
      extractedCharacters: 19,
    });
    expect(JSON.stringify(publicState)).not.toContain("private source text");
    expect(JSON.stringify(publicState)).not.toContain("internal-source-key");
    expect(publicState.sources[0]).not.toHaveProperty("file");
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
    const next = setStage(state, "literature-review");

    expect(next).not.toBe(state);
    expect(next.fields).not.toBe(state.fields);
    expect(next.stageId).toBe("literature-review");
    expect(next.fields).toEqual({ population: "Thai adults" });
    expect(state.stageId).toBe("define-question");
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
    expect(() => setSetupField(state, "researcherRole", "unknown-role")).toThrow(RangeError);
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
