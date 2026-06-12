import type { Signal } from '@away/shared';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SignalBadge } from '@/components/badges/SignalBadge';

interface SignalTimelineProps {
  signals: Signal[];
}

export function SignalTimeline({ signals }: SignalTimelineProps) {
  return (
    <Card>
      <SectionTitle title="Signal Timeline" />
      <div className="space-y-4">
        {signals.length === 0 ? (
          <p className="text-gray-500 text-sm">No signals</p>
        ) : (
          signals.map((signal) => (
            <div key={signal.id} className="border-l-2 border-away-600 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <SignalBadge type={signal.signal_type} />
                <span className="text-xs text-gray-500">
                  {new Date(signal.signal_date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{signal.signal_text}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
