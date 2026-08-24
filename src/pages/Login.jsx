import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStartupRoute } from '../App';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (userNotFound) setUserNotFound(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail && !cleanPassword) {
      setError('Please enter your email and password.');
      return;
    }

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setUserNotFound(false);
    setLoading(true);

    try {
      await login(cleanEmail, password);
      navigate(getStartupRoute(), { replace: true });
    } catch (err) {
      if (!navigator.onLine || err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
        setError('Unable to connect right now. Please check your internet connection and try again.');
      } else if (err.status === 404 || (err.message && (err.message.includes('Account does not exist') || err.message.includes('No user found')))) {
        setError('No account found with this email. Please sign up first.');
        setUserNotFound(true);
      } else if (err.status === 401 || (err.message && (err.message.includes('Incorrect password') || err.message.includes('Invalid password')))) {
        setError('Incorrect password. Please check your password and try again.');
      } else if (err.status === 429) {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.status >= 500) {
        setError('Something went wrong on our side. Please try again.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials and try again.');
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/icons/icon-192.png"
            alt="DaySync Logo"
            className="daysync-login-logo"
          />
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700' }}>Log In to DaySync</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Welcome back!</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)',
            fontSize: '0.86rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>{error}</span>
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
              onChange={handleEmailChange}
              placeholder="john@gmail.com"
              noValidate
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '8px', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Logging in...' : 'Log In'} {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <span onClick={() => navigate('/signup')} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}>Sign Up</span>
        </div>
      </div>
    </div>
  );
}
