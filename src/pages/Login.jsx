import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both Email Address and Password.');
      return;
    }
    setError('');
    setUserNotFound(false);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Login failed.';
      setError(errMsg);
      if (errMsg.includes('Account does not exist') || errMsg.includes('No user found')) {
        setUserNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '420px', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem' }}>Log In to DaySync</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Welcome back!</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)',
            fontSize: '0.86rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
              <AlertCircle size={16} /> {error}
            </div>

            {userNotFound && (
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary"
                style={{ marginTop: '6px', justifyContent: 'center', padding: '8px', fontSize: '0.82rem', background: 'var(--accent-primary)' }}
              >
                <UserPlus size={14} /> Account Not Found — Sign Up Now
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Address */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@gmail.com"
              required
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '8px', justifyContent: 'center', padding: '13px', fontSize: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Log In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <span onClick={() => navigate('/signup')} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}>Sign Up</span>
        </div>
      </div>
    </div>
  );
}
