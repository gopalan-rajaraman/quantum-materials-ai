import React from 'react';
import { AUTH_STYLES } from './authStyles';

const IconHexagon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L29.86 9.5V24.5L16 32L2.14 24.5V9.5L16 2Z" fill="#6366f1" opacity="0.2" />
    <path d="M16 5L26.39 11V23L16 29L5.61 23V11L16 5Z" fill="#6366f1" />
    <path d="M16 9L22.93 13V19L16 23L9.07 19V13L16 9Z" fill="white" />
  </svg>
);

const LeftPanel = () => (
  <div style={{
    width: '50%', flexShrink: 0,
    background: 'linear-gradient(160deg,#f8faff 0%,#eef2ff 50%,#e0e7ff 100%)',
    display: 'flex', flexDirection: 'column',
    padding: '40px 60px',
    position: 'relative', overflow: 'hidden',
    borderRight: 'none',
  }}>
    <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: 80, left: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(167,139,250,0.20) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
    {[
      { top: '18%', left: '72%', size: 7, color: 'rgba(99,102,241,0.35)' },
      { top: '35%', left: '84%', size: 5, color: 'rgba(167,139,250,0.5)' },
      { top: '12%', left: '58%', size: 4, color: 'rgba(56,189,248,0.4)' },
      { top: '50%', left: '80%', size: 6, color: 'rgba(99,102,241,0.22)' },
    ].map((d, i) => (
      <div key={i} style={{ position: 'absolute', top: d.top, left: d.left, width: d.size, height: d.size, borderRadius: '50%', background: d.color }} />
    ))}

    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 40, position: 'relative', zIndex: 10 }}>
      <IconHexagon />
      <span style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>ResearchHub</span>
    </div>

    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '40px' }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 44, fontWeight: 900, color: '#1e1b4b', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        Built for<br />Researchers.
      </h1>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
        <img
          src="/researcher.png"
          alt="Researchers at work"
          style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain', display: 'block', mixBlendMode: 'darken' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
    </div>
  </div>
);

const AuthLayout = ({ children, footer }) => (
  <>
    <style>{AUTH_STYLES}</style>
    <div className="signup-root" style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: "'Inter',system-ui,sans-serif",
      background: '#f5f3ff',
    }}>
      <LeftPanel />
      <div style={{
        width: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '30px 40px',
        background: 'white',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {children}
          {footer}
        </div>
      </div>
    </div>
  </>
);

export default AuthLayout;
