import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, AlertCircle, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getStartupRoute } from '../App';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export function Signup() {
  const navigate = useNavigate();
  const { signup, setSession } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Status & Feedback State
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [loading, setLoading] = useState(false);

  // Resend Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isOtpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpStep, resendTimer]);

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

  // Step 1: Submit Initial Signup Form
  const handleSubmitSignup = async (e) => {
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
      const res = await signup(cleanName, cleanEmail, password);
      if (res && res.requiresVerification) {
        setIsOtpStep(true);
        setResendTimer(45);
        setCanResend(false);
        setInfoMessage(`We sent a 6-digit verification code to ${cleanEmail}`);
      } else {
        navigate('/onboarding', { replace: true });
      }
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

  // Step 2: Submit OTP Verification Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.verifyVerificationOtp({
        email: email.trim(),
        otp: cleanOtp
      });

      if (res && res.token && res.user) {
        setSession(res.token, res.user);
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await api.sendVerificationOtp(email.trim());
      setInfoMessage(res.message || `Verification code sent to ${email.trim()}`);
      setResendTimer(45);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Could not resend verification code.');
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
            <h2 style={{ fontSize: '1.3rem' }}>
              {isOtpStep ? 'Verify Your Email' : 'Create DaySync Account'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isOtpStep ? 'Security verification step' : 'Smart Life Companion with Luna AI'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Info Banner */}
        {infoMessage && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px', background: 'rgba(0, 229, 195, 0.12)',
            border: '1px solid var(--accent-success)', color: 'var(--text-primary)',
            fontSize: '0.84rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle2 size={16} color="var(--accent-success)" style={{ flexShrink: 0 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* SCREEN 1: SIGNUP FORM */}
        {!isOtpStep ? (
          <form onSubmit={handleSubmitSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

            {/* Create Password with Eye Toggle */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Create Password</label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 40px 11px 11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password with Eye Toggle */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Confirm Password</label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 40px 11px 11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
        ) : (
          /* SCREEN 2: OTP VERIFICATION FORM */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              We sent a 6-digit code to:<br />
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (error) setError('');
                }}
                placeholder="123456"
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px',
                  fontSize: '1.25rem', letterSpacing: '4px', textAlign: 'center', fontWeight: '700'
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem', opacity: (loading || otp.length !== 6) ? 0.7 : 1 }}
            >
              {loading ? 'Verifying...' : 'Verify Code'} {!loading && <CheckCircle2 size={16} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                style={{
                  background: 'transparent', border: 'none', color: canResend ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: canResend ? 'pointer' : 'default', fontWeight: '600', padding: 0
                }}
              >
                {canResend ? 'Resend Code' : `Resend code in ${resendTimer}s`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setError('');
                  setInfoMessage('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}>Log In</span>
        </div>
      </div>
    </div>
  );
}
