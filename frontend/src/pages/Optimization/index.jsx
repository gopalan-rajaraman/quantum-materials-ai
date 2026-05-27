import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { FlaskConical, Target, Save, Activity, Info, Star, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Optimization = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boProgress, setBoProgress] = useState(null);
  
  const [fwhmResult, setFwhmResult] = useState('');
  const predictedFwhm = suggestions.length > 0 ? Number(suggestions[0].predicted_FWHM_meV) : NaN;
  const predictedUncertainty = suggestions.length > 0 ? Number(suggestions[0].uncertainty_meV) : NaN;
  const [actualGte, setActualGte] = useState('');
  const [actualGti, setActualGti] = useState('');
  const [actualFra, setActualFra] = useState('');
  const [actualPressure, setActualPressure] = useState('');
  const [forceContinue, setForceContinue] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      setActualGte(suggestions[0].GTE_celsius);
      setActualGti(suggestions[0].GTI_minutes);
      setActualFra(suggestions[0].FRA_sccm);
      setActualPressure(suggestions[0].Pressure_Torr);
    }
  }, [suggestions]);

  const fetchModelData = async () => {
    try {
      const infoRes = await fetch('http://localhost:8000/thermal-cvd/info');
      if (infoRes.ok) {
        const info = await infoRes.json();
        setModelInfo(info);
        
        if (info.status === 'fitted') {
          const progressRes = await fetch('http://localhost:8000/thermal-cvd/bo-progress');
          if (progressRes.ok) setBoProgress(await progressRes.json());
          
          const suggRes = await fetch('http://localhost:8000/thermal-cvd/suggest', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n_suggestions: 1 })
          });
          if (suggRes.ok) setSuggestions((await suggRes.json()).recommendations);
          
          const plotRes = await fetch('http://localhost:8000/thermal-cvd/plot-data');
          if (plotRes.ok) setPlotData(await plotRes.json());
          
          const timelineRes = await fetch('http://localhost:8000/thermal-cvd/timeline');
          if (timelineRes.ok) setTimelineData((await timelineRes.json()).timeline);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModelData(); }, []);

  const handleAddExperiment = async (e) => {
    e.preventDefault();
    if (suggestions.length === 0 || !fwhmResult) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/thermal-cvd/add-experiment', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GTE: parseFloat(actualGte), GTI: parseFloat(actualGti),
          FRA: parseFloat(actualFra), Pressure: parseFloat(actualPressure),
          PL_FWHM: parseFloat(fwhmResult)
        })
      });
      if (res.ok) {
        setFwhmResult('');
        setLoading(true);
        await fetchModelData();
      } else alert("Failed to submit result.");
    } catch (e) {
      alert('Failed to add experiment result.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare plot traces
  let gpTraces = [];
  let eiTraces = [];
  
  if (plotData) {
    const n_init = plotData.training_points.initial_count;
    
    const sliceData = (arr, start, end) => arr.slice(start, end);
    const createPoints = (start, end, prefix) => ({
      x: sliceData(plotData.training_points.x, start, end),
      y: sliceData(plotData.training_points.y, start, end),
      customdata: sliceData(plotData.training_points.x, start, end).map((_, i) => [
        `${prefix}-${i + 1}`,
        sliceData(plotData.training_points.gti, start, end)[i],
        sliceData(plotData.training_points.fra, start, end)[i],
        sliceData(plotData.training_points.pressure, start, end)[i]
      ])
    });

    const initPts = createPoints(0, n_init, 'Init');
    const userPts = createPoints(n_init, undefined, 'BO');

    const hoverTemplate = `<b>Experiment %{customdata[0]}</b><br><br>GTE: %{x} °C<br>GTI: %{customdata[1]} min<br>FRA: %{customdata[2]} sccm<br>Pressure: %{customdata[3]} Torr<br><br><b>Measured FWHM: %{y} meV</b><extra></extra>`;

    gpTraces = [
      {
        x: plotData.x.concat(plotData.x.slice().reverse()),
        y: plotData.mu.map((m, i) => m + 1.4 * plotData.sigma[i]).concat(plotData.mu.map((m, i) => m - 1.4 * plotData.sigma[i]).reverse()),
        type: 'scatter', fill: 'toself', fillcolor: 'rgba(59, 130, 246, 0.22)', line: {color: 'transparent'}, name: 'Confidence Interval', hoverinfo: 'skip'
      },
      {
        x: plotData.x, y: plotData.mu, type: 'scatter', mode: 'lines', name: 'GP Mean (Predicted FWHM)', line: {color: '#3b82f6', width: 3}, hoverinfo: 'skip'
      },
      {
        x: initPts.x, y: initPts.y, customdata: initPts.customdata, type: 'scatter', mode: 'markers', name: 'Initial Dataset (Literature)',
        marker: {color: '#cbd5e1', size: 10, symbol: 'circle', line: {color: '#94a3b8', width: 2}}, hovertemplate: hoverTemplate
      },
      {
        x: userPts.x, y: userPts.y, customdata: userPts.customdata, type: 'scatter', mode: 'markers', name: 'BO Experiments (You)',
        marker: {color: '#ef4444', size: 12, symbol: 'circle', line: {color: '#fca5a5', width: 2}}, hovertemplate: hoverTemplate
      }
    ];
    
    if (suggestions.length > 0) {
      gpTraces.push({
        x: [suggestions[0].GTE_celsius], y: [predictedFwhm], type: 'scatter', mode: 'markers', name: 'Next Suggested Point',
        marker: {color: '#10b981', size: 18, symbol: 'star', line: {color: '#064e3b', width: 2}},
        hovertemplate: `<b>Next Suggestion</b><br><br>GTE: %{x} °C<br>Predicted FWHM: %{y:.2f} meV<extra></extra>`
      });
    }

    const xMin = Math.min(...plotData.x);
    const xMax = Math.max(...plotData.x);
    const xRange = [xMin - 50, xMax + 50];

    const totalCurves = plotData.ei_history ? plotData.ei_history.length : 0;
    const startIndex = Math.max(0, totalCurves - 5);
    const visibleHistory = (plotData.ei_history || []).slice(startIndex);
    
    const eiColors = ['#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'];
    eiTraces = visibleHistory.map((ei_curve, relativeIdx) => {
      const actualStep = startIndex + relativeIdx + 1;
      const isCurrent = relativeIdx === visibleHistory.length - 1;
      return {
        x: plotData.x, y: ei_curve, type: 'scatter', mode: 'lines', name: isCurrent ? `Step ${actualStep} (Current)` : `Step ${actualStep}`,
        line: { color: isCurrent ? '#1d4ed8' : eiColors[relativeIdx % eiColors.length], width: isCurrent ? 3 : 2, dash: 'solid' }
      };
    });
  }

  const globalUncertaintyRed = plotData ? (Math.max(0, 100 - (plotData.sigma.reduce((a,b)=>a+b,0) / plotData.sigma.length) * 5)).toFixed(1) : 0;

  // Convergence check logic
  let hasConverged = false;
  const CONVERGENCE_N = 5;
  const EI_THRESHOLD = 0.001;
  const maxEI = suggestions.length > 0 ? (suggestions[0].EI_value || 0) : 1.0;

  if (timelineData && timelineData.length > 0 && !forceContinue) {
    const userSteps = timelineData.filter(r => r.type === 'User').map(r => parseFloat(r.fwhm));
    if (userSteps.length >= CONVERGENCE_N) {
      const initialBest = Math.min(...timelineData.filter(r => r.type === 'Initial').map(r => parseFloat(r.fwhm)));
      
      const bestBeforeLastN = userSteps.length === CONVERGENCE_N 
        ? initialBest 
        : Math.min(initialBest, ...userSteps.slice(0, userSteps.length - CONVERGENCE_N));
        
      const bestInLastN = Math.min(...userSteps.slice(-CONVERGENCE_N));
      
      // Stop if no improvement AND max_expected_improvement < ei_threshold
      if (bestInLastN >= bestBeforeLastN && maxEI < EI_THRESHOLD) {
        hasConverged = true;
      }
    }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full text-slate-800 animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Optimization Dashboard</h2>
          <p className="text-slate-500">Bayesian Optimization engine tracking FWHM minimization.</p>
        </div>
      </div>
      
      {plotData?.is_unstable_regime && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-amber-800 font-bold text-sm">Warning: Surrogate model entered low-length-scale regime.</h4>
            <p className="text-amber-700 text-sm mt-1">
              The optimizer has collapsed to microscopic length scales due to sparse or noisy data. Predictions in unexplored regions may be unstable or flat. Consider adding more experiments to stabilize the model.
            </p>
          </div>
        </div>
      )}
      
      {/* Top Section: GP and Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Gaussian Process Surrogate Model (GTE Sweep) <Info className="w-4 h-4 text-slate-400" />
            </h3>
          </div>
          <div className="h-[400px] w-full bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden relative">
             {loading && !plotData ? (
               <div className="flex h-full items-center justify-center text-slate-400">Loading model...</div>
             ) : (
               <Plot
                 data={gpTraces}
                 layout={{
                   autosize: true, margin: {l: 50, r: 20, b: 40, t: 20},
                   paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                   xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#f1f5f9', color: '#64748b', range: plotData ? [Math.min(...plotData.x)-50, Math.max(...plotData.x)+50] : undefined },
                   yaxis: { title: 'PL FWHM (meV)', gridcolor: '#f1f5f9', color: '#64748b' },
                   legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(255, 255, 255, 0.9)', font: {color: '#334155'}, bordercolor: '#e2e8f0', borderwidth: 1 }
                 }}
                 useResizeHandler style={{width: '100%', height: '100%'}}
               />
             )}
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4">What do the points represent?</h3>
          <p className="text-sm text-slate-500 mb-6">Each point is a single experiment with 4 input variables and 1 measured output (PL FWHM).</p>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#cbd5e1] border-2 border-[#94a3b8]"></div>
              <div className="text-sm"><span className="text-slate-700 font-bold">Gray:</span> <span className="text-slate-500">Initial Literature Dataset</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-[#fca5a5]"></div>
              <div className="text-sm"><span className="text-red-600 font-bold">Red:</span> <span className="text-slate-500">BO Experiments (You)</span></div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-[#22c55e] fill-[#22c55e]" />
              <div className="text-sm"><span className="text-emerald-600 font-bold">Green:</span> <span className="text-slate-500">Next Suggested Point</span></div>
            </div>
          </div>
          
          <div className="mt-auto bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-blue-700 font-bold text-sm mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Model Confidence</h4>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${globalUncertaintyRed}%`}}></div>
            </div>
            <p className="text-xs text-blue-600 text-right mt-2">Uncertainty decreasing</p>
          </div>
        </div>
      </div>

      {/* Bottom Section: EI, Timeline, Suggestion */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Acquisition History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Acquisition Function Evolution <span className="text-sm font-normal text-slate-500">(Expected Improvement)</span></h3>
          <div className="h-[250px] w-full rounded-xl overflow-hidden">
             {eiTraces.length > 0 && (
               <Plot
                 data={eiTraces}
                 layout={{
                   autosize: true, margin: {l: 50, r: 20, b: 40, t: 20},
                   paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                   xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#f1f5f9', color: '#64748b', range: plotData ? [Math.min(...plotData.x)-50, Math.max(...plotData.x)+50] : undefined },
                   yaxis: { title: 'EI Value', gridcolor: '#f1f5f9', color: '#64748b' },
                   legend: { orientation: 'h', y: 1.1, font: {color: '#475569', size: 10} }
                 }}
                 useResizeHandler style={{width: '100%', height: '100%'}}
               />
             )}
          </div>
        </div>

        {/* Timeline Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-y-auto max-h-[350px]">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">Optimization Timeline <Info className="w-4 h-4 text-slate-400" /></h3>
          <table className="w-full text-sm text-left text-slate-600 border-collapse">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-3 font-bold rounded-tl-lg">Step</th>
                <th className="px-3 py-3 font-bold">GTE <span className="text-[10px] normal-case opacity-70">(°C)</span></th>
                <th className="px-3 py-3 font-bold">GTI <span className="text-[10px] normal-case opacity-70">(min)</span></th>
                <th className="px-3 py-3 font-bold">FRA <span className="text-[10px] normal-case opacity-70">(sccm)</span></th>
                <th className="px-3 py-3 font-bold">Pressure <span className="text-[10px] normal-case opacity-70">(Torr)</span></th>
                <th className="px-3 py-3 font-bold text-right rounded-tr-lg">FWHM <span className="text-[10px] normal-case opacity-70">(meV)</span></th>
              </tr>
            </thead>
            <tbody>
              {/* Empty State */}
              {timelineData.filter(r => r.type === 'User').length === 0 && (
                <tr className="border-b border-slate-100 bg-slate-50/20">
                  <td className="px-3 py-10 text-center text-slate-400 font-medium" colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity className="w-6 h-6 opacity-50 mb-1" />
                      <span>No active optimization steps yet.</span>
                      <span className="text-xs opacity-70">Log your first BO experiment to build the timeline.</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* BO Experiments */}
              {timelineData.filter(r => r.type === 'User').map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-3 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                    <span className="text-slate-900 whitespace-nowrap">{row.experiment_id}</span>
                  </td>
                  <td className="px-3 py-3">{row.gte}</td>
                  <td className="px-3 py-3">{row.gti || '-'}</td>
                  <td className="px-3 py-3">{row.fra || '-'}</td>
                  <td className="px-3 py-3">{row.pressure || '-'}</td>
                  <td className="px-3 py-3 font-bold text-indigo-600 text-right">{parseFloat(row.fwhm).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Next Suggestion Log / Convergence */}
        <div className={`bg-white rounded-2xl p-6 border shadow-sm flex flex-col relative overflow-hidden ${hasConverged ? 'border-amber-200 shadow-amber-50' : 'border-emerald-100 shadow-emerald-50'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${hasConverged ? 'from-amber-400 to-amber-300' : 'from-emerald-400 to-emerald-300'}`}></div>
          
          {hasConverged ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Optimization Converged</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Optimization converged under current stopping criteria.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-full text-left mb-6">
                <div className="flex items-center justify-between mb-3 border-b border-amber-200/50 pb-3">
                  <span className="text-amber-700 text-sm font-bold">Best Achieved FWHM:</span>
                  <span className="text-amber-600 text-2xl font-bold">{Math.min(...timelineData.map(r => parseFloat(r.fwhm))).toFixed(2)} meV</span>
                </div>
                <div className="text-xs text-amber-700 space-y-1.5">
                  <span className="font-bold block mb-1.5 uppercase tracking-wide opacity-80">Reason:</span>
                  <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500"></span>No improvement for {CONVERGENCE_N} BO iterations</p>
                  <p className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500"></span>Expected Improvement &lt; {EI_THRESHOLD}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setForceContinue(true)}
                className="w-full py-2.5 px-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-colors text-sm shadow-sm"
              >
                Force Continue Optimization
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">Next Suggested Experiment</h3>
              
              {suggestions.length > 0 ? (
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Growth Temp (GTE)</span>
                    <span className="text-slate-900 font-bold">{suggestions[0].GTE_celsius} °C</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Growth Time (GTI)</span>
                    <span className="text-slate-900 font-bold">{suggestions[0].GTI_minutes} min</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Ar Flow (FRA)</span>
                    <span className="text-slate-900 font-bold">{suggestions[0].FRA_sccm} sccm</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Pressure</span>
                    <span className="text-slate-900 font-bold">{suggestions[0].Pressure_Torr} Torr</span>
                  </div>
                  
                  <div className="mt-6 pt-4 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex justify-between items-end">
                      <span className="text-emerald-700 text-sm font-bold">Predicted FWHM:</span>
                      <span className="text-emerald-600 text-2xl font-bold">{predictedFwhm.toFixed(1)} <span className="text-sm font-normal opacity-70">± {predictedUncertainty.toFixed(1)}</span></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">No suggestions ready.</div>
              )}

              {suggestions.length > 0 && !loading && (
                <form onSubmit={handleAddExperiment} className="mt-6 pt-4 flex gap-2">
                  <input 
                    type="number" step="0.01" required value={fwhmResult} onChange={(e) => setFwhmResult(e.target.value)}
                    placeholder="Actual FWHM..."
                    className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <button disabled={submitting} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50">
                    <Save className="w-4 h-4" /> Log Result
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Optimization;
