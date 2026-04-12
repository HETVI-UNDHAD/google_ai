import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };
const URGENCY_COLOR  = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
const URGENCY_LABEL  = { 1: 'Low', 2: 'Medium', 3: 'High' };
const STATUS_PILL    = {
  Pending:       'bg-amber-50 text-amber-600 border border-amber-200',
  'In Progress': 'bg-sky-50 text-sky-600 border border-sky-200',
  Resolved:      'bg-emerald-50 text-emerald-600 border border-emerald-200',
};

// Known city coordinates for fallback distance when request has no GPS
const CITY_COORDS = {
  Ahmedabad:   { lat: 23.0225, lng: 72.5714 },
  Surat:       { lat: 21.1702, lng: 72.8311 },
  Vadodara:    { lat: 22.3072, lng: 73.1812 },
  Rajkot:      { lat: 22.3039, lng: 70.8022 },
  Gandhinagar: { lat: 23.2156, lng: 72.6369 },
  Bhavnagar:   { lat: 21.7645, lng: 72.1519 },
  Jamnagar:    { lat: 22.4707, lng: 70.0577 },
  Junagadh:    { lat: 21.5222, lng: 70.4579 },
  Bhuj:        { lat: 23.2420, lng: 69.6669 },
  Anand:       { lat: 22.5645, lng: 72.9289 },
  Dahod:       { lat: 22.8340, lng: 74.2540 },
  Kheda:       { lat: 22.7500, lng: 72.6833 },
};

const CATEGORIES = ['All', 'Food', 'Health', 'Education', 'Shelter'];
const STATUSES   = ['All', 'Pending', 'In Progress', 'Resolved'];

// Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

// Get GPS as promise
function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      ()  => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

function RequestCard({ request, onStatusChange, canEdit }) {
  const { title, description, category, city, area, urgency, peopleAffected, priorityScore, status, distanceKm, latitude } = request;
  const maxScore   = 500;
  const pct        = Math.min((priorityScore / maxScore) * 100, 100);
  const scoreColor = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: CATEGORY_COLOR[category] }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Title + category */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{title}</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: CATEGORY_COLOR[category]+'18', color: CATEGORY_COLOR[category] }}>
            {category}
          </span>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{description}</p>

        {/* Location + people */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {city}, {area}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {peopleAffected.toLocaleString()} affected
          </span>
        </div>

        {/* Distance badge — only shown when GPS available */}
        {distanceKm !== null && distanceKm !== undefined && (
          <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${
            distanceKm <= 5   ? 'bg-green-50 text-green-700 border border-green-200' :
            distanceKm <= 20  ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            distanceKm <= 50  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                'bg-gray-50 text-gray-500 border border-gray-200'
          }`}>
            📍 {!latitude ? '~' : ''}{distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)}m` : `${distanceKm} km`} away
          </div>
        )}

        {/* Urgency */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: URGENCY_COLOR[urgency] }} />
          <span className="text-xs font-semibold" style={{ color: URGENCY_COLOR[urgency] }}>{URGENCY_LABEL[urgency]} Urgency</span>
        </div>

        {/* Priority score bar */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Priority Score</span>
            <span className="text-xs font-bold" style={{ color: scoreColor }}>{priorityScore}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: scoreColor }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[status]}`}>{status}</span>
          {canEdit && (
            <select value={status} onChange={e => onStatusChange(request._id, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-600 cursor-pointer">
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const { user }  = useAuth();
  const [requests,  setRequests]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [category,  setCategory]  = useState('All');
  const [status,    setStatus]    = useState('All');
  const [search,    setSearch]    = useState('');
  const [sortMode,  setSortMode]  = useState('priority'); // 'priority' | 'distance'
  const [loading,   setLoading]   = useState(true);
  const [userGPS,   setUserGPS]   = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [total,     setTotal]     = useState(0);

  // Get user GPS on mount (silent — don't block UI)
  useEffect(() => {
    getGPS().then((coords) => {
      if (coords) { setUserGPS(coords); setGpsStatus('granted'); }
    });
  }, []);

  const fetchRequests = useCallback((p = 1, append = false) => {
    api.get(`/requests/sorted?page=${p}&limit=20`)
      .then(({ data }) => {
        const rows = data.data || data;
        setRequests(prev => append ? [...prev, ...rows] : rows);
        setTotalPages(data.pages || 1);
        setTotal(data.total || rows.length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRequests(1); }, [fetchRequests]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRequests(next, true);
  };

  // Apply filters + sort
  useEffect(() => {
    // Attach distance using exact GPS or city fallback
    let list = requests.map(r => {
      if (!userGPS) return { ...r, distanceKm: null };
      const lat = r.latitude  || CITY_COORDS[r.city]?.lat;
      const lng = r.longitude || CITY_COORDS[r.city]?.lng;
      return { ...r, distanceKm: haversine(userGPS.lat, userGPS.lng, lat, lng) };
    });

    if (category !== 'All') list = list.filter(r => r.category === category);
    if (status   !== 'All') list = list.filter(r => r.status   === status);
    if (search.trim()) list = list.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    );

    if (sortMode === 'distance' && userGPS) {
      list.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });
    }

    setFiltered(list);
  }, [category, status, search, sortMode, requests, userGPS]);

  const handleStatusChange = async (id, newStatus) => {
    await api.patch(`/requests/${id}/status`, { status: newStatus });
    fetchRequests();
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'NGO';

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Community Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} request{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => { setSortMode('priority'); }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition ${
              sortMode === 'priority'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}>
            <SortIcon /> Priority
          </button>

          <button
            onClick={() => {
              setGpsStatus('loading');
              getGPS().then(coords => {
                if (coords) { setUserGPS(coords); setGpsStatus('granted'); setSortMode('distance'); }
                else        { setGpsStatus('denied'); }
              });
            }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition ${
              sortMode === 'distance'
                ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
            }`}>
            {gpsStatus === 'loading' ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>📍</span>
            )}
            Near Me
          </button>
        </div>
      </div>

      {/* GPS status banner */}
      {sortMode === 'distance' && (
        <div className={`rounded-xl px-4 py-2.5 mb-4 text-xs font-medium flex items-center gap-2 border ${
          gpsStatus === 'granted' ? 'bg-green-50 text-green-700 border-green-100' :
          gpsStatus === 'denied'  ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
        }`}>
          {gpsStatus === 'granted' && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              Showing {filtered.length} request{filtered.length !== 1 ? 's' : ''} sorted by distance from your location.
            </>
          )}
          {gpsStatus === 'denied'  && <>⚠️ Location access denied. Allow GPS in your browser to use Near Me.</>}
          {gpsStatus === 'loading' && <><span className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /> Getting your location...</>}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search by title or city..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  category === c
                    ? c === 'All' ? 'bg-gray-900 text-white border-gray-900' : ''
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
                style={category === c && c !== 'All' ? { backgroundColor: CATEGORY_COLOR[c]+'18', color: CATEGORY_COLOR[c], borderColor: CATEGORY_COLOR[c]+'40' } : {}}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No requests match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => (
            <RequestCard key={r._id} request={r} canEdit={canEdit} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
      {page < totalPages && sortMode === 'priority' && (
        <div className="mt-6 text-center">
          <button onClick={loadMore}
            className="text-sm text-indigo-600 font-semibold border border-indigo-200 px-6 py-2 rounded-xl hover:bg-indigo-50 transition">
            Load more ({requests.length} / {total})
          </button>
        </div>
      )}
    </div>
  );
}

function SortIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
