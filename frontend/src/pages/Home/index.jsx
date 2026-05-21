import React from 'react';
import { Link } from 'react-router-dom';

/* ─── Inline SVG icons ─────────────────────────────────────── */
const AtomIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="4"/>
  </svg>
);

const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

/* ─── 3‑D Atom illustration (SVG) ──────────────────────────── */
const AtomIllustration = () => (
  <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
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
    {/* orbit rings */}
    <ellipse cx="110" cy="110" rx="95" ry="30" fill="none" stroke="url(#dotGrad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
    <ellipse cx="110" cy="110" rx="95" ry="30" fill="none" stroke="url(#dotGrad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" transform="rotate(60 110 110)"/>
    <ellipse cx="110" cy="110" rx="95" ry="30" fill="none" stroke="url(#dotGrad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" transform="rotate(120 110 110)"/>
    {/* central sphere */}
    <circle cx="110" cy="110" r="38" fill="url(#sphereGrad)" filter="url(#glow)"/>
    <circle cx="97" cy="97" r="10" fill="white" opacity="0.18"/>
    {/* orbit dots */}
    <circle cx="110" cy="80" r="6" fill="url(#dotGrad)" filter="url(#glow)"/>
    <circle cx="197" cy="120" r="5" fill="url(#dotGrad)" opacity="0.8"/>
    <circle cx="30" cy="105" r="5" fill="url(#dotGrad)" opacity="0.8"/>
    <circle cx="152" cy="58" r="5" fill="#a78bfa" opacity="0.9"/>
    <circle cx="68" cy="162" r="5" fill="#a78bfa" opacity="0.9"/>
    <circle cx="155" cy="163" r="4" fill="#67e8f9" opacity="0.8"/>
    <circle cx="62" cy="58" r="4" fill="#67e8f9" opacity="0.8"/>
  </svg>
);

/* ─── Crystal / lattice illustration (SVG) ─────────────────── */
const CrystalIllustration = () => (
  <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
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
    {/* lattice edges */}
    {[
      [110,50, 50,110],[110,50, 170,110],[110,50, 110,110],
      [50,110, 110,170],[170,110, 110,170],[110,110, 110,170],
      [50,110, 110,110],[170,110, 110,110],
      [110,170, 50,110],[110,170, 170,110],
    ].map(([x1,y1,x2,y2],i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(99,179,237,0.45)" strokeWidth="1.5"/>
    ))}
    {/* extended lattice */}
    <line x1="50" y1="110" x2="20" y2="75" stroke="rgba(99,179,237,0.25)" strokeWidth="1.2"/>
    <line x1="170" y1="110" x2="200" y2="75" stroke="rgba(99,179,237,0.25)" strokeWidth="1.2"/>
    <line x1="110" y1="50" x2="110" y2="20" stroke="rgba(99,179,237,0.25)" strokeWidth="1.2"/>
    <line x1="110" y1="170" x2="80" y2="200" stroke="rgba(99,179,237,0.25)" strokeWidth="1.2"/>
    <line x1="110" y1="170" x2="140" y2="200" stroke="rgba(99,179,237,0.25)" strokeWidth="1.2"/>
    {/* nodes */}
    {[
      [110,50,9,'nodeGrad'],[50,110,8,'nodeGrad'],[170,110,8,'nodeGrad'],
      [110,170,8,'nodeGrad'],[110,110,7,'nodeGrad2'],
      [20,75,6,'nodeGrad2'],[200,75,6,'nodeGrad2'],[110,20,6,'nodeGrad2'],
      [80,200,5,'nodeGrad2'],[140,200,5,'nodeGrad2'],
    ].map(([cx,cy,r,grad],i) => (
      <circle key={i} cx={cx} cy={cy} r={r}
        fill={`url(#${grad})`} filter="url(#glow2)"/>
    ))}
  </svg>
);

/* ─── Dashboard preview (bottom section) ───────────────────── */
const DashboardPreview = () => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 4px 24px rgba(99,120,255,0.10)',
    width: '100%',
    maxWidth: '400px',
  }}>
    {/* top bar */}
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {['#f87171','#fbbf24','#34d399'].map(c => (
        <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }}/>
      ))}
    </div>
    {/* fake rows */}
    {[80,60,90,50,70].map((w,i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 24, height: 6, background: '#e2e8f0', borderRadius: 4 }}/>
        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, maxWidth: `${w}%` }}/>
      </div>
    ))}
    {/* chart area */}
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      {/* line chart */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', borderRadius: 10, padding: '10px 8px', minHeight: 90 }}>
        <svg viewBox="0 0 120 60" style={{ width: '100%', height: 60 }}>
          <defs>
            <linearGradient id="line1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="100%" stopColor="#38bdf8"/>
            </linearGradient>
            <linearGradient id="line2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
          <polyline points="0,50 20,38 40,30 60,18 80,22 100,10 120,14"
            fill="none" stroke="url(#line1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="0,55 20,48 40,44 60,36 80,40 100,28 120,32"
            fill="none" stroke="url(#line2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* donut chart */}
      <div style={{ width: 80, background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 60 60" style={{ width: 60, height: 60 }}>
          <circle cx="30" cy="30" r="22" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
          <circle cx="30" cy="30" r="22" fill="none" stroke="url(#donutGrad)" strokeWidth="10"
            strokeDasharray="85 53" strokeLinecap="round" transform="rotate(-90 30 30)"/>
          <defs>
            <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="100%" stopColor="#38bdf8"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    {/* bottom avatar row */}
    <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}>
      {['#818cf8','#38bdf8','#34d399','#fb923c'].map((c, i) => (
        <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid white' }}/>
      ))}
      <div style={{ marginLeft: 'auto', height: 6, width: 60, background: '#e2e8f0', borderRadius: 4 }}/>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────── */
const Home = () => {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
      background: 'linear-gradient(160deg, #eef3ff 0%, #f0f7ff 40%, #e8f4fd 70%, #f5f0ff 100%)',
      overflowX: 'hidden',
    }}>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 40px',
        background: 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(200,215,255,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            <AtomIcon />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b', letterSpacing: '-0.01em' }}>
            Quantum Materials AI
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{
            padding: '8px 18px',
            fontSize: 14,
            fontWeight: 500,
            color: '#374151',
            textDecoration: 'none',
            borderRadius: 8,
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.target.style.background='rgba(99,102,241,0.07)'}
            onMouseLeave={e => e.target.style.background='transparent'}
          >
            Log In
          </Link>
          <Link to="/signup" style={{
            padding: '8px 22px',
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            textDecoration: 'none',
            borderRadius: 8,
            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { e.target.style.opacity='0.88'; e.target.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }}
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 0,
        padding: '64px 60px 40px',
        maxWidth: 1200,
        margin: '0 auto',
        minHeight: 420,
      }}>

        {/* Left 3D atom */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}>
          <div style={{ width: 200, height: 200, opacity: 0.92 }}>
            <AtomIllustration />
          </div>
        </div>

        {/* Center text */}
        <div style={{
          textAlign: 'center',
          maxWidth: 520,
          padding: '0 20px',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.30)',
            background: 'rgba(238,242,255,0.80)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#6366f1',
            marginBottom: 22,
            textTransform: 'uppercase',
          }}>
            <BoltIcon /> AI-Powered Materials Discovery
          </div>

          {/* Headline */}
          <h1 style={{ margin: '0 0 12px', lineHeight: 1.15 }}>
            <span style={{
              display: 'block',
              fontSize: 48,
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.025em',
            }}>
              Next-Generation
            </span>
            <span style={{
              display: 'block',
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              background: 'linear-gradient(90deg,#6366f1 0%,#38bdf8 60%,#818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Quantum Materials AI
            </span>
          </h1>

          {/* Subtitle */}
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

        {/* Right crystal */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}>
          <div style={{ width: 200, height: 200, opacity: 0.92 }}>
            <CrystalIllustration />
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ───────────────────────────────────── */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto 0',
        padding: '0 60px 40px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 4px 32px rgba(99,120,255,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          overflow: 'hidden',
        }}>
          {[
            {
              icon: <GearIcon />,
              title: 'Smarter Experiments',
              desc: 'AI suggests the most informative experiments.',
              color: '#6366f1',
            },
            {
              icon: <ChartIcon />,
              title: 'Faster Discoveries',
              desc: 'Active learning accelerates your research.',
              color: '#06b6d4',
              border: true,
            },
            {
              icon: <ShieldIcon />,
              title: 'Reliable Insights',
              desc: 'Uncertainty quantification you can trust.',
              color: '#818cf8',
            },
          ].map(({ icon, title, desc, color, border }, i) => (
            <div key={i} style={{
              padding: '28px 32px',
              borderLeft: border ? '1px solid #f1f5f9' : undefined,
              borderRight: border ? '1px solid #f1f5f9' : undefined,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}>
              <div style={{
                width: 46, height: 46, flexShrink: 0,
                background: `${color}15`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color,
              }}>
                {icon}
              </div>
              <div>
                <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: 14.5, color: '#111827' }}>
                  {title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM DARK SECTION ─────────────────────────────── */}
      <section style={{
        maxWidth: 1100,
        margin: '16px auto 0',
        padding: '0 60px 60px',
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
          {/* Background glow blobs */}
          <div style={{
            position: 'absolute', top: -40, left: -40,
            width: 220, height: 220,
            background: 'radial-gradient(circle,rgba(99,102,241,0.25) 0%,transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', bottom: -40, right: 160,
            width: 180, height: 180,
            background: 'radial-gradient(circle,rgba(56,189,248,0.18) 0%,transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}/>

          {/* Left text */}
          <div style={{ maxWidth: 320, position: 'relative', zIndex: 1 }}>
            <h2 style={{
              margin: '0 0 12px',
              fontSize: 26,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}>
              Built for Researchers,<br/>Powered by AI
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(200,210,255,0.80)', lineHeight: 1.65 }}>
              Everything you need to optimize experiments and discover
              novel materials — all in one place.
            </p>
          </div>

          {/* Right dashboard preview */}
          <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <DashboardPreview />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
