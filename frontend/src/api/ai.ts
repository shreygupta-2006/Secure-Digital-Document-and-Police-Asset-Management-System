import { apiClient } from './client';
import { AISummarySection, AIQueryResponse } from '../types';

export async function getSuggestionsApi(
  documentId: string | number
): Promise<string[]> {
  const response = await apiClient.get(`/api/ai/documents/${documentId}/suggestions`);
  const data = response.data;
  return data.suggestions || [];
}

export async function indexDocumentApi(documentId: string | number): Promise<{
  success: boolean;
  message: string;
  chunksCreated?: number;
}> {
  const response = await apiClient.post(`/api/ai/documents/${documentId}/index`);
  const data = response.data;
  return {
    success: data.indexed || true,
    message: `Document indexed successfully. ${data.chunksCreated || 0} chunks created.`,
    indexedChunks: data.chunksCreated,
    ...data,
  };
}

export const indexDocumentForAiApi = indexDocumentApi;

/**
 * Backend POST /api/ai/documents/{documentId}/summary returns:
 * { documentId, summary: string, model: string }
 */
export async function getDocumentSummaryApi(documentId: string | number): Promise<AISummarySection> {
  const response = await apiClient.post(`/api/ai/documents/${documentId}/summary`);
  const data = response.data;
  // Backend returns { summary: string, model: string }
  // Convert to AISummarySection format
  return {
    overview: data.summary || 'No summary available.',
    keyPoints: [],
    rolesAndResponsibilities: [],
  };
}

/**
 * Backend POST /api/ai/documents/{documentId}/ask with body { question: string }
 * Returns: { documentId, question, answer, sources: [{ chunkId, chunkIndex }] }
 */
export async function queryDocumentAiApi(
  documentId: string | number,
  question: string
): Promise<AIQueryResponse> {
  const response = await apiClient.post(`/api/ai/documents/${documentId}/ask`, {
    question,
  });
  const data = response.data;
  return {
    question: data.question || question,
    answer: data.answer || 'No answer available.',
    documentId: data.documentId || documentId,
    sources: (data.sources || []).map((s: { chunkId: string | number; chunkIndex?: number; content?: string }) => ({
      chunkId: s.chunkId,
      chunkIndex: s.chunkIndex,
      content: s.content,
      snippet: s.content,
    })),
  };
}

export async function askAiApi(params: {
  question: string;
  documentId?: string | number;
}): Promise<AIQueryResponse> {
  if (params.documentId) {
    return queryDocumentAiApi(params.documentId, params.question);
  }

  // If no document specified, try the per-document ask with the first available indexed document
  // The backend doesn't have a general /api/ai/query endpoint, so we try all documents
  const response = await apiClient.get('/api/documents');
  const docs = Array.isArray(response.data) ? response.data : [];

  // Find an indexed document to query
  const indexedDoc = docs.find((d: { isIndexed?: boolean }) => d.isIndexed);
  if (indexedDoc) {
    return queryDocumentAiApi(indexedDoc.id, params.question);
  }

  // No indexed documents available
  throw new Error('No documents have been indexed for AI search. Please index a document first.');
}
