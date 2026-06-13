import { SectionTitle } from '@/components/ui/SectionTitle';
import { MapPin } from 'lucide-react';

interface CityCount {
  city: string;
  count: number;
}

interface TopCitiesListProps {
  cities: CityCount[];
}

export function TopCitiesList({ cities }: TopCitiesListProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-6 text-away">
          <MapPin className="w-5 h-5" />
          <SectionTitle title="Top Cities" className="mb-0 text-text-primary" />
        </div>
        <div className="space-y-2.5">
          {cities.length === 0 ? (
            <div className="text-center py-8 bg-background-soft rounded-xl border border-dashed border-border/60">
              <p className="text-text-secondary text-sm">No city data yet</p>
            </div>
          ) : (
            cities.map((city, idx) => (
              <div 
                key={city.city} 
                className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-background-soft/40 hover:bg-away-50/10 hover:border-away-100 transition-all duration-200 group/city"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-background border border-border/60 text-[10px] font-extrabold text-text-secondary group-hover/city:border-away/30 group-hover/city:text-away transition-colors">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-text-primary group-hover/city:text-away transition-colors">
                    {city.city}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-secondary bg-white border border-border/60 px-2 py-0.5 rounded-lg group-hover/city:border-away/30 group-hover/city:text-away transition-all">
                    {city.count} {city.count === 1 ? 'lead' : 'leads'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
