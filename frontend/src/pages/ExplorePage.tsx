import { useState, useRef, useEffect, useMemo } from 'react';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';
import type { PoiCategory, PoiCity } from '@/data/pois';
import { pois as allPois } from '@/data/pois';
import FilterBar from '@/components/poi/FilterBar';
import PoiCard from '@/components/poi/PoiCard';
import PoiMap from '@/components/poi/PoiMap';
import { PoiCardSkeleton } from '@/components/ui/Skeleton';

type CityFilter = 'all' | PoiCity;
type CategoryFilter = 'all' | PoiCategory;

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<CityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const filteredPois = useMemo(() => {
    return allPois.filter((p) => {
      if (cityFilter !== 'all' && p.city !== cityFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, cityFilter, categoryFilter]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectPoi = (id: string | null) => {
    setSelectedPoiId(id);
    if (id) {
      setMobileView('map');
    }
  };

  // Scroll selected card into view
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedPoiId && listRef.current) {
      const el = listRef.current.querySelector(`[data-poi-id="${selectedPoiId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPoiId]);

  return (
    <div className="flex h-screen flex-col pt-16">
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: List */}
        <div
          className={`
            ${mobileView === 'list' ? 'flex' : 'hidden'}
            md:flex flex-col w-full md:w-[42%] lg:w-[40%] xl:w-[38%] border-r border-beige bg-cream
          `}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4" ref={listRef}>
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              cityFilter={cityFilter}
              onCityChange={setCityFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              count={filteredPois.length}
            />

            <div className="space-y-3 mt-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <PoiCardSkeleton key={i} />)
              ) : filteredPois.length === 0 ? (
                <EmptyState />
              ) : (
                filteredPois.map((poi) => (
                  <div key={poi.id} data-poi-id={poi.id}>
                    <PoiCard
                      poi={poi}
                      active={poi.id === selectedPoiId}
                      hovered={poi.id === hoveredPoiId}
                      favorite={favorites.has(poi.id)}
                      onClick={() => handleSelectPoi(poi.id)}
                      onHover={setHoveredPoiId}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Map */}
        <div
          className={`
            ${mobileView === 'map' ? 'flex' : 'hidden'}
            md:flex flex-1 p-3 lg:p-4
          `}
        >
          <div className="relative h-full w-full">
            <PoiMap
              pois={filteredPois}
              selectedPoiId={selectedPoiId}
              hoveredPoiId={hoveredPoiId}
              onSelectPoi={handleSelectPoi}
              onHoverPoi={setHoveredPoiId}
            />
          </div>
        </div>
      </div>

      {/* Mobile view toggle FAB */}
      <button
        onClick={() => setMobileView((v) => (v === 'map' ? 'list' : 'map'))}
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest-500 px-5 py-3 text-sm font-medium text-cream shadow-cardHover transition-all hover:bg-forest-600 md:hidden"
        aria-label={mobileView === 'map' ? 'Xem danh sách' : 'Xem bản đồ'}
      >
        {mobileView === 'map' ? <ListIcon size={18} /> : <MapIcon size={18} />}
        {mobileView === 'map' ? 'Danh sách' : 'Bản đồ'}
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-beige py-12 text-center animate-fadeIn">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-beige/50">
        <MapIcon size={24} className="text-muted" />
      </div>
      <p className="text-sm font-medium text-charcoal">Không tìm thấy địa điểm phù hợp</p>
      <p className="mt-1 text-xs text-muted">Thử bỏ bớt bộ lọc nhé</p>
    </div>
  );
}
