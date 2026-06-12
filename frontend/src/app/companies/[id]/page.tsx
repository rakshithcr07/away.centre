import {
  PageHeader,
  CompanyOverview,
  ScoreBreakdown,
  OutreachCard,
  SignalTimeline,
  ContactList,
} from '@/components';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  let company;
  try {
    company = await api.getCompany(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={company.name}
        subtitle={[company.industry, company.city, company.country].filter(Boolean).join(' · ')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <CompanyOverview company={company} />
        <ScoreBreakdown score={company.score} />
      </div>

      {company.outreach && <OutreachCard outreach={company.outreach} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalTimeline signals={company.signals} />
        <ContactList contacts={company.contacts} />
      </div>
    </div>
  );
}
