import React, { useState, useEffect } from 'react';
import { Search, Filter, FlaskConical, CheckCircle2, Clock, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Experiments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/datasets/saved');
      if (res.ok) {
        const data = await res.json();
        setExperiments(data.datasets || []);
      }
    } catch (e) {
      console.error('Failed to fetch experiments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = (exp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (exp.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">Experiment Log</h2>
          <p className="text-slate-400 text-lg">Manage and track all historical Bayesian Optimization runs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchExperiments}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search experiments by ID or Dataset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-colors ${statusFilter !== 'All' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}`}
            >
              <Filter className="w-4 h-4" />
              <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 py-2">
                {['All', 'Completed', 'In Progress'].map(status => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowFilterMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Experiment ID</th>
                <th className="px-6 py-4">Dataset Used</th>
                <th className="px-6 py-4">Target Property</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Best FWHM Found</th>
                <th className="px-6 py-4">Training Rows</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading experiments...
                  </td>
                </tr>
              ) : filteredExperiments.length > 0 ? (
                filteredExperiments.map((exp, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => navigate('/results')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                          <FlaskConical className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="font-mono font-medium text-white">{exp.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300 max-w-xs truncate">{exp.name}</td>
                    <td className="px-6 py-4 text-slate-400">{exp.target}</td>
                    <td className="px-6 py-4">
                      {exp.status === 'Completed' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{exp.status}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>{exp.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">{exp.bestValue}</td>
                    <td className="px-6 py-4 text-slate-400">{exp.rows} rows</td>
                    <td className="px-6 py-4 text-slate-500">{exp.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); navigate('/results'); }} className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100">
                        View Details &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3 text-slate-500">
                      <FlaskConical className="w-10 h-10 opacity-30" />
                      <p>No experiments found. <button onClick={() => navigate('/upload')} className="text-cyan-400 hover:underline">Upload a dataset</button> to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Experiments;
