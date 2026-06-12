import { ReactNode } from 'react';

interface KeyValueProps {
  label: string;
  value: ReactNode;
}

export function KeyValue({ label, value }: KeyValueProps) {
  return (
    <div>
      <p className="text-xs text-text-secondary font-medium">{label}</p>
      <div className="text-text-primary text-sm mt-0.5 font-semibold">{value ?? <span className="text-text-secondary/60">—</span>}</div>
    </div>
  );
}
