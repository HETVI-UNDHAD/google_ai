import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SKILLS = ['General', 'Logistics', 'Medical', 'Teaching'];
const SLOTS  = ['Morning', 'Afternoon', 'Evening'];

const STATUS_CONFIG = {
  Assigned:  { pill: 'bg-amber-50 text-amber-600 border border-amber-200',       dot: 'bg-amber-500',   label: 'Awaiting Response' },
  Accepted:  { pill: 'bg-sky-50 text-sky-600 border border-sky-200',             dot: 'bg-sky-500',     label: 'Accepted' },
  Rejected:  { pill: 'bg-rose-50 text-rose-600 border border-rose-200',          dot: 'bg-rose-500',    label: 'Rejected' },
  Completed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
};

const URGENCY_COLOR = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
const URGENCY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };

const INPUT = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 focus:bg-white transition';

export default function VolunteerPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [form, setForm] = useState({ skills: [], availableSlots: [], availability: true, city: '' });
  const [regMsg,     setRegMsg]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [responding, setResponding] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/assignments/mine').catch(() => ({ data: [] })),
      api.get('/volunteer/me').catch(() => ({ data: null })),
    ]).then(([a, p]) => {
      setAssignments(a.data || []);
      setProfile(p.data);
      setDataLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (key, val) =>
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const handleRegister = async e => {
    e.preventDefault();
    if (!form.skills.length) return setRegMsg('Please select at least one skill.');
    if (!form.city.trim())   return setRegMsg('Please enter your city.');
    setLoading(true);
    try {
      await api.post('/volunteer', { userId: user._id, ...form });
      setRegMsg('');
      fetchData();
    } catch (err) {
      setRegMsg(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const respond = async (id, status) => {
    setResponding(id);
    try { await api.patch(`/assignments/${id}/respond`, { status }); fetchData(); }
    finally { setResponding(null); }
  };

  const completedCount = assignments.filter(a => a.status === 'Completed').length;
  const pendingCount   = assignments.filter(a => a.status === 'Assigned').length;

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Volunteer Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your assignments and profile</p>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Profile banner */}
          {profile && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-indigo-600 text-lg font-bold">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email} · {profile.city}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.skills.map(s => (
                    <span key={s} className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">{completedCount}</p>
                  <p className="text-xs text-gray-400">Done</p>
                </div>
              </div>
            </div>
          )}

          {/* Assignments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">My Assigned Tasks</h2>
              <span className="text-xs text-gray-400">{assignments.length} total</span>
            </div>

            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-gray-400 text-sm">No tasks assigned yet.</p>
                <p className="text-gray-300 text-xs mt-1">Tasks will appear once an admin runs the matching engine.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignments.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.Assigned;
                  const req = a.requestId;
                  return (
                    <div key={a._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="h-1" style={{ backgroundColor: CATEGORY_COLOR[req?.category] }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{req?.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{req?.city}, {req?.area}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs mb-3">
                          <span className="font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLOR[req?.category]+'18', color: CATEGORY_COLOR[req?.category] }}>
                            {req?.category}
                          </span>
                          <span className="flex items-center gap-1 font-semibold" style={{ color: URGENCY_COLOR[req?.urgency] }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: URGENCY_COLOR[req?.urgency] }} />
                            {URGENCY_LABEL[req?.urgency]} Urgency
                          </span>
                          <span className="text-gray-400">👥 {req?.peopleAffected} affected</span>
                          <span className="text-indigo-600 font-bold">Score: {req?.priorityScore}</span>
                        </div>

                        {a.status === 'Assigned' && (
                          <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <button onClick={() => respond(a._id, 'Accepted')} disabled={responding === a._id}
                              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-2 rounded-xl transition disabled:opacity-60">
                              Accept
                            </button>
                            <button onClick={() => respond(a._id, 'Rejected')} disabled={responding === a._id}
                              className="flex-1 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-xs font-semibold py-2 rounded-xl transition disabled:opacity-60">
                              Decline
                            </button>
                          </div>
                        )}
                        {a.status === 'Accepted' && (
                          <button onClick={() => respond(a._id, 'Completed')} disabled={responding === a._id}
                            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-xl transition disabled:opacity-60 border-t border-gray-100 pt-3">
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Registration form */}
          {!profile && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">Register as Volunteer</h2>
              <p className="text-xs text-gray-400 mb-5">Set up your profile so the system can match you to requests.</p>

              <form onSubmit={handleRegister} className="flex flex-col gap-5">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Skills <span className="text-rose-500">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(s => (
                      <button type="button" key={s} onClick={() => toggle('skills', s)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${form.skills.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Available Time Slots</p>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map(s => (
                      <button type="button" key={s} onClick={() => toggle('availableSlots', s)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${form.availableSlots.includes(s) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Your City <span className="text-rose-500">*</span></label>
                  <input placeholder="e.g. Ahmedabad" value={form.city} required
                    onChange={e => setForm({ ...form, city: e.target.value })} className={INPUT} />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.availability}
                    onChange={e => setForm({ ...form, availability: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded" />
                  <span className="text-sm text-gray-600">I am currently available for assignments</span>
                </label>

                {regMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2.5 rounded-xl">{regMsg}</div>
                )}

                <button type="submit" disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering...</> : 'Register as Volunteer'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
