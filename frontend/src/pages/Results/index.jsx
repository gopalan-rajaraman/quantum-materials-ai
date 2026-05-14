import React from 'react';
import { Target, Cpu, LineChart, AlertTriangle } from 'lucide-react';

const Results = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">Model Results (EXP-104)</h2>
        <p className="text-slate-400 text-lg">Final analysis and parameter breakdown for the optimized material.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Best Parameters Found */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Optimal Parameters</h3>
            </div>
            
            <p className="text-sm text-slate-400 mb-6">The ML model suggests synthesizing the material with these exact parameters to achieve the highest Bandgap.</p>
            
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Temperature</span>
                <span className="text-white font-mono font-bold text-lg">425.5 K</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Pressure</span>
                <span className="text-white font-mono font-bold text-lg">2.1 atm</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Structure</span>
                <span className="text-cyan-400 font-mono font-bold text-lg">Perovskite</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-slate-500 text-sm mb-1">Predicted Target (Bandgap)</p>
              <p className="text-4xl font-extrabold text-emerald-400">1.85 <span className="text-xl text-emerald-500/70">eV</span></p>
            </div>
          </div>
          
          {/* Uncertainty Metrics */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><AlertTriangle className="w-4 h-4 text-amber-400 mr-2" /> Model Uncertainty</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Standard Deviation (σ)</span>
                <span className="text-white font-mono">± 0.05 eV</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Confidence Interval</span>
                <span className="text-white font-mono">95%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl h-96 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center"><LineChart className="w-5 h-5 text-cyan-400 mr-2" /> Optimization Trajectory</h3>
              <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-400">Plotly</span>
            </div>
            <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center justify-center">
              <p className="text-slate-500">Convergence plot (Target Value vs Evaluation Iteration) will render here.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl h-72 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center"><Cpu className="w-5 h-5 text-purple-400 mr-2" /> Feature Importance</h3>
            </div>
            <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center justify-center">
              <p className="text-slate-500">Bar chart showing which parameters affected the Bandgap the most.</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Results;
