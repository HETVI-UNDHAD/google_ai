import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LocationSelector from '../components/LocationSelector';

const TABS = ['Submit Request', 'My Requests'];
const INPUT  = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 focus:bg-white transition';
const SELECT = `${INPUT} cursor-pointer`;

const STATUS_PILL = {
  Pending:       'bg-amber-50 text-amber-600 border border-amber-200',
  'In Progress': 'bg-sky-50 text-sky-600 border border-sky-200',
  Resolved:      'bg-emerald-50 text-emerald-600 border border-emerald-200',
};
const URGENCY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };

export default function NgoDashboard() {
  const { user } = useAuth();
  const [tab, setTab]               = useState(0);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState({ type: '', text: '' });
  const fileRef                     = useRef();

  const [form, setForm] = useState({
    title: '', description: '', category: 'Food',
    location: { state: '', district: '', city: '', area: '' },
    urgency: '1', peopleAffected: '', image: null,
  });

  const fetchMyRequests = () => {
    api.get('/requests').then(({ data }) => {
      setMyRequests(data.filter(r => r.submittedBy?._id === user._id || r.submittedBy?.email === user.email));
    });
  };

  useEffect(() => { fetchMyRequests(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'image' || k === 'location') return;
        if (v !== '') fd.append(k, v);
      });
      fd.append('city', form.location.city);
      fd.append('area', form.location.area);
      if (form.image) fd.append('image', form.image);
      await api.post('/requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'success', text: 'Request submitted successfully!' });
      setForm({ title: '', description: '', category: 'Food', location: { state: '', district: '', city: '', area: '' }, urgency: '1', peopleAffected: '', image: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchMyRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">NGO Portal</h1>
        <p className="text-sm text-gray-400 mt-0.5">Submit community requests and track their status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Submitted',   value: myRequests.length,                                    color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'In Progress', value: myRequests.filter(r=>r.status==='In Progress').length, color: 'text-sky-600',    bg: 'bg-sky-50 border-sky-100' },
          { label: 'Resolved',    value: myRequests.filter(r=>r.status==='Resolved').length,    color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${tab === i ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Submit */}
      {tab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">New Resource Request</h2>
          <p className="text-xs text-gray-400 mb-5">Fill in the details below. Priority score is calculated automatically.</p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Issue Title <span className="text-rose-500">*</span></label>
              <input name="title" placeholder="e.g. Food shortage in Bapunagar" value={form.title} onChange={handleChange} required className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description <span className="text-rose-500">*</span></label>
              <textarea name="description" placeholder="Describe the situation in detail..." value={form.description} onChange={handleChange} required rows={3} className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={SELECT}>
                {['Food','Health','Education','Shelter'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Urgency Level</label>
              <select name="urgency" value={form.urgency} onChange={handleChange} className={SELECT}>
                <option value="1">Low — Non-critical</option>
                <option value="2">Medium — Needs attention</option>
                <option value="3">High — Immediate action</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <LocationSelector
                value={form.location}
                onChange={loc => setForm(f => ({ ...f, location: loc }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">People Affected <span className="text-rose-500">*</span></label>
              <input name="peopleAffected" type="number" placeholder="e.g. 120" value={form.peopleAffected} onChange={handleChange} required min="1" className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Image (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files[0] })}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer" />
            </div>

            {/* Priority preview */}
            {form.urgency && form.peopleAffected && (
              <div className="sm:col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-600 font-medium">Estimated Priority Score</span>
                  {form.location.city && (
                    <p className="text-[11px] text-indigo-400 mt-0.5">
                      📍 {form.location.city}, {form.location.area || '—'}
                    </p>
                  )}
                </div>
                <span className="text-lg font-bold text-indigo-700">
                  {(Number(form.urgency) * 3) + (Number(form.peopleAffected) * 2)}
                </span>
              </div>
            )}

            {msg.text && (
              <div className={`sm:col-span-2 flex items-center gap-2 text-xs px-4 py-3 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                <span>{msg.type === 'success' ? '✓' : '⚠'}</span> {msg.text}
              </div>
            )}

            <div className="sm:col-span-2">
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: My Requests */}
      {tab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">My Submitted Requests</p>
            <span className="text-xs text-gray-400">{myRequests.length} total</span>
          </div>
          {myRequests.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No requests submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-semibold">#</th>
                    <th className="px-5 py-3 text-left font-semibold">Title</th>
                    <th className="px-5 py-3 text-left font-semibold">Category</th>
                    <th className="px-5 py-3 text-left font-semibold">Location</th>
                    <th className="px-5 py-3 text-left font-semibold">Urgency</th>
                    <th className="px-5 py-3 text-left font-semibold">People</th>
                    <th className="px-5 py-3 text-left font-semibold">Score</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r, i) => (
                    <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50/70 transition">
                      <td className="px-5 py-3.5 text-gray-300 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800 max-w-[160px] truncate">{r.title}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLOR[r.category]+'18', color: CATEGORY_COLOR[r.category] }}>
                          {r.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{r.city}, {r.area}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{URGENCY_LABEL[r.urgency]}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-700 font-semibold">{r.peopleAffected}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-indigo-600">{r.priorityScore}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[r.status]}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
