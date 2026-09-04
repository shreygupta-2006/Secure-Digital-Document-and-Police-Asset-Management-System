import React, { useState } from 'react';
import {
  Server,
  Key,
  Shield,
  RefreshCw,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const {
    user,
    token,
    backendUrl,
    updateBackendUrl,
    backendStatus,
    refreshBackendStatus,
    hasRole,
  } = useAuth();
  const { showToast } = useToast();

  const isAdmin = hasRole(['ADMIN']);
  const [inputUrl, setInputUrl] = useState(backendUrl || 'http://localhost:8080');

  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateBackendUrl(inputUrl);
    showToast('Endpoint Configured', `Base API URL saved as ${inputUrl}`, 'success');
    refreshBackendStatus();
  };

  const handleResetDefaultUrl = () => {
    setInputUrl('http://localhost:8080');
    updateBackendUrl('http://localhost:8080');
    showToast('Default Restored', 'Base API URL reset to http://localhost:8080', 'info');
    refreshBackendStatus();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Backend API configuration, connection diagnostics, and authorization profile.</p>
      </div>

      {/* REST API CONFIGURATION - Admin only */}
      {isAdmin && (
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Backend API Endpoint</h2>
                <p className="text-[11px] text-slate-500">Target host for Spring Boot REST API services</p>
              </div>
            </div>
            <button
              onClick={refreshBackendStatus}
              disabled={backendStatus.checking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${backendStatus.checking ? 'animate-spin' : ''}`} />
              <span>Check Connection</span>
            </button>
          </div>

          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${backendStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div>
                <div className="font-medium text-slate-800">
                  Service Status:{' '}
                  <span className={backendStatus.connected ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                    {backendStatus.connected ? 'Operational' : 'Unavailable'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{backendStatus.message}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              {backendStatus.lastChecked ? `Last checked: ${new Date(backendStatus.lastChecked).toLocaleTimeString()}` : 'Checking...'}
            </div>
          </div>

          <form onSubmit={handleSaveBackendUrl} className="space-y-3">
            <div>
              <label htmlFor="backend-url-input" className="block text-xs font-medium text-slate-700 mb-1">Backend Service URL</label>
              <div className="flex gap-2">
                <input
                  id="backend-url-input"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shrink-0 shadow-2xs">
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Endpoint</span>
                </button>
                <button type="button" onClick={handleResetDefaultUrl} className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs" title="Reset to localhost:8080">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ACCESS CONTROL */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Role-Based Access Control</h2>
            <p className="text-[11px] text-slate-500">Current assigned departmental role permissions</p>
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
          <div className="flex justify-between text-slate-600 mb-2">
            <span className="font-medium">Current Role:</span>
            <span className="text-slate-900 font-semibold">{user?.role?.replace(/_/g, ' ') || 'N/A'}</span>
          </div>
          <p className="text-[11px] text-slate-500">Your role is assigned by the system administrator. Contact your department admin to request a role change.</p>
        </div>
      </div>

      {/* SESSION INFO - No JWT token exposed */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Session & Authentication</h2>
            <p className="text-[11px] text-slate-500">Active credentials and authorization status</p>
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Active Personnel:</span>
            <span className="text-slate-900 font-medium">{user?.name || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Email:</span>
            <span className="text-slate-900">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Session Status:</span>
            <span className="text-emerald-700 font-medium">
              {token ? 'Authenticated — Token Active' : 'No Active Session'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
