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
  it("keeps the allowed extension list immutable", () => {
    const originalExtensions = [...FILE_LIMITS.allowedExtensions];

    expect(() => FILE_LIMITS.allowedExtensions.push("doc")).toThrow(TypeError);
    expect(FILE_LIMITS.allowedExtensions).toEqual(originalExtensions);
  });

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

  it("reports malformed new and existing file sizes instead of treating them as zero", () => {
    const newFileIssues = validateFileBatch([{ name: "new.pdf", size: Number.NaN }], []);
    const existingSourceIssues = validateFileBatch([], [{ id: "S1", filename: "old.pdf", size: -1 }]);

    expect(newFileIssues).toContainEqual(expect.objectContaining({ code: "invalid-file-size", index: 0 }));
    expect(existingSourceIssues).toContainEqual(expect.objectContaining({ code: "invalid-file-size", sourceId: "S1" }));
  });

  it("accepts valid files at every exact limit", () => {
    const maxFile = FILE_LIMITS.maxFileBytes;
    const exactCount = Array.from({ length: FILE_LIMITS.maxFiles }, (_, index) => ({ name: `p${index}.pdf`, size: 0 }));
    const exactTotal = Array.from({ length: 3 }, (_, index) => ({ name: `total-${index}.pdf`, size: maxFile }));

    expect(validateFileBatch(exactCount, [])).toEqual([]);
    expect(validateFileBatch([{ name: "exact.pdf", size: maxFile }], [])).toEqual([]);
    expect(validateFileBatch(exactTotal, [])).toEqual([]);
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

  it("preserves malformed source sizes for later batch validation", () => {
    const record = createSourceRecord({ name: "notes.txt", size: undefined }, "text", []);

    expect(record.size).toBeUndefined();
    expect(validateFileBatch([], [record])).toContainEqual(expect.objectContaining({
      code: "invalid-file-size",
      index: 0,
    }));
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

  it("identifies unformatted Western telephone numbers without returning the value", () => {
    const telephone = "2125551212";
    const hints = findLikelyIdentifierKinds(`Contact: ${telephone}`);

    expect(hints).toContain("telephone");
    expect(JSON.stringify(hints)).not.toContain(telephone);
    expect(findLikelyIdentifierKinds(`x${telephone}9`)).not.toContain("telephone");
  });
});
