import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Volunteer', 'NGO', 'Admin'];

export default function AuthPage() {
  const [tab,     setTab]     = useState('login');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'Volunteer' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      tab === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const INPUT = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50 focus:bg-white';

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] bg-[#0f1117] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg">SmartAlloc</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Connecting<br />communities with<br />
            <span className="text-indigo-400">the right help.</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            A smart resource allocation platform that matches NGO requests with skilled volunteers — automatically.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: '🎯', label: 'Priority-based request sorting' },
              { icon: '🤖', label: 'Automated volunteer matching' },
              { icon: '📊', label: 'Real-time analytics dashboard' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/50 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {[
            { role: 'Admin', email: 'admin@sras.com', pass: 'Admin@1234', color: 'border-rose-500/30 bg-rose-500/10' },
            { role: 'NGO',   email: 'ngo@sras.com',   pass: 'Ngo@1234',   color: 'border-emerald-500/30 bg-emerald-500/10' },
            { role: 'Vol',   email: 'ravi@sras.com',  pass: 'Ravi@1234',  color: 'border-sky-500/30 bg-sky-500/10' },
          ].map(d => (
            <div key={d.role} className={`flex-1 rounded-xl border p-3 ${d.color}`}>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wide mb-1">{d.role}</p>
              <p className="text-white/50 text-[10px] truncate">{d.email}</p>
              <p className="text-white/30 text-[10px]">{d.pass}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f4f6fb]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">SmartAlloc</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              {tab === 'login' ? 'Sign in to your account to continue.' : 'Join the SmartAlloc platform.'}
            </p>

            {/* Tab toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {tab === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name</label>
                  <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required className={INPUT} />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email Address</label>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Password</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className={INPUT} />
              </div>
              {tab === 'register' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Role</label>
                  <div className="flex gap-2">
                    {ROLES.map(r => (
                      <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${form.role === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-2.5 rounded-xl">
                  <span>⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Please wait...</>
                  : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
