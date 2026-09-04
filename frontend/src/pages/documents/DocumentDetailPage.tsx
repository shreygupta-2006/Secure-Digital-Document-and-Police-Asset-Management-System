import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Sparkles,
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Box,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileCode,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getDocumentByIdApi,
  getDocumentVersionsApi,
  indexDocumentForAiApi,
  downloadDocumentApi,
} from '../../api/documents';
import { askAiApi } from '../../api/ai';
import { DocumentRecord, DocumentVersion } from '../../types';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI analysis state for this document
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fetchDocData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [docData, versionData] = await Promise.all([
        getDocumentByIdApi(id),
        getDocumentVersionsApi(id),
      ]);
      setDocument(docData);
      setVersions(versionData);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to load document details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocData();
  }, [fetchDocData]);

  const handleDownload = async () => {
    if (!document) return;
    try {
      await downloadDocumentApi(document.id, document.fileName);
      showToast('Download Initiated', `Saving ${document.fileName}`, 'info');
    } catch (err: unknown) {
      const errorObj = err as Error;
      showToast('Download Failed', errorObj.message, 'error');
    }
  };

  const handleIndexForAi = async () => {
    if (!id) return;
    setIsIndexing(true);
    try {
      await indexDocumentForAiApi(id);
      showToast('Indexing Completed', 'Document vector embeddings generated for AI search.', 'success');
      fetchDocData();
    } catch (err: unknown) {
      const errorObj = err as Error;
      showToast('Indexing Failed', errorObj.message, 'error');
    } finally {
      setIsIndexing(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!document) return;
    setIsSummarizing(true);
    try {
      const res = await askAiApi({
        question: `Please provide a concise operational intelligence summary of the document titled "${document.title}". Highlight primary compliance requirements, inspection intervals, and chain of custody rules.`,
        documentId: document.id,
      });
      setAiSummary(res.answer);
      showToast('AI Synthesis Ready', 'Document summarized.', 'success');
    } catch (err: unknown) {
      const errorObj = err as Error;
      showToast('Synthesis Failed', errorObj.message, 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !document) {
    return (
      <ErrorState
        title="Document Unavailable"
        message={error || 'Document could not be located.'}
        onRetry={fetchDocData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', href: '/dashboard' },
              { label: 'Documents', href: '/documents' },
              { label: document.title },
            ]}
          />
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {document.title}
            </h2>
            {document.isIndexed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>INDEXED FOR AI</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>NOT INDEXED</span>
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            File: {document.fileName} • Classification: {(document.category || document.documentType || 'MANUAL').replace(/_/g, ' ')} • Version: v{document.latestVersion || 1}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium tracking-wide transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>

          {!document.isIndexed && hasRole(['ADMIN', 'STORE_KEEPER', 'AUDITOR']) && (
            <button
              onClick={handleIndexForAi}
              disabled={isIndexing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium tracking-wide transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isIndexing ? 'animate-spin' : ''}`} />
              <span>{isIndexing ? 'Generating Embeddings...' : 'Index For AI Search'}</span>
            </button>
          )}

          <Link
            to="/ai"
            state={{ selectedDocId: document.id }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium tracking-wide transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Query in AI Studio</span>
          </Link>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: METADATA & AI ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Version History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Summary Card */}
          <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono pb-2 border-b border-slate-200">
              Document Scope & Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Uploaded By</span>
                <span className="font-medium text-slate-900">{document.uploadedByName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ingestion Date</span>
                <span className="text-slate-900 font-mono">
                  {(document.uploadedAt || document.createdAt) ? new Date(document.uploadedAt || document.createdAt || '').toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">MIME Content-Type</span>
                <span className="font-mono text-slate-900">{document.contentType || document.fileType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Storage Size</span>
                <span className="font-mono text-slate-900">
                  {(document.fileSize / 1024 / 1024).toFixed(2)} MB ({document.fileSize.toLocaleString()} bytes)
                </span>
              </div>
              {document.assetCode && (
                <div>
                  <span className="text-slate-500 block">Associated Asset</span>
                  <Link
                    to={`/assets/${document.assetId || ''}`}
                    className="font-mono text-blue-700 font-semibold hover:underline"
                  >
                    {document.assetCode}
                  </Link>
                </div>
              )}
            </div>

            {/* Description */}
            {document.description && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                  Administrative Scope
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {document.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-mono">
                  Categorical Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Version History Table */}
          <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Revision & Version History
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {versions.length} Revisions Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Version</th>
                    <th className="py-2.5 px-4">Created Date</th>
                    <th className="py-2.5 px-4">Author / Reviser</th>
                    <th className="py-2.5 px-4">Change Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {versions.map((ver) => (
                    <tr key={ver.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-blue-700">
                        v{ver.versionNumber || ver.version || 1}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {ver.createdAt ? new Date(ver.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{ver.uploadedByName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{ver.changeSummary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: AI Synthesis & Directives */}
        <div className="space-y-6">
          <div className="p-5 rounded-md border border-blue-200 bg-blue-50/40 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <div className="flex items-center gap-2 text-blue-900 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Document Synthesis</span>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="p-1 rounded hover:bg-blue-100 text-blue-700 transition-colors"
                title="Generate New Summary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Synthesize key operational guidelines, mandatory armory routines, or legal compliance mandates using document content.
            </p>

            {aiSummary ? (
              <div className="p-3.5 rounded-md bg-white border border-blue-200 text-xs text-slate-800 leading-relaxed space-y-2 shadow-2xs">
                <div className="text-[11px] font-mono text-blue-800 font-bold uppercase">
                  Synthesized Directives:
                </div>
                <div className="whitespace-pre-wrap">{aiSummary}</div>
              </div>
            ) : (
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50"
              >
                {isSummarizing ? 'Analyzing Content...' : 'Generate AI Directives'}
              </button>
            )}

            <div className="pt-2 border-t border-blue-200 text-[11px] text-blue-700/80">
              Indexed via departmental document search & vector embeddings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
