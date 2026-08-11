import React, { useState } from 'react';
import { Sparkles, HelpCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NoticeBanner({ notice }) {
  const [showWhy, setShowWhy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (!notice || dismissed) return null;

  return (
    <div className="glass-card animate-fade-in" style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
      borderLeft: '4px solid var(--accent-primary)',
      padding: '16px 20px',
      marginBottom: '20px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                Luna noticed
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>• Pattern Detection</span>
            </div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {notice.title}
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {notice.content}
            </p>

            {showWhy && notice.why && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--accent-primary)' }}>Why Luna suggested this:</strong> {notice.why}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <button
                onClick={() => navigate('/app/chat')}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Discuss in Chat <ArrowRight size={14} />
              </button>
              
              <button
                onClick={() => setShowWhy(!showWhy)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <HelpCircle size={14} /> {showWhy ? 'Hide Explanation' : 'Why Luna suggested this?'}
              </button>
            </div>
          </div>
        </div>

        <X
          size={18}
          color="var(--text-muted)"
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setDismissed(true)}
        />
      </div>
    </div>
  );
}
