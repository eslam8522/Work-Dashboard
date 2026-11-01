import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import { homePathFor } from './lib/roles';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerSubmissions from './pages/WorkerSubmissions';
import AdminDashboard from './pages/AdminDashboard';
import AdminReview from './pages/AdminReview';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

/** Signed-in users skip the login/register screens. */
function GuestOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homePathFor(user.role)} replace /> : children;
}

/** "/" and unknown URLs go to the right place for whoever is looking. */
function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route path="/superadmin" element={<ProtectedRoute allowedRole="SUPERADMIN"><SuperAdminDashboard /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedRole="ADMIN"><AdminReview /></ProtectedRoute>} />

          <Route path="/worker" element={<ProtectedRoute allowedRole="WORKER"><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/worker/submissions" element={<ProtectedRoute allowedRole="WORKER"><WorkerSubmissions /></ProtectedRoute>} />

          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
