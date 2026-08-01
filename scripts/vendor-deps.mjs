import { access, copyFile, cp, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";

const copies = [
  ["node_modules/pdfjs-dist/build/pdf.mjs", "vendor/pdf.mjs"],
  ["node_modules/pdfjs-dist/build/pdf.worker.mjs", "vendor/pdf.worker.mjs"],
  ["node_modules/mammoth/mammoth.browser.min.js", "vendor/mammoth.browser.min.js"],
  ["node_modules/lucide-static/icons/upload.svg", "vendor/icons/upload.svg"],
  ["node_modules/lucide-static/icons/trash-2.svg", "vendor/icons/trash-2.svg"],
  ["node_modules/lucide-static/icons/copy.svg", "vendor/icons/copy.svg"],
  ["node_modules/lucide-static/icons/download.svg", "vendor/icons/download.svg"],
  ["node_modules/lucide-static/icons/rotate-ccw.svg", "vendor/icons/rotate-ccw.svg"],
  ["node_modules/lucide-static/icons/x.svg", "vendor/icons/x.svg"],
  ["node_modules/lucide-static/icons/panel-right-open.svg", "vendor/icons/panel-right-open.svg"],
  ["node_modules/lucide-static/icons/circle-check.svg", "vendor/icons/circle-check.svg"],
  ["node_modules/lucide-static/icons/triangle-alert.svg", "vendor/icons/triangle-alert.svg"],
];

const directories = [
  ["node_modules/pdfjs-dist/cmaps", "vendor/cmaps"],
  ["node_modules/pdfjs-dist/standard_fonts", "vendor/standard_fonts"],
  ["node_modules/pdfjs-dist/wasm", "vendor/wasm"],
];

await Promise.all([...copies, ...directories].map(([source]) => access(source)));

for (const [source, destination] of copies) {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

for (const [source, destination] of directories) {
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
}
