import React from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { formatTimeAgo } from '../../services/clientCache';

export function StaleIndicator({ timestamp }) {
  if (!timestamp) return null;
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const prefix = isOffline ? 'Offline' : 'Server unreachable';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: 'var(--text-muted)',
        background: 'var(--bg-secondary)',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-color)',
        marginBottom: '8px'
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-amber)' }} />
      <span>{prefix} • Last synced {formatTimeAgo(timestamp)}</span>
    </div>
  );
}

export function ErrorState({ 
  title = 'Unable to load content right now.', 
  message = 'Please check your internet connection and try again.',
  onRetry, 
  isRetrying = false,
  compact = false 
}) {
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const isNetwork = isOffline || title.toLowerCase().includes('offline') || title.toLowerCase().includes('connect') || title.toLowerCase().includes('network');

  return (
    <div
      role="alert"
      aria-live="polite"
      className="glass-card animate-fade-in"
      style={{
        textAlign: 'center',
        padding: compact ? '20px 16px' : '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        margin: '12px 0'
      }}
    >
      <div
        style={{
          width: compact ? '40px' : '52px',
          height: compact ? '40px' : '52px',
          borderRadius: '50%',
          background: 'var(--color-pink-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-pink)'
        }}
      >
        {isNetwork ? <WifiOff size={compact ? 20 : 24} /> : <AlertCircle size={compact ? 20 : 24} />}
      </div>

      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: compact ? '0.9rem' : '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: compact ? '0.78rem' : '0.85rem', color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: '1.4' }}>
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="btn-primary"
          style={{
            padding: compact ? '6px 14px' : '8px 18px',
            fontSize: compact ? '0.8rem' : '0.88rem',
            minHeight: '34px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            opacity: isRetrying ? 0.7 : 1
          }}
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}
