'use client';

import { useState } from 'react';
import { Phone, Clock, Eye, Ban } from 'lucide-react';
import type { SalesQueueItem } from '@away/shared';
import type { SalesQueueCategory } from '@/lib/types';
import { QueueItemCard } from './QueueItemCard';

const categoryConfig: Record<
  SalesQueueCategory,
  {
    title: string;
    icon: typeof Phone;
    accentColor: string;
    badgeClass: string;
    activeTabBorder: string;
    activeBg: string;
    dotColor: string;
    emptyMsg: string;
  }
> = {
  immediate_outreach: {
    title: 'Immediate Outreach',
    icon: Phone,
    accentColor: 'text-away',
    badgeClass: 'bg-away-100 text-away border-away/20',
    activeTabBorder: 'border-away',
    activeBg: 'bg-away-50 text-away',
    dotColor: 'bg-away',
    emptyMsg: 'No hot leads right now — trigger the pipeline to discover new ones.',
  },
  nurture: {
    title: 'Nurture',
    icon: Clock,
    accentColor: 'text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200',
    activeTabBorder: 'border-amber-500',
    activeBg: 'bg-amber-50 text-amber-600',
    dotColor: 'bg-amber-500',
    emptyMsg: 'No companies in the nurture pipeline yet.',
  },
  manual_review: {
    title: 'Manual Review',
    icon: Eye,
    accentColor: 'text-blue-600',
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200',
    activeTabBorder: 'border-blue-500',
    activeBg: 'bg-blue-50 text-blue-600',
    dotColor: 'bg-blue-500',
    emptyMsg: 'No companies flagged for manual review.',
  },
  ignored: {
    title: 'Ignored',
    icon: Ban,
    accentColor: 'text-gray-500',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
    activeTabBorder: 'border-gray-400',
    activeBg: 'bg-gray-50 text-gray-600',
    dotColor: 'bg-gray-400',
    emptyMsg: 'No companies have been ignored.',
  },
};

interface SalesQueueBoardProps {
  grouped: Record<string, SalesQueueItem[]>;
}

export function SalesQueueBoard({ grouped }: SalesQueueBoardProps) {
  const [activeCategory, setActiveCategory] = useState<SalesQueueCategory>('immediate_outreach');

  const items = grouped[activeCategory] ?? [];
  const cfg = categoryConfig[activeCategory];

  return (
    <div>
      {/* ── Category tab bar ── */}
      <div className="flex overflow-x-auto border-b border-border mb-6">
        {(Object.keys(categoryConfig) as SalesQueueCategory[]).map((cat) => {
          const c = categoryConfig[cat];
          const Icon = c.icon;
          const count = (grouped[cat] ?? []).length;
          const isActive = cat === activeCategory;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2.5 px-6 py-4 whitespace-nowrap text-sm font-medium transition-all border-b-2 ${
                isActive
                  ? `${c.activeTabBorder} ${c.activeBg}`
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background-soft'
              }`}
            >
              {/* Live pulse for immediate outreach when there are items */}
              {cat === 'immediate_outreach' && count > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-away opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-away" />
                </span>
              )}
              <Icon className="w-4 h-4" />
              <span>{c.title}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                  isActive ? c.badgeClass : 'bg-background-soft text-text-secondary border-border'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Results count ── */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-text-secondary">
            {items.length} {items.length === 1 ? 'company' : 'companies'} · sorted by intent score
          </p>
          <p className={`text-xs font-semibold flex items-center gap-1.5 ${cfg.accentColor}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
            {cfg.title}
          </p>
        </div>
      )}

      {/* ── Item list or empty state ── */}
      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-background-soft">
          <cfg.icon className={`w-10 h-10 mx-auto mb-3 opacity-30 ${cfg.accentColor}`} />
          <p className="text-text-primary font-semibold mb-1">Nothing here yet</p>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">{cfg.emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <QueueItemCard
              key={item.company_id}
              item={item}
              rank={idx + 1}
              accentColor={cfg.accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
