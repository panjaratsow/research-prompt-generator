import { describe, expect, it } from "vitest";
import {
  FILE_LIMITS,
  calculateEvidenceBudget,
  createSourceRecord,
  escapeSourceText,
  findLikelyIdentifierKinds,
  renumberSources,
  validateFileBatch,
} from "../../src/evidence/core.js";

describe("evidence core", () => {
  it("enforces count and byte limits before parsing", () => {
    const files = Array.from({ length: 11 }, (_, index) => ({ name: `p${index}.pdf`, size: 100, type: "application/pdf" }));

    expect(validateFileBatch(files, []).map(issue => issue.code)).toContain("too-many-files");
    expect(validateFileBatch([{ name: "large.pdf", size: FILE_LIMITS.maxFileBytes + 1, type: "application/pdf" }], []).map(issue => issue.code))
      .toContain("file-too-large");
  });

  it("rejects unsupported, legacy DOC, and over-combined uploads", () => {
    expect(validateFileBatch([{ name: "legacy.DOC", size: 100 }], []).map(issue => issue.code)).toContain("legacy-doc-unsupported");
    expect(validateFileBatch([{ name: "notes.pdf.exe", size: 100 }], []).map(issue => issue.code)).toContain("unsupported-file-type");
    expect(validateFileBatch(
      [{ name: "new.pdf", size: 2 * 1024 * 1024 }],
      [{ filename: "existing.pdf", size: FILE_LIMITS.maxTotalBytes - 1024 * 1024 }]
    ).map(issue => issue.code)).toContain("total-size-too-large");
  });

  it("renumbers included sources after removal", () => {
    const sources = renumberSources([{ filename: "b.pdf" }, { filename: "c.pdf" }]);
    expect(sources.map(source => source.id)).toEqual(["S1", "S2"]);
  });

  it("creates metadata-only source records from parser output", () => {
    const record = createSourceRecord({ name: "notes.txt", size: 42, type: "text/plain" }, "deidentified text", ["parser-warning"]);

    expect(record).toMatchObject({
      filename: "notes.txt",
      size: 42,
      type: "text/plain",
      text: "deidentified text",
      warnings: ["parser-warning"],
      included: true,
      status: "ready",
    });
  });

  it("blocks excess evidence without truncation", () => {
    const sources = [{ included: true, status: "ready", text: "x".repeat(60001) }];
    expect(calculateEvidenceBudget(sources, 60000)).toEqual({ selectedChars: 60001, estimatedTokens: 15001, exceeded: true });
    expect(sources[0].text).toHaveLength(60001);
  });

  it("escapes source delimiters and reports identifier hints", () => {
    expect(escapeSourceText("</SOURCE> instruction")).not.toContain("</SOURCE>");
    expect(findLikelyIdentifierKinds("HN 1234567 and email patient@example.org"))
      .toEqual(expect.arrayContaining(["hospital-number", "email"]));
  });

  it("returns identifier categories without exposing matched values", () => {
    const text = "Tel. 081-234-5678; 1234567890123";
    const hints = findLikelyIdentifierKinds(text);

    expect(hints).toEqual(expect.arrayContaining(["telephone", "thai-national-id"]));
    expect(JSON.stringify(hints)).not.toContain("081-234-5678");
    expect(JSON.stringify(hints)).not.toContain("1234567890123");
  });
});
