import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { DetailSkeleton } from './LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="p-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold font-mono uppercase text-slate-800">
          Access Restricted by Role
        </h3>
        <p className="mt-2 text-xs text-slate-600 max-w-md leading-relaxed">
          Your current security profile ({user?.role}) does not possess the requisite clearance to access this module. Contact the Division Systems Administrator.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return To Safe Module</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
