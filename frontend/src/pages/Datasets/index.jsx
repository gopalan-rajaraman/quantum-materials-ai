import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, List, Grid, Lock, Unlock, 
  MoreVertical, ChevronDown, ChevronLeft, ChevronRight, FileText,
  Database, FlaskConical, PlayCircle
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import api from '../../services/api';
import { getStoredUser, getUserDisplayName } from '../../utils/auth';
 
const Datasets = () => {
  const navigate = useNavigate();
  const [datasetsList, setDatasetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
 
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await api.fetchSavedDatasets();
      setDatasetsList(data.datasets || []);
    } catch (e) {
      console.error('Error fetching datasets:', e);
    } finally {
      setLoading(false);
    }
  };
 
  // Get logged-in user from localStorage
  const loggedInUser = getStoredUser();
  const loggedInUsername = getUserDisplayName(loggedInUser, '—');
  const loggedInRole = loggedInUser?.role || 'Researcher';
 
  useEffect(() => {
    fetchDatasets();
  }, []);
 
  const totalDatasets = datasetsList.length;
  const lockedDatasets = datasetsList.filter(ds => ds.status === 'Completed').length;
  const unlockedDatasets = totalDatasets - lockedDatasets;
  
  const totalRuns = datasetsList.reduce((acc, curr) => {
    const rows = parseInt(curr.rows || '0', 10);
    return acc + (isNaN(rows) ? 0 : rows);
  }, 0);
 
  const csvSizeMB = datasetsList.reduce((acc, curr) => acc + (parseInt(curr.rows || '0', 10) * 12), 0) / 1024;
  const metadataSizeMB = datasetsList.length * 0.05;
  const modelCacheSizeMB = datasetsList.length > 0 ? 0.8 : 0;
  const othersSizeMB = datasetsList.length > 0 ? 0.15 : 0;
  const totalSizeMB = csvSizeMB + metadataSizeMB + modelCacheSizeMB + othersSizeMB;
 
  const categoryData = [
    { name: 'CSV Data', size: csvSizeMB, color: '#6366f1', icon: <FileText className="w-4 h-4 text-white" />, bg: 'bg-[#8B5CF6]' },
    { name: 'Metadata', size: metadataSizeMB, color: '#3b82f6', icon: <List className="w-4 h-4 text-white" />, bg: 'bg-[#3B82F6]' },
    { name: 'Model Cache', size: modelCacheSizeMB, color: '#f59e0b', icon: <Database className="w-4 h-4 text-white" />, bg: 'bg-[#F59E0B]' },
    { name: 'Others', size: othersSizeMB, color: '#ec4899', icon: <MoreVertical className="w-4 h-4 text-white" />, bg: 'bg-[#EC4899]' },
  ].filter(item => item.size > 0).sort((a, b) => b.size - a.size);
 
  const formatSize = (mb) => mb < 1 ? `${(mb * 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
 
  const lastUpdated = datasetsList.length > 0 && datasetsList[datasetsList.length - 1].date 
    ? new Date(datasetsList[datasetsList.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
 
  const StatusBadge = ({ status }) => {
    if (status === 'Completed' || status === 'Locked') {
      return (
        <span className="px-2.5 py-1 bg-[#E8FFF3] text-[#00B050] text-[11px] font-bold rounded-md flex items-center space-x-1.5 w-fit border border-[#00B050]/20">
          <Lock className="w-3 h-3" />
          <span>Locked</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-[#F4F0FF] text-[#4C3BDE] text-[11px] font-bold rounded-md flex items-center space-x-1.5 w-fit border border-[#4C3BDE]/20">
        <Unlock className="w-3 h-3" />
        <span>Unlocked</span>
      </span>
    );
  };
 
  const filteredDatasets = datasetsList.filter(ds => 
    (ds.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ds.target || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
 
  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] mb-4">My Datasets</h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">Manage, explore and organize all your experiment datasets.</p>
        </div>
        <button 
          onClick={() => navigate('/datasets/upload')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#4C3BDE] hover:bg-[#3D2EB0] text-white font-bold rounded-lg transition-all shadow-sm text-[13px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Dataset</span>
        </button>
      </div>
 
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total Datasets</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">{totalDatasets}</p>
            <p className="text-[10px] text-slate-400 font-semibold">All datasets in your workspace</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8FFF3] flex items-center justify-center text-[#00B050]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Locked Datasets</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">{lockedDatasets}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Protected from modification</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Unlocked Datasets</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">{unlockedDatasets}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Active datasets</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total Runs</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">{totalRuns}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Model runs executed</p>
          </div>
        </div>
      </div>
 
      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search datasets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] w-[220px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]"
              />
            </div>
            
            <button className="flex items-center space-x-2 text-slate-600 px-3 py-1.5 hover:bg-slate-50 rounded border border-slate-200 transition-colors text-[12px] font-semibold ml-2">
              <Filter className="w-3.5 h-3.5" />
              <span>More Filters</span>
            </button>
          </div>
 
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Sort by</span>
              <div className="relative">
                <select className="appearance-none bg-white border border-slate-200 rounded text-[12px] font-semibold text-slate-700 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer">
                  <option>Created On (Newest)</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5 mt-4">
              <button className="p-1.5 bg-white shadow-sm rounded-md text-[#4C3BDE]">
                <List className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
 
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dataset Name</th>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Exp. ID Range</th>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created On</th>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Size</th>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created By</th>
                <th className="text-center py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((ds, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE]">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-800">{ds.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[13px] text-slate-600 font-medium">{ds.target || 'PL_FWHM (meV)'}</td>
                  <td className="py-4 px-6 text-[12px] text-slate-500 font-semibold">{ds.id || `EXP-${101 + idx}`}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={ds.status} />
                  </td>
                  <td className="py-4 px-6 text-[12px] text-slate-500 font-medium">{ds.date || '—'}</td>
                  <td className="py-4 px-6 text-[13px] font-bold text-slate-800">{ds.rows ? (parseInt(ds.rows, 10) * 12).toFixed(1) + " KB" : '—'}</td>
                  <td className="py-4 px-6 text-[13px] font-semibold text-slate-700">{ds.author || loggedInUsername}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <button className="p-1.5 text-slate-400 hover:text-[#4C3BDE] hover:bg-[#F4F0FF] rounded-md transition-colors border border-slate-200 bg-white shadow-sm">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDatasets.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400 font-medium">
                    No datasets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
 
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-500">Showing <span className="font-bold text-[#4C3BDE]">{filteredDatasets.length > 0 ? 1 : 0} to {filteredDatasets.length} of {totalDatasets} datasets</span></span>
          <div className="flex space-x-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#4C3BDE] text-white text-[13px] font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[12px] font-medium text-slate-500">Rows per page</span>
            <div className="relative">
              <select className="appearance-none bg-white border border-slate-200 rounded text-[12px] font-bold text-slate-700 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer">
                <option>{totalDatasets}</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
 
      {/* Dataset Size Overview */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-6">
        <div className="p-8 pb-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#1e1b4b] mb-1">Dataset Size Overview</h2>
              <p className="text-[14px] text-slate-500">Understand how your dataset storage is being used.</p>
            </div>
            <div className="flex items-center space-x-3 bg-[#F8F6FF] rounded-2xl px-5 py-3 border border-[#4C3BDE]/10">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4C3BDE] shadow-sm">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Size</p>
                <p className="text-lg font-bold text-[#4C3BDE] leading-none">{formatSize(totalSizeMB)}</p>
              </div>
            </div>
          </div>
 
          <div className="flex items-center justify-between">
            {/* Chart */}
            <div className="w-[320px] h-[320px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={140}
                    paddingAngle={0}
                    dataKey="size"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => formatSize(value)}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '13px'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-[#1e1b4b] mb-1">{formatSize(totalSizeMB)}</span>
                <span className="text-[12px] font-bold text-slate-400">Total Size</span>
              </div>
            </div>
 
            {/* List */}
            <div className="flex-1 max-w-[600px] ml-12">
              <div className="grid grid-cols-12 text-[12px] font-bold text-slate-400 mb-4 px-2">
                <div className="col-span-6">Category</div>
                <div className="col-span-3 text-right">Size</div>
                <div className="col-span-3 text-right">Share</div>
              </div>
              
              <div className="space-y-4">
                {categoryData.map((cat, idx) => {
                  const pct = totalSizeMB > 0 ? (cat.size / totalSizeMB * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} className="grid grid-cols-12 items-center px-2 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-xl transition-colors">
                      <div className="col-span-6 flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shadow-sm`}>
                          {cat.icon}
                        </div>
                        <span className="text-[14px] font-bold text-[#1e1b4b]">{cat.name}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-[14px] font-bold text-slate-800">{formatSize(cat.size)}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <div className="text-[13px] font-bold text-[#4C3BDE] mb-1.5">{pct}%</div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width: `${pct}%`, backgroundColor: cat.color}}></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Datasets;
 