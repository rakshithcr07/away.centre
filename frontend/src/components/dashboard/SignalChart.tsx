import type { DashboardSummary } from '@away/shared';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SignalBadge } from '@/components/badges/SignalBadge';
import { BarChart3 } from 'lucide-react';

interface SignalChartProps {
  signalsByType: DashboardSummary['signals_by_type'];
}

const signalColorMap: Record<string, string> = {
  HIRING_SIGNAL: 'bg-away',
  FUNDING_SIGNAL: 'bg-emerald-500',
  SOCIAL_SIGNAL: 'bg-purple-500',
  EXPANSION_SIGNAL: 'bg-amber-500',
};

export function SignalChart({ signalsByType }: SignalChartProps) {
  const total = Object.values(signalsByType).reduce((a, b) => a + b, 0) || 1;
  const types = Object.entries(signalsByType) as [string, number][];

  return (
    <div className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-2.5 mb-6 text-away">
        <BarChart3 className="w-5 h-5" />
        <SectionTitle title="Signals by Type" className="mb-0 text-text-primary" />
      </div>
      <div className="space-y-6">
        {types.map(([type, count]) => {
          const barColor = signalColorMap[type] || 'bg-away';
          return (
            <div key={type} className="group/item">
              <div className="flex items-center justify-between mb-2">
                <SignalBadge type={type} />
                <span className="text-xs font-extrabold text-text-primary bg-background-soft border border-border/40 px-2 py-0.5 rounded-lg group-hover/item:text-away transition-colors">
                  {count}
                </span>
              </div>
              <ProgressBar value={count} max={total} barClassName={barColor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
