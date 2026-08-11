import { describe, expect, it } from "vitest";
import { copy, t } from "../../src/i18n.js";
import {
  BASE_OPTION_SETS,
  DESIGN_ANALYSIS_FAMILIES,
  FIELD_DEFINITIONS,
  RESEARCH_TYPES,
  TYPE_OPTION_SETS,
} from "../../src/catalog/index.js";

function promptOptionIds() {
  return [...new Set([
    ...Object.values(BASE_OPTION_SETS).flat(),
    ...Object.values(TYPE_OPTION_SETS).flatMap(optionSets => Object.values(optionSets).flat()),
    ...Object.values(DESIGN_ANALYSIS_FAMILIES).flat(),
    ...RESEARCH_TYPES.flatMap(type => type.designs.map(design => design.id)),
    "uploaded-source-set",
    "other",
    "not-sure",
  ])];
}

describe("localized copy", () => {
  it("deep-freezes nested copy values", () => {
    expect(Object.isFrozen(copy)).toBe(true);
    expect(Object.isFrozen(copy.en)).toBe(true);
    expect(Object.isFrozen(copy.en.actions)).toBe(true);
    expect(() => { copy.en.actions.reset = "Changed"; }).toThrow(TypeError);
    expect(t("en", "actions.reset")).toBe("Start a new workspace");
  });

  it.each([
    ["define-question", "Step 1: Define the Research Question", "ขั้นที่ 1: กำหนดคำถามวิจัย"],
    ["literature-review", "Step 2: Conduct a Literature Review", "ขั้นที่ 2: ทบทวนวรรณกรรม"],
    ["synthesize-information", "Step 3: Synthesize Information", "ขั้นที่ 3: สังเคราะห์ข้อมูล"],
    ["identify-gaps", "Step 4: Identify Research Gaps", "ขั้นที่ 4: ระบุช่องว่างการวิจัย"],
    ["generate-hypotheses", "Step 5: Generate Hypotheses", "ขั้นที่ 5: สร้างสมมติฐาน"],
    ["outline-methodology", "Step 6: Outline Research Methodology", "ขั้นที่ 6: วางโครงร่างระเบียบวิธีวิจัย"],
    ["write-proposal", "Step 7: Write a Research Proposal", "ขั้นที่ 7: เขียนข้อเสนอโครงการวิจัย"],
  ])("localizes the approved %s lifecycle label", (stageId, english, thai) => {
    expect(t("en", `stages.${stageId}`)).toBe(english);
    expect(t("th", `stages.${stageId}`)).toBe(thai);
  });

  it("uses authored bilingual confirmation and completion copy for every transition kind", () => {
    const kinds = ["researchType", "studyDesign", "other", "stage", "targetOutput", "evidenceMode", "reset"];
    for (const locale of ["th", "en"]) {
      for (const kind of kinds) {
        expect(t(locale, `confirmation.${kind}.title`), `${locale} ${kind} title`).not.toBe(`confirmation.${kind}.title`);
        expect(t(locale, `confirmation.${kind}.body`), `${locale} ${kind} body`).not.toBe(`confirmation.${kind}.body`);
        expect(t(locale, `confirmation.${kind}.action`), `${locale} ${kind} action`).not.toBe(`confirmation.${kind}.action`);
      }
    }
    expect(t("en", "confirmation.studyDesign.body")).toContain("study design");
    expect(t("en", "confirmation.other.body")).toContain("Other choice");
    expect(t("th", "status.transition.studyDesign")).not.toBe("status.transition.studyDesign");
    expect(t("en", "status.transition.other")).toBe("Other choice replaced.");
  });

  it("localizes actionable readiness and adaptive validation messages", () => {
    expect(t("th", "stageNotStarted")).toBe("ยังไม่เริ่ม");
    expect(t("en", "stageRemaining", { count: 2 })).toBe("2 required items remaining");
    expect(t("th", "blockerReasons.deidentification-unconfirmed"))
      .toBe("ยังไม่ได้ยืนยันการลบข้อมูลระบุตัวตน");
    expect(t("en", "blockerReasons.deidentification-unconfirmed"))
      .toBe("De-identification has not been confirmed");
    expect(t("en", "validation.validationStaleOption"))
      .toBe("A previous choice is incompatible with the current setup. Choose a replacement.");
    expect(t("th", "validation.validationOtherRequired", { field: "ประเภทคำถามวิจัย" }))
      .toBe("ระบุรายละเอียดสำหรับตัวเลือกอื่นของ ประเภทคำถามวิจัย");
    expect(t("en", "validation.validationDraftError"))
      .toBe("The draft could not be refreshed; the previous text is preserved.");
  });

  it("provides Thai and English copy for every prompt-facing adaptive key", () => {
    const fieldKeys = FIELD_DEFINITIONS
      .filter(field => field.canonical)
      .map(field => field.labelKey);
    const optionKeys = promptOptionIds().map(optionId => `options.${optionId}`);

    for (const locale of ["th", "en"]) {
      for (const key of [...fieldKeys, ...optionKeys]) {
        expect(t(locale, key), `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("provides bilingual labels and help for every catalogue field", () => {
    for (const locale of ["th", "en"]) {
      for (const field of FIELD_DEFINITIONS) {
        expect(t(locale, field.labelKey), `${locale} ${field.labelKey}`).not.toBe(field.labelKey);
        expect(t(locale, field.helpKey), `${locale} ${field.helpKey}`).not.toBe(field.helpKey);
      }
    }
  });

  it("localizes the compact adaptive-form controls", () => {
    const keys = [
      "researchProfile", "advancedDetails", "inheritedContext", "otherSpecify",
      "notSureRecommend", "restoreSuggested", "suggestedDraft", "customizedDraft",
      "chooseOption", "previousChoice", "editField",
    ];
    for (const locale of ["th", "en"]) {
      for (const key of keys) expect(t(locale, key), `${locale} ${key}`).not.toBe(key);
    }
    expect(t("en", "researchProfile")).toBe("Research profile");
    expect(t("th", "advancedDetails")).toBe("รายละเอียดขั้นสูง");
    expect(t("en", "otherSpecify")).toBe("Other - specify");
    expect(t("en", "notSureRecommend")).toBe("Not sure - ask AI to recommend");
    expect(t("en", "restoreSuggested")).toBe("Restore suggested text");
  });

  it("uses authored bilingual labels for a normal adaptive decision", () => {
    expect(t("th", "fields.questionType")).toBe("ประเภทคำถามวิจัย");
    expect(t("en", "fields.questionType")).toBe("Question type");
    expect(t("th", "options.prognosis")).toBe("การพยากรณ์โรค");
    expect(t("en", "options.prognosis")).toBe("Prognosis");
    expect(t("th", "options.cohort")).toBe("โคฮอร์ต");
    expect(t("en", "options.cohort")).toBe("Cohort");
  });

  it.each([
    "empty-text",
    "invalid-utf8",
    "malformed-csv",
    "malformed-ris",
    "malformed-bib",
    "image-only-docx",
    "encrypted-docx",
  ])("localizes the %s parser outcome without exposing its code", code => {
    for (const locale of ["th", "en"]) {
      expect(t(locale, `evidence.errors.${code}`)).not.toBe(`evidence.errors.${code}`);
    }
  });
});
