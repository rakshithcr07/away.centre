import Link from 'next/link';
import { CompanyRow } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScoreValue } from '@/components/ui/ScoreValue';
import { ExternalLinkLabel } from '@/components/ui/ExternalLinkLabel';
import { SignalBadge } from '@/components/badges/SignalBadge';
import { CrmStatusBadge } from '@/components/badges/CrmStatusBadge';

interface LeadsTableProps {
  companies: CompanyRow[];
}

export function LeadsTable({ companies }: LeadsTableProps) {
  if (companies.length === 0) {
    return <EmptyState message="No companies found. Run the pipeline to collect signals." />;
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-border text-text-secondary">
              {['Company', 'Industry', 'City', 'Employees', 'Hiring', 'Signals', 'Intent', 'Fit', 'Timing', 'Overall', 'Product', 'CRM'].map((col) => (
                <th key={col} className="text-left p-4 font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr
                key={company.id}
                className="border-b border-border/50 hover:bg-background-soft transition-colors"
              >
                <td className="p-4">
                  <Link href={`/companies/${company.id}`} className="font-medium text-text-primary hover:text-away">
                    {company.name}
                  </Link>
                  {company.website && (
                    <div className="mt-0.5">
                      <ExternalLinkLabel href={company.website} />
                    </div>
                  )}
                </td>
                <td className="p-4 text-text-primary">{company.industry ?? '—'}</td>
                <td className="p-4 text-text-primary">{company.city ?? '—'}</td>
                <td className="p-4 text-text-primary">{company.employee_count?.toLocaleString() ?? '—'}</td>
                <td className="p-4 text-text-primary">{company.hiring_count}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(company.signal_types ?? []).map((type) => (
                      <SignalBadge key={type} type={type} />
                    ))}
                  </div>
                </td>
                <td className="p-4"><ScoreValue score={company.intent_score} /></td>
                <td className="p-4"><ScoreValue score={company.fit_score} /></td>
                <td className="p-4"><ScoreValue score={company.timing_score} /></td>
                <td className="p-4"><ScoreValue score={company.overall_score} size="md" /></td>
                <td className="p-4 text-text-primary text-xs">{company.recommended_product ?? '—'}</td>
                <td className="p-4"><CrmStatusBadge status={company.crm_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
