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
    <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background-soft/60 border-b border-border">
            <tr className="text-[10px] uppercase tracking-wider font-extrabold text-text-secondary">
              {['Company', 'Industry', 'City', 'Employees', 'Hiring', 'Signals', 'Intent', 'Fit', 'Timing', 'Overall', 'Product', 'CRM'].map((col) => (
                <th key={col} className="p-4 font-extrabold text-left">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {companies.map((company) => {
              const firstLetter = company.name ? company.name.charAt(0).toUpperCase() : 'C';
              return (
                <tr
                  key={company.id}
                  className="hover:bg-background-soft/30 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-away-50 text-away flex items-center justify-center font-extrabold text-xs border border-away/10 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        {firstLetter}
                      </div>
                      <div>
                        <Link href={`/companies/${company.id}`} className="font-semibold text-text-primary hover:text-away transition-colors block">
                          {company.name}
                        </Link>
                        {company.website && (
                          <div className="mt-0.5">
                            <ExternalLinkLabel href={company.website} />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-text-primary">{company.industry ?? '—'}</td>
                  <td className="p-4 font-medium text-text-secondary">{company.city ?? '—'}</td>
                  <td className="p-4 font-mono font-medium text-text-primary">{company.employee_count?.toLocaleString() ?? '—'}</td>
                  <td className="p-4 font-semibold text-text-secondary text-center md:text-left">{company.hiring_count}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(company.signal_types ?? []).map((type) => (
                        <SignalBadge key={type} type={type} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold"><ScoreValue score={company.intent_score} /></td>
                  <td className="p-4 font-bold"><ScoreValue score={company.fit_score} /></td>
                  <td className="p-4 font-bold"><ScoreValue score={company.timing_score} /></td>
                  <td className="p-4 font-bold"><ScoreValue score={company.overall_score} size="md" /></td>
                  <td className="p-4">
                    {company.recommended_product ? (
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-away bg-away-50 border border-away/10 rounded-md">
                        {company.recommended_product}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-4"><CrmStatusBadge status={company.crm_status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
