import React from 'react';
import { AlertTriangle, LogOut, Trash2, X, RefreshCw } from 'lucide-react';

export function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  isDanger = false, 
  isLoading = false,
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '28px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: isDanger ? 'rgba(255, 77, 106, 0.12)' : 'var(--color-primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: isDanger ? 'var(--accent-danger)' : 'var(--color-primary)'
          }}
        >
          {isDanger ? <AlertTriangle size={24} /> : <LogOut size={24} />}
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {title}
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: '1.45' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary"
            style={{ padding: '8px 20px', fontSize: '0.88rem', minHeight: '38px', flex: 1 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={isDanger ? 'btn-primary' : 'btn-primary'}
            style={{
              padding: '8px 20px',
              fontSize: '0.88rem',
              minHeight: '38px',
              flex: 1,
              background: isDanger ? 'var(--accent-danger)' : 'var(--accent-primary)',
              borderColor: isDanger ? 'var(--accent-danger)' : 'var(--accent-primary)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
