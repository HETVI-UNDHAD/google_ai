import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage        from './pages/AuthPage';
import Dashboard       from './pages/Dashboard';
import RequestsPage    from './pages/RequestsPage';
import VolunteerPage   from './pages/VolunteerPage';
import AssignmentsPage from './pages/AssignmentsPage';
import NgoDashboard    from './pages/NgoDashboard';
import AdminDashboard  from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

function AppLayout() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="flex h-screen bg-[#f4f6fb] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/requests"  element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
          <Route path="/volunteer" element={<ProtectedRoute roles={['Volunteer']}><VolunteerPage /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute roles={['Admin']}><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/ngo"   element={<ProtectedRoute roles={['NGO','Admin']}><NgoDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
