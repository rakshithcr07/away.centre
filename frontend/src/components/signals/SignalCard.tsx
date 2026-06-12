import Link from 'next/link';
import { SignalRow } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SignalBadge } from '@/components/badges/SignalBadge';
import { formatSignalSource, formatConfidence } from '@/lib/utils/signals';

interface SignalCardProps {
  signal: SignalRow;
}

export function SignalCard({ signal }: SignalCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <SignalBadge type={signal.signal_type} />
            <Badge variant="default">{formatSignalSource(signal.signal_source)}</Badge>
            
            <span className="text-xs text-text-secondary font-medium">
              Event Date: {new Date(signal.signal_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            
            {signal.created_at && (
              <span className="text-xs text-text-secondary flex items-center gap-1 border-l border-border pl-3">
                <span className="w-1.5 h-1.5 rounded-full bg-away animate-pulse" />
                Appeared: {new Date(signal.created_at).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            )}
          </div>
          
          <p className="text-text-primary text-base font-semibold leading-relaxed mt-1 mb-2">
            {signal.signal_text}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
            <Link 
              href={`/companies/${signal.company_id}`} 
              className="text-text-primary hover:text-away font-bold transition-colors"
            >
              {signal.company_name}
            </Link>
            {signal.city && <span className="border-l border-border pl-4">{signal.city}</span>}
            {signal.industry && <span className="border-l border-border pl-4">{signal.industry}</span>}
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-text-secondary font-medium">Confidence</p>
          <p className="text-2xl font-bold text-away mt-0.5">
            {formatConfidence(signal.confidence_score)}
          </p>
        </div>
      </div>
    </Card>
  );
}
