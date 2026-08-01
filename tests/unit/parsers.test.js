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

  it("extracts DOCX text", async () => {
    const bytes = await readFile("tests/fixtures/searchable-evidence.docx");
    const result = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), mammoth);

    expect(result.text).toContain("Verified evidence source 2026");
  });

  it("decodes plain evidence formats", async () => {
    expect((await parsePlainText(textBytes.buffer)).text).toContain("Verified evidence source 2026");
  });

  it.each(["txt", "md", "csv", "ris", "bib"])("dispatches lowercase %s files to the plain text parser", async extension => {
    const result = await parseEvidenceFile(file(`evidence.${extension}`), {});

    expect(result).toEqual({ text: "Verified evidence source 2026", warnings: [] });
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
