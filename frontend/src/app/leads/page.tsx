import { PageHeader, LeadsTable, LeadsFilterForm, Pagination } from '@/components';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let result;
  try {
    result = await api.getCompanies({
      limit: '50',
      sort: 'overall_score',
      order: 'desc',
      ...params,
    });
  } catch {
    result = { data: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${result.pagination.total} companies tracked`}
      />

      <LeadsFilterForm params={params} />
      <LeadsTable companies={result.data} />
      <Pagination page={result.pagination.page} totalPages={result.pagination.total_pages} />
    </div>
  );
}
