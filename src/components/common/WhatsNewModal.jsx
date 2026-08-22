import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { usePWAUpdate as usePWAUpdateContext } from '../../context/PWAUpdateContext';

export function WhatsNewModal() {
  const { 
    showWhatsNewModal, 
    closeWhatsNewModal, 
    currentVersion, 
    getReleaseHighlights 
  } = usePWAUpdateContext();

  if (!showWhatsNewModal) return null;

  const highlights = getReleaseHighlights(currentVersion);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.48)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          maxWidth: '480px',
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
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--color-primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            color: 'var(--color-primary)'
          }}
        >
          <Sparkles size={26} />
        </div>

        <h2 id="whats-new-title" style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
          Welcome to DaySync {currentVersion} 🎉
        </h2>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 18px 0' }}>
          Here's what's new in this release:
        </p>

        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '20px',
            textAlign: 'left',
            border: '1px solid var(--border-color)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {highlights.map((item, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  lineHeight: '1.4'
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={closeWhatsNewModal}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '10px 20px',
            fontSize: '0.92rem',
            fontWeight: '700',
            minHeight: '42px'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
