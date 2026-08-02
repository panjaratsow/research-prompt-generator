import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import {
  parseDocx,
  parseEvidenceFile,
  parsePdf,
  parsePlainText,
} from "../../src/evidence/parsers.js";

const textBytes = new TextEncoder().encode("Verified evidence source 2026");

function file(name, bytes = textBytes) {
  return {
    name,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

describe("evidence parsers", () => {
  it("extracts searchable PDF text", async () => {
    const bytes = await readFile("tests/fixtures/searchable-evidence.pdf");
    const result = await parsePdf(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), pdfjs, {});

    expect(result.text).toContain("Verified evidence source 2026");
  });

  it("rejects an image-only or zero-text PDF with a stable error", async () => {
    const result = parsePdf(textBytes.buffer, {
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
        }),
      }),
    });

    await expect(result).rejects.toEqual({ code: "image-only-pdf" });
  });

  it("extracts DOCX text", async () => {
    const bytes = await readFile("tests/fixtures/searchable-evidence.docx");
    const result = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), mammoth);

    expect(result.text).toContain("Verified evidence source 2026");
  });

  it("decodes deliberate valid UTF-8", async () => {
    expect((await parsePlainText(textBytes.buffer)).text).toContain("Verified evidence source 2026");
  });

  it.each(["txt", "md"])("dispatches lowercase %s files to the plain text parser", async extension => {
    const result = await parseEvidenceFile(file(`evidence.${extension}`), {});

    expect(result).toEqual({ text: "Verified evidence source 2026", warnings: [] });
  });

  it.each([
    ["csv", "tests/fixtures/evidence.csv"],
    ["ris", "tests/fixtures/evidence.ris"],
    ["bib", "tests/fixtures/evidence.bib"],
  ])("validates and extracts structured .%s text", async (extension, fixturePath) => {
    const bytes = await readFile(fixturePath);
    const result = await parseEvidenceFile(file(`evidence.${extension}`, bytes), {});

    expect(result.text).toContain("Verified evidence source 2026");
  });

  it.each([
    ["empty.txt", "empty-text"],
    ["invalid-utf8.txt", "invalid-utf8"],
    ["malformed.csv", "malformed-csv"],
    ["malformed.ris", "malformed-ris"],
    ["malformed.bib", "malformed-bib"],
  ])("rejects %s with a stable parser code", async (fixtureName, code) => {
    const bytes = await readFile(`tests/fixtures/${fixtureName}`);

    await expect(parseEvidenceFile(file(fixtureName, bytes), {})).rejects.toEqual({ code });
  });

  it("rejects a real image-only DOCX without inventing OCR text", async () => {
    const bytes = await readFile("tests/fixtures/image-only.docx");

    await expect(parseEvidenceFile(file("image-only.docx", bytes), { mammoth })).rejects.toEqual({ code: "image-only-docx" });
  });

  it("distinguishes an encrypted OOXML container from a malformed DOCX", async () => {
    const bytes = await readFile("tests/fixtures/encrypted-ooxml.docx");

    await expect(parseEvidenceFile(file("encrypted.docx", bytes), { mammoth })).rejects.toEqual({ code: "encrypted-docx" });
  });

  it("dispatches PDF files with configured parser resources", async () => {
    const calls = [];
    const result = await parseEvidenceFile(file("evidence.PDF"), {
      pdfjs: {
        getDocument: options => {
          calls.push(options);
          return {
            promise: Promise.resolve({
              numPages: 1,
              getPage: async () => ({ getTextContent: async () => ({ items: [{ str: "Verified evidence source 2026" }] }) }),
            }),
          };
        },
      },
      pdfResources: { cMapUrl: "local-cmaps" },
    });

    expect(result.text).toBe("Verified evidence source 2026");
    expect(calls[0]).toMatchObject({ useWorkerFetch: false, cMapUrl: "local-cmaps" });
  });

  it("returns a stack-free unsupported-file error", async () => {
    await expect(parseEvidenceFile(file("evidence.exe"), {})).rejects.toEqual({ code: "unsupported-file" });
  });

  it("returns a stack-free malformed-file error without extracted text", async () => {
    await expect(parseEvidenceFile(file("evidence.pdf"), {
      pdfjs: { getDocument: () => ({ promise: Promise.reject(new Error("invalid PDF with secret text")) }) },
    })).rejects.toEqual({ code: "malformed-file" });
  });

  it("returns a stack-free encrypted-pdf error", async () => {
    await expect(parseEvidenceFile(file("evidence.pdf"), {
      pdfjs: { getDocument: () => ({ promise: Promise.reject({ name: "PasswordException" }) }) },
    })).rejects.toEqual({ code: "encrypted-pdf" });
  });
});
