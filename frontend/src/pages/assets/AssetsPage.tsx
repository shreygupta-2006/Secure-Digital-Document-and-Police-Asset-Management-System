import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Eye,
  Edit2,
  UserCheck,
  Truck,
  Wrench,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAssetsApi, AssetFilterParams } from '../../api/assets';
import { Asset, AssetStatus, AssetCategory } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const AssetsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AssetFilterParams = {
        search: searchQuery.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      };
      const res = await getAssetsApi(params);
      setAssets(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Unable to retrieve asset records.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');

  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  const categories: (AssetCategory | 'ALL')[] = [
    'ALL',
    'FIREARM',
    'VEHICLE',
    'COMMUNICATION',
    'TACTICAL',
    'ELECTRONICS',
    'EVIDENCE_TECH',
    'UNIFORM',
    'OTHER',
  ];

  const statuses: (AssetStatus | 'ALL')[] = [
    'ALL',
    'AVAILABLE',
    'ASSIGNED',
    'IN_MAINTENANCE',
    'RETIRED',
  ];

  return (
    <div className="space-y-5">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Assets' }]} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Asset Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Serialized departmental equipment, active assignments, and service readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAssets}
            className="p-2 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh List"
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
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-3.5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
            
              }}
              placeholder="Search tag, serial, model, officer..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-normal"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
            
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              {categories.filter((c) => c !== 'ALL').map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
            
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              {statuses.filter((s) => s !== 'ALL').map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Reset */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <div className="ml-auto text-xs text-slate-500">
              {totalElements} assets found
            </div>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <ErrorState
          title="Asset Records Retrieval Failed"
          message={error}
          onRetry={fetchAssets}
        />
      )}

      {/* TABLE / CONTENT */}
      {!error && (
        <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : assets.length === 0 ? (
            <EmptyState
              title="No Assets Found"
              description={
                hasActiveFilters
                  ? 'No items match the selected search criteria. Try adjusting your filters.'
                  : 'No departmental assets have been registered yet.'
              }
              actionLabel={hasActiveFilters ? 'Clear Filters' : hasRole(['ADMIN', 'STORE_KEEPER']) ? 'Add First Asset' : undefined}
              onAction={hasActiveFilters ? handleClearFilters : () => navigate('/assets/new')}
              className="my-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Tag</th>
                    <th className="py-2.5 px-4 font-medium">Asset Name & Model</th>
                    <th className="py-2.5 px-4 font-medium">Serial Number</th>
                    <th className="py-2.5 px-4 font-medium">Category</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Assigned Custody</th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600 whitespace-nowrap">
                        {asset.assetCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {asset.model || 'Standard Issue'} {asset.manufacturer ? `• ${asset.manufacturer}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {asset.serialNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-normal">
                          {(asset.category || 'EQUIPMENT').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 truncate max-w-[160px]">
                          {asset.location || 'N/A'}
                        </div>
                        {asset.assignedOfficerName && (
                          <div className="text-[11px] text-blue-600 font-medium">
                            Officer: {asset.assignedOfficerName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/assets/${asset.id}`}
                            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="View Asset Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {hasRole(['ADMIN', 'STORE_KEEPER']) && (
                            <Link
                              to={`/assets/${asset.id}/edit`}
                              className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Record Count */}
          {totalElements > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Showing {totalElements} assets
            </div>
          )}
        </div>
      )}
    </div>
  );
};
