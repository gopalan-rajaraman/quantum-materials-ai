import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

const Optimization = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const infoRes = await fetch('http://localhost:8000/thermal-cvd/info');
        if (infoRes.ok) {
          const info = await infoRes.json();
          setModelInfo(info);
          
          if (info.status === 'fitted') {
            const suggRes = await fetch('http://localhost:8000/thermal-cvd/suggest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ n_suggestions: 1 })
            });
            if (suggRes.ok) {
              const suggData = await suggRes.json();
              setSuggestions(suggData.recommendations);
            }
            
            const plotRes = await fetch('http://localhost:8000/thermal-cvd/plot-data');
            if (plotRes.ok) {
              const pData = await plotRes.json();
              setPlotData(pData);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRunExperiment = async () => {
    if (suggestions.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/thermal-cvd/simulate-run', { method: 'POST' });
      if (res.ok) {
        // Refetch everything
        const infoRes = await fetch('http://localhost:8000/thermal-cvd/info');
        if (infoRes.ok) setModelInfo(await infoRes.json());
        
        const suggRes = await fetch('http://localhost:8000/thermal-cvd/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ n_suggestions: 1 })
        });
        if (suggRes.ok) setSuggestions((await suggRes.json()).recommendations);
        
        const plotRes = await fetch('http://localhost:8000/thermal-cvd/plot-data');
        if (plotRes.ok) setPlotData(await plotRes.json());
      }
    } catch (e) {
      console.error(e);
      alert('Failed to simulate experiment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-2">Active Learning Loop</h2>
      <p className="text-slate-400 mb-8">Gaussian Process Surrogate Model & Bayesian Optimization</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Gaussian Surrogate Model</h3>
            <div className="h-64 bg-slate-900 rounded-lg border border-slate-700 p-2 flex flex-col justify-center items-center relative overflow-hidden">
              {loading ? (
                <span className="text-slate-500 animate-pulse">Loading model data...</span>
              ) : modelInfo?.status === 'fitted' && plotData ? (
                <div className="w-full h-full relative">
                  <div className="absolute top-0 right-0 text-xs text-slate-400 z-10 bg-slate-900/80 px-2 py-1 rounded">
                    R²: {modelInfo.R2_score} | MAE: {modelInfo.MAE_meV} meV
                  </div>
                  <Plot
                    data={[
                      {
                        x: plotData.x.concat(plotData.x.slice().reverse()),
                        y: plotData.mu.map((m, i) => m + 1.96 * plotData.sigma[i]).concat(
                           plotData.mu.map((m, i) => m - 1.96 * plotData.sigma[i]).reverse()
                        ),
                        type: 'scatter',
                        fill: 'toself',
                        fillcolor: 'rgba(16, 185, 129, 0.2)',
                        line: {color: 'transparent'},
                        name: 'Uncertainty (95%)'
                      },
                      {
                        x: plotData.x,
                        y: plotData.mu,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Predicted FWHM',
                        line: {color: '#10b981', width: 2}
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: {l: 50, r: 20, b: 40, t: 20},
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#334155', color: '#94a3b8' },
                      yaxis: { title: 'FWHM (meV)', gridcolor: '#334155', color: '#94a3b8' },
                      showlegend: false
                    }}
                    useResizeHandler={true}
                    style={{width: '100%', height: '100%'}}
                  />
                </div>
              ) : (
                <span className="text-slate-500">Model not fitted yet. Upload data to begin.</span>
              )}
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Acquisition Function (Expected Improvement)</h3>
            <div className="h-48 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center p-2 relative overflow-hidden">
              {loading ? (
                <span className="text-slate-500 animate-pulse">Loading...</span>
              ) : plotData ? (
                <div className="w-full h-full">
                  <Plot
                    data={[
                      {
                        x: plotData.x,
                        y: plotData.ei,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Expected Improvement',
                        fill: 'tozeroy',
                        fillcolor: 'rgba(6, 182, 212, 0.3)',
                        line: {color: '#06b6d4', width: 2}
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: {l: 50, r: 20, b: 40, t: 20},
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#334155', color: '#94a3b8' },
                      yaxis: { title: 'EI Value', gridcolor: '#334155', color: '#94a3b8' },
                      showlegend: false
                    }}
                    useResizeHandler={true}
                    style={{width: '100%', height: '100%'}}
                  />
                </div>
              ) : (
                <span className="text-slate-500">Plotly Graph will render here</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 border-t-4 border-t-cyan-500">
            <h3 className="text-lg font-semibold text-white mb-2">Next Suggested Experiment</h3>
            <p className="text-sm text-slate-400 mb-4">Based on max Expected Improvement</p>
            
            <div className="space-y-3">
              {loading ? (
                <div className="text-slate-500 text-sm py-4 animate-pulse">Computing predictions...</div>
              ) : suggestions.length > 0 ? (
                <>
                  <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Growth Temp (GTE)</span>
                    <span className="text-cyan-400 font-mono font-bold">{suggestions[0].GTE_celsius} °C</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Growth Time (GTI)</span>
                    <span className="text-cyan-400 font-mono font-bold">{suggestions[0].GTI_minutes} min</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Ar Flow (FRA)</span>
                    <span className="text-cyan-400 font-mono font-bold">{suggestions[0].FRA_sccm} sccm</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Pressure</span>
                    <span className="text-cyan-400 font-mono font-bold">{suggestions[0].Pressure_Torr} Torr</span>
                  </div>
                  <div className="bg-emerald-900/30 p-3 rounded-lg flex justify-between items-center border border-emerald-500/30 mt-4">
                    <span className="text-emerald-400 text-sm">Predicted FWHM</span>
                    <span className="text-emerald-400 font-mono font-bold">{suggestions[0].predicted_FWHM_meV} ± {suggestions[0].uncertainty_meV} meV</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded flex justify-between items-center">
                     <span className="text-slate-500 text-xs">EI Value</span>
                     <span className="text-slate-400 text-xs font-mono">{suggestions[0].EI_value}</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-sm py-4">No suggestions available. Please upload training data first.</div>
              )}
            </div>
            
            <button 
              onClick={handleRunExperiment}
              disabled={suggestions.length === 0 || loading}
              className={`w-full mt-6 py-2 rounded-lg transition-colors ${suggestions.length > 0 && !loading ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {loading ? "Running..." : "Simulate Run Experiment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimization;
