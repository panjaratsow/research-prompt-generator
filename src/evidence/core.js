export const FILE_LIMITS = Object.freeze({
  maxFiles: 10,
  maxFileBytes: 20 * 1024 * 1024,
  maxTotalBytes: 60 * 1024 * 1024,
  allowedExtensions: Object.freeze(["pdf", "docx", "txt", "md", "csv", "ris", "bib"]),
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

function hasValidFileSize(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function invalidSizeIssue(source, index, existing) {
  if (existing && typeof source.id === "string" && source.id) {
    return { code: "invalid-file-size", sourceId: source.id };
  }
  return { code: "invalid-file-size", index };
}

export function validateFileBatch(files, existingSources) {
  const nextFiles = Array.from(files ?? []);
  const existing = Array.from(existingSources ?? []);
  const issues = [];

  if (existing.length + nextFiles.length > FILE_LIMITS.maxFiles) {
    issues.push({ code: "too-many-files" });
  }

  for (const [index, file] of nextFiles.entries()) {
    const extension = extensionFor(file.name);
    if (extension === "doc") {
      issues.push({ code: "legacy-doc-unsupported", index });
    } else if (!FILE_LIMITS.allowedExtensions.includes(extension)) {
      issues.push({ code: "unsupported-file-type", index });
    }
    if (!hasValidFileSize(file.size)) {
      issues.push(invalidSizeIssue(file, index, false));
    } else if (file.size > FILE_LIMITS.maxFileBytes) {
      issues.push({ code: "file-too-large", index });
    }
  }

  const sources = [...existing, ...nextFiles];
  const invalidExisting = existing
    .map((source, index) => ({ source, index }))
    .filter(({ source }) => !hasValidFileSize(source.size));
  for (const { source, index } of invalidExisting) {
    issues.push(invalidSizeIssue(source, index, true));
  }
  if (!invalidExisting.length && nextFiles.every(file => hasValidFileSize(file.size))) {
    const totalBytes = sources.reduce((sum, source) => sum + source.size, 0);
    if (totalBytes > FILE_LIMITS.maxTotalBytes) {
      issues.push({ code: "total-size-too-large" });
    }
  }

  return issues;
}

export function findLikelyIdentifierKinds(text) {
  const value = typeof text === "string" ? text : "";
  const kinds = [];

  if (/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/i.test(value)) {
    kinds.push("email");
  }
  if (/(?<![a-z0-9])(?:(?:\+66|0)(?:[\s-]?\d){8,9}|(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}|\d{10})(?![a-z0-9])/i.test(value)) {
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
    size: file?.size,
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
