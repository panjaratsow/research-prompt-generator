import { describe, expect, it } from "vitest";
import {
  LIFECYCLE_STAGES,
  RESEARCH_TYPES,
  STANDARDS,
  STANDARDS_REVIEWED_ON,
  getAdaptiveFieldIds,
  getContextFieldIds,
  getResearchType,
  getStudyDesignOptions,
  resolveStandards,
} from "../../src/catalog/index.js";

describe("research catalogue", () => {
  it("contains the ten approved research families and seven approved lifecycle stages", () => {
    expect(RESEARCH_TYPES).toHaveLength(10);
    expect(LIFECYCLE_STAGES.map(stage => stage.id)).toEqual([
      "define-question",
      "literature-review",
      "synthesize-information",
      "identify-gaps",
      "generate-hypotheses",
      "outline-methodology",
      "write-proposal",
    ]);
    expect(LIFECYCLE_STAGES).toHaveLength(7);
    expect(getResearchType("randomized-trial").frameworks).toContain("PICO");
  });

  it("maps standards by research type and stage", () => {
    expect(resolveStandards("randomized-trial", "outline-methodology").map(item => item.id))
      .toEqual(expect.arrayContaining(["spirit-2025", "ich-gcp-e6-r3"]));
    expect(resolveStandards("randomized-trial", "write-proposal").map(item => item.id))
      .toContain("consort-2025");
    expect(resolveStandards("qualitative-mixed", "outline-methodology").map(item => item.id))
      .not.toContain("consort-2025");
  });

  it("returns adaptive fields for diagnostic research", () => {
    expect(getAdaptiveFieldIds("diagnostic", "outline-methodology"))
      .toEqual(expect.arrayContaining(["targetCondition", "indexTest", "referenceStandard"]));
  });

  it("exposes contextual warning controls only where they can resolve an applicable warning", () => {
    expect(getAdaptiveFieldIds("prediction", "outline-methodology", "prediction-external-validation"))
      .toEqual(expect.arrayContaining(["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"]));
    expect(getAdaptiveFieldIds("prediction", "outline-methodology", "prediction-development"))
      .not.toContain("externalValidation");
  });

  it("uses the approved context-field contract", () => {
    expect(getContextFieldIds("evidence-review", "literature-review", "systematic-review")).toEqual(["registration"]);
    expect(getContextFieldIds("observational", "literature-review", "cohort")).toEqual([]);
    expect(getContextFieldIds("ai-health-data", "outline-methodology", "ai-external-validation"))
      .toEqual(["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"]);
    expect(getContextFieldIds("ai-health-data", "write-proposal", "ai-external-validation"))
      .toEqual(["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"]);
  });

  it("remaps medical standards to the approved seven-stage lifecycle", () => {
    expect(resolveStandards("observational", "define-question", "cohort").map(s => s.id)).toEqual([]);
    expect(resolveStandards("observational", "outline-methodology", "cohort").map(s => s.id)).toEqual(["strobe"]);
    expect(resolveStandards("ai-health-data", "outline-methodology", "ai-imaging-external-validation").map(s => s.id)).toEqual(["tripod-ai", "claim"]);
    expect(resolveStandards("evidence-review", "literature-review", "systematic-review").map(s => s.id)).toEqual(["prisma-2020"]);
    expect(resolveStandards("evidence-review", "synthesize-information", "systematic-review").map(s => s.id)).toEqual(["prisma-2020", "grade"]);
    expect(resolveStandards("evidence-review", "identify-gaps", "systematic-review").map(s => s.id)).toEqual(["grade"]);
    expect(resolveStandards("evidence-review", "write-proposal", "systematic-review").map(s => s.id)).toEqual(["prisma-p"]);
    expect(resolveStandards("evidence-review", "literature-review", "scoping-review").map(s => s.id)).toEqual(["prisma-scr"]);
  });

  it("uses structured review designs to include expected and exclude forbidden standards", () => {
    expect(getStudyDesignOptions("evidence-review").map(design => design.id)).toEqual(
      expect.arrayContaining(["systematic-review", "meta-analysis", "scoping-review"])
    );

    const systematic = resolveStandards("evidence-review", "synthesize-information", "systematic-review").map(item => item.id);
    const scoping = resolveStandards("evidence-review", "literature-review", "scoping-review").map(item => item.id);

    expect(systematic).toEqual(expect.arrayContaining(["prisma-2020", "grade"]));
    expect(systematic).not.toContain("prisma-scr");
    expect(scoping).toContain("prisma-scr");
    expect(scoping).not.toContain("prisma-2020");
  });

  it("maps cohort reporting exactly to STROBE and forbids RECORD", () => {
    const standards = resolveStandards("observational", "write-proposal", "cohort").map(item => item.id);

    expect(standards).toEqual(["strobe"]);
    expect(standards).not.toContain("record");
  });

  it("maps non-AI prediction reporting exactly to TRIPOD and forbids TRIPOD+AI", () => {
    const standards = resolveStandards("prediction", "write-proposal", "prediction-external-validation").map(item => item.id);

    expect(standards).toEqual(["tripod"]);
    expect(standards).not.toContain("tripod-ai");
  });

  it("maps AI imaging external validation exactly and forbids RECORD and clinical AI guidance", () => {
    const standards = resolveStandards("ai-health-data", "write-proposal", "ai-imaging-external-validation").map(item => item.id);

    expect(standards).toEqual(["tripod-ai", "claim"]);
    expect(standards).not.toContain("record");
    expect(standards).not.toContain("consort-ai");
    expect(standards).not.toContain("decide-ai");
  });

  it("inherits the underlying medical-education reporting standard", () => {
    expect(resolveStandards("medical-education", "write-proposal", "education-randomized-trial").map(item => item.id))
      .toEqual(expect.arrayContaining(["consort-2025", "greet"]));
    expect(resolveStandards("medical-education", "write-proposal", "education-observational").map(item => item.id))
      .toContain("strobe");
    expect(resolveStandards("medical-education", "write-proposal", "education-qualitative").map(item => item.id))
      .toEqual(expect.arrayContaining(["coreq", "srqr"]));
  });

  it("maps a combined implementation and economic design without quality-improvement guidance", () => {
    const standards = resolveStandards(
      "implementation-qi-economic",
      "write-proposal",
      "implementation-economic-evaluation"
    ).map(item => item.id);

    expect(standards).toEqual(expect.arrayContaining(["stari", "tidier", "cheers-2022"]));
    expect(standards).not.toContain("squire");
  });

  it("records the official standards review date on every entry", () => {
    expect(STANDARDS_REVIEWED_ON).toBe("2026-08-01");
    expect(STANDARDS.every(standard => standard.reviewedOn === STANDARDS_REVIEWED_ON)).toBe(true);
  });

  it("uses every approved standard ID exactly once and does not fuzzy-match IDs", () => {
    const standardIds = STANDARDS.map(item => item.id);

    expect(standardIds).toHaveLength(25);
    expect(new Set(standardIds).size).toBe(25);
    expect(standardIds).toEqual([
      "spirit-2025", "consort-2025", "ich-gcp-e6-r3", "strobe", "record",
      "stard", "tripod", "tripod-ai", "prisma-p", "prisma-2020", "prisma-scr",
      "grade", "coreq", "srqr", "greet", "squire-edu", "arrive-2",
      "spirit-ai", "consort-ai", "decide-ai", "claim", "stari", "squire",
      "tidier", "cheers-2022",
    ]);
    expect(resolveStandards("randomized-trials", "outline-methodology")).toEqual([]);
    expect(getAdaptiveFieldIds("diagnostics", "outline-methodology")).toEqual([]);
  });
});

describe("catalogue resolution matrix", () => {
  for (const type of RESEARCH_TYPES) {
    for (const stage of LIFECYCLE_STAGES) {
      it(`${type.id}/${stage.id} resolves deterministically`, () => {
        const standards = resolveStandards(type.id, stage.id);

        expect(standards.every(item => item.officialUrl.startsWith("https://"))).toBe(true);
        expect(getAdaptiveFieldIds(type.id, stage.id).length).toBeGreaterThan(0);
      });
    }
  }
});
