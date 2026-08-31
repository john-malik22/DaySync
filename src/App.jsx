import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
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

// Sequence of main mobile app pages for horizontal swipe navigation
const MOBILE_NAV_SEQUENCE = [
  '/app/dashboard',
  '/app/task',
  '/app/expenses',
  '/app/plans',
  '/app/splits',
  '/app/habits',
  '/app/chat',
  '/app/settings'
];

function useMobileSwipeNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isIgnored = false;

    const handleTouchStart = (e) => {
      // Apply ONLY to mobile screens (<=768px)
      if (window.innerWidth > 768) return;
      if (!e.touches || e.touches.length === 0) return;

      const target = e.target;
      if (!target) return;

      // 1. Do not trigger while typing in inputs, textareas, selects, or contenteditable
      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        isIgnored = true;
        return;
      }

      // 2. Do not trigger inside modals, overlays, or dialogs
      if (target.closest('.modal-overlay, .modal-content, [role="dialog"], .dialog')) {
        isIgnored = true;
        return;
      }

      // 3. Do not trigger inside horizontal-scroll containers
      let currentEl = target;
      while (currentEl && currentEl !== document.body) {
        if (currentEl.classList && (currentEl.classList.contains('scroll-row') || currentEl.classList.contains('overflow-x-auto') || currentEl.classList.contains('splits-detail-tabs-nav'))) {
          isIgnored = true;
          return;
        }
        try {
          const style = window.getComputedStyle(currentEl);
          if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && currentEl.scrollWidth > currentEl.clientWidth + 5) {
            isIgnored = true;
            return;
          }
        } catch (err) {}
        currentEl = currentEl.parentElement;
      }

      isIgnored = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e) => {
      if (isIgnored || window.innerWidth > 768) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const elapsedTime = touchEndTime - touchStartTime;

      // Reasonable threshold parameters to prevent accidental trigger
      const minDistance = 65;       // Minimum horizontal px
      const maxTime = 450;          // Maximum swipe duration (ms)
      const maxVerticalDev = 60;    // Maximum vertical deviation (px)

      if (elapsedTime <= maxTime && Math.abs(deltaX) >= minDistance && Math.abs(deltaY) <= maxVerticalDev && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        const rawPath = location.pathname;
        const currentPath = rawPath.startsWith('/app/splits') ? '/app/splits' : rawPath;
        const currentIndex = MOBILE_NAV_SEQUENCE.indexOf(currentPath);

        if (currentIndex !== -1) {
          if (deltaX < 0) {
            // Swipe LEFT → navigate to Next app page
            if (currentIndex < MOBILE_NAV_SEQUENCE.length - 1) {
              navigate(MOBILE_NAV_SEQUENCE[currentIndex + 1]);
            }
          } else {
            // Swipe RIGHT → navigate to Previous app page
            if (currentIndex > 0) {
              navigate(MOBILE_NAV_SEQUENCE[currentIndex - 1]);
            }
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location.pathname, navigate]);
}

function AppLayout() {
  useMobileSwipeNavigation();

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
