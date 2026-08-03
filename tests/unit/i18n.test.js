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

  it("localizes the approved bilingual seven-step lifecycle", () => {
    expect(t("en", "stages.define-question")).toBe("Step 1: Define the Research Question");
    expect(t("en", "stages.write-proposal")).toBe("Step 7: Write a Research Proposal");
    expect(t("th", "stages.define-question")).toBe("ขั้นที่ 1: กำหนดคำถามวิจัย");
    expect(t("th", "stages.write-proposal")).toBe("ขั้นที่ 7: เขียนข้อเสนอโครงการวิจัย");
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
