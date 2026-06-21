import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('http://localhost:8000/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user_id));
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Google Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

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
      
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google Login Failed')}
          text="continue_with"
          width="100%"
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span style={{ padding: '0 10px' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

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

    </form>
  );
};

/* ─── Sign In Form ───────────────────────────────────────────── */
const SignInForm = () => {
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({ email:'', password:'' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('http://localhost:8000/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user_id));
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Google Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

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

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google Login Failed')}
          text="continue_with"
          width="100%"
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span style={{ padding: '0 10px' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

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





/* ─── Main Component ─────────────────────────────────────────── */
const AuthPage = () => {
  const location = useLocation();
  const tab = location.pathname.includes('/login') ? 'signin' : 'signup';
  const navigate = useNavigate();

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
            {tab === 'signup' ? <SignUpForm /> : <SignInForm />}

            {/* Bottom switch link removed as per user request */}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
