import {
  PageHeader,
  DashboardKpiGrid,
  SignalChart,
  TopCitiesList,
  LeadsTable,
} from '@/components';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@away/shared';

export const dynamic = 'force-dynamic';

const emptySummary: DashboardSummary = {
  high_intent_leads: 0,
  new_signals: 0,
  qualified_accounts: 0,
  leads_sent_to_crm: 0,
  conversion_rate: 0,
  signals_by_type: {
    HIRING_SIGNAL: 0,
    FUNDING_SIGNAL: 0,
    SOCIAL_SIGNAL: 0,
    EXPANSION_SIGNAL: 0,
  },
  top_cities: [],
};

export default async function DashboardPage() {
  let summary = emptySummary;
  let companies: Awaited<ReturnType<typeof api.getCompanies>> = {
    data: [],
    pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
  };

  try {
    [summary, companies] = await Promise.all([
      api.getDashboardSummary(),
      api.getCompanies({ limit: '10', sort: 'overall_score', order: 'desc' }),
    ]);
  } catch {
    // graceful fallback when API unavailable
  }

  return (
    <div>
      <PageHeader showActions={false} />

      {/* KPI Section */}
      <section className="px-6 mb-8">
        <DashboardKpiGrid summary={summary} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 mb-8">
        <div className="lg:col-span-2">
          <SignalChart signalsByType={summary.signals_by_type} />
        </div>
        <TopCitiesList cities={summary.top_cities} />
      </div>

      {/* Leads Table */}
      <div className="px-6 pb-12">
        <h2 className="section-title mb-6">Top Scored Leads</h2>
        <LeadsTable companies={companies.data} />
      </div>
    </div>
  );
}
