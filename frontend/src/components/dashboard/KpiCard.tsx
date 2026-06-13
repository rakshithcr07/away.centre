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

const colorMap: Record<KpiColor, { bg: string; icon: string; border: string; glow: string; text: string }> = {
  green: {
    bg: 'bg-away-50/20',
    icon: 'text-away bg-away-50 border border-away/10',
    border: 'border-away-100',
    glow: 'hover:shadow-away-100/30',
    text: 'text-away',
  },
  blue: {
    bg: 'bg-blue-50/20',
    icon: 'text-blue-600 bg-blue-50 border border-blue-200/40',
    border: 'border-blue-100',
    glow: 'hover:shadow-blue-100/30',
    text: 'text-blue-600',
  },
  amber: {
    bg: 'bg-amber-50/20',
    icon: 'text-amber-600 bg-amber-50 border border-amber-200/40',
    border: 'border-amber-100',
    glow: 'hover:shadow-amber-100/30',
    text: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50/20',
    icon: 'text-purple-600 bg-purple-50 border border-purple-200/40',
    border: 'border-purple-100',
    glow: 'hover:shadow-purple-100/30',
    text: 'text-purple-600',
  },
};

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'green' }: KpiCardProps) {
  const styles = colorMap[color];
  return (
    <div className={clsx(
      'group relative bg-white border border-border rounded-2xl p-6 transition-all duration-300 ease-out',
      'hover:-translate-y-1 hover:shadow-lg hover:border-transparent',
      styles.glow
    )}>
      {/* Background glow shape inside the card */}
      <div className={clsx(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
        styles.bg
      )} />
      
      <div className="relative flex items-start justify-between z-10">
        <div className="space-y-1.5">
          <p className="text-[10px] tracking-wider text-text-secondary font-extrabold flex items-center gap-1.5 uppercase">
            {title}
          </p>
          <p className={clsx("text-4xl font-extrabold tracking-tight text-text-primary", styles.text)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] font-bold text-text-secondary bg-background-soft px-2 py-0.5 rounded-md inline-block border border-border/40">
              {subtitle}
            </p>
          )}
        </div>
        <div className={clsx(
          'p-3.5 rounded-xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 shadow-sm',
          styles.icon
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
