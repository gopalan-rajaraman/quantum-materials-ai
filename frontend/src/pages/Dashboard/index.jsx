import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, TrendingUp, FlaskConical, RefreshCw } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, plotRes] = await Promise.all([
        fetch('http://localhost:8000/api/datasets/dashboard'),
        fetch('http://localhost:8000/thermal-cvd/plot-data').catch(() => null),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (plotRes && plotRes.ok) setPlotData(await plotRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const statCards = stats ? [
    {
      title: 'Total Datasets',
      value: stats.total_datasets ?? '--',
      icon: <Database className="w-6 h-6 text-cyan-400" />,
      trend: stats.n_training_samples ? `${stats.n_training_samples} training rows` : 'No data yet',
    },
    {
      title: 'Active Experiments',
      value: stats.active_experiments ?? 0,
      icon: <FlaskConical className="w-6 h-6 text-purple-400" />,
      trend: stats.model_fitted ? 'BO Model Fitted' : 'Awaiting data',
    },
    {
      title: 'Best FWHM Found',
      value: stats.best_fwhm_meV != null ? `${stats.best_fwhm_meV} meV` : '--',
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      trend: stats.mae_meV != null ? `MAE: ${stats.mae_meV} meV` : 'Upload data',
    },
    {
      title: 'Surrogate Model R²',
      value: stats.r2_percent != null ? `${stats.r2_percent}%` : '--',
      icon: <Activity className="w-6 h-6 text-rose-400" />,
      trend: stats.kernel ? `Kernel: ${stats.kernel}` : 'Not fitted',
    },
  ] : [];

  const activityColors = {
    'bg-purple-500': '#a855f7',
    'bg-cyan-500': '#06b6d4',
    'bg-emerald-500': '#10b981',
    'bg-rose-500': '#f43f5e',
    'bg-amber-500': '#f59e0b',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Laboratory Overview</h2>
          <p className="text-slate-400 text-lg mt-2">High-level metrics and system status across all Thermal CVD experiments.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 h-36 animate-pulse" />
            ))
          : statCards.map((stat, i) => (
              <div key={i} className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    {stat.icon}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-800 rounded-md text-slate-300">{stat.trend}</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-slate-400 font-medium">{stat.title}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Surrogate Model Chart */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Surrogate Model (GTE Sweep)</h3>
            <button onClick={() => navigate('/optimization')} className="text-cyan-400 text-sm font-medium hover:text-cyan-300">
              View Full BO Loop →
            </button>
          </div>
          <div className="h-72 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
            {loading ? (
              <p className="text-slate-500 animate-pulse">Loading chart...</p>
            ) : plotData ? (
              <Plot
                data={[
                  {
                    x: plotData.x.concat(plotData.x.slice().reverse()),
                    y: plotData.mu.map((m, i) => m + 1.96 * plotData.sigma[i]).concat(
                       plotData.mu.map((m, i) => m - 1.96 * plotData.sigma[i]).reverse()
                    ),
                    type: 'scatter', fill: 'toself',
                    fillcolor: 'rgba(16,185,129,0.15)', line: { color: 'transparent' },
                    name: '95% CI'
                  },
                  {
                    x: plotData.x, y: plotData.mu,
                    type: 'scatter', mode: 'lines',
                    name: 'Predicted FWHM',
                    line: { color: '#10b981', width: 2.5 }
                  }
                ]}
                layout={{
                  autosize: true,
                  margin: { l: 50, r: 20, b: 40, t: 10 },
                  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                  xaxis: { title: 'Growth Temp (GTE) °C', gridcolor: '#334155', color: '#94a3b8' },
                  yaxis: { title: 'FWHM (meV)', gridcolor: '#334155', color: '#94a3b8' },
                  showlegend: false
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Upload a dataset to see the surrogate model chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Log */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
              ))
            ) : stats?.activity_log?.length > 0 ? (
              stats.activity_log.map((log, i) => (
                <div key={i} className="flex relative">
                  {i !== stats.activity_log.length - 1 && (
                    <div className="absolute top-8 left-2 w-0.5 h-full bg-slate-800" />
                  )}
                  <div
                    className="w-4 h-4 rounded-full mt-1.5 mr-4 flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: activityColors[log.color] || '#06b6d4' }}
                  />
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">{log.title}</h4>
                    <p className="text-slate-400 text-xs mb-1">{log.desc}</p>
                    <span className="text-slate-500 text-[10px] font-mono">{log.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FlaskConical className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No activity yet.<br />Upload data to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
