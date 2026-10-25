
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ApiConfigProvider } from './context/ApiConfigContext';

import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StaffDashboard } from './pages/StaffDashboard';
import { ClientsPage } from './pages/ClientsPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { StaffPage } from './pages/StaffPage';
import { StaffInvitationPage } from './pages/StaffInvitationPage';

const RoleDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <DashboardPage />;
  }

  if (user.role === 'STAFF') {
    return <StaffDashboard />;
  }

  return <Navigate to="/login" replace />;
};

const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ApiConfigProvider>
      <NotificationProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route
                path="/staff-invitation"
                element={<StaffInvitationPage />}
              />

              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<AppLayout />}>
                {/* Open the sign-in page at the root URL */}
                <Route
                  index
                  element={<Navigate to="/login" replace />}
                />

                <Route path="dashboard" element={<RoleDashboard />} />

                <Route path="clients" element={<ClientsPage />} />

                <Route
                  path="memberships"
                  element={
                    <AdminOnlyRoute>
                      <MembershipsPage />
                    </AdminOnlyRoute>
                  }
                />

                <Route
                  path="communications"
                  element={<CommunicationsPage />}
                />

                <Route
                  path="follow-ups"
                  element={<FollowUpsPage />}
                />

                <Route
                  path="staff"
                  element={
                    <AdminOnlyRoute>
                      <StaffPage />
                    </AdminOnlyRoute>
                  }
                />
              </Route>

              {/* Send unknown URLs to sign-in */}
              <Route
                path="*"
                element={<Navigate to="/login" replace />}
              />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </NotificationProvider>
    </ApiConfigProvider>
  );
}
