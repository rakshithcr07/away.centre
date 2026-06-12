export function getScoreClass(score: number | null, size: 'sm' | 'md' | 'lg' = 'sm'): string {
  const sizeClass = size === 'lg' ? 'text-2xl font-semibold' : size === 'md' ? 'text-lg font-semibold' : '';
  if (score === null) return `text-gray-400 ${sizeClass}`.trim();
  if (score >= 75) return `score-high ${sizeClass}`.trim();
  if (score >= 50) return `score-medium ${sizeClass}`.trim();
  return `score-low ${sizeClass}`.trim();
}

export function formatScore(score: number | null): string {
  return score === null ? '—' : String(score);
}
