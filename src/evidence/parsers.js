const PLAIN_TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "ris", "bib"]);

function extensionFor(filename) {
  const match = /\.([^.]+)$/.exec(filename ?? "");
  return match?.[1].toLowerCase() ?? "";
}

function parserError(code) {
  return Object.freeze({ code });
}

function errorCodeFor(error) {
  return error?.name === "PasswordException" ? "encrypted-pdf" : "malformed-file";
}

export async function parsePdf(arrayBuffer, pdfjs, resourceUrls = {}) {
  const task = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    ...resourceUrls,
  });
  const document = await task.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
  }

  const text = pages.join("\n\n").trim();
  return { text, warnings: text.length < 40 ? ["image-only-or-empty-pdf"] : [] };
}

export async function parseDocx(arrayBuffer, mammoth) {
  let result;
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (error) {
    if (error?.message !== "Could not find file in options" || typeof Buffer === "undefined") {
      throw error;
    }
    result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
  }
  return {
    text: result.value.trim(),
    warnings: result.messages.map(message => message.type),
  };
}

export async function parsePlainText(arrayBuffer) {
  return {
    text: new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer).trim(),
    warnings: [],
  };
}

export async function parseEvidenceFile(file, dependencies = {}) {
  const extension = extensionFor(file?.name);
  if (!["pdf", "docx", ...PLAIN_TEXT_EXTENSIONS].includes(extension)) {
    throw parserError("unsupported-file");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (extension === "pdf") {
      return await parsePdf(arrayBuffer, dependencies.pdfjs, dependencies.pdfResources);
    }
    if (extension === "docx") {
      return await parseDocx(arrayBuffer, dependencies.mammoth);
    }
    return await parsePlainText(arrayBuffer);
  } catch (error) {
    throw parserError(errorCodeFor(error));
  }
}
