import { useEffect, useState } from 'react';
import api from '../api/axios';

const ROLE_BADGE = {
  Admin:     'bg-rose-50 text-rose-600 border border-rose-200',
  NGO:       'bg-emerald-50 text-emerald-600 border border-emerald-200',
  Volunteer: 'bg-sky-50 text-sky-600 border border-sky-200',
};

const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };

function VerticalBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-32 w-full">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs font-bold text-gray-700">{d.value}</span>
          <div className="w-full rounded-t-lg transition-all duration-700 min-h-[4px]"
            style={{ height: `${(d.value / max) * 96}px`, backgroundColor: d.color }} />
          <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniSparkline({ values, color }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 80, h = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS = [
  { label: 'Overview',   icon: '▦' },
  { label: 'Users',      icon: '👤' },
  { label: 'Volunteers', icon: '🙋' },
];

export default function AdminDashboard() {
  const [tab, setTab]               = useState(0);
  const [users, setUsers]           = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/volunteers'),
      api.get('/requests'),
      api.get('/assignments'),
    ]).then(([u, v, r, a]) => {
      setUsers(u.data);
      setVolunteers(v.data);
      setRequests(r.data);
      setAssignments(a.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total:       requests.length,
    pending:     requests.filter(x => x.status === 'Pending').length,
    inProgress:  requests.filter(x => x.status === 'In Progress').length,
    resolved:    requests.filter(x => x.status === 'Resolved').length,
    volunteers:  volunteers.length,
    assignments: assignments.length,
    users:       users.length,
  };

  const categoryData = ['Food','Health','Education','Shelter'].map(c => ({
    label: c, value: requests.filter(r => r.category === c).length, color: CATEGORY_COLOR[c],
  }));

  const assignmentStatusData = ['Assigned','Accepted','Rejected','Completed'].map(s => ({
    label: s,
    value: assignments.filter(a => a.status === s).length,
    color: { Assigned:'#f59e0b', Accepted:'#3b82f6', Rejected:'#ef4444', Completed:'#10b981' }[s],
  }));

  const TOP_STATS = [
    { label: 'Total Users',    value: stats.users,       color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    { label: 'Requests',       value: stats.total,       color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-100' },
    { label: 'Volunteers',     value: stats.volunteers,  color: 'text-sky-600',    bg: 'bg-sky-50',     border: 'border-sky-100' },
    { label: 'Assignments',    value: stats.assignments, color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-100' },
    { label: 'Resolved',       value: stats.resolved,    color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-0.5">Full system control and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => setTab(i)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition ${tab === i ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Tab 0: Overview ── */}
          {tab === 0 && (
            <div className="flex flex-col gap-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {TOP_STATS.map(s => (
                  <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 flex flex-col gap-1`}>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Requests by Category</p>
                  <p className="text-xs text-gray-400 mb-5">Distribution across all 4 categories</p>
                  <VerticalBarChart data={categoryData} />
                </div>

                {/* Assignment status */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Assignment Status</p>
                  <p className="text-xs text-gray-400 mb-5">Current state of all volunteer assignments</p>
                  <VerticalBarChart data={assignmentStatusData} />
                </div>
              </div>

              {/* Request status progress */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-800 mb-4">Request Resolution Progress</p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Pending',     value: stats.pending,    color: '#f59e0b' },
                    { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
                    { label: 'Resolved',    value: stats.resolved,   color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 w-24 shrink-0">{s.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${stats.total ? (s.value/stats.total)*100 : 0}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-8 text-right">{s.value}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">
                        {stats.total ? Math.round((s.value/stats.total)*100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 1: Users ── */}
          {tab === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Registered Users</p>
                  <p className="text-xs text-gray-400 mt-0.5">{users.length} accounts in the system</p>
                </div>
                <div className="flex gap-2">
                  {['Admin','NGO','Volunteer'].map(r => (
                    <span key={r} className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[r]}`}>
                      {r}: {users.filter(u => u.role === r).length}
                    </span>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
                      <th className="px-5 py-3 text-left font-semibold">#</th>
                      <th className="px-5 py-3 text-left font-semibold">Name</th>
                      <th className="px-5 py-3 text-left font-semibold">Email</th>
                      <th className="px-5 py-3 text-left font-semibold">Role</th>
                      <th className="px-5 py-3 text-left font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u._id} className="border-t border-gray-50 hover:bg-gray-50/70 transition">
                        <td className="px-5 py-3.5 text-gray-300 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <span className="text-indigo-600 text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <span className="font-semibold text-gray-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab 2: Volunteers ── */}
          {tab === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Registered Volunteers</p>
                  <p className="text-xs text-gray-400 mt-0.5">{volunteers.length} volunteers · {volunteers.filter(v=>v.availability).length} available</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
                      <th className="px-5 py-3 text-left font-semibold">#</th>
                      <th className="px-5 py-3 text-left font-semibold">Volunteer</th>
                      <th className="px-5 py-3 text-left font-semibold">City</th>
                      <th className="px-5 py-3 text-left font-semibold">Skills</th>
                      <th className="px-5 py-3 text-left font-semibold">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map((v, i) => (
                      <tr key={v._id} className="border-t border-gray-50 hover:bg-gray-50/70 transition">
                        <td className="px-5 py-3.5 text-gray-300 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                              <span className="text-sky-600 text-xs font-bold">{v.userId?.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{v.userId?.name}</p>
                              <p className="text-xs text-gray-400">{v.userId?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{v.city}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {v.skills.map(s => (
                              <span key={s} className="text-[11px] font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${v.availability ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${v.availability ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {v.availability ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
