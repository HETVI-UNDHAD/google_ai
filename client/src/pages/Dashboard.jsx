import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const StatCard = ({ label, value, color, icon }) => (
  <div className={`rounded-2xl p-5 text-white ${color} flex items-center gap-4 shadow-sm`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-90">{label}</p>
    </div>
  </div>
);

const QuickLink = ({ to, icon, label, desc, color }) => (
  <Link to={to} className={`rounded-2xl p-5 border-2 ${color} flex items-start gap-4 hover:shadow-md transition bg-white`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]           = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [topRequests, setTopRequests] = useState([]);

  useEffect(() => {
    api.get('/requests/sorted').then(({ data }) => {
      setTopRequests(data.slice(0, 4));
      setStats({
        total:      data.length,
        pending:    data.filter((r) => r.status === 'Pending').length,
        inProgress: data.filter((r) => r.status === 'In Progress').length,
        resolved:   data.filter((r) => r.status === 'Resolved').length,
      });
    }).catch(() => {});
  }, []);

  const URGENCY_DOT = { 1: 'bg-green-500', 2: 'bg-yellow-500', 3: 'bg-red-500' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">
          Logged in as <span className="font-medium text-indigo-600">{user?.role}</span> · {user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Requests"  value={stats.total}      color="bg-indigo-500" icon="📋" />
        <StatCard label="Pending"         value={stats.pending}    color="bg-yellow-500" icon="⏳" />
        <StatCard label="In Progress"     value={stats.inProgress} color="bg-blue-500"   icon="🔄" />
        <StatCard label="Resolved"        value={stats.resolved}   color="bg-green-500"  icon="✅" />
      </div>

      {/* Quick links by role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {user?.role === 'Admin' && <>
          <QuickLink to="/admin"       icon="🛡️" label="Admin Panel"    desc="Manage users & volunteers"     color="border-red-200" />
          <QuickLink to="/assignments" icon="🔗" label="Assignments"    desc="Run matching & view tasks"     color="border-indigo-200" />
          <QuickLink to="/ngo"         icon="📝" label="Submit Request" desc="Add new resource request"      color="border-emerald-200" />
        </>}
        {user?.role === 'NGO' && <>
          <QuickLink to="/ngo"      icon="📝" label="Submit Request" desc="Create a new request"          color="border-emerald-200" />
          <QuickLink to="/ngo"      icon="📤" label="Upload Data"    desc="Upload CSV or Excel file"      color="border-blue-200" />
          <QuickLink to="/requests" icon="📋" label="View Requests"  desc="Track all submitted requests"  color="border-indigo-200" />
        </>}
        {user?.role === 'Volunteer' && <>
          <QuickLink to="/volunteer" icon="🙋" label="My Tasks"      desc="View & respond to assignments" color="border-blue-200" />
          <QuickLink to="/requests"  icon="📋" label="All Requests"  desc="Browse active requests"        color="border-indigo-200" />
        </>}
      </div>

      {/* Top priority requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">🔥 Top Priority Requests</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {topRequests.length === 0 ? (
            <p className="text-gray-400 text-sm p-6">No requests yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Urgency</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.title}</td>
                    <td className="px-4 py-3 text-gray-500">{r.category}</td>
                    <td className="px-4 py-3 text-gray-500">{r.city}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${URGENCY_DOT[r.urgency]}`}></span>
                      {['', 'Low', 'Medium', 'High'][r.urgency]}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.status}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{r.priorityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
