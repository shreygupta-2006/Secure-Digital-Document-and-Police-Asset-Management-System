import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  UserCheck,
  Truck,
  Wrench,
  Archive,
  Trash2,
  Edit2,
  Calendar,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  DollarSign,
  Plus,
  RefreshCw,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getAssetByIdApi,
  getAssetAssignmentsApi,
  getAssetMovementsApi,
  getAssetMaintenanceApi,
  assignAssetApi,
  returnAssetApi,
  moveAssetApi,
  createMaintenanceApi,
  completeMaintenanceApi,
  retireAssetApi,
  deleteAssetApi,
  getUsersApi,
} from '../../api/assets';
import {
  Asset,
  AssetAssignment,
  AssetMovement,
  AssetMaintenance,
  UserRole,
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { getErrorMessage } from '../../api/client';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ASSIGNMENTS' | 'MOVEMENTS' | 'MAINTENANCE'>('OVERVIEW');

  // Modal workflows state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users list for assignment dropdown
  const [usersList, setUsersList] = useState<Array<{ id: number; name: string; email: string; role: string }>>([]);

  // Form states for modals
  const [assignForm, setAssignForm] = useState({
    userId: '',
    remarks: '',
  });

  const [moveForm, setMoveForm] = useState({
    toLocation: '',
    reason: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    description: '',
    cost: '',
    remarks: '',
  });

  const [retireReason, setRetireReason] = useState('');

  const fetchAssetData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [assetData, asgData, mvtData, mntData] = await Promise.all([
        getAssetByIdApi(id),
        getAssetAssignmentsApi(id),
        getAssetMovementsApi(id),
        getAssetMaintenanceApi(id),
      ]);
      setAsset(assetData);
      setAssignments(asgData);
      setMovements(mvtData);
      setMaintenance(mntData);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to retrieve asset details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch users for assignment dropdown
  useEffect(() => {
    getUsersApi().then(setUsersList).catch(() => setUsersList([]));
  }, []);

  useEffect(() => {
    fetchAssetData();
  }, [fetchAssetData]);

  // Handle Assignment Submission
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !assignForm.userId) return;
    setIsSubmitting(true);
    try {
      await assignAssetApi(id, {
        userId: assignForm.userId,
        remarks: assignForm.remarks,
      });
      const assignedUser = usersList.find(u => String(u.id) === String(assignForm.userId));
      showToast('Asset Assigned', `Issued to ${assignedUser?.name || 'user'}`, 'success');
      setIsAssignModalOpen(false);
      fetchAssetData();
    } catch (err: unknown) {
      showToast('Assignment Error', getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Return Asset
  const handleReturnAsset = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await returnAssetApi(id, 'Check-in returned to armory inventory.');
      showToast('Asset Returned', 'Asset custody restored to Armory inventory.', 'success');
      fetchAssetData();
    } catch (err: unknown) {
      showToast('Return Failed', getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Movement Submission
  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await moveAssetApi(id, {
        toLocation: moveForm.toLocation,
        reason: moveForm.reason,
      });
      showToast('Movement Logged', `Transferred to ${moveForm.toLocation}`, 'success');
      setIsMoveModalOpen(false);
      setMoveForm({ toLocation: '', reason: '' });
      fetchAssetData();
    } catch (err: unknown) {
      showToast('Movement Error', getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Maintenance Submission
  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await createMaintenanceApi(id, {
        description: maintenanceForm.description,
        cost: maintenanceForm.cost !== '' ? Number(maintenanceForm.cost) : undefined,
        remarks: maintenanceForm.remarks,
      });
      showToast('Maintenance Scheduled', 'Service ticket created and asset status updated.', 'success');
      setIsMaintenanceModalOpen(false);
      fetchAssetData();
    } catch (err: unknown) {
      showToast('Maintenance Error', getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Complete Maintenance
  const handleCompleteMaintenance = async (maintenanceId: string | number) => {
    setIsSubmitting(true);
    try {
      await completeMaintenanceApi(maintenanceId);
      showToast('Maintenance Completed', 'Service order marked as completed.', 'success');
      fetchAssetData();
    } catch (err: unknown) {
      showToast('Completion Failed', getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Retire Submission
  const handleRetireSubmit = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await retireAssetApi(id, retireReason || 'Routine operational decommission lifecycle');
      showToast('Asset Retired', 'Asset transitioned to decommissioned inventory.', 'warning');
      setIsRetireModalOpen(false);
      fetchAssetData();
    } catch (err: unknown) {
      showToast('Retire Failed', getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await deleteAssetApi(id);
      showToast('Record Expunged', 'Asset record removed from system database.', 'info');
      navigate('/assets');
    } catch (err: unknown) {
      showToast('Deletion Failed', getErrorMessage(err), 'error');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !asset) {
    return (
      <ErrorState
        title="Asset Profile Error"
        message={error || 'Asset record could not be found.'}
        onRetry={fetchAssetData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', href: '/dashboard' },
              { label: 'Assets', href: '/assets' },
              { label: asset.assetCode },
            ]}
          />
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {asset.name}
            </h2>
            <StatusBadge status={asset.status} />
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            Tag: <span className="text-blue-600 font-semibold">{asset.assetCode}</span> • Serial: {asset.serialNumber} • Category: {asset.category}
          </div>
        </div>

        {/* Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {hasRole(['ADMIN', 'STORE_KEEPER']) && (
            <Link
              to={`/assets/${asset.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Asset</span>
            </Link>
          )}

          {/* Quick Assign / Return Button */}
          {hasRole(['ADMIN', 'STORE_KEEPER']) && asset.status === 'AVAILABLE' && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Asset</span>
            </button>
          )}

          {hasRole(['ADMIN', 'STORE_KEEPER', 'OFFICER']) && asset.status === 'ASSIGNED' && (
            <button
              onClick={handleReturnAsset}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Return To Armory</span>
            </button>
          )}

          {/* Quick Move Button */}
          {hasRole(['ADMIN', 'STORE_KEEPER']) && (
            <button
              onClick={() => setIsMoveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Relocate</span>
            </button>
          )}

          {/* Schedule Maintenance */}
          {hasRole(['ADMIN', 'STORE_KEEPER']) && asset.status !== 'RETIRED' && (
            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors shadow-2xs"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Order</span>
            </button>
          )}

          {/* Retire Asset */}
          {hasRole(['ADMIN', 'STORE_KEEPER']) && asset.status !== 'RETIRED' && (
            <button
              onClick={() => setIsRetireModalOpen(true)}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-500 hover:text-amber-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Decommission / Retire"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}

          {/* Admin Delete */}
          {hasRole(['ADMIN']) && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-500 hover:text-rose-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Delete Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Asset Overview & Specs
        </button>
        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Assignment History</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700 font-medium">
            {assignments.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MOVEMENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Movement History</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700 font-medium">
            {movements.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MAINTENANCE'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Maintenance & Repairs</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700 font-medium">
            {maintenance.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Specs (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Specs Card */}
            <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 font-mono">
                Technical Specifications & Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Manufacturer</span>
                  <span className="font-semibold text-slate-900">{asset.manufacturer || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Model Designation</span>
                  <span className="font-semibold text-slate-900">{asset.model || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-semibold text-slate-900 font-mono">{asset.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Serial Number</span>
                  <span className="font-semibold text-slate-900 font-mono">{asset.serialNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Condition Rating</span>
                  <span className="font-semibold text-emerald-700 font-mono">{asset.condition || 'GOOD'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Location</span>
                  <span className="font-semibold text-slate-900">{asset.location || 'N/A'}</span>
                </div>
              </div>

              {/* Dynamic Specifications */}
              {asset.specifications && Object.keys(asset.specifications).length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">
                    Extended Technical Attributes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {Object.entries(asset.specifications).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 capitalize block text-[11px]">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-mono text-slate-900 font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {asset.notes && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                    Operational Field Notes & Protocol
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
                    {asset.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Custody & Lifecycle */}
          <div className="space-y-6">
            {/* Current Custody Card */}
            <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 pb-2 border-b border-slate-100 font-mono flex items-center justify-between">
                <span>Current Custody</span>
                <Shield className="w-3.5 h-3.5 text-blue-600" />
              </h3>

              {(() => {
                // Source of truth for "who currently holds this asset" is the
                // active assignment record, not a display-only field — this
                // keeps the custody panel consistent with asset.status instead
                // of contradicting it (e.g. an asset IN_MAINTENANCE must never
                // read as "In Armory / Available").
                const activeAssignment = assignments.find((a) => a.status === 'ACTIVE');
                const issuedTo = activeAssignment?.assignedToName || asset.assignedOfficerName;

                if (issuedTo) {
                  return (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                        <div className="text-[11px] text-blue-700 uppercase font-semibold">
                          Issued Officer
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {issuedTo}
                        </div>
                        <div className="text-[11px] text-blue-700 font-mono mt-1 font-medium">
                          Status: Active Duty Assignment
                        </div>
                      </div>

                      <div className="text-slate-500 text-[11px] leading-relaxed">
                        Weapon / equipment custody is bound to this personnel under departmental custody regulations.
                      </div>
                    </div>
                  );
                }

                if (asset.status === 'IN_MAINTENANCE') {
                  return (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2 text-amber-500">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-slate-800">Under Maintenance</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {asset.location ? `Maintenance facility: ${asset.location}` : 'Not available for custody assignment'}
                      </div>
                    </div>
                  );
                }

                if (asset.status === 'RETIRED') {
                  return (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2 text-rose-500">
                        <Archive className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-slate-800">Retired / Decommissioned</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">No longer available for custody assignment</div>
                    </div>
                  );
                }

                if (asset.status === 'LOST' || asset.status === 'DAMAGED') {
                  return (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2 text-rose-500">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-slate-800">{asset.status === 'LOST' ? 'Reported Lost' : 'Reported Damaged'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Not available for custody assignment</div>
                    </div>
                  );
                }

                return (
                  <div className="py-4 text-center text-xs text-slate-500">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-slate-800">In Armory / Available</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">No active officer custody</div>
                  </div>
                );
              })()}
            </div>

            {/* Procurement & Lifecycle Card */}
            <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs text-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 font-mono">
                Procurement & Lifecycle
              </h3>

              <div className="flex justify-between">
                <span className="text-slate-500">Acquisition Date:</span>
                <span className="font-mono text-slate-900">{asset.purchaseDate || '2023-01-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Warranty Expiration:</span>
                <span className="font-mono text-slate-900">{asset.warrantyExpiry || '2027-01-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Cost:</span>
                <span className="font-mono text-slate-900">
                  {asset.purchasePrice != null && asset.purchasePrice > 0 ? `$${Number(asset.purchasePrice).toLocaleString()}` : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Record Created:</span>
                <span className="font-mono text-slate-900">
                  {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASSIGNMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Chain of Custody Assignment History
            </h3>
            {hasRole(['ADMIN', 'STORE_KEEPER']) && asset.status === 'AVAILABLE' && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Assignment</span>
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              title="No Assignment Records"
              description="This asset has never been issued to personnel or all prior records are archived."
              className="m-4"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Officer / Assignee</th>
                    <th className="py-2.5 px-4 font-medium">Issued By</th>
                    <th className="py-2.5 px-4 font-medium">Assigned At</th>
                    <th className="py-2.5 px-4 font-medium">Returned At</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{asg.assignedToName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {asg.assignedByName || 'Quartermaster'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {asg.assignedAt ? new Date(asg.assignedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {asg.returnedAt
                          ? new Date(asg.returnedAt).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={asg.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {asg.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MOVEMENTS */}
      {activeTab === 'MOVEMENTS' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Physical Location & Logistics Movements
            </h3>
            {hasRole(['ADMIN', 'STORE_KEEPER']) && (
              <button
                onClick={() => setIsMoveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Movement</span>
              </button>
            )}
          </div>

          {movements.length === 0 ? (
            <EmptyState
              title="No Movement Records"
              description="No physical relocation transactions have been logged for this item."
              className="m-4"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Origin Location</th>
                    <th className="py-2.5 px-4 font-medium">Destination Location</th>
                    <th className="py-2.5 px-4 font-medium">Transfer Date</th>
                    <th className="py-2.5 px-4 font-medium">Authorized By</th>
                    <th className="py-2.5 px-4 font-medium">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mvt) => (
                    <tr key={mvt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-700 font-medium">{mvt.fromLocation}</td>
                      <td className="py-3 px-4 text-blue-700 font-semibold">{mvt.toLocation}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {mvt.movedAt ? new Date(mvt.movedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{mvt.movedByName}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm leading-relaxed">
                        {mvt.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MAINTENANCE */}
      {activeTab === 'MAINTENANCE' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Diagnostic, Inspection & Maintenance Records
            </h3>
            {hasRole(['ADMIN', 'STORE_KEEPER']) && (
              <button
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Repair</span>
              </button>
            )}
          </div>

          {maintenance.length === 0 ? (
            <EmptyState
              title="No Maintenance Logged"
              description="No service repairs or diagnostic inspections have been performed on this item."
              className="m-4"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Description</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Performed By</th>
                    <th className="py-2.5 px-4 font-medium">Started</th>
                    <th className="py-2.5 px-4 font-medium">Completed</th>
                    <th className="py-2.5 px-4 font-medium">Cost</th>
                    <th className="py-2.5 px-4 font-medium">Remarks</th>
                    <th className="py-2.5 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenance.map((mnt) => (
                    <tr key={mnt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-slate-900 max-w-xs leading-relaxed">{mnt.description || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={mnt.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {mnt.performedByName || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {mnt.maintenanceDate ? new Date(mnt.maintenanceDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {mnt.completedDate ? new Date(mnt.completedDate).toLocaleDateString() : 'In Progress'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {mnt.cost != null && mnt.cost > 0 ? `$${Number(mnt.cost).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {mnt.remarks || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {mnt.status === 'IN_PROGRESS' && hasRole(['ADMIN', 'STORE_KEEPER']) && (
                          <button
                            onClick={() => handleCompleteMaintenance(mnt.id)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ASSIGN ASSET */}
      {isAssignModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl p-6 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Issue Asset Assignment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Assign custody of <span className="text-blue-600 font-semibold">{asset.assetCode}</span> to an authorized officer.
            </p>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Assign to User
                </label>
                <select
                  required
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">Select an officer...</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
                  ))}
                </select>
                {usersList.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">Loading users...</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={assignForm.remarks}
                  onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                  placeholder="Annual qualification verified; holster issued."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                >
                  {isSubmitting ? 'Recording...' : 'Authorize Custody'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVE ASSET */}
      {isMoveModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl p-6 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Log Asset Movement
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Current Location: <span className="text-slate-800 font-medium">{asset.location || 'N/A'}</span>
            </p>

            <form onSubmit={handleMoveSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  New Station / Vault Location
                </label>
                <input
                  type="text"
                  required
                  value={moveForm.toLocation}
                  onChange={(e) => setMoveForm({ ...moveForm, toLocation: e.target.value })}
                  placeholder="Precinct 2 Armory Vault Shelf 4"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Transfer Reason
                </label>
                <input
                  type="text"
                  required
                  value={moveForm.reason}
                  onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}
                  placeholder="Relocated for sector rebalance and maintenance review."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>



              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                >
                  {isSubmitting ? 'Recording...' : 'Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE MAINTENANCE */}
      {isMaintenanceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl p-6 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Schedule Maintenance Order
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Asset status will automatically transition to <span className="text-amber-700 font-mono font-medium">MAINTENANCE</span>.
            </p>

            <form onSubmit={handleMaintenanceSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="Routine Optical Recalibration & Zero Check. Details of defect, failure mode, or standard diagnostic schedule."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Cost (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={maintenanceForm.remarks}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, remarks: e.target.value })}
                    placeholder="Metro Tactical Maintenance Bay"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-2xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}
      {/* Retire Modal */}
      <ConfirmationModal
        isOpen={isRetireModalOpen}
        onClose={() => setIsRetireModalOpen(false)}
        onConfirm={handleRetireSubmit}
        title="Confirm Decommission / Retirement"
        message={`Are you sure you want to permanently retire ${asset.assetCode} (${asset.name})? This marks the asset as end-of-lifecycle.`}
        confirmLabel="Retire Asset"
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Permanent Record Expungement"
        message={`WARNING: You are about to expunge asset record ${asset.assetCode} from the central database. This action is audited and irreversible.`}
        confirmLabel="Expunge Asset"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};
