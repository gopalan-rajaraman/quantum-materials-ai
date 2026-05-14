import React, { useState, useEffect } from 'react';
import { Target, Cpu, LineChart, AlertTriangle } from 'lucide-react';
import Plot from 'react-plotly.js';

const Results = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptimization = async () => {
      try {
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
    
    fetchOptimization();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-full">
        <div className="text-xl text-slate-400 animate-pulse">Running full Bayesian Optimization sequence (10 steps)...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-full">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );
  }

  // Find the best recommendation (lowest FWHM)
  const bestRec = results.recommendations.reduce((prev, curr) => 
    prev.predicted_FWHM_meV < curr.predicted_FWHM_meV ? prev : curr
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">Model Results (Thermal CVD)</h2>
        <p className="text-slate-400 text-lg">Final analysis and parameter breakdown after simulating 10 optimization steps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Best Parameters Found */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Optimal Parameters</h3>
            </div>
            
            <p className="text-sm text-slate-400 mb-6">The ML model suggests synthesizing the WS₂ material with these exact parameters to achieve the lowest PL FWHM.</p>
            
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Growth Temp (GTE)</span>
                <span className="text-white font-mono font-bold text-lg">{bestRec.GTE_celsius} °C</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Growth Time (GTI)</span>
                <span className="text-white font-mono font-bold text-lg">{bestRec.GTI_minutes} min</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Ar Flow (FRA)</span>
                <span className="text-cyan-400 font-mono font-bold text-lg">{bestRec.FRA_sccm} sccm</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Pressure</span>
                <span className="text-cyan-400 font-mono font-bold text-lg">{bestRec.Pressure_Torr} Torr</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-slate-500 text-sm mb-1">Predicted Target (PL FWHM)</p>
              <p className="text-4xl font-extrabold text-emerald-400">{bestRec.predicted_FWHM_meV} <span className="text-xl text-emerald-500/70">meV</span></p>
            </div>
          </div>
          
          {/* Uncertainty Metrics */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><AlertTriangle className="w-4 h-4 text-amber-400 mr-2" /> Summary Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Standard Deviation (σ)</span>
                <span className="text-white font-mono">± {bestRec.uncertainty_meV} meV</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Improvement</span>
                <span className="text-emerald-400 font-mono">{results.summary.improvement_meV.toFixed(2)} meV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl h-96 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center"><LineChart className="w-5 h-5 text-cyan-400 mr-2" /> Optimization Trajectory</h3>
            </div>
            <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center justify-center overflow-hidden">
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
                      marker: {color: '#06b6d4', size: 6, symbol: 'cross'}
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: {l: 50, r: 20, b: 40, t: 20},
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: { title: 'BO Iteration Step', gridcolor: '#334155', color: '#94a3b8' },
                    yaxis: { title: 'FWHM (meV)', gridcolor: '#334155', color: '#94a3b8' },
                    legend: { font: { color: '#cbd5e1' } }
                  }}
                  useResizeHandler={true}
                  style={{width: '100%', height: '100%'}}
                />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl h-72 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center"><Cpu className="w-5 h-5 text-purple-400 mr-2" /> Exploration Uncertainty Over Time</h3>
            </div>
            <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center justify-center overflow-hidden">
               <Plot
                  data={[
                    {
                      x: Array.from({length: results.convergence_history.uncertainty.length}, (_, i) => i + 1),
                      y: results.convergence_history.uncertainty,
                      type: 'bar',
                      name: 'Model Uncertainty (σ)',
                      marker: {color: 'rgba(168, 85, 247, 0.6)', line: {color: '#a855f7', width: 1}}
                    }
                  ]}
                  layout={{
                    autosize: true,
                    margin: {l: 50, r: 20, b: 40, t: 20},
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: { title: 'BO Iteration Step', gridcolor: '#334155', color: '#94a3b8' },
                    yaxis: { title: 'Uncertainty (σ) meV', gridcolor: '#334155', color: '#94a3b8' },
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
