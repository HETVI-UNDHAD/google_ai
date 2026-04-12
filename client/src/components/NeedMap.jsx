import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom pin icon for user location
const userPinIcon = L.divIcon({
  className: '',
  html: `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:18px;height:18px;border-radius:50% 50% 50% 0;
        background:#6366f1;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(99,102,241,0.5);
        transform:rotate(-45deg);
      "></div>
      <div style="width:2px;height:14px;background:#6366f1;margin-top:-1px;"></div>
    </div>`,
  iconSize:   [18, 34],
  iconAnchor: [9, 34],
  popupAnchor:[0, -36],
});

const CITY_COORDS = {
  Ahmedabad:  [23.0225, 72.5714],
  Surat:      [21.1702, 72.8311],
  Vadodara:   [22.3072, 73.1812],
  Rajkot:     [22.3039, 70.8022],
  Gandhinagar:[23.2156, 72.6369],
  Bhavnagar:  [21.7645, 72.1519],
  Jamnagar:   [22.4707, 70.0577],
  Junagadh:   [21.5222, 70.4579],
};

const CATEGORY_COLOR = {
  Food:      '#f97316',
  Health:    '#ef4444',
  Education: '#3b82f6',
  Shelter:   '#10b981',
};

const CATEGORY_BG = {
  Food:      '#fff7ed',
  Health:    '#fef2f2',
  Education: '#eff6ff',
  Shelter:   '#f0fdf4',
};

const URGENCY_RADIUS = { 1: 9, 2: 15, 3: 22 };
const URGENCY_LABEL  = { 1: 'Low', 2: 'Medium', 3: 'High' };
const URGENCY_COLOR  = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };

const STATUS_STYLE = {
  'Pending':      { bg: '#fef3c7', color: '#92400e' },
  'In Progress':  { bg: '#dbeafe', color: '#1e40af' },
  'Resolved':     { bg: '#d1fae5', color: '#065f46' },
};

// Golden-angle jitter so markers in same city don't overlap
function jitter(coord, index) {
  if (index === 0) return coord;
  const offset = 0.02;
  const angle  = (index * 137.508 * Math.PI) / 180;
  return [
    coord[0] + Math.sin(angle) * offset * Math.ceil(index / 2),
    coord[1] + Math.cos(angle) * offset * Math.ceil(index / 2),
  ];
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      try { map.fitBounds(positions, { padding: [60, 60], maxZoom: 10 }); } catch {}
    }
  }, [positions.length]);
  return null;
}

export default function NeedMap({ requests, userLocation }) {
  const cityIndex = {};
  const positioned = requests
    .filter(r => CITY_COORDS[r.city])
    .map(r => {
      const idx = cityIndex[r.city] ?? 0;
      cityIndex[r.city] = idx + 1;
      return { ...r, coords: jitter(CITY_COORDS[r.city], idx) };
    });

  const allPositions = [
    ...positioned.map(r => r.coords),
    ...(userLocation ? [[userLocation.lat, userLocation.lng]] : []),
  ];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[22.5, 71.5]}
        zoom={7}
        scrollWheelZoom
        zoomControl={false}
        className="w-full h-full"
      >
        {/* Clean light tile */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* User location pin */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userPinIcon}>
            <Popup minWidth={200}>
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '4px 2px' }}>
                <p style={{ fontWeight: 700, color: '#6366f1', fontSize: '13px', marginBottom: '4px' }}>📍 You are here</p>
                <p style={{ color: '#0f172a', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>{userLocation.name}</p>
                {userLocation.city && <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>{[userLocation.city, userLocation.state].filter(Boolean).join(', ')}</p>}
                <p style={{ color: '#94a3b8', fontSize: '10px' }}>{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {positioned.map((r, i) => {
          const color   = CATEGORY_COLOR[r.category] || '#6366f1';
          const radius  = URGENCY_RADIUS[r.urgency]  || 12;
          const isHigh  = r.urgency === 3;
          const sSt     = STATUS_STYLE[r.status] || STATUS_STYLE['Pending'];

          return (
            <CircleMarker
              key={r._id || i}
              center={r.coords}
              radius={radius}
              pathOptions={{
                color:       isHigh ? '#fff' : color,
                fillColor:   color,
                fillOpacity: isHigh ? 0.92 : 0.78,
                weight:      isHigh ? 2.5 : 1.5,
                opacity:     1,
              }}
            >
              <Popup minWidth={240} maxWidth={300} className="need-map-popup">
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '4px 2px' }}>

                  {/* Top color bar */}
                  <div style={{ height: '4px', background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: '4px', marginBottom: '12px' }} />

                  {/* Title */}
                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px', lineHeight: 1.3 }}>{r.title}</p>
                  <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px', lineHeight: 1.5 }}>{r.description}</p>

                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                    <span style={{ background: CATEGORY_BG[r.category], color, padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                      {r.category}
                    </span>
                    <span style={{ background: URGENCY_COLOR[r.urgency] + '18', color: URGENCY_COLOR[r.urgency], padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>
                      ⚡ {URGENCY_LABEL[r.urgency]}
                    </span>
                    <span style={{ background: sSt.bg, color: sSt.color, padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>
                      {r.status}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📍</span> {r.city}, {r.area}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>👥</span> {r.peopleAffected?.toLocaleString()} affected
                    </div>
                  </div>

                  {/* Priority score */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Score</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color }}>{r.priorityScore}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ── Legend bottom-left ── */}
      <div style={{ position: 'absolute', bottom: 20, left: 16, zIndex: 1000 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 min-w-[140px]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Category</p>
        <div className="flex flex-col gap-2">
          {Object.entries(CATEGORY_COLOR).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-xs font-semibold text-gray-600">{cat}</span>
            </div>
          ))}
        </div>

        {userLocation && (
          <div className="border-t border-gray-100 mt-3 pt-3">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ width:12, height:12, borderRadius:'50% 50% 50% 0', background:'#6366f1', border:'2px solid #fff', boxShadow:'0 1px 4px rgba(99,102,241,0.4)', transform:'rotate(-45deg)', display:'inline-block', flexShrink:0 }} />
              <span className="text-xs font-semibold text-indigo-600">Your Location</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-snug pl-4">{userLocation.display}</p>
          </div>
        )}

        <div className="border-t border-gray-100 mt-3 pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Urgency</p>
          <div className="flex items-end gap-3">
            {[1, 2, 3].map(u => (
              <div key={u} className="flex flex-col items-center gap-1.5">
                <span className="rounded-full" style={{
                  width:  URGENCY_RADIUS[u] * 1.4,
                  height: URGENCY_RADIUS[u] * 1.4,
                  backgroundColor: URGENCY_COLOR[u],
                  display: 'block',
                  opacity: 0.8,
                }} />
                <span className="text-[10px] font-medium" style={{ color: URGENCY_COLOR[u] }}>{URGENCY_LABEL[u]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category count chips top-right ── */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 px-4 py-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Active Requests</p>
        <div className="flex gap-4">
          {Object.entries(CATEGORY_COLOR).map(([cat, color]) => {
            const count = requests.filter(r => r.category === cat).length;
            return (
              <div key={cat} className="flex flex-col items-center gap-0.5">
                <span className="text-base font-bold" style={{ color }}>{count}</span>
                <span className="text-[10px] text-gray-400 font-medium">{cat}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Total marker count bottom-right ── */}
      <div style={{ position: 'absolute', bottom: 20, right: 16, zIndex: 1000 }}
        className="bg-indigo-600 text-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
        <span className="text-xs font-bold">{positioned.length} locations plotted</span>
      </div>
    </div>
  );
}
