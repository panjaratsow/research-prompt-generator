import { describe, expect, it } from "vitest";
import {
  LIFECYCLE_STAGES,
  RESEARCH_TYPES,
  STANDARDS,
  STANDARDS_REVIEWED_ON,
  getAdaptiveFieldIds,
  getResearchType,
  getStudyDesignOptions,
  resolveStandards,
} from "../../src/catalog/index.js";

describe("research catalogue", () => {
  it("contains the ten approved research families and lifecycle stages", () => {
    expect(RESEARCH_TYPES).toHaveLength(10);
    expect(LIFECYCLE_STAGES).toHaveLength(10);
    expect(getResearchType("randomized-trial").frameworks).toContain("PICO");
  });

  it("maps standards by research type and stage", () => {
    expect(resolveStandards("randomized-trial", "protocol").map(item => item.id))
      .toEqual(expect.arrayContaining(["spirit-2025", "ich-gcp-e6-r3"]));
    expect(resolveStandards("randomized-trial", "reporting").map(item => item.id))
      .toContain("consort-2025");
    expect(resolveStandards("qualitative-mixed", "protocol").map(item => item.id))
      .not.toContain("consort-2025");
  });

  it("returns adaptive fields for diagnostic research", () => {
    expect(getAdaptiveFieldIds("diagnostic", "protocol"))
      .toEqual(expect.arrayContaining(["targetCondition", "indexTest", "referenceStandard"]));
  });

  it("exposes contextual warning controls only where they can resolve an applicable warning", () => {
    expect(getAdaptiveFieldIds("prediction", "protocol", "prediction-external-validation"))
      .toEqual(expect.arrayContaining(["registration", "ethicsApproval", "dataSharingPlan", "externalValidation"]));
    expect(getAdaptiveFieldIds("prediction", "protocol", "prediction-development"))
      .not.toContain("externalValidation");
  });

  it("uses structured study designs to include expected and exclude forbidden standards", () => {
    expect(getStudyDesignOptions("evidence-review").map(design => design.id)).toEqual(
      expect.arrayContaining(["systematic-review", "meta-analysis", "scoping-review"])
    );

    const systematic = resolveStandards("evidence-review", "reporting", "systematic-review").map(item => item.id);
    const scoping = resolveStandards("evidence-review", "reporting", "scoping-review").map(item => item.id);
    const externalAi = resolveStandards("ai-health-data", "reporting", "ai-imaging-external-validation").map(item => item.id);

    expect(systematic).toEqual(expect.arrayContaining(["prisma-2020", "grade"]));
    expect(systematic).not.toContain("prisma-scr");
    expect(scoping).toContain("prisma-scr");
    expect(scoping).not.toContain("prisma-2020");
    expect(externalAi).toEqual(expect.arrayContaining(["tripod-ai", "claim"]));
    expect(externalAi).not.toEqual(expect.arrayContaining(["consort-ai", "decide-ai"]));
  });

  it("inherits the underlying medical-education reporting standard", () => {
    expect(resolveStandards("medical-education", "reporting", "education-randomized-trial").map(item => item.id))
      .toEqual(expect.arrayContaining(["consort-2025", "greet"]));
    expect(resolveStandards("medical-education", "reporting", "education-observational").map(item => item.id))
      .toContain("strobe");
    expect(resolveStandards("medical-education", "reporting", "education-qualitative").map(item => item.id))
      .toEqual(expect.arrayContaining(["coreq", "srqr"]));
  });

  it("maps a combined implementation and economic design without quality-improvement guidance", () => {
    const standards = resolveStandards(
      "implementation-qi-economic",
      "reporting",
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
    expect(resolveStandards("randomized-trials", "protocol")).toEqual([]);
    expect(getAdaptiveFieldIds("diagnostics", "protocol")).toEqual([]);
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
