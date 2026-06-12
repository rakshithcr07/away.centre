import { FilterBar } from './FilterBar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface LeadsFilterFormProps {
  params: Record<string, string>;
}

export function LeadsFilterForm({ params }: LeadsFilterFormProps) {
  return (
    <FilterBar>
      <Input name="city" placeholder="City" defaultValue={params.city} />
      <Input name="industry" placeholder="Industry" defaultValue={params.industry} />
      <Select name="signal_type" defaultValue={params.signal_type}>
        <option value="">All Signal Types</option>
        <option value="HIRING_SIGNAL">Hiring</option>
        <option value="FUNDING_SIGNAL">Funding</option>
        <option value="SOCIAL_SIGNAL">Social</option>
        <option value="EXPANSION_SIGNAL">Expansion</option>
      </Select>
      <Input
        name="min_score"
        type="number"
        placeholder="Min Score"
        defaultValue={params.min_score}
        className="w-28"
      />
      <Button type="submit">Filter</Button>
    </FilterBar>
  );
}
