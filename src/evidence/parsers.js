const PLAIN_TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "ris", "bib"]);
const STABLE_ERROR_CODES = new Set([
  "empty-text", "invalid-utf8", "malformed-csv", "malformed-ris", "malformed-bib",
  "image-only-pdf", "image-only-docx", "encrypted-pdf", "encrypted-docx",
]);
const COMPOUND_FILE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

function extensionFor(filename) {
  const match = /\.([^.]+)$/.exec(filename ?? "");
  return match?.[1].toLowerCase() ?? "";
}

function parserError(code) {
  return Object.freeze({ code });
}

function errorCodeFor(error) {
  if (STABLE_ERROR_CODES.has(error?.code)) return error.code;
  return error?.name === "PasswordException" ? "encrypted-pdf" : "malformed-file";
}

function isCompoundFile(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, COMPOUND_FILE_SIGNATURE.length));
  return bytes.length === COMPOUND_FILE_SIGNATURE.length
    && COMPOUND_FILE_SIGNATURE.every((value, index) => bytes[index] === value);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
      continue;
    }
    if (character === '"' && field === "") quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw parserError("malformed-csv");
  row.push(field);
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length < 2 || rows[0].length < 2 || rows.some(candidate => candidate.length !== rows[0].length)) {
    throw parserError("malformed-csv");
  }
}

function validateRis(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2 || !/^TY  -\s*\S+/.test(lines[0]) || !/^ER  -\s*$/.test(lines.at(-1))) {
    throw parserError("malformed-ris");
  }
  if (lines.some(line => !/^[A-Z0-9]{2}  -(?:\s.*)?$/.test(line))) {
    throw parserError("malformed-ris");
  }
}

function validateBibtex(text) {
  let cursor = 0;
  let entries = 0;
  while (cursor < text.length) {
    while (/\s/.test(text[cursor] ?? "")) cursor += 1;
    if (cursor >= text.length) break;
    const header = /^@[A-Za-z][A-Za-z0-9_-]*\s*([({])/.exec(text.slice(cursor));
    if (!header) throw parserError("malformed-bib");
    const openingIndex = cursor + header[0].length - 1;
    const stack = [header[1]];
    let quoted = false;
    let escaped = false;
    let end = -1;
    for (let index = openingIndex + 1; index < text.length; index += 1) {
      const character = text[index];
      if (escaped) { escaped = false; continue; }
      if (character === "\\") { escaped = true; continue; }
      if (character === '"') { quoted = !quoted; continue; }
      if (quoted) continue;
      if (character === "{" || character === "(") stack.push(character);
      if (character === "}" || character === ")") {
        const expected = character === "}" ? "{" : "(";
        if (stack.at(-1) !== expected) throw parserError("malformed-bib");
        stack.pop();
        if (!stack.length) { end = index; break; }
      }
    }
    if (end < 0 || !text.slice(openingIndex + 1, end).includes(",")) throw parserError("malformed-bib");
    entries += 1;
    cursor = end + 1;
  }
  if (!entries) throw parserError("malformed-bib");
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
  if (!text) throw parserError("image-only-pdf");
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
    text: (() => {
      const text = result.value.trim();
      if (!text) throw parserError("image-only-docx");
      return text;
    })(),
    warnings: result.messages.map(message => message.type),
  };
}

export async function parsePlainText(arrayBuffer, format = "txt") {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(arrayBuffer).trim();
  } catch {
    throw parserError("invalid-utf8");
  }
  if (!text) throw parserError("empty-text");
  if (format === "csv") parseCsv(text);
  if (format === "ris") validateRis(text);
  if (format === "bib") validateBibtex(text);
  return {
    text,
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
      if (isCompoundFile(arrayBuffer)) throw parserError("encrypted-docx");
      return await parseDocx(arrayBuffer, dependencies.mammoth);
    }
    return await parsePlainText(arrayBuffer, extension);
  } catch (error) {
    throw parserError(errorCodeFor(error));
  }
}
