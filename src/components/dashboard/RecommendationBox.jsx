import React, { useState } from 'react';
import { Sparkles, HelpCircle, MessageSquare } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { useNavigate } from 'react-router-dom';

export function RecommendationBox() {
  const { suggestion } = useLuna();
  const navigate = useNavigate();
  const [showWhy, setShowWhy] = useState(true);

  if (!suggestion) return null;

  return (
    <div className="glass-card animate-fade-in" style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid var(--border-glow)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
          Personalized Suggestion
        </span>
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: '600', lineHeight: '1.4', marginBottom: '10px' }}>
        "{suggestion.recommendation}"
      </h3>

      {showWhy && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          fontSize: '0.86rem',
          color: 'var(--text-secondary)',
          marginBottom: '16px'
        }}>
          <strong style={{ color: 'var(--accent-primary)' }}>Why Luna suggested this?</strong>
          <br />
          {suggestion.why}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/app/chat')}
          className="btn-primary"
        >
          <MessageSquare size={16} /> Open Chat with Luna
        </button>

        <button
          onClick={() => setShowWhy(!showWhy)}
          className="btn-secondary"
          style={{ fontSize: '0.82rem' }}
        >
          <HelpCircle size={15} /> {showWhy ? 'Hide Reason' : 'Why this?'}
        </button>
      </div>
    </div>
  );
}
