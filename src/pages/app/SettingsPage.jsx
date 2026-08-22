import React, { useState } from 'react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { usePWAUpdate } from '../../context/PWAUpdateContext';
import { 
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
  Eye
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

  const [showContactInfo, setShowContactInfo] = useState(false);

  // Single Shared Starting Account Balance
  const [startingBalanceInput, setStartingBalanceInput] = useState(() => {
    const saved = localStorage.getItem('daysync_starting_account_amount') || localStorage.getItem('luna_monthly_budget_target') || '';
    return saved;
  });
  const [balanceSavedMsg, setBalanceSavedMsg] = useState(false);

  // Widget Preferences state
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

  const handleSaveStartingBalance = (e) => {
    e.preventDefault();
    const val = parseFloat(startingBalanceInput);
    if (!isNaN(val) && val >= 0) {
      localStorage.setItem('daysync_starting_account_amount', val.toString());
      setBalanceSavedMsg(true);
      setTimeout(() => setBalanceSavedMsg(false), 2500);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your local chat history?')) {
      alert('Local chat history cleared.');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of DaySync?')) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('DANGER: Are you sure you want to delete your account? This action is permanent and cannot be undone.')) {
      await deleteAccount();
    }
  };

  const currentHighlights = getReleaseHighlights(currentVersion);

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <PageHeaderRow title="Settings" />

      {/* 1. Theme Preferences */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Appearance & Theme</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Theme Mode</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose between Light Mode and Dark Mode</div>
          </div>
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            {theme === 'dark' ? <Sun size={15} color="var(--accent-warning)" /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* 2. Notification Center Settings */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--accent-primary)" /> Notification Preferences
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
          Control which events generate in-app alerts and browser push notifications.
        </p>

        {/* Browser Permission Prompt Banner */}
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

        {/* Notification Category Toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)' }}>
          {[
            { key: 'task', label: 'Tasks & Reminders' },
            { key: 'habit', label: 'Habit Milestones' },
            { key: 'goal', label: 'Goal Deadlines' },
            { key: 'budget', label: 'Budget Alerts' },
            { key: 'luna', label: 'Luna AI Suggestions' },
            { key: 'system', label: 'System & Storage Alerts' }
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

      {/* 3. Dashboard Customization */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layout size={18} color="var(--accent-primary)" /> Dashboard Customization
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
          Toggle which cards appear on your executive dashboard.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-xs)' }}>
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

      {/* 4. Single Shared Starting Account Balance */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>Starting Account Amount</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
          Set your base account balance. Your total live balance across DaySync will automatically calculate from this base amount + Income - Expenses.
        </p>

        <form onSubmit={handleSaveStartingBalance} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', maxWidth: '360px' }}>
          <input
            type="number"
            placeholder="Starting Amount (₹)"
            value={startingBalanceInput}
            onChange={(e) => setStartingBalanceInput(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Save Base
          </button>
        </form>

        {balanceSavedMsg && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Base balance updated across all features!
          </div>
        )}
      </div>

      {/* 5. Account Management */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Account</h3>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '13px' }}>
            <LogOut size={15} /> Log Out
          </button>
          <button
            onClick={handleDeleteAccount}
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

      {/* 6. About DaySync & Versioning */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>About DaySync</h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          DaySync Version {currentVersion || pkg.version || '1.1.2'}
        </div>

        {/* Current Version Highlights Preview */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase' }}>
            What's New in {currentVersion}
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {currentHighlights.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {updateAvailable && (
          <div style={{
            marginBottom: 'var(--space-md)',
            padding: '12px 16px',
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
                DaySync {latestVersion} is ready.
              </div>
            </div>
            <button
              onClick={applyUpdate}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '13px', minHeight: '34px', flexShrink: 0 }}
            >
              Update Now
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          {!updateAvailable && (
            <button
              onClick={checkForUpdates}
              disabled={checking}
              className="btn-secondary"
              style={{ fontSize: '13px' }}
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              {checking
                ? 'Checking for updates...'
                : fetchError
                ? 'Try Again'
                : hasCheckedManually && !fetchError
                ? "You're using the latest version"
                : 'Check for Updates →'}
            </button>
          )}

          <button
            onClick={openWhatsNewModal}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Sparkles size={14} /> View Release Notes
          </button>

          <button
            onClick={() => setShowContactInfo(true)}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Mail size={14} /> Contact Developer →
          </button>
        </div>

        {fetchError && !checking && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-danger)', fontWeight: '500' }}>
            {!navigator.onLine ? "Couldn't check for updates while you're offline." : "Couldn't check for updates right now."}
          </div>
        )}

        {showContactInfo && (
          <div style={{
            marginTop: 'var(--space-md)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '13px'
          }}>
            <strong>Developer Contact:</strong>
            <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
              Developer: Antigravity DaySync Team<br />
              Support Email: support@daysync.app<br />
              Website: https://daysync.app
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
