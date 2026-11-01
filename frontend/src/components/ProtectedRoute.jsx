import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../lib/roles';

/** Only lets `allowedRole` through; everyone else is redirected somewhere sensible. */
export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to={homePathFor(user.role)} replace />;

  return children;
}
