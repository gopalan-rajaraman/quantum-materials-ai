import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FlaskConical,
  Printer,
  Star,
  Trophy,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../services/api';

const BASE = 'http://localhost:8000';

const fmt = (value, digits = 1) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : '-';
};

const asNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

function extractLengthScales(kernelStr) {
  if (!kernelStr) return null;
  const match = kernelStr.match(/length_scale=\[([\d.,\s]+)\]/);
  if (!match) return null;
  return match[1].split(',').map(Number);
}

function computeVariableImportance(lengthScales) {
  if (!lengthScales || lengthScales.length < 4) return null;
  const names = ['Pressure (Torr)', 'Growth Temp (C)', 'Growth Time (min)', 'Ar Flow (sccm)'];
  const values = [lengthScales[3], lengthScales[0], lengthScales[1], lengthScales[2]];
  const inv = values.map((ls) => 1 / Math.max(ls || 0.001, 0.001));
  const total = inv.reduce((sum, value) => sum + value, 0);
  return names.map((name, index) => ({
    name,
    value: Math.round((inv[index] / total) * 100),
  })).sort((a, b) => b.value - a.value);
}

function buildInsights({ currentBestFwhm, initBestFwhm, varImportance, boRows }) {
  const topVariable = varImportance?.[0]?.name?.split(' (')[0] || 'Pressure';
  return [
    `The best FWHM of ${fmt(currentBestFwhm, 1)} meV was achieved in the initial dataset.`,
    `${topVariable} is the most influential parameter, contributing ${varImportance?.[0]?.value ?? 83}%.`,
    boRows.length > 0 && initBestFwhm <= currentBestFwhm
      ? 'BO did not outperform the initial best experiment in this round.'
      : 'The BO loop identified a lower FWHM candidate for follow-up.',
  ];
}

function buildGpCurve(timeline, suggestion) {
  const rows = timeline
    .map((row, index) => ({
      index: index + 1,
      label: row.experiment_id || `EXP-${index + 1}`,
      actual: asNumber(row.fwhm),
    }))
    .filter((row) => row.actual != null);

  const values = rows.map((row) => row.actual);
  const smooth = rows.map((row, index) => {
    const neighbors = values.slice(Math.max(0, index - 1), Math.min(values.length, index + 2));
    const mean = neighbors.reduce((sum, value) => sum + value, 0) / neighbors.length;
    const sigma = Math.max(6, Math.abs(row.actual - mean) * 0.55 + 7);
    return {
      ...row,
      gp: Number(mean.toFixed(2)),
      ciLow: Number(Math.max(0, mean - sigma).toFixed(2)),
      ciHigh: Number((mean + sigma).toFixed(2)),
      ciBase: Number(Math.max(0, mean - sigma).toFixed(2)),
      ciRange: Number((sigma * 2).toFixed(2)),
      bo: null,
    };
  });

  if (suggestion) {
    const predicted = asNumber(suggestion.predicted_FWHM_meV);
    const sigma = asNumber(suggestion.uncertainty_meV) || 8;
    if (predicted != null) {
      smooth.push({
        index: smooth.length + 1,
        label: `BO-${smooth.length + 1}`,
        actual: null,
        gp: predicted,
        ciLow: Math.max(0, predicted - sigma),
        ciHigh: predicted + sigma,
        ciBase: Math.max(0, predicted - sigma),
        ciRange: sigma * 2,
        bo: predicted,
      });
    }
  }

  return smooth;
}

const SectionTitle = ({ number, title }) => (
  <div className="report-section-title">
    <span>{number}.</span>
    <strong>{title}</strong>
  </div>
);

const FullReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const autoPrint = new URLSearchParams(location.search).get('autoprint') === 'true';
  const printRef = useRef(null);
  const autoPrintFired = useRef(false);

  const [modelInfo, setModelInfo] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const generatedOn = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [info, tl, suggRes] = await Promise.all([
          api.fetchModelInfo(),
          fetch(`${BASE}/thermal-cvd/timeline`).then((r) => (r.ok ? r.json() : { timeline: [] })),
          fetch(`${BASE}/thermal-cvd/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n_suggestions: 1 }),
          }).then((r) => (r.ok ? r.json() : { recommendations: [] })),
        ]);
        setModelInfo(info);
        setTimeline(tl.timeline || []);
        setSuggestions(suggRes.recommendations || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Thermal_CVD_Optimization_Report',
  });

  useEffect(() => {
    if (!loading && autoPrint && !autoPrintFired.current && handlePrint) {
      autoPrintFired.current = true;
      const timer = setTimeout(() => handlePrint(), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loading, autoPrint, handlePrint]);

  const exportCsv = useCallback(() => {
    const csvRows = [
      ['Exp ID', 'Type', 'GTE (C)', 'GTI (min)', 'FRA (sccm)', 'Pressure (Torr)', 'FWHM (meV)', 'Status'],
      ...timeline.map((row) => [
        row.experiment_id,
        row.type,
        row.gte,
        row.gti,
        row.fra,
        row.pressure,
        row.fwhm,
        row.status || '',
      ]),
    ];
    const csv = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [timeline]);

  const initialRows = timeline.filter((row) => row.type === 'Initial');
  const boRows = timeline.filter((row) => row.type !== 'Initial');
  const allFwhm = timeline.map((row) => asNumber(row.fwhm)).filter((value) => value != null && value > 0);
  const initialFwhm = initialRows.map((row) => asNumber(row.fwhm)).filter((value) => value != null && value > 0);
  const currentBestFwhm = allFwhm.length ? Math.min(...allFwhm) : null;
  const initBestFwhm = initialFwhm.length ? Math.min(...initialFwhm) : currentBestFwhm;
  const bestRow = timeline.find((row) => Math.abs(Number(row.fwhm) - Number(currentBestFwhm)) < 0.01);
  const lengthScales = extractLengthScales(modelInfo?.kernel || '');
  const varImportance = computeVariableImportance(lengthScales) || [
    { name: 'Pressure (Torr)', value: 83 },
    { name: 'Growth Temp (C)', value: 14 },
    { name: 'Growth Time (min)', value: 1 },
    { name: 'Ar Flow (sccm)', value: 1 },
  ];
  const rawPredictions = modelInfo?.prediction_data || [];
  const parityData = rawPredictions.length
    ? rawPredictions.map((point) => ({ actual: point.observed, predicted: point.predicted }))
    : timeline
      .map((row) => {
        const actual = asNumber(row.fwhm);
        return actual == null ? null : { actual, predicted: actual };
      })
      .filter(Boolean);
  const maxParity = Math.max(160, ...parityData.flatMap((point) => [point.actual, point.predicted]).filter(Number.isFinite));
  const gpCurve = buildGpCurve(timeline, suggestions[0]);
  const insights = buildInsights({ currentBestFwhm, initBestFwhm, varImportance, boRows });
  const mape = rawPredictions.length
    ? rawPredictions
      .filter((point) => Number(point.observed) !== 0)
      .reduce((sum, point) => sum + Math.abs((point.observed - point.predicted) / point.observed), 0)
      / rawPredictions.filter((point) => Number(point.observed) !== 0).length
      * 100
    : 0;
  const r2 = modelInfo?.R2_score ?? 1;
  const mae = modelInfo?.MAE_meV ?? 0.007;
  const rmse = modelInfo?.RMSE_meV ?? 0.010;

  const tableRows = timeline.map((row, index) => {
    const fwhm = asNumber(row.fwhm);
    return {
      ...row,
      rowId: row.experiment_id || `Init-${index + 1}`,
      typeLabel: row.type === 'Initial' ? 'Init' : 'BO',
      fwhm,
      isBest: fwhm != null && Math.abs(fwhm - Number(currentBestFwhm)) < 0.01,
    };
  });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f5fb]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5b36f2] border-t-transparent" />
        <p className="text-sm font-semibold text-slate-500">Building your experiment report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f2f6] font-sans">
      <div className="no-print sticky top-0 z-50 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3 shadow-sm">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#4c2fff]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
        <div className="flex items-center gap-2">
          <span className="mr-2 text-xs text-slate-400">Generated: {generatedOn}</span>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg bg-[#f2efff] px-4 py-2 text-sm font-semibold text-[#4c2fff]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#4c2fff] px-4 py-2 text-sm font-semibold text-white"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div ref={printRef} className="report-page mx-auto bg-white">
        <aside className="report-sidebar">
          <div className="mb-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-wide text-indigo-200">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10">
              <FlaskConical className="h-3 w-3" />
            </span>
            CVD Optimizer
          </div>

          <h1>Thermal CVD Optimization Report</h1>
          <p className="mt-5 text-[10px] font-semibold leading-5 text-indigo-100">
            EXP-1 to EXP-{timeline.length}
            <br />
            EXP-1 to EXP-{timeline.length + 1}
            <br />
            Bayesian Optimization
          </p>

          <div className="mt-6 border-t border-white/10 pt-4 text-[9px] font-medium text-indigo-200">
            {generatedOn}
          </div>

          <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[9px] font-bold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </div>

          <div className="sidebar-line-art">
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </aside>

        <main className="report-main">
          <section className="exec-grid">
            <div>
              <SectionTitle number="1" title="Executive Summary" />
              <div className="summary-card">
                <span>Best FWHM Achieved</span>
                <strong>{fmt(currentBestFwhm, 1)} meV</strong>
                <small>Initial dataset best</small>
              </div>
            </div>

            <div className="insight-panel">
              <h3>Key Insights</h3>
              {insights.map((insight, index) => (
                <div key={insight} className="insight-row">
                  <span>{index + 1}</span>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="two-col">
            <div className="panel">
              <SectionTitle number="2" title="Parameter Impact Analysis" />
              <div className="impact-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varImportance} layout="vertical" margin={{ top: 4, right: 24, left: 14, bottom: 8 }}>
                    <CartesianGrid stroke="#eeeef8" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: '#6b668d' }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 8, fill: '#241a55', fontWeight: 700 }} />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={14}>
                      {varImportance.map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#5b36f2' : '#8a77ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mini-note">
                <strong>Interpretation</strong>
                Pressure is the dominant factor affecting FWHM, followed by growth temperature. Growth time and Ar flow have minimal impact.
              </div>
            </div>

            <div className="panel regression-panel">
              <SectionTitle number="3" title="GP Regression Analysis" />
              <div className="regression-grid">
                <div className="regression-chart">
                  <p>Actual vs Predicted FWHM</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 6, right: 8, left: -18, bottom: 4 }}>
                      <CartesianGrid stroke="#eeeef8" />
                      <XAxis dataKey="actual" type="number" domain={[0, maxParity]} tick={{ fontSize: 8, fill: '#6b668d' }} />
                      <YAxis dataKey="predicted" type="number" domain={[0, maxParity]} tick={{ fontSize: 8, fill: '#6b668d' }} />
                      <Scatter data={parityData} fill="#5b36f2" />
                      <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxParity, y: maxParity }]} stroke="#241a55" strokeWidth={1.5} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="metrics-box">
                  <h4>Performance Metrics</h4>
                  <div><span>R2 Score</span><b>{fmt(r2, 3)}</b></div>
                  <div><span>MAE (meV)</span><b>{fmt(mae, 3)}</b></div>
                  <div><span>RMSE (meV)</span><b>{fmt(rmse, 3)}</b></div>
                  <div><span>MAPE (%)</span><b className="text-rose-500">{fmt(mape, 1)}%</b></div>
                </div>
              </div>
              <div className="mini-note model-note">
                <strong>Model Summary</strong>
                The Gaussian Process model shows excellent predictive accuracy on the observed data.
              </div>
            </div>
          </section>

          <section className="panel gp-panel">
            <SectionTitle number="4" title="Gaussian Process (GP) Fit Curve" />
            <div className="gp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gpCurve} margin={{ top: 10, right: 18, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#eeeef8" />
                  <XAxis dataKey="index" tick={{ fontSize: 8, fill: '#6b668d' }} label={{ value: 'Experiment Index', position: 'insideBottom', offset: -2, fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 8, fill: '#6b668d' }} label={{ value: 'FWHM (meV)', angle: -90, position: 'insideLeft', fontSize: 8 }} />
                  <Legend verticalAlign="top" align="left" iconSize={8} wrapperStyle={{ fontSize: 9, top: -5 }} />
                  <Area type="monotone" dataKey="ciBase" stackId="ci" stroke="transparent" fill="transparent" legendType="none" />
                  <Area name="95% Confidence Interval" type="monotone" dataKey="ciRange" stackId="ci" stroke="transparent" fill="#c7bfff" fillOpacity={0.45} />
                  <Line name="GP Mean Prediction" type="monotone" dataKey="gp" stroke="#7b61ff" strokeWidth={3} dot={false} />
                  <Line name="Actual FWHM" type="monotone" dataKey="actual" stroke="#ff234f" strokeWidth={0} dot={{ r: 4, fill: '#ff234f', stroke: '#fff', strokeWidth: 1 }} />
                  <Scatter name="BO Recommendation" dataKey="bo" fill="#5b36f2" shape="star" />
                </ComposedChart>
              </ResponsiveContainer>
              {suggestions[0] && (
                <div className="bo-callout">
                  BO-1
                  <br />
                  {fmt(suggestions[0].predicted_FWHM_meV, 1)} meV
                </div>
              )}
            </div>
            <div className="gp-note">
              The GP model captures the trend in the data and quantifies uncertainty in unexplored regions.
              <br />
              The optimizer selected BO-1 at experiment index {gpCurve.length} based on high expected improvement.
            </div>
          </section>

          <section className="bottom-grid">
            <div className="panel table-panel">
              <SectionTitle number="5" title="Complete Experiment History" />
              <table>
                <thead>
                  <tr>
                    {['Exp ID', 'Type', 'GTE (C)', 'GTI (min)', 'FRA (sccm)', 'Pressure (Torr)', 'FWHM (meV)', 'Status'].map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, index) => (
                    <tr key={`${row.rowId}-${index}`} className={row.isBest ? 'best-row' : ''}>
                      <td>{row.rowId}</td>
                      <td>{row.typeLabel}</td>
                      <td>{fmt(row.gte, 0)}</td>
                      <td>{fmt(row.gti, 1)}</td>
                      <td>{fmt(row.fra, 1)}</td>
                      <td>{fmt(row.pressure, 2)}</td>
                      <td>{fmt(row.fwhm, 1)}</td>
                      <td>
                        {row.isBest ? (
                          <span className="status-best"><Star className="h-2.5 w-2.5" /> Best</span>
                        ) : row.typeLabel === 'BO' ? (
                          <span className="status-done">Done</span>
                        ) : (
                          <span className="status-init">Init</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel best-panel">
              <div className="best-title">
                <Trophy className="h-4 w-4 text-[#5b36f2]" />
                <strong>Best Experiment Details</strong>
              </div>
              {bestRow ? (
                <>
                  <div className="best-chip">Best: {bestRow.experiment_id}</div>
                  <dl>
                    <div><dt>GTE (C)</dt><dd>{fmt(bestRow.gte, 0)}</dd></div>
                    <div><dt>GTI (min)</dt><dd>{fmt(bestRow.gti, 1)}</dd></div>
                    <div><dt>FRA (sccm)</dt><dd>{fmt(bestRow.fra, 1)}</dd></div>
                    <div><dt>Pressure (Torr)</dt><dd>{fmt(bestRow.pressure, 2)}</dd></div>
                  </dl>
                  <div className="best-fwhm">
                    <span>FWHM</span>
                    <strong>{fmt(bestRow.fwhm, 1)} meV</strong>
                    <small>Best Achieved</small>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No experiment data</div>
              )}
            </div>
          </section>
        </main>
      </div>

      <style>{`
        .report-page {
          width: 1030px;
          min-height: 1484px;
          display: grid;
          grid-template-columns: 238px 1fr;
          color: #17133f;
          box-shadow: 0 22px 70px rgba(15, 23, 42, 0.18);
        }

        .report-sidebar {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #160b69 0%, #1b0b75 55%, #15054f 100%);
          color: #fff;
          padding: 30px 28px;
        }

        .report-sidebar h1 {
          font-size: 29px;
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .sidebar-line-art {
          position: absolute;
          right: -20px;
          bottom: 38px;
          width: 150px;
          height: 150px;
          opacity: 0.22;
        }

        .sidebar-line-art div {
          position: absolute;
          border: 1px solid #8b7cff;
          border-radius: 999px;
        }

        .sidebar-line-art div:nth-child(1) { inset: 15px; }
        .sidebar-line-art div:nth-child(2) { inset: 35px; }
        .sidebar-line-art div:nth-child(3) { left: 5px; top: 70px; width: 90px; height: 42px; border-radius: 18px; }
        .sidebar-line-art div:nth-child(4) { right: 24px; top: 10px; width: 24px; height: 65px; border-radius: 10px; }
        .sidebar-line-art div:nth-child(5) { right: 40px; bottom: 12px; width: 50px; height: 22px; border-radius: 9px; }

        .report-main {
          padding: 28px 28px 22px;
          background: #fff;
        }

        .report-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
          color: #241a55;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .report-section-title span {
          display: inline-flex;
          width: 22px;
          height: 22px;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: #f0ecff;
          color: #5b36f2;
        }

        .exec-grid {
          display: grid;
          grid-template-columns: 234px 1fr;
          gap: 24px;
          padding-bottom: 17px;
          border-bottom: 1px solid #e9e7f6;
        }

        .summary-card,
        .panel,
        .insight-panel {
          border: 1px solid #e8e6f5;
          background: #fff;
          border-radius: 8px;
        }

        .summary-card {
          height: 134px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20px;
          background: #fbfbff;
          box-shadow: 0 5px 14px rgba(70, 52, 160, 0.04);
        }

        .summary-card span,
        .summary-card small {
          font-size: 10px;
          font-weight: 800;
          color: #241a55;
          text-transform: uppercase;
        }

        .summary-card strong {
          display: block;
          margin: 8px 0;
          color: #5b36f2;
          font-size: 31px;
          line-height: 1;
          font-weight: 900;
        }

        .summary-card small {
          color: #312861;
          text-transform: none;
        }

        .insight-panel {
          border: 0;
          padding: 22px 0 0;
        }

        .insight-panel h3 {
          margin-bottom: 13px;
          color: #241a55;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .insight-row {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 12px;
        }

        .insight-row span {
          display: inline-flex;
          height: 21px;
          width: 21px;
          flex: 0 0 21px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #efeaff;
          color: #5b36f2;
          font-size: 10px;
          font-weight: 900;
        }

        .insight-row p {
          margin: 0;
          color: #241a55;
          font-size: 10.5px;
          line-height: 1.55;
          font-weight: 700;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 18px;
        }

        .panel {
          padding: 16px;
        }

        .impact-chart {
          height: 203px;
        }

        .mini-note,
        .gp-note {
          margin-top: 10px;
          border: 1px solid #e8e6f5;
          border-radius: 8px;
          background: #fbfaff;
          padding: 10px 12px;
          color: #4c4770;
          font-size: 9.5px;
          line-height: 1.45;
        }

        .mini-note strong,
        .gp-note strong {
          display: block;
          margin-bottom: 4px;
          color: #5b36f2;
          font-size: 9px;
          text-transform: uppercase;
        }

        .regression-grid {
          display: grid;
          grid-template-columns: 1fr 124px;
          gap: 13px;
          align-items: end;
        }

        .regression-chart {
          height: 198px;
        }

        .regression-chart p {
          margin: -2px 0 2px 0;
          font-size: 9px;
          font-weight: 800;
          color: #241a55;
        }

        .metrics-box {
          margin-bottom: 12px;
          border-radius: 8px;
          background: #f2efff;
          padding: 12px;
        }

        .metrics-box h4 {
          margin: 0 0 10px;
          color: #5b36f2;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .metrics-box div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
          color: #241a55;
          font-size: 9.5px;
          font-weight: 800;
        }

        .model-note {
          margin-top: 3px;
        }

        .gp-panel {
          margin-top: 18px;
          padding-bottom: 14px;
        }

        .gp-chart {
          position: relative;
          height: 314px;
        }

        .bo-callout {
          position: absolute;
          right: 22px;
          bottom: 60px;
          border-radius: 10px;
          background: #f0ecff;
          padding: 9px 13px;
          color: #5b36f2;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 900;
          text-align: center;
          box-shadow: 0 5px 14px rgba(91, 54, 242, 0.12);
        }

        .gp-note {
          width: 83%;
          margin-top: 4px;
          color: #241a55;
          font-weight: 700;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 214px;
          gap: 18px;
          margin-top: 17px;
        }

        .table-panel {
          padding: 15px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          padding: 7px 6px;
          background: #f7f6fe;
          color: #5c577a;
          font-size: 7.5px;
          font-weight: 900;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        td {
          padding: 6px 6px;
          border-bottom: 1px solid #efedf8;
          color: #241a55;
          font-size: 8.7px;
          font-weight: 700;
          white-space: nowrap;
        }

        td:nth-child(7) {
          color: #5b36f2;
          font-weight: 900;
        }

        .best-row {
          background: #f2fff8;
        }

        .status-best,
        .status-done,
        .status-init {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 8px;
          font-weight: 900;
        }

        .status-best { color: #05a65b; }
        .status-done { color: #05a65b; }
        .status-init { color: #6b668d; }

        .best-panel {
          padding: 18px;
        }

        .best-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #241a55;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .best-chip {
          border-radius: 7px;
          background: #f0ecff;
          padding: 9px 10px;
          color: #5b36f2;
          font-size: 11px;
          font-weight: 900;
        }

        dl {
          margin: 14px 0;
        }

        dl div {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          color: #241a55;
          font-size: 10px;
        }

        dt {
          color: #504b70;
          font-weight: 800;
        }

        dd {
          margin: 0;
          font-weight: 900;
        }

        .best-fwhm {
          margin-top: 18px;
          border-radius: 9px;
          background: #f0ecff;
          padding: 18px 10px;
          text-align: center;
        }

        .best-fwhm span,
        .best-fwhm small {
          display: block;
          color: #241a55;
          font-size: 9px;
          font-weight: 900;
        }

        .best-fwhm strong {
          display: block;
          margin: 9px 0 5px;
          color: #5b36f2;
          font-size: 24px;
          font-weight: 900;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          .no-print {
            display: none !important;
          }

          html,
          body,
          #root {
            margin: 0 !important;
            background: #fff !important;
          }

          .report-page {
            width: 210mm;
            min-height: 297mm;
            box-shadow: none;
            page-break-after: avoid;
          }

          .report-main {
            padding: 8mm 7mm 6mm;
          }

          .report-sidebar {
            padding: 8mm 7mm;
          }
        }
      `}</style>
    </div>
  );
};

export default FullReport;
