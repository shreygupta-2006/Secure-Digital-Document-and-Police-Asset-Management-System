import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Main Application Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AssetsPage } from './pages/assets/AssetsPage';
import { AssetDetailPage } from './pages/assets/AssetDetailPage';
import { CreateAssetPage } from './pages/assets/CreateAssetPage';
import { EditAssetPage } from './pages/assets/EditAssetPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { DocumentDetailPage } from './pages/documents/DocumentDetailPage';
import { AiIntelligencePage } from './pages/ai/AiIntelligencePage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ApprovalsPage } from './pages/admin/ApprovalsPage';
import { CasesPage } from './pages/cases/CasesPage';
import { CaseDetailPage } from './pages/cases/CaseDetailPage';
import { CreateCasePage } from './pages/cases/CreateCasePage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Asset Management */}
              <Route path="assets" element={<AssetsPage />} />
              <Route
                path="assets/new"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STORE_KEEPER']}>
                    <CreateAssetPage />
                  </ProtectedRoute>
                }
              />
              <Route path="assets/:id" element={<AssetDetailPage />} />
              <Route
                path="assets/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STORE_KEEPER']}>
                    <EditAssetPage />
                  </ProtectedRoute>
                }
              />

              {/* Documents */}
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="documents/:id" element={<DocumentDetailPage />} />

              {/* AI Intelligence Workspace */}
              <Route
                path="ai"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'OFFICER']}>
                    <AiIntelligencePage />
                  </ProtectedRoute>
                }
              />

              {/* Case Management */}
              <Route path="cases" element={<CasesPage />} />
              <Route path="cases/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><CreateCasePage /></ProtectedRoute>} />
              <Route path="cases/:id" element={<CaseDetailPage />} />

              {/* Admin Approvals */}
              <Route
                path="approvals"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ApprovalsPage />
                  </ProtectedRoute>
                }
              />

              {/* Audit Trail */}
              <Route
                path="audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'AUDITOR']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Settings & Backend Connectivity */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
