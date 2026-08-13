import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Trash2, LogOut, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export function SettingsPage() {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
      await api.clearHistory();
      alert('Chat history cleared.');
    }
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
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <h1>Privacy & Settings</h1>
        <p>
          Manage your account profile, privacy controls, and data history.
        </p>
      </div>

      {/* Account Info */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>Account Profile</h3>
        <div className="mobile-grid-2" style={{ fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Name</span>
            <div style={{ fontWeight: '600', marginTop: '2px', fontSize: '14px' }}>{user?.name || 'User'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <div style={{ fontWeight: '600', marginTop: '2px', fontSize: '14px' }}>{user?.email || 'user@example.com'}</div>
          </div>
        </div>
      </div>

      {/* AI Memory & Privacy Toggles */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent-success)" /> AI Privacy & Controls
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Memory Extraction</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allow Luna AI to prompt for implicit memory confirmation</div>
            </div>
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)', minHeight: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Proactive Personalization</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allow DaySync Notices & personalized recommendations</div>
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

      {/* Data Management & Permanent Deletion */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>Data Management & Account Control</h3>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button onClick={handleClearHistory} className="btn-secondary" style={{ color: 'var(--accent-warning)', fontSize: '13px' }}>
            <Trash2 size={15} /> Clear Chat History
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '13px' }}>
            <LogOut size={15} /> Log Out
          </button>

          <button
            onClick={handleDeleteAccount}
            className="btn-secondary"
            style={{ color: 'var(--accent-danger)', border: '1px solid var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)', fontSize: '13px' }}
          >
            <UserX size={15} /> Delete Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
