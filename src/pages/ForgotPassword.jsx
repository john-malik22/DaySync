import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export function ForgotPassword() {
  const navigate = useNavigate();

  // Step Mode: 'EMAIL', 'OTP', 'RESET', 'SUCCESS'
  const [step, setStep] = useState('EMAIL');

  // Input States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Resend Timer State
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Status & Feedback States
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Resend Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && resendTimer > 0) {
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
  }, [step, resendTimer]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  // STEP 1: Submit Email for Reset Code
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(cleanEmail);
      setInfoMessage(res.message || 'If an account exists for this email, a reset code has been sent.');
      setStep('OTP');
      setResendTimer(45);
      setCanResend(false);
    } catch (err) {
      if (!navigator.onLine) {
        setError('Unable to connect right now. Please check your internet connection.');
      } else {
        setError(err.message || 'Unable to process reset request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-Digit Reset OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit reset code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.verifyResetOtp({
        email: email.trim(),
        otp: cleanOtp
      });

      if (res && res.resetToken) {
        setResetToken(res.resetToken);
        setStep('RESET');
        setError('');
        setInfoMessage('Code verified successfully! Enter your new password below.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired reset code.');
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
      const res = await api.forgotPassword(email.trim());
      setInfoMessage(res.message || 'If an account exists for this email, a reset code has been sent.');
      setResendTimer(45);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Could not resend reset code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Save New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      setStep('SUCCESS');
    } catch (err) {
      setError(err.message || 'Could not reset password. Please try again.');
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
            <KeyRound size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem' }}>
              {step === 'EMAIL' && 'Forgot Password'}
              {step === 'OTP' && 'Password Reset Code'}
              {step === 'RESET' && 'Set New Password'}
              {step === 'SUCCESS' && 'Password Reset Complete'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {step === 'EMAIL' && 'Enter your email to receive a password reset code.'}
              {step === 'OTP' && `Enter 6-digit reset code sent to ${email}`}
              {step === 'RESET' && 'Choose a strong new password for your account.'}
              {step === 'SUCCESS' && 'Your account password has been updated.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)',
            fontSize: '0.86rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
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

        {/* STEP 1: REQUEST EMAIL FORM */}
        {step === 'EMAIL' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Email Address</label>
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
              style={{ justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending code...' : 'Send Reset Code'} {!loading && <ArrowRight size={16} />}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP FORM */}
        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                onClick={() => navigate('/login')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD FORM */}
        {step === 'RESET' && (
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

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 'SUCCESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem', width: '100%' }}
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
