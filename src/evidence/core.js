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
  return text.replaceAll("<SOURCE", "&lt;SOURCE").replaceAll("</SOURCE>", "&lt;/SOURCE&gt;");
}
