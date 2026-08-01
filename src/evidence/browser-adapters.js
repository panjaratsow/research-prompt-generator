import * as pdfjs from "../../vendor/pdf.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("../../vendor/pdf.worker.mjs", import.meta.url).href;

export const PARSER_DEPENDENCIES = Object.freeze({
  pdfjs,
  mammoth: globalThis.mammoth,
  pdfResources: {
    cMapUrl: new URL("../../vendor/cmaps/", import.meta.url).href,
    cMapPacked: true,
    standardFontDataUrl: new URL("../../vendor/standard_fonts/", import.meta.url).href,
    wasmUrl: new URL("../../vendor/wasm/", import.meta.url).href,
  },
});
