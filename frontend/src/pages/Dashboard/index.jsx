import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  FlaskConical, 
  Check, 
  Clock, 
  Search, 
  Bell, 
  Plus, 
  MoreVertical, 
  ChevronDown, 
  ArrowUpRight, 
  Lock, 
  Unlock, 
  RefreshCw,
  Sliders,
  TrendingUp,
  FileText,
  Activity,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import api from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [savedDatasets, setSavedDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get logged-in username from localStorage
  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};
  const username = loggedInUser?.username || loggedInUser?.email?.split('@')[0] || 'Researcher';

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsData, savedData] = await Promise.all([
        api.fetchDashboardStats().catch(() => null),
        api.fetchSavedDatasets().catch(() => null)
      ]);

      if (statsData) {
        setStats(statsData);
      }
      if (savedData) {
        setSavedDatasets(savedData.datasets || []);
      }
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Stats Card data
  const totalDatasets = stats?.total_datasets ?? 0;
  const activeExperiments = stats?.active_experiments ?? 0;
  const completedRuns = stats?.n_training_samples ?? 0;
  const inProgressCount = savedDatasets.filter(ds => ds.status !== 'Completed').length;

  const statCardsData = [
    {
      title: 'Total Datasets',
      value: totalDatasets,
      icon: <Database className="w-5 h-5 text-[#5D3EBC]" />,
      iconBg: 'bg-[#F0EDFF]',
      trend: '+ 20%',
      trendColor: 'text-[#10B981] bg-[#E6F4EA]',
      label: 'vs last 30 days',
    },
    {
      title: 'Total Experiments',
      value: activeExperiments,
      icon: <FlaskConical className="w-5 h-5 text-[#3B82F6]" />,
      iconBg: 'bg-[#E8F0FE]',
      trend: '+ 12%',
      trendColor: 'text-[#10B981] bg-[#E6F4EA]',
      label: 'vs last 30 days',
    },
    {
      title: 'Completed Runs',
      value: completedRuns,
      icon: <Check className="w-5 h-5 text-[#10B981]" />,
      iconBg: 'bg-[#E6F4EA]',
      trend: '+ 18%',
      trendColor: 'text-[#10B981] bg-[#E6F4EA]',
      label: 'vs last 30 days',
    },
    {
      title: 'In Progress',
      value: inProgressCount,
      icon: <Clock className="w-5 h-5 text-[#F59E0B]" />,
      iconBg: 'bg-[#FEF3C7]',
      trend: '- 5%',
      trendColor: 'text-[#EF4444] bg-[#FEE2E2]',
      label: 'vs last 30 days',
    },
  ];

  const loadedDatasets = savedDatasets.map((ds, idx) => ({
    name: ds.name?.replace(' (auto-loaded)', '') || 'dataset_' + (idx + 1),
    description: ds.target ? `Target: ${ds.target}` : 'Uploaded dataset',
    range: ds.id || `EXP-${101 + idx}`,
    status: ds.status === 'Completed' ? 'Locked' : 'In Progress',
    updated: ds.date ? ds.date.split(' ')[0].split('-').reverse().join('/') : '20/05/2026'
  }));

  const allDatasets = loadedDatasets;
  const filteredDatasets = allDatasets.filter(ds => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ds.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Experiments Overview Chart Data (reproducing mockup trend)
  const overviewChartData = stats?.overview_chart_data || [];

  // Donut chart data for Variable Summary
  const variableSummaryData = stats?.variable_summary_data || [];

  // Model performance charts data
  const modelPerformanceData = stats?.model_performance_data || [];

  // Activity Feed logs
  const activityLogs = (stats?.activity_log || []).map(log => {
    let icon = <FileText className="w-3.5 h-3.5 text-white" />;
    let iconBg = log.color || 'bg-slate-500';
    if (iconBg.includes('purple')) {
      icon = <Plus className="w-3.5 h-3.5 text-white" />;
    } else if (iconBg.includes('cyan')) {
      icon = <Activity className="w-3.5 h-3.5 text-white" />;
    } else if (iconBg.includes('emerald')) {
      icon = <FlaskConical className="w-3.5 h-3.5 text-white" />;
    } else if (iconBg.includes('orange') || iconBg.includes('red')) {
      icon = <Lock className="w-3.5 h-3.5 text-white" />;
    } else if (iconBg.includes('green')) {
      icon = <Unlock className="w-3.5 h-3.5 text-white" />;
    }

    let timeStr = log.time || log.timestamp || 'Just now';
    if (timeStr.includes(' ')) {
      timeStr = timeStr.split(' ')[1];
    }

    return {
      title: log.title,
      desc: log.desc || log.description,
      time: timeStr,
      icon,
      iconBg
    };
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-12 animate-fade-in select-none">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D0B2E] flex items-center gap-2">
            Welcome back, {username}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-[15px] text-[#8C8CA1] font-medium mt-4 leading-relaxed">Here's what's happening with your experiments.</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C8CA1] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search datasets, experiments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5D3EBC]/20 focus:border-[#5D3EBC] text-[13px] font-medium placeholder:text-[#8C8CA1] bg-white text-slate-800 transition-all"
            />
          </div>


          {/* New Dataset Button */}
          <button 
            onClick={() => navigate('/datasets/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-[#5D3EBC] hover:bg-[#4E32A6] text-white font-semibold text-[13px] rounded-full shadow-md shadow-[#5D3EBC]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Dataset</span>
          </button>

          {/* Refresh Button */}
          <button 
            onClick={fetchAll}
            className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCardsData.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold text-[#8C8CA1] block mb-0.5">{card.title}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0D0B2E]">{card.value}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${card.trendColor}`}>
                  {card.trend}
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#8C8CA1] block mt-0.5">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Recent Datasets */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Recent Datasets Table */}
        <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#0D0B2E]">Recent Datasets</h3>
              <button 
                onClick={() => navigate('/datasets')}
                className="text-[12px] font-semibold text-[#5D3EBC] px-3 py-1 rounded-md border border-[#5D3EBC]/10 hover:bg-[#5D3EBC]/5 transition-colors"
              >
                View all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[#8C8CA1] font-semibold">
                    <th className="pb-3 font-semibold">Dataset Name</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold">Exp. ID Range</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Updated On</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(searchQuery ? filteredDatasets : filteredDatasets.slice(0, 3)).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-[#0D0B2E] max-w-[150px] truncate" title={row.name}>
                        {row.name}
                      </td>
                      <td className="py-3.5 text-slate-500 max-w-[180px] truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="py-3.5 text-[#8C8CA1] font-medium">{row.range}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          row.status === 'Locked' 
                            ? 'bg-[#E6F4EA] text-[#10B981]' 
                            : row.status === 'In Progress' 
                              ? 'bg-[#E8F0FE] text-[#3B82F6]' 
                              : 'bg-[#FEF3C7] text-[#F59E0B]'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 font-medium">{row.updated}</td>
                      <td className="py-3.5 text-right">
                        <button className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600 inline-block">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#8C8CA1] font-medium">
            <span>Showing {searchQuery ? filteredDatasets.length : Math.min(3, filteredDatasets.length)} of {filteredDatasets.length} datasets</span>
          </div>
        </div>

      </div>

      {/* Row 3: Variable Summary, Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Variable Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between h-[300px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded-full bg-[#F0EDFF] flex items-center justify-center shrink-0">
                <Sliders className="w-3 h-3 text-[#5D3EBC]" />
              </span>
              <h3 className="text-[15px] font-bold text-[#0D0B2E]">Variable Summary</h3>
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
              {/* Donut Chart */}
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={variableSummaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={52}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {variableSummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none select-none">
                  <span className="text-[20px] font-black text-[#0D0B2E]">
                    {variableSummaryData.reduce((sum, item) => sum + (item.value || 0), 0) || ''}
                  </span>
                  <span className="text-[10px] font-semibold text-[#8C8CA1] mt-0.5">Total</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2">
                {variableSummaryData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-500 font-semibold">{item.name}</span>
                    </div>
                    <div className="text-right text-[#0D0B2E]">
                      <span className="font-bold mr-1">{item.value}</span>
                      <span className="text-[#8C8CA1] text-[10px]">({item.percentage})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/variables')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#5D3EBC] hover:translate-x-0.5 transition-transform text-left w-fit mt-2"
          >
            <span>View all variables</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>


        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F0EDFF] flex items-center justify-center shrink-0">
                  <Activity className="w-3 h-3 text-[#5D3EBC]" />
                </span>
                <h3 className="text-[15px] font-bold text-[#0D0B2E]">Activity Feed</h3>
              </div>
              <button 
                onClick={() => navigate('/experiments')}
                className="text-[11px] font-semibold text-[#5D3EBC] hover:underline"
              >
                View all
              </button>
            </div>

            {/* Vertical Feed Timeline */}
            <div className="space-y-3.5 relative pl-4 max-h-[190px] overflow-y-auto no-scrollbar">
              {/* Vertical line connector */}
              <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-slate-100" />

              {activityLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 items-start relative">
                  {/* Icon */}
                  <div className={`w-5 h-5 rounded-full ${log.iconBg} flex items-center justify-center shrink-0 z-10 -ml-2.5`}>
                    {log.icon}
                  </div>
                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#0D0B2E] leading-tight truncate">{log.title}</p>
                    <p className="text-[9px] text-[#8C8CA1] font-semibold mt-0.5">{log.desc}</p>
                  </div>
                  {/* Time */}
                  <span className="text-[9px] text-[#8C8CA1] font-semibold shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
