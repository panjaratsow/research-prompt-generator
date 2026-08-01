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
