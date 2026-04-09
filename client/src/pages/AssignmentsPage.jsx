import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_CONFIG = {
  Assigned:  { pill: 'bg-amber-50 text-amber-600 border border-amber-200',   dot: 'bg-amber-500' },
  Accepted:  { pill: 'bg-sky-50 text-sky-600 border border-sky-200',         dot: 'bg-sky-500' },
  Rejected:  { pill: 'bg-rose-50 text-rose-600 border border-rose-200',      dot: 'bg-rose-500' },
  Completed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-500' },
};

const URGENCY_COLOR = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
const URGENCY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };

function ScoreBar({ score, max }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

const STATUSES = ['All', 'Assigned', 'Accepted', 'Rejected', 'Completed'];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [matching, setMatching] = useState(false);
  const [result,   setResult]   = useState(null);
  const [filter,   setFilter]   = useState('All');

  const fetchAssignments = () => {
    api.get('/assignments').then(({ data }) => { setAssignments(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAssignments(); }, []);

  const runMatching = async () => {
    setMatching(true); setResult(null);
    try {
      const { data } = await api.post('/assign');
      setResult({ ok: true, text: `Successfully matched ${data.matched} volunteer(s) to pending requests.` });
      fetchAssignments();
    } catch {
      setResult({ ok: false, text: 'Matching failed. Ensure volunteers are registered and requests are pending.' });
    } finally { setMatching(false); }
  };

  const filtered = filter === 'All' ? assignments : assignments.filter(a => a.status === filter);
  const maxScore = Math.max(...assignments.map(a => a.requestId?.priorityScore || 0), 1);

  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = assignments.filter(a => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Volunteer Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Auto-match volunteers to community requests by skill and location</p>
        </div>
        <button onClick={runMatching} disabled={matching}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60 shadow-sm shadow-indigo-200 shrink-0">
          {matching
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
            : <><BoltIcon /> Run Matching Engine</>}
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm ${result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
          <span className="text-base mt-0.5">{result.ok ? '✓' : '✕'}</span>
          <span>{result.text}</span>
          <button onClick={() => setResult(null)} className="ml-auto text-current opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {STATUSES.slice(1).map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
              <div>
                <p className="text-xl font-bold text-gray-900">{counts[s] || 0}</p>
                <p className="text-xs text-gray-400">{s}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${filter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {s} {s !== 'All' && <span className="ml-1 opacity-60">{counts[s] || 0}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {filter === 'All'
              ? 'No assignments yet. Click "Run Matching Engine" to auto-assign volunteers.'
              : `No ${filter.toLowerCase()} assignments found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{filtered.length} assignment{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Request</th>
                  <th className="px-5 py-3 text-left font-semibold">Category</th>
                  <th className="px-5 py-3 text-left font-semibold">Location</th>
                  <th className="px-5 py-3 text-left font-semibold">Urgency</th>
                  <th className="px-5 py-3 text-left font-semibold">Score</th>
                  <th className="px-5 py-3 text-left font-semibold">Volunteer</th>
                  <th className="px-5 py-3 text-left font-semibold">Skills</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.Assigned;
                  return (
                    <tr key={a._id} className="border-t border-gray-50 hover:bg-gray-50/70 transition">
                      <td className="px-5 py-4 text-gray-300 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="font-semibold text-gray-800 truncate">{a.requestId?.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">👥 {a.requestId?.peopleAffected} affected</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLOR[a.requestId?.category]+'18', color: CATEGORY_COLOR[a.requestId?.category] }}>
                          {a.requestId?.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">{a.requestId?.city}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: URGENCY_COLOR[a.requestId?.urgency] }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: URGENCY_COLOR[a.requestId?.urgency] }} />
                          {URGENCY_LABEL[a.requestId?.urgency]}
                        </span>
                      </td>
                      <td className="px-5 py-4"><ScoreBar score={a.requestId?.priorityScore} max={maxScore} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                            <span className="text-sky-600 text-xs font-bold">{a.volunteerId?.userId?.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{a.volunteerId?.userId?.name}</p>
                            <p className="text-[11px] text-gray-400">{a.volunteerId?.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {a.volunteerId?.skills?.map(s => (
                            <span key={s} className="text-[11px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BoltIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
