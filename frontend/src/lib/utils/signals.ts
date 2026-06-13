export function getSignalBadgeClass(type: string): string {
  switch (type) {
    case 'HIRING_SIGNAL': return 'badge-hiring';
    case 'FUNDING_SIGNAL': return 'badge-funding';
    case 'SOCIAL_SIGNAL': return 'badge-social';
    case 'EXPANSION_SIGNAL': return 'badge-expansion';
    default: return 'badge-neutral';
  }
}

export function formatSignalType(type: string): string {
  return type.replace('_SIGNAL', '').replace('_', ' ');
}

export function formatSignalSource(source: string): string {
  return source.replace(/_/g, ' ');
}

export function formatConfidence(score: number): string {
  const num = Number(score);
  const percentage = num > 1 ? num : num * 100;
  return `${Math.round(percentage)}%`;
}

