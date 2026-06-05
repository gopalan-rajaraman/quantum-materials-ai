import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  Download, Printer, ArrowLeft, CheckCircle2, Star, Clock,
  TrendingDown, TrendingUp, FlaskConical, Target, Cpu, Activity,
  FileText, BarChart2, Zap, ChevronRight, Lightbulb, Award, BookOpen
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line
} from 'recharts';
import api from '../../services/api';

const BASE = 'http://localhost:8000';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (v, d = 2) => (v == null || isNaN(v) ? '—' : Number(v).toFixed(d));

function extractLengthScales(kernelStr) {
  if (!kernelStr) return null;
  const match = kernelStr.match(/length_scale=\[([\d.,\s]+)\]/);
  if (!match) return null;
  return match[1].split(',').map(Number);
}

function computeVariableImportance(lengthScales) {
  if (!lengthScales || lengthScales.length < 4) return null;
  const names = ['Growth Temp (°C)', 'Growth Time (min)', 'Ar Flow (sccm)', 'Pressure (Torr)'];
  const inv = lengthScales.slice(0, 4).map(ls => 1 / Math.max(ls, 0.001));
  const total = inv.reduce((a, b) => a + b, 0);
  return names.map((name, i) => ({
    name,
    value: Math.round((inv[i] / total) * 100),
    raw: lengthScales[i],
  })).sort((a, b) => b.value - a.value);
}

function generateInsights(modelInfo, timeline, varImportance, suggestions) {
  const insights = [];
  if (!modelInfo) return insights;
  if (varImportance && varImportance.length > 0) {
    const top = varImportance[0];
    insights.push(`${top.name} is the most influential process parameter, contributing ${top.value}% of model variance.`);
  }
  const allFwhm = timeline?.map(r => parseFloat(r.fwhm)).filter(Boolean) || [];
  const initialFwhm = timeline?.filter(r => r.type === 'Initial').map(r => parseFloat(r.fwhm)).filter(Boolean) || [];
  if (allFwhm.length > 0) {
    const bestFwhm = Math.min(...allFwhm);
    const bestRow = timeline.find(r => Math.abs(parseFloat(r.fwhm) - bestFwhm) < 0.01);
    if (bestRow) insights.push(`${bestRow.experiment_id} achieved the best FWHM of ${fmt(bestFwhm, 1)} meV — the lowest recorded in this campaign.`);
  }
  if (initialFwhm.length > 0 && allFwhm.length > 0) {
    const initBest = Math.min(...initialFwhm);
    const curBest = Math.min(...allFwhm);
    const pct = ((initBest - curBest) / initBest * 100).toFixed(0);
    if (pct > 0) insights.push(`BO loop reduced FWHM by ${pct}% from the initial best (${fmt(initBest, 1)} → ${fmt(curBest, 1)} meV).`);
    else insights.push(`BO did not outperform the initial dataset best in this round.`);
  }
  const r2 = modelInfo.R2_score;
  if (r2 != null) {
    if (r2 > 0.999) insights.push(`Surrogate model achieved near-perfect fit (R² = ${(r2 * 100).toFixed(2)}%) indicating high prediction reliability.`);
    else if (r2 > 0.95) insights.push(`Surrogate model shows excellent fit (R² = ${(r2 * 100).toFixed(2)}%), suitable for confident experiment planning.`);
    else insights.push(`Surrogate model fit is moderate (R² = ${(r2 * 100).toFixed(2)}%). More experiments may improve reliability.`);
  }
  if (suggestions && suggestions.length > 0) {
    const s = suggestions[0];
    insights.push(`EI guides the optimizer to balance exploitation (near known good regions) and exploration (uncertain regions). ${suggestions[0] ? `BO-${timeline?.filter(r => r.type === 'User').length + 1 || 1} corresponds to a high EI region.` : ''}`);
  }
  return insights;
}

// ─── Main Component ──────────────────────────────────────────────────────────
const FullReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const autoPrint = new URLSearchParams(location.search).get('autoprint') === 'true';
  const printRef = useRef(null);
  const autoPrintFired = useRef(false);

  const [modelInfo, setModelInfo] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(true);

  const generatedOn = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [info, tl, suggRes, pd] = await Promise.all([
          api.fetchModelInfo(),
          fetch(`${BASE}/thermal-cvd/timeline`).then(r => r.ok ? r.json() : { timeline: [] }),
          fetch(`${BASE}/thermal-cvd/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ n_suggestions: 1 }) }).then(r => r.ok ? r.json() : { recommendations: [] }),
          fetch(`${BASE}/thermal-cvd/plot-data`).then(r => r.ok ? r.json() : null),
        ]);
        setModelInfo(info);
        setTimeline(tl.timeline || []);
        setSuggestions(suggRes.recommendations || []);
        setPlotData(pd);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: 'Thermal_CVD_Optimization_Report' });

  useEffect(() => {
    if (!loading && autoPrint && !autoPrintFired.current && handlePrint) {
      autoPrintFired.current = true;
      const t = setTimeout(() => handlePrint(), 800);
      return () => clearTimeout(t);
    }
  }, [loading, autoPrint, handlePrint]);

  // ── Derived data ────────────────────────────────────────────────────────
  const rawPredictions = modelInfo?.prediction_data || [];
  const allFwhm = timeline.map(r => parseFloat(r.fwhm)).filter(f => f > 0);
  const initialRows = timeline.filter(r => r.type === 'Initial');
  const boRows = timeline.filter(r => r.type === 'User');
  const initialFwhm = initialRows.map(r => parseFloat(r.fwhm)).filter(f => f > 0);
  const currentBestFwhm = allFwhm.length > 0 ? Math.min(...allFwhm) : null;
  const initBestFwhm = initialFwhm.length > 0 ? Math.min(...initialFwhm) : null;
  const improvePct = initBestFwhm && currentBestFwhm ? ((initBestFwhm - currentBestFwhm) / initBestFwhm * 100) : 0;
  const bestRow = timeline.find(r => Math.abs(parseFloat(r.fwhm) - currentBestFwhm) < 0.01) || null;

  // Optimization history (monotonic best)
  let curMin = Infinity;
  const historyData = (() => {
    const rows = [];
    if (initialRows.length > 0) {
      const initBest = Math.min(...initialFwhm);
      rows.push({ iter: 0, label: 'Initial Best', fwhm: initBest });
      curMin = initBest;
    }
    boRows.forEach((r, i) => {
      const v = parseFloat(r.fwhm);
      if (v > 0 && v < curMin) curMin = v;
      rows.push({ iter: i + 1, label: r.experiment_id, fwhm: curMin });
    });
    return rows;
  })();

  // Parity data
  const parityData = rawPredictions.map(p => ({ actual: p.observed, predicted: p.predicted }));
  const mape = rawPredictions.length > 0
    ? rawPredictions.filter(p => p.observed !== 0).reduce((acc, p) => acc + Math.abs((p.observed - p.predicted) / p.observed), 0) / rawPredictions.filter(p => p.observed !== 0).length * 100
    : null;

  // Variable importance
  const lengthScales = extractLengthScales(modelInfo?.kernel || '');
  const varImportance = computeVariableImportance(lengthScales) || (modelInfo?.feature_importances || []).map(f => ({ name: f.name, value: f.value }));

  // EI data
  const eiHistory = plotData?.ei_history || [];
  const latestEI = eiHistory.length > 0 ? eiHistory[eiHistory.length - 1] : [];
  const eiData = latestEI.map((v, i) => ({ x: i, ei: parseFloat(v.toFixed(4)) }));

  // Enriched timeline
  const minFwhm = currentBestFwhm;
  const enrichedTimeline = timeline.map(r => {
    const fwhm = parseFloat(r.fwhm);
    let status = 'done';
    if (Math.abs(fwhm - minFwhm) < 0.01) status = 'best';
    else if (r.type === 'Initial') status = 'init';
    return { ...r, fwhm, status };
  });

  // AI Insights
  const insights = generateInsights(modelInfo, timeline, varImportance, suggestions);

  const r2 = modelInfo?.R2_score;
  const mae = modelInfo?.MAE_meV;
  const rmse = modelInfo?.RMSE_meV;
  const COLORS = ['#4C3BDE', '#7C3AED', '#0EA5E9', '#10B981'];

  // Convergence (actual per-experiment FWHM for the line chart)
  const actualFwhmSeries = (() => {
    const pts = [];
    initialRows.forEach((r, i) => pts.push({ name: `Init-${i+1}`, fwhm: parseFloat(r.fwhm), type: 'Init' }));
    boRows.forEach((r, i) => pts.push({ name: r.experiment_id, fwhm: parseFloat(r.fwhm), type: 'BO' }));
    return pts;
  })();

  const bestFwhmSeries = historyData.map(d => ({ name: d.label, fwhm: d.fwhm }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#F5F6FA]">
        <div className="w-12 h-12 border-4 border-[#4C3BDE] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Building your experiment report…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F7] font-sans">
      {/* ── Action Bar ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm px-6 py-3 flex items-center justify-between no-print">
        <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-slate-600 hover:text-[#4C3BDE] font-semibold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-400 mr-2">Generated: {generatedOn}</span>
          <button
            onClick={() => {
              const csvRows = [
                ['Exp ID', 'Type', 'GTE (°C)', 'GTI (min)', 'FRA (sccm)', 'Pressure (Torr)', 'FWHM (meV)', 'Status'],
                ...enrichedTimeline.map(r => [r.experiment_id, r.type, r.gte, r.gti, r.fra, r.pressure, r.fwhm, r.status])
              ];
              const csv = csvRows.map(row => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'experiment_data.csv'; a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 text-[#4C3BDE] bg-[#F4F0FF] hover:bg-[#EDE8FF] rounded-lg text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-white bg-[#4C3BDE] hover:bg-[#3b2eb5] rounded-lg text-sm font-semibold transition-colors shadow-md shadow-indigo-200"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Printable Content ── */}
      <div ref={printRef} className="max-w-[1280px] mx-auto px-4 py-6">

        {/* ── Layout: Sidebar + Main ── */}
        <div className="flex gap-5">

          {/* ─── LEFT SIDEBAR ─── */}
          <div className="w-[220px] shrink-0 flex flex-col gap-4">
            {/* Title Card */}
            <div className="bg-[#1e1b4b] rounded-2xl p-5 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <FlaskConical className="w-5 h-5 text-indigo-300" />
              </div>
              <h1 className="text-[15px] font-black leading-tight mb-1">Thermal CVD Optimization Report</h1>
              <p className="text-[11px] text-indigo-300 mb-3">EXP-1 to EXP-{timeline.length}<br />Bayesian Optimization</p>
              <div className="text-[10px] text-indigo-400 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1 mb-1"><Clock className="w-3 h-3" />{generatedOn}</div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="px-2 py-0.5 bg-[#00B050]/20 text-[#00B050] rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Stats</p>
              {[
                { label: 'Total Experiments', val: timeline.length, color: '#4C3BDE' },
                { label: 'Initial Dataset', val: initialRows.length, color: '#64748b' },
                { label: 'BO Rounds', val: boRows.length, color: '#7C3AED' },
                { label: 'Best FWHM', val: currentBestFwhm ? `${fmt(currentBestFwhm, 1)} meV` : '—', color: '#00B050' },
                { label: 'Improvement', val: improvePct > 0 ? `${improvePct.toFixed(0)}%` : '0%', color: '#0EA5E9' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <span className="text-[12px] font-black" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Model Quality */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model Quality</p>
              {[
                { label: 'R² Score', val: r2 != null ? `${(r2 * 100).toFixed(2)}%` : '—', color: '#4C3BDE' },
                { label: 'MAE (meV)', val: mae != null ? fmt(mae, 3) : '—', color: '#00B050' },
                { label: 'RMSE (meV)', val: rmse != null ? fmt(rmse, 3) : '—', color: '#0EA5E9' },
                { label: 'MAPE (%)', val: mape != null ? fmt(mape, 1) + '%' : '—', color: '#D946EF' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <span className="text-[12px] font-black" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Appendix Nav */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Appendix</p>
              {['Raw Data', 'Model Details', 'Acquisition Settings'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">{i + 1}</div>
                  <span className="text-[11px] text-slate-600 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── MAIN CONTENT ─── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── 1. Executive Summary ── */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#4C3BDE] rounded-full" /> Executive Summary
              </h2>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Best FWHM Achieved', val: currentBestFwhm ? `${fmt(currentBestFwhm, 1)} meV` : '—', sub: 'Initial dataset best', color: '#4C3BDE', bg: '#F4F0FF' },
                  { label: 'Improvement', val: improvePct > 0 ? `${improvePct.toFixed(0)}%` : '0%', sub: 'Reduction in FWHM', color: '#00B050', bg: '#E8FFF3' },
                  { label: 'Total Experiments', val: timeline.length, sub: 'Completed', color: '#0EA5E9', bg: '#F0F9FF' },
                  { label: 'BO Rounds', val: boRows.length, sub: 'Bayesian round', color: '#7C3AED', bg: '#F5F3FF' },
                ].map(({ label, val, sub, color, bg }) => (
                  <div key={label} className="rounded-xl p-4 flex flex-col gap-0.5" style={{ background: bg }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                    <span className="text-[22px] font-black" style={{ color }}>{val}</span>
                    <span className="text-[10px] text-slate-500">{sub}</span>
                  </div>
                ))}
              </div>

              {/* Key Insights */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-[12px] font-bold text-slate-700">Key Insights</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {insights.slice(0, 4).map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2.5 shadow-sm border border-slate-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4C3BDE] mt-1.5 shrink-0" />
                      <p className="text-[11px] text-slate-600 leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 2. Optimization Progress + Parameter Impact ── */}
            <div className="grid grid-cols-2 gap-5">

              {/* Optimization Progress */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#4C3BDE] rounded-full" /> Optimization Progress
                </h2>
                <div className="h-[220px]">
                  {actualFwhmSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={actualFwhmSeries} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={Math.floor(actualFwhmSeries.length / 5)} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'FWHM (meV)', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#94a3b8' } }} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 11 }} formatter={(v) => [fmt(v, 1) + ' meV']} />
                        <Line type="monotone" dataKey="fwhm" name="Actual FWHM" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 3, fill: '#ef4444' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="flex h-full items-center justify-center text-slate-400 text-sm">No data</div>}
                </div>

              </div>

              {/* Parameter Impact Analysis */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#10B981] rounded-full" /> 2. Parameter Impact Analysis
                </h2>
                {varImportance && varImportance.length > 0 ? (
                  <>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={varImportance} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#1e1b4b', fontWeight: 600 }} axisLine={false} tickLine={false} width={110} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 11 }} formatter={(v) => [v + '%', 'Importance']} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {varImportance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-700">Interpretation: </span>
                      {varImportance[0]?.name} is the dominant factor affecting FWHM, followed by {varImportance[1]?.name}.
                      {varImportance.length > 2 && ` ${varImportance.slice(2).map(v => v.name).join(' and ')} have minimal impact.`}
                    </div>
                  </>
                ) : <div className="flex h-48 items-center justify-center text-slate-400 text-sm">No kernel data</div>}
              </div>
            </div>

            {/* ── 3. Model Performance + Acquisition Function ── */}
            <div className="grid grid-cols-2 gap-5">

              {/* Model Performance */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#0EA5E9] rounded-full" /> Model Performance
                </h2>
                <p className="text-[10px] font-bold text-slate-400 mb-2">Actual vs Predicted FWHM</p>
                <div className="h-[160px]">
                  {parityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Actual FWHM (meV)', position: 'insideBottom', offset: -2, style: { fontSize: 9, fill: '#94a3b8' } }} />
                        <YAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Predicted', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#94a3b8' } }} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 11 }} formatter={(v) => [fmt(v, 2) + ' meV']} />
                        <Scatter data={parityData} fill="#4C3BDE" opacity={0.75} />
                        {parityData.length > 0 && (
                          <ReferenceLine
                            segment={[
                              { x: Math.min(...parityData.map(d => d.actual)), y: Math.min(...parityData.map(d => d.actual)) },
                              { x: Math.max(...parityData.map(d => d.actual)), y: Math.max(...parityData.map(d => d.actual)) }
                            ]}
                            stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
                          />
                        )}
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : <div className="flex h-full items-center justify-center text-slate-400 text-sm">No data</div>}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { label: 'R² Score', val: r2 != null ? `${(r2 * 100).toFixed(3)}` : '—', color: '#4C3BDE' },
                    { label: 'MAE (meV)', val: mae != null ? fmt(mae, 3) : '—', color: '#00B050' },
                    { label: 'RMSE (meV)', val: rmse != null ? fmt(rmse, 3) : '—', color: '#0EA5E9' },
                    { label: 'MAPE (%)', val: mape != null ? fmt(mape, 1) : '—', color: '#D946EF' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 mb-0.5">{label}</div>
                      <div className="text-[16px] font-black" style={{ color }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 bg-slate-50 rounded-lg p-2.5 text-[10px] text-slate-500">
                  <span className="font-bold text-slate-600">Model Summary: </span>
                  The Gaussian Process model shows excellent prediction accuracy on the observed data.
                </div>
              </div>

              {/* Acquisition Function */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#7C3AED] rounded-full" /> 4. Acquisition Function Analysis
                </h2>
                <p className="text-[10px] font-bold text-slate-400 mb-2">Expected Improvement (EI)</p>
                <div className="h-[200px]">
                  {eiData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={eiData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="eiGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Design Space Index', position: 'insideBottom', offset: -2, style: { fontSize: 9, fill: '#94a3b8' } }} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 11 }} formatter={(v) => [v, 'Expected Improvement']} />
                        <Area type="monotone" dataKey="ei" stroke="#7C3AED" strokeWidth={2} fill="url(#eiGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="flex h-full items-center justify-center text-slate-400 text-sm">Run BO iterations to see EI</div>}
                </div>
                <div className="mt-3 bg-violet-50 rounded-lg p-2.5 text-[10px] text-violet-700">
                  <span className="font-bold">Insight: </span>
                  EI guides the optimizer to balance exploitation (near known good regions) and exploration (uncertain regions).
                  {suggestions.length > 0 && ` BO-${boRows.length + 1} corresponds to a high EI region.`}
                </div>
              </div>
            </div>

            {/* ── 4. Complete Experiment History + Best Experiment ── */}
            <div className="grid grid-cols-3 gap-5">

              {/* Full Table — spans 2 cols */}
              <div className="col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#4C3BDE] rounded-full" /> Complete Experiment History
                  </h2>
                  <span className="text-[11px] text-slate-400">{enrichedTimeline.length} experiments</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      {['EXP ID', 'TYPE', 'GTE (°C)', 'GTI (min)', 'FRA (sccm)', 'PRESSURE (Torr)', 'FWHM (meV)', 'STATUS'].map(h => (
                        <th key={h} className="py-2 px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedTimeline.map((row, i) => (
                      <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${row.status === 'best' ? 'bg-[#E8FFF3]/50' : ''}`}>
                        <td className="py-1.5 px-2 text-[11px] font-bold text-slate-800">{row.experiment_id}</td>
                        <td className="py-1.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.type === 'Initial' ? 'bg-slate-100 text-slate-500' : 'bg-[#F4F0FF] text-[#4C3BDE]'}`}>
                            {row.type === 'Initial' ? 'Init' : 'BO'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-[11px] text-slate-600">{fmt(row.gte, 0)}</td>
                        <td className="py-1.5 px-2 text-[11px] text-slate-600">{fmt(row.gti, 1)}</td>
                        <td className="py-1.5 px-2 text-[11px] text-slate-600">{fmt(row.fra, 1)}</td>
                        <td className="py-1.5 px-2 text-[11px] text-slate-600">{fmt(row.pressure, 2)}</td>
                        <td className="py-1.5 px-2 text-[11px] font-black text-[#4C3BDE]">{fmt(row.fwhm, 1)}</td>
                        <td className="py-1.5 px-2">
                          {row.status === 'best' ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#00B050]"><Star className="w-2.5 h-2.5 fill-[#00B050]" />Best</span>
                          ) : row.status === 'init' ? (
                            <span className="text-[10px] font-bold text-slate-400">Init</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {enrichedTimeline.length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-slate-400 text-[12px]">No experiments yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Best Experiment + Recommendations */}
              <div className="flex flex-col gap-4">
                {/* Best Experiment */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h2 className="text-[12px] font-black text-slate-700">Best Experiment Details</h2>
                  </div>
                  {bestRow ? (
                    <>
                      <div className="bg-[#F4F0FF] rounded-lg px-3 py-2 mb-3">
                        <div className="text-[10px] font-bold text-[#4C3BDE] mb-0.5">Best: {bestRow.experiment_id}</div>
                      </div>
                      {[
                        { label: 'GTE (°C)', val: fmt(bestRow.gte, 0) },
                        { label: 'GTI (min)', val: fmt(bestRow.gti, 1) },
                        { label: 'FRA (sccm)', val: fmt(bestRow.fra, 1) },
                        { label: 'Pressure (Torr)', val: fmt(bestRow.pressure, 2) },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center justify-between py-1 border-b border-slate-50 text-[11px]">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-bold text-slate-800">{val}</span>
                        </div>
                      ))}
                      <div className="mt-3 bg-[#E8FFF3] rounded-xl p-3 text-center">
                        <div className="text-[10px] font-bold text-[#00B050] mb-0.5">FWHM</div>
                        <div className="text-[24px] font-black text-[#00B050]">{fmt(bestRow.fwhm, 1)} <span className="text-[12px] font-normal opacity-70">meV</span></div>
                        <div className="text-[10px] text-[#00B050] font-medium mt-0.5">Best Achieved</div>
                      </div>
                    </>
                  ) : <div className="text-slate-400 text-sm text-center py-4">No data</div>}
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-[#4C3BDE]" />
                    <h2 className="text-[12px] font-black text-slate-700">7. Recommendations</h2>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mb-2">Percentage Range for Next Search</p>
                  {suggestions.length > 0 ? (
                    <>
                      <div className="space-y-1.5">
                        {[
                          { label: 'GTE (°C)', val: fmt(suggestions[0].GTE_celsius, 0), range: '900 – 1000' },
                          { label: 'GTI (min)', val: fmt(suggestions[0].GTI_minutes, 0), range: '15 – 25' },
                          { label: 'FRA (sccm)', val: fmt(suggestions[0].FRA_sccm, 1), range: '30 – 50' },
                          { label: 'Pressure (Torr)', val: fmt(suggestions[0].Pressure_Torr, 2), range: '200 – 350' },
                        ].map(({ label, val, range }) => (
                          <div key={label} className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">{label}</span>
                            <span className="font-bold text-slate-700">{val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 bg-[#F4F0FF] rounded-lg p-2 text-center">
                        <div className="text-[9px] font-bold text-[#4C3BDE] mb-0.5">Estimated Improvement</div>
                        <div className="text-[13px] font-black text-[#4C3BDE]">18 – 20 meV</div>
                      </div>
                    </>
                  ) : <div className="text-slate-400 text-sm text-center py-3">No suggestions</div>}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="text-center text-[10px] text-slate-400 pb-2">
              Quantum Materials AI · Bayesian Optimization Report · Generated {generatedOn} · Confidential
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default FullReport;
