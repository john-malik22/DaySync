import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LunaProvider } from './context/LunaContext';
import { PWAUpdateProvider } from './context/PWAUpdateContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ToastProvider } from './context/ToastContext';
import { UpdatePromptModal } from './components/common/UpdatePromptModal';
import { WhatsNewModal } from './components/common/WhatsNewModal';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Sidebar } from './components/common/Sidebar';

import { DashboardPage } from './pages/app/DashboardPage';
import { ChatPage } from './pages/app/ChatPage';
import { ExpensesPage } from './pages/app/ExpensesPage';
import { TaskPage } from './pages/app/TaskPage';
import { HabitsPage } from './pages/app/HabitsPage';
import { MemoriesPage } from './pages/app/MemoriesPage';
import { SummaryPage } from './pages/app/SummaryPage';
import { SettingsPage } from './pages/app/SettingsPage';

function AppLayout() {
  return (
    <div className="app-shell-layout">
      <Sidebar />
      <div className="main-content-area">
        <Outlet />
      </div>
    </div>
  );
}

export const STARTUP_ROUTE_MAP = {
  dashboard: '/app/dashboard',
  tasks: '/app/task',
  task: '/app/task',
  expenses: '/app/expenses',
  plans: '/app/expenses',
  habits: '/app/habits',
  goals: '/app/habits',
  memories: '/app/memories',
  notifications: '/app/dashboard',
  chat: '/app/chat',
  summary: '/app/summary'
};

export function getStartupRoute() {
  try {
    const saved = localStorage.getItem('daysync_startup_page');
    if (saved) {
      const cleanKey = String(saved).toLowerCase().replace('/app/', '').trim();
      if (STARTUP_ROUTE_MAP[cleanKey]) {
        return STARTUP_ROUTE_MAP[cleanKey];
      }
      if (saved.startsWith('/app/')) {
        return saved;
      }
    }
  } catch (e) {}
  return '/app/dashboard';
}

function AppIndexRedirect() {
  return <Navigate to={getStartupRoute()} replace />;
}

function PublicOnlyRoute() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '600'
      }}>
        Verifying Session...
      </div>
    );
  }

  if (token || user) {
    return <Navigate to={getStartupRoute()} replace />;
  }

  return <Outlet />;
}

function ProtectedRoute() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '600'
      }}>
        Verifying Session...
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function RootRoute() {
  const { user, token, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '600'
      }}>
        Verifying Session...
      </div>
    );
  }
  if (token || user) {
    return <Navigate to={getStartupRoute()} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <PWAUpdateProvider>
        <ToastProvider>
          <OfflineBanner />
          <UpdatePromptModal />
          <WhatsNewModal />
          <AuthProvider>
            <NotificationProvider>
              <LunaProvider>
                <Router>
                  <Routes>
                    {/* Root Entrance */}
                    <Route path="/" element={<RootRoute />} />
                    
                    {/* Public Unauthenticated Routes */}
                    <Route element={<PublicOnlyRoute />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                    </Route>

                    <Route path="/onboarding" element={<Onboarding />} />

                    {/* Main Application Protected Shell Routes */}
                    <Route path="/app" element={<ProtectedRoute />}>
                      <Route index element={<AppIndexRedirect />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="expenses" element={<ExpensesPage />} />
                      <Route path="task" element={<TaskPage />} />
                      <Route path="planner" element={<Navigate to="/app/task" replace />} />
                      <Route path="habits" element={<HabitsPage />} />
                      <Route path="memories" element={<MemoriesPage />} />
                      <Route path="summary" element={<SummaryPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to={getStartupRoute()} replace />} />
                  </Routes>
                </Router>
              </LunaProvider>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </PWAUpdateProvider>
    </ErrorBoundary>
  );
}
