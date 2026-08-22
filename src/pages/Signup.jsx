import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (error) setError('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (userExists) setUserExists(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName && !cleanEmail && !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!cleanName) {
      setError('Please enter your full name.');
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

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError('Please use a stronger password (at least 6 characters).');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setUserExists(false);
    setLoading(true);

    try {
      await signup(cleanName, cleanEmail, password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (!navigator.onLine || err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
        setError('Unable to connect right now. Please check your internet connection and try again.');
      } else if (err.status === 400 || (err.message && (err.message.includes('already exists') || err.message.includes('USER_EXISTS')))) {
        setError('An account with this email already exists. Please log in.');
        setUserExists(true);
      } else if (err.status >= 500) {
        setError('Something went wrong on our side. Please try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
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
            width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem' }}>Create DaySync Account</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Smart Life Companion with Luna AI</p>
          </div>
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

            {userExists && (
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{ marginTop: '6px', justifyContent: 'center', padding: '8px', fontSize: '0.82rem', background: 'var(--accent-primary)' }}
              >
                <LogIn size={14} /> Account Exists — Log In Instead
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="John Doe"
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
            />
          </div>

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
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Create Password</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
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
            {loading ? 'Creating account...' : 'Create Account'} {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}>Log In</span>
        </div>
      </div>
    </div>
  );
}
