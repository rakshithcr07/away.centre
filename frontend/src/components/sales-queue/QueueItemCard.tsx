'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  Calendar,
  Zap,
  Package,
  BarChart3,
} from 'lucide-react';
import type { SalesQueueItem } from '@away/shared';

const SUBTABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'signals', label: 'Signals', icon: TrendingUp },
  { id: 'action', label: 'Next Action', icon: MessageSquare },
] as const;

type SubTabId = (typeof SUBTABS)[number]['id'];

interface QueueItemCardProps {
  item: SalesQueueItem;
  rank: number;
  accentColor: string;
}

function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 80
      ? { wrapper: 'text-away bg-away-50 border-away/20', label: 'Hot' }
      : score >= 60
      ? { wrapper: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Warm' }
      : score >= 40
      ? { wrapper: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Cool' }
      : { wrapper: 'text-gray-500 bg-gray-50 border-gray-200', label: 'Cold' };

  return (
    <div
      className={`flex flex-col items-center justify-center w-20 h-16 rounded-xl border-2 font-bold flex-shrink-0 ${style.wrapper}`}
    >
      <span className="text-2xl leading-none">{score}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">
        {style.label}
      </span>
    </div>
  );
}

export function QueueItemCard({ item, rank, accentColor }: QueueItemCardProps) {
  const [activeTab, setActiveTab] = useState<SubTabId>('overview');

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-away/20 transition-all duration-200">

      {/* ── Card Header ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Rank badge */}
        <div className="w-7 h-7 rounded-full bg-background-soft flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0 border border-border">
          {rank}
        </div>

        {/* Company name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/companies/${item.company_id}`}
              className="font-semibold text-text-primary hover:text-away transition-colors"
            >
              {item.company_name}
            </Link>
            <ExternalLink className="w-3 h-3 text-text-secondary flex-shrink-0" />
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Zap className="w-3 h-3" />
              {item.signal_count} signals
            </span>
            {item.recommended_product && (
              <>
                <span className="text-border">·</span>
                <span className={`flex items-center gap-1 text-xs font-semibold ${accentColor}`}>
                  <Package className="w-3 h-3" />
                  {item.recommended_product}
                </span>
              </>
            )}
            {item.latest_signal_date && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.latest_signal_date)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Score */}
        <ScoreBadge score={item.overall_score} />
      </div>

      {/* ── Subtab bar ── */}
      <div className="flex border-t border-border bg-background-soft">
        {SUBTABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium transition-all border-b-2 ${
              activeTab === id
                ? 'border-away bg-white text-away'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Subtab content ── */}
      <div className="px-5 py-4 bg-white">

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
                Intent Score
              </p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-text-primary">{item.overall_score}</span>
                <span className="text-xs text-text-secondary mb-0.5">/ 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
                Signals Found
              </p>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-away" />
                <span className="text-xl font-bold text-text-primary">{item.signal_count}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
                Recommended Product
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {item.recommended_product ?? '—'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
                Latest Signal
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {formatDate(item.latest_signal_date)}
              </p>
            </div>
          </div>
        )}

        {/* Signals tab */}
        {activeTab === 'signals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background-soft rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-away" />
                <span className="text-sm text-text-primary font-medium">
                  {item.signal_count} intent signal{item.signal_count !== 1 ? 's' : ''} detected
                </span>
              </div>
              <Link
                href={`/signals?sort=newest`}
                className="text-xs text-away hover:underline flex items-center gap-1 font-medium"
              >
                View in Signal Explorer
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {item.latest_signal_date && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>
                  Most recent signal on{' '}
                  <span className="text-text-primary font-semibold">
                    {formatDate(item.latest_signal_date)}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Next Action tab */}
        {activeTab === 'action' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-background-soft rounded-xl border border-border">
              <MessageSquare className="w-4 h-4 text-away mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary mb-1">
                  Recommended Action
                </p>
                <p className="text-sm text-text-primary leading-relaxed">{item.next_action}</p>
              </div>
            </div>

            <Link
              href={`/companies/${item.company_id}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-away/30 text-away text-sm font-semibold hover:bg-away-50 transition-colors"
            >
              View Full Company Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
