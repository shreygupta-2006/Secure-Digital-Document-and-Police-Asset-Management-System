import { apiClient } from './client';
import {
  Asset,
  AssetAssignment,
  AssetMovement,
  AssetMaintenance,
} from '../types';

export interface AssetFilterParams {
  search?: string;
  category?: string;
  status?: string;
  location?: string;
}

/**
 * Backend GET /api/assets returns a flat array, not a paginated response.
 * We wrap it in a consistent structure for the frontend.
 */
export async function getAssetsApi(params?: AssetFilterParams): Promise<{
  content: Asset[];
  totalElements: number;
  totalPages: number;
}> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.category && params.category !== 'ALL') queryParams.category = params.category;
  if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
  if (params?.location) queryParams.location = params.location;

  const response = await apiClient.get<Asset[] | { content: Asset[]; totalElements: number; totalPages: number }>('/api/assets', { params: queryParams });

  if (Array.isArray(response.data)) {
    return {
      content: response.data,
      totalElements: response.data.length,
      totalPages: 1,
    };
  }
  return response.data as { content: Asset[]; totalElements: number; totalPages: number };
}

export async function getAssetByIdApi(id: string | number): Promise<Asset> {
  const response = await apiClient.get<Asset>(`/api/assets/${id}`);
  return response.data;
}

export async function createAssetApi(payload: Record<string, unknown>): Promise<Asset> {
  const response = await apiClient.post<Asset>('/api/assets', payload);
  return response.data;
}

export async function updateAssetApi(id: string | number, payload: Record<string, unknown>): Promise<Asset> {
  const response = await apiClient.put<Asset>(`/api/assets/${id}`, payload);
  return response.data;
}

export async function deleteAssetApi(id: string | number): Promise<void> {
  await apiClient.delete(`/api/assets/${id}`);
}

export async function getAssetAssignmentsApi(assetId: string | number): Promise<AssetAssignment[]> {
  // Backend stores assignments in asset_history; we use asset history endpoint
  try {
    const response = await apiClient.get(`/api/assets/${assetId}/history`);
    const history = response.data;
    // Extract assignments from history response
    if (history?.assignments) return history.assignments;
    if (Array.isArray(history)) return history;
    return [];
  } catch {
    return [];
  }
}

export async function assignAssetApi(
  assetId: string | number,
  payload: {
    userId: string | number;
    remarks?: string;
  }
): Promise<AssetAssignment> {
  const response = await apiClient.post<AssetAssignment>(`/api/assets/${assetId}/assign`, {
    userId: payload.userId,
    remarks: payload.remarks || '',
  });
  return response.data;
}

export async function returnAssetApi(assetId: string | number, notes?: string): Promise<AssetAssignment> {
  // Backend returns AssignmentResponse (not Asset)
  const response = await apiClient.post<AssetAssignment>(`/api/assets/${assetId}/return`);
  return response.data;
}

export async function getAssetMovementsApi(assetId: string | number): Promise<AssetMovement[]> {
  try {
    const response = await apiClient.get(`/api/assets/${assetId}/history`);
    const history = response.data;
    if (history?.movements) return history.movements;
    return [];
  } catch {
    return [];
  }
}

export async function moveAssetApi(
  assetId: string | number,
  payload: {
    toLocation: string;
    reason: string;
  }
): Promise<AssetMovement> {
  // Backend MoveAssetRequest has toLocation + reason
  const response = await apiClient.post<AssetMovement>(`/api/assets/${assetId}/move`, {
    toLocation: payload.toLocation,
    reason: payload.reason,
  });
  return response.data;
}

export async function getAssetMaintenanceApi(assetId: string | number): Promise<AssetMaintenance[]> {
  const response = await apiClient.get<AssetMaintenance[]>(`/api/assets/${assetId}/maintenance`);
  return response.data;
}

export async function createMaintenanceApi(
  assetId: string | number,
  payload: {
    description: string;
    cost?: number;
    remarks?: string;
  }
): Promise<AssetMaintenance> {
  const response = await apiClient.post<AssetMaintenance>(`/api/assets/${assetId}/maintenance`, {
    description: payload.description,
    cost: payload.cost,
    remarks: payload.remarks,
  });
  return response.data;
}

export async function completeMaintenanceApi(maintenanceId: string | number): Promise<AssetMaintenance> {
  const response = await apiClient.put<AssetMaintenance>(`/api/assets/maintenance/${maintenanceId}`);
  return response.data;
}

export async function retireAssetApi(assetId: string | number, reason: string): Promise<Asset> {
  const response = await apiClient.post<Asset>(`/api/assets/${assetId}/retire`);
  return response.data;
}

/**
 * Backend does not have a dedicated dashboard stats endpoint.
 * We derive stats from GET /api/assets.
 */
// User listing for assignment dropdown
export async function getUsersApi(): Promise<Array<{ id: number; name: string; email: string; role: string }>> {
  const response = await apiClient.get<Array<{ id: number; name: string; email: string; role: string }>>('/api/auth/users');
  return response.data;
}

export async function getDashboardStatsApi(): Promise<{
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  underMaintenance: number;
  retiredAssets: number;
}> {
  const response = await apiClient.get<Asset[] | { content: Asset[] }>('/api/assets');
  const assets = Array.isArray(response.data) ? response.data : (response.data.content || []);

  return {
    totalAssets: assets.length,
    availableAssets: assets.filter((a) => a.status === 'AVAILABLE').length,
    assignedAssets: assets.filter((a) => a.status === 'ASSIGNED').length,
    underMaintenance: assets.filter((a) => a.status === 'IN_MAINTENANCE').length,
    retiredAssets: assets.filter((a) => a.status === 'RETIRED').length,
  };
}
