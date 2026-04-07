import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LINKS = {
  Admin:     [{ to: '/dashboard', label: 'Dashboard' }, { to: '/requests', label: 'Requests' }, { to: '/assignments', label: 'Assignments' }, { to: '/admin', label: 'Admin Panel' }],
  NGO:       [{ to: '/dashboard', label: 'Dashboard' }, { to: '/requests', label: 'Requests' }, { to: '/ngo', label: 'NGO Portal' }],
  Volunteer: [{ to: '/dashboard', label: 'Dashboard' }, { to: '/requests', label: 'Requests' }, { to: '/volunteer', label: 'My Tasks' }],
};

const ROLE_COLOR = { Admin: 'bg-red-500', NGO: 'bg-emerald-500', Volunteer: 'bg-blue-500' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const links = user ? (ROLE_LINKS[user.role] || []) : [];

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          🌐 <span>SmartAlloc</span>
        </Link>

        {/* Desktop */}
        {user && (
          <div className="hidden md:flex items-center gap-5 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.to} to={l.to}
                className={`transition hover:text-indigo-200 ${location.pathname === l.to ? 'text-white border-b-2 border-white pb-0.5' : 'text-indigo-200'}`}
              >
                {l.label}
              </Link>
            ))}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${ROLE_COLOR[user.role]}`}>
              {user.role}
            </span>
            <span className="text-indigo-300 text-xs">{user.name}</span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="bg-white text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile toggle */}
        {user && (
          <button className="md:hidden text-white" onClick={() => setOpen((o) => !o)}>
            {open ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {open && user && (
        <div className="md:hidden bg-indigo-800 px-4 pb-4 flex flex-col gap-3 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-indigo-100 hover:text-white">
              {l.label}
            </Link>
          ))}
          <button onClick={() => { logout(); navigate('/login'); }} className="text-left text-red-300">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
