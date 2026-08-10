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

  it("uses stage-specific bilingual confirmation copy", () => {
    expect(t("en", "stageConfirmText")).toBe("Changing research stage will clear these fields:");
    expect(t("th", "stageConfirmText")).toBe("การเปลี่ยนขั้นตอนการวิจัยจะล้างข้อมูลต่อไปนี้:");
  });

  it("localizes actionable readiness and adaptive validation messages", () => {
    expect(t("th", "stageNotStarted")).toBe("ยังไม่เริ่ม");
    expect(t("en", "stageRemaining", { count: 2 })).toBe("2 required items remaining");
    expect(t("th", "stageBlocked", { reason: "deidentification-unconfirmed" }))
      .toBe("ถูกระงับ: deidentification-unconfirmed");
    expect(t("en", "validation.validationStaleOption"))
      .toBe("A previous choice is incompatible with the current setup. Choose a replacement.");
    expect(t("th", "validation.validationOtherRequired"))
      .toBe("กรุณาระบุรายละเอียดสำหรับตัวเลือกอื่น");
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
