import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Lock, Unlock, Clock, Database as DbIcon } from 'lucide-react';

const Datasets = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_datasets: 0,
    active_experiments: 0,
    locked_datasets: 0,
    total_runs: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [savedRes, dashRes] = await Promise.all([
          fetch('http://localhost:8000/api/datasets/saved'),
          fetch('http://localhost:8000/api/datasets/dashboard')
        ]);
        
        if (savedRes.ok) {
          const data = await savedRes.json();
          // Transform backend structure if necessary, or just use it directly
          const formatted = data.datasets.map((ds, idx) => ({
            id: ds.id || idx,
            name: ds.name || 'Dataset',
            description: ds.target || 'Optimization dataset',
            expRange: ds.id || `EXP-${100 + idx}`,
            status: ds.status === 'Completed' ? 'Locked' : 'In-Progress',
            date: ds.date || new Date().toLocaleDateString()
          }));
          setDatasets(formatted);
        }

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setDashboardStats({
            total_datasets: dashData.total_datasets || 0,
            locked_datasets: data?.datasets?.filter(d => d.status === 'Completed').length || 0,
            active_experiments: dashData.active_experiments || 0,
            total_runs: dashData.n_training_samples || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch dataset info:", err);
      }
    };
    
    fetchData();
  }, []);

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'Locked':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Lock className="w-3 h-3" /> Locked</span>;
      case 'In-Progress':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> In-Progress</span>;
      case 'Unlocked':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Unlock className="w-3 h-3" /> Unlocked</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">My Datasets</h2>
          <p className="text-slate-500">Manage all your experiment datasets.</p>
        </div>
        <button 
          onClick={() => navigate('/datasets/upload')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Dataset</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Dataset Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Exp. ID Range</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created On</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {datasets.length > 0 ? datasets.map((dataset) => (
              <tr key={dataset.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{dataset.name}</td>
                <td className="px-6 py-4">{dataset.description}</td>
                <td className="px-6 py-4 font-mono text-xs">{dataset.expRange}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={dataset.status} />
                </td>
                <td className="px-6 py-4">{dataset.date}</td>
                <td className="px-6 py-4 text-center">
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No datasets found. Upload a new dataset to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Account Details</h3>
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Name</p>
              <p className="font-semibold text-slate-900">Khushboo</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Email</p>
              <p className="font-semibold text-slate-900">khushboo.research@boloop.com</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Role</p>
              <p className="font-semibold text-slate-900">Researcher</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Member Since</p>
              <p className="font-semibold text-slate-900">15/05/2026</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Database Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Total Datasets</p>
              <p className="text-3xl font-bold text-indigo-600">{dashboardStats.total_datasets}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Locked Datasets</p>
              <p className="text-3xl font-bold text-emerald-600">{datasets.filter(d => d.status === 'Locked').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Total Experiments</p>
              <p className="text-3xl font-bold text-amber-600">{dashboardStats.active_experiments}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Total Runs</p>
              <p className="text-3xl font-bold text-rose-600">{dashboardStats.total_runs}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Datasets;
