import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Box,
  FileText,
  Sparkles,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  UserCheck,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { BackendStatusModal } from '../common/BackendStatusModal';

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending registration count for admins
  useEffect(() => {
    if (hasRole(['ADMIN'])) {
      apiClient.get('/api/auth/pending/count')
        .then((res) => setPendingCount(res.data.count || 0))
        .catch(() => setPendingCount(0));
    }
  }, [hasRole]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Operational Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OFFICER', 'STORE_KEEPER', 'AUDITOR', 'VIEWER'],
    },
    {
      label: 'Asset Overview',
      path: '/assets',
      icon: Box,
      roles: ['ADMIN', 'OFFICER', 'STORE_KEEPER', 'AUDITOR', 'VIEWER'],
    },
    {
      label: 'Documents',
      path: '/documents',
      icon: FileText,
      roles: ['ADMIN', 'OFFICER', 'STORE_KEEPER', 'AUDITOR', 'VIEWER'],
    },
    {
      label: 'Cases',
      path: '/cases',
      icon: FolderOpen,
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      label: 'AI Assistant',
      path: '/ai',
      icon: Sparkles,
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      label: 'Approvals',
      path: '/approvals',
      icon: UserCheck,
      roles: ['ADMIN'],
    },
    {
      label: 'Audit Logs',
      path: '/audit',
      icon: History,
      roles: ['ADMIN', 'AUDITOR'],
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'OFFICER', 'STORE_KEEPER', 'AUDITOR', 'VIEWER'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/assets/new')) return 'Add Asset';
    if (p.startsWith('/assets') && p.includes('/edit')) return 'Edit Asset';
    if (p.startsWith('/assets/')) return 'Asset Details';
    if (p.startsWith('/assets')) return 'Asset Overview';
    if (p.startsWith('/documents/')) return 'Document Details';
    if (p.startsWith('/cases/new')) return 'Create Case';
    if (p.startsWith('/cases/')) return 'Case Details';
    if (p.startsWith('/cases')) return 'Case Management';
    if (p.startsWith('/documents')) return 'Documents';
    if (p.startsWith('/ai')) return 'AI Assistant';
    if (p.startsWith('/audit')) return 'Audit Logs';
    if (p.startsWith('/settings')) return 'Settings';
    return 'Operational Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center space-x-3 border-b border-slate-800 bg-[#0f172a]">
          <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/40 flex items-center justify-center rounded shrink-0 text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">
              Police Asset Management
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              Internal Department Portal
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-200 p-1 ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium border-l-2 border-blue-500'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer'
                  }`
                }
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="truncate">{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card in Sidebar Bottom */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-slate-200">
                  {user?.name
                    ?.split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-200 truncate">
                  {user?.name || user?.fullName || 'Department Staff'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.role?.replace(/_/g, ' ') || 'OFFICER'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* TOP BAR */}
        <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded border border-slate-200 bg-white"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Header */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-normal">Police Asset Management</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">
                {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Top Bar Right Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold px-1">
                    {pendingCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-800">
                    <span>Notifications</span>
                  </div>
                  {hasRole(['ADMIN']) && pendingCount > 0 ? (
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        navigate('/approvals');
                      }}
                      className="w-full mt-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-left hover:bg-amber-100 transition-colors"
                    >
                      <div className="font-semibold text-amber-800 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        <span>{pendingCount} pending registration{pendingCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-[11px] text-amber-600 mt-1">
                        Click to review and approve new accounts.
                      </div>
                    </button>
                  ) : (
                    <div className="py-4 text-center text-slate-500 text-xs">
                      No new notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logged in User Pill */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-800 leading-tight">
                    {user?.name || user?.fullName || 'Staff'}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {user?.role?.replace(/_/g, ' ') || 'OFFICER'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md border border-slate-200 bg-white shadow-lg p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-semibold text-slate-900">{user?.name || user?.fullName}</div>
                    <div className="text-slate-500 text-[11px]">{user?.email}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Role: {user?.role?.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-100 text-slate-700"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded hover:bg-rose-50 text-rose-700"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN OUTLET */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        <footer className="h-8 border-t border-slate-200 flex items-center justify-between px-6 bg-white text-[11px] text-slate-500 shrink-0">
          <div>
            Police Asset Management System &bull; Internal Department Use
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Confidential</span>
            <span>&bull;</span>
            <span>Authorized Personnel Only</span>
          </div>
        </footer>
      </div>

      {/* Backend Status Modal */}
      <BackendStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};
