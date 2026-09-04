import React, { useState } from 'react';
import { X, Server, CheckCircle2, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({ isOpen, onClose }) => {
  const {
    backendUrl,
    updateBackendUrl,
    backendStatus,
    refreshBackendStatus,
    token,
  } = useAuth();

  const [inputUrl, setInputUrl] = useState(backendUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateBackendUrl(inputUrl);
    setSaveSuccess(true);
    refreshBackendStatus();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl p-6 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Backend System Connectivity
              </h3>
              <p className="text-xs text-slate-500">REST API Gateway & Service Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Connection Status Card */}
          <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  backendStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span>API Service Status:</span>
                  <span
                    className={
                      backendStatus.connected
                        ? 'text-emerald-700 font-medium'
                        : 'text-rose-700 font-medium'
                    }
                  >
                    {backendStatus.connected ? 'Operational' : 'Unavailable'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {backendStatus.message}
                </div>
              </div>
            </div>

            <button
              onClick={refreshBackendStatus}
              disabled={backendStatus.checking}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${backendStatus.checking ? 'animate-spin' : ''}`} />
              Test
            </button>
          </div>

          {/* Configurable Base URL Form */}
          <form onSubmit={handleSaveUrl} className="space-y-2">
            <label htmlFor="backend-url-input" className="block text-xs font-medium text-slate-700">
              Department API Gateway Endpoint
            </label>
            <div className="flex gap-2">
              <input
                id="backend-url-input"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:8080"
                className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shrink-0 shadow-2xs"
              >
                Save Endpoint
              </button>
            </div>
            {saveSuccess && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> API Gateway endpoint configuration saved.
              </p>
            )}
          </form>

          {/* Active JWT / Security Info */}
          <div className="p-3 rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                Session Token:
              </span>
              <span>{token ? `${token.slice(0, 20)}...` : 'Active'}</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Requests automatically include Bearer authorization credentials.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
