import React, { useState, useEffect } from 'react';

const Optimization = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
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

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-2">Active Learning Loop</h2>
      <p className="text-slate-400 mb-8">Gaussian Process Surrogate Model & Bayesian Optimization</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Gaussian Surrogate Model</h3>
            <div className="h-64 bg-slate-900 rounded-lg border border-slate-700 p-6 flex flex-col justify-center items-center">
              {loading ? (
                <span className="text-slate-500 animate-pulse">Loading model data...</span>
              ) : modelInfo?.status === 'fitted' ? (
                <>
                  <div className="text-slate-300 text-lg mb-2">Model Status: <span className="text-emerald-400 font-bold">Fitted</span></div>
                  <div className="text-slate-400 text-sm mb-1">Training Samples: <span className="text-white">{modelInfo.n_train_samples}</span></div>
                  <div className="text-slate-400 text-sm mb-1">Train MAE: <span className="text-white">{modelInfo.MAE_meV} meV</span></div>
                  <div className="text-slate-400 text-sm mb-1">R² Score: <span className="text-white">{modelInfo.R2_score}</span></div>
                  <div className="text-slate-500 text-xs mt-4 text-center">Kernel: {modelInfo.kernel}</div>
                </>
              ) : (
                <span className="text-slate-500">Model not fitted yet. Upload data to begin.</span>
              )}
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Acquisition Function (Expected Improvement)</h3>
            <div className="h-48 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
              <span className="text-slate-500">Plotly Graph will render here</span>
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
              disabled={suggestions.length === 0}
              className={`w-full mt-6 py-2 rounded-lg transition-colors ${suggestions.length > 0 ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              Run Experiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimization;
