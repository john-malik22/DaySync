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
import { MemoriesPage } from './pages/app/MemoriesPage';
import { SummaryPage } from './pages/app/SummaryPage';
import { SettingsPage } from './pages/app/SettingsPage';

import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { QuickAddModal } from './components/common/QuickAddModal';
import { Plus } from 'lucide-react';

function AppLayout() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);

  React.useEffect(() => {
    window.__daysync_openCommandPalette = () => setIsCommandPaletteOpen(true);
    window.__daysync_openQuickAdd = () => setIsQuickAddOpen(true);
    return () => {
      delete window.__daysync_openCommandPalette;
      delete window.__daysync_openQuickAdd;
    };
  }, []);

  const handleOpenQuickAdd = (target) => {
    if (target === 'command_palette') {
      setIsCommandPaletteOpen(true);
    } else {
      setIsQuickAddOpen(true);
    }
  };

  return (
    <div className="app-shell-layout">
      <Sidebar />
      <div className="main-content-area">
        <Outlet context={{ openCommandPalette: () => setIsCommandPaletteOpen(true), openQuickAdd: () => setIsQuickAddOpen(true) }} />
      </div>

      {/* Floating Global Quick Add Action Button */}
      <button
        type="button"
        onClick={() => setIsQuickAddOpen(true)}
        aria-label="Global Quick Add"
        title="Quick Add (Task, Expense, Plan, Habit, Split)"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'var(--accent-primary)', color: '#FFFFFF', border: 'none',
          boxShadow: '0 6px 20px rgba(108, 99, 255, 0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.18s ease'
        }}
      >
        <Plus size={24} />
      </button>

      {/* Global Command Palette & Quick Add Modals */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenQuickAdd={handleOpenQuickAdd}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
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
  goals: '/app/habits',
  memories: '/app/memories',
  notifications: '/app/notifications',
  chat: '/app/chat',
  summary: '/app/summary'
};

function AppIndexRedirect() {
  let targetPath = '/app/dashboard';
  try {
    const saved = localStorage.getItem('daysync_startup_page');
    if (saved) {
      const cleanKey = String(saved).toLowerCase().replace('/app/', '').trim();
      if (STARTUP_ROUTE_MAP[cleanKey]) {
        targetPath = STARTUP_ROUTE_MAP[cleanKey];
      } else if (saved.startsWith('/app/')) {
        targetPath = saved;
      }
    }
  } catch (e) {
    targetPath = '/app/dashboard';
  }
  return <Navigate to={targetPath} replace />;
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
    return <Navigate to="/app/dashboard" replace />;
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
    return <Navigate to="/app/dashboard" replace />;
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
                      <Route path="plans" element={<PlansPage />} />
                      <Route path="splits" element={<SplitsPage />} />
                      <Route path="splits/:id" element={<SplitsPage />} />
                      <Route path="task" element={<TaskPage />} />
                      <Route path="planner" element={<Navigate to="/app/task" replace />} />
                      <Route path="habits" element={<HabitsPage />} />
                      <Route path="memories" element={<MemoriesPage />} />
                      <Route path="summary" element={<SummaryPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
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
