interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ value, max = 100, className, barClassName = 'bg-away' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={`h-2.5 bg-background-soft rounded-full overflow-hidden border border-border/20 ${className ?? ''}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
