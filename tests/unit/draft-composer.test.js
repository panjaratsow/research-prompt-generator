import { describe, expect, it } from "vitest";
import { composeSuggestedDraft } from "../../src/draft-composer.js";
import {
  createInitialState,
  restoreDraft,
  setDraftValue,
  setField,
  setInterfaceLocale,
  syncDrafts,
} from "../../src/state.js";

function completeStructuredState() {
  return {
    ...createInitialState(),
    interfaceLocale: "en",
    fields: {
      topic: "Cardiac remodelling",
      population: "Children with craniopharyngioma",
      researchQuestion: "Does hypothalamic obesity increase cardiac remodelling?",
      questionType: "association",
      primaryOutcome: "Left-ventricular mass index",
      informationSources: ["medline", "embase"],
      dateCoverage: "last-10-years",
      evidenceTypes: ["observational-studies"],
      searchConcepts: "craniopharyngioma, obesity, cardiac remodelling",
      evidencePattern: "not-yet-assessed",
      synthesisMethod: "narrative",
      evidenceCertainty: "not-yet-assessed",
      mainLimitations: ["sparse-evidence"],
      gapType: "population",
      gapEvidenceSupport: "not-yet-verified",
      gapContext: "pediatric tertiary care",
      gapPriority: "high",
      hypothesisApproach: "directional",
      interventionOrExposure: "hypothalamic obesity",
      hypothesisOutcome: "cardiac remodelling",
      expectedDirection: "increase",
      dataSourceRecruitment: "prospective-recruitment",
      samplingApproach: "consecutive",
      analysisFamily: "regression",
      feasibilityPeriod: "13-24-months",
      proposalType: "grant-proposal",
      targetAudience: "funding-panel",
      requiredSections: ["background", "objectives", "methods", "analysis", "ethics-governance"],
      proposalTimeline: "24-months",
    },
  };
}

describe("deterministic draft composition", () => {
  const cases = [
    ["researchQuestion", "Draft a focused association question"],
    ["searchStrategy", "Build a reproducible literature search"],
    ["evidenceSummary", "Ask the downstream assistant to assess the evidence pattern"],
    ["researchGaps", "Draft a population research-gap statement"],
    ["hypotheses", "Draft a directional hypothesis"],
    ["methodologyOutline", "Outline a cohort study methodology"],
    ["proposalOutline", "Assemble a grant proposal outline"],
  ];

  for (const [draftId, expected] of cases) {
    it(`composes the ${draftId} template`, () => {
      expect(composeSuggestedDraft(completeStructuredState(), draftId, "en")).toContain(expected);
    });
  }

  it("treats the selected evidence pattern as provisional", () => {
    expect(composeSuggestedDraft(completeStructuredState(), "evidenceSummary", "en"))
      .toContain("Treat the selected pattern as provisional unless supported by permitted sources");
  });

  it("preserves medical short-text terminology exactly", () => {
    const state = completeStructuredState();
    state.fields.topic = "T-cell/BRCA1-related disease";
    state.fields.primaryOutcome = "CD4+ T-cell count";

    const draft = composeSuggestedDraft(state, "researchQuestion", "en");

    expect(draft).toContain("T-cell/BRCA1-related disease");
    expect(draft).toContain("CD4+ T-cell count");
  });

  it("includes available inherited topic and population in every downstream template", () => {
    for (const draftId of ["searchStrategy", "evidenceSummary", "researchGaps", "hypotheses", "methodologyOutline", "proposalOutline"]) {
      const draft = composeSuggestedDraft(completeStructuredState(), draftId, "en");
      expect(draft).toContain("Cardiac remodelling");
      expect(draft).toContain("Children with craniopharyngioma");
      expect(draft).toContain("Does hypothalamic obesity increase cardiac remodelling?");
    }
  });

  it("never reads or includes browser source text", () => {
    const state = completeStructuredState();
    Object.defineProperty(state, "sources", {
      get() { throw new Error("source text must remain unread"); },
    });

    const draft = composeSuggestedDraft(state, "proposalOutline", "en");
    expect(draft).not.toContain("PRIVATE-EVIDENCE");
  });

  it("preserves the visible draft and stores only an error code when composition fails", () => {
    const state = syncDrafts(completeStructuredState(), "en");
    const previous = {
      suggested: "Prior suggestion",
      value: "Prior visible draft",
      customized: false,
      error: "",
    };
    const fields = new Proxy({ ...state.fields, researchQuestion: previous.value }, {
      get(target, property, receiver) {
        if (property === "topic") throw new Error("PRIVATE-USER-CONTENT");
        return Reflect.get(target, property, receiver);
      },
    });
    let failed;

    expect(() => {
      failed = syncDrafts({
        ...state,
        fields,
        drafts: { ...state.drafts, researchQuestion: previous },
        sources: [{ text: "PRIVATE-SOURCE-CONTENT" }],
      }, "en");
    }).not.toThrow();
    expect(failed.drafts.researchQuestion).toEqual({
      ...previous,
      error: "composition-failed",
    });
    expect(failed.fields.researchQuestion).toBe(previous.value);
    expect(JSON.stringify(failed.drafts.researchQuestion)).not.toContain("PRIVATE-USER-CONTENT");
    expect(JSON.stringify(failed.drafts.researchQuestion)).not.toContain("PRIVATE-SOURCE-CONTENT");
  });
});

describe("draft ownership", () => {
  it("preserves a customized value while structured changes update its suggestion", () => {
    let state = syncDrafts(completeStructuredState(), "en");
    state = setDraftValue(state, "researchQuestion", "My approved question");
    const next = setField(state, "topic", "Changed cardiac outcome");

    expect(next.drafts.researchQuestion).toMatchObject({
      value: "My approved question",
      customized: true,
    });
    expect(next.drafts.researchQuestion.suggested).not.toBe(state.drafts.researchQuestion.suggested);
    expect(next.fields.researchQuestion).toBe("My approved question");
  });

  it("restores the current suggestion and clears customization", () => {
    let state = syncDrafts(completeStructuredState(), "en");
    state = setDraftValue(state, "researchQuestion", "My approved question");
    state = setField(state, "topic", "Changed cardiac outcome");
    const restored = restoreDraft(state, "researchQuestion", "en");

    expect(restored.drafts.researchQuestion).toMatchObject({
      value: restored.drafts.researchQuestion.suggested,
      customized: false,
      error: "",
    });
    expect(restored.fields.researchQuestion).toBe(restored.drafts.researchQuestion.value);
  });

  it("recomputes locale changes only for uncustomized drafts", () => {
    let state = syncDrafts(completeStructuredState(), "en");
    state = setDraftValue(state, "researchQuestion", "My approved question");
    const customized = {
      ...state.drafts.researchQuestion,
      error: "existing-error",
    };
    state = {
      ...state,
      fields: new Proxy(state.fields, {
        get(target, property, receiver) {
          if (property === "topic") throw new Error("LOCALE-PRIVATE-CONTENT");
          return Reflect.get(target, property, receiver);
        },
      }),
      drafts: { ...state.drafts, researchQuestion: customized },
    };
    const localized = setInterfaceLocale(state, "th");

    expect(localized.drafts.researchQuestion).toBe(customized);
    expect(localized.drafts.researchQuestion).toEqual(customized);
    expect(localized.drafts.searchStrategy.customized).toBe(false);
    expect(localized.drafts.searchStrategy.value).toBe(localized.drafts.searchStrategy.suggested);
    expect(localized.drafts.searchStrategy.suggested).not.toBe(state.drafts.searchStrategy.suggested);
  });
});
