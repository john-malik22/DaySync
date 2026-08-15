import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LunaProvider } from './context/LunaContext';

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

function AppIndexRedirect() {
  const startupPath = localStorage.getItem('daysync_startup_page') || '/app/dashboard';
  return <Navigate to={startupPath} replace />;
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

export default function App() {
  return (
    <AuthProvider>
      <LunaProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LunaProvider>
    </AuthProvider>
  );
}
