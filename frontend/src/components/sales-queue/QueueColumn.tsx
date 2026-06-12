import { LucideIcon } from 'lucide-react';
import type { SalesQueueItem } from '@away/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QueueItemCard } from './QueueItemCard';

interface QueueColumnProps {
  title: string;
  icon: LucideIcon;
  color: string;
  headerColor: string;
  items: SalesQueueItem[];
}

export function QueueColumn({ title, icon: Icon, color, headerColor, items }: QueueColumnProps) {
  return (
    <Card className={`border ${color}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${headerColor}`} />
        <h3 className={`font-semibold ${headerColor}`}>{title}</h3>
        <Badge variant="default" className="ml-auto bg-surface-hover text-gray-400">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No items</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <QueueItemCard key={item.company_id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}
