import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NeedMap from '../components/NeedMap';

const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };
const URGENCY_LABEL  = { 1: 'Low', 2: 'Medium', 3: 'High' };
const URGENCY_COLOR  = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
const STATUS_PILL    = { Pending: 'bg-amber-100 text-amber-700', 'In Progress': 'bg-blue-100 text-blue-700', Resolved: 'bg-emerald-100 text-emerald-700' };

/* ── Donut Chart (pure SVG) ── */
function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-[140px] h-[140px] rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No data</div>;
  const r = 52, cx = size / 2, cy = size / 2, stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d) => {
    const dash = (d.value / total) * circ;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{total}</span>
        <span className="text-[10px] text-gray-400 font-medium">Total</span>
      </div>
    </div>
  );
}

/* ── Horizontal Bar Chart (pure SVG) ── */
function BarChart({ requests }) {
  const cities = {};
  requests.forEach(r => { cities[r.city] = (cities[r.city] || 0) + 1; });
  const entries = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(e => e[1]), 1);
  return (
    <div className="flex flex-col gap-3 w-full">
      {entries.map(([city, count], i) => (
        <div key={city} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 truncate text-right shrink-0">{city}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(count / max) * 100}%`, background: `hsl(${220 + i * 25}, 70%, 55%)` }} />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-5 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Priority Score Bar ── */
function ScoreBar({ score, max }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/requests/sorted').then(({ data }) => { setRequests(Array.isArray(data) ? data : data.data ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total:      requests.length,
    pending:    requests.filter(r => r.status === 'Pending').length,
    inProgress: requests.filter(r => r.status === 'In Progress').length,
    resolved:   requests.filter(r => r.status === 'Resolved').length,
  };

  const categoryData = ['Food','Health','Education','Shelter'].map(c => ({
    label: c, value: requests.filter(r => r.category === c).length, color: CATEGORY_COLOR[c],
  }));

  const topRequests = requests.slice(0, 6);
  const maxScore    = topRequests[0]?.priorityScore || 1;

  const STAT_CARDS = [
    { label: 'Total Requests', value: stats.total,      bg: 'bg-indigo-600',  icon: <ClipboardIcon /> },
    { label: 'Pending',        value: stats.pending,    bg: 'bg-amber-500',   icon: <ClockIcon /> },
    { label: 'In Progress',    value: stats.inProgress, bg: 'bg-sky-500',     icon: <RefreshIcon /> },
    { label: 'Resolved',       value: stats.resolved,   bg: 'bg-emerald-500', icon: <CheckIcon /> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-600">System Online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, bg, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
            <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Requests by Category</p>
          <div className="flex items-center gap-6">
            <DonutChart data={categoryData} />
            <div className="flex flex-col gap-2.5">
              {categoryData.map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-500">{d.label}</span>
                  <span className="text-xs font-bold text-gray-800 ml-auto pl-3">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Requests by City</p>
          {loading ? <div className="text-xs text-gray-400">Loading...</div> : <BarChart requests={requests} />}
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Status Overview</p>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Pending',     value: stats.pending,    color: '#f59e0b', bg: 'bg-amber-50' },
              { label: 'In Progress', value: stats.inProgress, color: '#3b82f6', bg: 'bg-blue-50' },
              { label: 'Resolved',    value: stats.resolved,   color: '#10b981', bg: 'bg-emerald-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-medium text-gray-600">{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${stats.total ? (s.value/stats.total)*100 : 0}%`, backgroundColor: s.color }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{loading ? '—' : s.value}</span>
                </div>
              </div>
            ))}

            {/* Quick actions */}
            <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col gap-2">
              {user?.role === 'Admin' && (
                <Link to="/assignments" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                  → Run volunteer matching
                </Link>
              )}
              {(user?.role === 'NGO' || user?.role === 'Admin') && (
                <Link to="/ngo" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">
                  → Submit new request
                </Link>
              )}
              {user?.role === 'Volunteer' && (
                <Link to="/volunteer" className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1">
                  → View my assigned tasks
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Need Areas Map</p>
            <p className="text-xs text-gray-400 mt-0.5">Geographic distribution of active requests</p>
          </div>
          <Link to="/map" className="text-xs text-indigo-600 font-semibold hover:underline">Full map →</Link>
        </div>
        <div className="h-64">
          {!loading && <NeedMap requests={requests} />}
        </div>
      </div>

      {/* Priority Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Top Priority Requests</p>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by priority score — highest first</p>
          </div>
          <Link to="/requests" className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : topRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Request</th>
                  <th className="px-5 py-3 text-left font-semibold">Category</th>
                  <th className="px-5 py-3 text-left font-semibold">Location</th>
                  <th className="px-5 py-3 text-left font-semibold">Urgency</th>
                  <th className="px-5 py-3 text-left font-semibold">People</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold w-40">Priority Score</th>
                </tr>
              </thead>
              <tbody>
                {topRequests.map((r, i) => (
                  <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50/70 transition">
                    <td className="px-5 py-3.5 text-gray-300 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[r.category]+'18', color: CATEGORY_COLOR[r.category] }}>
                        {r.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{r.city}, {r.area}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: URGENCY_COLOR[r.urgency] }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: URGENCY_COLOR[r.urgency] }} />
                        {URGENCY_LABEL[r.urgency]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{r.peopleAffected.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_PILL[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-3.5 w-40"><ScoreBar score={r.priorityScore} max={maxScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function ClipboardIcon() { return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ClockIcon()     { return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function RefreshIcon()   { return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CheckIcon()     { return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
