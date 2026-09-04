import { apiClient } from './client';
import { CaseRecord, CaseAssignment } from '../types';

export interface CasePayload {
  caseNumber: string;
  title: string;
  description?: string;
  status?: string;
}

export interface CaseAssignmentPayload {
  userId: string | number;
  remarks?: string;
}

/** GET /api/cases — returns cases visible to the current user. */
export async function getCasesApi(): Promise<CaseRecord[]> {
  const response = await apiClient.get<CaseRecord[]>('/api/cases');
  return response.data;
}

/** GET /api/cases/:id — single case with assignments. */
export async function getCaseByIdApi(id: string | number): Promise<CaseRecord> {
  const response = await apiClient.get<CaseRecord>(`/api/cases/${id}`);
  return response.data;
}

/** POST /api/cases — create a case (ADMIN only). */
export async function createCaseApi(payload: CasePayload): Promise<CaseRecord> {
  const response = await apiClient.post<CaseRecord>('/api/cases', payload);
  return response.data;
}

/** PUT /api/cases/:id — update a case (ADMIN only). */
export async function updateCaseApi(
  id: string | number,
  payload: CasePayload
): Promise<CaseRecord> {
  const response = await apiClient.put<CaseRecord>(`/api/cases/${id}`, payload);
  return response.data;
}

/** DELETE /api/cases/:id — delete a case (ADMIN only). */
export async function deleteCaseApi(id: string | number): Promise<void> {
  await apiClient.delete(`/api/cases/${id}`);
}

/** POST /api/cases/:caseId/assign — assign an officer to a case (ADMIN only). */
export async function assignCaseApi(
  caseId: string | number,
  payload: CaseAssignmentPayload
): Promise<CaseAssignment> {
  const response = await apiClient.post<CaseAssignment>(
    `/api/cases/${caseId}/assign`,
    payload
  );
  return response.data;
}

/** POST /api/cases/:caseId/assignments/:assignmentId/complete — complete an assignment. */
export async function completeAssignmentApi(
  caseId: string | number,
  assignmentId: string | number
): Promise<CaseAssignment> {
  const response = await apiClient.post<CaseAssignment>(
    `/api/cases/${caseId}/assignments/${assignmentId}/complete`
  );
  return response.data;
}

/** GET /api/cases/:caseId/assignments — list assignments for a case. */
export async function getCaseAssignmentsApi(
  caseId: string | number
): Promise<CaseAssignment[]> {
  const response = await apiClient.get<CaseAssignment[]>(
    `/api/cases/${caseId}/assignments`
  );
  return response.data;
}
