import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SKILLS = ['General', 'Logistics', 'Medical', 'Teaching'];
const SLOTS  = ['Morning', 'Afternoon', 'Evening'];

const STATUS_CONFIG = {
  Assigned:  { color: 'bg-yellow-100 text-yellow-700', label: 'Awaiting Response' },
  Accepted:  { color: 'bg-blue-100 text-blue-700',     label: 'Accepted' },
  Rejected:  { color: 'bg-red-100 text-red-700',       label: 'Rejected' },
  Completed: { color: 'bg-green-100 text-green-700',   label: 'Completed' },
};

const URGENCY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
const URGENCY_COLOR = { 1: 'text-green-600', 2: 'text-yellow-600', 3: 'text-red-600' };

export default function VolunteerPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [form, setForm] = useState({ skills: [], availableSlots: [], availability: true, city: '', latitude: '', longitude: '' });
  const [regMsg,  setRegMsg]  = useState('');
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(null);

  const fetchData = () => {
    api.get('/assignments/mine').then(({ data }) => setAssignments(data)).catch(() => {});
    api.get('/volunteer/me').then(({ data }) => setProfile(data)).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const toggleItem = (key, val) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val] }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.skills.length === 0) return setRegMsg('Select at least one skill.');
    setLoading(true);
    try {
      await api.post('/volunteer', {
        userId: user._id, ...form,
        latitude:  form.latitude  ? Number(form.latitude)  : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });
      setRegMsg('✅ Registered! Tasks will appear once admin runs matching.');
      fetchData();
    } catch (err) {
      setRegMsg(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const respond = async (id, status) => {
    setResponding(id);
    try {
      await api.patch(`/assignments/${id}/respond`, { status });
      fetchData();
    } finally { setResponding(null); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🙋 Volunteer Dashboard</h2>

      {/* My Tasks */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">My Assigned Tasks</h3>
        {assignments.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm border border-dashed border-gray-200">
            No tasks assigned yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {assignments.map((a) => {
              const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.Assigned;
              const req = a.requestId;
              return (
                <div key={a._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{req?.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {req?.category} · {req?.city}, {req?.area} · 👥 {req?.peopleAffected}
                      </p>
                      <p className={`text-xs font-semibold mt-1 ${URGENCY_COLOR[req?.urgency]}`}>
                        ⚡ {URGENCY_LABEL[req?.urgency]} urgency · Score: {req?.priorityScore}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {a.status === 'Assigned' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => respond(a._id, 'Accepted')} disabled={responding === a._id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition disabled:opacity-60"
                      >✅ Accept</button>
                      <button
                        onClick={() => respond(a._id, 'Rejected')} disabled={responding === a._id}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-60"
                      >❌ Reject</button>
                    </div>
                  )}
                  {a.status === 'Accepted' && (
                    <button
                      onClick={() => respond(a._id, 'Completed')} disabled={responding === a._id}
                      className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg transition disabled:opacity-60"
                    >🏁 Mark as Completed</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration form — show only if not registered */}
      {!profile && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Register as Volunteer</h3>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Skills *</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <button type="button" key={s} onClick={() => toggleItem('skills', s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${form.skills.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Available Slots</p>
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((s) => (
                  <button type="button" key={s} onClick={() => toggleItem('availableSlots', s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${form.availableSlots.includes(s) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <input placeholder="Your city *" value={form.city} required
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Latitude (optional)" type="number" step="any" value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input placeholder="Longitude (optional)" type="number" step="any" value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.checked })}
                className="accent-indigo-600"
              />
              Available for assignments
            </label>

            {regMsg && <p className="text-sm text-indigo-600">{regMsg}</p>}
            <button type="submit" disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      )}

      {profile && assignments.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700">
          ✅ You're registered in <strong>{profile.city}</strong> with skills: <strong>{profile.skills.join(', ')}</strong>.
          Tasks will appear once admin runs the matching engine.
        </div>
      )}
    </div>
  );
}
