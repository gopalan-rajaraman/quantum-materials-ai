import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { apiPost } from '../../config/api';
import { saveAuth } from '../../utils/auth';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import ContinueWithGoogle from '../../components/auth/ContinueWithGoogle';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../../components/auth/AuthField';
 
/* ─── Icons ─────────────────────────────────────────────────── */
const Ico = ({ d, size=15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const IconUser    = () => <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>;
const IconGrad    = () => <Ico d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/>;
const IconBuild   = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </svg>
);
const IconBrief   = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconChevron = () => <Ico d="M6 9l6 6 6-6" size={13}/>;
 
/* ─── Sign Up Form ───────────────────────────────────────────── */
const SignUpForm = () => {
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [agreed, setAgreed]   = useState(false);
  const [formData, setFormData] = useState({
    fullName:'', email:'', department:'', institute:'', role:'', password:'', confirmPassword:'',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
 
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const data = await apiPost('/api/users/register', {
        full_name: formData.fullName,
        email: formData.email,
        department: formData.department,
        institute: formData.institute,
        role: formData.role,
        password: formData.password,
      });
      saveAuth(data);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };
 
  if (success) return (
    <div style={{ textAlign:'center', padding:'40px 0' }}>
      <div style={{ width:70, height:70, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <CheckCircle2 size={34} color="#22c55e"/>
      </div>
      <h3 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#1e1b4b' }}>Registration Successful!</h3>
      <p style={{ margin:'0 0 16px', fontSize:13.5, color:'#6b7280', lineHeight:1.6 }}>A verification email has been sent. Please verify your account.</p>
      <div style={{ background:'#eef2ff', color:'#6366f1', padding:'10px', borderRadius:8, fontSize:13.5, fontWeight:600 }}>Redirecting…</div>
    </div>
  );
 
  return (
    <form onSubmit={handleSubmit} className="form-panel">
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:8, fontSize:13.5, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#dc2626', flexShrink:0 }}/>
          <div style={{ flex: 1 }}>{error}</div>
          {error.includes("already registered") && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                padding: '6px 10px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Go to Login
            </button>
          )}
        </div>
      )}
      
      <ContinueWithGoogle onError={setError} isSignup={true} />

      <div className="auth-divider"><span>OR</span></div>

      <AuthField label="Full Name" icon={<IconUser/>}>
        <input className="su-input" type="text" name="fullName" value={formData.fullName} onChange={onChange} placeholder="Enter your full name" required/>
      </AuthField>
      <AuthField label="Email Address" icon={<IconMail/>}>
        <input className="su-input" type="email" name="email" value={formData.email} onChange={onChange} placeholder="Enter your email address" required/>
      </AuthField>
      <AuthField label="Department" icon={<IconGrad/>}>
        <input className="su-input" type="text" name="department" value={formData.department} onChange={onChange} placeholder="e.g., Materials Science, Physics" required/>
      </AuthField>
      <AuthField label="Institute Name" icon={<IconBuild/>}>
        <input className="su-input" type="text" name="institute" value={formData.institute} onChange={onChange} placeholder="e.g., IIT Bombay, MIT" required/>
      </AuthField>
      <AuthField label="Role" icon={<IconBrief/>}>
        <select className="su-select" name="role" value={formData.role} onChange={onChange} required>
          <option value="" disabled>Select your role</option>
          <option value="student">Student</option>
          <option value="researcher">Researcher</option>
          <option value="professor">Professor</option>
          <option value="postdoc">Postdoctoral Fellow</option>
          <option value="industry">Industry Professional</option>
          <option value="other">Other</option>
        </select>
        <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><IconChevron/></span>
      </AuthField>
      <AuthField label="Password" icon={<IconLock/>}>
        <input className="su-input" type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="Create a password" required style={{ paddingRight:40 }}/>
        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {showPw ? <IconEyeOff/> : <IconEye/>}
        </button>
      </AuthField>
      <AuthField label="Confirm Password" icon={<IconLock/>} mb={10}>
        <input className="su-input" type={showCpw ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={onChange} placeholder="Confirm your password" required style={{ paddingRight:40 }}/>
        <button type="button" onClick={() => setShowCpw(!showCpw)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {showCpw ? <IconEyeOff/> : <IconEye/>}
        </button>
      </AuthField>
 
      <div style={{ display:'flex', alignItems:'flex-start', gap:8, margin:'10px 0 14px' }}>
        <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:3, accentColor:'#6366f1', flexShrink:0 }} required/>
        <label htmlFor="terms" style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>
          I agree to the <span style={{ color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Terms of Service</span> and <span style={{ color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Privacy Policy</span>
        </label>
      </div>
 
      <button type="submit" className="action-btn" disabled={loading || !agreed}>
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>
 
    </form>
  );
};
 
/* ─── Forgot Password Panel ─────────────────────────────────── */
const ForgotPasswordPanel = ({ onBack }) => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const handleRequest = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiPost('/api/users/forgot-password', { email: email.trim() });
      setStep('sent');
    } catch (err) {
      console.error('[ForgotPassword] Request failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  if (step === 'sent') return (
    <div className="form-panel">
      <button
        type="button"
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: 13.5, padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back to Sign In
      </button>
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <CheckCircle2 size={34} color="#22c55e" />
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 21, fontWeight: 800, color: '#1e1b4b' }}>Check your inbox</h2>
        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
          We sent a reset link to
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 14.5, fontWeight: 700, color: '#6366f1' }}>{email}</p>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
          Click the link in the email to set your new password. The link expires in&nbsp;1&nbsp;hour.
        </p>
        <button type="button" className="action-btn" onClick={onBack}>Done</button>
        <p style={{ marginTop: 14, fontSize: 13, color: '#94a3b8' }}>
          Didn't receive it?{' '}
          <span onClick={() => setStep('request')} style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Try again</span>
        </p>
      </div>
    </div>
  );
 
  return (
    <div className="form-panel">
      <button
        type="button"
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: 13.5, padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back to Sign In
      </button>
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Mail size={26} color="#6366f1" />
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>Forgot your password?</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</p>
      </div>
      <form onSubmit={handleRequest}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13.5, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />{error}
          </div>
        )}
        <AuthField label="Email Address" icon={<IconMail />}>
          <input className="su-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email address" required autoFocus />
        </AuthField>
        <button type="submit" className="action-btn" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};
 
/* ─── Sign In Form ───────────────────────────────────────────── */
const SignInForm = () => {
  const [showPw, setShowPw]           = useState(false);
  const [formData, setFormData]       = useState({ email:'', password:'', rememberMe: false });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showForgot, setShowForgot]   = useState(false);
  const navigate = useNavigate();
 
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      const data = await apiPost('/api/users/login', {
        email: formData.email,
        password: formData.password,
        remember_me: formData.rememberMe,
      });
      saveAuth(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };
 
  if (showForgot) {
    return <ForgotPasswordPanel onBack={() => setShowForgot(false)} />;
  }
 
  return (
    <form onSubmit={handleSubmit} className="form-panel">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:800, color:'#1e1b4b', letterSpacing:'-0.02em' }}>Welcome back</h2>
        <p style={{ margin:0, fontSize:14, color:'#94a3b8' }}>Sign in to continue your research journey.</p>
      </div>
 
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:8, fontSize:13.5, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#dc2626', flexShrink:0 }}/>{error}
        </div>
      )}

      <ContinueWithGoogle onError={setError} rememberMe={formData.rememberMe} />

      <div className="auth-divider"><span>OR</span></div>

      <AuthField label="Email Address" icon={<IconMail/>}>
        <input className="su-input" type="email" name="email" value={formData.email} onChange={onChange} placeholder="Enter your email address" required/>
      </AuthField>
      <AuthField label="Password" icon={<IconLock/>} mb={8}>
        <input className="su-input" type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="Enter your password" required style={{ paddingRight:40 }}/>
        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {showPw ? <IconEyeOff/> : <IconEye/>}
        </button>
      </AuthField>
 
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:13.5, color:'#64748b', cursor:'pointer' }}>
          <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={e => setFormData({...formData, rememberMe: e.target.checked})} style={{ accentColor:'#6366f1' }}/> Remember me
        </label>
        <span
          style={{ fontSize:13.5, color:'#6366f1', fontWeight:600, cursor:'pointer' }}
          onClick={() => setShowForgot(true)}
        >Forgot password?</span>
      </div>
 
      <button type="submit" className="action-btn" disabled={loading}>
        {loading ? 'Signing In…' : 'Sign In'}
      </button>
    </form>
  );
};
 
/* ─── Main Component ─────────────────────────────────────────── */
const AuthPage = () => {
  const location = useLocation();
  const tab = location.pathname.includes('/login') ? 'signin' : 'signup';
  const navigate = useNavigate();
 
  return (
    <AuthLayout
      footer={
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: '#94a3b8' }}>
          {tab === 'signup'
            ? <>Already have an account?{' '}<span onClick={() => navigate('/login')} style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Sign in</span></>
            : <>Don't have an account?{' '}<span onClick={() => navigate('/signup')} style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Sign up</span></>
          }
        </p>
      }
    >
      {tab === 'signup' && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>Create your account</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Start your research journey with us.</p>
        </div>
      )}
 
      {tab === 'signup' ? <SignUpForm /> : <SignInForm />}
    </AuthLayout>
  );
};
 
export default AuthPage;