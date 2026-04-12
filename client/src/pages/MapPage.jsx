import { useEffect, useState } from 'react';
import api from '../api/axios';
import NeedMap from '../components/NeedMap';

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

const CATEGORIES    = ['All', 'Food', 'Health', 'Education', 'Shelter'];
const STATUSES      = ['All', 'Pending', 'In Progress', 'Resolved'];
const URGENCY_LABEL = { '1': 'Low', '2': 'Medium', '3': 'High' };
const URGENCY_COLOR = { '1': '#10b981', '2': '#f59e0b', '3': '#ef4444' };
const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };

export default function MapPage() {
  const [requests, setRequests] = useState([]);
  const [category, setCategory] = useState('All');
  const [status,   setStatus]   = useState('All');
  const [urgency,  setUrgency]  = useState('All');
  const [loading,  setLoading]  = useState(true);
  const [userGPS,  setUserGPS]  = useState(null);

  useEffect(() => {
    getGPS().then(async coords => {
      if (!coords) return;
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`);
        const data = await res.json();
        const a    = data.address || {};
        const name = a.road || a.neighbourhood || a.suburb || a.village || a.town || a.city || 'Your Location';
        const city = a.city || a.town || a.village || a.county || '';
        const state = a.state || '';
        setUserGPS({ ...coords, name, city, state, display: [name, city, state].filter(Boolean).join(', ') });
      } catch {
        setUserGPS({ ...coords, name: 'Your Location', display: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` });
      }
    });
  }, []);

  useEffect(() => {
    api.get('/requests/sorted')
      .then(({ data }) => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    if (category !== 'All' && r.category !== category) return false;
    if (status   !== 'All' && r.status   !== status)   return false;
    if (urgency  !== 'All' && String(r.urgency) !== urgency) return false;
    return true;
  });

  // City summary
  const citySummary = filtered.reduce((acc, r) => {
    if (!acc[r.city]) acc[r.city] = { total: 0, high: 0, people: 0, categories: {} };
    acc[r.city].total++;
    acc[r.city].people += r.peopleAffected || 0;
    if (r.urgency === 3) acc[r.city].high++;
    acc[r.city].categories[r.category] = (acc[r.city].categories[r.category] || 0) + 1;
    return acc;
  }, {});

  const sortedCities = Object.entries(citySummary).sort((a, b) => b[1].people - a[1].people);
  const totalPeople  = filtered.reduce((s, r) => s + (r.peopleAffected || 0), 0);
  const criticalCount = filtered.filter(r => r.urgency === 3).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f6fb]">

      {/* ── Top bar ── */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Need Areas Map</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} request{filtered.length !== 1 ? 's' : ''} · {Object.keys(citySummary).length} cities · {totalPeople.toLocaleString()} people affected
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Category */}
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  category === c ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
                style={category === c && c !== 'All' ? { color: CATEGORY_COLOR[c] } : {}}>
                {c}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  status === s ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}>
                {s}
              </button>
            ))}
          </div>

          {/* Urgency */}
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setUrgency('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${urgency === 'All' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
              All
            </button>
            {['1','2','3'].map(u => (
              <button key={u} onClick={() => setUrgency(u)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${urgency === u ? 'bg-white shadow' : 'text-gray-400 hover:text-gray-700'}`}
                style={urgency === u ? { color: URGENCY_COLOR[u] } : {}}>
                {URGENCY_LABEL[u]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: map + sidebar ── */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading map data...</p>
            </div>
          ) : (
            <NeedMap requests={filtered} userLocation={userGPS} />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Summary KPIs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xl font-bold text-indigo-600">{filtered.length}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Requests</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <p className="text-xl font-bold text-rose-500">{criticalCount}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Critical</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xl font-bold text-amber-500">{Object.keys(citySummary).length}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Cities</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xl font-bold text-emerald-600">{totalPeople >= 1000 ? (totalPeople/1000).toFixed(1)+'k' : totalPeople}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Affected</p>
            </div>
          </div>

          {/* City breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">City Breakdown</p>
            {sortedCities.length === 0 ? (
              <p className="text-xs text-gray-400">No data for current filters.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedCities.map(([city, data]) => (
                  <div key={city}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{city}</span>
                      <div className="flex items-center gap-2">
                        {data.high > 0 && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                            {data.high} critical
                          </span>
                        )}
                        <span className="text-xs font-bold text-indigo-600">{data.total}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] text-gray-400">👥 {data.people.toLocaleString()} affected</span>
                    </div>
                    {/* Category dots */}
                    <div className="flex gap-1 mb-1.5">
                      {Object.entries(data.categories).map(([cat, cnt]) => (
                        <span key={cat} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLOR[cat] + '18', color: CATEGORY_COLOR[cat] }}>
                          {cat} {cnt}
                        </span>
                      ))}
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${(data.people / (sortedCities[0]?.[1]?.people || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1 overflow-y-auto">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              All Requests <span className="text-indigo-500 normal-case font-bold">({filtered.length})</span>
            </p>
            <div className="flex flex-col gap-2">
              {filtered.map(r => (
                <div key={r._id}
                  className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-default">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-1 flex-1">{r.title}</p>
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: CATEGORY_COLOR[r.category] }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mb-1.5">📍 {r.city}, {r.area}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLOR[r.category] + '15', color: CATEGORY_COLOR[r.category] }}>
                      {r.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">👥 {r.peopleAffected}</span>
                      <span className="text-xs font-bold text-indigo-600">{r.priorityScore}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No requests match filters.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
