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
    <div style={{ padding: '28px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Privacy & Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          You stay in 100% control of your personal data, memories, and AI interaction history.
        </p>
      </div>

      {/* Account Info */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Account Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Name</span>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>{user?.name || 'User'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <div style={{ fontWeight: '600', marginTop: '2px' }}>{user?.email || 'user@example.com'}</div>
          </div>
        </div>
      </div>

      {/* AI Memory & Privacy Toggles */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck color="var(--accent-success)" /> AI Privacy & Controls
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: '600' }}>Memory Extraction</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allow Luna to prompt for implicit memory confirmation</div>
            </div>
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: '600' }}>Proactive Personalization</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allow Luna Notices & personalized suggestions</div>
            </div>
            <input
              type="checkbox"
              checked={personalizationEnabled}
              onChange={(e) => setPersonalizationEnabled(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Data Management & Permanent Deletion */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Data Management & Account Control</h3>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={handleClearHistory} className="btn-secondary" style={{ color: 'var(--accent-warning)' }}>
            <Trash2 size={16} /> Clear Chat History
          </button>

          <button onClick={handleLogout} className="btn-secondary">
            <LogOut size={16} /> Log Out
          </button>

          <button
            onClick={handleDeleteAccount}
            className="btn-secondary"
            style={{ color: 'var(--accent-danger)', border: '1px solid var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <UserX size={16} /> Delete My Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
