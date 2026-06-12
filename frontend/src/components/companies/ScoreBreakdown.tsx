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
        <p className="text-text-secondary">Not scored yet</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary font-medium">Overall</span>
            <ScoreValue score={score.overall_score} size="lg" />
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Intent</span>
            <ScoreValue score={score.intent_score} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Fit</span>
            <ScoreValue score={score.fit_score} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Timing</span>
            <ScoreValue score={score.timing_score} />
          </div>
          {score.score_reasoning && (
            <p className="text-xs text-text-secondary mt-4 border-t border-border pt-3">
              {score.score_reasoning}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
