import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  X,
  FileUp,
  Tag,
  Box,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getDocumentsApi,
  uploadDocumentApi,
  deleteDocumentApi,
  downloadDocumentApi,
} from '../../api/documents';
import { DocumentRecord, DocumentCategory } from '../../types';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { getErrorMessage } from '../../api/client';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const DocumentsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('OTHER');
  const [uploadAssetCode, setUploadAssetCode] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [cases, setCases] = useState<Array<{ id: string | number; caseNumber: string; title: string }>>([]);

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDocumentsApi();
      setDocuments(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    // Load cases for the upload dropdown
    import('../../api/client').then(({ apiClient }) =>
      apiClient.get('/api/cases').then((res) => setCases(res.data || [])).catch(() => {})
    );
  }, [fetchDocuments]);

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.assetCode && doc.assetCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (doc.category || doc.documentType) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('File Required', 'Please choose a document to ingest.', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const tagsArray = uploadTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await uploadDocumentApi(selectedFile, {
        title: uploadTitle || selectedFile.name,
        category: uploadCategory,
        assetCode: uploadAssetCode || undefined,
        description: uploadDescription || undefined,
        tags: tagsArray,
        caseId: uploadCaseId || undefined,
      });

      showToast('Document Uploaded', `${uploadTitle} ingested into repository.`, 'success');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadAssetCode('');
      setUploadDescription('');
      setUploadTags('');
      fetchDocuments();
    } catch (err: unknown) {
      showToast('Upload Failed', getErrorMessage(err), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Download Action
  const handleDownload = async (doc: DocumentRecord) => {
    try {
      await downloadDocumentApi(doc.id, doc.fileName);
      showToast('Download Started', `Downloading ${doc.fileName}...`, 'info');
    } catch (err: unknown) {
      showToast('Download Error', getErrorMessage(err), 'error');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDocumentApi(docToDelete.id);
      showToast('Document Expunged', `${docToDelete.title} removed.`, 'info');
      setDocToDelete(null);
      fetchDocuments();
    } catch (err: unknown) {
      showToast('Deletion Failed', getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories: (DocumentCategory | 'ALL')[] = [
    'ALL',
    'FIR',
    'INVESTIGATION_REPORT',
    'EVIDENCE',
    'COURT_ORDER',
    'INTERNAL_MEMO',
    'IDENTIFICATION',
    'LICENSE',
    'CERTIFICATE',
    'CORRESPONDENCE',
    'OTHER',
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents' }]}
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Documents & Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard operating procedures, equipment manuals, inspection reports, and policy guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDocuments}
            className="p-2 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Repository"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasRole(['ADMIN', 'STORE_KEEPER']) && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="p-3.5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, filename, asset tag code, description..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-normal"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              {categories.filter((c) => c !== 'ALL').map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <ErrorState
          title="Document Retrieval Error"
          message={error}
          onRetry={fetchDocuments}
        />
      )}

      {/* TABLE */}
      {!error && (
        <div className="rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              title="No Documents Found"
              description="No departmental records match your search criteria."
              actionLabel="Upload First Document"
              onAction={() => setIsUploadModalOpen(true)}
              className="my-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Document Title</th>
                    <th className="py-2.5 px-4 font-medium">Category</th>                      <th className="py-2.5 px-4 font-medium">Case</th>
                      <th className="py-2.5 px-4 font-medium">Associated Asset</th>
                    <th className="py-2.5 px-4 font-medium">Version / Size</th>
                    <th className="py-2.5 px-4 font-medium">Search Status</th>
                    <th className="py-2.5 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-normal">
                          <span>{doc.fileName}</span>
                          <span>•</span>
                          <span>Uploaded by {doc.uploadedByName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-normal">
                          {(doc.category || doc.documentType || 'DOCUMENT').replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {doc.caseNumber ? (
                          <span className="font-mono text-blue-600 font-medium text-[11px]">
                            {doc.caseNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {doc.assetCode ? (
                          <span className="font-mono text-blue-600 font-medium">
                            {doc.assetCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <span>v{doc.latestVersion || 1}</span>
                        <span className="mx-1.5">•</span>
                        <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {doc.isIndexed ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>Indexed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/documents/${doc.id}`}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="View Document Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {hasRole(['ADMIN', 'STORE_KEEPER']) && (
                            <button
                              onClick={() => setDocToDelete(doc)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl p-6 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Upload Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              {/* File Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="p-5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-md bg-slate-50 text-center cursor-pointer transition-colors"
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.txt"
                />
                <FileUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">{selectedFile.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-slate-800 text-xs">
                      Drop document here or click to browse
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Supports PDF, DOCX, XLSX, TXT (Max 50MB)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Document Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Patrol Firearms Maintenance Manual"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Classification Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="FIR">FIR</option>
                    <option value="INVESTIGATION_REPORT">INVESTIGATION REPORT</option>
                    <option value="EVIDENCE">EVIDENCE</option>
                    <option value="COURT_ORDER">COURT ORDER</option>
                    <option value="INTERNAL_MEMO">INTERNAL MEMO</option>
                    <option value="IDENTIFICATION">IDENTIFICATION</option>
                    <option value="LICENSE">LICENSE</option>
                    <option value="CERTIFICATE">CERTIFICATE</option>
                    <option value="CORRESPONDENCE">CORRESPONDENCE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Associated Asset Tag ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadAssetCode}
                    onChange={(e) => setUploadAssetCode(e.target.value)}
                    placeholder="e.g., POL-1049"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., firearms, inspection, armory"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {hasRole(['ADMIN']) && cases.length > 0 && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Link to Case (Optional)
                  </label>
                  <select
                    value={uploadCaseId}
                    onChange={(e) => setUploadCaseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">No case (general document)</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Summary / Scope
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of the document scope and instructions."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 shadow-2xs"
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE DOCUMENT */}
      <ConfirmationModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.title}" (${docToDelete?.fileName})? This action cannot be undone.`}
        confirmLabel="Delete Document"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
