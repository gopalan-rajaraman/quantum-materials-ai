import React from 'react';
import { Activity, Database, Zap, TrendingUp, FlaskConical } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Laboratory Overview</h2>
        <p className="text-slate-400 text-lg mt-2">High-level metrics and system status across all Quantum experiments.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: "Total Datasets", value: "14", icon: <Database className="w-6 h-6 text-cyan-400" />, trend: "+2 this week" },
          { title: "Active Experiments", value: "3", icon: <FlaskConical className="w-6 h-6 text-purple-400" />, trend: "Running BO Loop" },
          { title: "Best Material Target", value: "2.14 eV", icon: <Zap className="w-6 h-6 text-emerald-400" />, trend: "Found 2 days ago" },
          { title: "Surrogate Model Confidence", value: "94.2%", icon: <Activity className="w-6 h-6 text-rose-400" />, trend: "Matern Kernel Tuned" },
        ].map((stat, i) => (
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
        {/* Placeholder for a Chart */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-white">Optimization Progress (Global)</h3>
             <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300">View Full Report</button>
           </div>
           <div className="h-72 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center">
             <div className="text-center">
               <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
               <p className="text-slate-400">Plotly Global Optimization History Chart will render here</p>
             </div>
           </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl">
           <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
           <div className="space-y-6">
             {[
               { title: "Experiment Completed", desc: "Perovskite trial #4 yielded 1.8eV", time: "10 mins ago", color: "bg-emerald-500" },
               { title: "Hyperparameters Tuned", desc: "Gaussian Process updated kernel bounds", time: "2 hours ago", color: "bg-cyan-500" },
               { title: "Dataset Uploaded", desc: "Superconductor_v2.xlsx added to DB", time: "5 hours ago", color: "bg-purple-500" },
               { title: "BO Loop Started", desc: "Acquisition function maximizing for UCB", time: "1 day ago", color: "bg-rose-500" },
             ].map((log, i) => (
               <div key={i} className="flex relative">
                 {i !== 3 && <div className="absolute top-8 left-2 w-0.5 h-full bg-slate-800"></div>}
                 <div className={`w-4 h-4 rounded-full mt-1.5 mr-4 flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${log.color}`}></div>
                 <div>
                   <h4 className="text-white font-medium text-sm mb-1">{log.title}</h4>
                   <p className="text-slate-400 text-xs mb-1">{log.desc}</p>
                   <span className="text-slate-500 text-[10px] font-mono">{log.time}</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
