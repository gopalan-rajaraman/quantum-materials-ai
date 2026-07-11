import React, { useState, useEffect } from 'react';
import { Target, Cpu, LineChart, AlertTriangle, ArrowLeft, Upload, Database, FolderOpen, ChevronRight } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Results = () => {
  // View state: LOADING | NO_DATASET | SELECT_DATASET | RESULTS
  const [view, setView] = useState('LOADING');
  const [loading, setLoading] = useState(true);
  const [activeDataset, setActiveDataset] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [activatingId, setActivatingId] = useState(null);

  // BO Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [boProgress, setBoProgress] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [surfaceData, setSurfaceData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadResults() {
      try {
        // Step 1: Check for active dataset
        const activeResp = await api.getActiveDataset();

        if (!activeResp.active_dataset) {
          // No active dataset — check if user has any datasets
          const datasetsResp = await api.fetchDatasets();

          if (!datasetsResp.datasets || datasetsResp.datasets.length === 0) {
            setView('NO_DATASET');
          } else {
            setDatasets(datasetsResp.datasets);
            setView('SELECT_DATASET');
          }
          setLoading(false);
          return;
        }

        // Active dataset exists — set it immediately so header shows the badge
        setActiveDataset(activeResp.active_dataset);
        setView('RESULTS');

        // Step 2: Fetch full results scoped to this dataset_id
        try {
          const resultsResp = await api.getResults();

          // Progress / readiness check
          if (resultsResp.progress) {
            setBoProgress(resultsResp.progress);
          }

          // Set optimization results
          if (resultsResp.optimization) {
            setResults(resultsResp.optimization);
          }

          // Set model info (feature importances)
          if (resultsResp.model_info) {
            setModelInfo(resultsResp.model_info);
          }
        } catch (resultsErr) {
          // 404 means no active dataset (race condition) — already handled above
          if (resultsErr.message && resultsErr.message.includes('No active dataset')) {
            setView('NO_DATASET');
            setLoading(false);
            return;
          }
          console.error("Results fetch error:", resultsErr);
          setError(resultsErr.message);
        }

        // Step 3: Fetch surface data (independent, optional)
        try {
          const sData = await api.getSurfaceData({ var_x: 'GTE', var_y: 'GTI', grid_size: 20 });
          setSurfaceData(sData);
        } catch (e) {
          console.error("Failed to fetch surface data:", e);
        }
      } catch (err) {
        console.error("Results load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  // Handle activating a dataset from the selector
  const handleActivateDataset = async (datasetId) => {
    setActivatingId(datasetId);
    try {
      await api.activateDataset(datasetId);
      // Reload the page to trigger the full Results flow
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setActivatingId(null);
    }
  };

  // ─── LOADING ────────────────────────────────────────────
  if (loading && view === 'LOADING') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-medium text-slate-700">Loading Results…</div>
        <p className="text-slate-500 mt-2">Checking your dataset and optimization status.</p>
      </div>
    );
  }

  // ─── NO DATASET ─────────────────────────────────────────
  if (view === 'NO_DATASET') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Dataset Yet</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Upload a dataset to start Bayesian Optimization. Once you have data, the AI will help you find optimal synthesis parameters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/datasets/upload')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Dataset</span>
            </button>
            <button
              onClick={() => navigate('/datasets')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              <Database className="w-5 h-5" />
              <span>Browse Datasets</span>
            </button>
          </div>

          {/* Empty state cards */}
          <div className="grid grid-cols-2 gap-3 mt-10">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Historical Observations</p>
              <p className="text-sm text-slate-500">No data</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Surrogate Model</p>
              <p className="text-sm text-slate-500">Not trained</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Acquisition Function</p>
              <p className="text-sm text-slate-500">No data</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Next Suggestion</p>
              <p className="text-sm text-slate-500">No suggestion available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECT DATASET ─────────────────────────────────────
  if (view === 'SELECT_DATASET') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a Dataset</h2>
            <p className="text-slate-500">Choose a dataset to continue with Bayesian Optimization results.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {datasets.map((ds) => (
              <div
                key={ds._id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200">
                    <Database className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{ds.name || 'Unnamed Dataset'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ds.row_count || ds.total_experiments || 0} experiments · {ds.status || 'ready'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleActivateDataset(ds._id)}
                  disabled={activatingId === ds._id}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activatingId === ds._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Opening…</span>
                    </>
                  ) : (
                    <>
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/datasets/upload')}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              + Upload a new dataset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS: BO Still Loading ──────────────────────────
  if (loading && view === 'RESULTS') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-medium text-slate-700">Running full Bayesian Optimization sequence…</div>
        <p className="text-slate-500 mt-2">Computing n steps of convergence.</p>
      </div>
    );
  }

  // ─── RESULTS: Error / BO Incomplete ─────────────────────
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

  // ─── RESULTS: No results loaded yet ─────────────────────
  if (!results) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="text-slate-500">No results available.</div>
      </div>
    );
  }

  // Find the best recommendation (lowest FWHM)
  const bestRec = results.recommendations.reduce((prev, curr) => 
    prev.predicted_FWHM_meV < curr.predicted_FWHM_meV ? prev : curr
  );

  // ─── RESULTS: Full Dashboard ────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Result Summary</h2>
          <p className="text-slate-500">
            Overall Summary of the entire BO loop after convergence.
            {activeDataset && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {activeDataset.dataset_name}
              </span>
            )}
          </p>
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
        
        {/* Step 11: Final Summary Dashboard Charts */}
        {(results?.summary?.observed_fwhm || modelInfo?.feature_importances || surfaceData) && (
          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            
            {/* FWHM Distribution */}
            {results?.summary?.observed_fwhm && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-[350px]">
                <h3 className="text-lg font-bold text-slate-900 mb-1">FWHM Distribution</h3>
                <p className="text-xs text-slate-500 mb-4">Narrow = High quality</p>
                <div className="flex-1 min-h-0 relative">
                  <Plot
                    data={[{
                      x: results.summary.observed_fwhm,
                      type: 'histogram',
                      marker: { color: '#2E86AB', line: { color: 'white', width: 1 } },
                      opacity: 0.85
                    }]}
                    layout={{
                      autosize: true, margin: { l: 40, r: 20, b: 40, t: 10 },
                      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                      xaxis: { title: 'PL FWHM (meV)' }, yaxis: { title: 'Count' },
                      shapes: [{
                        type: 'line', x0: results.summary.initial_best, x1: results.summary.initial_best,
                        y0: 0, y1: 1, yref: 'paper',
                        line: { color: '#5C9E31', width: 2, dash: 'dash' }
                      }]
                    }}
                    useResizeHandler={true} style={{ width: '100%', height: '100%', position: 'absolute' }}
                  />
                </div>
              </div>
            )}

            {/* Feature Importances */}
            {modelInfo?.feature_importances && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-[350px]">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Feature Importance</h3>
                <p className="text-xs text-slate-500 mb-4">Relative impact on GP surrogate model</p>
                <div className="flex-1 min-h-0 relative">
                  <Plot
                    data={[{
                      type: 'bar', orientation: 'h',
                      x: modelInfo.feature_importances.map(f => f.value).reverse(),
                      y: modelInfo.feature_importances.map(f => f.name).reverse(),
                      marker: { color: '#A23B72' }
                    }]}
                    layout={{
                      autosize: true, margin: { l: 80, r: 20, b: 40, t: 10 },
                      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                      xaxis: { title: 'Relative Importance' }
                    }}
                    useResizeHandler={true} style={{ width: '100%', height: '100%', position: 'absolute' }}
                  />
                </div>
              </div>
            )}

            {/* GP Surface */}
            {surfaceData && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-[350px]">
                <h3 className="text-lg font-bold text-slate-900 mb-1">GP Response Surface</h3>
                <p className="text-xs text-slate-500 mb-4">{surfaceData.x_label} vs {surfaceData.y_label} (Others optimal)</p>
                <div className="flex-1 min-h-0 relative">
                  <Plot
                    data={[{
                      z: surfaceData.z,
                      x: surfaceData.x,
                      y: surfaceData.y,
                      type: 'contour',
                      colorscale: 'RdYlGn',
                      reversescale: true,
                      contours: { coloring: 'heatmap' }
                    }]}
                    layout={{
                      autosize: true, margin: { l: 40, r: 20, b: 40, t: 10 },
                      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                      xaxis: { title: surfaceData.x_label },
                      yaxis: { title: surfaceData.y_label }
                    }}
                    useResizeHandler={true} style={{ width: '100%', height: '100%', position: 'absolute' }}
                  />
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
