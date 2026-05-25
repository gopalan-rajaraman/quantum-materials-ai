import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/* ─── Styles ────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .signup-root * { box-sizing: border-box; }

  .su-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 11px 14px 11px 40px;
    font-size: 14px;
    color: #1e293b;
    outline: none;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-input::placeholder { color: #94a3b8; font-size: 13.5px; }
  .su-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .su-select {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 11px 14px 11px 40px;
    font-size: 14px;
    color: #1e293b;
    outline: none;
    background: white;
    appearance: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .su-tab {
    padding: 9px 22px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    background: none;
    cursor: pointer;
    color: #94a3b8;
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-tab.active { color: #6366f1; border-bottom: 2px solid #6366f1; }

  .action-btn {
    width: 100%;
    background: linear-gradient(135deg,#6366f1,#4f46e5);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px;
    font-size: 15.5px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 18px rgba(99,102,241,0.35);
    letter-spacing: 0.01em;
  }
  .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .form-panel { animation: fadeSlideIn 0.3s ease forwards; }

  .google-btn {
    width: 100%;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 13px;
    font-size: 14.5px;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, border-color 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .google-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
`;

/* ─── Icons ─────────────────────────────────────────────────── */
const Ico = ({ d, size=15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const IconUser    = () => <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>;
const IconMail    = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconLock    = () => <Ico d="M7 11V7a5 5 0 0 1 10 0v4M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>;
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
const IconEye     = () => <Ico d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>;
const IconEyeOff  = () => <Ico d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>;
const IconChevron = () => <Ico d="M6 9l6 6 6-6" size={13}/>;
const IconHexagon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L29.86 9.5V24.5L16 32L2.14 24.5V9.5L16 2Z" fill="#6366f1" opacity="0.2"/>
    <path d="M16 5L26.39 11V23L16 29L5.61 23V11L16 5Z" fill="#6366f1"/>
    <path d="M16 9L22.93 13V19L16 23L9.07 19V13L16 9Z" fill="white"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 10 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const IconFlask = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.31L2.08 18.2a2 2 0 0 0 1.6 3.24h16.64a2 2 0 0 0 1.6-3.24L14 9.31V2"/><path d="M8.5 2h7"/><path d="M14 9.31L19.46 17H4.54L10 9.31Z"/>
  </svg>
);
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="18" y="3" width="4" height="18" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="2" y="13" width="4" height="8" rx="1"/>
  </svg>
);
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

/* ─── Field wrapper ──────────────────────────────────────────── */
const Field = ({ label, icon, children, mb = 11 }) => (
  <div style={{ marginBottom: mb }}>
    <label style={{ display:'block', fontSize:13.5, fontWeight:600, color:'#374151', marginBottom:5 }}>
      {label}
    </label>
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', pointerEvents:'none' }}>
        {icon}
      </span>
      {children}
    </div>
  </div>
);

/* ─── Sign Up Form ───────────────────────────────────────────── */
const SignUpForm = ({ onGoogleClick }) => {
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
      const res = await fetch('http://localhost:8000/api/users/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ full_name:formData.fullName, email:formData.email, department:formData.department, institute:formData.institute, role:formData.role, password:formData.password }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setTimeout(() => navigate('/dashboard'), 3000); }
      else setError(data.detail || 'Registration failed');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
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
          {error}
        </div>
      )}

      <Field label="Full Name" icon={<IconUser/>}>
        <input className="su-input" type="text" name="fullName" value={formData.fullName} onChange={onChange} placeholder="Enter your full name" required/>
      </Field>
      <Field label="Email Address" icon={<IconMail/>}>
        <input className="su-input" type="email" name="email" value={formData.email} onChange={onChange} placeholder="Enter your email address" required/>
      </Field>
      <Field label="Department" icon={<IconGrad/>}>
        <input className="su-input" type="text" name="department" value={formData.department} onChange={onChange} placeholder="e.g., Materials Science, Physics" required/>
      </Field>
      <Field label="Institute Name" icon={<IconBuild/>}>
        <input className="su-input" type="text" name="institute" value={formData.institute} onChange={onChange} placeholder="e.g., IIT Bombay, MIT" required/>
      </Field>
      <Field label="Role" icon={<IconBrief/>}>
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
      </Field>
      <Field label="Password" icon={<IconLock/>}>
        <input className="su-input" type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="Create a password" required style={{ paddingRight:40 }}/>
        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {showPw ? <IconEyeOff/> : <IconEye/>}
        </button>
      </Field>
      <Field label="Confirm Password" icon={<IconLock/>} mb={10}>
        <input className="su-input" type={showCpw ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={onChange} placeholder="Confirm your password" required style={{ paddingRight:40 }}/>
        <button type="button" onClick={() => setShowCpw(!showCpw)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {showCpw ? <IconEyeOff/> : <IconEye/>}
        </button>
      </Field>

      <div style={{ display:'flex', alignItems:'flex-start', gap:8, margin:'10px 0 14px' }}>
        <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:3, accentColor:'#6366f1', flexShrink:0 }} required/>
        <label htmlFor="terms" style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>
          I agree to the <span style={{ color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Terms of Service</span> and <span style={{ color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Privacy Policy</span>
        </label>
      </div>

      <button type="submit" className="action-btn" disabled={loading || !agreed}>
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0' }}>
        <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }}></div>
        <span style={{ padding: '0 12px', fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }}></div>
      </div>

      <button type="button" className="google-btn" onClick={onGoogleClick} disabled={loading}>
        <GoogleIcon />
        {loading ? 'Connecting...' : 'Continue with Google'}
      </button>
    </form>
  );
};

/* ─── Sign In Form ───────────────────────────────────────────── */
const SignInForm = ({ onGoogleClick }) => {
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({ email:'', password:'' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/users/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email:formData.email, password:formData.password }),
      });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('user', JSON.stringify(data.user)); navigate('/dashboard'); }
      else setError(data.detail || 'Login failed');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

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

      <Field label="Email Address" icon={<IconMail/>}>
        <input className="su-input" type="email" name="email" value={formData.email} onChange={onChange} placeholder="Enter your email address" required/>
      </Field>
      <Field label="Password" icon={<IconLock/>} mb={8}>
        <input className="su-input" type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="Enter your password" required style={{ paddingRight:40 }}/>
        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
          {showPw ? <IconEyeOff/> : <IconEye/>}
        </button>
      </Field>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:13.5, color:'#64748b', cursor:'pointer' }}>
          <input type="checkbox" style={{ accentColor:'#6366f1' }}/> Remember me
        </label>
        <span style={{ fontSize:13.5, color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Forgot password?</span>
      </div>

      <button type="submit" className="action-btn" disabled={loading}>
        {loading ? 'Signing In…' : 'Sign In'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0' }}>
        <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }}></div>
        <span style={{ padding: '0 12px', fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }}></div>
      </div>

      <button type="button" className="google-btn" onClick={onGoogleClick} disabled={loading}>
        <GoogleIcon />
        {loading ? 'Connecting...' : 'Continue with Google'}
      </button>
    </form>
  );
};

/* ─── Left Panel (constant) ──────────────────────────────────── */
const LeftPanel = () => (
  <div style={{
    width: '50%', flexShrink: 0,
    background:'linear-gradient(160deg,#f8faff 0%,#eef2ff 50%,#e0e7ff 100%)',
    display:'flex', flexDirection:'column',
    padding:'40px 60px',
    position:'relative', overflow:'hidden',
    borderRight:'none',
  }}>
    {/* Blobs */}
    <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, background:'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }}/>
    <div style={{ position:'absolute', bottom:80, left:-40, width:160, height:160, background:'radial-gradient(circle,rgba(167,139,250,0.20) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }}/>
    {[
      {top:'18%',left:'72%',size:7,color:'rgba(99,102,241,0.35)'},
      {top:'35%',left:'84%',size:5,color:'rgba(167,139,250,0.5)'},
      {top:'12%',left:'58%',size:4,color:'rgba(56,189,248,0.4)'},
      {top:'50%',left:'80%',size:6,color:'rgba(99,102,241,0.22)'},
    ].map((d,i) => (
      <div key={i} style={{ position:'absolute', top:d.top, left:d.left, width:d.size, height:d.size, borderRadius:'50%', background:d.color }}/>
    ))}

    {/* Logo */}
    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:40, position:'relative', zIndex:10 }}>
      <IconHexagon/>
      <span style={{ fontSize:18, fontWeight:800, color:'#1e1b4b' }}>ResearchHub</span>
    </div>

    {/* Content Container */}
    <div style={{ position:'relative', zIndex:10, display:'flex', flexDirection:'column', flex: 1, paddingBottom: '40px' }}>
      {/* Headline */}
      <h1 style={{ margin:'0 0 16px', fontSize:44, fontWeight:900, color:'#1e1b4b', lineHeight:1.15, letterSpacing:'-0.02em' }}>
        Built for<br/>Researchers.
      </h1>

      {/* Illustration */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
        <img
          src="/researcher.png"
          alt="Researchers at work"
          style={{ width:'100%', height:'auto', maxHeight:'80vh', objectFit:'contain', display:'block', mixBlendMode: 'darken' }}
          onError={e => { e.target.style.display='none'; }}
        />
      </div>
    </div>
  </div>
);



/* ─── Google Account Chooser Modal ──────────────────────────── */
const GoogleAccountChooserModal = ({ isOpen, onClose, onSelect }) => {
  const [step, setStep] = React.useState('CHOOSER');
  const [account, setAccount] = React.useState(null);
  const [customEmail, setCustomEmail] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setStep('CHOOSER');
      setAccount(null);
      setCustomEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const accounts = [
    { name: 'Khushboo', email: 'chaudharykhus3107@gmail.com', img: 'K', color: '#8b5cf6' }
  ];

  const handleAccountSelect = (acc) => {
    setAccount(acc);
    setStep('PERMISSION');
  };

  const handleCustomEmailNext = () => {
    if (!customEmail) return;
    setAccount({
      name: customEmail.split('@')[0],
      email: customEmail,
      img: customEmail.charAt(0).toUpperCase(),
      color: '#3b82f6'
    });
    setStep('PERMISSION');
  };

  const handleContinue = () => {
    setStep('LOADING');
    setTimeout(() => {
      onSelect(account);
    }, 2500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ position: 'relative', width: 420, minHeight: 450, background: 'white', borderRadius: 12, padding: step === 'LOADING' ? '60px 36px' : '36px 0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'fadeSlideIn 0.2s ease-out', display: 'flex', flexDirection: 'column' }}>
        
        {step === 'CHOOSER' && (
          <>
            <div style={{ padding: '0 36px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <GoogleIcon />
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: '#202124' }}>Choose an account</h3>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#5f6368' }}>to continue to ResearchHub</p>
            </div>

            <div style={{ borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', padding: '12px 0' }}>
              {accounts.map((acc, idx) => (
                <div key={idx} onClick={() => handleAccountSelect(acc)} style={{ display: 'flex', alignItems: 'center', padding: '12px 36px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: acc.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, marginRight: 12 }}>
                    {acc.img}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#3c4043' }}>{acc.name}</div>
                    <div style={{ fontSize: 13, color: '#5f6368' }}>{acc.email}</div>
                  </div>
                </div>
              ))}
              <div onClick={() => setStep('EMAIL_INPUT')} style={{ display: 'flex', alignItems: 'center', padding: '12px 36px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#3c4043' }}>Use another account</div>
              </div>
            </div>
            
            <div style={{ padding: '24px 36px 0', fontSize: 13, color: '#5f6368', lineHeight: 1.5 }}>
              To continue, Google will share your name, email address, and profile picture with ResearchHub.
            </div>
            
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#5f6368', borderRadius: '50%' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </>
        )}

        {step === 'EMAIL_INPUT' && (
          <>
            <div style={{ padding: '0 36px', textAlign: 'center', marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <GoogleIcon />
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: '#202124' }}>Sign in</h3>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#5f6368' }}>to continue to ResearchHub</p>
            </div>
            
            <div style={{ padding: '0 36px', flex: 1 }}>
              <input 
                type="email" 
                placeholder="Email or phone" 
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                style={{ width: '100%', padding: '13px 15px', fontSize: 16, border: '1px solid #dadce0', borderRadius: 4, outline: 'none' }}
                autoFocus
              />
              <div style={{ marginTop: 8, color: '#1a73e8', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Forgot email?</div>
            </div>

            <div style={{ padding: '24px 36px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <div style={{ color: '#1a73e8', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Create account</div>
              <button 
                onClick={handleCustomEmailNext}
                style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4, padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                Next
              </button>
            </div>
            
            <button onClick={() => setStep('CHOOSER')} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#5f6368', borderRadius: '50%' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          </>
        )}

        {step === 'PERMISSION' && account && (
          <>
            <div style={{ padding: '0 36px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <GoogleIcon />
              </div>
              <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 400, color: '#202124', lineHeight: 1.4 }}>
                ResearchHub wants access to your Google Account
              </h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f3f4', padding: '4px 12px 4px 4px', borderRadius: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: account.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, marginRight: 8 }}>
                  {account.img}
                </div>
                <span style={{ fontSize: 13, color: '#3c4043', fontWeight: 500 }}>{account.email}</span>
              </div>
            </div>

            <div style={{ padding: '0 36px', flex: 1 }}>
              <p style={{ fontSize: 14, color: '#3c4043', margin: '0 0 16px', fontWeight: 500 }}>This will allow ResearchHub to:</p>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" style={{ marginRight: 12, flexShrink: 0, marginTop: 2 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <span style={{ fontSize: 14, color: '#3c4043', lineHeight: 1.4 }}>See your name, email address, and profile picture</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" style={{ marginRight: 12, flexShrink: 0, marginTop: 2 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <span style={{ fontSize: 14, color: '#3c4043', lineHeight: 1.4 }}>Associate you with your personal info on ResearchHub</span>
              </div>
              
              <p style={{ fontSize: 13, color: '#5f6368', margin: '24px 0 0', lineHeight: 1.5 }}>
                Make sure you trust ResearchHub. You may be sharing sensitive info with this site or app.
              </p>
            </div>

            <div style={{ padding: '24px 36px 0', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 'auto' }}>
              <button onClick={() => setStep('CHOOSER')} style={{ background: 'white', color: '#1a73e8', border: '1px solid #dadce0', borderRadius: 4, padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleContinue} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4, padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'LOADING' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M10 2v7.31L2.08 18.2a2 2 0 0 0 1.6 3.24h16.64a2 2 0 0 0 1.6-3.24L14 9.31V2"/><path d="M8.5 2h7"/></svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#1e1b4b' }}>ResearchHub</span>
            </div>

            <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#1e1b4b' }}>Signing you in...</h3>
            <p style={{ margin: '0 0 32px', fontSize: 14, color: '#64748b' }}>Setting up your workspace...</p>

            <div style={{ width: '80%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: '#6366f1', borderRadius: 2, animation: 'progressAnim 2.5s ease-in-out forwards' }} />
            </div>
            <style>
              {`@keyframes progressAnim {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
              }`}
            </style>
          </div>
        )}

      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const AuthPage = () => {
  const location = useLocation();
  const tab = location.pathname.includes('/login') ? 'signin' : 'signup';
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSelect = (account) => {
    setShowGoogleModal(false);
    if (account) {
      if (account.name !== 'Other') {
        localStorage.setItem('user', JSON.stringify({ email: account.email, full_name: account.name }));
      }
      navigate('/dashboard');
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="signup-root" style={{
        display:'flex', minHeight:'100vh',
        fontFamily:"'Inter',system-ui,sans-serif",
        background:'#f5f3ff',
      }}>
        {/* LEFT — constant */}
        <LeftPanel/>

        {/* RIGHT — tab-switched */}
        <div style={{
          width: '50%', flexShrink: 0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'30px 40px',
          background:'white',
          overflowY:'auto',
        }}>
          <div style={{ width:'100%', maxWidth:480 }}>

            {/* Tabs removed as per user request */}

            {/* Heading (only for signup) */}
            {tab === 'signup' && (
              <div style={{ marginBottom:16 }}>
                <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:800, color:'#1e1b4b', letterSpacing:'-0.02em' }}>Create your account</h2>
                <p style={{ margin:0, fontSize:14, color:'#94a3b8' }}>Start your research journey with us.</p>
              </div>
            )}

            {/* Form switch */}
            {tab === 'signup' ? <SignUpForm onGoogleClick={() => setShowGoogleModal(true)}/> : <SignInForm onGoogleClick={() => setShowGoogleModal(true)}/>}

            {/* Bottom switch link removed as per user request */}

            <GoogleAccountChooserModal 
              isOpen={showGoogleModal} 
              onClose={() => setShowGoogleModal(false)}
              onSelect={handleGoogleSelect}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
