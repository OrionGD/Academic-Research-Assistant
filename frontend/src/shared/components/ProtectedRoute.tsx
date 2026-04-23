import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  planTier?: 'BASIC' | 'STANDARD' | 'PRO';
}

export function ProtectedRoute({ children, planTier }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific plan is required, check access
  if (planTier) {
    const tiers = ['BASIC', 'STANDARD', 'PRO'];
    const userTierIndex = tiers.indexOf(user.planTier || 'BASIC');
    const requiredTierIndex = tiers.indexOf(planTier);

    if (userTierIndex < requiredTierIndex && user.role !== 'admin') {
      // Redirect to their own dashboard if they try to access a higher tier route
      const redirectPath = `/${user.planTier?.toLowerCase() || 'basic'}/dashboard`;
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}
