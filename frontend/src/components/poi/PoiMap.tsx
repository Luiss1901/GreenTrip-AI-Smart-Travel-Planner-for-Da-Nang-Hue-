import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Poi } from '@/data/pois';
import { categoryLabels } from '@/data/pois';
import PoiPopup from './PoiPopup';

interface PoiMapProps {
  pois: Poi[];
  selectedPoiId: string | null;
  hoveredPoiId: string | null;
  onSelectPoi: (id: string | null) => void;
  onHoverPoi: (id: string | null) => void;
}

function createMarkerIcon(isSelected: boolean, isHovered: boolean, category: string): L.DivIcon {
  const size = isSelected ? 28 : isHovered ? 24 : 20;
  // A small white dot inside
  const html = `
    <div class="gt-marker ${isSelected ? 'gt-marker-selected' : ''}" style="position: relative; width: ${size}px; height: ${size}px;">
      ${isSelected ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${size+6}px; height: ${size+6}px; border-radius: 50%; border: 2px solid #D93A2B; animation: pulseRing 1.5s ease-out infinite;"></div>` : ''}
      <div style="position: relative; width: ${size}px; height: ${size}px; border-radius: 50%; background: #D93A2B; border: 2px solid #FFFDF8; box-shadow: 0 3px 8px rgba(43,38,34,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: ${size/2.5}px; height: ${size/2.5}px; border-radius: 50%; background: #FFFDF8;"></div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function FitBounds({ pois }: { pois: Poi[] }) {
  const map = useMap();
  useEffect(() => {
    if (pois.length === 0) return;
    const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [pois, map]);
  return null;
}

function FlyToSelected({ poi }: { poi: Poi | null }) {
  const map = useMap();
  useEffect(() => {
    if (poi) {
      map.flyTo([poi.lat, poi.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
    }
  }, [poi, map]);
  return null;
}

function ResetView({ pois }: { pois: Poi[] }) {
  const map = useMap();
  const handleClick = () => {
    if (pois.length === 0) return;
    const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng] as [number, number]));
    map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
  };
  return (
    <button
      onClick={handleClick}
      className="leaflet-bottom-override absolute right-3 bottom-8 z-[500] flex items-center gap-1.5 rounded-xl border border-beige bg-ivory px-3 py-2 text-xs font-medium text-charcoal shadow-map transition-all hover:border-forest-200 hover:text-forest-600"
      aria-label="Về vị trí ban đầu"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      Vị trí ban đầu
    </button>
  );
}

// Dashed route suggesting Da Nang -> Hue
const routeCoords: [number, number][] = [
  [16.0756, 108.2236],
  [16.0544, 108.2422],
  [16.0012, 108.2598],
  [16.4637, 107.5809],
  [16.4697, 107.5489],
];

export default function PoiMap({
  pois,
  selectedPoiId,
  hoveredPoiId,
  onSelectPoi,
  onHoverPoi,
}: PoiMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const selectedPoi = pois.find((p) => p.id === selectedPoiId) || null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-beige shadow-map">
      <MapContainer
        center={[16.25, 107.9]}
        zoom={9}
        minZoom={7}
        maxZoom={18}
        className="h-full w-full"
        ref={(m) => { if (m) mapRef.current = m; }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t:2|p.v:off,s.t:4|p.v:off"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; Google Maps'
        />

        <FitBounds pois={pois} />
        <FlyToSelected poi={selectedPoi} />

        {pois.map((poi, idx) => {
          const isSelected = poi.id === selectedPoiId;
          const isHovered = poi.id === hoveredPoiId;
          // Add a tiny deterministic offset so overlapping points like Hue markers are slightly separated
          const offsetLat = (idx % 3 - 1) * 0.001;
          const offsetLng = (idx % 2 - 0.5) * 0.002;
          return (
            <Marker
              key={poi.id}
              position={[poi.lat + offsetLat, poi.lng + offsetLng]}
              icon={createMarkerIcon(isSelected, isHovered, poi.category)}
              eventHandlers={{
                click: () => onSelectPoi(poi.id),
                mouseover: () => onHoverPoi(poi.id),
                mouseout: () => onHoverPoi(null),
              }}
            >
              {isSelected && (
                <Popup
                  closeButton={false}
                  autoPan
                  autoPanPadding={[40, 80]}
                  offset={[0, -8]}
                  maxWidth={300}
                  minWidth={280}
                >
                  <PopupContent poi={poi} onClose={() => onSelectPoi(null)} />
                </Popup>
              )}
            </Marker>
          );
        })}
        <ResetView pois={pois} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute left-3 bottom-8 z-[500] flex items-center gap-2 rounded-xl border border-beige bg-ivory/95 px-3 py-2 text-xs shadow-map backdrop-blur-sm">
        <span className="h-3 w-3 rounded-full border-2 border-ivory bg-marker shadow-sm" />
        <span className="text-charcoal">Địa điểm</span>
      </div>
    </div>
  );
}

// Popup content rendered inside Leaflet popup (must be inline HTML, no Tailwind classes work inside Leaflet popup by default)
function PopupContent({ poi, onClose }: { poi: Poi; onClose: () => void }) {
  return (
    <div className="gt-popup">
      <PoiPopup poi={poi} onClose={onClose} />
    </div>
  );
}
