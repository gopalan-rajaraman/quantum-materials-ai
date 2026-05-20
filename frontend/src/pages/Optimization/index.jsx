import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { FlaskConical, Target, TrendingDown, ArrowRight, Save, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Optimization = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boProgress, setBoProgress] = useState(null);
  
  const [fwhmResult, setFwhmResult] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchModelData = async () => {
    try {
      const infoRes = await fetch('http://localhost:8000/thermal-cvd/info');
      if (infoRes.ok) {
        const info = await infoRes.json();
        setModelInfo(info);
        
        if (info.status === 'fitted') {
          // Fetch BO progress
          const progressRes = await fetch('http://localhost:8000/thermal-cvd/bo-progress');
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            setBoProgress(progressData);
          }
          
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

  useEffect(() => {
    fetchModelData();
  }, []);

  const handleAddExperiment = async (e) => {
    e.preventDefault();
    if (suggestions.length === 0 || !fwhmResult) return;
    
    setSubmitting(true);
    try {
      const payload = {
        GTE: suggestions[0].GTE_celsius,
        GTI: suggestions[0].GTI_minutes,
        FRA: suggestions[0].FRA_sccm,
        Pressure: suggestions[0].Pressure_Torr,
        PL_FWHM: parseFloat(fwhmResult)
      };

      const res = await fetch('http://localhost:8000/thermal-cvd/add-experiment', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setFwhmResult('');
        // Refetch everything
        setLoading(true);
        await fetchModelData();
      } else {
        alert("Failed to submit result.");
      }
    } catch (e) {
      console.error(e);
      alert('Failed to add experiment result.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Active Learning Loop</h2>
          <p className="text-slate-500">Gaussian Process Surrogate Model & Bayesian Optimization.</p>
        </div>
        <button 
          onClick={() => navigate('/results')}
          disabled={boProgress && !boProgress.can_access_results}
          className={`flex items-center space-x-2 px-5 py-2.5 border font-medium rounded-xl shadow-sm transition-all ${
            boProgress && !boProgress.can_access_results
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-indigo-600'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span>View Convergence Results</span>
        </button>
      </div>

      {boProgress && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-slate-900">BO Loop Progress</span>
            </div>
            <span className="text-sm font-bold text-indigo-600">{boProgress.total_steps} / {boProgress.min_required_steps} steps completed</span>
          </div>
          <div className="w-full bg-white rounded-full h-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all" 
              style={{ width: `${Math.min(100, (boProgress.total_steps / boProgress.min_required_steps) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-600">
            <span>Current Best FWHM: {boProgress.current_best_fwhm ? boProgress.current_best_fwhm.toFixed(2) + ' meV' : 'N/A'}</span>
            <span>{boProgress.can_access_results ? '✓ Results unlocked!' : `Complete ${boProgress.min_required_steps - boProgress.total_steps} more steps to unlock results`}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visualizations */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Gaussian Surrogate Model</h3>
              {modelInfo?.status === 'fitted' && (
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">R²: {modelInfo.R2_score}%</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-rose-50 text-rose-700 rounded-lg">MAE: {modelInfo.MAE_meV} meV</span>
                </div>
              )}
            </div>
            
            <div className="h-[300px] bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <span className="text-slate-500 font-medium">Loading model data...</span>
                </div>
              ) : modelInfo?.status === 'fitted' && plotData ? (
                <div className="w-full h-full p-2">
                  <Plot
                    data={[
                      {
                        x: plotData.x.concat(plotData.x.slice().reverse()),
                        y: plotData.mu.map((m, i) => m + 1.96 * plotData.sigma[i]).concat(
                           plotData.mu.map((m, i) => m - 1.96 * plotData.sigma[i]).reverse()
                        ),
                        type: 'scatter',
                        fill: 'toself',
                        fillcolor: 'rgba(79, 70, 229, 0.1)',
                        line: {color: 'transparent'},
                        name: 'Uncertainty (95%)'
                      },
                      {
                        x: plotData.x,
                        y: plotData.mu,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Predicted FWHM',
                        line: {color: '#4f46e5', width: 3}
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: {l: 50, r: 20, b: 40, t: 20},
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#e2e8f0', color: '#64748b' },
                      yaxis: { title: 'FWHM (meV)', gridcolor: '#e2e8f0', color: '#64748b' },
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
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Acquisition Function (Expected Improvement)</h3>
            <div className="h-[250px] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <span className="text-slate-500 font-medium">Computing...</span>
                </div>
              ) : plotData ? (
                <div className="w-full h-full p-2">
                  <Plot
                    data={[
                      {
                        x: plotData.x,
                        y: plotData.ei,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Expected Improvement',
                        fill: 'tozeroy',
                        fillcolor: 'rgba(14, 165, 233, 0.2)',
                        line: {color: '#0ea5e9', width: 3}
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: {l: 50, r: 20, b: 40, t: 20},
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#e2e8f0', color: '#64748b' },
                      yaxis: { title: 'EI Value', gridcolor: '#e2e8f0', color: '#64748b' },
                      showlegend: false
                    }}
                    useResizeHandler={true}
                    style={{width: '100%', height: '100%'}}
                  />
                </div>
              ) : (
                <span className="text-slate-500">Graph will render here</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column: Interaction */}
        <div className="space-y-8 h-full">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-indigo-100 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>
            
            <div className="flex items-center space-x-3 mb-2 mt-2">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Next Suggestion</h3>
            </div>
            <p className="text-sm text-slate-500 mb-8">Perform this experiment to maximize Expected Improvement.</p>
            
            <div className="flex-1 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-colors">
                    <span className="text-slate-600 font-medium text-sm">Growth Temp (GTE)</span>
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{suggestions[0].GTE_celsius} °C</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-colors">
                    <span className="text-slate-600 font-medium text-sm">Growth Time (GTI)</span>
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{suggestions[0].GTI_minutes} min</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-colors">
                    <span className="text-slate-600 font-medium text-sm">Ar Flow (FRA)</span>
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{suggestions[0].FRA_sccm} sccm</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-colors">
                    <span className="text-slate-600 font-medium text-sm">Pressure</span>
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{suggestions[0].Pressure_Torr} Torr</span>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex flex-col justify-center items-center">
                      <span className="text-emerald-700 font-medium text-sm mb-1">Model Predicts FWHM</span>
                      <span className="text-emerald-700 font-bold text-2xl">{suggestions[0].predicted_FWHM_meV} <span className="text-lg opacity-70 font-normal">± {suggestions[0].uncertainty_meV} meV</span></span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                  <FlaskConical className="w-12 h-12 opacity-50" />
                  <p className="text-center">No suggestions available.<br/>Please upload training data first.</p>
                  <button onClick={() => navigate('/datasets/upload')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium">Upload Dataset</button>
                </div>
              )}
            </div>

            {suggestions.length > 0 && !loading && (
              <form onSubmit={handleAddExperiment} className="mt-8 space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-center">Log Experimental Result</h4>
                <p className="text-xs text-center text-slate-500 mb-4">Run the experiment above and enter the resulting PL FWHM to retrain the model.</p>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block text-center">Measured FWHM (meV)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={fwhmResult}
                    onChange={(e) => setFwhmResult(e.target.value)}
                    placeholder="e.g., 34.50"
                    className="w-full text-center text-lg font-bold p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting || !fwhmResult}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:shadow-none"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating Model...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Submit & Retrain</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimization;
