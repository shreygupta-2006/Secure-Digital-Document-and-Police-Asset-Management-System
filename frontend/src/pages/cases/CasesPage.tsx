import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  RefreshCw,
  Users,
  Clock,
  Archive,
  CheckCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';
import { CaseRecord } from '../../types';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ARCHIVED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.OPEN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
}

export const CasesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CaseRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<CaseRecord[]>('/api/cases');
      setCases(data.data);
    } catch {
      showToast('Error', 'Failed to load cases.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const filtered = cases.filter(
    (c) =>
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(String(deleteTarget.id));
    try {
      await apiClient.delete(`/api/cases/${deleteTarget.id}`);
      showToast('Case Deleted', `${deleteTarget.caseNumber} has been archived.`, 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadCases();
    } catch {
      showToast('Delete Failed', 'Could not delete the case.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = hasRole(['ADMIN']);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cases' }]} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Case Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Manage investigation cases, assign officers, and track progress.'
              : 'View cases assigned to you.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCases}
            className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/cases/new')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Case
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading cases...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Cases Found"
          description={
            isAdmin
              ? 'No cases have been created yet. Click "Create Case" to begin.'
              : 'No cases are assigned to you yet. Contact an administrator.'
          }
          className="my-8"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const activeAssignments = (c.assignments || []).filter(
              (a) => a.status === 'ACTIVE'
            );
            const isDeleting = deletingId === String(c.id);

            return (
              <div
                key={c.id}
                className="p-4 rounded-md border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-900">
                        {c.caseNumber}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate">{c.title}</p>
                    {c.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{activeAssignments.length} officer(s) assigned</span>
                      </div>
                      {c.createdAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-medium transition-colors"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(c);
                          setShowDeleteModal(true);
                        }}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete Case"
        message={`Are you sure you want to delete ${deleteTarget?.caseNumber}? This will close all active assignments and remove the case.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingId === String(deleteTarget?.id ?? '')}
      />
    </div>
  );
};
