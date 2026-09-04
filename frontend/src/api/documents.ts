import { apiClient } from './client';
import { DocumentRecord, DocumentVersion, DocumentCategory } from '../types';

function normalizeDocument(d: DocumentRecord): DocumentRecord {
  const cat = (d.category || d.documentType || 'OTHER') as DocumentCategory;
  return {
    ...d,
    category: cat,
    documentType: d.documentType || cat,
    // Backend returns 'indexed' (boolean), frontend uses 'isIndexed'
    isIndexed: (d as unknown as { indexed?: boolean }).indexed === true || d.isIndexed === true,
  };
}

export interface DocumentFilterParams {
  search?: string;
  documentType?: string;
  isIndexed?: boolean;
}

/**
 * Backend GET /api/documents returns a flat array.
 */
export async function getDocumentsApi(_params?: DocumentFilterParams): Promise<DocumentRecord[]> {
  const response = await apiClient.get<DocumentRecord[]>('/api/documents');
  return (response.data || []).map(normalizeDocument);
}

export async function getDocumentByIdApi(id: string | number): Promise<DocumentRecord> {
  const response = await apiClient.get<DocumentRecord>(`/api/documents/${id}`);
  return normalizeDocument(response.data);
}

/**
 * Backend expects multipart/form-data with:
 * - "file" (the file)
 * - "title" (string)
 * - "documentType" (enum string, e.g. "MANUAL", "POLICY_SOP", etc.)
 * - "description" (optional string)
 */
export async function uploadDocumentApi(
  fileOrFormData: File | FormData,
  metadataOrProgress?: {
    title?: string;
    category?: DocumentCategory;
    assetCode?: string;
    description?: string;
    tags?: string[];
    caseId?: string | number;
  },
  onProgress?: (percentage: number) => void
): Promise<DocumentRecord> {
  const formData = new FormData();

  if (fileOrFormData instanceof File) {
    formData.append('file', fileOrFormData);
    if (metadataOrProgress) {
      formData.append('title', metadataOrProgress.title || fileOrFormData.name);
      formData.append('documentType', metadataOrProgress.category || 'OTHER');
      if (metadataOrProgress.description) {
        formData.append('description', metadataOrProgress.description);
      }
      if (metadataOrProgress.caseId) {
        formData.append('caseId', String(metadataOrProgress.caseId));
      }
    }
  } else {
    // Already a FormData — pass through
    return (await apiClient.post<DocumentRecord>('/api/documents', fileOrFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  const response = await apiClient.post<DocumentRecord>('/api/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return response.data;
}

export async function downloadDocumentApi(
  id: string | number,
  fileName?: string
): Promise<void> {
  const response = await apiClient.get(`/api/documents/${id}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `document-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function deleteDocumentApi(id: string | number): Promise<void> {
  await apiClient.delete(`/api/documents/${id}`);
}

export async function getDocumentVersionsApi(documentId: string | number): Promise<DocumentVersion[]> {
  const response = await apiClient.get<DocumentVersion[]>(`/api/documents/${documentId}/versions`);
  return response.data;
}

export { indexDocumentApi as indexDocumentForAiApi } from './ai';
