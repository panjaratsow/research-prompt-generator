import { describe, expect, it } from "vitest";
import {
  FIELD_DEFINITIONS,
  LIFECYCLE_STAGES,
  RESEARCH_TYPES,
  getAdaptiveFieldIds,
  getCompatibleFieldIds,
  getFieldDefinition,
  getStageFieldDefinitions,
  resolveFieldOptions,
} from "../../src/catalog/index.js";

const SIMPLE_FIELDS = {
  "define-question": ["topic", "population", "questionType", "primaryOutcome"],
  "literature-review": ["informationSources", "dateCoverage", "evidenceTypes", "searchConcepts"],
  "synthesize-information": ["evidencePattern", "synthesisMethod", "evidenceCertainty", "mainLimitations"],
  "identify-gaps": ["gapType", "gapEvidenceSupport", "gapContext", "gapPriority"],
  "generate-hypotheses": ["hypothesisApproach", "interventionOrExposure", "hypothesisOutcome", "expectedDirection"],
  "outline-methodology": ["confirmedDesign", "dataSourceRecruitment", "samplingApproach", "analysisFamily", "feasibilityPeriod"],
  "write-proposal": ["proposalType", "targetAudience", "requiredSections", "proposalTimeline"],
};

const DRAFT_FIELDS = {
  "define-question": "researchQuestion",
  "literature-review": "searchStrategy",
  "synthesize-information": "evidenceSummary",
  "identify-gaps": "researchGaps",
  "generate-hypotheses": "hypotheses",
  "outline-methodology": "methodologyOutline",
  "write-proposal": "proposalOutline",
};

function context(researchTypeId, studyDesignId, evidenceMode) {
  return { researchTypeId, studyDesignId, stageId: "outline-methodology", evidenceMode, fields: {} };
}

describe("adaptive field catalogue", () => {
  for (const type of RESEARCH_TYPES) {
    for (const design of type.designs) {
      for (const stage of LIFECYCLE_STAGES) {
        it(`${type.id}/${design.id}/${stage.id} resolves an ordered usable form`, () => {
          const form = getStageFieldDefinitions({
            researchTypeId: type.id,
            studyDesignId: design.id,
            stageId: stage.id,
            evidenceMode: "planning",
            fields: {},
          });

          expect(form.simple.filter(field => field.required).length).toBeGreaterThan(0);
          expect(form.simple.filter(field => field.required).length).toBeLessThanOrEqual(5);
          expect(form.draft.id).toBe(DRAFT_FIELDS[stage.id]);
          expect(form.simple.map(field => field.id)).toEqual(expect.arrayContaining(SIMPLE_FIELDS[stage.id]));
          for (const field of [...form.simple, ...form.advanced]) {
            if (["single-select", "multi-select", "segmented"].includes(field.control)) {
              expect(field.options).not.toEqual([]);
            }
          }
        });
      }
    }
  }

  it("defines unique, translatable fields with valid placements and usable choices", () => {
    const approvedStageIds = new Set(LIFECYCLE_STAGES.map(stage => stage.id));
    const fieldIds = FIELD_DEFINITIONS.map(field => field.id);

    expect(new Set(fieldIds).size).toBe(fieldIds.length);
    for (const field of FIELD_DEFINITIONS) {
      expect(field.labelKey).toBeTruthy();
      expect(field.helpKey).toBeTruthy();
      for (const placement of field.placements) expect(approvedStageIds.has(placement.stageId)).toBe(true);
      if (["single-select", "multi-select", "segmented"].includes(field.control)) {
        expect(resolveFieldOptions(field.id, context("observational", "cohort", "planning"))).not.toEqual([]);
      }
    }
  });

  it("defines every currently visible field as a migration-compatible catalogue field", () => {
    const legacyIds = new Set();
    for (const type of RESEARCH_TYPES) {
      for (const design of type.designs) {
        for (const stage of LIFECYCLE_STAGES) {
          getAdaptiveFieldIds(type.id, stage.id, design.id).forEach(id => legacyIds.add(id));
        }
      }
    }

    for (const fieldId of legacyIds) expect(getFieldDefinition(fieldId)).toBeDefined();
  });

  it("uses study-design overlays and exposes uploaded sources only in uploaded evidence mode", () => {
    expect(resolveFieldOptions("analysisFamily", context("observational", "cohort", "planning")))
      .not.toEqual(resolveFieldOptions("analysisFamily", context("observational", "case-control", "planning")));
    expect(resolveFieldOptions("informationSources", context("observational", "cohort", "uploaded")).map(option => option.id))
      .toContain("uploaded-source-set");
    expect(resolveFieldOptions("informationSources", context("observational", "cohort", "planning")).map(option => option.id))
      .not.toContain("uploaded-source-set");
  });

  it("resolves confirmed design to only the selected valid study design", () => {
    expect(resolveFieldOptions("confirmedDesign", context("observational", "case-control", "planning")))
      .toEqual([{ id: "case-control", labelKey: "options.case-control" }]);
    expect(resolveFieldOptions("confirmedDesign", context("observational", "invalid-design", "planning")))
      .toEqual([]);
    expect(resolveFieldOptions("confirmedDesign", context("observational", undefined, "planning")))
      .toEqual([]);
  });

  it("keeps selected research-family legacy fields compatible across stages", () => {
    for (const type of RESEARCH_TYPES) {
      const design = type.designs[0];
      const compatibleIds = getCompatibleFieldIds({
        researchTypeId: type.id,
        studyDesignId: design.id,
        stageId: "outline-methodology",
        evidenceMode: "planning",
        fields: {},
      });

      expect(compatibleIds).toEqual(expect.arrayContaining(type.fields));
    }
  });
});
