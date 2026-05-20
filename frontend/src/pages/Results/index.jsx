import React, { useState, useEffect } from 'react';
import { Target, Cpu, LineChart, AlertTriangle, ArrowLeft } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';

const Results = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boProgress, setBoProgress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProgressAndFetch = async () => {
      try {
        // First check BO progress
        const progressRes = await fetch('http://localhost:8000/thermal-cvd/bo-progress');
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setBoProgress(progressData);
          
          if (!progressData.can_access_results) {
            setError(`Complete ${progressData.min_required_steps} BO Loop iterations to access results. Current: ${progressData.total_steps} steps completed.`);
            setLoading(false);
            return;
          }
        }
        
        // If progress is sufficient, fetch optimization results
        const res = await fetch('http://localhost:8000/thermal-cvd/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ n_steps: 10 })
        });
        
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || `HTTP ${res.status} – Model not fitted. Upload data first.`);
        }
        
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkProgressAndFetch();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-medium text-slate-700">Running full Bayesian Optimization sequence...</div>
        <p className="text-slate-500 mt-2">Computing n steps of convergence.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <div className="text-xl font-bold text-slate-900 mb-2">BO Loop Incomplete</div>
        <div className="text-slate-600 mb-6 text-center max-w-md">{error}</div>
        
        {boProgress && (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-700">Progress</span>
              <span className="text-sm font-bold text-indigo-600">{boProgress.total_steps} / {boProgress.min_required_steps} steps</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all" 
                style={{ width: `${Math.min(100, (boProgress.total_steps / boProgress.min_required_steps) * 100)}%` }}
              ></div>
            </div>
            {boProgress.current_best_fwhm && (
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-500">Current Best FWHM: </span>
                <span className="text-sm font-bold text-emerald-600">{boProgress.current_best_fwhm.toFixed(2)} meV</span>
              </div>
            )}
          </div>
        )}
        
        <button onClick={() => navigate('/optimization')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          Continue BO Loop
        </button>
      </div>
    );
  }

  // Find the best recommendation (lowest FWHM)
  const bestRec = results.recommendations.reduce((prev, curr) => 
    prev.predicted_FWHM_meV < curr.predicted_FWHM_meV ? prev : curr
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Result Summary</h2>
          <p className="text-slate-500">Overall Summary of the entire BO loop after convergence.</p>
        </div>
        <button 
          onClick={() => navigate('/optimization')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-medium rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Active Learning</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Best Parameters Found */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            
            <div className="flex items-center space-x-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Optimal Parameters</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">The ML model suggests synthesizing with these exact parameters to achieve the lowest PL FWHM.</p>
            
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 text-sm font-medium">Growth Temp (GTE)</span>
                <span className="text-slate-900 font-mono font-bold text-lg">{bestRec.GTE_celsius} °C</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 text-sm font-medium">Growth Time (GTI)</span>
                <span className="text-slate-900 font-mono font-bold text-lg">{bestRec.GTI_minutes} min</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 text-sm font-medium">Ar Flow (FRA)</span>
                <span className="text-indigo-600 font-mono font-bold text-lg">{bestRec.FRA_sccm} sccm</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 text-sm font-medium">Pressure</span>
                <span className="text-indigo-600 font-mono font-bold text-lg">{bestRec.Pressure_Torr} Torr</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-500 text-sm mb-1 font-medium">Best Predicted Target (PL FWHM)</p>
              <p className="text-4xl font-extrabold text-emerald-600">{bestRec.predicted_FWHM_meV.toFixed(2)} <span className="text-xl text-emerald-600/70">meV</span></p>
            </div>
          </div>
          
          {/* Uncertainty Metrics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" /> 
              Summary Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Standard Deviation (σ)</span>
                <span className="text-slate-900 font-mono font-semibold">± {bestRec.uncertainty_meV.toFixed(2)} meV</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Total Improvement</span>
                <span className="text-emerald-600 font-mono font-semibold">{results.summary.improvement_meV.toFixed(2)} meV</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Initial Best FWHM</span>
                <span className="text-slate-900 font-mono font-semibold">{results.summary.initial_best.toFixed(2)} meV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-96 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center"><LineChart className="w-6 h-6 text-indigo-500 mr-2" /> Optimization Trajectory</h3>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden p-2">
               <Plot
                  data={[
                    {
                      x: Array.from({length: results.convergence_history.best_fwhm.length}, (_, i) => i),
                      y: results.convergence_history.best_fwhm,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Best FWHM Found',
                      line: {color: '#10b981', width: 3},
                      marker: {size: 8}
                    },
                    {
                      x: Array.from({length: results.convergence_history.proposed_fwhm.length}, (_, i) => i + 1),
                      y: results.convergence_history.proposed_fwhm,
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Proposed Experiment',
                      marker: {color: '#6366f1', size: 6, symbol: 'cross'}
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: {l: 50, r: 20, b: 40, t: 20},
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: { title: 'BO Iteration Step', gridcolor: '#e2e8f0', color: '#64748b' },
                    yaxis: { title: 'FWHM (meV)', gridcolor: '#e2e8f0', color: '#64748b' },
                    legend: { font: { color: '#475569' } }
                  }}
                  useResizeHandler={true}
                  style={{width: '100%', height: '100%'}}
                />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-72 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center"><Cpu className="w-6 h-6 text-purple-500 mr-2" /> Exploration Uncertainty Over Time</h3>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden p-2">
               <Plot
                  data={[
                    {
                      x: Array.from({length: results.convergence_history.uncertainty.length}, (_, i) => i + 1),
                      y: results.convergence_history.uncertainty,
                      type: 'bar',
                      name: 'Model Uncertainty (σ)',
                      marker: {color: '#a855f7', line: {color: '#9333ea', width: 1}}
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: {l: 50, r: 20, b: 40, t: 20},
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: { title: 'BO Iteration Step', gridcolor: '#e2e8f0', color: '#64748b' },
                    yaxis: { title: 'Uncertainty (σ) meV', gridcolor: '#e2e8f0', color: '#64748b' },
                    showlegend: false
                  }}
                  useResizeHandler={true}
                  style={{width: '100%', height: '100%'}}
                />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Results;
