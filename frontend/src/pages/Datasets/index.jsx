import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, List, Grid, Lock, Unlock, 
  MoreVertical, ChevronDown, ChevronLeft, ChevronRight, FileText,
  Database, FlaskConical, PlayCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const Datasets = () => {
  const navigate = useNavigate();

  const datasets = [
    { name: 'labelled.xlsx', desc: 'PL_FWHM (meV)', expId: 'EXP-101', status: 'Locked', date: '20 May 2026, 02:31 PM', size: '1.2 MB', author: 'Khushboo' },
    { name: 'perovskite_raw.csv', desc: 'Raw spectral data', expId: 'EXP-080 - EXP-100', status: 'Unlocked', date: '19 May 2026, 11:02 AM', size: '4.8 MB', author: 'Khushboo' },
    { name: 'qp_thin_film_data.csv', desc: 'Quantum dot thin film', expId: 'EXP-050 - EXP-079', status: 'Locked', date: '18 May 2026, 09:45 AM', size: '6.3 MB', author: 'Khushboo' },
    { name: 'material_screening.xlsx', desc: 'Material screening results', expId: 'EXP-001 - EXP-049', status: 'Unlocked', date: '15 May 2026, 04:12 PM', size: '2.1 MB', author: 'Khushboo' },
    { name: 'strain_engineering.csv', desc: 'Strain vs FWHM study', expId: 'EXP-020 - EXP-060', status: 'Locked', date: '12 May 2026, 10:30 AM', size: '3.7 MB', author: 'Khushboo' },
  ];

  const sizeData = [
    { name: 'CSV Files', value: 62, color: '#8B5CF6' },
    { name: 'Excel Files', value: 25, color: '#00B050' },
    { name: 'Others', value: 13, color: '#F97316' },
  ];

  const activityData = [
    { date: '14 May', value: 2 },
    { date: '15 May', value: 3 },
    { date: '16 May', value: 3.5 },
    { date: '17 May', value: 4 },
    { date: '18 May', value: 6.5 },
    { date: '19 May', value: 4.5 },
    { date: '20 May', value: 3 },
  ];

  const StatusBadge = ({ status }) => {
    if (status === 'Locked') {
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

  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] mb-1">My Datasets</h1>
          <p className="text-slate-500 text-sm">Manage, explore and organize all your experiment datasets.</p>
        </div>
        <button 
          onClick={() => navigate('/datasets/upload')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#4C3BDE] hover:bg-[#3D2EB0] text-white font-bold rounded-lg transition-all shadow-sm text-[13px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Dataset</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total Datasets</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">12</p>
            <p className="text-[10px] text-slate-400 font-semibold">All datasets in your workspace</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8FFF3] flex items-center justify-center text-[#00B050]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Locked Datasets</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">5</p>
            <p className="text-[10px] text-slate-400 font-semibold">Protected from modification</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total Experiments</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">28</p>
            <p className="text-[10px] text-slate-400 font-semibold">Across all datasets</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total Runs</p>
            <p className="text-2xl font-bold text-[#1e1b4b] mb-0.5">156</p>
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
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] w-[220px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Status</span>
                <div className="relative">
                  <select className="appearance-none bg-slate-50 border border-slate-200 rounded text-[12px] font-semibold text-slate-700 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer">
                    <option>All</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Experiment ID</span>
                <div className="relative">
                  <select className="appearance-none bg-slate-50 border border-slate-200 rounded text-[12px] font-semibold text-slate-700 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer">
                    <option>All</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Created By</span>
                <div className="relative">
                  <select className="appearance-none bg-slate-50 border border-slate-200 rounded text-[12px] font-semibold text-slate-700 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer">
                    <option>All</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <button className="flex items-center space-x-2 text-slate-600 px-3 py-1.5 hover:bg-slate-50 rounded border border-slate-200 transition-colors text-[12px] font-semibold ml-2 mt-4">
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
              {datasets.map((ds, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-[#F4F0FF] text-[#4C3BDE]">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-800">{ds.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[13px] text-slate-600 font-medium">{ds.desc}</td>
                  <td className="py-4 px-6 text-[12px] text-slate-500 font-semibold">{ds.expId}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={ds.status} />
                  </td>
                  <td className="py-4 px-6 text-[12px] text-slate-500 font-medium">{ds.date}</td>
                  <td className="py-4 px-6 text-[13px] font-bold text-slate-800">{ds.size}</td>
                  <td className="py-4 px-6 text-[13px] font-semibold text-slate-700">{ds.author}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <button className="p-1.5 text-slate-400 hover:text-[#4C3BDE] hover:bg-[#F4F0FF] rounded-md transition-colors border border-slate-200 bg-white shadow-sm">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-500">Showing <span className="font-bold text-[#4C3BDE]">1 to 5 of 12 datasets</span></span>
          <div className="flex space-x-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#4C3BDE] text-white text-[13px] font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[12px] font-medium text-slate-500">Rows per page</span>
            <div className="relative">
              <select className="appearance-none bg-white border border-slate-200 rounded text-[12px] font-bold text-slate-700 py-1.5 pl-3 pr-8 focus:outline-none cursor-pointer">
                <option>5</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Details */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6">
          <h3 className="text-[14px] font-bold text-[#1e1b4b] mb-6">Account Details</h3>
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-[#4C3BDE] flex items-center justify-center text-white text-lg font-bold shadow-sm">
              K
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Name</p>
              <p className="text-[14px] font-bold text-slate-800">Khushboo</p>
            </div>
            <div className="ml-4">
              <p className="text-[11px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Email</p>
              <p className="text-[13px] font-medium text-slate-600">khushboo.research@boloop.com</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Role</p>
              <p className="text-[13px] font-bold text-slate-800">Researcher</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Member Since</p>
              <p className="text-[13px] font-bold text-slate-800">15 May 2026</p>
            </div>
          </div>
        </div>

        {/* Dataset Size Overview */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6">
          <h3 className="text-[14px] font-bold text-[#1e1b4b] mb-4">Dataset Size Overview</h3>
          <div className="flex items-center">
            <div className="w-[150px] h-[150px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {sizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-800">2.4 GB</span>
                <span className="text-[9px] font-semibold text-slate-500 uppercase">Total Size</span>
              </div>
            </div>
            <div className="flex-1 pl-4 space-y-4">
              {sizeData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-bold text-slate-800">{item.value === 62 ? '1.5 GB' : item.value === 25 ? '0.6 GB' : '0.3 GB'}</span>
                    <span className="text-[10px] font-semibold text-slate-400 w-6 text-right">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dataset Activity */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-bold text-[#1e1b4b]">Dataset Activity (Last 7 Days)</h3>
            <div className="relative">
              <select className="appearance-none bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 py-1 pl-2 pr-6 focus:outline-none cursor-pointer">
                <option>Last 7 Days</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} label={{ value: 'Datasets', angle: -90, position: 'insideLeft', style: {fontSize: 9, fill: '#64748b'} }} domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{r: 3, fill: '#8B5CF6', strokeWidth: 0}} activeDot={{r: 5}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Datasets;
