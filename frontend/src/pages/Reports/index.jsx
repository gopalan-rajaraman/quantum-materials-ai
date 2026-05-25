import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, RefreshCcw, FileText, CheckCircle2, TrendingUp, FlaskConical, 
  Database, Cpu, Sparkles, Download, Info, Calendar, 
  User, ChevronDown, ArrowRight, ChevronLeft, ChevronRight, Share2, Target, AlertCircle, Loader2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import api from '../../services/api';

const Reports = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [datasetsList, setDatasetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedExperiment, setSelectedExperiment] = useState('All');
  const [reportType, setReportType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modelData, statsData, savedData] = await Promise.all([
        api.fetchModelInfo(),
        api.fetchDashboardStats(),
        api.fetchSavedDatasets()
      ]);
      setModelInfo(modelData);
      setDashboardStats(statsData);
      setDatasetsList(savedData?.datasets || []);
    } catch (e) {
      console.error("Error loading reports data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rawPredictions = modelInfo?.prediction_data || [];
  let currentMin = Infinity;
  const optimizationData = rawPredictions.length > 0 
    ? rawPredictions.map((p, idx) => {
        if (p.observed < currentMin) {
          currentMin = p.observed;
        }
        return {
          iteration: idx + 1,
          fwhm: currentMin
        };
      })
    : [];

  const bestFwhm = currentMin !== Infinity ? `${currentMin.toFixed(2)} meV` : (dashboardStats?.best_fwhm != null ? `${dashboardStats.best_fwhm.toFixed(2)} meV` : '—');
  const trainRows = modelInfo?.n_train_samples !== undefined ? modelInfo.n_train_samples : '—';
  const iterationsCount = rawPredictions.length > 0 ? rawPredictions.length : (dashboardStats?.n_training_samples ?? '—');
  const r2Value = modelInfo?.R2_score !== undefined ? `${(modelInfo.R2_score * 100).toFixed(1)}%` : '—';
  const maeValue = modelInfo?.MAE_meV !== undefined ? `${modelInfo.MAE_meV.toFixed(2)} meV` : '—';
  const rmseValue = modelInfo?.RMSE_meV !== undefined ? `${modelInfo.RMSE_meV.toFixed(2)} meV` : '—';

  const recentReports = datasetsList.length > 0
    ? datasetsList.map((ds, idx) => ({
        name: `${(ds.name || '').replace(/\.[^/.]+$/, "")}_Report`,
        id: ds.id || `EXP-${101 + idx}`,
        type: 'Experiment Summary',
        date: ds.date || '—',
        fwhm: ds.status === 'locked' ? bestFwhm : '—'
      }))
    : [];

  const filteredReports = recentReports.filter(report => {
    const matchesSearch = String(report.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || String(report.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExp = selectedExperiment === 'All' || String(report.id) === String(selectedExperiment);
    const matchesType = reportType === 'All' || report.type === reportType;
    return matchesSearch && matchesExp && matchesType;
  });

  const handleClearFilters = () => {
    setSelectedExperiment('All');
    setReportType('All');
    setSearchQuery('');
    setStartDate(() => {
      const d = new Date();
      d.setDate(1);
      return d.toISOString().slice(0, 10);
    });
    setEndDate(() => new Date().toISOString().slice(0, 10));
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Report Name,Experiment ID,Generated On,Best FWHM,RMSE,MAE\\n" + 
      filteredReports.map(r => `${r.name},${r.id},${r.date},${r.fwhm},${rmseValue},${maeValue}`).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reports.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};
  const generatedOn = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] mb-4">Reports</h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">Generate, view and export detailed reports from your BO Loop experiments.</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-[250px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex items-end space-x-6">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Select Experiment</label>
          <div className="relative">
            <select 
              value={selectedExperiment}
              onChange={(e) => setSelectedExperiment(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Experiments</option>
              {datasetsList.map((ds, idx) => (
                <option key={idx} value={ds.id || `EXP-${101 + idx}`}>
                  {ds.id || `EXP-${101 + idx}`} - {ds.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Date Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-[#4C3BDE]"
              />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-[#4C3BDE]"
              />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Report Type</label>
          <div className="relative">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Experiment Summary">Experiment Summary</option>
              <option value="Optimization Progress">Optimization Progress</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex-shrink-0">
          <button 
            onClick={handleClearFilters}
            className="flex items-center space-x-2 text-[#4C3BDE] px-4 py-2 hover:bg-[#F8F6FF] rounded-lg transition-colors text-sm font-semibold"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#4C3BDE] mb-2" />
          <span className="text-[13px] font-medium">Loading reports data...</span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
          {/* Left Column: Experiment Summary */}
          <div className="lg:w-[65%] flex flex-col space-y-6">
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-[15px] font-bold text-[#1e1b4b]">Experiment Summary</h2>
                  <span className="px-2.5 py-1 text-[11px] font-semibold text-[#4C3BDE] bg-[#F4F0FF] rounded-md">
                    {datasetsList[0]?.name?.replace(/\.[^/.]+$/, "") || 'Perovskite_PL_Study'} ({datasetsList[0]?.id || 'EXP-101'})
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[#00B050] bg-[#E8FFF3] px-3 py-1 rounded-full border border-[#00B050]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Completed</span>
                </div>
              </div>

              {/* 4 Stat Boxes */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border border-slate-100 rounded-xl p-4 flex items-center space-x-3 shadow-sm bg-slate-50/50 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4C3BDE] border border-slate-100 flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5 truncate">Best FWHM Found</p>
                    <p className="text-lg font-bold text-[#00B050] truncate">{bestFwhm}</p>
                  </div>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 flex items-center space-x-3 shadow-sm bg-slate-50/50 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4C3BDE] border border-slate-100 flex-shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5 truncate">Iterations</p>
                    <p className="text-lg font-bold text-slate-800 truncate">{iterationsCount} / {iterationsCount}</p>
                  </div>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 flex items-center space-x-3 shadow-sm bg-slate-50/50 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4C3BDE] border border-slate-100 flex-shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5 truncate">Total Exp.</p>
                    <p className="text-lg font-bold text-slate-800 truncate">{iterationsCount}</p>
                  </div>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 flex items-center space-x-3 shadow-sm bg-slate-50/50 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4C3BDE] border border-slate-100 flex-shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5 truncate">Model Used</p>
                    <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">Gaussian Process</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                {/* Performance Metrics */}
                <div className="w-[30%] min-w-[200px]">
                  <h3 className="text-[12px] font-bold text-[#1e1b4b] mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-0">
                      <p className="text-[11px] font-bold text-slate-500 mb-1 truncate">R² Score</p>
                      <p className="text-[15px] font-bold text-[#4C3BDE] truncate">{r2Value}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-0">
                      <p className="text-[11px] font-bold text-slate-500 mb-1 truncate">MAE</p>
                      <p className="text-[15px] font-bold text-[#00B050] truncate">{maeValue}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-0">
                      <p className="text-[11px] font-bold text-slate-500 mb-1 truncate">RMSE</p>
                      <p className="text-[15px] font-bold text-[#3B82F6] truncate">{rmseValue}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-0">
                      <p className="text-[11px] font-bold text-slate-500 mb-1 truncate">Training Rows</p>
                      <p className="text-[15px] font-bold text-[#8B5CF6] truncate">{trainRows}</p>
                    </div>
                  </div>
                </div>

                {/* Optimization Progress */}
                <div className="flex-1 border-l border-slate-100 pl-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[12px] font-bold text-[#1e1b4b]">Optimization Progress</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#4C3BDE]"></div>
                      <span className="text-[11px] font-semibold text-slate-600">Best FWHM (meV)</span>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={optimizationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFwhm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4C3BDE" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4C3BDE" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="iteration" 
                          axisLine={{stroke: '#e2e8f0'}} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} 
                          label={{ value: 'Iteration', position: 'insideBottom', offset: -5, style: {fontSize: 10, fill: '#64748b', fontWeight: 600} }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} 
                          label={{ value: 'FWHM (meV)', angle: -90, position: 'insideLeft', style: {fontSize: 10, fill: '#64748b', fontWeight: 600} }}
                        />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
                        />
                        <Area type="monotone" dataKey="fwhm" stroke="#4C3BDE" strokeWidth={2} fillOpacity={1} fill="url(#colorFwhm)" activeDot={{r: 5, fill: '#4C3BDE', stroke: 'white', strokeWidth: 2}} dot={{r: 3, fill: '#4C3BDE'}} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports Table */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-bold text-[#1e1b4b]">Recent Reports</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Report Name</th>
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Experiment ID</th>
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Generated On</th>
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Best FWHM</th>
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">RMSE</th>
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">MAE</th>
                      <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-2 text-[13px] font-bold text-slate-800">{report.name}</td>
                        <td className="py-4 px-2 text-[13px] text-slate-600 font-medium">{report.id}</td>
                        <td className="py-4 px-2 text-[12px] text-slate-500">{report.date}</td>
                        <td className="py-4 px-2 text-[13px] font-bold text-slate-800">{report.fwhm}</td>
                        <td className="py-4 px-2 text-[13px] text-slate-600 font-medium">{rmseValue}</td>
                        <td className="py-4 px-2 text-[13px] text-slate-600 font-medium">{maeValue}</td>
                        <td className="py-4 px-2">
                          <span className="px-2.5 py-1 bg-[#E8FFF3] text-[#00B050] text-[11px] font-bold rounded-md">Completed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <span className="text-[12px] font-medium text-slate-500">Showing {filteredReports.length > 0 ? 1 : 0} to {filteredReports.length} of {recentReports.length} reports</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-[35%] flex flex-col space-y-6">
            {/* AI Generated Insights */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6 bg-gradient-to-br from-white to-[#F9F8FF]">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-bold text-[#1e1b4b]">AI Generated Insights</h2>
              </div>

              <div className="space-y-6 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-[#EBF4FF] flex items-center justify-center text-[#3B82F6] flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] text-slate-700 leading-snug font-medium">
                    The model achieved its best FWHM of <span className="text-[#00B050] font-bold">{bestFwhm}</span>.
                  </p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-[#EBF4FF] flex items-center justify-center text-[#3B82F6] flex-shrink-0 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] text-slate-700 leading-snug font-medium">
                    The surrogate model shows high reliability with R² score of <span className="font-bold">{r2Value}</span>.
                  </p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] text-slate-700 leading-snug font-medium">
                    Strong parameter correlations exist between growth temperatures and peak FWHM.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => navigate('/results')}
                className="w-full py-3 bg-[#F8F6FF] text-[#4C3BDE] rounded-xl font-bold text-[13px] hover:bg-[#F0EBFF] transition-colors flex items-center justify-center space-x-2 border border-[#4C3BDE]/10"
              >
                <span>View Full Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Report Details */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
                  <Info className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-bold text-[#1e1b4b]">Report Details</h2>
              </div>

              <div className="space-y-5 mb-8">
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE] mr-3 mt-0.5 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[90px_1fr] gap-2">
                    <span className="text-[12px] font-bold text-slate-500">Report Type</span>
                    <span className="text-[12px] font-semibold text-slate-800 truncate">Experiment Summary</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE] mr-3 mt-0.5 flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[90px_1fr] gap-2">
                    <span className="text-[12px] font-bold text-slate-500">Generated On</span>
                    <span className="text-[12px] font-semibold text-slate-800 truncate">{generatedOn}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE] mr-3 mt-0.5 flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[90px_1fr] gap-2">
                    <span className="text-[12px] font-bold text-slate-500">Generated By</span>
                    <span className="text-[12px] font-semibold text-slate-800 truncate">{loggedInUser.username} (Researcher)</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE] mr-3 mt-0.5 flex-shrink-0">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[90px_1fr] gap-2">
                    <span className="text-[12px] font-bold text-slate-500">Data Source</span>
                    <span className="text-[12px] font-semibold text-slate-800 truncate" title={datasetsList[0]?.name || 'Perovskite_PL_Study'}>{datasetsList[0]?.name || 'Perovskite_PL_Study'}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE] mr-3 mt-0.5 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[90px_1fr] gap-2">
                    <span className="text-[12px] font-bold text-slate-500">File Format</span>
                    <span className="text-[12px] font-semibold text-slate-800 truncate">PDF, CSV</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border border-[#ff4d4f]/30 text-[#ff4d4f] hover:bg-[#fff1f0] transition-colors text-[13px] font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border border-[#00B050]/30 text-[#00B050] hover:bg-[#E8FFF3] transition-colors text-[13px] font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
