import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/* ─── Injected styles ──────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .signup-root * { box-sizing: border-box; }

  .su-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px 10px 38px;
    font-size: 13px;
    color: #1e293b;
    outline: none;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-input::placeholder { color: #94a3b8; }
  .su-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .su-select {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px 10px 38px;
    font-size: 13px;
    color: #1e293b;
    outline: none;
    background: white;
    appearance: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .su-tab {
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    background: none;
    cursor: pointer;
    color: #94a3b8;
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .su-tab.active {
    color: #6366f1;
    border-bottom: 2px solid #6366f1;
  }
  .create-btn {
    width: 100%;
    background: linear-gradient(135deg,#6366f1,#4f46e5);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 13px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: opacity 0.2s, transform 0.15s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 18px rgba(99,102,241,0.35);
  }
  .create-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .create-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  .feat-item:hover .feat-icon-wrap { background: rgba(99,102,241,0.18); }
  .feat-icon-wrap { transition: background 0.2s; }

  @keyframes floatUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .su-animate { animation: floatUp 0.55s ease forwards; }
`;

/* ─── SVG icons (inline) ───────────────────────────────────── */
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconGrad = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconFlask = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M9 3v7l-5 9a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 19l-5-9V3"/>
  </svg>
);
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="12" width="4" height="9" rx="1"/>
  </svg>
);
const IconPeople = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconLinkedIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#6366f1">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconEmail2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#6366f1">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="#6366f1"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
const IconHexagon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L29.86 9.5V24.5L16 32L2.14 24.5V9.5L16 2Z" fill="#6366f1" opacity="0.2"/>
    <path d="M16 5L26.39 11V23L16 29L5.61 23V11L16 5Z" fill="#6366f1"/>
    <path d="M16 9L22.93 13V19L16 23L9.07 19V13L16 9Z" fill="white"/>
  </svg>
);

/* ─── Field wrapper ────────────────────────────────────────── */
const Field = ({ label, icon, children }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5 }}>
      {label}
    </label>
    <div style={{ position:'relative' }}>
      <span style={{
        position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
        display:'flex', alignItems:'center', pointerEvents:'none',
      }}>
        {icon}
      </span>
      {children}
    </div>
  </div>
);

/* ─── Feature item (bottom of left panel) ─────────────────── */
const FeatItem = ({ icon, title, desc }) => (
  <div className="feat-item" style={{ textAlign:'center', flex:'1 1 0' }}>
    <div className="feat-icon-wrap" style={{
      width:44, height:44, borderRadius:12,
      background:'rgba(99,102,241,0.10)',
      display:'flex', alignItems:'center', justifyContent:'center',
      margin:'0 auto 7px',
    }}>
      {icon}
    </div>
    <p style={{ margin:'0 0 3px', fontSize:11.5, fontWeight:700, color:'#1e1b4b' }}>{title}</p>
    <p style={{ margin:0, fontSize:10.5, color:'#6b7280', lineHeight:1.4 }}>{desc}</p>
  </div>
);

/* ─── Main Component ───────────────────────────────────────── */
const Signup = () => {
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed]                       = useState(false);
  const [formData, setFormData]                   = useState({
    fullName: '', email: '', department: '',
    institute: '', role: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName, email: formData.email,
          department: formData.department, institute: formData.institute,
          role: formData.role, password: formData.password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="signup-root" style={{
        display:'flex', minHeight:'100vh',
        fontFamily:"'Inter',system-ui,sans-serif",
        background:'#f5f3ff',
      }}>

        {/* ══════════════ LEFT PANEL ══════════════════════ */}
        <div style={{
          width:'48%', minWidth:420,
          background:'linear-gradient(160deg,#ede9fe 0%,#e0e7ff 50%,#ddd6fe 100%)',
          display:'flex', flexDirection:'column',
          padding:'28px 40px 24px',
          position:'relative', overflow:'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{
            position:'absolute', top:-60, right:-60,
            width:240, height:240,
            background:'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)',
            borderRadius:'50%', pointerEvents:'none',
          }}/>
          <div style={{
            position:'absolute', bottom:100, left:-40,
            width:180, height:180,
            background:'radial-gradient(circle,rgba(167,139,250,0.20) 0%,transparent 70%)',
            borderRadius:'50%', pointerEvents:'none',
          }}/>
          {/* Floating dots */}
          {[
            {top:'18%',left:'70%',size:7,color:'rgba(99,102,241,0.35)'},
            {top:'32%',left:'82%',size:5,color:'rgba(167,139,250,0.5)'},
            {top:'12%',left:'55%',size:4,color:'rgba(56,189,248,0.4)'},
            {top:'45%',left:'78%',size:6,color:'rgba(99,102,241,0.25)'},
            {top:'60%',left:'88%',size:4,color:'rgba(167,139,250,0.4)'},
          ].map((d,i)=>(
            <div key={i} style={{
              position:'absolute', top:d.top, left:d.left,
              width:d.size, height:d.size, borderRadius:'50%', background:d.color,
            }}/>
          ))}

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:32, position:'relative', zIndex:1 }}>
            <IconHexagon />
            <span style={{ fontSize:16, fontWeight:800, color:'#1e1b4b' }}>ResearchHub</span>
          </div>

          {/* Headline */}
          <div style={{ position:'relative', zIndex:1, flex:1 }}>
            <h1 style={{
              margin:'0 0 14px',
              fontSize:34, fontWeight:900,
              color:'#1e1b4b', lineHeight:1.15,
              letterSpacing:'-0.025em',
            }}>
              Built for<br/>
              Researchers.<br/>
              <span style={{ color:'#6366f1' }}>Designed for<br/>Discovery.</span>
            </h1>
            <p style={{
              margin:'0 0 22px', fontSize:13, color:'#6b7280', lineHeight:1.65, maxWidth:300,
            }}>
              Create your account and join a global community of scientists accelerating
              real-world impact through research.
            </p>

            {/* Illustration */}
            <div style={{
              borderRadius:18,
              background:'rgba(255,255,255,0.35)',
              backdropFilter:'blur(6px)',
              border:'1px solid rgba(255,255,255,0.6)',
              marginBottom:24,
              padding:0,
            }}>
              <img
                src="/researcher.png"
                alt="Researchers at work"
                style={{ width:'100%', objectFit:'contain', borderRadius:12, display:'block' }}
                onError={e => {
                  // Fallback SVG illustration if image fails
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `
                    <svg viewBox="0 0 340 180" style="width:100%;height:180px" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="bg" cx="50%" cy="50%" r="70%">
                          <stop offset="0%" stop-color="#ede9fe"/>
                          <stop offset="100%" stop-color="#c7d2fe"/>
                        </radialGradient>
                      </defs>
                      <rect width="340" height="180" fill="url(#bg)" rx="12"/>
                      <!-- Lab table -->
                      <rect x="20" y="130" width="300" height="8" rx="3" fill="#a5b4fc" opacity="0.7"/>
                      <!-- Microscope -->
                      <rect x="50" y="90" width="12" height="40" rx="3" fill="#6366f1"/>
                      <rect x="38" y="86" width="36" height="8" rx="3" fill="#818cf8"/>
                      <ellipse cx="56" cy="88" rx="18" ry="10" fill="#a5b4fc" opacity="0.6"/>
                      <!-- Laptop -->
                      <rect x="130" y="100" width="80" height="48" rx="4" fill="#e0e7ff"/>
                      <rect x="134" y="104" width="72" height="38" rx="2" fill="#c7d2fe"/>
                      <rect x="120" y="148" width="100" height="5" rx="2" fill="#a5b4fc"/>
                      <!-- Chart on laptop -->
                      <polyline points="142,132 154,120 166,125 178,112 190,118" stroke="#6366f1" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                      <!-- Flask -->
                      <path d="M255 95 L250 130 Q248 138 258 138 Q268 138 266 130 Z" fill="#a5b4fc" opacity="0.8"/>
                      <rect x="252" y="88" width="12" height="10" rx="2" fill="#818cf8"/>
                      <!-- Person 1 (woman) -->
                      <circle cx="80" cy="75" r="14" fill="#fde68a"/>
                      <rect x="66" y="88" width="28" height="40" rx="6" fill="white" opacity="0.9"/>
                      <!-- Person 2 (man) -->
                      <circle cx="245" cy="72" r="14" fill="#fed7aa"/>
                      <rect x="231" y="85" width="28" height="43" rx="6" fill="white" opacity="0.9"/>
                      <!-- Plants -->
                      <rect x="295" y="120" width="6" height="12" rx="2" fill="#86efac"/>
                      <ellipse cx="298" cy="116" rx="10" ry="8" fill="#4ade80" opacity="0.7"/>
                      <ellipse cx="302" cy="112" rx="8" ry="6" fill="#22c55e" opacity="0.6"/>
                      <!-- Beakers -->
                      <path d="M280 110 L276 128 Q275 132 282 132 Q289 132 288 128 Z" fill="#bfdbfe" opacity="0.8"/>
                      <path d="M300 115 L297 128 Q296 131 301 131 Q306 131 305 128 Z" fill="#a5f3fc" opacity="0.8"/>
                    </svg>
                  `;
                }}
              />
            </div>

            {/* 4 Feature items */}
            <div style={{ display:'flex', gap:10 }}>
              <FeatItem icon={<IconFlask/>} title="Advanced Research Tools" desc="Powerful tools for every step."/>
              <FeatItem icon={<IconChart/>} title="Analyze & Visualize" desc="Turn complex data into insights."/>
              <FeatItem icon={<IconPeople/>} title="Collaborate Seamlessly" desc="Work together and share knowledge."/>
              <FeatItem icon={<IconShield/>} title="Secure & Reliable" desc="Your data is safe with us."/>
            </div>
          </div>

          {/* Footer */}
          <p style={{ position:'relative', zIndex:1, fontSize:11, color:'#94a3b8', marginTop:20 }}>
            © 2024 ResearchHub. All rights reserved.
          </p>
        </div>

        {/* ══════════════ RIGHT PANEL ═════════════════════ */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'32px 48px',
          background:'white',
          overflowY:'auto',
        }}>
          <div className="su-animate" style={{ width:'100%', maxWidth:420 }}>

            {/* Tabs */}
            <div style={{
              display:'flex', borderBottom:'1px solid #e2e8f0',
              marginBottom:22,
            }}>
              <button className="su-tab active">Sign Up</button>
              <Link to="/login" className="su-tab" style={{
                padding:'8px 20px', fontSize:14, fontWeight:600,
                color:'#94a3b8', textDecoration:'none', borderBottom:'2px solid transparent',
                display:'inline-flex', alignItems:'center',
              }}
                onMouseEnter={e => e.currentTarget.style.color='#6366f1'}
                onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
              >
                Sign In
              </Link>
            </div>

            {/* Header */}
            <div style={{ marginBottom:20 }}>
              <h2 style={{
                margin:'0 0 5px', fontSize:22, fontWeight:800,
                color:'#1e1b4b', letterSpacing:'-0.02em',
              }}>
                Create your account
              </h2>
              <p style={{ margin:0, fontSize:13, color:'#94a3b8' }}>
                Start your research journey with us.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background:'#fef2f2', border:'1px solid #fecaca',
                color:'#dc2626', padding:'10px 14px', borderRadius:8,
                fontSize:13, marginBottom:14, display:'flex', alignItems:'center', gap:8,
              }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#dc2626', flexShrink:0 }}/>
                {error}
              </div>
            )}

            {success ? (
              <div style={{ textAlign:'center', padding:'32px 0' }}>
                <div style={{
                  width:72, height:72, borderRadius:'50%',
                  background:'#f0fdf4', display:'flex', alignItems:'center',
                  justifyContent:'center', margin:'0 auto 18px',
                }}>
                  <CheckCircle2 size={36} color="#22c55e"/>
                </div>
                <h3 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#1e1b4b' }}>
                  Registration Successful!
                </h3>
                <p style={{ margin:'0 0 18px', fontSize:13, color:'#6b7280', lineHeight:1.6 }}>
                  A verification email has been sent. Please verify your account to continue.
                </p>
                <div style={{
                  background:'#eef2ff', color:'#6366f1',
                  padding:'10px', borderRadius:8, fontSize:13, fontWeight:600,
                }}>
                  Redirecting to login…
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>

                {/* Full Name */}
                <Field label="Full Name" icon={<IconUser/>}>
                  <input className="su-input" type="text" name="fullName"
                    value={formData.fullName} onChange={handleChange}
                    placeholder="Enter your full name" required/>
                </Field>

                {/* Email */}
                <Field label="Email Address" icon={<IconMail/>}>
                  <input className="su-input" type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="Enter your email address" required/>
                </Field>

                {/* Department */}
                <Field label="Department" icon={<IconGrad/>}>
                  <input className="su-input" type="text" name="department"
                    value={formData.department} onChange={handleChange}
                    placeholder="e.g., Materials Science, Physics" required/>
                </Field>

                {/* Institute */}
                <Field label="Institute Name" icon={<IconBuilding/>}>
                  <input className="su-input" type="text" name="institute"
                    value={formData.institute} onChange={handleChange}
                    placeholder="e.g., IIT Bombay, MIT" required/>
                </Field>

                {/* Role */}
                <Field label="Role" icon={<IconBriefcase/>}>
                  <select className="su-select" name="role"
                    value={formData.role} onChange={handleChange} required>
                    <option value="" disabled>Select your role</option>
                    <option value="student">Student</option>
                    <option value="researcher">Researcher</option>
                    <option value="professor">Professor</option>
                    <option value="postdoc">Postdoctoral Fellow</option>
                    <option value="industry">Industry Professional</option>
                    <option value="other">Other</option>
                  </select>
                  <span style={{
                    position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                    pointerEvents:'none',
                  }}>
                    <IconChevronDown/>
                  </span>
                </Field>

                {/* Password */}
                <Field label="Password" icon={<IconLock/>}>
                  <input className="su-input" type={showPassword ? 'text' : 'password'}
                    name="password" value={formData.password} onChange={handleChange}
                    placeholder="Create a password" required
                    style={{ paddingRight:38 }}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      display:'flex', alignItems:'center',
                    }}>
                    {showPassword ? <IconEyeOff/> : <IconEye/>}
                  </button>
                </Field>

                {/* Confirm Password */}
                <Field label="Confirm Password" icon={<IconLock/>}>
                  <input className="su-input" type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Confirm your password" required
                    style={{ paddingRight:38 }}/>
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      display:'flex', alignItems:'center',
                    }}>
                    {showConfirmPassword ? <IconEyeOff/> : <IconEye/>}
                  </button>
                </Field>

                {/* Terms checkbox */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, margin:'12px 0 16px' }}>
                  <input type="checkbox" id="terms" checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop:2, accentColor:'#6366f1', flexShrink:0 }}
                    required/>
                  <label htmlFor="terms" style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>
                    I agree to the{' '}
                    <span style={{ color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Privacy Policy</span>
                  </label>
                </div>

                {/* Submit */}
                <button type="submit" className="create-btn" disabled={loading || !agreed}>
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>

                {/* Social icons row */}
                <div style={{
                  display:'flex', justifyContent:'center', gap:18, marginTop:18,
                }}>
                  {[<IconLinkedIn/>, <IconEmail2/>, <IconTwitter/>, <IconInstagram/>].map((icon,i) => (
                    <button key={i} type="button" style={{
                      width:36, height:36, borderRadius:'50%',
                      border:'1px solid #e2e8f0', background:'white',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', transition:'border-color 0.2s, box-shadow 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.10)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='none'; }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Footer links */}
                <div style={{
                  display:'flex', justifyContent:'center', gap:24,
                  marginTop:18, paddingTop:16,
                  borderTop:'1px solid #f1f5f9',
                }}>
                  <span style={{ fontSize:11.5, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
                    <IconEmail2/> support@researchhub.io
                  </span>
                  <span style={{ fontSize:11.5, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
                    🌐 www.researchhub.io
                  </span>
                </div>

              </form>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default Signup;
