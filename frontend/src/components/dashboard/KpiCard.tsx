import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { KpiColor } from '@/lib/types';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: KpiColor;
}

const colorMap: Record<KpiColor, string> = {
  green: 'bg-away-50 text-away',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'green' }: KpiCardProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-4xl font-bold text-text-primary mt-2">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
