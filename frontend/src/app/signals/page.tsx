import { PageHeader, SignalsFilterForm, SignalList } from '@/components';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SignalsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let result;
  try {
    result = await api.getSignals({
      ...params,
      // default to newest so Signal Explorer opens showing most recently discovered signals
      sort: params.sort ?? 'newest',
    });
  } catch {
    result = { data: [] };
  }

  return (
    <div>
      <PageHeader
        title="Signal Explorer"
        subtitle="Browse and filter buying signals across all sources"
      />

      <SignalsFilterForm params={params} />
      <SignalList signals={result.data} />
    </div>
  );
}
