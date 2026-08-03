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

    expect(bytes.includes(Buffer.from("EncryptionInfo", "utf16le"))).toBe(true);
    expect(bytes.includes(Buffer.from("EncryptedPackage", "utf16le"))).toBe(true);
    expect(bytes.readUInt32LE(640 + 116)).toBe(0);
    expect(bytes.readUInt32LE(640 + 120)).toBe(32);
    expect(bytes.readUInt32LE(768 + 116)).toBe(4);
    expect(bytes.readUInt32LE(768 + 120)).toBe(4096);

    await expect(parseEvidenceFile(file("encrypted.docx", bytes), { mammoth })).rejects.toEqual({ code: "encrypted-docx" });
  });

  it("rejects structurally valid encrypted markers with empty unallocated streams", async () => {
    const bytes = await readFile("tests/fixtures/empty-stream-encrypted-ooxml.docx");

    expect(bytes.readInt32LE(640 + 116)).toBe(-2);
    expect(bytes.readUInt32LE(640 + 120)).toBe(0);
    expect(bytes.readInt32LE(768 + 116)).toBe(-2);
    expect(bytes.readUInt32LE(768 + 120)).toBe(0);
    await expect(parseEvidenceFile(file("empty-streams.docx", bytes), { mammoth })).rejects.toEqual({ code: "malformed-file" });
  });

  it("classifies a signature-only malformed compound DOCX as malformed-file", async () => {
    const bytes = await readFile("tests/fixtures/malformed-compound.docx");

    expect([...bytes.subarray(0, 8)]).toEqual([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect(bytes.includes(Buffer.from("EncryptionInfo", "utf16le"))).toBe(false);
    expect(bytes.includes(Buffer.from("EncryptedPackage", "utf16le"))).toBe(false);
    await expect(parseEvidenceFile(file("malformed.docx", bytes), { mammoth })).rejects.toEqual({ code: "malformed-file" });
  });

  it("rejects marker strings in a structurally invalid compound file", async () => {
    const bytes = await readFile("tests/fixtures/malformed-marker-compound.docx");

    expect([...bytes.subarray(0, 8)]).toEqual([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    expect(bytes.includes(Buffer.from("EncryptionInfo", "utf16le"))).toBe(true);
    expect(bytes.includes(Buffer.from("EncryptedPackage", "utf16le"))).toBe(true);
    await expect(parseEvidenceFile(file("malformed-markers.docx", bytes), { mammoth })).rejects.toEqual({ code: "malformed-file" });
  });

  it.each([
    ["an out-of-range FAT sector reference", bytes => bytes.writeUInt32LE(99, 76)],
    ["a mismatched FAT sector count", bytes => bytes.writeUInt32LE(2, 44)],
    ["an invalid FAT sector marker", bytes => bytes.writeInt32LE(-2, 1028)],
    ["a directory-chain loop", bytes => bytes.writeUInt32LE(0, 1024)],
    ["a looping miniFAT sector chain", bytes => bytes.writeUInt32LE(2, 1024 + (2 * 4))],
    ["an unallocated miniFAT sector", bytes => bytes.writeUInt32LE(0xffffffff, 1024 + (2 * 4))],
    ["an odd UTF-16 directory name length", bytes => bytes.writeUInt16LE(63, 640 + 64)],
    ["a target directory entry with storage type", bytes => { bytes[640 + 66] = 1; }],
  ])("rejects an encrypted-marker compound with %s", async (_description, mutate) => {
    const bytes = Buffer.from(await readFile("tests/fixtures/encrypted-ooxml.docx"));
    mutate(bytes);

    await expect(parseEvidenceFile(file("malformed-structure.docx", bytes), { mammoth })).rejects.toEqual({ code: "malformed-file" });
  });

  it.each([
    ["an out-of-range root mini-stream start", bytes => bytes.writeUInt32LE(99, 512 + 116)],
    ["a truncated root mini-stream chain", bytes => bytes.writeUInt32LE(1024, 512 + 120)],
    ["a looping root mini-stream chain", bytes => bytes.writeUInt32LE(3, 1024 + (3 * 4))],
    ["an unallocated root mini-stream sector", bytes => bytes.writeUInt32LE(0xffffffff, 1024 + (3 * 4))],
    ["an out-of-range mini-stream start", bytes => bytes.writeUInt32LE(99, 640 + 116)],
    ["a truncated mini-stream chain", bytes => bytes.writeUInt32LE(128, 640 + 120)],
    ["a looping mini-stream chain", bytes => bytes.writeUInt32LE(0, 1536)],
    ["an unallocated mini-stream chain", bytes => bytes.writeUInt32LE(0xffffffff, 1536)],
    ["an out-of-range regular stream start", bytes => bytes.writeUInt32LE(99, 768 + 116)],
    ["a truncated regular stream chain", bytes => bytes.writeUInt32LE(4608, 768 + 120)],
    ["a looping regular stream chain", bytes => bytes.writeUInt32LE(4, 1024 + (11 * 4))],
    ["an unallocated regular stream chain", bytes => bytes.writeUInt32LE(0xffffffff, 1024 + (4 * 4))],
  ])("rejects an encrypted-marker compound with %s", async (_description, mutate) => {
    const bytes = Buffer.from(await readFile("tests/fixtures/encrypted-ooxml.docx"));
    mutate(bytes);

    await expect(parseEvidenceFile(file("malformed-allocation.docx", bytes), { mammoth })).rejects.toEqual({ code: "malformed-file" });
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
