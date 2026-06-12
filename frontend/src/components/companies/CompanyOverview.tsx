import type { CompanyWithDetails } from '@away/shared';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { KeyValue } from '@/components/ui/KeyValue';
import { ExternalLinkLabel } from '@/components/ui/ExternalLinkLabel';

interface CompanyOverviewProps {
  company: CompanyWithDetails;
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  return (
    <Card className="lg:col-span-2">
      <SectionTitle title="Company Overview" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KeyValue
          label="Website"
          value={company.website ? <ExternalLinkLabel href={company.website} /> : null}
        />
        <KeyValue label="Employees" value={company.employee_count?.toLocaleString()} />
        <KeyValue label="Hiring Count" value={company.hiring_count} />
        <KeyValue label="Funding Stage" value={company.funding_stage} />
        <KeyValue label="CRM Status" value={company.crm_record?.status ?? 'pending'} />
        <KeyValue label="Assigned Rep" value={company.crm_record?.assigned_salesperson} />
      </div>
    </Card>
  );
}
