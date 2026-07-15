import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Target, Save, Info, TrendingDown, Trophy, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import api from '../../services/api';
import { useReactToPrint } from 'react-to-print';
import OptimizationReport from '../../components/OptimizationReport';
import { generateExcelReport } from '../../utils/excelExport';

const Optimization = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sliceMode, setSliceMode] = useState('suggestion'); // 'suggestion' or 'latest'
  const [boStarted, setBoStarted] = useState(false);
  
  
  const [fwhmResult, setFwhmResult] = useState('');
  const predictedFwhm = suggestions.length > 0 ? Number(suggestions[0].predicted_FWHM_meV) : NaN;
  const predictedUncertainty = suggestions.length > 0 ? Number(suggestions[0].uncertainty_meV) : NaN;
  const [actualVariables, setActualVariables] = useState({});
  const [forceContinue, setForceContinue] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  const [fetchingSuggestion, setFetchingSuggestion] = useState(false);
  const reportRef = useRef(null);

  const handleDownloadPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'Thermal_CVD_Optimization_Report',
    onBeforePrint: async () => setIsDownloading(true),
    onAfterPrint: () => setIsDownloading(false),
    onPrintError: (errorLocation, error) => {
      console.error('Print Error:', errorLocation, error);
      alert(`Failed to generate PDF: ${String(error)}`);
      setIsDownloading(false);
    }
  });

  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      const suggestion = suggestions && suggestions.length > 0 ? suggestions[0] : null;
      const expectedImprovement = suggestion ? (currentBestFWHM - predictedFwhm).toFixed(1) : '0.0';
      const nExperiments = timelineData ? timelineData.length : 0;
      const boIterations = timelineData ? timelineData.filter(r => r.type === 'User').length : 0;
      const bestExpIdx = timelineData ? timelineData.findIndex(r => parseFloat(r.fwhm) === currentBestFWHM) : -1;
      const bestExpName = bestExpIdx !== -1 ? `Experiment-${bestExpIdx + 1}` : '--';

      await generateExcelReport({
        currentBestFWHM,
        bestExpName,
        nExperiments,
        boIterations,
        expectedImprovement,
        timelineData,
        suggestion,
        modelInfo,
        plotData,
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      setActualVariables(suggestions[0].variables || {});
    }
  }, [suggestions]);

  const fetchSuggestion = async () => {
    setFetchingSuggestion(true);
    setSuggestionError(null);
    try {
      const sugg = await api.suggestExperiments(1);
      const recs = sugg.recommendations || [];
      setSuggestions(recs);
      if (recs.length === 0) {
        setSuggestionError('The model returned no recommendations. Ensure the model is fitted with a valid dataset.');
      }
    } catch (e) {
      console.error('Suggestion fetch failed:', e);
      setSuggestionError(e.message || 'Failed to fetch suggestion from the server.');
    } finally {
      setFetchingSuggestion(false);
    }
  };

  const fetchModelData = async () => {
    try {
      const info = await api.fetchModelInfo();
      setModelInfo(info);
      
      if (info.status === 'fitted') {
        try { await api.getBoProgress(); } catch (e) {}
        
        await fetchSuggestion();
        
        try {
          const pd = await api.getPlotData(sliceMode);
          setPlotData(pd);
          if (pd && pd.training_points && pd.training_points.x.length > pd.training_points.initial_count) {
            setBoStarted(true);
          }
        } catch (e) { console.error(e); }
        
        try {
          const timeline = await api.fetchTimeline();
          setTimelineData(timeline.timeline || []);
        } catch (e) { console.error(e); }
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
      await api.addManualExperiment({
        variables: Object.fromEntries(Object.entries(actualVariables).map(([k, v]) => [k, parseFloat(v)])),
        PL_FWHM: parseFloat(fwhmResult)
      });
      setFwhmResult('');
      setLoading(true);
      await fetchModelData();
    } catch (e) {
      alert('Failed to add experiment result: ' + e.message);
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
    const createPoints = (start, end) => {
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
          
          const vars = plotData.training_points.variables || {};
          const rowVars = Object.keys(vars).reduce((acc, key) => {
            acc[key] = sliceData(vars[key], start, end)[i];
            return acc;
          }, {});
          
          return [
            start + i + 1, // index
            distText,      // dist text
            rowVars        // variables
          ];
        })
      };
    };

    const n_total = plotData.training_points.x.length;
    const initPts = createPoints(0, n_init);
    const oldBoPts = n_total > n_init ? createPoints(n_init, n_total - 1) : {x:[], y:[], customdata:[], opacities:[]};
    const latestPt = n_total > n_init ? createPoints(n_total - 1, n_total) : {x:[], y:[], customdata:[], opacities:[]};

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

    const hoverTemplate = `<b>Experiment %{customdata[0]}</b><br><br>%{customdata[2]}<br><br><b>4D Mismatch to Slice:</b> %{customdata[1]}<br><br><b>Measured FWHM: %{y} meV</b><extra></extra>`;
    
    // Process histCustom to stringify variables
    histCustom = histCustom.map(c => {
      const varsStr = Object.entries(c[2]).map(([k, v]) => `${k}: ${v}`).join('<br>');
      return [c[0], c[1], varsStr];
    });

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
        type: 'scatter', fill: 'toself', fillcolor: 'rgba(255, 213, 0, 0.4)', opacity: 1, line: {color: 'transparent'}, name: '95% confidence interval', hoverinfo: 'skip'
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
        const varsStr = Object.entries(sug.variables || {}).map(([k, v]) => `${k}: ${v}`).join('<br>');
        const predFWHM = Number(sug.predicted_FWHM_meV || 0).toFixed(1);
        const predSigma = Number(sug.uncertainty_meV || 0).toFixed(1);
        
        starHover = `<b>Suggested Experiment</b><br><br>${varsStr}<br><br><b>Predicted FWHM: ${predFWHM} ± ${predSigma} meV</b><extra></extra>`;
      }
      gpTraces.push({
        x: [plotData.maxEITemp], y: [plotData.maxEIMu], type: 'scatter', mode: 'markers', name: 'Next Suggested Experiment',
        marker: {color: '#7C4DFF', size: 20, symbol: 'star', line: {color: '#6C63FF', width: 2}, opacity: 0.95}, hovertemplate: starHover
      });
    }

    const startIndex = 0; // Show all steps
    
    const eiColors = ['#3d2fb5', '#00BCD4', '#0097A7', '#00ACC1', '#4DD0E1', '#80DEEA', '#B2EBF2'];
    let normalizedLastCurve = null;
    eiTraces = visibleHistory.map((ei_curve, relativeIdx) => {
      const numeric = (ei_curve || []).map(v => Number(v));
      const valid = numeric.filter(Number.isFinite);
      const maxVal = valid.length ? Math.max(...valid) : 0;
      const yvals = maxVal > 0 ? numeric.map(v => Number.isFinite(v) ? (v / maxVal) * 100 : 0) : numeric.map(() => 0);
      const isCurrent = relativeIdx === visibleHistory.length - 1;
      if (isCurrent) normalizedLastCurve = yvals;
      return {
        x: plotData.x,
        y: yvals,
        type: 'scatter',
        mode: 'lines',
        name: isCurrent ? 'Expected Improvement' : `Expected Improvement (${relativeIdx + 1})`,
        line: { color: isCurrent ? eiColors[0] : eiColors[(relativeIdx + 1) % eiColors.length], width: isCurrent ? 2 : 1 },
        fill: 'tozeroy',
        fillcolor: isCurrent ? 'rgba(61,47,181,0.12)' : 'rgba(61,47,181,0.06)',
        showlegend: isCurrent
      };
    });

    if (visibleHistory.length > 0) {
      const maxX = plotData.maxEITemp;
      const maxIndex = plotData.x ? plotData.x.indexOf(maxX) : -1;
      const markerY = (normalizedLastCurve && maxIndex >= 0) ? (normalizedLastCurve[maxIndex] || 100) : 100;
      eiTraces.push({
        x: [maxX],
        y: [markerY],
        type: 'scatter',
        mode: 'markers',
        marker: { color: '#ef4444', size: 12, symbol: 'diamond', line: { color: '#7C4DFF', width: 1 } },
        name: 'Selected maximum EI point',
        hoverinfo: 'skip'
      });
    } else if (plotData && Array.isArray(plotData.search_ei) && plotData.search_ei.length) {
      // Fallback: construct EI trace from search_ei if ei_history isn't provided
      try {
        const s = plotData.search_ei.map((r) => ({ idx: Number(r.candidate_index ?? r.index ?? 0), ei: Number(r.ei ?? 0) }));
        const maxS = Math.max(...s.map(o => o.ei).filter(Number.isFinite));
        const xs = s.map(o => o.idx);
        const ys = s.map(o => Number.isFinite(o.ei) && maxS > 0 ? (o.ei / maxS) * 100 : 0);
        eiTraces.push({ x: xs, y: ys, type: 'scatter', mode: 'lines', name: 'Expected Improvement', line: { color: eiColors[0], width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(61,47,181,0.12)' });
      } catch (e) {
        // ignore fallback errors
      }
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

  // --- Campaign History & Convergence Processing ---
  let initialData = [];
  let boData = [];
  let convergenceSeries = [];
  let initialBestFWHM = null;
  let currentBestFWHM = null;
  let improvementPercent = 0;

  if (timelineData && timelineData.length > 0) {
    initialData = timelineData.filter(r => r.type === 'Initial');
    boData = timelineData.filter(r => r.type === 'User');

    if (initialData.length > 0) {
      initialBestFWHM = Math.min(...initialData.map(r => parseFloat(r.fwhm)));
      currentBestFWHM = initialBestFWHM;
      
      // Init convergence series at Iteration 0
      convergenceSeries.push({
        iteration: 0,
        bestFWHM: initialBestFWHM
      });

      // Calculate monotonic best for each BO iteration
      boData = boData.map((row, idx) => {
        const val = parseFloat(row.fwhm);
        if (val < currentBestFWHM) {
          currentBestFWHM = val;
        }
        convergenceSeries.push({
          iteration: idx + 1,
          bestFWHM: currentBestFWHM
        });
        return { ...row, bestSoFar: currentBestFWHM };
      });

      if (initialBestFWHM > 0) {
        improvementPercent = ((initialBestFWHM - currentBestFWHM) / initialBestFWHM) * 100;
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
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Optimization Dashboard</h2>
          <p className="text-slate-500">Bayesian Optimization engine tracking FWHM minimization.</p>
        </div>
        {boStarted && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button 
              onClick={handleDownloadExcel} 
              disabled={isExportingExcel || isDownloading}
              className="flex items-center justify-center gap-2 bg-[#0ca678] hover:bg-[#099268] text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isExportingExcel ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isExportingExcel ? 'Exporting...' : 'Export Excel'}
            </button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={isDownloading || isExportingExcel}
              className="flex items-center justify-center gap-2 bg-[#2f277a] hover:bg-[#1f1a54] text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isDownloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>
      
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '794px' }}>
        <OptimizationReport 
          ref={reportRef}
          modelInfo={modelInfo}
          plotData={plotData}
          timelineData={timelineData}
          suggestions={suggestions}
          gpTraces={gpTraces}
          eiTraces={eiTraces}
          sharedTickVals={sharedTickVals}
          sharedTickText={sharedTickText}
          sharedXRange={sharedXRange}
          predictedFwhm={predictedFwhm}
          predictedUncertainty={predictedUncertainty}
          initialBestFWHM={initialBestFWHM}
          currentBestFWHM={currentBestFWHM}
        />
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
            <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
              <h3 className="text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
                Gaussian Process Surrogate Model (Sequence Visualization) <Info className="w-4 h-4 text-slate-400 shrink-0" />
              </h3>
              
              <div className="flex flex-col sm:flex-row bg-slate-100 rounded-lg p-1 w-full xl:w-auto shadow-sm border border-slate-200">
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
                All Bayesian Optimization decisions and Expected Improvement calculations are computed using the full 4D GP over your selected optimization variables.
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
                   yaxis: { title: 'Predicted FWHM (meV)', gridcolor: '#f1f5f9', color: '#64748b' },
                   legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.08, yanchor: 'bottom', bgcolor: 'rgba(255, 255, 255, 0.9)', font: {color: '#334155'}, bordercolor: '#e2e8f0', borderwidth: 1 },
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
              <div className="w-4 h-4 rounded-sm border border-amber-500" style={{backgroundColor: 'rgba(255, 213, 0, 0.4)'}}></div>
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
              <div className="w-4 h-4 flex items-center justify-center text-[#7C4DFF] font-bold text-lg" style={{textShadow: '0 0 5px rgba(124, 77, 255, 0.5)'}}>Γÿà</div>
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
            onClick={async () => { setBoStarted(true); await fetchSuggestion(); }}
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
                   autosize: true, margin: {l: 50, r: 20, b: 40, t: 110},
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
                   legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.08, yanchor: 'bottom' },
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
                  {Object.entries(suggestions[0].variables || {}).map(([varName, varVal]) => {
                    const formattedVal = (typeof varVal === 'number' || !isNaN(varVal)) ? Number(varVal).toFixed(2) : varVal;
                    return (
                      <div key={varName} className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-500">{varName}</span>
                        <span className="text-slate-900 font-bold">{formattedVal}</span>
                      </div>
                    );
                  })}
                  
                  <div className="mt-6 pt-4 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex justify-between items-end">
                      <span className="text-emerald-700 text-sm font-bold">Predicted FWHM:</span>
                      <span className="text-emerald-600 text-2xl font-bold">{predictedFwhm.toFixed(1)} <span className="text-sm font-normal opacity-70">± {predictedUncertainty.toFixed(1)}</span></span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 italic text-center px-4">
                    Note: The Sequence GP plot (top) is a 1D visualization only. This suggested experiment is the true optimal point mathematically derived from the full 4D physical parameter space.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
                  {fetchingSuggestion ? (
                    <>
                      <RefreshCw className="w-8 h-8 text-[#7C4DFF] animate-spin" />
                      <p className="text-slate-500 text-sm">Fetching next suggestion from model...</p>
                    </>
                  ) : suggestionError ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="text-red-600 text-sm font-semibold">Could not load suggestion</p>
                      <p className="text-slate-400 text-xs max-w-[200px] leading-relaxed">{suggestionError}</p>
                      <button
                        onClick={fetchSuggestion}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C63FF] text-white text-sm font-bold rounded-xl transition-all"
                      >
                        <RefreshCw className="w-4 h-4" /> Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Target className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm">No suggestion loaded yet.</p>
                      <button
                        onClick={fetchSuggestion}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C63FF] text-white text-sm font-bold rounded-xl transition-all"
                      >
                        <RefreshCw className="w-4 h-4" /> Get Suggestion
                      </button>
                    </>
                  )}
                </div>
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

      {/* Campaign Convergence & History */}
      {boStarted && timelineData && timelineData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6 mb-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-[#7C4DFF]" /> BO Campaign History &amp; Convergence
          </h3>

          {/* Two-column: KPI Summary on left, View Experiments on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* LEFT: KPI Summary */}
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Campaign Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Initial Best FWHM</p>
                  <p className="text-2xl font-bold text-slate-700">{initialBestFWHM?.toFixed(1) || '--'} meV</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Current Best FWHM</p>
                  <p className="text-2xl font-bold text-emerald-700">{currentBestFWHM?.toFixed(1) || '--'} meV</p>
                </div>
                {boData.length > 0 ? (
                  <>
                    <div className="bg-[#f3f0ff] border border-[#e5d9f2] rounded-xl p-4">
                      <p className="text-xs font-bold text-[#7C4DFF] uppercase tracking-wide mb-1">Improvement</p>
                      <p className="text-2xl font-bold text-[#6C63FF]">{improvementPercent.toFixed(1)}%</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">BO Iterations</p>
                      <p className="text-2xl font-bold text-blue-700">{boData.length}</p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-center">
                    <p className="text-sm font-bold text-amber-700 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin-slow opacity-75" />
                      Status: Awaiting Experimental Validation
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: View Experiments */}
            <div className="flex flex-col">
              <h4 className="font-bold text-slate-800 mb-2">BO Campaign (User Experiments)</h4>
              <div className="overflow-y-auto border border-slate-200 rounded-xl" style={{maxHeight: '220px'}}>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-600 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3">Iter</th>
                      {boData.length > 0 && Object.keys(boData[0].variables || {}).map(key => (
                        <th key={key} className="px-4 py-3 truncate max-w-[80px]" title={key}>{key}</th>
                      ))}
                      <th className="px-4 py-3 text-emerald-600">FWHM</th>
                      <th className="px-4 py-3 text-[#7C4DFF]">Best So Far</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boData.map((row) => (
                      <tr key={`experiment-${row.step}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.step}</td>
                        {Object.values(row.variables || {}).map((val, i) => (
                          <td key={i} className="px-4 py-3 text-slate-500">{val}</td>
                        ))}
                        <td className="px-4 py-3 font-bold text-emerald-600">{row.fwhm}</td>
                        <td className="px-4 py-3 font-bold text-[#7C4DFF]">{row.bestSoFar?.toFixed(2)}</td>
                      </tr>
                    ))}
                    {boData.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                          No BO iterations completed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <details className="mt-4 group">
                <summary className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-[#7C4DFF] flex items-center gap-1 transition-colors">
                  &#9658; View Initial Training Dataset ({initialData.length} samples)
                </summary>
                <div className="overflow-y-auto max-h-[160px] mt-2 border border-slate-200 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2">Sample ID</th>
                        {initialData.length > 0 && Object.keys(initialData[0].variables || {}).map(key => (
                          <th key={key} className="px-4 py-2 truncate max-w-[80px]" title={key}>{key}</th>
                        ))}
                        <th className="px-4 py-2 text-slate-700">FWHM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialData.map((row, idx) => (
                        <tr key={`experiment-${idx + 1}`} className="border-b border-slate-100">
                          <td className="px-4 py-2 font-medium text-slate-700">{`Experiment-${idx + 1}`}</td>
                          {Object.values(row.variables || {}).map((val, i) => (
                            <td key={i} className="px-4 py-2 text-slate-500">{val}</td>
                          ))}
                          <td className="px-4 py-2 text-slate-700 font-semibold">{row.fwhm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Optimization;
