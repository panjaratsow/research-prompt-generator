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
const encryptedOoxmlSignature = Buffer.alloc(512);
Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(encryptedOoxmlSignature);
await writeFile("tests/fixtures/encrypted-ooxml.docx", encryptedOoxmlSignature);
await writeFile("tests/fixtures/empty.txt", "");
await writeFile("tests/fixtures/invalid-utf8.txt", Buffer.from([0xc3, 0x28]));
await writeFile("tests/fixtures/malformed.csv", "source,finding\nS1,\"unterminated\n");
await writeFile("tests/fixtures/malformed.ris", "TY  - JOUR\nTI  - Missing end record\n");
await writeFile("tests/fixtures/malformed.bib", "@article{broken,title={Missing closing braces}\n");
await writeFile("tests/fixtures/evidence.ris", "TY  - JOUR\nTI  - Verified evidence source 2026\nER  -\n");
await writeFile("tests/fixtures/evidence.bib", "@article{verified2026,title={Verified evidence source 2026}}\n");
await writeFile("tests/fixtures/evidence.csv", "source,finding\nS1,Verified evidence source 2026\n");
