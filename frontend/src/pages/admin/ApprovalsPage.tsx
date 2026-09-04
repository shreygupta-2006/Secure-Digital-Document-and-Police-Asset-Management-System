import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserX,
  Shield,
  Clock,
  BadgeAlert,
  Building2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';
import { User, UserRole } from '../../types';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

const NON_ADMIN_ROLES: { value: UserRole; label: string }[] = [
  { value: 'OFFICER', label: 'Patrol Officer' },
  { value: 'STORE_KEEPER', label: 'Supply Officer' },
  { value: 'AUDITOR', label: 'Compliance Inspector' },
  { value: 'VIEWER', label: 'Viewer' },
];

export const ApprovalsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Per-user role selections: keyed by user ID (string)
  const [roleSelections, setRoleSelections] = useState<Record<string, UserRole>>({});
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);

  const loadPending = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<User[]>('/api/auth/pending');
      setPendingUsers(res.data);
    } catch {
      showToast('Error', 'Failed to load pending registrations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (user: User, role: UserRole) => {
    setProcessingUserId(String(user.id));
    try {
      await apiClient.post(`/api/auth/pending/${user.id}/approve`, { role });
      showToast('User Approved', `${user.name} has been approved as ${role}.`, 'success');
      loadPending();
    } catch {
      showToast('Approval Failed', 'Could not approve user.', 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessingUserId(String(rejectTarget.id));
    try {
      await apiClient.post(`/api/auth/pending/${rejectTarget.id}/reject`);
      showToast('User Rejected', `${rejectTarget.name}'s registration has been rejected.`, 'warning');
      setShowRejectModal(false);
      setRejectTarget(null);
      loadPending();
    } catch {
      showToast('Rejection Failed', 'Could not reject user.', 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  if (!hasRole(['ADMIN'])) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Approvals' }]} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Pending Registration Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and approve new account requests. Assign appropriate roles during approval.
          </p>
        </div>

        <button
          onClick={loadPending}
          className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading pending registrations...</div>
      ) : pendingUsers.length === 0 ? (
        <EmptyState
          title="No Pending Approvals"
          description="All registration requests have been processed. New registrations will appear here."
          className="my-8"
        />
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((user) => {
            const userRole = roleSelections[String(user.id)] || (user.role as UserRole) || 'OFFICER';
            const isProcessing = processingUserId === String(user.id);

            return (
              <div
                key={user.id}
                className="p-4 rounded-md border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-900">{user.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        PENDING
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.badgeNumber && (
                        <div className="flex items-center gap-1">
                          <BadgeAlert className="w-3 h-3 text-slate-400" />
                          <span>{user.badgeNumber}</span>
                        </div>
                      )}
                      {user.department && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{user.department}</span>
                        </div>
                      )}
                      {user.createdAt && (
                        <div className="text-slate-400">
                          Registered: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Show requested role from registration */}
                    <div className="mt-1 text-[11px] text-slate-500">
                      Requested role: <span className="font-medium text-slate-700">
                        {NON_ADMIN_ROLES.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={userRole}
                      onChange={(e) => {
                        setRoleSelections(prev => ({ ...prev, [String(user.id)]: e.target.value as UserRole }));
                      }}
                      disabled={isProcessing}
                      className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                    >
                      {NON_ADMIN_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                      <option value="ADMIN">Admin</option>
                    </select>

                    <button
                      onClick={() => handleApprove(user, userRole)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'Approving...' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectTarget(user);
                        setShowRejectModal(true);
                      }}
                      disabled={isProcessing}
                      className="p-1.5 rounded border border-slate-300 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs disabled:opacity-50"
                      title="Reject"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectTarget(null); }}
        onConfirm={handleReject}
        title="Reject Registration"
        message={`Are you sure you want to reject ${rejectTarget?.name}'s registration? They will not be able to log in.`}
        confirmLabel="Reject"
        variant="danger"
        isLoading={processingUserId === String(rejectTarget?.id ?? '')}
      />
    </div>
  );
};
