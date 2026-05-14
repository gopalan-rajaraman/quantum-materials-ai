import React from 'react';

const Optimization = () => {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-2">Active Learning Loop</h2>
      <p className="text-slate-400 mb-8">Gaussian Process Surrogate Model & Bayesian Optimization</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Gaussian Surrogate Model</h3>
            <div className="h-64 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
              <span className="text-slate-500">Plotly Graph will render here</span>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Acquisition Function (Expected Improvement)</h3>
            <div className="h-48 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
              <span className="text-slate-500">Plotly Graph will render here</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 border-t-4 border-t-cyan-500">
            <h3 className="text-lg font-semibold text-white mb-2">Next Suggested Experiment</h3>
            <p className="text-sm text-slate-400 mb-4">Based on max Expected Improvement</p>
            
            <div className="space-y-3">
              <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-slate-400 text-sm">Temperature</span>
                <span className="text-cyan-400 font-mono font-bold">450.5 °C</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-slate-400 text-sm">Pressure</span>
                <span className="text-cyan-400 font-mono font-bold">1.2 atm</span>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
              Run Experiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimization;
