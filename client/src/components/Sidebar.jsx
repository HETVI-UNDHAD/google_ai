import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_NAV = {
  Admin: [
    { to: '/dashboard',   icon: GridIcon,    label: 'Dashboard' },
    { to: '/requests',    icon: ListIcon,    label: 'Requests' },
    { to: '/assignments', icon: LinkIcon,    label: 'Assignments' },
    { to: '/ngo',         icon: PlusIcon,    label: 'NGO Portal' },
    { to: '/admin',       icon: ShieldIcon,  label: 'Admin Panel' },
  ],
  NGO: [
    { to: '/dashboard', icon: GridIcon,  label: 'Dashboard' },
    { to: '/requests',  icon: ListIcon,  label: 'Requests' },
    { to: '/ngo',       icon: PlusIcon,  label: 'NGO Portal' },
  ],
  Volunteer: [
    { to: '/dashboard', icon: GridIcon,  label: 'Dashboard' },
    { to: '/requests',  icon: ListIcon,  label: 'Requests' },
    { to: '/volunteer', icon: UserIcon,  label: 'My Tasks' },
  ],
};

const ROLE_BADGE = {
  Admin:     'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  NGO:       'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Volunteer: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const links = ROLE_NAV[user?.role] || [];

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} transition-all duration-300 bg-[#0f1117] flex flex-col h-screen shrink-0 border-r border-white/5`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">SmartAlloc</p>
              <p className="text-white/30 text-[10px] mt-0.5">NGO Resource System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} className={`text-white/30 hover:text-white/70 transition ${collapsed ? 'hidden' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {!collapsed && <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Navigation</p>}
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
              ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <span className="text-indigo-300 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_BADGE[user?.role]}`}>{user?.role}</span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
              className="text-white/30 hover:text-rose-400 transition">
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex justify-center text-white/30 hover:text-rose-400 transition py-1">
            <LogoutIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

function GridIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function ListIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function LinkIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function PlusIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ShieldIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function UserIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function LogoutIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
