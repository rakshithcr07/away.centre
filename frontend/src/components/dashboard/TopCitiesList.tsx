import { SectionTitle } from '@/components/ui/SectionTitle';

interface CityCount {
  city: string;
  count: number;
}

interface TopCitiesListProps {
  cities: CityCount[];
}

export function TopCitiesList({ cities }: TopCitiesListProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 hover:shadow-sm transition-shadow duration-200">
      <SectionTitle title="Top Cities" />
      <div className="space-y-3">
        {cities.length === 0 ? (
          <p className="text-text-secondary text-sm">No city data yet</p>
        ) : (
          cities.map((city) => (
            <div key={city.city} className="flex items-center justify-between">
              <span className="text-text-primary">{city.city}</span>
              <span className="text-away font-medium">{city.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
