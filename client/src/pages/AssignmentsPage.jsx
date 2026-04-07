import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_COLOR = {
  Assigned:  'bg-yellow-100 text-yellow-700',
  Accepted:  'bg-blue-100 text-blue-700',
  Rejected:  'bg-red-100 text-red-700',
  Completed: 'bg-green-100 text-green-700',
};

const URGENCY_DOT = { 1: 'bg-green-500', 2: 'bg-yellow-500', 3: 'bg-red-500' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [matching, setMatching] = useState(false);
  const [result,   setResult]   = useState(null);
  const [filter,   setFilter]   = useState('All');

  const fetchAssignments = () => {
    api.get('/assignments').then(({ data }) => { setAssignments(data); setLoading(false); });
  };

  useEffect(() => { fetchAssignments(); }, []);

  const runMatching = async () => {
    setMatching(true); setResult(null);
    try {
      const { data } = await api.post('/assign');
      setResult({ type: 'success', text: `✅ Matched ${data.matched} volunteer(s) to requests.` });
      fetchAssignments();
    } catch {
      setResult({ type: 'error', text: '❌ Matching failed. Try again.' });
    } finally { setMatching(false); }
  };

  const STATUSES = ['All', 'Assigned', 'Accepted', 'Rejected', 'Completed'];
  const filtered = filter === 'All' ? assignments : assignments.filter((a) => a.status === filter);

  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = assignments.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔗 Assignments</h2>
          <p className="text-sm text-gray-500 mt-1">{assignments.length} total assignments</p>
        </div>
        <button onClick={runMatching} disabled={matching}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
          {matching ? '⏳ Running...' : '⚡ Run Matching'}
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.slice(1).map((s) => (
          <div key={s} className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[s]}`}>
            {s}: {counts[s] || 0}
          </div>
        ))}
      </div>

      {result && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${result.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {result.text}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
          >{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm border border-dashed border-gray-200">
          {filter === 'All' ? 'No assignments yet. Click "Run Matching" to auto-assign volunteers.' : `No ${filter} assignments.`}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Request</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Urgency</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Volunteer</th>
                  <th className="px-4 py-3 text-left">Skills</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px]">
                      <p className="truncate">{a.requestId?.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.requestId?.category}</td>
                    <td className="px-4 py-3 text-gray-500">{a.requestId?.city}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${URGENCY_DOT[a.requestId?.urgency]}`}></span>
                      {['', 'Low', 'Medium', 'High'][a.requestId?.urgency]}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{a.requestId?.priorityScore}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.volunteerId?.userId?.name}</p>
                      <p className="text-xs text-gray-400">{a.volunteerId?.userId?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.volunteerId?.skills?.map((s) => (
                          <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
