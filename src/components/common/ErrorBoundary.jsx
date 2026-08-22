import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DaySync Uncaught React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          <div className="glass-card animate-fade-in" style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            padding: '32px 24px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-highlight)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-pink-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <AlertTriangle size={28} color="var(--color-pink)" />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Something went wrong.
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: '1.45' }}>
              DaySync encountered an unexpected error. Please reload the application to continue.
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px 18px',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} /> Reload DaySync
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
