import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Eye,
  RefreshCw,
  X,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAuditLogsApi, AuditFilterParams } from '../../api/audit';
import { AuditLog } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Pagination } from '../../components/common/Pagination';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const AuditLogsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userQuery, setUserQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Selected Log for Inspection
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AuditFilterParams = {
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        userId: userQuery.trim() || undefined,
        page,
        size: pageSize,
      };
      const res = await getAuditLogsApi(params);
      setLogs(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to retrieve regulatory audit trail.');
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, statusFilter, userQuery, page, pageSize]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleExportCsv = () => {
    try {
      const headers = ['ID', 'Timestamp', 'Action', 'PerformedBy', 'Entity', 'Status', 'IP', 'Details'];
      const rows = logs.map((l) => [
        l.id,
        l.timestamp,
        l.action,
        `"${l.performedByName}"`,
        l.entityId || 'N/A',
        l.status,
        l.ipAddress || '127.0.0.1',
        `"${(l.details || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PAMS_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Export Complete', 'Audit ledger exported as CSV.', 'success');
    } catch {
      showToast('Export Error', 'Unable to format CSV.', 'error');
    }
  };

  const actionTypes = [
    'ALL',
    'ASSET_CREATED',
    'ASSET_UPDATED',
    'ASSET_ASSIGNED',
    'ASSET_RETURNED',
    'ASSET_MOVED',
    'MAINTENANCE_SCHEDULED',
    'DOCUMENT_UPLOADED',
    'USER_ROLE_CHANGED',
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Audit Logs' }]}
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            System Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational activity history, custody changes, and compliance access tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAuditLogs}
            className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Audit Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="p-3.5 rounded-md border border-slate-200 bg-white shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="audit-action-filter" className="block text-xs font-medium text-slate-700 mb-1">Action Type:</label>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="audit-status-filter" className="block text-xs font-medium text-slate-700 mb-1">Execution Status:</label>
          <select
            id="audit-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>

        <div className="flex items-end justify-between pb-0.5">
          <div className="text-xs text-slate-500 font-medium">
            {totalElements} records logged
          </div>
          {(actionFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setActionFilter('ALL');
                setStatusFilter('ALL');
                setPage(0);
              }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <ErrorState
          title="Audit Trail Unreachable"
          message={error}
          onRetry={fetchAuditLogs}
        />
      )}

      {/* TABLE */}
      {!error && (
        <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={pageSize} columns={6} />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No Audit Records"
              description="No operational audit entries match the selected filters."
              className="my-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Timestamp</th>
                    <th className="py-2.5 px-4 font-medium">Action</th>
                    <th className="py-2.5 px-4 font-medium">User / Actor</th>
                    <th className="py-2.5 px-4 font-medium">Event Details</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 text-right font-medium">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap text-xs">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-medium">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{log.performedByName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          IP: {log.ipAddress || '10.12.0.4'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-md truncate">
                        {log.details || log.description || ''}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={log.status} />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="View Event Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalElements > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
            />
          )}
        </div>
      )}

      {/* INSPECTION MODAL */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <History className="w-4 h-4 text-blue-600" />
                <span>Audit Log Event Details</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block font-normal">Event ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-normal">Timestamp</span>
                  <span className="font-mono text-slate-800">
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toISOString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-normal">Action</span>
                  <span className="font-mono text-blue-700 font-medium">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-normal">Status</span>
                  <StatusBadge status={selectedLog.status} />
                </div>
                <div>
                  <span className="text-slate-500 block font-normal">User / Actor</span>
                  <span className="text-slate-800 font-medium">{selectedLog.performedByName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-normal">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLog.ipAddress || '10.12.0.4'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-600 block font-medium mb-1 text-xs">
                  Event Details
                </span>
                <p className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-xs">
                  {selectedLog.details || selectedLog.description || ''}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-slate-600 block font-medium mb-1 text-xs">
                    Payload Metadata
                  </span>
                  <pre className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
