import { describe, expect, it } from "vitest";
import {
  createInitialState,
  createPublicWorkspaceState,
  replaceSources,
  resetState,
  TARGET_OUTPUT_STAGES,
  TARGET_OUTPUTS,
  setEvidenceBudget,
  setEvidenceMode,
  setDeidentificationConfirmed,
  setField,
  setInterfaceLocale,
  setOutputLanguage,
  setPromptDrawer,
  setResearchType,
  setAdvancedOpen,
  setFieldCustomValue,
  setResearchProfileOpen,
  setSetupField,
  setStage,
  setStudyDesign,
  setTargetOutput,
} from "../../src/state.js";
import { STAGE_IDS } from "../../src/catalog/index.js";

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

  it("maps every explicit target output to its lifecycle stage", () => {
    for (const [targetOutput, stageId] of Object.entries(TARGET_OUTPUT_STAGES)) {
      expect(setTargetOutput(createInitialState(), targetOutput)).toMatchObject({ targetOutput, stageId });
    }
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
      fieldCustomValues: {},
      drafts: expect.any(Object),
      advancedOpenByStage: expect.any(Object),
      researchProfileOpen: false,
      sources: [],
      promptDrawer: "closed",
    });
  });

  it("rejects former lifecycle identifiers", () => {
    expect(() => setStage(createInitialState(), "question")).toThrow(RangeError);
  });

  it("requires confirmation before clearing incompatible fields and options", () => {
    let state = setField(createInitialState(), "exposure", "Diabetes");
    state = setField(state, "informationSources", ["registry-data", "other"]);
    state = setFieldCustomValue(state, "informationSources", "ThaiJO");
    state = setField(state, "sampleSizePlan", "Use 200 records");
    state = setAdvancedOpen(state, "outline-methodology", true);
    const pending = setResearchType(state, "qualitative-mixed", false);
    expect(pending.needsConfirmation).toBe(true);
    expect(pending.analysis.fieldIds).toEqual(expect.arrayContaining(["exposure"]));
    expect(pending.analysis.optionIdsByField).toMatchObject({ informationSources: ["registry-data"] });
    expect(pending.incompatible).toBe(pending.analysis.fieldIds);
    expect(pending.state.fieldCustomValues.informationSources).toBe("ThaiJO");
    expect(pending.state.fields.sampleSizePlan).toBe("Use 200 records");

    const confirmed = setResearchType(state, "qualitative-mixed", true, pending.analysis);
    expect(confirmed.needsConfirmation).toBe(false);
    expect(confirmed.state.fields.exposure).toBeUndefined();
    expect(confirmed.state.fields.informationSources).toEqual(["other"]);
    expect(confirmed.state.fieldCustomValues.informationSources).toBe("ThaiJO");
    expect(confirmed.state.fields.sampleSizePlan).toBe("Use 200 records");
  });

  it("does not confirm a research-type transition for touched then cleared fields", () => {
    const cleared = setField(createInitialState(), "exposure", "  \t ");
    const transition = setResearchType(cleared, "qualitative-mixed", false);

    expect(transition.needsConfirmation).toBe(false);
    expect(transition.analysis.fieldIds).toEqual([]);
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
    state = setStage(state, "write-proposal");
    state = setSetupField(state, "targetOutput", "research-proposal");
    state = setSetupField(state, "citationStyle", "AMA");

    const nextType = setResearchType(state, "medical-education", true).state;
    const nextStage = setStage(nextType, "write-proposal");

    expect(nextStage).toMatchObject({
      researcherRole: "postgraduate-student",
      experienceLevel: "advanced",
      scientificField: "Neonatology",
      institutionSetting: "Thailand, university teaching hospital",
      targetOutput: "stage-appropriate-deliverable",
      citationStyle: "AMA",
      studyDesignId: "education-observational",
    });
  });

  it("validates structured study-design and setup enum values", () => {
    const state = createInitialState();
    const externalValidation = setStudyDesign(
      setResearchType(state, "ai-health-data", true).state,
      "ai-imaging-external-validation", true
    ).state;

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

  it("carries canonical and completed stage products through all seven stages", () => {
    let state = createInitialState();
    state = setField(state, "topic", "Cardiac remodelling");
    state = setField(state, "researchQuestion", "What is the association?");
    state = setField(state, "searchStrategy", "Search MEDLINE and Embase");
    for (const stageId of STAGE_IDS) state = setStage(state, stageId);
    expect(state.fields).toMatchObject({
      topic: "Cardiac remodelling",
      researchQuestion: "What is the association?",
      searchStrategy: "Search MEDLINE and Embase",
    });
  });

  it("keeps disclosures independent from experience and field values", () => {
    const initial = createInitialState();
    const open = setAdvancedOpen(initial, "synthesize-information", true);
    const closed = setAdvancedOpen(open, "synthesize-information", false);
    const profile = setResearchProfileOpen(closed, true);
    expect(initial.advancedOpenByStage["synthesize-information"]).toBe(false);
    expect(closed.fields).toBe(open.fields);
    expect(closed.drafts).toBe(open.drafts);
    expect(profile.researchProfileOpen).toBe(true);
    expect(profile.experienceLevel).toBe(closed.experienceLevel);
  });

  it("leaves stage input unchanged while carrying fields forward", () => {
    const state = {
      ...createInitialState(),
      fields: { population: "Thai adults", problemStatement: "Delayed diagnosis" },
    };
    const next = setStage(state, "literature-review");

    expect(next).not.toBe(state);
    expect(next.fields).toBe(state.fields);
    expect(next.stageId).toBe("literature-review");
    expect(next.fields).toEqual({ population: "Thai adults", problemStatement: "Delayed diagnosis" });
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
