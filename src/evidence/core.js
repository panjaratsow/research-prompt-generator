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

export function getEvidenceBudgetContributors(sources) {
  return Array.from(sources ?? [])
    .filter(source => source.included && source.status === "ready")
    .map(source => ({
      sourceId: source.id,
      characters: typeof source.text === "string" ? source.text.length : 0,
    }));
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

function countsTowardFileLimits(source) {
  return !["error", "excluded"].includes(source?.status);
}

function rejectionCode(file) {
  const extension = extensionFor(file?.name);
  if (extension === "doc") return "legacy-doc-unsupported";
  if (!FILE_LIMITS.allowedExtensions.includes(extension)) return "unsupported-file-type";
  if (!hasValidFileSize(file?.size)) return "invalid-file-size";
  if (file.size > FILE_LIMITS.maxFileBytes) return "file-too-large";
  return "";
}

export function partitionFileBatch(files, existingSources) {
  const accepted = [];
  const rejected = [];
  const issues = [];
  const existing = Array.from(existingSources ?? []);
  let retainedCount = existing.length;
  let acceptedBytes = existing
    .filter(countsTowardFileLimits)
    .filter(source => hasValidFileSize(source.size))
    .reduce((sum, source) => sum + source.size, 0);

  for (const file of Array.from(files ?? [])) {
    if (retainedCount >= FILE_LIMITS.maxFiles) {
      if (!issues.some(issue => issue.code === "too-many-files")) issues.push({ code: "too-many-files" });
      continue;
    }
    retainedCount += 1;
    const fileError = rejectionCode(file);
    if (fileError) {
      rejected.push({ file, code: fileError });
      continue;
    }
    if (acceptedBytes + file.size > FILE_LIMITS.maxTotalBytes) {
      rejected.push({ file, code: "total-size-too-large" });
      continue;
    }
    accepted.push(file);
    acceptedBytes += file.size;
  }

  return { accepted, rejected, issues };
}

export function validateFileBatch(files, existingSources) {
  const nextFiles = Array.from(files ?? []);
  const existing = Array.from(existingSources ?? []);
  const partition = partitionFileBatch(nextFiles, existing);
  const issues = [
    ...partition.issues,
    ...partition.rejected.map(({ file, code }) => ({ code, index: nextFiles.indexOf(file) })),
  ];
  const invalidExisting = existing
    .map((source, index) => ({ source, index }))
    .filter(({ source }) => !hasValidFileSize(source.size));
  for (const { source, index } of invalidExisting) {
    issues.push(invalidSizeIssue(source, index, true));
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

let sourceKeySequence = 0;

export function createSourceKey() {
  sourceKeySequence += 1;
  return `source-${sourceKeySequence}`;
}

export function renumberSources(sources) {
  return Array.from(sources ?? [], (source, index) => ({
    ...source,
    _key: typeof source?._key === "string" && source._key ? source._key : createSourceKey(),
    id: `S${index + 1}`,
  }));
}

export function mergeSourceUpdates(currentSources, updates) {
  const byKey = new Map(Array.from(updates ?? [], update => [update._key, update]));
  return Array.from(currentSources ?? [], source => {
    const update = byKey.get(source._key);
    return update ? { ...source, ...update, _key: source._key, id: source.id } : source;
  });
}
