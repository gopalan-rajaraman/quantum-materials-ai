import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { apiPost } from '../../config/api';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { IconLock, IconEye, IconEyeOff } from '../../components/auth/AuthField';

const PasswordStrength = ({ password }) => {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'Too short', color: '#ef4444', width: '15%' },
    { label: 'Weak', color: '#f97316', width: '35%' },
    { label: 'Fair', color: '#eab308', width: '60%' },
    { label: 'Good', color: '#22c55e', width: '80%' },
    { label: 'Strong', color: '#16a34a', width: '100%' },
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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');

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
      await apiPost('/api/users/reset-password', { token, new_password: newPassword });
      setStatus('success');
    } catch (err) {
      console.error('[ResetPassword] Request failed:', err);
      setError(err.message || 'Reset failed. The link may have expired — please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'invalid_link') {
    return (
      <AuthLayout>
        <div className="form-panel" style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <AlertCircle size={34} color="#f97316" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#1e1b4b' }}>Invalid Reset Link</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            This link is missing a reset token. Please go back to the login page and request a new password reset link.
          </p>
          <button type="button" className="action-btn" onClick={() => navigate('/login')}>
            Back to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout>
        <div className="form-panel" style={{ textAlign: 'center', padding: '10px 0 20px' }}>
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
          <button type="button" className="action-btn" onClick={() => navigate('/login')}>
            Go to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="form-panel">
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: 13.5, padding: 0, marginBottom: 20 }}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Lock size={26} color="#6366f1" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>
            Create New Password
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
            Choose a strong password for your account.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13.5, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0, marginTop: 5 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <AuthField label="Reset Password" icon={<IconLock />}>
            <input
              className="su-input"
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              style={{ paddingRight: 40 }}
              autoFocus
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              {showPw ? <IconEyeOff /> : <IconEye />}
            </button>
          </AuthField>
          <PasswordStrength password={newPassword} />

          <AuthField label="Confirm Password" icon={<IconLock />} mb={18}>
            <input
              className="su-input"
              type={showCpw ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Confirm your new password"
              required
              style={{ paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowCpw(v => !v)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              {showCpw ? <IconEyeOff /> : <IconEye />}
            </button>
            {confirmPw && (
              <p style={{ margin: '5px 0 0', fontSize: 12, fontWeight: 600, color: newPassword === confirmPw ? '#22c55e' : '#ef4444' }}>
                {newPassword === confirmPw ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </AuthField>

          <button type="submit" className="action-btn" disabled={loading}>
            {loading ? 'Resetting Password…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
