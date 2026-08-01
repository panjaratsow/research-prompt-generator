import { describe, expect, it } from "vitest";
import {
  LIFECYCLE_STAGES,
  RESEARCH_TYPES,
  STANDARD_IDS,
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
    expect(STANDARDS.map(item => item.id)).toEqual(STANDARD_IDS);
    expect(resolveStandards("randomized-trials", "protocol")).toEqual([]);
    expect(getAdaptiveFieldIds("diagnostics", "protocol")).toEqual([]);
  });
});
