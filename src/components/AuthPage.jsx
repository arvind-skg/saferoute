import React, { useState, useRef } from 'react';
import { Navigation, User, Lock, Mail, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { apiSignUp, apiSignIn, apiGoogleLogin } from '../services/apiService';

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('signin');
  const [step, setStep] = useState('form');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingUser, setPendingUser] = useState(null);
  const otpRefs = useRef([]);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (tab === 'signup') {
        result = await apiSignUp(name, username, password);
      } else {
        result = await apiSignIn(username, password);
      }
      setPendingUser(result.user);
      setStep('otp');
      setSuccess('OTP sent to your registered email/phone');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    // Accept any 6-digit OTP for demo
    setTimeout(() => {
      setLoading(false);
      if (pendingUser) {
        const userData = {
          ...pendingUser,
          loggedIn: true,
          loginTime: Date.now(),
        };
        localStorage.setItem('saferoute_user', JSON.stringify(userData));
        onLogin(userData);
      }
    }, 800);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiGoogleLogin();
      const userData = {
        ...result.user,
        loggedIn: true,
        loginTime: Date.now(),
        isGoogle: true,
      };
      localStorage.setItem('saferoute_user', JSON.stringify(userData));
      onLogin(userData);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const resetToForm = () => {
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="logo-icon">
              <Navigation size={30} color="white" />
            </div>
            <h1>SafeRoute</h1>
            <p>Smart Navigation · Safer Journeys</p>
          </div>

          {step === 'form' ? (
            <>
              <div className="auth-tabs">
                <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
                  onClick={() => { setTab('signin'); setError(''); }}>Sign In</button>
                <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                  onClick={() => { setTab('signup'); setError(''); }}>Sign Up</button>
              </div>

              <form className="auth-form" onSubmit={handleSubmitForm}>
                {tab === 'signup' && (
                  <div className="auth-input-group">
                    <label>Full Name</label>
                    <User size={16} className="auth-input-icon" />
                    <input className="auth-input" type="text" placeholder="John Doe"
                      value={name} onChange={e => setName(e.target.value)} id="auth-name" />
                  </div>
                )}
                <div className="auth-input-group">
                  <label>Username</label>
                  <Mail size={16} className="auth-input-icon" />
                  <input className="auth-input" type="text" placeholder="username"
                    value={username} onChange={e => setUsername(e.target.value)} id="auth-username" />
                </div>
                <div className="auth-input-group">
                  <label>Password</label>
                  <Lock size={16} className="auth-input-icon" />
                  <input className="auth-input" type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} id="auth-password"
                    style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
                  {loading ? <div className="loading-spinner" /> : (
                    <>{tab === 'signin' ? 'Sign In' : 'Create Account'}<ArrowRight size={18} /></>
                  )}
                </button>
              </form>
              <div className="auth-divider">or continue with</div>
              <button className="auth-btn auth-btn-google" onClick={handleGoogleLogin} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🔐</div>
                <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                  Verify Your Identity</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                  Enter the 6-digit code (use 123456 for demo)</p>
              </div>
              {success && <div className="auth-success">{success}</div>}
              <div className="otp-inputs">
                {otp.map((digit, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el} className="otp-input"
                    type="text" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)} id={`otp-${i}`} />
                ))}
              </div>
              {error && <div className="auth-error">{error}</div>}
              <div className="otp-resend">
                Didn't receive? <button onClick={() => setSuccess('OTP resent!')}>Resend OTP</button>
              </div>
              <button className="auth-btn auth-btn-primary" onClick={handleVerifyOtp}
                disabled={loading} style={{ marginTop: 'var(--space-lg)' }}>
                {loading ? <div className="loading-spinner" /> : (<><Shield size={18} />Verify & Continue</>)}
              </button>
              <button className="auth-btn auth-btn-google" onClick={resetToForm}
                style={{ marginTop: 'var(--space-sm)' }}>
                ← Back to {tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
