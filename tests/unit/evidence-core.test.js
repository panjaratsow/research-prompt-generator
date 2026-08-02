import { describe, expect, it } from "vitest";
import {
  FILE_LIMITS,
  calculateEvidenceBudget,
  createSourceRecord,
  escapeSourceText,
  findLikelyIdentifierKinds,
  getEvidenceBudgetContributors,
  mergeSourceUpdates,
  partitionFileBatch,
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
    const sources = renumberSources([{ _key: "source-b", filename: "b.pdf" }, { _key: "source-c", filename: "c.pdf" }]);
    expect(sources.map(source => source.id)).toEqual(["S1", "S2"]);
    expect(sources.map(source => source._key)).toEqual(["source-b", "source-c"]);
  });

  it("partitions invalid files while preserving valid peers within global limits", () => {
    const valid = { name: "evidence.txt", size: 100, type: "text/plain" };
    const legacy = { name: "legacy.doc", size: 100, type: "application/msword" };
    const oversized = { name: "large.pdf", size: FILE_LIMITS.maxFileBytes + 1, type: "application/pdf" };

    const result = partitionFileBatch([valid, legacy, oversized], []);

    expect(result.accepted).toEqual([valid]);
    expect(result.rejected).toEqual([
      { file: legacy, code: "legacy-doc-unsupported" },
      { file: oversized, code: "file-too-large" },
    ]);
  });

  it("rejects only files that would exceed count or total-size limits", () => {
    const existing = Array.from({ length: FILE_LIMITS.maxFiles - 1 }, (_, index) => ({
      id: `S${index + 1}`, status: "ready", size: 1,
    }));
    const within = { name: "within.txt", size: 1 };
    const overCount = { name: "over-count.txt", size: 1 };
    const countResult = partitionFileBatch([within, overCount], existing);
    const totalResult = partitionFileBatch(
      [{ name: "over-total.txt", size: 2 }],
      [{ id: "S1", status: "ready", size: FILE_LIMITS.maxTotalBytes - 1 }]
    );

    expect(countResult.accepted).toEqual([within]);
    expect(countResult.rejected).toEqual([]);
    expect(countResult.issues).toEqual([{ code: "too-many-files" }]);
    expect(totalResult.accepted).toEqual([]);
    expect(totalResult.rejected).toEqual([{ file: expect.any(Object), code: "total-size-too-large" }]);
    expect(totalResult.issues).toEqual([]);
  });

  it("bounds retained excluded rows and reports overflow across repeated invalid batches", () => {
    const existing = Array.from({ length: FILE_LIMITS.maxFiles - 1 }, (_, index) => ({
      id: `S${index + 1}`,
      status: "excluded",
      filename: `invalid-${index}.exe`,
      size: 10,
    }));
    const first = { name: "legacy.doc", size: 10 };
    const overflow = { name: "another.exe", size: 10 };

    const result = partitionFileBatch([first, overflow], existing);

    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([{ file: first, code: "legacy-doc-unsupported" }]);
    expect(result.issues).toEqual([{ code: "too-many-files" }]);
    expect(existing.length + result.accepted.length + result.rejected.length).toBe(FILE_LIMITS.maxFiles);
  });

  it("merges parser updates by internal key without resurrecting removed sources", () => {
    const current = renumberSources([
      { _key: "existing", filename: "existing.txt", included: false, status: "ready", text: "existing" },
      { _key: "parsing", filename: "new.txt", included: false, status: "extracting", text: "" },
    ]);
    const parserUpdate = { ...current[1], status: "ready", included: true, text: "parsed" };
    const merged = mergeSourceUpdates(current, [parserUpdate]);

    expect(merged[0]).toBe(current[0]);
    expect(merged[0].included).toBe(false);
    expect(merged[1]).toMatchObject({ _key: "parsing", status: "ready", text: "parsed" });
    expect(mergeSourceUpdates([], [parserUpdate])).toEqual([]);
  });

  it("removes raw files from every terminal source update while preserving race-safe merging", () => {
    const readyFile = { name: "ready.txt" };
    const errorFile = { name: "error.txt" };
    const excludedFile = { name: "excluded.txt" };
    const current = renumberSources([
      { _key: "stable", filename: "stable.txt", status: "ready", text: "stable" },
      { _key: "ready", filename: "ready.txt", status: "extracting", text: "", file: readyFile },
      { _key: "error", filename: "error.txt", status: "extracting", text: "", file: errorFile },
      { _key: "excluded", filename: "excluded.txt", status: "extracting", text: "", file: excludedFile },
    ]);

    const merged = mergeSourceUpdates(current, [
      { _key: "ready", status: "ready", included: true, text: "parsed" },
      { _key: "error", status: "error", included: false, text: "", error: "malformed-file" },
      { _key: "excluded", status: "excluded", included: false, text: "", error: "malformed-file" },
    ]);

    expect(merged[0]).toBe(current[0]);
    expect(merged.map(source => source.id)).toEqual(["S1", "S2", "S3", "S4"]);
    expect(merged.slice(1).every(source => !("file" in source))).toBe(true);
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

  it("identifies each selected ready source's full budget contribution", () => {
    const sources = [
      { id: "S1", included: true, status: "ready", text: "12345" },
      { id: "S2", included: false, status: "ready", text: "ignored" },
      { id: "S3", included: true, status: "ready", text: "123" },
    ];

    expect(getEvidenceBudgetContributors(sources)).toEqual([
      { sourceId: "S1", characters: 5 },
      { sourceId: "S3", characters: 3 },
    ]);
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
