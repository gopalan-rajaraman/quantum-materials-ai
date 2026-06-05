import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  Download, Printer, ArrowLeft, CheckCircle2, Star, Clock,
  TrendingDown, TrendingUp, FlaskConical, Target, Cpu, Activity,
  FileText, BarChart2, Zap, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
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
  const names = ['Growth Temp (GTE)', 'Growth Time (GTI)', 'Ar Flow (FRA)', 'Pressure'];
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

  // Variable importance insight
  if (varImportance && varImportance.length > 0) {
    const top = varImportance[0];
    insights.push(`📊 ${top.name} contributes ${top.value}% of model variance — the most influential process parameter.`);
  }

  // Best experiment
  const userExp = timeline?.filter(r => r.type === 'User') || [];
  const allFwhm = timeline?.map(r => parseFloat(r.fwhm)).filter(Boolean) || [];
  if (allFwhm.length > 0) {
    const bestFwhm = Math.min(...allFwhm);
    const bestRow = timeline.find(r => parseFloat(r.fwhm) === bestFwhm);
    if (bestRow) {
      insights.push(`⭐ ${bestRow.experiment_id} achieved the best FWHM of ${fmt(bestFwhm, 1)} meV — the lowest recorded in this campaign.`);
    }
  }

  // Model quality
  const r2 = modelInfo.R2_score;
  if (r2 != null) {
    if (r2 > 0.999) insights.push(`✅ Surrogate model achieved near-perfect fit (R² = ${(r2 * 100).toFixed(2)}%) indicating high prediction reliability.`);
    else if (r2 > 0.95) insights.push(`✅ Surrogate model shows excellent fit (R² = ${(r2 * 100).toFixed(2)}%), suitable for confident experiment planning.`);
    else insights.push(`⚠️ Surrogate model fit is moderate (R² = ${(r2 * 100).toFixed(2)}%). More experiments may improve reliability.`);
  }

  // BO improvement
  const initialFwhm = timeline?.filter(r => r.type === 'Initial').map(r => parseFloat(r.fwhm)).filter(Boolean) || [];
  if (initialFwhm.length > 0 && allFwhm.length > 0) {
    const initBest = Math.min(...initialFwhm);
    const curBest = Math.min(...allFwhm);
    const pct = ((initBest - curBest) / initBest * 100).toFixed(0);
    if (pct > 0) insights.push(`📉 BO loop reduced FWHM by ${pct}% from the initial best (${fmt(initBest, 1)} → ${fmt(curBest, 1)} meV).`);
  }

  // Next suggestion
  if (suggestions && suggestions.length > 0) {
    const s = suggestions[0];
    insights.push(`🎯 Next suggested region: GTE ${fmt(s.GTE_celsius, 0)}°C · GTI ${fmt(s.GTI_minutes, 0)} min · FRA ${fmt(s.FRA_sccm, 1)} sccm · Pressure ${fmt(s.Pressure_Torr, 1)} Torr`);
  }

  return insights;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const SectionTitle = ({ icon: Icon, title, color = '#4C3BDE' }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <h2 className="text-[15px] font-bold text-[#1e1b4b]">{title}</h2>
  </div>
);

const KpiCard = ({ label, value, sub, color, bg }) => (
  <div className="rounded-2xl p-5 flex flex-col gap-1 shadow-sm" style={{ background: bg }}>
    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
    <span className="text-2xl font-black" style={{ color }}>{value}</span>
    {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
  </div>
);

const MetricPill = ({ label, value, color }) => (
  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
    <div className="text-[10px] font-bold text-slate-500 mb-0.5">{label}</div>
    <div className="text-[16px] font-black" style={{ color }}>{value}</div>
  </div>
);

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Experiment_Report',
  });

  // Auto-trigger print/PDF when opened with ?autoprint=true
  useEffect(() => {
    if (!loading && autoPrint && !autoPrintFired.current && handlePrint) {
      autoPrintFired.current = true;
      // Small delay so charts have time to paint
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

  // Optimization history (monotonic best)
  let curMin = Infinity;
  const historyData = (() => {
    const rows = [];
    if (initialRows.length > 0) {
      const initBest = Math.min(...initialFwhm);
      rows.push({ iter: 0, label: 'Init', fwhm: initBest });
      curMin = initBest;
    }
    boRows.forEach((r, i) => {
      const v = parseFloat(r.fwhm);
      if (v > 0 && v < curMin) curMin = v;
      rows.push({ iter: i + 1, label: r.experiment_id, fwhm: curMin });
    });
    return rows;
  })();

  // Parity plot (Predicted vs Actual)
  const parityData = rawPredictions.map(p => ({ actual: p.observed, predicted: p.predicted }));
  const mape = rawPredictions.length > 0
    ? rawPredictions.filter(p => p.observed !== 0).reduce((acc, p) => acc + Math.abs((p.observed - p.predicted) / p.observed), 0) / rawPredictions.filter(p => p.observed !== 0).length * 100
    : null;

  // Variable importance
  const lengthScales = extractLengthScales(modelInfo?.kernel || '');
  const varImportance = computeVariableImportance(lengthScales) || (modelInfo?.feature_importances || []).map(f => ({ name: f.name, value: f.value }));

  // Status for table rows
  const minFwhm = currentBestFwhm;
  const enrichedTimeline = timeline.map(r => {
    const fwhm = parseFloat(r.fwhm);
    let status = 'completed';
    if (Math.abs(fwhm - minFwhm) < 0.01) status = 'best';
    else if (r.type === 'Initial') status = 'initial';
    return { ...r, fwhm, status };
  });

  // AI Insights
  const insights = generateInsights(modelInfo, timeline, varImportance, suggestions);

  const r2 = modelInfo?.R2_score;
  const mae = modelInfo?.MAE_meV;
  const rmse = modelInfo?.RMSE_meV;

  const COLORS_BAR = ['#4C3BDE', '#7C3AED', '#0EA5E9', '#10B981'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#4C3BDE] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Building your experiment report…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-sans">
      {/* ── Action Bar ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm px-8 py-3 flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-slate-600 hover:text-[#4C3BDE] font-semibold text-sm transition-colors"
        >
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

      {/* ── Printable Report Body ── */}
      <div ref={printRef} className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4C3BDE] flex items-center justify-center shadow-md">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-black text-[#1e1b4b]">Experiment Report</h1>
              <p className="text-[13px] text-slate-500">EXP-1 to EXP-{timeline.length} · Thermal CVD Bayesian Optimization</p>
              <p className="text-[12px] text-slate-400 mt-0.5">{generatedOn}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#F4F0FF] text-[#4C3BDE] text-[12px] font-bold rounded-full">Experiment Summary</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8FFF3] text-[#00B050] text-[12px] font-bold rounded-full border border-[#00B050]/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </div>
          </div>
        </div>

        {/* ── Row 1: KPIs + GP Model + Acquisition ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Panel 1 – Optimization Journey */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <SectionTitle icon={Target} title="Optimization Journey" />
            <KpiCard label="Starting FWHM" value={initBestFwhm ? `${fmt(initBestFwhm, 1)} meV` : '—'} sub="Initial dataset best" color="#64748b" bg="#F8FAFC" />
            <KpiCard label="Current Best" value={currentBestFwhm ? `${fmt(currentBestFwhm, 1)} meV` : '—'} sub="Lowest FWHM achieved" color="#4C3BDE" bg="#F4F0FF" />
            <KpiCard label="Improvement" value={improvePct > 0 ? `${improvePct.toFixed(0)}%` : '0%'} sub="Reduction in FWHM" color="#00B050" bg="#E8FFF3" />
            <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-slate-100">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Exp</div>
                <div className="text-[18px] font-black text-slate-800">{timeline.length}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Initial</div>
                <div className="text-[18px] font-black text-slate-800">{initialRows.length}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">BO Rounds</div>
                <div className="text-[18px] font-black text-[#4C3BDE]">{boRows.length}</div>
              </div>
            </div>
          </div>

          {/* Panel 2 – GP Model Analysis */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionTitle icon={Activity} title="GP Model Analysis" />
            <div className="h-[220px]">
              {rawPredictions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rawPredictions} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gpObs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gpPred" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4C3BDE" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4C3BDE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="iteration" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Experiment', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#94a3b8' } }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="observed" name="Actual FWHM" stroke="#ef4444" strokeWidth={2} fill="url(#gpObs)" dot={{ r: 3, fill: '#ef4444' }} />
                    <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#4C3BDE" strokeWidth={2} strokeDasharray="5 3" fill="url(#gpPred)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm">No prediction data yet</div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><div className="w-3 h-3 rounded-full bg-[#ef4444]" />Actual FWHM</div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><div className="w-3 h-0.5 bg-[#4C3BDE] border-t-2 border-dashed border-[#4C3BDE]" />Predicted</div>
            </div>
          </div>

          {/* Panel 3 – Acquisition Function */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionTitle icon={Zap} title="Acquisition Function Analysis" color="#7C3AED" />
            <div className="h-[220px]">
              {plotData?.ei_history?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(plotData.ei_history[plotData.ei_history.length - 1] || []).map((v, i) => ({ x: i, ei: parseFloat(v.toFixed(4)) }))}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="eiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Design Space', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#94a3b8' } }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={(v) => [v, 'Expected Improvement']} />
                    <Area type="monotone" dataKey="ei" stroke="#7C3AED" strokeWidth={2} fill="url(#eiGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm">Run BO iterations to see EI</div>
              )}
            </div>
            <div className="mt-3 bg-violet-50 rounded-xl p-3 text-[11px] text-violet-700 font-medium">
              EI guides the optimizer to balance exploitation (near known good regions) and exploration (uncertain regions).
            </div>
          </div>
        </div>

        {/* ── Full-width Experiment Results Table ── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={FileText} title="Experiment Results" />
            <span className="text-[12px] text-slate-400 font-medium">{enrichedTimeline.length} experiments total</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 rounded-xl">
                {['Exp ID', 'Type', 'GTE (°C)', 'GTI (min)', 'FRA (sccm)', 'Pressure (Torr)', 'FWHM (meV)', 'Status'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 first:rounded-tl-xl last:rounded-tr-xl">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrichedTimeline.map((row, i) => (
                <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${row.status === 'best' ? 'bg-[#E8FFF3]/40' : ''}`}>
                  <td className="py-2.5 px-3 text-[12px] font-bold text-slate-800">{row.experiment_id}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.type === 'Initial' ? 'bg-slate-100 text-slate-500' : 'bg-[#F4F0FF] text-[#4C3BDE]'
                    }`}>{row.type === 'Initial' ? 'Init' : 'BO'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-slate-600">{fmt(row.gte, 0)}</td>
                  <td className="py-2.5 px-3 text-[12px] text-slate-600">{fmt(row.gti, 1)}</td>
                  <td className="py-2.5 px-3 text-[12px] text-slate-600">{fmt(row.fra, 1)}</td>
                  <td className="py-2.5 px-3 text-[12px] text-slate-600">{fmt(row.pressure, 2)}</td>
                  <td className="py-2.5 px-3 text-[12px] font-bold text-[#4C3BDE]">{fmt(row.fwhm, 1)}</td>
                  <td className="py-2.5 px-3">
                    {row.status === 'best' ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#00B050]"><Star className="w-3 h-3 fill-[#00B050]" />Best</span>
                    ) : row.status === 'initial' ? (
                      <span className="text-[11px] font-bold text-slate-400">Init</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500"><CheckCircle2 className="w-3 h-3 text-emerald-400" />Done</span>
                    )}
                  </td>
                </tr>
              ))}
              {enrichedTimeline.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-[13px]">No experiments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Row 2: Parity + Variable Impact ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Panel 5 – Prediction Accuracy */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionTitle icon={TrendingUp} title="Prediction Accuracy" color="#0EA5E9" />
            <div className="h-[200px]">
              {parityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Actual (meV)', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#94a3b8' } }} />
                    <YAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Predicted', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8' } }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={(v) => [fmt(v, 2) + ' meV']} />
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
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <MetricPill label="R² Score" value={r2 != null ? `${(r2 * 100).toFixed(2)}%` : '—'} color="#4C3BDE" />
              <MetricPill label="MAE (meV)" value={mae != null ? fmt(mae, 3) : '—'} color="#00B050" />
              <MetricPill label="RMSE (meV)" value={rmse != null ? fmt(rmse, 3) : '—'} color="#0EA5E9" />
              <MetricPill label="MAPE (%)" value={mape != null ? fmt(mape, 1) + '%' : '—'} color="#D946EF" />
            </div>
          </div>

          {/* Panel 6 – Variable Impact */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <SectionTitle icon={BarChart2} title="Variable Impact Analysis" color="#10B981" />
            {varImportance && varImportance.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={varImportance} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#1e1b4b', fontWeight: 600 }} axisLine={false} tickLine={false} width={105} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} formatter={(v) => [v + '%', 'Importance']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {varImportance.map((_, i) => <Cell key={i} fill={COLORS_BAR[i % COLORS_BAR.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {varImportance.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">{v.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${v.value}%`, background: COLORS_BAR[i % COLORS_BAR.length] }} />
                        </div>
                        <span className="font-black text-slate-800 w-8 text-right">{v.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-3 italic">Importance = normalized (1/GP length scale)</p>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">No kernel data</div>
            )}
          </div>
        </div>

        {/* ── Row 3: History Chart + AI Insights ── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Panel 7 – Experiment History (spans 2 cols) */}
          <div className="col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={TrendingDown} title="Experiment History & Optimization Progress" />
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <div className="w-3 h-0.5 bg-[#4C3BDE]" />Best FWHM (monotonic)
              </div>
            </div>
            <div className="h-[220px]">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4C3BDE" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4C3BDE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="iter" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'BO Iteration', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: '#94a3b8' } }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'FWHM (meV)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8' } }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={(v) => [fmt(v, 2) + ' meV', 'Best FWHM']} labelFormatter={(l) => l === 0 ? 'Initial' : `Iter ${l}`} />
                    <Area type="monotone" dataKey="fwhm" stroke="#4C3BDE" strokeWidth={2.5} fillOpacity={1} fill="url(#histGrad)" activeDot={{ r: 5, fill: '#4C3BDE', stroke: 'white', strokeWidth: 2 }} dot={(props) => {
                      const { cx, cy, payload } = props;
                      return <circle key={payload.iter} cx={cx} cy={cy} r={4} fill="#4C3BDE" stroke="white" strokeWidth={1.5} />;
                    }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm">No BO iterations yet</div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              <MetricPill label="Starting FWHM" value={initBestFwhm ? `${fmt(initBestFwhm, 1)}` : '—'} color="#64748b" />
              <MetricPill label="Current Best" value={currentBestFwhm ? `${fmt(currentBestFwhm, 1)}` : '—'} color="#4C3BDE" />
              <MetricPill label="Improvement" value={improvePct > 0 ? `${improvePct.toFixed(0)}%` : '0%'} color="#00B050" />
              <MetricPill label="BO Rounds" value={boRows.length} color="#7C3AED" />
            </div>
          </div>

          {/* Panel 8 – AI Insights */}
          <div className="col-span-1 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 border border-[#4C3BDE]/20 shadow-lg text-white flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-indigo-300" />
              </div>
              <h2 className="text-[15px] font-bold text-white">AI Insights</h2>
            </div>
            <div className="flex-1 space-y-3">
              {insights.length > 0 ? insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-white/8 rounded-xl p-3">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-300 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-indigo-100 leading-relaxed">{ins}</p>
                </div>
              )) : (
                <p className="text-indigo-300 text-[13px] text-center mt-8">Run more experiments to unlock AI insights.</p>
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">Best Next Experiment</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'GTE', val: fmt(suggestions[0].GTE_celsius, 0) + '°C' },
                    { label: 'GTI', val: fmt(suggestions[0].GTI_minutes, 0) + ' min' },
                    { label: 'FRA', val: fmt(suggestions[0].FRA_sccm, 1) + ' sccm' },
                    { label: 'P', val: fmt(suggestions[0].Pressure_Torr, 1) + ' Torr' },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white/10 rounded-lg p-2 text-center">
                      <div className="text-[9px] font-bold text-indigo-300">{label}</div>
                      <div className="text-[13px] font-black text-white">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center text-[11px] text-slate-400 pb-4">
          Quantum Materials AI · Bayesian Optimization Report · Generated {generatedOn} · Confidential
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-\\[\\#F5F6FA\\] { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default FullReport;
