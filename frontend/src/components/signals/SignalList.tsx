import { SignalRow } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { SignalCard } from './SignalCard';

interface SignalListProps {
  signals: SignalRow[];
}

export function SignalList({ signals }: SignalListProps) {
  if (signals.length === 0) {
    return <EmptyState message="No signals found. Run the pipeline to collect data." />;
  }

  return (
    <div className="space-y-4">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
