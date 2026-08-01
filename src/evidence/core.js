export const FILE_LIMITS = Object.freeze({
  maxFiles: 10,
  maxFileBytes: 20 * 1024 * 1024,
  maxTotalBytes: 60 * 1024 * 1024,
  allowedExtensions: ["pdf", "docx", "txt", "md", "csv", "ris", "bib"],
});

export function estimateTokens(chars) {
  return Math.ceil(chars / 4);
}

export function calculateEvidenceBudget(sources, budgetChars) {
  const selectedChars = sources
    .filter(source => source.included && source.status === "ready")
    .reduce((sum, source) => sum + (typeof source.text === "string" ? source.text.length : 0), 0);

  return {
    selectedChars,
    estimatedTokens: estimateTokens(selectedChars),
    exceeded: selectedChars > budgetChars,
  };
}

export function escapeSourceText(text) {
  return text.replace(/<\s*\/?\s*source\b[^>]*>/gi, tag => {
    if (/^<\s*\//.test(tag)) return `&lt;${tag.slice(1, -1)}&gt;`;
    return `&lt;${tag.slice(1)}`;
  });
}

function extensionFor(filename) {
  const match = /\.([^.]+)$/.exec(filename ?? "");
  return match?.[1].toLowerCase() ?? "";
}

function fileSize(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function fileIssue(code, file) {
  return { code, filename: typeof file.name === "string" ? file.name : "" };
}

export function validateFileBatch(files, existingSources) {
  const nextFiles = Array.from(files ?? []);
  const existing = Array.from(existingSources ?? []);
  const issues = [];

  if (existing.length + nextFiles.length > FILE_LIMITS.maxFiles) {
    issues.push({ code: "too-many-files" });
  }

  for (const file of nextFiles) {
    const extension = extensionFor(file.name);
    if (extension === "doc") {
      issues.push(fileIssue("legacy-doc-unsupported", file));
    } else if (!FILE_LIMITS.allowedExtensions.includes(extension)) {
      issues.push(fileIssue("unsupported-file-type", file));
    }
    if (fileSize(file.size) > FILE_LIMITS.maxFileBytes) {
      issues.push(fileIssue("file-too-large", file));
    }
  }

  const totalBytes = [...existing, ...nextFiles]
    .reduce((sum, source) => sum + fileSize(source.size), 0);
  if (totalBytes > FILE_LIMITS.maxTotalBytes) {
    issues.push({ code: "total-size-too-large" });
  }

  return issues;
}

export function findLikelyIdentifierKinds(text) {
  const value = typeof text === "string" ? text : "";
  const kinds = [];

  if (/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/i.test(value)) {
    kinds.push("email");
  }
  if (/(?:\+66|0)(?:[\s-]?\d){8,9}(?!\d)|(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/.test(value)) {
    kinds.push("telephone");
  }
  if (/\b(?:hn|hospital\s*(?:number|no\.?))\s*[:#-]?\s*(?=[a-z0-9-]*\d)[a-z0-9-]+/i.test(value)) {
    kinds.push("hospital-number");
  }
  if (/(?<!\d)\d{13}(?!\d)/.test(value)) {
    kinds.push("thai-national-id");
  }

  return kinds;
}

export function createSourceRecord(file, text, warnings) {
  const sourceText = typeof text === "string" ? text : "";

  return {
    filename: typeof file?.name === "string" ? file.name : "",
    size: fileSize(file?.size),
    type: typeof file?.type === "string" ? file.type : "",
    text: sourceText,
    warnings: Array.isArray(warnings) ? [...warnings] : [],
    identifierHints: findLikelyIdentifierKinds(sourceText),
    included: true,
    status: "ready",
  };
}

export function renumberSources(sources) {
  return Array.from(sources ?? [], (source, index) => ({ ...source, id: `S${index + 1}` }));
}
