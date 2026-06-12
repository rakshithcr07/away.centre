import type { Score } from '@away/shared';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ScoreValue } from '@/components/ui/ScoreValue';

interface ScoreBreakdownProps {
  score: Score | null;
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  return (
    <Card>
      <SectionTitle title="Scores" />
      {!score ? (
        <p className="text-gray-500">Not scored yet</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Overall</span>
            <ScoreValue score={score.overall_score} size="lg" />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Intent</span>
            <ScoreValue score={score.intent_score} />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fit</span>
            <ScoreValue score={score.fit_score} />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Timing</span>
            <ScoreValue score={score.timing_score} />
          </div>
          {score.score_reasoning && (
            <p className="text-xs text-gray-500 mt-4 border-t border-surface-border pt-3">
              {score.score_reasoning}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
