import { describe, expect, it } from "vitest";
import { createInitialState, setField } from "../../src/state.js";
import {
  getRequiredFieldIds,
  validateState,
} from "../../src/validation.js";
import {
  calculateEvidenceBudget,
  escapeSourceText,
  estimateTokens,
} from "../../src/evidence/core.js";

function withFields(state, fields) {
  return Object.entries(fields).reduce(
    (next, [fieldId, value]) => setField(next, fieldId, value),
    state
  );
}

describe("preflight validation", () => {
  it("blocks an incomplete planning prompt", () => {
    const result = validateState(createInitialState());
    expect(result.blocking.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["missing-topic", "missing-question"])
    );
  });

  it("blocks uploaded mode without confirmation and a ready source", () => {
    const state = { ...createInitialState(), evidenceMode: "uploaded" };
    const result = validateState(state);
    expect(result.blocking.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["deidentification-unconfirmed", "uploaded-evidence-empty"])
    );
  });

  it("marks question stage ready when critical fields are present", () => {
    let state = setField(createInitialState(), "topic", "Postpartum haemorrhage");
    state = setField(state, "population", "Women giving birth in Thai referral hospitals");
    state = setField(state, "researchQuestion", "Which modifiable factors predict severe postpartum haemorrhage?");
    expect(validateState(state).readinessByStage.question).toBe("ready");
  });

  it("marks every stage blocked for invalid type, stage, and uploaded global blockers", () => {
    const state = withFields(createInitialState(), {
      topic: "Postpartum haemorrhage",
      population: "Women giving birth in Thai referral hospitals",
      researchQuestion: "Which modifiable factors predict severe postpartum haemorrhage?",
    });
    const invalidType = validateState({ ...state, researchTypeId: "unknown" });
    const invalidStage = validateState({ ...state, stageId: "unknown" });
    const uploaded = validateState({ ...state, evidenceMode: "uploaded" });

    for (const result of [invalidType, invalidStage, uploaded]) {
      expect(Object.values(result.readinessByStage)).not.toContain("ready");
      expect(Object.values(result.readinessByStage)).toContain("blocked");
    }
  });

  it("returns a metadata-only issue for a selected ready source without text", () => {
    const state = withFields(
      {
        ...createInitialState(),
        evidenceMode: "uploaded",
        deidentificationConfirmed: true,
        sources: [{ id: "S1", included: true, status: "ready" }],
      },
      {
        topic: "Postpartum haemorrhage",
        population: "Women giving birth in Thai referral hospitals",
        researchQuestion: "Which modifiable factors predict severe postpartum haemorrhage?",
      }
    );

    const result = validateState(state);

    expect(result.blocking).toContainEqual(expect.objectContaining({
      code: "selected-source-empty",
      sourceId: "S1",
    }));
    expect(calculateEvidenceBudget(state.sources, state.evidenceBudget)).toMatchObject({
      selectedChars: 0,
      estimatedTokens: 0,
      exceeded: false,
    });
  });

  it("defines required fields for every lifecycle stage", () => {
    expect(getRequiredFieldIds("observational", "question")).toEqual(["topic", "population", "researchQuestion"]);
    expect(getRequiredFieldIds("observational", "evidence")).toContain("informationSources");
    expect(getRequiredFieldIds("observational", "protocol")).toContain("resourcesTimeline");
    expect(getRequiredFieldIds("observational", "ethics-governance")).toContain("existingInformation");
    expect(getRequiredFieldIds("observational", "analysis-plan")).toContain("primaryOutcome");
    expect(getRequiredFieldIds("observational", "proposal")).toContain("problemStatement");
    expect(getRequiredFieldIds("observational", "conduct-quality")).toContain("existingInformation");
    expect(getRequiredFieldIds("observational", "analysis-interpretation")).toContain("existingInformation");
    expect(getRequiredFieldIds("observational", "reporting")).toContain("existingInformation");
    expect(getRequiredFieldIds("observational", "dissemination-impact")).toContain("resourcesTimeline");
  });

  it("adds design-specific requirements for diagnostic, prediction, qualitative, review, and AI work", () => {
    expect(getRequiredFieldIds("diagnostic", "question")).toEqual(expect.arrayContaining(["targetCondition", "indexTest", "referenceStandard"]));
    expect(getRequiredFieldIds("prediction", "question")).toEqual(expect.arrayContaining(["predictors", "developmentDataset", "validationDataset"]));
    expect(getRequiredFieldIds("qualitative-mixed", "question")).toEqual(expect.arrayContaining(["sample", "phenomenon", "reflexivity"]));
    expect(getRequiredFieldIds("evidence-review", "question")).toEqual(expect.arrayContaining(["reviewType", "reviewQuestion", "synthesisMethod"]));
    expect(getRequiredFieldIds("ai-health-data", "question")).toEqual(expect.arrayContaining(["intendedUse", "datasetProvenance", "modelInputs", "performanceMeasures"]));
  });

  it("adds context-specific readiness warnings without document text", () => {
    const state = withFields(
      { ...createInitialState(), researchTypeId: "prediction", stageId: "protocol" },
      {
        topic: "Risk model",
        problemStatement: "Clinical risk stratification is inconsistent",
        population: "Adults in Thai referral hospitals",
        researchQuestion: "Can predictors estimate cardiovascular risk?",
        primaryOutcome: "One-year cardiovascular event",
        resourcesTimeline: "12 months",
        predictors: "Age and blood pressure",
        endpointTiming: "One year",
        developmentDataset: "Registry A",
        validationDataset: "Registry B",
      }
    );
    const result = validateState(state);

    expect(result.warnings.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["missing-registration", "missing-ethics", "missing-data-sharing", "missing-external-validation"])
    );
    expect(JSON.stringify(result)).not.toContain("Clinical risk stratification is inconsistent");
  });
});

describe("shared evidence helpers", () => {
  it("counts only selected ready evidence and exceeds the budget strictly", () => {
    const sources = [
      { id: "S1", included: true, status: "ready", text: "abcd" },
      { id: "S2", included: false, status: "ready", text: "ignored" },
      { id: "S3", included: true, status: "error", text: "ignored" },
    ];

    expect(calculateEvidenceBudget(sources, 4)).toEqual({
      selectedChars: 4,
      estimatedTokens: 1,
      exceeded: false,
    });
    expect(calculateEvidenceBudget(sources, 3).exceeded).toBe(true);
    expect(estimateTokens(5)).toBe(2);
  });

  it("escapes source delimiters exactly", () => {
    expect(escapeSourceText("<SOURCE id=\"S1\">text</SOURCE>")).toBe(
      "&lt;SOURCE id=\"S1\">text&lt;/SOURCE&gt;"
    );
  });

  it("escapes case and whitespace variants of SOURCE-like tags", () => {
    const sourceText = '<SoUrCe id="S1">open</source >close< / SOURCE data="x">';

    expect(escapeSourceText(sourceText)).toBe(
      '&lt;SoUrCe id="S1">open&lt;/source &gt;close&lt; / SOURCE data="x"&gt;'
    );
    expect(escapeSourceText(sourceText)).not.toMatch(/<\s*\/?\s*source\b/i);
  });
});
