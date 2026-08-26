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
import { PlansPage } from './pages/app/PlansPage';
import { SplitsPage } from './pages/app/SplitsPage';
import { TaskPage } from './pages/app/TaskPage';
import { HabitsPage } from './pages/app/HabitsPage';
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
  plans: '/app/plans',
  splits: '/app/splits',
  habits: '/app/habits',
  chat: '/app/chat',
  settings: '/app/settings'
};

function AppIndexRedirect() {
  let targetPath = '/app/dashboard';
  try {
    const saved = localStorage.getItem('daysync_startup_page');
    if (saved) {
      const cleanKey = String(saved).toLowerCase().replace('/app/', '').trim();
      if (STARTUP_ROUTE_MAP[cleanKey]) {
        targetPath = STARTUP_ROUTE_MAP[cleanKey];
      }
    }
  } catch (e) {}

  return <Navigate to={targetPath} replace />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <PWAUpdateProvider>
              <LunaProvider>
                <OfflineBanner />
                <UpdatePromptModal />
                <WhatsNewModal />
                <Router>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index element={<AppIndexRedirect />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="task" element={<TaskPage />} />
                      <Route path="expenses" element={<ExpensesPage />} />
                      <Route path="plans" element={<PlansPage />} />
                      <Route path="splits" element={<SplitsPage />} />
                      <Route path="splits/:id" element={<SplitsPage />} />
                      <Route path="habits" element={<HabitsPage />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </LunaProvider>
            </PWAUpdateProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
