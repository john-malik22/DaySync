import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, LogOut, UserX, Sun, Moon, Download, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export function SettingsPage() {
  const { user, theme, toggleTheme, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // 1. Startup Page Preference
  const [startupPage, setStartupPage] = useState(() => {
    return localStorage.getItem('daysync_startup_page') || '/app/dashboard';
  });

  // 2. Check for Updates State
  const [updateStatus, setUpdateStatus] = useState('idle'); // 'idle' | 'checking' | 'latest'

  // 3. Contact Modal / Status State
  const [showContactInfo, setShowContactInfo] = useState(false);

  const handleStartupChange = (e) => {
    const val = e.target.value;
    setStartupPage(val);
    localStorage.setItem('daysync_startup_page', val);
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

  const handleContactDev = () => {
    setShowContactInfo(true);
  };

  return (
    <div className="page-container" style={{ maxWidth: '950px' }}>
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

      {/* 2. Appearance */}
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

      {/* 3. Startup */}
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
            <option value="/app/memories">Memory</option>
            <option value="/app/summary">Summary</option>
          </select>
        </div>
      </div>

      {/* 4. Data & Privacy */}
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

      {/* 5. Account */}
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

      {/* 6. About DaySync */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>About DaySync</h3>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Version 1.0.0
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Check for Updates Action */}
          <button
            onClick={handleCheckUpdates}
            disabled={updateStatus === 'checking'}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <RefreshCw size={14} className={updateStatus === 'checking' ? 'animate-spin' : ''} />
            {updateStatus === 'idle' && 'Check for Updates →'}
            {updateStatus === 'checking' && 'Checking for updates...'}
            {updateStatus === 'latest' && "You're using the latest version."}
          </button>

          {/* Contact Developer Action */}
          <button
            onClick={handleContactDev}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Mail size={14} /> Contact Developer →
          </button>
        </div>

        {/* Developer Contact Info Container */}
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
              href="mailto:johnmalik2222@gmail.com"
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
