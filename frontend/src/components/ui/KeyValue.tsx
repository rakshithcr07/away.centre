import { ReactNode } from 'react';

interface KeyValueProps {
  label: string;
  value: ReactNode;
}

export function KeyValue({ label, value }: KeyValueProps) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-gray-200 text-sm mt-0.5">{value ?? <span className="text-gray-400">—</span>}</div>
    </div>
  );
}
