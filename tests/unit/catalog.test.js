import { describe, expect, it } from "vitest";
import {
  LIFECYCLE_STAGES,
  RESEARCH_TYPES,
  STANDARDS,
  getAdaptiveFieldIds,
  getResearchType,
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
