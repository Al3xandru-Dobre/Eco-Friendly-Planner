import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Primitives';

export function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <div className="container page"><Spinner center /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
