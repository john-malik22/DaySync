import React, { useState, useRef } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { usePWAUpdate } from '../../context/PWAUpdateContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { api } from '../../services/api';
import { 
  User,
  Bell, 
  Moon, 
  Sun, 
  Download, 
  Trash2, 
  LogOut, 
  UserX, 
  RefreshCw, 
  Shield, 
  Check, 
  Mail, 
  Layout, 
  Sparkles,
  Smartphone,
  Info,
  Sliders,
  Database,
  Lock,
  ExternalLink,
  Zap,
  X
} from 'lucide-react';
import pkg from '../../../package.json';

export function SettingsPage() {
  const { user, theme, toggleTheme, logout, deleteAccount } = useAuth();
  const { preferences, updatePreferences, requestBrowserPermission } = useNotifications();
  const {
    currentVersion,
    latestVersion,
    updateAvailable,
    checking,
    hasCheckedManually,
    fetchError,
    checkForUpdates,
    applyUpdate,
    getReleaseHighlights,
    openWhatsNewModal
  } = usePWAUpdate();

  const { showToast } = useToast();

  // Section scroll refs
  const accountRef = useRef(null);
  const upgradeRef = useRef(null);
  const appearanceRef = useRef(null);
  const notificationsRef = useRef(null);
  const lunaRef = useRef(null);
  const privacyRef = useRef(null);
  const updatesRef = useRef(null);
  const supportRef = useRef(null);
  const aboutRef = useRef(null);

  const [activeSection, setActiveSection] = useState('account');

  // Confirmation Modals State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Loading States
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  // Luna Preferences (stored locally)
  const [lunaProactive, setLunaProactive] = useState(() => {
    return localStorage.getItem('daysync_luna_proactive') !== 'false';
  });
  const [lunaMemory, setLunaMemory] = useState(() => {
    return localStorage.getItem('daysync_luna_memory') !== 'false';
  });

  const toggleLunaProactive = (val) => {
    setLunaProactive(val);
    localStorage.setItem('daysync_luna_proactive', val.toString());
    if (showToast) showToast(val ? 'Luna proactive suggestions enabled.' : 'Luna proactive suggestions disabled.', 'info');
  };

  const toggleLunaMemory = (val) => {
    setLunaMemory(val);
    localStorage.setItem('daysync_luna_memory', val.toString());
    if (showToast) showToast(val ? 'Luna conversation memory enabled.' : 'Luna conversation memory disabled.', 'info');
  };

  // Starting Account Balance
  const [startingBalanceInput, setStartingBalanceInput] = useState(() => {
    return localStorage.getItem('daysync_starting_account_amount') || localStorage.getItem('luna_monthly_budget_target') || '';
  });
  const [balanceSavedMsg, setBalanceSavedMsg] = useState(false);

  // Widget Preferences
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_dashboard_widgets');
      return saved ? JSON.parse(saved) : { task: true, expense: true, memory: true, habit: true, progress: true };
    } catch (e) {
      return { task: true, expense: true, memory: true, habit: true, progress: true };
    }
  });

  const toggleWidget = (key) => {
    setWidgets(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('daysync_dashboard_widgets', JSON.stringify(updated));
      return updated;
    });
  };

  const VALID_STARTUP_PAGES = ['dashboard', 'tasks', 'expenses', 'plans', 'habits', 'goals', 'memories', 'notifications', 'chat', 'summary'];

  // Startup Page preference state
  const [startupPage, setStartupPage] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_startup_page');
      if (saved && VALID_STARTUP_PAGES.includes(saved.toLowerCase())) {
        return saved.toLowerCase();
      }
      if (saved && saved.startsWith('/app/')) {
        const key = saved.replace('/app/', '').replace('task', 'tasks');
        if (VALID_STARTUP_PAGES.includes(key)) return key;
      }
    } catch (e) {}
    return 'dashboard';
  });

  const handleStartupPageChange = (e) => {
    const value = e.target.value;
    setStartupPage(value);
    try {
      localStorage.setItem('daysync_startup_page', value);
    } catch (e) {}
    if (showToast) showToast('Startup page updated.', 'success');
  };

  const handleSaveStartingBalance = (e) => {
    e.preventDefault();
    const val = parseFloat(startingBalanceInput);
    if (!isNaN(val) && val >= 0) {
      localStorage.setItem('daysync_starting_account_amount', val.toString());
      setBalanceSavedMsg(true);
      if (showToast) showToast('Base account balance updated across all features!', 'success');
      setTimeout(() => setBalanceSavedMsg(false), 2500);
    }
  };

  const scrollToSection = (ref, sectionKey) => {
    setActiveSection(sectionKey);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Privacy & Data Actions
  const handleExportDataClick = () => {
    setShowExportModal(true);
  };

  const handleConfirmExportData = async () => {
    setShowExportModal(false);
    if (isExportingData) return;
    setIsExportingData(true);
    if (showToast) showToast('Preparing your DaySync PDF export...', 'info');

    try {
      const data = await api.exportData();
      if (!data) throw new Error('API returned empty export payload');
      exportDataToPdf(data);
      if (showToast) showToast('Your DaySync PDF export is ready.', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      if (showToast) showToast('Unable to export your data right now. Please try again.', 'error');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleConfirmClearHistory = async () => {
    setIsClearingHistory(true);
    try {
      await api.clearHistory();
      setShowClearHistoryModal(false);
      if (showToast) showToast('Chat history cleared successfully.', 'success');
    } catch (err) {
      if (showToast) showToast('Unable to clear history right now. Please try again.', 'error');
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (err) {
      if (showToast) showToast('Unable to delete your account right now. Please try again.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const currentHighlights = getReleaseHighlights(currentVersion);

  const sectionsNav = [
    { key: 'account', label: 'Account', icon: User, ref: accountRef },
    { key: 'upgrade', label: 'Upgrade', icon: Zap, ref: upgradeRef },
    { key: 'appearance', label: 'Appearance', icon: Sun, ref: appearanceRef },
    { key: 'notifications', label: 'Notifications', icon: Bell, ref: notificationsRef },
    { key: 'luna', label: 'Luna', icon: Sparkles, ref: lunaRef },
    { key: 'privacy', label: 'Privacy & Data', icon: Shield, ref: privacyRef },
    { key: 'updates', label: 'App Updates', icon: RefreshCw, ref: updatesRef },
    { key: 'support', label: 'Support', icon: Mail, ref: supportRef },
    { key: 'about', label: 'About', icon: Info, ref: aboutRef }
  ];

  return (
    <div className="page-container" style={{ maxWidth: '840px' }}>
      <PageHeaderRow title="Settings" />

      {/* Sticky Section Navigation Chips Bar */}
      <div className="scroll-row" style={{ marginBottom: 'var(--space-md)', paddingBottom: '4px' }}>
        {sectionsNav.map(sec => {
          const IconComp = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => scrollToSection(sec.ref, sec.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={13} /> {sec.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {/* 1. ACCOUNT SECTION */}
        <div ref={accountRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--accent-primary)" /> Account
          </h3>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-primary)',
                color: '#FFFFFF', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email || 'user@daysync.app'}</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
              Active Account
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <LogOut size={15} /> Log Out
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="btn-secondary"
              style={{
                color: 'var(--accent-danger)',
                borderColor: 'var(--accent-danger)',
                background: 'rgba(200, 92, 92, 0.1)',
                fontSize: '13px'
              }}
            >
              <UserX size={15} /> Delete Account
            </button>
          </div>
        </div>

        {/* 2. UPGRADE DAYSYNC SECTION */}
        <div ref={upgradeRef} className="glass-card" style={{ border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.08) 0%, rgba(18, 18, 26, 0.6) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '800' }}>
                <Sparkles size={18} color="var(--accent-primary)" /> Upgrade DaySync
              </h3>
              <p style={{ margin: '6px 0 12px 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Unlock a more personalized executive experience.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={13} color="var(--accent-primary)" /> More dashboard widgets & custom grid layouts</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={13} color="var(--accent-primary)" /> Advanced financial tracking & Split analytics</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={13} color="var(--accent-primary)" /> Priority Luna AI responses & daily briefings</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              aria-label="View DaySync Plus plans"
            >
              <Zap size={14} /> View Plans
            </button>
          </div>
        </div>

        {/* 3. APPEARANCE SECTION */}
        <div ref={appearanceRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} color="var(--accent-primary)" /> Appearance
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Theme Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose between Light Mode and Dark Mode</div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              {theme === 'dark' ? <Sun size={15} color="var(--accent-warning)" /> : <Moon size={15} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* Dashboard Customization Cards */}
          <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Executive Dashboard Cards
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-xs)' }}>
              {[
                { key: 'task', label: 'Task Performance' },
                { key: 'expense', label: 'Financial Overview' },
                { key: 'memory', label: 'Memory Center' },
                { key: 'habit', label: 'Habit Tracker' },
                { key: 'progress', label: 'Overall Progress' }
              ].map(widget => (
                <label key={widget.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{widget.label}</span>
                  <input
                    type="checkbox"
                    checked={widgets[widget.key]}
                    onChange={() => toggleWidget(widget.key)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Open Page on Startup Setting */}
          <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-sm)' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Open Page on Startup
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Choose which DaySync page opens when you launch the app.
            </div>
            <select
              value={startupPage}
              onChange={handleStartupPageChange}
              style={{ width: '100%', maxWidth: '280px', padding: '6px 10px', fontSize: '13px' }}
              aria-label="Open Page on Startup"
            >
              <option value="dashboard">Dashboard</option>
              <option value="tasks">Tasks</option>
              <option value="expenses">Expenses</option>
              <option value="plans">Plans</option>
              <option value="habits">Habits</option>
              <option value="notifications">Notifications</option>
              <option value="chat">Chat</option>
              <option value="summary">Summary</option>
            </select>
          </div>
        </div>

        {/* 3. NOTIFICATIONS SECTION */}
        <div ref={notificationsRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--accent-primary)" /> Notifications
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Control category alerts and browser push notification permissions.
          </p>

          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', marginBottom: 'var(--space-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>Browser Push Notifications</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {preferences.browser ? 'Browser notifications enabled ✅' : 'Receive alerts even when DaySync is in the background'}
              </div>
            </div>
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Smartphone size={14} /> {preferences.browser ? 'Enabled' : 'Enable Browser Push'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)' }}>
            {[
              { key: 'daily', label: 'Daily DayStart Notification' },
              { key: 'task', label: 'Task notifications' },
              { key: 'habit', label: 'Habit notifications' },
              { key: 'goal', label: 'Goal notifications' },
              { key: 'budget', label: 'Budget/expense notifications' },
              { key: 'luna', label: 'Luna suggestions' },
              { key: 'system', label: 'System notifications' },
              { key: 'update', label: 'App update notifications' }
            ].map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(preferences[item.key])}
                  onChange={(e) => updatePreferences({ [item.key]: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* 4. LUNA SECTION */}
        <div ref={lunaRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-primary)" /> Luna Preferences
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Configure proactive intelligence behavior and starting financial baseline.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Proactive suggestions</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Allow Luna to generate daily productivity & spending insights</div>
              </div>
              <input
                type="checkbox"
                checked={lunaProactive}
                onChange={(e) => toggleLunaProactive(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
            </label>

            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Conversation memory</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Allow Luna to retain memory context across chat sessions</div>
              </div>
              <input
                type="checkbox"
                checked={lunaMemory}
                onChange={(e) => toggleLunaMemory(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
            </label>
          </div>

          <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Starting Base Account Balance
            </div>
            <form onSubmit={handleSaveStartingBalance} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', maxWidth: '360px' }}>
              <input
                type="number"
                placeholder="Starting Amount (₹)"
                value={startingBalanceInput}
                onChange={(e) => setStartingBalanceInput(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Save
              </button>
            </form>
          </div>
        </div>

        {/* 5. PRIVACY & DATA SECTION */}
        <div ref={privacyRef} className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-primary)" /> Privacy & Data
          </h3>
          <p className="settings-compact-subtitle" style={{ color: 'var(--text-muted)' }}>
            Export your data payload or clear your conversation history.
          </p>

          <div className="settings-btn-grid-2">
            <button
              type="button"
              onClick={handleExportDataClick}
              disabled={isExportingData}
              className="btn-secondary"
            >
              <Download size={14} /> {isExportingData ? 'Exporting...' : 'Export My Data'}
            </button>

            <button
              type="button"
              onClick={() => setShowClearHistoryModal(true)}
              className="btn-secondary"
              style={{ color: 'var(--accent-warning)' }}
            >
              <Trash2 size={14} /> Clear Chat History
            </button>
          </div>
        </div>

        {/* 6. APP UPDATES SECTION */}
        <div ref={updatesRef} className="glass-card settings-compact-card">
          <h3 className="settings-compact-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} color="var(--accent-primary)" /> App Updates
          </h3>
          <div className="settings-compact-subtitle" style={{ color: 'var(--text-secondary)' }}>
            DaySync Version {currentVersion || pkg.version || '1.1.2'}
          </div>

          {updateAvailable && (
            <div style={{
              marginBottom: 'var(--space-md)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <strong>Update available</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Version {latestVersion} is available.
                </div>
              </div>
              <button
                type="button"
                onClick={applyUpdate}
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '13px', minHeight: '34px', flexShrink: 0 }}
              >
                Update Now
              </button>
            </div>
          )}

          <div className="settings-btn-grid-2">
            {!updateAvailable && (
              <button
                type="button"
                onClick={checkForUpdates}
                disabled={checking}
                className="btn-secondary"
              >
                <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                {checking
                  ? 'Checking...'
                  : fetchError
                  ? 'Try Again'
                  : hasCheckedManually && !fetchError
                  ? "Up to Date"
                  : 'Check for Updates'}
              </button>
            )}

            <button
              type="button"
              onClick={openWhatsNewModal}
              className="btn-secondary"
            >
              <Sparkles size={14} /> View Release Notes
            </button>
          </div>

          {fetchError && !checking && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-danger)', fontWeight: '500' }}>
              {!navigator.onLine ? "Couldn't check for updates while you're offline." : "Couldn't check for updates right now."}
            </div>
          )}
        </div>

        {/* 7. SUPPORT SECTION */}
        <div ref={supportRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--accent-primary)" /> Support
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Need help or have suggestions? Contact the developer directly via email.
          </p>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>Contact Developer</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Support Email: <a href="mailto:johnmalik2222@gmail.com" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>support@daysync.app</a>
              </div>
            </div>

            <a
              href="mailto:johnmalik2222@gmail.com"
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Mail size={14} /> Contact Developer
            </a>
          </div>
        </div>

        {/* 8. ABOUT SECTION */}
        <div ref={aboutRef} className="glass-card">
          <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} color="var(--accent-primary)" /> About DaySync
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 14px 0' }}>
            Your personal productivity companion.
          </p>

          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7',
            marginBottom: '14px'
          }}>
            <div><strong>Application:</strong> DaySync</div>
            <div><strong>Version:</strong> Version {currentVersion || pkg.version || '1.1.2'}</div>
            <div><strong>Support Email:</strong> <a href="mailto:support@daysync.app" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>support@daysync.app</a></div>
            <div><strong>Architecture:</strong> Vite PWA + Luna Intelligence Engine</div>
            <div><strong>Copyright:</strong> © 2026 DaySync. All rights reserved.</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="mailto:support@daysync.app"
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '34px' }}
            >
              <Mail size={14} /> Contact Developer
            </a>

            <button
              type="button"
              onClick={openWhatsNewModal}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', minHeight: '34px' }}
            >
              <Sparkles size={14} /> View What's New
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODALS */}
      {/* 1. Log Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Log out of DaySync?"
        message="Are you sure you want to log out of your session?"
        confirmText="Log Out"
        cancelText="Cancel"
        isDanger={false}
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* 2. Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete your DaySync account?"
        message="Your account and associated data will be permanently deleted. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeletingAccount}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* 3. Clear History Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearHistoryModal}
        title="Clear your conversation history?"
        message="Are you sure you want to clear your stored chat messages? This action cannot be undone."
        confirmText="Clear History"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isClearingHistory}
        onConfirm={handleConfirmClearHistory}
        onCancel={() => setShowClearHistoryModal(false)}
      />

      {/* 4. Export PDF Confirmation Modal */}
      <ConfirmationModal
        isOpen={showExportModal}
        title="Export your DaySync data?"
        message="Your export may contain personal information from your account."
        confirmText={isExportingData ? "Exporting..." : "Export PDF"}
        cancelText="Cancel"
        isDanger={false}
        isLoading={isExportingData}
        onConfirm={handleConfirmExportData}
        onCancel={() => setShowExportModal(false)}
      />

      {/* 5. Upgrade Preview Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent-primary)" /> DaySync Plus Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close upgrade preview modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Current Membership</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                Free Plan <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-success)' }}>(Active)</span>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(108, 99, 255, 0.08)', border: '1px solid var(--accent-primary)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>DaySync Plus</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)' }}>₹199 / month</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Enhanced capabilities for ultimate productivity and automated organization.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <div>✦ Unlimited executive widgets & layouts</div>
                <div>✦ Advanced Split debt simplification</div>
                <div>✦ Priority AI assistant response time</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                Close
              </button>
              <button
                type="button"
                disabled
                className="btn-primary"
                aria-label="Upgrade to DaySync Plus coming soon"
                style={{ fontSize: '12px', padding: '8px 16px', opacity: 0.8, cursor: 'not-allowed' }}
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
