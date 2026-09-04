import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  Send,
  FileText,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Bot,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { askAiApi, indexDocumentApi, getDocumentSummaryApi, getSuggestionsApi } from '../../api/ai';
import { getDocumentsApi } from '../../api/documents';
import { AiQueryResponse, DocumentRecord } from '../../types';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: AiQueryResponse;
  timestamp: string;
}

/** Simple inline Markdown renderer for AI responses */
function renderMarkdown(text: string): React.ReactNode {
  // Split into lines, process each
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const body = tableRows.slice(2); // skip separator row
      elements.push(
        <table key={`tbl-${elements.length}`} className="my-2 w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {headers.map((h, hi) => (
                <th key={hi} className="px-2 py-1 text-left font-semibold text-slate-700 border border-slate-200">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="odd:bg-white even:bg-slate-50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1 border border-slate-200 text-slate-800">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
    }
    inTable = false;
  };

  const processInline = (s: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(s)) !== null) {
      if (match.index > lastIndex) parts.push(s.slice(lastIndex, match.index));
      parts.push(<strong key={`b-${match.index}`} className="font-semibold text-slate-900">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < s.length) parts.push(s.slice(lastIndex));
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!inTable) inTable = true;
      // Skip separator rows like |---|---|
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        tableRows.push([]);
        continue;
      }
      const cells = trimmed.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`} className="text-sm font-bold text-slate-900 mt-3 mb-1">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`} className="text-base font-bold text-slate-900 mt-3 mb-1">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`} className="text-lg font-bold text-slate-900 mt-3 mb-1">{trimmed.slice(2)}</h1>);
    } else if (/^[-*]\s+/.test(trimmed)) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 ml-3">
          <span className="text-slate-400 mt-0.5">•</span>
          <span className="text-slate-800">{processInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 ml-3">
          <span className="text-slate-500 font-mono text-[11px] mt-0.5 w-4 shrink-0">{numMatch?.[1]}.</span>
          <span className="text-slate-800">{processInline(numMatch?.[2] || trimmed)}</span>
        </div>
      );
    } else {
      elements.push(
        <div key={`p-${i}`} className="text-slate-800 leading-relaxed">
          {processInline(trimmed)}
        </div>
      );
    }
  }

  if (inTable) flushTable();

  return <>{elements}</>;
}

/** Extract the error message from an Axios or generic error */
function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
    if (axiosErr.response?.data?.error) return axiosErr.response.data.error;
    if (axiosErr.message) return axiosErr.message;
  }
  return 'An unexpected error occurred.';
}

export const AiIntelligencePage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [question, setQuestion] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  // Suggestions from backend
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const selectedDocument = documents.find(d => String(d.id) === String(selectedDocId));

  const loadDocuments = async () => {
    try {
      const docs = await getDocumentsApi();
      setDocuments(docs);
    } catch {
      // Silent — fallback to empty list
    }
  };

  // Fetch suggestions from backend when an indexed document is selected
  const loadSuggestions = useCallback(async (docId: string) => {
    if (docId === 'ALL') {
      setSuggestedPrompts([]);
      return;
    }

    const doc = documents.find(d => String(d.id) === String(docId));
    if (!doc?.isIndexed) {
      setSuggestedPrompts([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const suggestions = await getSuggestionsApi(docId);
      setSuggestedPrompts(suggestions);
    } catch {
      // If suggestions fail (e.g. no Groq key), show empty
      setSuggestedPrompts([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [documents]);

  useEffect(() => {
    loadDocuments();

    const stateDocId = (location.state as { selectedDocId?: string })?.selectedDocId;
    if (stateDocId) {
      setSelectedDocId(stateDocId);
    }

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Welcome to the AI Document Intelligence Assistant. Select an indexed document above and ask questions about its content.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [location.state]);

  // When selectedDocId changes, fetch suggestions if the document is indexed
  useEffect(() => {
    if (selectedDocId !== 'ALL') {
      loadSuggestions(selectedDocId);
    } else {
      setSuggestedPrompts([]);
    }
  }, [selectedDocId, loadSuggestions]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || isLoading) return;

    if (selectedDocId === 'ALL') {
      showToast('Document Required', 'Please select a specific document before asking a question.', 'warning');
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await askAiApi({
        question: q,
        documentId: selectedDocId,
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast('Query Failed', msg, 'error');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to retrieve answer: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Index document for AI
  const handleIndexDocument = async (docId: string | number) => {
    setIsIndexing(true);
    try {
      const result = await indexDocumentApi(docId);
      showToast('Document Indexed', result.message || 'Document indexed successfully.', 'success');

      // Refresh the document list so isIndexed state updates from backend
      await loadDocuments();

      // Update local state immediately
      setDocuments(prev =>
        prev.map(d => String(d.id) === String(docId) ? { ...d, isIndexed: true } : d)
      );

      // Now fetch suggestions from backend for the newly indexed document
      await loadSuggestions(String(docId));
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast('Indexing Failed', msg, 'error');
    } finally {
      setIsIndexing(false);
    }
  };

  // Generate summary for a document
  const handleGenerateSummary = async (docId: string | number) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: 'Generate a summary of this document.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await getDocumentSummaryApi(docId);
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: result.overview || 'No summary available.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      showToast('Summary Failed', msg, 'error');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to generate summary: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 shrink-0">
        <div>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'AI Assistant' }]}
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Document Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask questions about indexed documents. Powered by the backend AI service.
          </p>
        </div>

        {/* Document selector + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="doc-scope-select" className="text-xs font-medium text-slate-600">
            Document:
          </label>
          <select
            id="doc-scope-select"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 max-w-xs truncate shadow-2xs"
          >
            <option value="ALL">Select a document...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} {doc.isIndexed ? '✓' : ''}
              </option>
            ))}
          </select>

          {selectedDocId !== 'ALL' && (
            <>
              <button
                onClick={() => handleIndexDocument(selectedDocId)}
                disabled={isIndexing || isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs disabled:opacity-50 transition-colors"
              >
                {isIndexing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Index for AI</span>
                  </>
                )}
              </button>

              {selectedDocument?.isIndexed && (
                <button
                  onClick={() => handleGenerateSummary(selectedDocId)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs disabled:opacity-50 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Summarize</span>
                </button>
              )}
            </>
          )}

          {selectedDocument?.isIndexed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Indexed
            </span>
          )}
        </div>
      </div>

      {/* CHAT MESSAGES SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 rounded-md border border-slate-200 bg-slate-50/50 p-4 sm:p-5 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 text-xs leading-relaxed ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-md p-4 space-y-2.5 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-blue-50 border border-blue-200 text-slate-900'
                  : 'bg-white border border-slate-200 text-slate-900'
              }`}
            >
              <div className={`flex items-center justify-between gap-4 text-[11px] pb-1.5 border-b ${
                msg.sender === 'user' ? 'text-blue-700 border-blue-100' : 'text-slate-500 border-slate-100'
              }`}>
                <span className="font-semibold">
                  {msg.sender === 'user' ? user?.name || user?.fullName || 'User' : 'AI Assistant'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="text-slate-800 leading-normal space-y-1">{renderMarkdown(msg.text)}</div>

              {/* Citations & Source Documents */}
              {msg.response && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                  {msg.response.sources && msg.response.sources.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Source References ({msg.response.sources.length} chunks):</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.response.sources.map((src, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate text-xs">
                                Chunk {src.chunkIndex ?? i + 1}
                                {src.title && ` — ${src.title}`}
                              </div>
                              {src.snippet && (
                                <p className="text-[11px] text-slate-700 mt-1 bg-white p-2 rounded border border-slate-200 leading-relaxed font-sans">
                                  &ldquo;{src.snippet}&rdquo;
                                </p>
                              )}
                              {src.content && !src.snippet && (
                                <p className="text-[11px] text-slate-700 mt-1 bg-white p-2 rounded border border-slate-200 leading-relaxed font-sans">
                                  &ldquo;{src.content.substring(0, 200)}...&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Document Grounded Response</span>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded bg-blue-600 border border-blue-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center gap-2 shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span className="text-xs">
                Searching document and preparing answer...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PROMPT CHIPS — Fetched from backend based on actual document content */}
      <div className="shrink-0 space-y-1.5">
        <div className="text-xs text-slate-500 font-medium">
          {isLoadingSuggestions
            ? 'Generating suggestions from document content...'
            : `Suggested Queries${selectedDocument?.isIndexed ? ` for "${selectedDocument.title}"` : ''}:`
          }
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={`${selectedDocId}-${i}`}
              onClick={() => handleSend(prompt)}
              disabled={isLoading || selectedDocId === 'ALL'}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs text-left transition-colors truncate max-w-md shadow-2xs disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
          {!isLoadingSuggestions && selectedDocId !== 'ALL' && !selectedDocument?.isIndexed && (
            <span className="text-xs text-slate-400 italic">
              Index this document first to get content-based suggestions.
            </span>
          )}
          {!isLoadingSuggestions && selectedDocId === 'ALL' && (
            <span className="text-xs text-slate-400 italic">
              Select and index a document to get AI-generated suggestions.
            </span>
          )}
        </div>
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 shrink-0 pt-1"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading || selectedDocId === 'ALL'}
            placeholder={
              selectedDocId === 'ALL'
                ? 'Select a document first to start asking questions...'
                : 'Ask a question about the selected document...'
            }
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-normal shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !question.trim() || selectedDocId === 'ALL'}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
        >
          <span>Submit</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
