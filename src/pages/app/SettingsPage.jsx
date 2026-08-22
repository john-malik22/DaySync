import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, LogOut, UserX, Sun, Moon, Download, RefreshCw, Mail, Sliders, Wallet } from 'lucide-react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';
import { usePWAUpdate } from '../../context/PWAUpdateContext';
import pkg from '../../../package.json';
import { api } from '../../services/api';

export function SettingsPage() {
  const { user, theme, toggleTheme, logout, deleteAccount } = useAuth();
  const { startingBalance, updateStartingBalance } = useLuna();
  const { 
    updateAvailable, 
    checking, 
    hasCheckedManually, 
    latestVersion, 
    currentVersion, 
    fetchError, 
    checkForUpdates, 
    applyUpdate 
  } = usePWAUpdate();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const [startingBalanceInput, setStartingBalanceInput] = useState('');

  useEffect(() => {
    if (startingBalance !== null) {
      setStartingBalanceInput(startingBalance.toString());
    }
  }, [startingBalance]);

  const handleSaveStartingBalance = (e) => {
    e.preventDefault();
    if (!startingBalanceInput) return;
    updateStartingBalance(startingBalanceInput);
  };

  // 1. Startup Page Preference
  const [startupPage, setStartupPage] = useState(() => {
    return localStorage.getItem('daysync_startup_page') || '/app/dashboard';
  });

  // 2. Dashboard Widgets Visibility Preference
  const [widgetSettings, setWidgetSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('daysync_dashboard_widgets');
      return saved ? JSON.parse(saved) : { task: true, expense: true, memory: true, habit: true, progress: true };
    } catch (e) {
      return { task: true, expense: true, memory: true, habit: true, progress: true };
    }
  });

  // Check for Updates State
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [showContactInfo, setShowContactInfo] = useState(false);

  const handleStartupChange = (e) => {
    const val = e.target.value;
    setStartupPage(val);
    localStorage.setItem('daysync_startup_page', val);
  };

  const toggleWidgetSetting = (key) => {
    setWidgetSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('daysync_dashboard_widgets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
      await api.clearHistory();
      alert('Chat history cleared.');
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user,
      exportedAt: new Date().toISOString(),
      appVersion: "1.0.0"
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `daysync_data_${user?.id || 'user'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (confirm('CAUTION: Are you sure you want to permanently delete your account and ALL associated data from the database? This action is PERMANENT and cannot be undone.')) {
      try {
        await deleteAccount();
        alert('Your account and all associated data have been permanently deleted.');
        navigate('/', { replace: true });
      } catch (err) {
        alert('Failed to delete account: ' + err.message);
      }
    }
  };

  const handleCheckUpdates = () => {
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('latest');
    }, 1200);
  };

  return (
    <div className="page-container">
      {/* Page Header Row */}
      <PageHeaderRow title="Privacy & Settings" onSearch={setSearch} />

      {/* 1. Account Profile */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Account Profile</h3>
        <div className="grid-3" style={{ fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Name</span>
            <div style={{ fontWeight: '600', marginTop: '2px', fontSize: '14px', color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <div style={{ fontWeight: '600', marginTop: '2px', fontSize: '14px', color: 'var(--text-primary)' }}>{user?.email || 'user@daysync.ai'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>User ID</span>
            <div style={{ fontWeight: '600', marginTop: '2px', fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.id ? `USR-${user.id}` : 'USR-001'}</div>
          </div>
        </div>
      </div>

      {/* 2. Dashboard Widgets Controls */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-primary)" /> Dashboard Widgets
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
          Toggle which performance widgets display on your main Dashboard view.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-xs)' }}>
          {[
            { key: 'task', label: 'Task Performance' },
            { key: 'expense', label: 'Expense Performance' },
            { key: 'memory', label: 'Memory Performance' },
            { key: 'habit', label: 'Habit Tracker' },
            { key: 'progress', label: 'Progress & Summary' }
          ].map(w => (
            <div
              key={w.key}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {w.label}
              </span>
              <button
                type="button"
                onClick={() => toggleWidgetSetting(w.key)}
                className={widgetSettings[w.key] ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '4px 12px', minHeight: '30px', fontSize: '12px', minWidth: '55px' }}
              >
                {widgetSettings[w.key] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Appearance */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Appearance</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Theme</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Light mode is active by default for new users</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => theme !== 'light' && toggleTheme()}
              className={theme === 'light' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '13px', minHeight: '34px' }}
            >
              <Sun size={14} /> Light
            </button>
            <button
              type="button"
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '13px', minHeight: '34px' }}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>
      </div>

      {/* 4. Startup */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Startup</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Open with</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Select the page DaySync opens when you launch the application</div>
          </div>
          <select
            value={startupPage}
            onChange={handleStartupChange}
            style={{ width: '180px', minHeight: '38px', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="/app/dashboard">Dashboard</option>
            <option value="/app/chat">Chat</option>
            <option value="/app/expenses">Expenses</option>
            <option value="/app/task">Task</option>
            <option value="/app/habits">Habits</option>
            <option value="/app/memories">Memory</option>
            <option value="/app/summary">Summary</option>
          </select>
        </div>
      </div>

      {/* 5. Financial Settings */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Financial Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Starting Account Balance</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Single source of truth used to compute Total Balance across Dashboard and Expenses.
          </div>
          <form onSubmit={handleSaveStartingBalance} style={{ display: 'flex', gap: '8px', maxWidth: '380px', marginTop: '4px' }}>
            <input
              type="number"
              placeholder="e.g. 50000"
              min="0"
              step="any"
              value={startingBalanceInput}
              onChange={(e) => setStartingBalanceInput(e.target.value)}
              style={{ flex: 1, minHeight: '38px', fontSize: '13px', padding: '6px 12px' }}
            />
            <button type="submit" className="btn-primary" style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px' }}>
              Save
            </button>
          </form>
        </div>
      </div>

      {/* 6. Data & Privacy */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Data & Privacy</h3>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button onClick={handleExportData} className="btn-secondary" style={{ fontSize: '13px' }}>
            <Download size={15} /> Export Data
          </button>
          <button onClick={handleClearHistory} className="btn-secondary" style={{ color: 'var(--accent-warning)', fontSize: '13px' }}>
            <Trash2 size={15} /> Clear Chat History
          </button>
        </div>
      </div>

      {/* 6. Account */}
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

      {/* 7. About DaySync */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>About DaySync</h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Current version: {currentVersion || pkg.version || '1.1.1'}
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
                Version {latestVersion} is available.
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
                ? 'Unable to check for updates'
                : hasCheckedManually
                ? "You're using the latest version"
                : 'Check for Updates →'}
            </button>
          )}

          <button
            onClick={() => setShowContactInfo(true)}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Mail size={14} /> Contact Developer →
          </button>
        </div>

        {showContactInfo && (
          <div style={{
            marginTop: 'var(--space-md)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <strong>Developer Support:</strong> Reach out for feature inquiries or technical assistance.
            </div>
            <a
              href="mailto:support@daysync.ai"
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '12px', minHeight: '32px', textDecoration: 'none' }}
            >
              Email Developer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
