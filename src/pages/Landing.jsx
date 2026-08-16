import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, LogIn as LogInIcon } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Hero Header */}
      <header style={{
        padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>DaySync</span>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => navigate('/login')} className="btn-secondary">Log In</button>
        </div>
      </header>

      {/* Hero Main Section */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px',
          background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--border-glow)',
          fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '24px'
        }}>
          <Sparkles size={16} /> Powered by Luna AI Companion
        </div>

        <h1 style={{ fontSize: '3.8rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '20px', letterSpacing: '-1.5px' }}>
          DaySync — Your Smart Life Companion
        </h1>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Organize your everyday life effortlessly. DaySync brings together task tracking, expense management, and AI memory context in one seamless application.
        </p>

        {/* Main CTA Buttons: Log In & Sign Up */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '14px 36px', fontSize: '1.05rem' }}>
            <LogInIcon size={18} /> Log In
          </button>
          <button onClick={() => navigate('/signup')} className="btn-secondary" style={{ padding: '14px 36px', fontSize: '1.05rem' }}>
            <UserPlus size={18} /> Sign Up
          </button>
        </div>
      </main>
    </div>
  );
}
