import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <Card className="mb-6">
      <form method="get" className="flex flex-wrap gap-4">
        {children}
      </form>
    </Card>
  );
}
