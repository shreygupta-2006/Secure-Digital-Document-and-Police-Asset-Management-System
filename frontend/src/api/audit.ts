import { apiClient } from './client';
import { AuditLog } from '../types';

export interface AuditFilterParams {
  search?: string;
  entity?: string;
  action?: string;
  status?: string;
  userId?: string;
  page?: number;
  size?: number;
}

/**
 * Backend GET /api/audit-logs returns a flat array of AuditLogResponse.
 * AuditLogResponse fields: { id, action, entityType, entityId, userId,
 *   performedByName, performedByRole, details, ipAddress, createdAt }
 */
export async function getAuditLogsApi(params?: AuditFilterParams): Promise<{
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
}> {
  const queryParams: Record<string, string> = {};
  if (params?.action && params.action !== 'ALL') queryParams.action = params.action;
  if (params?.userId) queryParams.userId = params.userId;

  const response = await apiClient.get('/api/audit-logs', { params: queryParams });
  const data = Array.isArray(response.data) ? response.data : (response.data?.content || []);

  // Map backend AuditLogResponse to frontend AuditLog type
  // Backend AuditLogResponse: { id, userId, userName, action, entityType, entityId, description, ipAddress, timestamp }
  const mapped: AuditLog[] = data.map((log: Record<string, unknown>) => ({
    id: log.id,
    timestamp: log.timestamp || log.createdAt || '',
    action: log.action || '',
    principal: log.userName || '',
    performedByName: log.userName || '',
    role: log.role || '',
    entity: log.entityType || '',
    entityType: log.entityType || '',
    entityId: log.entityId || '',
    details: log.description || '',
    description: log.description || '',
    ipAddress: log.ipAddress || '',
    status: (log.status as 'SUCCESS' | 'FAILED' | 'WARNING') || 'SUCCESS',
  }));

  const page = params?.page || 0;
  const size = params?.size || 50;
  const start = page * size;
  const paginated = mapped.slice(start, start + size);

  return {
    content: paginated,
    totalElements: mapped.length,
    totalPages: Math.ceil(mapped.length / size) || 1,
  };
}
