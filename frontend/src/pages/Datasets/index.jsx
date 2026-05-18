import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Lock, Unlock, Clock, Database as DbIcon, Beaker, Zap } from 'lucide-react';

const Datasets = () => {
  const navigate = useNavigate();

  const datasets = [
    {
      id: 1,
      name: 'Perovskite_PL_Study',
      description: 'Perovskite PL FWHM optimization',
      expRange: 'EXP-001 to EXP-010',
      status: 'Locked',
      date: '15/05/2026'
    },
    {
      id: 2,
      name: 'QD_Tuning_Study',
      description: 'Quantum dot tuning experiments',
      expRange: 'EXP-011 to EXP-020',
      status: 'In-Progress',
      date: '12/05/2026'
    },
    {
      id: 3,
      name: 'Material_Screening',
      description: 'Material screening dataset',
      expRange: 'EXP-021 to EXP-030',
      status: 'Unlocked',
      date: '10/05/2026'
    }
  ];

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
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">My Datasets</h2>
          <p className="text-slate-500">Manage all your experiment datasets.</p>
        </div>
        <button 
          onClick={() => navigate('/datasets/upload')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20"
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
            {datasets.map((dataset) => (
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
            ))}
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
              <p className="text-3xl font-bold text-indigo-600">3</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Locked Datasets</p>
              <p className="text-3xl font-bold text-emerald-600">1</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Total Experiments</p>
              <p className="text-3xl font-bold text-amber-600">30</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Total Runs</p>
              <p className="text-3xl font-bold text-rose-600">84</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Datasets;
