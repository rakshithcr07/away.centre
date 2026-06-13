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
      <Input name="city" placeholder="City" defaultValue={params.city} className="w-full md:w-auto" />
      <Input name="industry" placeholder="Industry" defaultValue={params.industry} className="w-full md:w-auto" />
      <Select name="signal_type" defaultValue={params.signal_type} className="w-full md:w-auto">
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
        className="w-full md:w-28"
      />
      <Button type="submit" className="w-full md:w-auto justify-center">Filter</Button>
    </FilterBar>
  );
}
