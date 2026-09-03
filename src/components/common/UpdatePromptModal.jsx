import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { usePWAUpdate } from '../../context/PWAUpdateContext';

export function UpdatePromptModal() {
  const { 
    showUpdatePrompt, 
    latestVersion, 
    getReleaseHighlights, 
    applyUpdate, 
    dismissUpdate,
    downloadStatus,
    downloadProgress,
    downloadError
  } = usePWAUpdate();

  if (!showUpdatePrompt) return null;

  const highlights = getReleaseHighlights(latestVersion);
  const isDownloading = downloadStatus === 'downloading';
  const isError = downloadStatus === 'error';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-prompt-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.45)',
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
          maxWidth: '460px',
          width: '100%',
          padding: '24px 22px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
          transform: 'scale(1)',
          transition: 'transform 220ms ease, opacity 220ms ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              <RefreshCw size={20} className={isDownloading ? "animate-spin" : ""} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                DAYSYNC UPDATE AVAILABLE
              </span>
              <h3 id="update-prompt-title" style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: '700' }}>
                DaySync v{latestVersion} is ready
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dismissUpdate(latestVersion)}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {isDownloading && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              <span>Downloading update APK...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--border-muted)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${downloadProgress}%`,
                  height: '100%',
                  background: 'var(--color-primary)',
                  transition: 'width 200ms ease'
                }}
              />
            </div>
          </div>
        )}

        {isError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}
          >
            {downloadError || 'Failed to download update APK. Please try again.'}
          </div>
        )}

        {!isDownloading && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              What's new
            </h4>
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}
            >
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {highlights.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: '1.4'
                    }}
                  >
                    <span style={{ color: 'var(--color-primary)', fontWeight: '700', flexShrink: 0 }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => dismissUpdate(latestVersion)}
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '0.88rem', minHeight: '38px' }}
          >
            Later
          </button>
          <button
            type="button"
            onClick={applyUpdate}
            disabled={isDownloading}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.88rem', minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: isDownloading ? 0.7 : 1 }}
          >
            <Sparkles size={16} /> {isError ? 'Retry Download' : isDownloading ? `Downloading (${downloadProgress}%)` : 'Update Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
