import { PageHeader, SalesQueueBoard } from '@/components';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function SalesQueuePage() {
  let queue;
  try {
    queue = await api.getSalesQueue();
  } catch {
    queue = { data: [], grouped: { immediate_outreach: [], nurture: [], manual_review: [], ignored: [] } };
  }

  return (
    <div>
      <PageHeader
        title="Sales Queue"
        subtitle="Prioritized outreach based on intent scores"
      />
      <SalesQueueBoard grouped={queue.grouped} />
    </div>
  );
}
