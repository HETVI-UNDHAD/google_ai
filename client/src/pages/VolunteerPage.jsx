import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LocationSelector from '../components/LocationSelector';

const SKILLS = ['General', 'Logistics', 'Medical', 'Teaching'];
const SLOTS  = ['Morning', 'Afternoon', 'Evening'];

const STATUS_CONFIG = {
  Assigned:  { pill: 'bg-amber-50 text-amber-600 border border-amber-200',       dot: 'bg-amber-500',   label: 'Awaiting Response' },
  Accepted:  { pill: 'bg-sky-50 text-sky-600 border border-sky-200',             dot: 'bg-sky-500',     label: 'Accepted' },
  Rejected:  { pill: 'bg-rose-50 text-rose-600 border border-rose-200',          dot: 'bg-rose-500',    label: 'Rejected' },
  Completed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
};

const URGENCY_COLOR  = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
const URGENCY_LABEL  = { 1: 'Low', 2: 'Medium', 3: 'High' };
const CATEGORY_COLOR = { Food: '#f97316', Health: '#ef4444', Education: '#3b82f6', Shelter: '#10b981' };

const INPUT = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 focus:bg-white transition';

// ── helper: get GPS coords as a promise ──────────────────────────────────────
function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      ()  => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export default function VolunteerPage() {
  const { user, login } = useAuth();
  const [assignments,  setAssignments]  = useState([]);
  const [profile,      setProfile]      = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [responding,   setResponding]   = useState(null);

  // registration form
  const [form,    setForm]    = useState({ skills: [], availableSlots: [], availability: true, location: { state: '', district: '', city: '', area: '' } });
  const [regMsg,  setRegMsg]  = useState('');
  const [regLoad, setRegLoad] = useState(false);

  // edit profile
  const [editOpen,  setEditOpen]  = useState(false);
  const [editForm,  setEditForm]  = useState({ name: '', phone: '', skills: [], availableSlots: [], city: '', area: '' });
  const [editMsg,   setEditMsg]   = useState({ type: '', text: '' });
  const [editLoad,  setEditLoad]  = useState(false);

  // availability toggle
  const [toggling,   setToggling]  = useState(false);
  const [availMsg,   setAvailMsg]  = useState('');
  const [locStatus,  setLocStatus] = useState('');

  const fetchData = useCallback(() => {
    Promise.all([
      api.get('/assignments/mine').catch(() => ({ data: [] })),
      api.get('/volunteer/me').catch(() => ({ data: null })),
    ]).then(([a, p]) => {
      setAssignments(a.data || []);
      setProfile(p.data);
      setDataLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pre-fill edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        name:           user?.name  || '',
        phone:          user?.phone || '',
        skills:         profile.skills         || [],
        availableSlots: profile.availableSlots || [],
        city:           profile.city           || '',
        area:           profile.area           || '',
      });
    }
  }, [profile, user]);

  // Auto-capture GPS when volunteer opens the page
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.patch('/volunteer/location', {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocStatus('saved');
        } catch {
          setLocStatus('error');
        }
      },
      () => setLocStatus('denied'),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const toggle = (key, val) =>
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const toggleEdit = (key, val) =>
    setEditForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault();
    if (!form.skills.length)        return setRegMsg('Please select at least one skill.');
    if (!form.location.city.trim()) return setRegMsg('Please select your city.');
    setRegLoad(true);
    try {
      await api.post('/volunteer', { userId: user._id, ...form, city: form.location.city, area: form.location.area || '' });
      setRegMsg('');
      fetchData();
    } catch (err) {
      setRegMsg(err.response?.data?.message || 'Registration failed.');
    } finally { setRegLoad(false); }
  };

  // ── Edit Profile save ─────────────────────────────────────────────────────
  const handleEditSave = async e => {
    e.preventDefault();
    if (!editForm.skills.length) return setEditMsg({ type: 'error', text: 'Select at least one skill.' });
    setEditLoad(true);
    setEditMsg({ type: '', text: '' });
    try {
      const gps = profile?.availability ? await getGPS() : null;
      await api.patch('/volunteer/profile', {
        name:           editForm.name,
        phone:          editForm.phone,
        skills:         editForm.skills,
        availableSlots: editForm.availableSlots,
        city:           editForm.city,
        area:           editForm.area,
        latitude:       gps?.latitude  ?? null,
        longitude:      gps?.longitude ?? null,
      });
      setEditMsg({ type: 'success', text: '✅ Profile updated successfully!' });
      fetchData();
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally { setEditLoad(false); }
  };

  // ── Availability toggle ───────────────────────────────────────────────────
  const handleToggleAvailability = async () => {
    setToggling(true);
    setAvailMsg('');
    try {
      const goingOnline = !profile?.availability;
      const gps = goingOnline ? await getGPS() : null;

      if (goingOnline && !gps) {
        setAvailMsg('⚠️ Could not get your location. Please allow location access and try again.');
        setToggling(false);
        return;
      }
      const { data } = await api.patch('/volunteer/availability', {
        availability: goingOnline,
        latitude:     gps?.latitude  ?? null,
        longitude:    gps?.longitude ?? null,
      });

      fetchData();

      if (goingOnline) {
        setAvailMsg(data.nearbyCount > 0
          ? `✅ You are now online near (${gps.latitude.toFixed(3)}, ${gps.longitude.toFixed(3)}). ${data.nearbyCount} nearby request(s) found — check your notifications!`
          : `✅ You are now online near (${gps.latitude.toFixed(3)}, ${gps.longitude.toFixed(3)}). No nearby requests at the moment.`);
      } else {
        setAvailMsg('⏸️ You are now offline. You will not receive task notifications.');
      }
    } catch (err) {
      setAvailMsg(err.response?.data?.message || 'Could not update availability.');
    } finally { setToggling(false); }
  };

  // ── Task respond ──────────────────────────────────────────────────────────
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

      {/* Live location status banner */}
      {locStatus && (
        <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          locStatus === 'fetching' ? 'bg-blue-50 border-blue-200 text-blue-700' :
          locStatus === 'saved'    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          locStatus === 'denied'   ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                     'bg-rose-50 border-rose-200 text-rose-600'
        }`}>
          {locStatus === 'fetching' && <><span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" /> Detecting your location...</>}
          {locStatus === 'saved'    && <><span className="text-base">📍</span> Your live location has been saved. The system will use it to find nearby requests.</>}
          {locStatus === 'denied'   && <><span className="text-base">⚠️</span> Location access denied. Enable it in browser settings for better task matching.</>}
          {locStatus === 'error'    && <><span className="text-base">❌</span> Could not save location. You may not have a volunteer profile yet.</>}
        </div>
      )}

      {dataLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Profile banner */}
          {profile && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-indigo-600 text-lg font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email} · {profile.city}{profile.area ? ', ' + profile.area : ''}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.skills.map(s => (
                      <span key={s} className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Availability toggle */}
                  <button
                    onClick={handleToggleAvailability}
                    disabled={toggling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition disabled:opacity-60 ${
                      profile.availability
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${profile.availability ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    {toggling ? 'Updating...' : profile.availability ? 'Online' : 'Offline'}
                  </button>
                  {/* Edit profile button */}
                  <button
                    onClick={() => setEditOpen(o => !o)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    {editOpen ? 'Cancel' : '✏️ Edit Profile'}
                  </button>
                </div>
              </div>

              {/* Availability message */}
              {availMsg && (
                <div className={`text-xs px-3 py-2 rounded-xl border ${
                  availMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : availMsg.startsWith('⏸') ? 'bg-gray-50 text-gray-600 border-gray-200'
                  : 'bg-red-50 text-red-600 border-red-100'
                }`}>{availMsg}</div>
              )}

              {/* Stats row */}
              <div className="flex gap-4 pt-2 border-t border-gray-100">
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

              {/* Edit Profile Panel */}
              {editOpen && (
                <form onSubmit={handleEditSave} className="flex flex-col gap-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">✏️ Edit Profile</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full name" className={INPUT} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                      <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="e.g. 9876543210" className={INPUT} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">City</label>
                      <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="City" className={INPUT} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Area</label>
                      <input value={editForm.area} onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))}
                        placeholder="Area / Locality" className={INPUT} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map(s => (
                        <button type="button" key={s} onClick={() => toggleEdit('skills', s)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                            editForm.skills.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Available Slots</p>
                    <div className="flex flex-wrap gap-2">
                      {SLOTS.map(s => (
                        <button type="button" key={s} onClick={() => toggleEdit('availableSlots', s)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                            editForm.availableSlots.includes(s) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>

                  {editMsg.text && (
                    <div className={`text-xs px-3 py-2 rounded-xl border ${
                      editMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>{editMsg.text}</div>
                  )}

                  <button type="submit" disabled={editLoad}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-60">
                    {editLoad ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
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
                  <p className="text-xs font-semibold text-gray-600 mb-2">Location <span className="text-rose-500">*</span></p>
                  <LocationSelector
                    value={form.location}
                    onChange={loc => setForm(f => ({ ...f, location: loc }))}
                  />
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
