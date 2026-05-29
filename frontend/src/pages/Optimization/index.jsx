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
  const [sliceMode, setSliceMode] = useState('suggestion'); // 'suggestion' or 'latest'
  const [boStarted, setBoStarted] = useState(false);
  const [error, setError] = useState(null);
  
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
          
          const plotRes = await fetch(`http://localhost:8000/thermal-cvd/plot-data?slice_mode=${sliceMode}`);
          if (plotRes.ok) {
            const pd = await plotRes.json();
            setPlotData(pd);
            if (pd.training_points.x.length > pd.training_points.initial_count) {
              setBoStarted(true);
            }
          }
          
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

  useEffect(() => {
    fetchModelData();
  }, [sliceMode]); // Re-fetch when slice mode changes

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
    
    const sliceData = (arr, start, end) => arr ? arr.slice(start, end) : [];
    const createPoints = (start, end, prefix, indexOffset = 0) => {
      const sliceDists = sliceData(plotData.training_points.slice_distances || [], start, end);
      // Map distance (0 to ~1.73 in normalized 3D) to opacity
      // Falloff is strong enough to show 4D distance, but minimum is 0.25 so points are never completely invisible
      const opacities = sliceDists.map(d => Math.max(0.25, 1.0 - (d * 2.5)));
      
      return {
        x: sliceData(plotData.training_points.x, start, end),
        y: sliceData(plotData.training_points.y, start, end),
        opacities: opacities,
        customdata: sliceData(plotData.training_points.x, start, end).map((_, i) => {
          const dist = sliceDists[i];
          let distText = 'Exact Match';
          if (dist > 0.01) distText = 'Very Close';
          if (dist > 0.15) distText = 'Moderate Mismatch';
          if (dist > 0.4) distText = 'High Mismatch';
          
          return [
            `${prefix}-${i + 1 + indexOffset}`,
            sliceData(plotData.training_points.gti, start, end)[i],
            sliceData(plotData.training_points.fra, start, end)[i],
            sliceData(plotData.training_points.pressure, start, end)[i],
            distText,
            sliceData(plotData.training_points.gte, start, end)[i]
          ];
        })
      };
    };

    const n_total = plotData.training_points.x.length;
    const initPts = createPoints(0, n_init, 'Init', 0);
    const oldBoPts = n_total > n_init ? createPoints(n_init, n_total - 1, 'BO', 0) : {x:[], y:[], customdata:[], opacities:[]};
    const latestPt = n_total > n_init ? createPoints(n_total - 1, n_total, 'BO', n_total - 1 - n_init) : {x:[], y:[], customdata:[], opacities:[]};

    // Combine Init, Old BO, and Latest experiments as Historical Points
    let histX = [...initPts.x, ...oldBoPts.x, ...latestPt.x];
    let histY = [...initPts.y, ...oldBoPts.y, ...latestPt.y];
    let histCustom = [...initPts.customdata, ...oldBoPts.customdata, ...latestPt.customdata];
    let histOpacities = [...initPts.opacities, ...oldBoPts.opacities, ...latestPt.opacities];

    // Sort historical points by X so connecting line goes smoothly left to right
    const zipped = histX.map((x, i) => ({x, y: histY[i], custom: histCustom[i], op: histOpacities[i]}));
    zipped.sort((a, b) => a.x - b.x);
    
    histX = zipped.map(z => z.x);
    histY = zipped.map(z => z.y);
    histCustom = zipped.map(z => z.custom);
    histOpacities = zipped.map(z => z.op);

    const hoverTemplate = `<b>Experiment %{customdata[0]}</b><br><br>GTE: %{customdata[5]} °C<br>GTI: %{customdata[1]} min<br>FRA: %{customdata[2]} sccm<br>Pressure: %{customdata[3]} Torr<br><br><b>4D Mismatch to Slice:</b> %{customdata[4]}<br><br><b>Measured FWHM: %{y} meV</b><extra></extra>`;

    const visibleHistory = plotData.ei_history || [];
    if (visibleHistory.length > 0) {
      const currentCurve = visibleHistory[visibleHistory.length - 1];
      const maxIdx = currentCurve.indexOf(Math.max(...currentCurve));
      plotData.maxEITemp = plotData.x[maxIdx];
      plotData.maxEIVal = currentCurve[maxIdx];
      plotData.maxEIMu = plotData.mu[maxIdx];
    }

    const bestIdx = histY.indexOf(Math.min(...histY));
    const bestX = bestIdx >= 0 ? histX[bestIdx] : null;
    const bestY = bestIdx >= 0 ? histY[bestIdx] : null;

    gpTraces = [
      {
        x: plotData.x.concat(plotData.x.slice().reverse()),
        y: plotData.mu.map((m, i) => m + 1.96 * plotData.sigma[i]).concat(plotData.mu.map((m, i) => m - 1.96 * plotData.sigma[i]).reverse()),
        type: 'scatter', fill: 'toself', fillcolor: 'rgba(241, 196, 15, 0.28)', opacity: 1, line: {color: 'transparent'}, name: '95% confidence interval', hoverinfo: 'skip'
      },
      {
        x: plotData.x, y: plotData.mu, type: 'scatter', mode: 'lines', name: 'Surrogate model', line: {color: '#2C3E50', width: 2, dash: 'dash'}, hoverinfo: 'skip'
      },
      {
        x: histX, y: histY, customdata: histCustom, type: 'scatter', mode: 'markers', name: 'Observations',
        marker: {color: '#ef4444', size: 12, symbol: 'diamond', line: {color: '#991b1b', width: 1}, opacity: 1}, hovertemplate: hoverTemplate
      }
    ];

    if (boStarted && bestX !== null && bestY !== null) {
      gpTraces.push({
        x: [bestX], y: [bestY], type: 'scatter', mode: 'markers', name: 'Best Historical Experiment',
        marker: {color: 'transparent', size: 16, symbol: 'diamond', line: {color: '#2ECC71', width: 3}}, hoverinfo: 'skip'
      });
    }

    if (boStarted && plotData.maxEITemp) {
      const sug = suggestions && suggestions.length > 0 ? suggestions[0] : null;
      let starHover = '<b>Suggested Experiment</b><extra></extra>';
      if (sug) {
        const gte = sug.GTE_celsius || sug.GTE || 0;
        const gti = sug.GTI_minutes || sug.GTI || 0;
        const fra = sug.FRA_sccm || sug.FRA || 0;
        const pressure = sug.Pressure_Torr || sug.Pressure || 0;
        const predFWHM = Number(sug.predicted_FWHM_meV || 0).toFixed(1);
        const predSigma = Number(sug.predicted_FWHM_sigma || 0).toFixed(1);
        
        starHover = `<b>Suggested Experiment</b><br><br>GTE: ${gte} °C<br>GTI: ${gti} min<br>FRA: ${fra} sccm<br>Pressure: ${pressure} Torr<br><br><b>Predicted FWHM: ${predFWHM} ± ${predSigma} meV</b><extra></extra>`;
      }
      gpTraces.push({
        x: [plotData.maxEITemp], y: [plotData.maxEIMu], type: 'scatter', mode: 'markers', name: 'Next Suggested Experiment',
        marker: {color: '#7C4DFF', size: 20, symbol: 'star', line: {color: '#6C63FF', width: 2}, opacity: 0.95}, hovertemplate: starHover
      });
    }

    const startIndex = 0; // Show all steps
    
    const eiColors = ['#00BCD4', '#0097A7', '#00ACC1', '#4DD0E1', '#80DEEA', '#B2EBF2', '#E0F7FA'];
    eiTraces = visibleHistory.map((ei_curve, relativeIdx) => {
      const actualStep = startIndex + relativeIdx + 1;
      const isCurrent = relativeIdx === visibleHistory.length - 1;
      return {
        x: plotData.x, y: ei_curve, type: 'scatter', mode: 'lines', name: 'Acquisition Function',
        line: { color: isCurrent ? '#00BCD4' : eiColors[relativeIdx % eiColors.length], width: isCurrent ? 2 : 1, dash: 'solid' },
        showlegend: isCurrent
      };
    });

    if (visibleHistory.length > 0) {
      eiTraces.push({
        x: [plotData.maxEITemp],
        y: [plotData.maxEIVal],
        type: 'scatter',
        mode: 'markers',
        marker: { color: 'yellow', size: 12, symbol: 'diamond', line: {color: 'black', width: 1} },
        name: 'Next Best Guess',
        hoverinfo: 'skip'
      });
    }
  }

  let confidenceLevel = "Calculating...";
  let confidenceColor = "text-slate-500";
  let confidenceBg = "bg-slate-50";

  if (plotData && plotData.sigma && plotData.sigma.length > 0) {
    // Use maximum posterior standard deviation (uncertainty) to detect unexplored regions
    const maxUncertainty = Math.max(...plotData.sigma);
    
    if (maxUncertainty > 15.0) {
      confidenceLevel = "Low (High Uncertainty)";
      confidenceColor = "text-amber-600";
      confidenceBg = "bg-amber-50";
    } else if (maxUncertainty > 8.0) {
      confidenceLevel = "Moderate";
      confidenceColor = "text-blue-600";
      confidenceBg = "bg-blue-50";
    } else {
      confidenceLevel = "High";
      confidenceColor = "text-emerald-600";
      confidenceBg = "bg-emerald-50";
    }
  } else if (modelInfo) {
    // Fallback if plotData isn't loaded yet
    if (modelInfo.n_train_samples < 20) {
      confidenceLevel = "Low (Exploration)";
      confidenceColor = "text-amber-600";
      confidenceBg = "bg-amber-50";
    } else {
      confidenceLevel = "Moderate";
      confidenceColor = "text-blue-600";
      confidenceBg = "bg-blue-50";
    }
  }

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

  // Shared plot variables for axes formatting
  const sharedXMin = plotData && plotData.x ? Math.min(...plotData.x) : 0;
  const sharedXMax = plotData && plotData.x ? Math.max(...plotData.x) : 0;
  const sharedXRange = [sharedXMin - 0.5, sharedXMax + 0.5];
  const sharedTickVals = Array.from({length: Math.max(0, Math.ceil(sharedXMax) + 1)}, (_, i) => i);
  const sharedTickText = sharedTickVals.map(i => `Exp ${i + 1}`);

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
          <div className="flex flex-col mb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Gaussian Process Surrogate Model (Sequence Visualization) <Info className="w-4 h-4 text-slate-400" />
              </h3>
              
              <div className="flex bg-slate-100 rounded-lg p-1 ml-4 shadow-sm border border-slate-200">
                <button 
                  onClick={() => setSliceMode('suggestion')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sliceMode === 'suggestion' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  View at Next Suggestion
                </button>
                <button 
                  onClick={() => setSliceMode('latest')}
                  disabled={!plotData || plotData.training_points.x.length <= plotData.training_points.initial_count}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sliceMode === 'latest' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  title="View slice anchored at your most recently logged experiment"
                >
                  View at Latest Experiment
                </button>
              </div>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mt-3 text-xs text-slate-600">
              <strong className="text-blue-800 mb-1 block">Sequence Visualization GP</strong>
              <ul className="list-disc pl-4 space-y-1 mb-2">
                <li><strong>X-axis:</strong> Experiment Index (not a physical process variable)</li>
                <li><strong>Purpose:</strong> Visualize surrogate learning and uncertainty contraction.</li>
              </ul>
              <p className="text-blue-800/80 italic">
                All Bayesian Optimization decisions and Expected Improvement calculations are computed using the full 4D GP over: [GTE, GTI, FRA, Pressure].
              </p>
            </div>
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
                   xaxis: { 
                     title: 'Design Space Index (Sequential)', 
                     gridcolor: '#f1f5f9', 
                     color: '#64748b',
                     tickmode: 'array',
                     tickvals: sharedTickVals,
                     ticktext: sharedTickText,
                     range: sharedXRange
                   },
                   yaxis: { title: 'Predicted FWHM (meV)', gridcolor: '#f1f5f9', color: '#64748b' },
                   legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(255, 255, 255, 0.9)', font: {color: '#334155'}, bordercolor: '#e2e8f0', borderwidth: 1 },
                   shapes: boStarted && plotData && plotData.maxEITemp ? [{
                    type: 'line', x0: plotData.maxEITemp, y0: 0, x1: plotData.maxEITemp, y1: 1, yref: 'paper',
                    line: { color: 'rgba(124, 77, 255, 0.45)', width: 1, dash: 'dash' }
                   }] : []
                 }}
                 useResizeHandler style={{width: '100%', height: '100%'}}
               />
             )}
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-md font-semibold text-slate-800 mb-2">Why This Experiment Was Selected</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">Each point is a single experiment with 4 input variables and 1 measured output (PL FWHM).</p>
          
          <div className="space-y-5 flex-1 opacity-90">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-sm" style={{backgroundColor: 'rgba(241, 196, 15, 0.28)'}}></div>
              <div className="text-sm"><span className="text-amber-600 font-bold">Soft Gold:</span> <span className="text-slate-500">95% Confidence Interval</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 flex items-center justify-center text-slate-800 font-bold">--</div>
              <div className="text-sm"><span className="text-slate-700 font-bold">Dashed Line:</span> <span className="text-slate-500">Surrogate Model</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rotate-45 bg-[#ef4444] border border-[#991b1b]"></div>
              <div className="text-sm"><span className="text-red-600 font-bold">Red Diamond:</span> <span className="text-slate-500">Historical Observations</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rotate-45 border-[2px] border-[#2ECC71]"></div>
              <div className="text-sm"><span className="text-[#2ECC71] font-bold">Green Outline:</span> <span className="text-slate-500">Current Best</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 flex items-center justify-center text-[#7C4DFF] font-bold text-lg" style={{textShadow: '0 0 5px rgba(124, 77, 255, 0.5)'}}>★</div>
              <div className="text-sm"><span className="text-[#7C4DFF] font-bold">Purple Star:</span> <span className="text-slate-500">Next Suggested Exp.</span></div>
            </div>
          </div>
          
          <div className={`mt-auto p-4 rounded-xl border ${confidenceBg}`}>
            <h4 className={`font-semibold text-sm mb-1 flex items-center gap-2 ${confidenceColor}`}>
              <TrendingDown className="w-4 h-4" /> Surrogate Model Confidence
            </h4>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-xl font-bold ${confidenceColor}`}>{confidenceLevel}</span>
              <span className={`text-xs ${confidenceColor} opacity-75`}>Based on global uncertainty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: EI, Timeline, Suggestion */}
      {!boStarted ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Target className="w-16 h-16 text-[#7C4DFF] mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to generate next BO suggestion</h3>
          <p className="text-slate-500 mb-8 max-w-lg">
            The initial dataset has been loaded and the Gaussian Process surrogate model is fitted. You can now begin the active learning loop to explore the parameter space.
          </p>
          <button 
            onClick={() => setBoStarted(true)}
            className="bg-[#7C4DFF] hover:bg-[#6C63FF] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 transition-all transform hover:scale-105"
          >
            Run Bayesian Optimization
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Acquisition History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Expected Improvement Landscape <span className="text-sm font-normal text-slate-500">(Acquisition Function)</span></h3>
            <Info className="w-5 h-5 text-blue-500" />
          </div>
          <div className="h-[350px] w-full rounded-xl overflow-hidden">
             {eiTraces.length > 0 && (
               <Plot
                 data={eiTraces}
                 layout={{
                   autosize: true, margin: {l: 50, r: 20, b: 40, t: 80},
                   paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                   xaxis: { 
                     title: 'Design Space Index (Sequential)', 
                     gridcolor: '#f1f5f9', 
                     color: '#64748b',
                     tickmode: 'array',
                     tickvals: sharedTickVals,
                     ticktext: sharedTickText,
                     range: sharedXRange
                   },
                   yaxis: { title: 'Expected Improvement', gridcolor: '#f1f5f9', color: '#64748b' },
                   legend: { 
                     orientation: 'h', 
                     yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1
                   },
                   shapes: boStarted && plotData && plotData.maxEITemp ? [{
                    type: 'line',
                    x0: plotData.maxEITemp,
                    y0: 0,
                    x1: plotData.maxEITemp,
                    y1: 1,
                    yref: 'paper',
                    line: { color: 'rgba(124, 77, 255, 0.45)', width: 1, dash: 'dash' }
                  }] : [],
                  annotations: plotData && plotData.maxEITemp ? [{
                    x: plotData.maxEITemp,
                    y: plotData.maxEIVal,
                    text: `<b>Selected by BO</b><br>Max Expected Improvement`,
                    showarrow: true,
                    arrowhead: 0,
                    ax: 40,
                    ay: -30,
                    bgcolor: '#7C4DFF',
                    font: { color: 'white', size: 10 },
                    borderpad: 6,
                    bordercolor: 'rgba(0,0,0,0)'
                  }] : []
                 }}
                 useResizeHandler style={{width: '100%', height: '100%'}}
               />
             )}
          </div>
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
      )}
    </div>
  );
};

export default Optimization;
