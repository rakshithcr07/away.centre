interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={`h-2 bg-background-soft rounded-full overflow-hidden ${className ?? ''}`}>
      <div
        className="h-full bg-away rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
