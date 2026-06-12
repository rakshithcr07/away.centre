import { Target, Radio, Building2, Send, TrendingUp } from 'lucide-react';
import type { DashboardSummary } from '@away/shared';
import { KpiCard } from './KpiCard';

interface DashboardKpiGridProps {
  summary: DashboardSummary;
}

export function DashboardKpiGrid({ summary }: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <KpiCard title="High Intent Leads" value={summary.high_intent_leads} subtitle="Score ≥ 75" icon={Target} color="green" />
      <KpiCard title="New Signals" value={summary.new_signals} subtitle="Last 7 days" icon={Radio} color="blue" />
      <KpiCard title="Qualified Accounts" value={summary.qualified_accounts} icon={Building2} color="amber" />
      <KpiCard title="Leads Sent to CRM" value={summary.leads_sent_to_crm} icon={Send} color="purple" />
      <KpiCard title="Conversion Rate" value={`${summary.conversion_rate}%`} icon={TrendingUp} color="green" />
    </div>
  );
}
