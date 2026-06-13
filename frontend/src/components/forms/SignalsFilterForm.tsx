import { FilterBar } from './FilterBar';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface SignalsFilterFormProps {
  params: Record<string, string>;
}

export function SignalsFilterForm({ params }: SignalsFilterFormProps) {
  const isNewest = params.sort === 'newest';

  return (
    <FilterBar>
      {/* Hidden sort value — carried through form submit */}
      <input type="hidden" name="sort" value={params.sort ?? ''} />

      <Select name="signal_type" defaultValue={params.signal_type} className="w-full md:w-auto">
        <option value="">All Types</option>
        <option value="HIRING_SIGNAL">Hiring</option>
        <option value="FUNDING_SIGNAL">Funding</option>
        <option value="SOCIAL_SIGNAL">Social</option>
        <option value="EXPANSION_SIGNAL">Expansion</option>
      </Select>

      <Select name="signal_source" defaultValue={params.signal_source} className="w-full md:w-auto">
        <option value="">All Sources</option>
        <option value="google_jobs">Google Jobs</option>
        <option value="wellfound">Wellfound</option>
        <option value="crunchbase">Crunchbase</option>
        <option value="linkedin">LinkedIn</option>
        <option value="news_api">News API</option>
        <option value="career_page">Career Page</option>
        <option value="twitter">Twitter/X</option>
      </Select>

      <Input name="city" placeholder="City" defaultValue={params.city} className="w-full md:w-auto" />

      <Select name="recency_days" defaultValue={params.recency_days ?? '7'} className="w-full md:w-auto">
        <option value="1">Today</option>
        <option value="3">Last 3 Days</option>
        <option value="7">Last 7 Days</option>
        <option value="14">Last 2 Weeks</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 3 Months</option>
        <option value="">All Time</option>
      </Select>

      <Button type="submit" className="w-full md:w-auto justify-center">Filter</Button>

      {/* Sort toggle links — responsive flex column to row toggles */}
      <div className="flex items-center border border-border rounded-lg overflow-hidden w-full md:w-auto md:ml-2">
        <a
          href={`/signals?${new URLSearchParams({ ...params, sort: 'newest' }).toString()}`}
          className={`flex-1 md:flex-none text-center justify-center px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
            isNewest
              ? 'bg-away text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-background-soft'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isNewest ? 'bg-white animate-pulse' : 'bg-text-secondary'}`} />
          Newly Added
        </a>
        <a
          href={`/signals?${new URLSearchParams({ ...params, sort: '' }).toString()}`}
          className={`flex-1 md:flex-none text-center justify-center px-4 py-2.5 text-sm font-medium border-l border-border transition-colors ${
            !isNewest
              ? 'bg-away text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-background-soft'
          }`}
        >
          By Confidence
        </a>
      </div>
    </FilterBar>
  );
}
