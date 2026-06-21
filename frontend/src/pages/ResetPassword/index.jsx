import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

/* ─── Shared style tokens ──────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .rp-root * { box-sizing: border-box; }

  .rp-input {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px 12px 42px;
    font-size: 14px;
    color: #1e293b;
    outline: none;
    background: #fafbff;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .rp-input::placeholder { color: #94a3b8; font-size: 13.5px; }
  .rp-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.13);
    background: white;
  }

  .rp-btn {
    width: 100%;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px;
    font-size: 15.5px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 18px rgba(99,102,241,0.35);
    letter-spacing: 0.01em;
  }
  .rp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,0.42); }
  .rp-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  @keyframes rp-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rp-card { animation: rp-fadeUp 0.35s ease forwards; }

  .pw-strength-bar {
    height: 4px;
    border-radius: 4px;
    transition: width 0.3s ease, background 0.3s ease;
  }
`;

/* ─── Helpers ──────────────────────────────────────────────────── */
const IconHexagon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L29.86 9.5V24.5L16 32L2.14 24.5V9.5L16 2Z" fill="#6366f1" opacity="0.2"/>
    <path d="M16 5L26.39 11V23L16 29L5.61 23V11L16 5Z" fill="#6366f1"/>
    <path d="M16 9L22.93 13V19L16 23L9.07 19V13L16 9Z" fill="white"/>
  </svg>
);

const PasswordStrength = ({ password }) => {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'Too short', color: '#ef4444', width: '15%' },
    { label: 'Weak',      color: '#f97316', width: '35%' },
    { label: 'Fair',      color: '#eab308', width: '60%' },
    { label: 'Good',      color: '#22c55e', width: '80%' },
    { label: 'Strong',    color: '#16a34a', width: '100%' },
  ];

  if (!password) return null;
  const level = levels[score] || levels[0];

  return (
    <div style={{ marginTop: 6, marginBottom: 2 }}>
      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div className="pw-strength-bar" style={{ width: level.width, background: level.color }} />
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: level.color, fontWeight: 600 }}>{level.label}</p>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────── */
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken]             = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showCpw, setShowCpw]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [status, setStatus]           = useState('idle'); // 'idle' | 'invalid_link' | 'success'

  /* Read token from URL once on mount */
  useEffect(() => {
    const t = searchParams.get('token');
    if (!t) {
      setStatus('invalid_link');
    } else {
      setToken(t);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('http://localhost:8000/api/users/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        setError(data.detail || 'Reset failed. The link may have expired — please request a new one.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Invalid / missing token ── */
  if (status === 'invalid_link') return (
    <>
      <style>{STYLES}</style>
      <PageShell>
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <AlertCircle size={34} color="#f97316" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#1e1b4b' }}>Invalid Reset Link</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            This link is missing a reset token. Please go back to the login page and request a new password reset link.
          </p>
          <button
            className="rp-btn"
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </button>
        </div>
      </PageShell>
    </>
  );

  /* ── Success ── */
  if (status === 'success') return (
    <>
      <style>{STYLES}</style>
      <PageShell>
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <CheckCircle2 size={36} color="#22c55e" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#1e1b4b' }}>Password Reset!</h2>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Your password has been updated successfully.
          </p>
          <p style={{ margin: '0 0 28px', fontSize: 13.5, color: '#94a3b8' }}>
            You can now sign in with your new password.
          </p>
          <button
            className="rp-btn"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </button>
        </div>
      </PageShell>
    </>
  );

  /* ── Main form ── */
  return (
    <>
      <style>{STYLES}</style>
      <PageShell>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={26} color="#6366f1" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
            Create New Password
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
            Choose a strong password for your account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0, marginTop: 5 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={15} color="#94a3b8" />
              </span>
              <input
                className="rp-input"
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                style={{ paddingRight: 42 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={15} color="#94a3b8" />
              </span>
              <input
                className="rp-input"
                type={showCpw ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Confirm your new password"
                required
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowCpw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
              >
                {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Match indicator */}
            {confirmPw && (
              <p style={{ margin: '5px 0 0', fontSize: 12, fontWeight: 600, color: newPassword === confirmPw ? '#22c55e' : '#ef4444' }}>
                {newPassword === confirmPw ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button type="submit" className="rp-btn" disabled={loading}>
            {loading ? 'Resetting Password…' : 'Reset Password'}
          </button>
        </form>

        {/* Back to login */}
        <button
          onClick={() => navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '20px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: 13.5, padding: 0, fontFamily: 'Inter, sans-serif' }}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </PageShell>
    </>
  );
};

/* ─── Page shell (centered card layout) ────────────────────────── */
const PageShell = ({ children }) => (
  <div
    className="rp-root"
    style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #e0e7ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}
  >
    {/* Decorative blobs */}
    <div style={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
    <div style={{ position: 'fixed', bottom: -60, left: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

    <div
      className="rp-card"
      style={{
        background: 'white',
        borderRadius: 24,
        padding: '44px 40px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 20px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28, justifyContent: 'center' }}>
        <IconHexagon />
        <span style={{ fontSize: 17, fontWeight: 800, color: '#1e1b4b' }}>ResearchHub</span>
      </div>

      {children}
    </div>
  </div>
);

export default ResetPassword;
