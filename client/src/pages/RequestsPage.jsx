import { useEffect, useState } from 'react';
import api from '../api/axios';
import RequestCard from '../components/RequestCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Food', 'Health', 'Education', 'Shelter'];
const STATUSES   = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('All');
  const [status,   setStatus]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [sorted,   setSorted]   = useState(false);
  const [loading,  setLoading]  = useState(true);

  const fetchRequests = () => {
    const endpoint = sorted ? '/requests/sorted' : '/requests';
    api.get(endpoint).then(({ data }) => { setRequests(data); setLoading(false); });
  };

  useEffect(() => { fetchRequests(); }, [sorted]);

  useEffect(() => {
    let list = [...requests];
    if (category !== 'All') list = list.filter((r) => r.category === category);
    if (status   !== 'All') list = list.filter((r) => r.status   === status);
    if (search.trim())      list = list.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [category, status, search, requests]);

  const handleStatusChange = async (id, newStatus) => {
    await api.patch(`/requests/${id}/status`, { status: newStatus });
    fetchRequests();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 All Requests</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} results</span>
          <button
            onClick={() => setSorted((s) => !s)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition border ${sorted ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'}`}
          >
            {sorted ? '🔽 By Priority' : 'Sort by Priority'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          placeholder="Search title or city..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-1 min-w-[180px]"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >{c}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${status === s ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No requests match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r._id} className="flex flex-col">
              <RequestCard request={r} />
              {(user?.role === 'Admin' || user?.role === 'NGO') && (
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r._id, e.target.value)}
                  className="mt-1 text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
