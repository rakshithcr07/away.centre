import { formatSignalType, getSignalBadgeClass } from '@/lib/utils/signals';

interface SignalBadgeProps {
  type: string;
}

export function SignalBadge({ type }: SignalBadgeProps) {
  return (
    <span className={getSignalBadgeClass(type)}>
      {formatSignalType(type)}
    </span>
  );
}
