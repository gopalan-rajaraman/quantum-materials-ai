import React, { useState, useEffect } from 'react';
import { Search, Filter, Database, CheckCircle2, Clock, RefreshCw, Star, Eye, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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
      const data = await api.fetchSavedDatasets();
      setExperiments(data.datasets || []);
    } catch (e) {
      console.error('Failed to fetch experiments', e);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8000/api/datasets/saved/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Refresh the list after successful deletion
        fetchExperiments();
      } else {
        alert('Failed to delete the dataset.');
      }
    } catch (err) {
      console.error('Error deleting dataset:', err);
      alert('An error occurred while trying to delete the dataset.');
    }
  };

  const handleDownload = async (e, exp) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/datasets/saved/${exp._id || exp.id}`);
      if (res.ok) {
        const dataset = await res.json();
        const dataStr = JSON.stringify(dataset, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${exp.name || 'dataset'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to download dataset.');
      }
    } catch (err) {
      console.error('Error downloading dataset:', err);
      alert('An error occurred while downloading.');
    }
  };

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = (exp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (exp.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const expStatus = (exp.status || '').toLowerCase();
    const isCompletedOrLocked = expStatus === 'completed' || expStatus === 'locked';
    
    let matchesStatus = true;
    if (statusFilter === 'Completed') matchesStatus = isCompletedOrLocked;
    else if (statusFilter === 'In Progress') matchesStatus = !isCompletedOrLocked;
    
    return matchesSearch && matchesStatus;
  });

  // Use filtered experiments from API or empty array if no data
  const displayData = filteredExperiments && filteredExperiments.length > 0 ? filteredExperiments : [];

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] mb-4">Experiments</h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">Manage and track all historical Bayesian Optimization runs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchExperiments}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition-all shadow-sm text-[14px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-[380px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Experiment ID or Dataset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-slate-800 text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#4C3BDE] focus:ring-1 focus:ring-[#4C3BDE] transition-shadow"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
               <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[14px] font-semibold transition-colors"
                >
                  <span>{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                    {['All', 'Completed', 'In Progress'].map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setShowFilterMenu(false); }}
                        className="w-full text-left px-4 py-2 text-[14px] text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                      >
                        {status === 'All' ? 'All Status' : status}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-12"></th>
                <th className="px-4 py-5 whitespace-nowrap">Experiment ID</th>
                <th className="px-4 py-5 whitespace-nowrap">Dataset Used</th>
                <th className="px-4 py-5 whitespace-nowrap">Target Property</th>
                <th className="px-4 py-5 whitespace-nowrap">Status</th>
                <th className="px-4 py-5 whitespace-nowrap">Best FWHM Found</th>

                <th className="px-4 py-5 whitespace-nowrap">Created On</th>
                <th className="px-6 py-5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading experiments...
                  </td>
                </tr>
              ) : displayData && displayData.length > 0 ? (
                displayData.map((exp, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer bg-white" onClick={() => navigate('/results')}>
                    <td className="px-6 py-4 text-center text-slate-300">
                      <Star className="w-[18px] h-[18px] hover:text-slate-400 transition-colors cursor-pointer inline-block" />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-[#4C3BDE] text-[13px]">{exp.id || `EXP-${String(i + 1).padStart(3, '0')}`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-500 shadow-sm">
                           <Database className="w-[18px] h-[18px]" />
                        </div>
                        <div>
                           <div className="font-bold text-slate-800 text-[13px]">{exp.name || '—'}</div>
                           <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{exp.range || exp.id || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-semibold text-[13px]">{exp.target || '—'}</td>
                    <td className="px-4 py-4">
                      {['completed', 'locked'].includes((exp.status || '').toLowerCase()) ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#E8FFF3] text-[#00B050] text-[12px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{exp.status.toLowerCase() === 'locked' ? 'Locked' : 'Completed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F0F2FF] text-[#4C3BDE] text-[12px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-4 font-bold text-[13px] ${['completed', 'locked'].includes((exp.status || '').toLowerCase()) ? 'text-[#00B050]' : 'text-[#4C3BDE]'}`}>
                      {exp.bestValue || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-semibold text-[13px]">{exp.date?.split(' ')[0] || '—'}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{exp.time || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all" onClick={(e) => handleDownload(e, exp)} title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-all" onClick={(e) => handleDelete(e, exp._id)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-slate-500 text-[14px]">No experiments found. Upload a dataset to get started.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-slate-500 text-[13px] font-medium">
            Showing {displayData.length} of {filteredExperiments.length} experiments
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
               <button className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#4C3BDE] text-white font-bold text-[13px] shadow-sm">
                  1
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-50 font-bold text-[13px] transition-colors">
                  2
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-50 font-bold text-[13px] transition-colors">
                  3
               </button>
               <span className="px-2 text-slate-400 text-[13px]">...</span>
               <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-50 font-bold text-[13px] transition-colors">
                  20
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
            <div className="flex items-center">
               <button className="flex items-center space-x-2 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-[13px] font-semibold bg-white shadow-sm">
                  <span>10 / page</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experiments;
