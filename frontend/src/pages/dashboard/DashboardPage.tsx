import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  CheckCircle2,
  UserCheck,
  Wrench,
  Plus,
  FileUp,
  Sparkles,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAssetsApi, getDashboardStatsApi } from '../../api/assets';
import { getDocumentsApi } from '../../api/documents';
import { getAuditLogsApi } from '../../api/audit';
import { Asset, DocumentRecord, AuditLog } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const [stats, setStats] = useState<{
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
    underMaintenance: number;
    retiredAssets: number;
  } | null>(null);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, assetsData, docsData, auditData] = await Promise.all([
        getDashboardStatsApi().catch(() => null),
        getAssetsApi({}).catch(() => ({ content: [], totalElements: 0, totalPages: 0 })),
        getDocumentsApi().catch(() => []),
        getAuditLogsApi({ size: 5 }).catch(() => ({ content: [], totalElements: 0, totalPages: 0 })),
      ]);

      setStats(statsData);
      setRecentAssets(assetsData.content.slice(0, 5));
      setRecentDocs((Array.isArray(docsData) ? docsData : []).slice(0, 4));
      setRecentAudit(auditData.content.slice(0, 5));
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to fetch dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <CardSkeleton count={5} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <ErrorState
        title="Dashboard Offline"
        message={error}
        onRetry={fetchDashboardData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, {user?.name || user?.fullName || 'Staff'}. Departmental asset overview and operational readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['ADMIN', 'STORE_KEEPER']) && (
            <Link
              to="/assets/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Asset</span>
            </Link>
          )}

          {hasRole(['ADMIN', 'OFFICER']) && (
            <Link
              to="/documents"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <FileUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Document</span>
            </Link>
          )}

          {hasRole(['ADMIN', 'OFFICER']) && (
            <Link
              to="/ai"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Assistant</span>
            </Link>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Assets</span>
            <div className="p-1.5 rounded bg-slate-100 text-slate-600"><Box className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats?.totalAssets ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cataloged department inventory</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available in Stock</span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">{stats?.availableAssets ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">Available in armory</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assigned to Personnel</span>
            <div className="p-1.5 rounded bg-blue-50 text-blue-600"><UserCheck className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600">{stats?.assignedAssets ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">Actively deployed</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Maintenance & Retired</span>
            <div className="p-1.5 rounded bg-amber-50 text-amber-600"><Wrench className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">{stats?.underMaintenance ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">{stats?.retiredAssets ?? 0} decommissioned</div>
          </div>
        </div>
      </div>

      {/* RECENT ASSETS + AI ASSISTANT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md shadow-2xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Assets</h2>
            <Link to="/assets" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all assets &rarr;</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Asset Tag</th>
                  <th className="px-4 py-2.5 font-medium">Asset Name</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {recentAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">{asset.assetCode}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">{asset.location}</td>
                    <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/assets/${asset.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View</Link>
                    </td>
                  </tr>
                ))}
                {recentAssets.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-xs">No assets registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Assistant card */}
        <div className="bg-white border border-slate-200 rounded-md shadow-2xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">AI Assistant</h2>
            </div>
            <Link to="/ai" className="text-xs font-medium text-blue-600 hover:text-blue-700">Open &rarr;</Link>
          </div>
          <div className="flex-1 p-4 space-y-3">
            <p className="text-xs text-slate-500">Query departmental SOPs, maintenance guides, and compliance policies.</p>
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quick Queries</div>
              <Link to="/ai" className="block p-2.5 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors text-xs text-slate-700">
                &ldquo;What is the maintenance protocol for duty firearms?&rdquo;
              </Link>
              <Link to="/ai" className="block p-2.5 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors text-xs text-slate-700">
                &ldquo;What are the custody reassignment steps?&rdquo;
              </Link>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border-t border-slate-100">
            <Link to="/ai" className="flex items-center justify-between w-full px-3 py-2 rounded bg-white hover:bg-slate-100 text-xs text-slate-700 border border-slate-200 transition-colors shadow-2xs">
              <span>Ask AI Assistant...</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* RECENT AUDIT + DOCUMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-md shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Audit Logs</h3>
            <Link to="/audit" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all &rarr;</Link>
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            {recentAudit.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-800 text-xs font-semibold">{(log.action || '').replace(/_/g, ' ')}</span>
                    <span className="text-[11px] text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs truncate max-w-md">{log.description || log.details || ''}</p>
                </div>
              </div>
            ))}
            {recentAudit.length === 0 && (
              <div className="py-4 text-center text-slate-500 text-xs">No audit records yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Documents</h3>
            <Link to="/documents" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all &rarr;</Link>
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <Link to={`/documents/${doc.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors truncate block max-w-md">
                    {doc.title}
                  </Link>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{(doc.documentType || 'DOCUMENT').replace(/_/g, ' ')}</span>
                    <span>&bull;</span>
                    <span>v{doc.latestVersion || 1}</span>
                    <span>&bull;</span>
                    <span>{((doc.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <Link to={`/documents/${doc.id}`} className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 transition-colors shrink-0 shadow-2xs">View</Link>
              </div>
            ))}
            {recentDocs.length === 0 && (
              <div className="py-4 text-center text-slate-500 text-xs">No documents uploaded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
