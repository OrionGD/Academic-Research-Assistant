import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './LoadingStates';

/**
 * AdminRoute – renders children only for authenticated admin users.
 *
 * Behaviour:
 *  - While auth is loading → show spinner (prevents flash / premature redirect).
 *  - Not logged in → redirect to /login, preserving the intended URL.
 *  - Logged in but NOT admin → redirect to /dashboard (graceful, no 403 on the wire).
 *  - Logged in AND admin → render children.
 *
 * This ensures /api/admin/* endpoints are only called by users who already
 * have the Firebase custom claim `admin: true`, eliminating spurious 403 errors.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.isAdmin) {
    // Non-admin users are silently redirected — no 403 API call is made at all.
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
