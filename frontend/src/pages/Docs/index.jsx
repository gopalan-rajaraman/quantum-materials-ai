import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, RotateCcw, BrainCircuit, Activity,
  ClipboardList, FlaskConical, ChevronDown, ChevronUp,
  ArrowRight, LayoutGrid, Brain, Sparkles, Hexagon,
  Rocket, Database, Eye, Target, LineChart, HelpCircle,
  UploadCloud, BookOpen, Shield, FileText,
  Zap, ChevronRight, ExternalLink
} from 'lucide-react';

// ─── Science Visuals ──────────────────────────────────────────────────────────
const CrystalSVG = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <svg viewBox="0 0 80 80" width="60" height="60">
      <g stroke="#94a3b8" strokeWidth="1.2" fill="none">
        <line x1="16" y1="24" x2="40" y2="12"/><line x1="40" y1="12" x2="64" y2="24"/>
        <line x1="16" y1="24" x2="16" y2="56"/><line x1="64" y1="24" x2="64" y2="56"/>
        <line x1="16" y1="56" x2="40" y2="68"/><line x1="64" y1="56" x2="40" y2="68"/>
        <line x1="40" y1="12" x2="40" y2="40"/>
        <line x1="16" y1="56" x2="40" y2="40"/><line x1="64" y1="56" x2="40" y2="40"/>
      </g>
      <g fill="#f59e0b"><circle cx="40" cy="12" r="4"/><circle cx="16" cy="56" r="4"/><circle cx="64" cy="56" r="4"/></g>
      <g fill="#60a5fa"><circle cx="16" cy="24" r="4"/><circle cx="64" cy="24" r="4"/><circle cx="40" cy="68" r="4"/><circle cx="40" cy="40" r="4"/></g>
    </svg>
    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>WS₂ Crystal</span>
  </div>
);

const GaussianSVG = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <svg viewBox="0 0 100 60" width="88" height="52">
      <path d="M0,30 Q25,0 50,30 T100,30" fill="#e0e7ff" opacity="0.6"/>
      <path d="M0,30 Q25,20 50,30 T100,30" fill="#e0e7ff" opacity="0.4"/>
      <path d="M0,30 Q25,10 50,30 T100,30" fill="none" stroke="#6366f1" strokeWidth="2.5"/>
      <circle cx="20" cy="18" r="3" fill="#1e293b"/>
      <circle cx="60" cy="38" r="3" fill="#1e293b"/>
      <circle cx="40" cy="30" r="3" fill="#1e293b"/>
    </svg>
    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Gaussian Process</span>
  </div>
);

const AcquisitionSVG = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <svg viewBox="0 0 100 60" width="88" height="52">
      <path d="M0,50 Q30,50 40,20 T70,50 T100,50" fill="none" stroke="#a855f7" strokeWidth="2.5"/>
      <line x1="58" y1="8" x2="58" y2="50" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 2"/>
      <circle cx="58" cy="26" r="3.5" fill="#22c55e"/>
    </svg>
    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Acquisition (EI)</span>
  </div>
);

const FlaskAI = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div style={{ position: 'relative', width: 46, height: 52 }}>
      <FlaskConical size={46} style={{ color: '#6366f1' }} strokeWidth={1.5}/>
      <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)' }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', backgroundColor: '#4f46e5', padding: '1px 4px', borderRadius: 3 }}>AI</span>
      </div>
    </div>
    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Suggest</span>
  </div>
);

// ─── TOC ─────────────────────────────────────────────────────────────────────
const TOC_ITEMS = [
  { id: 'overview',               label: 'Overview' },
  { id: 'start-here',            label: 'Start Here' },
  { id: 'quick-start',           label: 'Quick Start' },
  { id: 'dataset-setup',         label: 'Dataset Setup' },
  { id: 'column-mapping',        label: 'Column Mapping' },
  { id: 'bayesian-optimization', label: 'Bayesian Optimization' },
  { id: 'logging-results',       label: 'Logging Results' },
  { id: 'results-models',        label: 'Results & Models' },
  { id: 'faq',                   label: 'FAQ' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Docs() {
  const [active, setActive] = useState('overview');
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const ids = TOC_ITEMS.map(t => t.id);
    const onScroll = () => {
      let cur = 'overview';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 100) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goto = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  const faqs = [
    { q: 'How many experiments do I need?', a: 'Typically 10–15 initial experiments are enough to seed the Gaussian Process model. More data means better suggestions.' },
    { q: 'Can I upload Excel files?', a: 'Yes — both .csv and .xlsx are supported. The first row must contain column headers with no merged cells.' },
    { q: 'Can I edit logged experiments?', a: 'Yes. Go to the Experiments tab to edit or delete individual entries.' },
    { q: 'What if values are missing?', a: 'Complete rows are required for GP training. Remove or impute rows with missing values before uploading.' },
    { q: 'How does BO-LAB pick the next experiment?', a: 'We use Expected Improvement (EI) — an acquisition function that balances exploration and exploitation across the parameter space.' },
    { q: 'Is my data private?', a: 'Yes. Your experimental data is stored securely and never shared with other users or third parties.' },
  ];

  const workflowSteps = [
    { icon: UploadCloud,   label: 'Upload Data',    c: '#2563eb', bg: '#eff6ff' },
    { icon: LayoutGrid,    label: 'Map Columns',    c: '#4f46e5', bg: '#eef2ff' },
    { icon: Activity,      label: 'Train GP',       c: '#7c3aed', bg: '#faf5ff' },
    { icon: BrainCircuit,  label: 'Get Suggestion', c: '#d97706', bg: '#fffbeb' },
    { icon: FlaskConical,  label: 'Run Experiment', c: '#059669', bg: '#f0fdf4' },
    { icon: ClipboardList, label: 'Log Result',     c: '#0d9488', bg: '#f0fdfa' },
    { icon: RotateCcw,     label: 'Repeat',         c: '#2563eb', bg: '#eff6ff' },
  ];

  /* ── layout ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minHeight: '100vh', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' }}>

      {/* ── MAIN DOCS CONTENT ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, padding: '40px 48px 80px' }}>

        {/* HERO */}
        <section id="overview" style={{ scrollMarginTop: 80, marginBottom: 56 }}>

          {/* Badge */}
          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 999, marginBottom: 18 }}>
            BO-LAB Documentation
          </span>

          {/* Heading + sphere row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 22 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                Next Generation{' '}
                <span style={{ color: '#2563eb' }}>
                  Bayesian Optimization
                </span>
                {' '}for Smarter Synthesis
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
                AI-driven Experimental Optimization Platform utilizing Gaussian Process surrogate models and Active Learning to accelerate material discovery.
              </p>
            </div>

            {/* Blue sphere — matches screenshot */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: 'radial-gradient(circle at 32% 32%, #93c5fd, #3b82f6 45%, #1d4ed8 80%)',
                boxShadow: '0 24px 60px rgba(37,99,235,0.38), inset 0 -10px 24px rgba(0,0,0,0.18)',
                position: 'relative'
              }}>
                {/* Orbit rings */}
                <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px solid rgba(147,197,253,0.4)', transform: 'rotateX(70deg) rotateZ(15deg)' }} />
                <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid rgba(147,197,253,0.25)', transform: 'rotateX(70deg) rotateZ(-20deg)' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6)' }} />
                <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #bfdbfe, #60a5fa)', marginTop: 5 }} />
              </div>
            </div>
          </div>

          {/* Tag pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {[
              { l: 'Bayesian Optimization', bg: '#eff6ff', c: '#2563eb', b: '#bfdbfe' },
              { l: 'Gaussian Processes',    bg: '#f0fdf4', c: '#16a34a', b: '#bbf7d0' },
              { l: 'Quantum Materials',     bg: '#faf5ff', c: '#7c3aed', b: '#ddd6fe' },
              { l: 'Active Learning',       bg: '#fff7ed', c: '#ea580c', b: '#fed7aa' },
            ].map(({ l, bg, c, b }) => (
              <span key={l} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 999, backgroundColor: bg, color: c, border: `1px solid ${b}` }}>{l}</span>
            ))}
          </div>

          {/* Science diagram strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 28px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 }}>
            <GaussianSVG />
            <ArrowRight size={16} style={{ color: '#cbd5e1', flexShrink: 0 }} />
            <AcquisitionSVG />
            <ArrowRight size={16} style={{ color: '#cbd5e1', flexShrink: 0 }} />
            <FlaskAI />
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { dash: true,  label: 'GP Mean',     color: '#6366f1' },
                { dot: true,   label: 'Observations',color: '#1e293b' },
                { box: true,   label: 'Uncertainty', color: '#e0e7ff' },
              ].map(({ dash, dot, box, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                  {dash && <div style={{ width: 16, height: 2, backgroundColor: color, borderRadius: 1 }} />}
                  {dot  && <div style={{ width: 8, height: 8, backgroundColor: color, borderRadius: '50%' }} />}
                  {box  && <div style={{ width: 16, height: 10, backgroundColor: color, borderRadius: 2, border: '1px solid #c7d2fe' }} />}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* START HERE */}
        <section id="start-here" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Start here</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, margin: '0 0 24px' }}>Pick a guide to get up and running quickly.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { id: 'quick-start',         icon: Rocket,      bg: '#eef2ff', c: '#4338ca', b: '#c7d2fe', title: 'Quick Start',             desc: 'Go from zero to your first BO suggestion in under 10 minutes.' },
              { id: 'dataset-setup',       icon: Database,    bg: '#f0fdfa', c: '#0f766e', b: '#99f6e4', title: 'Prepare Your Dataset',     desc: 'Format your CSV or Excel file correctly for BO-LAB.' },
              { id: 'running-experiments', icon: FlaskConical,bg: '#faf5ff', c: '#7c3aed', b: '#ddd6fe', title: 'Run Your First Experiment', desc: 'Upload data, map columns, and generate your first AI suggestion.' },
              { id: 'results-models',      icon: Activity,    bg: '#fff7ed', c: '#c2410c', b: '#fdba74', title: 'Understand Results',        desc: 'Read optimization results and interpret model predictions.' },
            ].map(({ id, icon: Icon, bg, c, b, title, desc }) => (
              <button key={id} onClick={() => goto(id)}
                style={{ textAlign: 'left', padding: '20px 22px', borderRadius: 14, border: `1px solid ${b}`, backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 42, height: 42, backgroundColor: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={19} style={{ color: c }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 5 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.6, marginBottom: 12 }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: c }}>
                  Read guide <ArrowRight size={12} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* QUICK START */}
        <section id="quick-start" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>Getting Started</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Quick Start</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, margin: '0 0 22px' }}>Follow these four steps to run your first Bayesian Optimization experiment on BO-LAB.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              { n: '1', title: 'Create an account', desc: 'Sign up at BO-LAB. No credit card required. Your data is private and secure.' },
              { n: '2', title: 'Upload your dataset', desc: 'Prepare a CSV or Excel file with your experimental data. Each row is one experiment.' },
              { n: '3', title: 'Map your columns', desc: 'Tell BO-LAB which columns are features (inputs) and which is your optimization target.' },
              { n: '4', title: 'Get your first suggestion', desc: 'BO-LAB trains a Gaussian Process model and returns the next best parameters to try.' },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 14, padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 28, height: 28, backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 700, fontSize: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{n}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
              <Rocket size={14}/> Create free account
            </Link>
            <button onClick={() => goto('dataset-setup')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: 13, padding: '10px 20px', borderRadius: 8, backgroundColor: '#fff', cursor: 'pointer' }}>
              Prepare dataset <ChevronRight size={14}/>
            </button>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* DATASET SETUP */}
        <section id="dataset-setup" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>Working with Data</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Dataset Formatting</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, margin: '0 0 20px' }}>Each row represents one experiment. Columns are your controllable parameters (features) and measured outcomes (target).</p>

          <div style={{ display: 'flex', gap: 20, padding: 20, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10 }}>Supported formats</div>
              {['.csv — Comma-separated values', '.xlsx — Microsoft Excel workbook'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }}/>{f}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10 }}>File requirements</div>
              {['First row must be column headers','No merged cells','No blank rows or columns','Numbers without units (850, not "850 °C")'].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', marginBottom: 6 }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }}/>{r}
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Example: WS₂ CVD Dataset</div>
            <table style={{ width: '100%', fontSize: 13, textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Temp (°C)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Pressure (Torr)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Ar Flow (sccm)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>Time (min)</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#4338ca', backgroundColor: '#eef2ff', borderLeft: '1px solid #c7d2fe' }}>PL FWHM ← target</th>
                </tr>
              </thead>
              <tbody>
                {[[850,10,20,20,18.4],[900,15,30,30,16.7],[950,20,40,25,15.1],[875,12,25,35,17.2]].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {row.slice(0,4).map((v,j) => <td key={j} style={{ padding: '9px 14px', color: '#475569' }}>{v}</td>)}
                    <td style={{ padding: '9px 14px', fontWeight: 600, color: '#4338ca', backgroundColor: '#f5f3ff', borderLeft: '1px solid #e0e7ff' }}>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* COLUMN MAPPING */}
        <section id="column-mapping" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Column Mapping</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, margin: '0 0 20px' }}>After uploading, label each column as one of three roles:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {[
              { icon: Target,    bg: '#f0fdf4', c: '#16a34a', b: '#bbf7d0', title: 'Feature', desc: 'Input parameters you control — temperature, pressure, flow, time.' },
              { icon: LineChart, bg: '#eef2ff', c: '#4338ca', b: '#c7d2fe', title: 'Target',  desc: 'The outcome to optimize (e.g. PL FWHM). One target column only.' },
              { icon: Eye,       bg: '#f8fafc', c: '#64748b', b: '#e2e8f0', title: 'Ignore',  desc: 'Metadata like notes or sample IDs — not used in the model.' },
            ].map(({ icon: Icon, bg, c, b, title, desc }) => (
              <div key={title} style={{ padding: 16, borderRadius: 12, border: `1px solid ${b}`, backgroundColor: '#fff' }}>
                <div style={{ width: 36, height: 36, backgroundColor: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon size={16} style={{ color: c }}/>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* BAYESIAN OPTIMIZATION */}
        <section id="bayesian-optimization" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>Experiments</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Bayesian Optimization</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, margin: '0 0 22px' }}>Bayesian Optimization is a sample-efficient strategy for optimizing expensive experiments — perfect for physical lab work.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '18px 22px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: 20 }}>
            {workflowSteps.map(({ icon: Icon, label, c, bg }, idx) => (
              <React.Fragment key={idx}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 66 }}>
                  <div style={{ width: 42, height: 42, backgroundColor: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <Icon size={19} style={{ color: c }} strokeWidth={1.5}/>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </div>
                {idx < workflowSteps.length - 1 && <ArrowRight size={14} style={{ color: '#cbd5e1', marginBottom: 18, flexShrink: 0 }}/>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: BookOpen,  c: '#2563eb', bg: '#eff6ff', title: 'Learn from data',                  desc: 'A GP model trains on your existing results, learning how parameters relate to outcomes.' },
              { icon: Activity,  c: '#7c3aed', bg: '#faf5ff', title: 'Predict & quantify uncertainty',    desc: 'The GP predicts performance across the whole parameter space with calibrated uncertainty.' },
              { icon: Target,    c: '#16a34a', bg: '#f0fdf4', title: 'Acquisition: Expected Improvement', desc: 'EI balances exploiting known high-performance regions vs. exploring uncertain areas.' },
              { icon: Sparkles,  c: '#d97706', bg: '#fffbeb', title: 'Suggest the next experiment',       desc: 'The parameter set with the highest EI score is recommended as your next lab run.' },
            ].map(({ icon: Icon, c, bg, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, padding: '14px 16px', border: '1px solid #f1f5f9', borderRadius: 12, backgroundColor: '#fff' }}>
                <div style={{ width: 38, height: 38, backgroundColor: bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: c }}/>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* LOGGING RESULTS */}
        <section id="logging-results" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Logging Results</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, margin: '0 0 20px' }}>After running a suggested experiment in the lab, log your measured outcome back into BO-LAB to update the model.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { icon: Sparkles,     c: '#16a34a', bg: '#f0fdf4', title: 'Suggestion generated', desc: 'BO-LAB recommends the next experiment parameters.' },
              { icon: FlaskConical, c: '#2563eb', bg: '#eff6ff', title: 'Run in lab',           desc: 'Perform the experiment with the suggested parameters.' },
              { icon: ClipboardList,c: '#7c3aed', bg: '#faf5ff', title: 'Log result',           desc: 'Enter your measured outcome (e.g. PL FWHM) back into BO-LAB.' },
              { icon: RotateCcw,    c: '#d97706', bg: '#fffbeb', title: 'Model retrains',        desc: 'GP updates automatically and yields a better next suggestion.' },
            ].map(({ icon: Icon, c, bg, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 12, padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 34, height: 34, backgroundColor: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} style={{ color: c }}/>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            <strong>Tip:</strong> Don't skip logging failed experiments — they teach the model where <em>not</em> to search.
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* RESULTS & MODELS */}
        <section id="results-models" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>Results & Models</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Results & Models</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, margin: '0 0 18px' }}>The Results tab shows experiment history, best parameters found, and model convergence over iterations.</p>
          <div style={{ padding: '18px 20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 18 }}>
            {['Best experiment found so far and its parameters','Full experiment history with outcome values','Model convergence chart — improvement over iterations','Predicted vs. actual scatter plot','Download report as PDF or Excel'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', marginBottom: 8 }}>
                <CheckCircle2 size={14} style={{ color: '#4f46e5', flexShrink: 0, marginTop: 1 }}/> {item}
              </div>
            ))}
          </div>
          <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg,#eef2ff,#faf5ff)', border: '1px solid #c7d2fe', borderRadius: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} style={{ color: '#4f46e5' }}/> Best practices
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Upload at least 10 initial experiments','Keep units consistent across rows','Log every result, including failures',"Don't remove failed experiments",'More data = better suggestions','Use BO-LAB export for reproducibility'].map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                  <CheckCircle2 size={13} style={{ color: '#4f46e5', flexShrink: 0, marginTop: 2 }}/> {tip}
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 56px' }} />

        {/* FAQ */}
        <section id="faq" style={{ scrollMarginTop: 80, marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>FAQ</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Frequently Asked Questions</h2>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, margin: '0 0 22px' }}>Common questions about using BO-LAB.</p>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: idx < faqs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <button onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', fontSize: 13, fontWeight: 600, color: '#374151', backgroundColor: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  {faq.q}
                  {openFaq === idx
                    ? <ChevronUp size={15} style={{ color: '#4f46e5', flexShrink: 0, marginLeft: 12 }}/>
                    : <ChevronDown size={15} style={{ color: '#94a3b8', flexShrink: 0, marginLeft: 12 }}/>}
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 20px 14px', fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.7, borderTop: '1px solid #f8fafc', backgroundColor: '#f8fafc' }}>
                    <div style={{ paddingTop: 12 }}>{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5,#7c3aed)', borderRadius: 20, padding: '40px', textAlign: 'center' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>Ready to optimize your experiments?</h3>
          <p style={{ fontSize: 13, color: '#bfdbfe', margin: '0 0 24px' }}>Sign up free and run your first Bayesian Optimization experiment today.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Link to="/signup" style={{ backgroundColor: '#fff', color: '#1d4ed8', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 9, textDecoration: 'none' }}>Get started free</Link>
            <button onClick={() => goto('quick-start')} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.35)', fontWeight: 600, fontSize: 13, padding: '10px 22px', borderRadius: 9, backgroundColor: 'transparent', cursor: 'pointer' }}>Read Quick Start</button>
          </div>
        </div>
      </div>

      {/* ── RIGHT TOC ─────────────────────────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0, padding: '40px 0 40px 24px', borderLeft: '1px solid #f1f5f9' }}>
        <div style={{ position: 'sticky', top: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 12 }}>On this page</div>
          <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0 }}>
            {TOC_ITEMS.map(({ id, label }) => {
              const isActive = active === id;
              return (
                <li key={id} style={{ marginBottom: 2 }}>
                  <a href={`#${id}`} onClick={e => { e.preventDefault(); goto(id); }} style={{
                    display: 'block', fontSize: 13, padding: '5px 10px 5px 11px',
                    borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                    color: isActive ? '#1d4ed8' : '#64748b',
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: 'none',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    borderRadius: '0 6px 6px 0',
                    transition: 'all 0.15s'
                  }}>
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>


        </div>
      </div>
    </div>
  );
}
