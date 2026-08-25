import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getStartupRoute } from '../App';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export function Login() {
  const navigate = useNavigate();
  const { login, setSession } = useAuth();

  // Mode: 'LOGIN', 'VERIFY_SIGNUP_OTP', 'FORGOT_EMAIL', 'FORGOT_OTP', 'FORGOT_RESET'
  const [mode, setMode] = useState('LOGIN');

  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP States
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Reset Password States
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Resend Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if ((mode === 'VERIFY_SIGNUP_OTP' || mode === 'FORGOT_OTP') && resendTimer > 0) {
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
  }, [mode, resendTimer]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (userNotFound) setUserNotFound(false);
    if (requiresVerification) setRequiresVerification(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
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
    setRequiresVerification(false);
    setLoading(true);

    try {
      await login(cleanEmail, password);
      navigate(getStartupRoute(), { replace: true });
    } catch (err) {
      if (err.requiresVerification || err.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before continuing.');
        setRequiresVerification(true);
      } else if (!navigator.onLine || err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
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

  // Resend Signup Verification Code & Open Verification Screen
  const handleStartResendVerification = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.sendVerificationOtp(email.trim());
      setInfoMessage(res.message || `Verification code sent to ${email.trim()}`);
      setMode('VERIFY_SIGNUP_OTP');
      setResendTimer(45);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Signup OTP
  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyVerificationOtp({
        email: email.trim(),
        otp: otp.trim()
      });
      if (res && res.token && res.user) {
        setSession(res.token, res.user);
        navigate(getStartupRoute(), { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Request Email
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(cleanEmail);
      setInfoMessage(res.message || 'Verification code sent to your email.');
      setMode('FORGOT_OTP');
      setResendTimer(45);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Could not process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Verify OTP
  const handleForgotOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit reset code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyResetOtp({
        email: email.trim(),
        otp: otp.trim()
      });
      if (res && res.resetToken) {
        setResetToken(res.resetToken);
        setMode('FORGOT_RESET');
        setError('');
        setInfoMessage('Code verified! Enter your new password below.');
      }
    } catch (err) {
      setError(err.message || 'Invalid reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Save New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Please enter a password with at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.resetPassword({
        email: email.trim(),
        resetToken,
        newPassword
      });
      setInfoMessage(res.message || 'Password reset successfully! You can now log in.');
      setMode('LOGIN');
      setPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Could not reset password.');
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700' }}>
            {mode === 'LOGIN' && 'Log In to DaySync'}
            {mode === 'VERIFY_SIGNUP_OTP' && 'Verify Email Address'}
            {mode === 'FORGOT_EMAIL' && 'Forgot Password'}
            {mode === 'FORGOT_OTP' && 'Password Reset Code'}
            {mode === 'FORGOT_RESET' && 'Set New Password'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {mode === 'LOGIN' && 'Welcome back!'}
            {mode === 'VERIFY_SIGNUP_OTP' && `Enter 6-digit code sent to ${email}`}
            {mode === 'FORGOT_EMAIL' && 'Enter your email to receive a password reset code'}
            {mode === 'FORGOT_OTP' && `Enter 6-digit reset code sent to ${email}`}
            {mode === 'FORGOT_RESET' && 'Choose a strong new password for your account'}
          </p>
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

            {userNotFound && (
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary"
                style={{ marginTop: '6px', justifyContent: 'center', padding: '8px', fontSize: '0.82rem', background: 'var(--accent-primary)' }}
              >
                <UserPlus size={14} /> Account Not Found — Sign Up Now
              </button>
            )}

            {requiresVerification && (
              <button
                onClick={handleStartResendVerification}
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: '6px', justifyContent: 'center', padding: '8px', fontSize: '0.82rem', background: 'var(--accent-primary)' }}
              >
                <CheckCircle2 size={14} /> Resend Verification Code
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

        {/* MODE 1: LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}
                >
                  Forgot Password?
                </button>
              </div>

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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in...' : 'Log In'} {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* MODE 2: SIGNUP VERIFICATION OTP */}
        {mode === 'VERIFY_SIGNUP_OTP' && (
          <form onSubmit={handleVerifySignupOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              {loading ? 'Verifying...' : 'Verify Email'} {!loading && <CheckCircle2 size={16} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleStartResendVerification}
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
                  setMode('LOGIN');
                  setError('');
                  setInfoMessage('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD EMAIL */}
        {mode === 'FORGOT_EMAIL' && (
          <form onSubmit={handleForgotEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Your Email Address</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="john@gmail.com"
                noValidate
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', marginTop: '4px' }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending code...' : 'Send Reset Code'} {!loading && <KeyRound size={16} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError('');
                setInfoMessage('');
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* MODE 4: FORGOT PASSWORD OTP */}
        {mode === 'FORGOT_OTP' && (
          <form onSubmit={handleForgotOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>6-Digit Reset Code</label>
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
                onClick={handleForgotEmailSubmit}
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
                  setMode('LOGIN');
                  setError('');
                  setInfoMessage('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* MODE 5: FORGOT PASSWORD NEW PASSWORD */}
        {mode === 'FORGOT_RESET' && (
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>New Password</label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 40px 11px 11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                  }}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 6}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem', opacity: (loading || newPassword.length < 6) ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Set New Password'} {!loading && <CheckCircle2 size={16} />}
            </button>
          </form>
        )}

        {mode === 'LOGIN' && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <span onClick={() => navigate('/signup')} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}>Sign Up</span>
          </div>
        )}
      </div>
    </div>
  );
}
