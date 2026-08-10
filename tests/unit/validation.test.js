import { describe, expect, it } from "vitest";
import { createInitialState, setField } from "../../src/state.js";
import { LIFECYCLE_STAGES, getStageFieldDefinitions } from "../../src/catalog/index.js";
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

function completeDefineQuestionState() {
  return withFields(createInitialState(), {
    topic: "Cardiac remodelling",
    population: "Adults with heart failure",
    questionType: "prognosis",
    primaryOutcome: "Hospital admission",
  });
}

describe("preflight validation", () => {
  it("blocks an incomplete planning prompt", () => {
    const result = validateState(createInitialState());
    expect(result.blocking.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["missing-topic", "missing-questionType", "missing-primaryOutcome"])
    );
  });

  it("blocks uploaded mode without confirmation and a ready source", () => {
    const state = { ...createInitialState(), evidenceMode: "uploaded" };
    const result = validateState(state);
    expect(result.blocking.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["deidentification-unconfirmed", "uploaded-evidence-empty"])
    );
  });

  it("reports actionable readiness for required simple fields", () => {
    const empty = validateState(createInitialState()).readinessByStage["define-question"];
    expect(empty).toEqual({
      status: "not-started",
      remaining: 4,
      missingFieldIds: ["topic", "population", "questionType", "primaryOutcome"],
      reasonCode: "",
    });

    const partialState = setField(createInitialState(), "topic", "Cardiac remodelling");
    expect(validateState(partialState).readinessByStage["define-question"]).toMatchObject({
      status: "remaining",
      remaining: 3,
    });

    const notSureState = setField(partialState, "questionType", "not-sure");
    expect(validateState(notSureState).readinessByStage["define-question"].missingFieldIds)
      .not.toContain("questionType");
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
      expect(Object.values(result.readinessByStage).map(readiness => readiness.status))
        .not.toContain("ready");
      expect(Object.values(result.readinessByStage).map(readiness => readiness.status))
        .toContain("blocked");
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

  it("reads required field IDs from the stage catalogue", () => {
    expect(getRequiredFieldIds("observational", "define-question", "cohort", "planning", {}))
      .toEqual(["topic", "population", "questionType", "primaryOutcome"]);
    expect(getRequiredFieldIds("observational", "literature-review", "cohort", "planning", {}))
      .toEqual(["informationSources", "dateCoverage", "evidenceTypes", "searchConcepts"]);
    expect(getRequiredFieldIds("observational", "outline-methodology", "cohort", "planning", {}))
      .toEqual(["confirmedDesign", "dataSourceRecruitment", "samplingApproach", "analysisFamily", "feasibilityPeriod"]);
  });

  it("routes contextual methodology and proposal issues to active compact fields", () => {
    const methodologyState = { ...createInitialState(), stageId: "outline-methodology" };
    const methodology = validateState(methodologyState);
    const activeMethodologyIds = getStageFieldDefinitions(methodologyState)
      .simple.concat(getStageFieldDefinitions(methodologyState).advanced)
      .map(field => field.id);

    expect(Object.keys(methodology.readinessByStage)).toEqual(LIFECYCLE_STAGES.map(stage => stage.id));
    expect(methodology.blocking).toContainEqual(expect.objectContaining({
      code: "missing-feasibility", fieldId: "feasibilityPeriod",
    }));
    expect(methodology.warnings).toContainEqual(expect.objectContaining({
      code: "missing-ethics", fieldId: "ethicsGovernance",
    }));
    expect(activeMethodologyIds).toEqual(expect.arrayContaining(["feasibilityPeriod", "ethicsGovernance"]));
    expect(methodology.warnings.map(issue => issue.code)).not.toEqual(expect.arrayContaining([
      "missing-registration", "missing-data-sharing", "missing-external-validation",
    ]));

    const proposalState = {
      ...createInitialState(),
      researchTypeId: "prediction",
      studyDesignId: "prediction-external-validation",
      stageId: "write-proposal",
    };
    const proposal = validateState(proposalState);
    const activeProposalIds = getStageFieldDefinitions(proposalState)
      .simple.concat(getStageFieldDefinitions(proposalState).advanced)
      .map(field => field.id);

    expect(proposal.blocking).toContainEqual(expect.objectContaining({
      code: "missing-feasibility", fieldId: "proposalTimeline",
    }));
    expect(proposal.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing-registration", fieldId: "registration" }),
      expect.objectContaining({ code: "missing-data-sharing", fieldId: "dataSharingPlan" }),
      expect.objectContaining({ code: "missing-ethics", fieldId: "detailedGovernance" }),
    ]));
    expect(activeProposalIds).toEqual(expect.arrayContaining([
      "proposalTimeline", "registration", "dataSharingPlan", "detailedGovernance",
    ]));
    expect(validateState({ ...createInitialState(), researchTypeId: "evidence-review", studyDesignId: "systematic-review", stageId: "literature-review" }).warnings)
      .not.toContainEqual(expect.objectContaining({ code: "missing-registration" }));
  });

  it("keeps Other incomplete until its custom text is supplied", () => {
    const state = setField(createInitialState(), "questionType", "other");
    const result = validateState(state);

    expect(result.readinessByStage["define-question"].missingFieldIds).toContain("questionType");
    expect(result.blocking).toContainEqual(expect.objectContaining({
      code: "missing-questionType",
      fieldId: "questionType",
      messageKey: "validation.validationOtherRequired",
    }));
  });

  it("reports stale options and draft composition failures without user values", () => {
    const staleValue = "obsolete-question-type";
    const state = {
      ...createInitialState(),
      fields: { questionType: staleValue },
      drafts: {
        ...createInitialState().drafts,
        researchQuestion: { suggested: "", value: "", customized: false, error: "composition-failed" },
      },
    };
    const result = validateState(state);

    expect(result.blocking).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "stale-field-option", fieldId: "questionType" }),
      expect.objectContaining({ code: "draft-composition-failed", fieldId: "researchQuestion" }),
    ]));
    expect(JSON.stringify(result)).not.toContain(staleValue);
  });

  it("counts a stale required option as one remaining decision", () => {
    const complete = completeDefineQuestionState();
    const state = {
      ...complete,
      fields: { ...complete.fields, questionType: "obsolete-question-type" },
    };
    const result = validateState(state);

    expect(result.readinessByStage["define-question"]).toEqual({
      status: "remaining",
      remaining: 1,
      missingFieldIds: ["questionType"],
      reasonCode: "",
    });
    expect(result.blocking).toContainEqual(expect.objectContaining({
      code: "stale-field-option",
      fieldId: "questionType",
    }));
  });

  it("counts a current design-critical draft error as one remaining decision", () => {
    const complete = completeDefineQuestionState();
    const state = {
      ...complete,
      drafts: {
        ...complete.drafts,
        researchQuestion: { ...complete.drafts.researchQuestion, error: "composition-failed" },
      },
    };
    const result = validateState(state);

    expect(result.readinessByStage["define-question"]).toEqual({
      status: "remaining",
      remaining: 1,
      missingFieldIds: ["researchQuestion"],
      reasonCode: "",
    });
    expect(result.blocking).toContainEqual(expect.objectContaining({
      code: "draft-composition-failed",
      fieldId: "researchQuestion",
    }));
  });

  it("counts a field only once when it is both incomplete and stale", () => {
    const complete = completeDefineQuestionState();
    const state = {
      ...complete,
      fields: { ...complete.fields, questionType: ["other", "obsolete-question-type"] },
    };

    expect(validateState(state).readinessByStage["define-question"]).toEqual({
      status: "remaining",
      remaining: 1,
      missingFieldIds: ["questionType"],
      reasonCode: "",
    });
  });

  it("warns for omitted Advanced fields without blocking ordinary readiness", () => {
    const state = completeDefineQuestionState();
    const result = validateState(state);

    expect(result.readinessByStage["define-question"].status).toBe("ready");
    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: "missing-problemStatement",
      fieldId: "problemStatement",
    }));
    expect(result.blocking).not.toContainEqual(expect.objectContaining({ fieldId: "problemStatement" }));
  });

  it("uses the first uploaded global blocker as the readiness reason", () => {
    const readiness = validateState({ ...createInitialState(), evidenceMode: "uploaded" })
      .readinessByStage["define-question"];

    expect(readiness).toMatchObject({
      status: "blocked",
      reasonCode: "deidentification-unconfirmed",
    });
  });

  it("removes contextual issues when their compact controls are completed", () => {
    const methodology = withFields(
      { ...createInitialState(), stageId: "outline-methodology" },
      { feasibilityPeriod: "13-24-months", ethicsGovernance: "Institutional review will be sought before recruitment." }
    );
    const proposal = withFields(
      { ...createInitialState(), researchTypeId: "prediction", studyDesignId: "prediction-external-validation", stageId: "write-proposal" },
      {
        proposalTimeline: "24-months",
        registration: "Register prospectively before enrolment.",
        dataSharingPlan: "Use controlled access with a data-use agreement.",
        detailedGovernance: "Document ethics, data protection, and oversight responsibilities.",
      }
    );

    for (const state of [methodology, proposal]) {
      const result = validateState(state);
      const issues = [...result.blocking, ...result.warnings];
      expect(issues.map(issue => issue.code)).not.toEqual(expect.arrayContaining([
        "missing-feasibility", "missing-registration", "missing-ethics", "missing-data-sharing",
      ]));
    }
  });

  it("maps upload and budget blockers to focusable evidence controls", () => {
    const emptyUpload = validateState({ ...createInitialState(), evidenceMode: "uploaded" });
    const overBudget = validateState({
      ...createInitialState(),
      evidenceMode: "uploaded",
      deidentificationConfirmed: true,
      evidenceBudget: 25000,
      sources: [{ id: "S1", included: true, status: "ready", text: "x".repeat(25001) }],
    });

    expect(emptyUpload.blocking).toContainEqual(expect.objectContaining({
      code: "deidentification-unconfirmed", fieldId: "evidenceDeidentified",
    }));
    expect(emptyUpload.blocking).toContainEqual(expect.objectContaining({
      code: "uploaded-evidence-empty", fieldId: "evidenceInput",
    }));
    expect(overBudget.blocking).toContainEqual(expect.objectContaining({
      code: "evidence-budget-exceeded", fieldId: "evidenceBudget",
    }));
  });

  it("blocks selected evidence beyond the configured budget", () => {
    const state = {
      ...createInitialState(),
      evidenceMode: "uploaded",
      deidentificationConfirmed: true,
      evidenceBudget: 25000,
      sources: [{ id: "S1", included: true, status: "ready", text: "x".repeat(25001) }],
    };

    expect(validateState(state).blocking).toContainEqual(expect.objectContaining({
      code: "evidence-budget-exceeded",
    }));
  });

  it("warns for per-source identifier hints without including document content", () => {
    const identifier = "patient@example.org";
    const state = {
      ...createInitialState(),
      sources: [{ id: "S1", included: true, status: "ready", text: identifier, identifierHints: ["email"] }],
    };

    const result = validateState(state);

    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: "source-identifier-hint",
      sourceId: "S1",
    }));
    expect(JSON.stringify(result)).not.toContain(identifier);
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
