
import React, { useState } from 'react';
import {
  NavLink,
  useLocation,
  useNavigate,
  Navigate,
  Outlet,
} from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  CalendarCheck,
  ShieldCheck,
  Server,
  LogOut,
  Menu,
  X,
  Dumbbell,
  LockKeyhole,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useApiConfig } from '../../context/ApiConfigContext';
import { ApiContractModal } from '../common/ApiContractModal';

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', path: '/clients', icon: Users },
  {
    name: 'Memberships',
    path: '/memberships',
    icon: CreditCard,
    adminOnly: true,
  },
  {
    name: 'Communications',
    path: '/communications',
    icon: MessageSquare,
  },
  {
    name: 'Follow-ups',
    path: '/follow-ups',
    icon: CalendarCheck,
  },
  {
    name: 'Staff Management',
    path: '/staff',
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { isMockMode, openApiGuide } = useApiConfig();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBreadcrumbTitle = () => {
    const current = NAV_ITEMS.find(
      (item) => item.path === location.pathname
    );

    if (current) return current.name;

    if (location.pathname.startsWith('/clients/')) {
      return 'Client Profile';
    }

    if (location.pathname === '/login') {
      return 'Authentication';
    }

    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Dumbbell className="w-4 h-4" />
          </div>

          <span className="text-base font-bold text-slate-900 tracking-tight">
            Fit Connect
          </span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>

            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                Fit Connect
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Operations &amp; Client CRM
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.path ||
              (item.path === '/dashboard' &&
                location.pathname === '/');

            const isRestrictedForUser =
              item.adminOnly && !isAdmin;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                title={
                  isRestrictedForUser
                    ? 'Restricted to Admin users'
                    : item.name
                }
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                />

                <span>{item.name}</span>

                {item.adminOnly &&
                  (isAdmin ? (
                    <span className="ml-auto text-[10px] uppercase font-bold text-purple-600">
                      Admin
                    </span>
                  ) : (
                    <LockKeyhole
                      className="ml-auto w-3.5 h-3.5 shrink-0 text-slate-400"
                      aria-label="Admin access only"
                    />
                  ))}
              </NavLink>
            );
          })}
        </nav>

        {/* API Integration Launcher */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              openApiGuide();
            }}
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-emerald-600 shrink-0" />

              <div>
                <p className="text-xs font-bold text-slate-800">
                  Spring Boot API
                </p>
                <p className="text-[10px] text-slate-500">
                  {isMockMode
                    ? 'Mock Prototype Mode'
                    : 'Live REST API'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Contract
            </span>
          </button>
        </div>

        {/* Current User & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {user?.fullName || 'Guest'}
                </span>

                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {user?.role || 'STAFF'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              Fit Connect
            </span>

            <span className="text-slate-300">/</span>

            <span className="font-semibold text-slate-900">
              {getBreadcrumbTitle()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openApiGuide}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spring Boot Integration Contract</span>
            </button>
          </div>
        </header>

        {/* Routed Page */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* API Contract Modal */}
      <ApiContractModal />
    </div>
  );
};
