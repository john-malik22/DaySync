import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Trash2, LogOut, UserX, Sun, Moon, Info, Download } from 'lucide-react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export function SettingsPage() {
  const { user, theme, toggleTheme, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
      await api.clearHistory();
      alert('Chat history cleared.');
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user, exportedAt: new Date().toISOString() }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `daysync_user_data_${user?.id || 'export'}.json`);
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
        alert('Your account ID and all associated data have been permanently deleted from the database.');
        navigate('/', { replace: true });
      } catch (err) {
        alert('Failed to delete account: ' + err.message);
      }
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '950px' }}>
      {/* Top Header Row: Page Title on Left | Search on Right */}
      <PageHeaderRow title="Privacy & Settings" onSearch={setSearch} />

      {/* Section 1: Account Profile */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>Account Profile</h3>
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
            <div style={{ fontWeight: '600', marginTop: '2px', fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.id || 'USR-DAYSYNC-001'}</div>
          </div>
        </div>
      </div>

      {/* Section 2: Appearance */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>Appearance</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Theme Preference</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Light mode is active by default for all new users</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={theme === 'light' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '13px', minHeight: '34px' }}
            >
              <Sun size={14} /> Light
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '13px', minHeight: '34px' }}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Privacy Options */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent-primary)" /> Privacy Options
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Memory Extraction</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Allow Luna AI to prompt for implicit memory confirmation</div>
            </div>
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)', minHeight: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Proactive Personalization</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Allow DaySync Notices & personalized recommendations</div>
            </div>
            <input
              type="checkbox"
              checked={personalizationEnabled}
              onChange={(e) => setPersonalizationEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)', minHeight: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Data Management & Account */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--accent-primary)' }}>Data Management & Account</h3>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button onClick={handleExportData} className="btn-secondary" style={{ fontSize: '13px' }}>
            <Download size={15} /> Export Data
          </button>

          <button onClick={handleClearHistory} className="btn-secondary" style={{ color: 'var(--accent-warning)', fontSize: '13px' }}>
            <Trash2 size={15} /> Clear Chat History
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '13px' }}>
            <LogOut size={15} /> Log Out
          </button>

          <button
            onClick={handleDeleteAccount}
            className="btn-secondary"
            style={{ color: 'var(--accent-danger)', border: '1px solid var(--accent-danger)', background: 'rgba(200, 92, 92, 0.1)', fontSize: '13px' }}
          >
            <UserX size={15} /> Delete Account Permanently
          </button>
        </div>
      </div>

      {/* Section 5: About DaySync */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="var(--accent-primary)" /> About DaySync
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          DaySync v1.0.0 • AI-Powered Life Companion & Finance Manager.
        </p>
      </div>
    </div>
  );
}
