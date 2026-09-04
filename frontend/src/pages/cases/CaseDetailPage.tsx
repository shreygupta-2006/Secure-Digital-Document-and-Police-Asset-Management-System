import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderOpen,
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  RefreshCw,
  Edit2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';
import { CaseRecord, CaseAssignment, User } from '../../types';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ARCHIVED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ACTIVE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.OPEN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
}

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAdmin = hasRole(['ADMIN']);

  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOfficers, setActiveOfficers] = useState<User[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [assignmentRemarks, setAssignmentRemarks] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch case data
  const loadCase = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await apiClient.get<CaseRecord>(`/api/cases/${id}`);
      setCaseData(data.data);
    } catch {
      showToast('Error', 'Failed to load case details.', 'error');
      navigate('/cases');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  // Fetch active officers for assignment dropdown
  const loadOfficers = useCallback(async () => {
    try {
      const res = await apiClient.get<User[]>('/api/auth/users');
      // Filter to only ACTIVE OFFICERs
      const officers = (res.data || []).filter(
        (u) => u.role === 'OFFICER' && (!u.status || u.status === 'ACTIVE')
      );
      setActiveOfficers(officers);
    } catch {
      // silent — dropdown will be empty
    }
  }, []);

  useEffect(() => {
    loadCase();
    if (isAdmin) loadOfficers();
  }, [loadCase, loadOfficers, isAdmin]);

  // Open assign modal
  useEffect(() => {
    if (showAssignModal) {
      setSelectedOfficerId('');
      setAssignmentRemarks('');
    }
  }, [showAssignModal]);

  // Start editing
  const startEdit = () => {
    if (!caseData) return;
    setEditForm({
      title: caseData.title,
      description: caseData.description || '',
      status: caseData.status,
    });
    setIsEditing(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!id || !caseData) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/api/cases/${id}`, {
        caseNumber: caseData.caseNumber,
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
      });
      showToast('Case Updated', 'Case has been updated.', 'success');
      setIsEditing(false);
      loadCase();
    } catch {
      showToast('Error', 'Failed to update case.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Assign officer
  const handleAssign = async () => {
    if (!id || !selectedOfficerId) return;
    setIsAssigning(true);
    try {
      await apiClient.post(`/api/cases/${id}/assign`, {
        userId: Number(selectedOfficerId),
        remarks: assignmentRemarks || undefined,
      });
      showToast('Officer Assigned', 'Officer has been assigned to the case.', 'success');
      setShowAssignModal(false);
      loadCase();
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string }).displayMessage ||
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Could not assign officer.';
      showToast('Assign Failed', msg, 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Complete assignment
  const handleComplete = async (assignmentId: string | number) => {
    if (!id) return;
    setCompletingId(String(assignmentId));
    try {
      await apiClient.post(`/api/cases/${id}/assignments/${assignmentId}/complete`);
      showToast('Assignment Completed', 'Officer assignment has been completed.', 'success');
      loadCase();
    } catch {
      showToast('Error', 'Could not complete assignment.', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-xs text-slate-500">Loading case details...</div>
    );
  }

  if (!caseData) return null;

  const assignments = caseData.assignments || [];
  const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED');

  // Officers not yet assigned
  const assignedUserIds = new Set(activeAssignments.map((a) => String(a.userId)));
  const availableOfficers = activeOfficers.filter((o) => !assignedUserIds.has(String(o.id)));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Cases', href: '/cases' },
              { label: caseData.caseNumber },
            ]}
          />
          <div className="flex items-center gap-2 mt-1">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {caseData.caseNumber}
            </h1>
            <StatusBadge status={caseData.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Back to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Case Info Card */}
      <div className="p-4 rounded-md border border-slate-200 bg-white shadow-2xs">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">{caseData.title}</h2>
            {caseData.description && (
              <p className="text-xs text-slate-600 mb-2">{caseData.description}</p>
            )}
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              {caseData.createdAt && (
                <span>Created: {new Date(caseData.createdAt).toLocaleDateString()}</span>
              )}
              {caseData.updatedAt && (
                <span>Updated: {new Date(caseData.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Officers Section */}
      <div className="p-4 rounded-md border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Assigned Officers ({activeAssignments.length})
            </h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign Officer
            </button>
          )}
        </div>

        {activeAssignments.length === 0 ? (
          <EmptyState
            title="No Active Assignments"
            description={
              isAdmin
                ? 'No officers are currently assigned to this case.'
                : 'No officers assigned yet.'
            }
          />
        ) : (
          <div className="space-y-2">
            {activeAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded border border-slate-100 bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-semibold">
                    {a.userName
                      ?.split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">{a.userName}</div>
                    {a.remarks && (
                      <div className="text-[11px] text-slate-500">{a.remarks}</div>
                    )}
                    {a.createdAt && (
                      <div className="text-[10px] text-slate-400">
                        Assigned: {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {isAdmin && (
                    <button
                      onClick={() => handleComplete(a.id)}
                      disabled={completingId === String(a.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors disabled:opacity-50"
                      title="Mark assignment as completed"
                    >
                      {completingId === String(a.id) ? '...' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed assignments */}
        {completedAssignments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-[11px] font-medium text-slate-500 mb-2 uppercase tracking-wide">
              Completed Assignments
            </h4>
            <div className="space-y-1.5">
              {completedAssignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50/60 opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600">{a.userName}</span>
                    {a.remarks && (
                      <span className="text-[11px] text-slate-400">- {a.remarks}</span>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-lg p-5 w-full max-w-md mx-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Assign Officer to {caseData.caseNumber}
            </h3>

            {availableOfficers.length === 0 ? (
              <p className="text-xs text-slate-500 mb-4">
                No eligible officers available for assignment. All active officers are already
                assigned to this case.
              </p>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Select Officer
                  </label>
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Choose Officer --</option>
                    {availableOfficers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                        {o.badgeNumber ? ` (${o.badgeNumber})` : ''}
                        {o.department ? ` - ${o.department}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Remarks (optional)
                  </label>
                  <input
                    type="text"
                    value={assignmentRemarks}
                    onChange={(e) => setAssignmentRemarks(e.target.value)}
                    placeholder="e.g. Lead investigating officer"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              {availableOfficers.length > 0 && (
                <button
                  onClick={handleAssign}
                  disabled={!selectedOfficerId || isAssigning}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
