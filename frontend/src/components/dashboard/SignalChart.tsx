import type { DashboardSummary } from '@away/shared';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SignalBadge } from '@/components/badges/SignalBadge';

interface SignalChartProps {
  signalsByType: DashboardSummary['signals_by_type'];
}

export function SignalChart({ signalsByType }: SignalChartProps) {
  const total = Object.values(signalsByType).reduce((a, b) => a + b, 0) || 1;
  const types = Object.entries(signalsByType) as [string, number][];

  return (
    <div className="bg-white border border-border rounded-2xl p-6 hover:shadow-sm transition-shadow duration-200">
      <SectionTitle title="Signals by Type" />
      <div className="space-y-4">
        {types.map(([type, count]) => (
          <div key={type}>
            <div className="flex items-center justify-between mb-1">
              <SignalBadge type={type} />
              <span className="text-sm text-text-secondary">{count}</span>
            </div>
            <ProgressBar value={count} max={total} />
          </div>
        ))}
      </div>
    </div>
  );
}
