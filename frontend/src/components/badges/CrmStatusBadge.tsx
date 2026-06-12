import { Badge } from '@/components/ui/Badge';

interface CrmStatusBadgeProps {
  status: string | null;
}

export function CrmStatusBadge({ status }: CrmStatusBadgeProps) {
  const value = status ?? 'pending';

  const variant =
    value === 'synced' ? 'success' :
    value === 'failed' ? 'danger' :
    value === 'dead_letter' ? 'warning' :
    'default';

  return <Badge variant={variant}>{value.replace('_', ' ')}</Badge>;
}
