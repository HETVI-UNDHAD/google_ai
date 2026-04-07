import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TABS = ['Submit Request', 'Upload File', 'My Requests'];

const INPUT = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full';
const SELECT = `${INPUT} bg-white`;

const STATUS_COLOR = { Pending: 'bg-yellow-100 text-yellow-700', 'In Progress': 'bg-blue-100 text-blue-700', Resolved: 'bg-green-100 text-green-700' };
const URGENCY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };

export default function NgoDashboard() {
  const { user } = useAuth();
  const [tab, setTab]         = useState(0);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const fileRef               = useRef();

  const [form, setForm] = useState({
    title: '', description: '', category: 'Food', city: '', area: '',
    urgency: '1', peopleAffected: '', latitude: '', longitude: '', image: null,
  });

  const fetchMyRequests = () => {
    api.get('/requests').then(({ data }) => {
      setMyRequests(data.filter((r) => r.submittedBy?._id === user._id || r.submittedBy?.email === user.email));
    });
  };

  useEffect(() => { fetchMyRequests(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'image' && v !== '') fd.append(k, v); });
      if (form.image) fd.append('image', form.image);
      await api.post('/requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'success', text: '✅ Request submitted successfully!' });
      setForm({ title: '', description: '', category: 'Food', city: '', area: '', urgency: '1', peopleAffected: '', latitude: '', longitude: '', image: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchMyRequests();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
    } finally { setLoading(false); }
  };

  const [csvFile, setCsvFile]   = useState(null);
  const [csvMsg,  setCsvMsg]    = useState({ type: '', text: '' });
  const [csvLoading, setCsvLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return setCsvMsg({ type: 'error', text: 'Please select a file.' });
    setCsvLoading(true); setCsvMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('file', csvFile);
      const { data } = await api.post('/requests/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCsvMsg({ type: 'success', text: `✅ Inserted ${data.inserted} request(s) from file.` });
      setCsvFile(null);
      fetchMyRequests();
    } catch (err) {
      setCsvMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally { setCsvLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📝 NGO Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Submit requests, upload data, and track your submissions.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === i ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      {/* Tab 0: Submit Request */}
      {tab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-4">New Resource Request</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <input name="title" placeholder="Title of issue *" value={form.title} onChange={handleChange} required className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <textarea name="description" placeholder="Description *" value={form.description} onChange={handleChange} required rows={3} className={INPUT} />
            </div>
            <select name="category" value={form.category} onChange={handleChange} className={SELECT}>
              {['Food', 'Health', 'Education', 'Shelter'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select name="urgency" value={form.urgency} onChange={handleChange} className={SELECT}>
              <option value="1">Low Urgency</option>
              <option value="2">Medium Urgency</option>
              <option value="3">High Urgency</option>
            </select>
            <input name="city" placeholder="City *" value={form.city} onChange={handleChange} required className={INPUT} />
            <input name="area" placeholder="Area *" value={form.area} onChange={handleChange} required className={INPUT} />
            <input name="peopleAffected" type="number" placeholder="People affected *" value={form.peopleAffected} onChange={handleChange} required min="1" className={INPUT} />
            <input name="latitude"  type="number" step="any" placeholder="Latitude (optional)"  value={form.latitude}  onChange={handleChange} className={INPUT} />
            <input name="longitude" type="number" step="any" placeholder="Longitude (optional)" value={form.longitude} onChange={handleChange} className={INPUT} />
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Upload Image (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="text-sm text-gray-500" />
            </div>
            {msg.text && (
              <div className={`sm:col-span-2 text-sm px-4 py-2 rounded-xl ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {msg.text}
              </div>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: Upload CSV/Excel */}
      {tab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-2">Upload CSV / Excel File</h3>
          <p className="text-xs text-gray-400 mb-4">
            File must have columns: <code className="bg-gray-100 px-1 rounded">title, description, category, city, area, urgency, peopleAffected</code>
          </p>

          {/* Sample download hint */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 text-xs text-indigo-700">
            📄 Sample row: <code>Food shortage, Lack of food, Food, Ahmedabad, Bapunagar, 3, 120</code>
          </div>

          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setCsvFile(e.target.files[0])} className="text-sm text-gray-500" />
            {csvMsg.text && (
              <div className={`text-sm px-4 py-2 rounded-xl ${csvMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {csvMsg.text}
              </div>
            )}
            <button type="submit" disabled={csvLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60">
              {csvLoading ? 'Uploading...' : '📤 Upload & Process'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: My Requests */}
      {tab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">My Submitted Requests</h3>
            <span className="text-xs text-gray-400">{myRequests.length} total</span>
          </div>
          {myRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No requests submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">City</th>
                    <th className="px-4 py-3 text-left">Urgency</th>
                    <th className="px-4 py-3 text-left">People</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">{r.title}</td>
                      <td className="px-4 py-3 text-gray-500">{r.category}</td>
                      <td className="px-4 py-3 text-gray-500">{r.city}</td>
                      <td className="px-4 py-3 text-gray-500">{URGENCY_LABEL[r.urgency]}</td>
                      <td className="px-4 py-3 text-gray-500">{r.peopleAffected}</td>
                      <td className="px-4 py-3 font-bold text-indigo-600">{r.priorityScore}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>{r.status}</span>
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
