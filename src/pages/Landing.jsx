import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, LogIn as LogInIcon } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* DESKTOP LANDING VIEW (Visible on Desktop >=769px) */}
      <div className="desktop-landing-view">
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

      {/* MOBILE LANDING VIEW (Visible on Mobile <=768px - Fits 100% in initial viewport without scrolling) */}
      <div className="mobile-landing-view" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 20px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* DaySync App Logo */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)', overflow: 'hidden'
        }}>
          <img src="/icons/icon-192.png" alt="DaySync Logo" style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover' }} />
        </div>

        {/* Powered by Luna AI Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px',
          background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--border-glow)',
          fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '14px'
        }}>
          <Sparkles size={13} /> Powered by Luna AI
        </div>

        {/* Title & Subtitle */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 2px 0', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
          DaySync
        </h1>
        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '12px' }}>
          Your Smart Life Companion
        </div>

        {/* Short 1-Line Description */}
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 0 24px 0', lineHeight: '1.45' }}>
          Organize your day, expenses and tasks with DaySync.
        </p>

        {/* CTA Buttons (Prominent, 100% visible on first screen without scrolling) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '320px' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
            style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '700', justifyContent: 'center', width: '100%' }}
          >
            <LogInIcon size={16} /> Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="btn-secondary"
            style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '700', justifyContent: 'center', width: '100%' }}
          >
            <UserPlus size={16} /> Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
