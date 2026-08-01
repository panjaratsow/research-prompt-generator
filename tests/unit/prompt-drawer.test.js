import { describe, expect, it } from "vitest";
import { copyPrompt, downloadPrompt } from "../../src/ui/prompt-drawer.js";

describe("prompt drawer actions", () => {
  it("copies through the provided clipboard when available", async () => {
    const copied = [];
    await expect(copyPrompt("Research prompt", { writeText: async text => copied.push(text) })).resolves.toBe("copied");
    expect(copied).toEqual(["Research prompt"]);
  });

  it("reports manual copying when the clipboard is unavailable", async () => {
    await expect(copyPrompt("Research prompt", null)).resolves.toBe("manual-copy-required");
  });

  it("builds a dated plain-text download", () => {
    const result = downloadPrompt("Research prompt", {
      researchTypeId: "observational",
      stageId: "question",
      now: new Date("2026-08-02T00:00:00.000Z"),
    });

    expect(result.filename).toBe("research-prompt-observational-question-2026-08-02.txt");
    expect(result.url).toMatch(/^blob:/);
    URL.revokeObjectURL(result.url);
  });
});
