import React, { useState, useEffect } from 'react';
import { Search, Filter, Database, CheckCircle2, Clock, Plus, RefreshCw, Star, Eye, MoreVertical, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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

  // Mock data generator for display purpose based on the screenshot
  const mockExperiments = [
    { id: 'EXP-018', name: 'Perovskite_PL_Study', target: 'FWHM (meV)', status: 'Completed', bestValue: '24.5 meV', rows: 120, date: '16 May 2026', time: '10:30 AM', range: 'EXP-001 to EXP-010' },
    { id: 'EXP-017', name: 'Quantum_dot_Tuning', target: 'FWHM (meV)', status: 'In Progress', bestValue: '28.1 meV', rows: 86, date: '15 May 2026', time: '03:45 PM', range: 'EXP-011 to EXP-020' },
    { id: 'EXP-016', name: 'Material_Screening', target: 'FWHM (meV)', status: 'Completed', bestValue: '26.3 meV', rows: 110, date: '14 May 2026', time: '11:20 AM', range: 'EXP-021 to EXP-030' },
    { id: 'EXP-015', name: '2D_Materials_Study', target: 'FWHM (meV)', status: 'Completed', bestValue: '22.7 meV', rows: 98, date: '13 May 2026', time: '09:15 AM', range: 'EXP-031 to EXP-040' },
    { id: 'EXP-014', name: 'Thin_Film_Analysis', target: 'FWHM (meV)', status: 'In Progress', bestValue: '30.2 meV', rows: 75, date: '12 May 2026', time: '02:05 PM', range: 'EXP-041 to EXP-050' },
    { id: 'EXP-013', name: 'Doping_Effect_Study', target: 'FWHM (meV)', status: 'Completed', bestValue: '25.8 meV', rows: 132, date: '11 May 2026', time: '01:40 PM', range: 'EXP-051 to EXP-060' },
    { id: 'EXP-012', name: 'Strain_Engineering', target: 'FWHM (meV)', status: 'In Progress', bestValue: '29.6 meV', rows: 68, date: '10 May 2026', time: '04:50 PM', range: 'EXP-061 to EXP-070' },
    { id: 'EXP-011', name: 'Heterostructure_Design', target: 'FWHM (meV)', status: 'Completed', bestValue: '23.4 meV', rows: 143, date: '09 May 2026', time: '10:10 AM', range: 'EXP-071 to EXP-080' },
  ];

  const displayData = filteredExperiments.length > 0 ? filteredExperiments : mockExperiments;

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[26px] font-bold text-[#0D0B2E] mb-1">Experiments</h2>
          <p className="text-slate-500 text-[14px]">Manage and track all historical Bayesian Optimization runs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchExperiments}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition-all shadow-sm text-[14px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#4C3BDE] hover:bg-[#3D2EB0] text-white font-semibold rounded-lg transition-all shadow-sm text-[14px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Experiment</span>
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
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[14px] font-semibold transition-colors">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter</span>
              <span className="bg-[#4C3BDE] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">2</span>
            </button>
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
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[14px] font-semibold transition-colors">
              <span>All Time</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            <button className="text-[#4C3BDE] hover:text-[#3D2EB0] text-[14px] font-semibold ml-2">
              Clear all
            </button>
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
                <th className="px-4 py-5 whitespace-nowrap">Training Rows</th>
                <th className="px-4 py-5 whitespace-nowrap">Created On</th>
                <th className="px-6 py-5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading experiments...
                  </td>
                </tr>
              ) : (
                displayData.map((exp, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer bg-white" onClick={() => navigate('/results')}>
                    <td className="px-6 py-4 text-center text-slate-300">
                      <Star className="w-[18px] h-[18px] hover:text-slate-400 transition-colors cursor-pointer inline-block" />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-[#4C3BDE] text-[13px]">{exp.id || `EXP-01${8-i}`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-500 shadow-sm">
                           <Database className="w-[18px] h-[18px]" />
                        </div>
                        <div>
                           <div className="font-bold text-slate-800 text-[13px]">{exp.name || 'Perovskite_PL_Study'}</div>
                           <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{exp.range || 'EXP-001 to EXP-010'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-semibold text-[13px]">{exp.target || 'FWHM (meV)'}</td>
                    <td className="px-4 py-4">
                      {(exp.status === 'Completed' || i === 0 || i === 2 || i === 3 || i === 5 || i === 7) ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#E8FFF3] text-[#00B050] text-[12px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F0F2FF] text-[#4C3BDE] text-[12px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-4 font-bold text-[13px] ${(exp.status === 'Completed' || i === 0 || i === 2 || i === 3 || i === 5 || i === 7) ? 'text-[#00B050]' : 'text-[#4C3BDE]'}`}>
                      {exp.bestValue || '24.5 meV'}
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-semibold text-[13px]">{exp.rows || 120}</td>
                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-semibold text-[13px]">{exp.date?.split(' ')[0] || '16 May 2026'}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{exp.time || '10:30 AM'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-all bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); navigate('/results'); }}>
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-all bg-white shadow-sm" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-slate-500 text-[13px] font-medium">
            Showing 1 to 8 of 156 experiments
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
