import { useEffect, useState } from 'react';
import api from '../api/axios';

const TABS = ['Overview', 'Users', 'Volunteers'];

const ROLE_COLOR = { Admin: 'bg-red-100 text-red-700', NGO: 'bg-emerald-100 text-emerald-700', Volunteer: 'bg-blue-100 text-blue-700' };

export default function AdminDashboard() {
  const [tab, setTab]           = useState(0);
  const [users, setUsers]       = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats]       = useState({ total: 0, pending: 0, resolved: 0, volunteers: 0, assignments: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/volunteers'),
      api.get('/requests'),
      api.get('/assignments'),
    ]).then(([u, v, r, a]) => {
      setUsers(u.data);
      setVolunteers(v.data);
      setStats({
        total:       r.data.length,
        pending:     r.data.filter((x) => x.status === 'Pending').length,
        resolved:    r.data.filter((x) => x.status === 'Resolved').length,
        volunteers:  v.data.length,
        assignments: a.data.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const StatBox = ({ label, value, color }) => (
    <div className={`rounded-2xl p-5 ${color} flex flex-col gap-1`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🛡️ Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">Full system overview and management.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1 w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition ${tab === i ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Tab 0: Overview */}
          {tab === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatBox label="Total Requests"  value={stats.total}       color="bg-indigo-500 text-white" />
              <StatBox label="Pending"         value={stats.pending}     color="bg-yellow-400 text-white" />
              <StatBox label="Resolved"        value={stats.resolved}    color="bg-green-500 text-white"  />
              <StatBox label="Volunteers"      value={stats.volunteers}  color="bg-blue-500 text-white"   />
              <StatBox label="Assignments"     value={stats.assignments} color="bg-purple-500 text-white" />
            </div>
          )}

          {/* Tab 1: Users */}
          {tab === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">All Users</h3>
                <span className="text-xs text-gray-400">{users.length} registered</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role]}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Volunteers */}
          {tab === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Registered Volunteers</h3>
                <span className="text-xs text-gray-400">{volunteers.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">City</th>
                      <th className="px-4 py-3 text-left">Skills</th>
                      <th className="px-4 py-3 text-left">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {volunteers.map((v) => (
                      <tr key={v._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{v.userId?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{v.userId?.email}</td>
                        <td className="px-4 py-3 text-gray-500">{v.city}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {v.skills.map((s) => (
                              <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.availability ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {v.availability ? 'Yes' : 'No'}
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
