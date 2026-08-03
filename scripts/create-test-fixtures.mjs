import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, ImageRun, Packer, Paragraph } from "docx";

await mkdir("tests/fixtures", { recursive: true });

const pdf = await PDFDocument.create();
const page = pdf.addPage([500, 300]);
const font = await pdf.embedFont(StandardFonts.Helvetica);
page.drawText("Verified evidence source 2026", { x: 40, y: 240, size: 16, font });
await writeFile("tests/fixtures/searchable-evidence.pdf", await pdf.save());

const document = new Document({
  sections: [{ children: [new Paragraph("Verified evidence source 2026")] }],
});
await writeFile("tests/fixtures/searchable-evidence.docx", await Packer.toBuffer(document));
const imageOnlyDocument = new Document({
  sections: [{ children: [new Paragraph({ children: [new ImageRun({
    data: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    transformation: { width: 20, height: 20 },
    type: "png",
  })] })] }],
});
await writeFile("tests/fixtures/image-only.docx", await Packer.toBuffer(imageOnlyDocument));
const compoundSignature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

function writeCompoundDirectoryEntry(buffer, offset, name, type, {
  right = -1,
  child = -1,
  start = -2,
  size = 0,
} = {}) {
  const encodedName = Buffer.from(`${name}\0`, "utf16le");
  encodedName.copy(buffer, offset, 0, Math.min(encodedName.length, 64));
  buffer.writeUInt16LE(Math.min(encodedName.length, 64), offset + 64);
  buffer[offset + 66] = type;
  buffer[offset + 67] = 1;
  buffer.writeInt32LE(-1, offset + 68);
  buffer.writeInt32LE(right, offset + 72);
  buffer.writeInt32LE(child, offset + 76);
  buffer.writeInt32LE(start, offset + 116);
  buffer.writeUInt32LE(size, offset + 120);
  buffer.writeUInt32LE(0, offset + 124);
}

function writeCompoundHeader(buffer, { firstMiniFat = -2, miniFatCount = 0 } = {}) {
  compoundSignature.copy(buffer);
  buffer.writeUInt16LE(0x003e, 24);
  buffer.writeUInt16LE(3, 26);
  buffer.writeUInt16LE(0xfffe, 28);
  buffer.writeUInt16LE(9, 30);
  buffer.writeUInt16LE(6, 32);
  buffer.writeUInt32LE(1, 44);
  buffer.writeInt32LE(0, 48);
  buffer.writeUInt32LE(4096, 56);
  buffer.writeInt32LE(firstMiniFat, 60);
  buffer.writeUInt32LE(miniFatCount, 64);
  buffer.writeInt32LE(-2, 68);
  buffer.fill(0xff, 76, 512);
  buffer.writeInt32LE(1, 76);
}

function emptyStreamEncryptedOoxmlCompound() {
  const buffer = Buffer.alloc(1536);
  writeCompoundHeader(buffer);
  writeCompoundDirectoryEntry(buffer, 512, "Root Entry", 5, { child: 1 });
  writeCompoundDirectoryEntry(buffer, 640, "EncryptionInfo", 2, { right: 2 });
  writeCompoundDirectoryEntry(buffer, 768, "EncryptedPackage", 2);
  buffer.fill(0xff, 1024);
  buffer.writeInt32LE(-2, 1024);
  buffer.writeInt32LE(-3, 1028);
  return buffer;
}

function encryptedOoxmlCompound() {
  const buffer = Buffer.alloc(13 * 512);
  writeCompoundHeader(buffer, { firstMiniFat: 2, miniFatCount: 1 });
  writeCompoundDirectoryEntry(buffer, 512, "Root Entry", 5, {
    child: 1,
    start: 3,
    size: 64,
  });
  writeCompoundDirectoryEntry(buffer, 640, "EncryptionInfo", 2, {
    right: 2,
    start: 0,
    size: 32,
  });
  writeCompoundDirectoryEntry(buffer, 768, "EncryptedPackage", 2, {
    start: 4,
    size: 4096,
  });

  buffer.fill(0xff, 1024, 1536);
  buffer.writeInt32LE(-2, 1024);
  buffer.writeInt32LE(-3, 1028);
  buffer.writeInt32LE(-2, 1032);
  buffer.writeInt32LE(-2, 1036);
  for (let sector = 4; sector < 11; sector += 1) {
    buffer.writeUInt32LE(sector + 1, 1024 + (sector * 4));
  }
  buffer.writeInt32LE(-2, 1024 + (11 * 4));

  buffer.fill(0xff, 1536, 2048);
  buffer.writeInt32LE(-2, 1536);
  buffer.fill(0x45, 2048, 2080);
  buffer.fill(0x50, 2560);
  return buffer;
}

await writeFile("tests/fixtures/encrypted-ooxml.docx", encryptedOoxmlCompound());
await writeFile("tests/fixtures/empty-stream-encrypted-ooxml.docx", emptyStreamEncryptedOoxmlCompound());
const malformedCompound = Buffer.alloc(512);
compoundSignature.copy(malformedCompound);
await writeFile("tests/fixtures/malformed-compound.docx", malformedCompound);
const malformedMarkerCompound = Buffer.alloc(512);
compoundSignature.copy(malformedMarkerCompound);
Buffer.from("EncryptionInfo", "utf16le").copy(malformedMarkerCompound, 128);
Buffer.from("EncryptedPackage", "utf16le").copy(malformedMarkerCompound, 256);
await writeFile("tests/fixtures/malformed-marker-compound.docx", malformedMarkerCompound);
await writeFile("tests/fixtures/empty.txt", "");
await writeFile("tests/fixtures/invalid-utf8.txt", Buffer.from([0xc3, 0x28]));
await writeFile("tests/fixtures/malformed.csv", "source,finding\nS1,\"unterminated\n");
await writeFile("tests/fixtures/malformed.ris", "TY  - JOUR\nTI  - Missing end record\n");
await writeFile("tests/fixtures/malformed.bib", "@article{broken,title={Missing closing braces}\n");
await writeFile("tests/fixtures/evidence.ris", "TY  - JOUR\nTI  - Verified evidence source 2026\nER  -\n");
await writeFile("tests/fixtures/evidence.bib", "@article{verified2026,title={Verified evidence source 2026}}\n");
await writeFile("tests/fixtures/evidence.csv", "source,finding\nS1,Verified evidence source 2026\n");
