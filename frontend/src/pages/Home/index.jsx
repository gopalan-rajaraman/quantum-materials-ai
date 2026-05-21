import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Global keyframe styles injected once ───────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* Atom orbit ring rotations */
  @keyframes orbitA {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orbitB {
    from { transform: rotate(-30deg); }
    to   { transform: rotate(330deg); }
  }
  @keyframes orbitC {
    from { transform: rotate(120deg); }
    to   { transform: rotate(480deg); }
  }

  /* Floating levitation */
  @keyframes floatY {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-14px); }
  }
  @keyframes floatYReverse {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(14px); }
  }

  /* Crystal node pulse */
  @keyframes nodePulse {
    0%,100% { r: 8; opacity: 1; }
    50%      { r: 12; opacity: 0.6; }
  }

  /* Gradient text shimmer */
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* Stagger fade-in from below */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Particle drift */
  @keyframes drift1 {
    0%   { transform: translate(0,0) scale(1); opacity: 0.45; }
    50%  { transform: translate(30px,-50px) scale(1.2); opacity: 0.7; }
    100% { transform: translate(0,0) scale(1); opacity: 0.45; }
  }
  @keyframes drift2 {
    0%   { transform: translate(0,0) scale(1); opacity: 0.3; }
    50%  { transform: translate(-40px,30px) scale(0.8); opacity: 0.55; }
    100% { transform: translate(0,0) scale(1); opacity: 0.3; }
  }
  @keyframes drift3 {
    0%   { transform: translate(0,0); opacity: 0.25; }
    50%  { transform: translate(20px,40px); opacity: 0.5; }
    100% { transform: translate(0,0); opacity: 0.25; }
  }
  @keyframes waveDrift {
    0%,100% { d: path("M0,40 Q200,10 400,40 Q600,70 800,40 L800,100 L0,100 Z"); }
    50%      { d: path("M0,55 Q200,25 400,55 Q600,85 800,55 L800,100 L0,100 Z"); }
  }

  /* Card hover */
  .feat-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    cursor: default;
  }
  .feat-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 36px rgba(99,102,241,0.14) !important;
  }
  .feat-card:hover .feat-icon {
    transform: scale(1.15) rotate(-6deg);
    transition: transform 0.25s ease;
  }
  .feat-icon {
    transition: transform 0.25s ease;
  }

  /* Sign-up button pulse glow */
  @keyframes btnGlow {
    0%,100% { box-shadow: 0 2px 12px rgba(99,102,241,0.35); }
    50%      { box-shadow: 0 4px 24px rgba(99,102,241,0.65), 0 0 0 4px rgba(99,102,241,0.12); }
  }
  .signup-btn {
    animation: btnGlow 2.6s ease-in-out infinite;
    transition: opacity 0.2s, transform 0.2s !important;
  }
  .signup-btn:hover {
    opacity: 0.88 !important;
    transform: translateY(-2px) !important;
  }
`;

/* ─── Inline SVG icons ─────────────────────────────────────── */
const AtomNavIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2"/>
    <ellipse cx="12" cy="12" rx="10" ry="4.5"/>
    <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"/>
  </svg>
);

const GearIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

/* ─── Animated Atom (spinning orbits) ──────────────────────── */
const AtomIllustration = () => (
  <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
    <defs>
      <radialGradient id="sphereGrad" cx="38%" cy="32%" r="60%">
        <stop offset="0%" stopColor="#c4b5fd"/>
        <stop offset="50%" stopColor="#818cf8"/>
        <stop offset="100%" stopColor="#4f46e5"/>
      </radialGradient>
      <radialGradient id="dotGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#bae6fd"/>
        <stop offset="100%" stopColor="#38bdf8"/>
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* Orbit ring A — slow */}
    <g style={{ transformOrigin: '110px 110px', animation: 'orbitA 8s linear infinite' }}>
      <ellipse cx="110" cy="110" rx="95" ry="28" fill="none" stroke="url(#dotGrad)" strokeWidth="1.4" strokeDasharray="5 3" opacity="0.55"/>
      <circle cx="205" cy="110" r="6" fill="url(#dotGrad)" filter="url(#glow)"/>
    </g>

    {/* Orbit ring B — medium */}
    <g style={{ transformOrigin: '110px 110px', animation: 'orbitB 5.5s linear infinite' }}>
      <ellipse cx="110" cy="110" rx="95" ry="28" fill="none" stroke="url(#dotGrad)" strokeWidth="1.4" strokeDasharray="5 3" opacity="0.55" transform="rotate(60 110 110)"/>
      <circle cx="152" cy="28" r="5.5" fill="#a78bfa" filter="url(#glow)"/>
    </g>

    {/* Orbit ring C — fast */}
    <g style={{ transformOrigin: '110px 110px', animation: 'orbitC 4s linear infinite' }}>
      <ellipse cx="110" cy="110" rx="95" ry="28" fill="none" stroke="url(#dotGrad)" strokeWidth="1.4" strokeDasharray="5 3" opacity="0.55" transform="rotate(120 110 110)"/>
      <circle cx="15" cy="110" r="5" fill="#67e8f9" filter="url(#glow)"/>
    </g>

    {/* Central sphere */}
    <circle cx="110" cy="110" r="36" fill="url(#sphereGrad)" filter="url(#glow)"/>
    <circle cx="98" cy="98" r="10" fill="white" opacity="0.17"/>
  </svg>
);

/* ─── Animated Crystal (pulsing nodes) ─────────────────────── */
const CrystalIllustration = () => {
  const nodes = [
    [110,50,9,'nodeGrad',0],
    [50,110,8,'nodeGrad',300],
    [170,110,8,'nodeGrad',600],
    [110,170,8,'nodeGrad',900],
    [110,110,7,'nodeGrad2',1200],
    [20,75,6,'nodeGrad2',450],
    [200,75,6,'nodeGrad2',750],
    [110,20,6,'nodeGrad2',150],
    [80,200,5,'nodeGrad2',1050],
    [140,200,5,'nodeGrad2',1350],
  ];

  return (
    <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <radialGradient id="nodeGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#bae6fd"/>
          <stop offset="100%" stopColor="#38bdf8"/>
        </radialGradient>
        <radialGradient id="nodeGrad2" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#818cf8"/>
        </radialGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {[
        [110,50,50,110],[110,50,170,110],[110,50,110,110],
        [50,110,110,170],[170,110,110,170],[110,110,110,170],
        [50,110,110,110],[170,110,110,110],
        [50,110,20,75],[170,110,200,75],
        [110,50,110,20],
        [110,170,80,200],[110,170,140,200],
      ].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(99,179,237,0.40)" strokeWidth="1.4"/>
      ))}

      {/* Animated pulsing nodes */}
      {nodes.map(([cx,cy,r,grad,delay],i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={`url(#${grad})`} filter="url(#glow2)"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `nodePulse 2.4s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </svg>
  );
};

/* ─── Animated background particles ────────────────────────── */
const ParticleBackground = () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
    {/* Soft blobs */}
    <div style={{
      position: 'absolute', top: -60, left: -60,
      width: 320, height: 320,
      background: 'radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%)',
      borderRadius: '50%',
      animation: 'drift1 9s ease-in-out infinite',
    }}/>
    <div style={{
      position: 'absolute', top: 80, right: -40,
      width: 280, height: 280,
      background: 'radial-gradient(circle,rgba(56,189,248,0.12) 0%,transparent 70%)',
      borderRadius: '50%',
      animation: 'drift2 11s ease-in-out infinite',
    }}/>
    <div style={{
      position: 'absolute', bottom: -40, left: '45%',
      width: 200, height: 200,
      background: 'radial-gradient(circle,rgba(167,139,250,0.11) 0%,transparent 70%)',
      borderRadius: '50%',
      animation: 'drift3 13s ease-in-out infinite',
    }}/>

    {/* Floating dot particles */}
    {[
      { top:'12%', left:'18%', size:5, color:'rgba(99,102,241,0.4)', anim:'drift1 7s ease-in-out infinite' },
      { top:'28%', left:'72%', size:4, color:'rgba(56,189,248,0.45)', anim:'drift2 8s ease-in-out 1s infinite' },
      { top:'55%', left:'8%',  size:3, color:'rgba(167,139,250,0.5)', anim:'drift3 10s ease-in-out 2s infinite' },
      { top:'70%', left:'85%', size:4, color:'rgba(99,102,241,0.35)', anim:'drift1 9s ease-in-out 3s infinite' },
      { top:'42%', left:'92%', size:3, color:'rgba(56,189,248,0.4)', anim:'drift2 6s ease-in-out 0.5s infinite' },
      { top:'85%', left:'35%', size:5, color:'rgba(167,139,250,0.3)', anim:'drift3 12s ease-in-out 1.5s infinite' },
    ].map((p,i) => (
      <div key={i} style={{
        position: 'absolute',
        top: p.top, left: p.left,
        width: p.size, height: p.size,
        borderRadius: '50%',
        background: p.color,
        animation: p.anim,
      }}/>
    ))}


  </div>
);

/* ─── Dashboard preview ─────────────────────────────────────── */
const DashboardPreview = () => (
  <div style={{
    background: 'white',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 4px 24px rgba(99,120,255,0.10)',
    width: '100%',
    maxWidth: 400,
  }}>
    <div style={{ display:'flex', gap:6, marginBottom:12 }}>
      {['#f87171','#fbbf24','#34d399'].map(c => (
        <div key={c} style={{ width:8, height:8, borderRadius:'50%', background:c }}/>
      ))}
    </div>
    {[80,60,90,50,70].map((w,i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:24, height:6, background:'#e2e8f0', borderRadius:4 }}/>
        <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:4, maxWidth:`${w}%` }}/>
      </div>
    ))}
    <div style={{ display:'flex', gap:10, marginTop:14 }}>
      <div style={{ flex:1, background:'linear-gradient(135deg,#ede9fe,#dbeafe)', borderRadius:10, padding:'10px 8px', minHeight:90 }}>
        <svg viewBox="0 0 120 60" style={{ width:'100%', height:60 }}>
          <defs>
            <linearGradient id="ln1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="100%" stopColor="#38bdf8"/>
            </linearGradient>
            <linearGradient id="ln2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
          <polyline points="0,50 20,38 40,30 60,18 80,22 100,10 120,14"
            fill="none" stroke="url(#ln1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="0,55 20,48 40,44 60,36 80,40 100,28 120,32"
            fill="none" stroke="url(#ln2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ width:80, background:'linear-gradient(135deg,#ede9fe,#dbeafe)', borderRadius:10, padding:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg viewBox="0 0 60 60" style={{ width:60, height:60 }}>
          <circle cx="30" cy="30" r="22" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
          <circle cx="30" cy="30" r="22" fill="none" stroke="url(#dntG)" strokeWidth="10"
            strokeDasharray="85 53" strokeLinecap="round" transform="rotate(-90 30 30)"/>
          <defs>
            <linearGradient id="dntG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="100%" stopColor="#38bdf8"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    <div style={{ display:'flex', gap:6, marginTop:12, alignItems:'center' }}>
      {['#818cf8','#38bdf8','#34d399','#fb923c'].map((c,i) => (
        <div key={i} style={{ width:24, height:24, borderRadius:'50%', background:c, border:'2px solid white' }}/>
      ))}
      <div style={{ marginLeft:'auto', height:6, width:60, background:'#e2e8f0', borderRadius:4 }}/>
    </div>
  </div>
);

/* ─── Main Home Component ───────────────────────────────────── */
const Home = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger stagger animation shortly after mount
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fadeUpStyle = (delay) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: 'linear-gradient(160deg,#eef3ff 0%,#f0f7ff 40%,#e8f4fd 70%,#f5f0ff 100%)',
        overflowX: 'hidden',
        position: 'relative',
      }}>

        {/* ── NAVBAR ─────────────────────────────────────── */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '14px 40px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(200,215,255,0.35)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <nav style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Link to="/login" style={{
              padding:'8px 18px', fontSize:14, fontWeight:500,
              color:'#374151', textDecoration:'none', borderRadius:8,
            }}
              onMouseEnter={e => e.target.style.background='rgba(99,102,241,0.07)'}
              onMouseLeave={e => e.target.style.background='transparent'}
            >
              Log In
            </Link>
            <Link to="/signup" className="signup-btn" style={{
              padding:'8px 22px', fontSize:14, fontWeight:600,
              color:'white', textDecoration:'none', borderRadius:8,
              background:'linear-gradient(135deg,#6366f1,#4f46e5)',
              display:'inline-block',
            }}>
              Sign Up
            </Link>
          </nav>
        </header>

        {/* ── HERO ───────────────────────────────────────── */}
        <section style={{ position:'relative', overflow:'hidden' }}>
          <ParticleBackground />

          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '64px 60px 48px',
            maxWidth: 1200,
            margin: '0 auto',
            minHeight: 420,
          }}>

            {/* Left — floating atom */}
            <div style={{ display:'flex', justifyContent:'flex-start', alignItems:'center' }}>
              <div style={{
                width: 200, height: 200,
                animation: 'floatY 4.5s ease-in-out infinite',
              }}>
                <AtomIllustration />
              </div>
            </div>

            {/* Center — staggered text */}
            <div style={{ textAlign:'center', maxWidth:520, padding:'0 24px' }}>

              {/* Badge */}
              <div style={{
                ...fadeUpStyle(0),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                borderRadius: 20,
                border: '1px solid rgba(99,102,241,0.28)',
                background: 'rgba(238,242,255,0.85)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.11em',
                color: '#6366f1',
                marginBottom: 22,
                textTransform: 'uppercase',
              }}>
                <BoltIcon /> AI-Powered Materials Discovery
              </div>

              {/* Headline line 1 */}
              <div style={fadeUpStyle(150)}>
                <span style={{
                  display: 'block',
                  fontSize: 48,
                  fontWeight: 800,
                  color: '#111827',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}>
                  Next-Generation
                </span>
              </div>

              {/* Headline line 2 — shimmer gradient */}
              <div style={fadeUpStyle(280)}>
                <span style={{
                  display: 'block',
                  fontSize: 48,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                  marginBottom: 16,
                  backgroundImage: 'linear-gradient(90deg,#6366f1 0%,#38bdf8 40%,#818cf8 60%,#6366f1 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 4s linear infinite',
                }}>
                  Quantum Materials AI
                </span>
              </div>

              {/* Subtitle */}
              <div style={fadeUpStyle(420)}>
                <p style={{
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  color: '#6b7280',
                  margin: '0 auto',
                  maxWidth: 400,
                }}>
                  AI-driven Experimental Optimization Platform utilizing Gaussian Process
                  surrogate models and Active Learning to accelerate material discovery.
                </p>
              </div>
            </div>

            {/* Right — floating crystal */}
            <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center' }}>
              <div style={{
                width: 200, height: 200,
                animation: 'floatYReverse 4.5s ease-in-out infinite',
              }}>
                <CrystalIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURE CARDS ──────────────────────────────── */}
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 60px 40px',
          ...fadeUpStyle(560),
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 32px rgba(99,120,255,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            overflow: 'hidden',
          }}>
            {[
              { icon:<GearIcon/>, title:'Smarter Experiments', desc:'AI suggests the most informative experiments.', color:'#6366f1' },
              { icon:<ChartIcon/>, title:'Faster Discoveries', desc:'Active learning accelerates your research.', color:'#06b6d4', border:true },
              { icon:<ShieldIcon/>, title:'Reliable Insights', desc:'Uncertainty quantification you can trust.', color:'#818cf8' },
            ].map(({ icon,title,desc,color,border }, i) => (
              <div key={i} className="feat-card" style={{
                padding: '28px 32px',
                borderLeft: border ? '1px solid #f1f5f9' : undefined,
                borderRight: border ? '1px solid #f1f5f9' : undefined,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}>
                <div className="feat-icon" style={{
                  width:46, height:46, flexShrink:0,
                  background:`${color}15`,
                  borderRadius:12,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: color,
                }}>
                  {icon}
                </div>
                <div>
                  <p style={{ margin:'0 0 5px', fontWeight:700, fontSize:14.5, color:'#111827' }}>
                    {title}
                  </p>
                  <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.55 }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM DARK SECTION ─────────────────────────── */}
        <section style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 60px 60px',
          ...fadeUpStyle(700),
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#1e1b4b 0%,#1e3a5f 100%)',
            borderRadius: 20,
            padding: '40px 50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 32,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position:'absolute', top:-40, left:-40,
              width:220, height:220,
              background:'radial-gradient(circle,rgba(99,102,241,0.25) 0%,transparent 70%)',
              borderRadius:'50%', pointerEvents:'none',
              animation:'drift1 9s ease-in-out infinite',
            }}/>
            <div style={{
              position:'absolute', bottom:-40, right:160,
              width:180, height:180,
              background:'radial-gradient(circle,rgba(56,189,248,0.18) 0%,transparent 70%)',
              borderRadius:'50%', pointerEvents:'none',
              animation:'drift2 11s ease-in-out 2s infinite',
            }}/>

            <div style={{ maxWidth:320, position:'relative', zIndex:1 }}>
              <h2 style={{
                margin:'0 0 12px', fontSize:26, fontWeight:800,
                color:'white', lineHeight:1.2, letterSpacing:'-0.02em',
              }}>
                Built for Researchers,<br/>Powered by AI
              </h2>
              <p style={{ margin:0, fontSize:14, color:'rgba(200,210,255,0.80)', lineHeight:1.65 }}>
                Everything you need to optimize experiments and discover
                novel materials — all in one place.
              </p>
            </div>

            <div style={{ position:'relative', zIndex:1, flexShrink:0 }}>
              <DashboardPreview />
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Home;
