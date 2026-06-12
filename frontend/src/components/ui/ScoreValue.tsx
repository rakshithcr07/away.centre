import { getScoreClass, formatScore } from '@/lib/utils/scores';

interface ScoreValueProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreValue({ score, size = 'sm' }: ScoreValueProps) {
  return (
    <span className={getScoreClass(score, size)}>
      {formatScore(score)}
    </span>
  );
}
