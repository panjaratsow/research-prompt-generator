import { describe, expect, it } from "vitest";
import { copy, t } from "../../src/i18n.js";

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
