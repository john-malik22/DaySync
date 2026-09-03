import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';
import { getRandomMemeReaction } from '../utils/memeReactions';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    // Suppress temporary action/activity success popups ('success' / 'info') while preserving 'error' and 'meme' toasts
    if (type === 'success' || type === 'info') return;

    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const showMemeReaction = useCallback((category, customMsg) => {
    const text = customMsg || getRandomMemeReaction(category);
    showToast(text, 'meme');
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showMemeReaction, removeToast }}>
      {children}
      <div
        className="daysync-toast-container"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => {
          const isMeme = toast.type === 'meme';
          return (
            <div
              key={toast.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: isMeme ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))' : 'var(--bg-card)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: isMeme ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-highlight)',
                boxShadow: isMeme ? '0 8px 24px rgba(168, 85, 247, 0.2)' : 'var(--shadow-md)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: isMeme ? '700' : '500'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMeme && <Sparkles size={18} color="var(--accent-primary, #A855F7)" />}
                {toast.type === 'success' && <CheckCircle2 size={18} color="var(--color-primary)" />}
                {toast.type === 'error' && <AlertCircle size={18} color="var(--color-pink)" />}
                {toast.type === 'info' && <Info size={18} color="var(--color-aqua)" />}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
