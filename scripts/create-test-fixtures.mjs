import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph } from "docx";

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
await writeFile("tests/fixtures/evidence.ris", "TY  - JOUR\nTI  - Verified evidence source 2026\nER  -\n");
await writeFile("tests/fixtures/evidence.bib", "@article{verified2026,title={Verified evidence source 2026}}\n");
await writeFile("tests/fixtures/evidence.csv", "source,finding\nS1,Verified evidence source 2026\n");
