import React from 'react';
import { 
  Search, TrendingUp, TrendingDown, Target, Database, Zap, 
  ShieldCheck, Download, MoreHorizontal, ChevronDown, 
  ChevronLeft, ChevronRight, Activity, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Scatter, Legend, Cell
} from 'recharts';
import surfacePlotImg from '../../assets/surface_plot.png';

const Models = () => {
  const trainingData = [
    { iteration: 1, trainR2: 0.1, valR2: 0.18, loss: 0.7 },
    { iteration: 2, trainR2: 0.6, valR2: 0.55, loss: 0.4 },
    { iteration: 3, trainR2: 0.8, valR2: 0.72, loss: 0.28 },
    { iteration: 4, trainR2: 0.85, valR2: 0.78, loss: 0.19 },
    { iteration: 5, trainR2: 0.9, valR2: 0.81, loss: 0.11 },
    { iteration: 6, trainR2: 0.92, valR2: 0.83, loss: 0.06 },
    { iteration: 7, trainR2: 0.93, valR2: 0.84, loss: 0.04 },
    { iteration: 8, trainR2: 0.94, valR2: 0.85, loss: 0.03 },
    { iteration: 9, trainR2: 0.94, valR2: 0.85, loss: 0.02 },
    { iteration: 10, trainR2: 0.95, valR2: 0.86, loss: 0.02 },
  ];

  const featureData = [
    { name: 'Temperature', value: 42 },
    { name: 'Pressure', value: 25 },
    { name: 'Growth Rate', value: 18 },
    { name: 'Material Type', value: 10 },
    { name: 'Annealing Time', value: 5 },
  ];

  const predictionData = [
    { iteration: 1, predicted: 47, observed: 48, lower: 30, upper: 65 },
    { iteration: 2, predicted: 39, observed: 38, lower: 25, upper: 55 },
    { iteration: 3, predicted: 34, observed: 35, lower: 22, upper: 48 },
    { iteration: 4, predicted: 31, observed: 30, lower: 20, upper: 44 },
    { iteration: 5, predicted: 24, observed: 25, lower: 18, upper: 32 },
    { iteration: 6, predicted: 22, observed: 22, lower: 17, upper: 28 },
    { iteration: 7, predicted: 25, observed: 27, lower: 20, upper: 32 },
    { iteration: 8, predicted: 22, observed: 21, lower: 18, upper: 27 },
    { iteration: 9, predicted: 21, observed: 22, lower: 18, upper: 25 },
    { iteration: 10, predicted: 23, observed: 24, lower: 20, upper: 27 },
  ];

  const modelVersions = [
    { version: 'v2.3', kernel: 'RBF + WhiteKernel', dataset: 'Perovskite_PL_Study', r2: '91.7%', mae: '2.1', status: 'Active', date: '16 May 2026, 10:40 AM', current: true },
    { version: 'v2.2', kernel: 'Matern 5/2', dataset: 'Perovskite_PL_Study', r2: '89.4%', mae: '2.7', status: 'Archived', date: '14 May 2026, 09:15 AM', current: false },
    { version: 'v2.1', kernel: 'RBF', dataset: 'Perovskite_PL_Study', r2: '87.2%', mae: '3.3', status: 'Archived', date: '12 May 2026, 02:05 PM', current: false },
  ];

  // Custom tooltips
  const CustomTooltipFeature = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-lg">
          <p className="text-[12px] font-bold text-slate-800">{payload[0].payload.name}</p>
          <p className="text-[11px] text-[#4C3BDE] font-semibold">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] mb-1">Models</h1>
          <p className="text-slate-500 text-sm">Monitor, evaluate and manage your machine learning models.</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search models..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-[250px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]"
            />
          </div>
        </div>
      </div>

      {/* Main Top Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Active Model Info */}
        <div className="lg:w-[55%] bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex justify-between items-center relative overflow-hidden">
          <div className="z-10 w-[60%]">
            <span className="px-2 py-0.5 bg-[#E8FFF3] text-[#00B050] text-[10px] font-bold uppercase tracking-wider rounded border border-[#00B050]/20 inline-block mb-3">
              Active Model
            </span>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-[#1e1b4b]">Gaussian Process Regression</h2>
              <span className="px-2 py-0.5 bg-[#F4F0FF] text-[#4C3BDE] text-[11px] font-bold rounded">v2.3</span>
            </div>
            <p className="text-[13px] text-slate-500 mb-8 leading-relaxed max-w-sm">
              Probabilistic model used as surrogate for Bayesian Optimization to predict FWHM (meV).
            </p>
            
            <div className="flex items-center space-x-8">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">Status</p>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00B050]"></div>
                  <span className="text-[13px] font-bold text-[#00B050]">Live</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">Last Trained</p>
                <span className="text-[13px] font-bold text-slate-800">5 mins ago</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">Dataset</p>
                <span className="text-[13px] font-bold text-slate-800">Perovskite_PL_Study</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">Iterations</p>
                <span className="text-[13px] font-bold text-slate-800">10 / 10</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[50%] h-[120%] opacity-90 z-0 flex items-center justify-center">
            <img src={surfacePlotImg} alt="Model Surface" className="w-[85%] object-contain" style={{ mixBlendMode: 'multiply' }} />
          </div>
        </div>

        {/* Right: Stats Grid */}
        <div className="lg:w-[45%] grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE] mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">R² Score</p>
            <p className="text-xl font-bold text-[#4C3BDE] mb-2">91.7%</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-[#00B050]">
              <ArrowUpRight className="w-3 h-3" />
              <span>4.3% vs last model</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE] mb-3">
              <Target className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">MAE</p>
            <p className="text-xl font-bold text-slate-800 mb-2">2.1 meV</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-[#00B050]">
              <ArrowDownRight className="w-3 h-3" />
              <span>0.6 meV</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE] mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">RMSE</p>
            <p className="text-xl font-bold text-slate-800 mb-2">3.4 meV</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-[#00B050]">
              <ArrowDownRight className="w-3 h-3" />
              <span>0.8 meV</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE] mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Confidence</p>
            <p className="text-xl font-bold text-slate-800 mb-2">94%</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-[#00B050]">
              <ArrowUpRight className="w-3 h-3" />
              <span>6%</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE] mb-3">
              <Database className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Training Rows</p>
            <p className="text-xl font-bold text-slate-800 mb-2">120</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-[#00B050]">
              <ArrowUpRight className="w-3 h-3" />
              <span>20</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE] mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Inference Time</p>
            <p className="text-xl font-bold text-slate-800 mb-2">82 ms</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-[#00B050]">
              <ArrowDownRight className="w-3 h-3" />
              <span>15 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Training Performance */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-bold text-slate-900">Training Performance</h3>
            <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 cursor-pointer">
              <span>All Iterations</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
              <span>Training R²</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
              <span>Validation R²</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-[#F97316]"></div>
              <span>Training Loss</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trainingData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="iteration" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} label={{ value: 'Iteration', position: 'insideBottom', offset: -5, style: {fontSize: 9, fill: '#64748b'} }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} label={{ value: 'Score', angle: -90, position: 'insideLeft', style: {fontSize: 9, fill: '#64748b'} }} domain={[0, 1.0]} ticks={[0.0, 0.2, 0.4, 0.6, 0.8, 1.0]} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} label={{ value: 'Loss', angle: 90, position: 'insideRight', style: {fontSize: 9, fill: '#64748b'} }} domain={[0, 1.0]} ticks={[0.0, 0.2, 0.4, 0.6, 0.8, 1.0]} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                <Line yAxisId="left" type="monotone" dataKey="trainR2" stroke="#8B5CF6" strokeWidth={2} dot={{r: 3, fill: '#8B5CF6'}} activeDot={{r: 5}} />
                <Line yAxisId="left" type="monotone" dataKey="valR2" stroke="#3B82F6" strokeWidth={2} dot={{r: 3, fill: '#3B82F6'}} activeDot={{r: 5}} />
                <Line yAxisId="right" type="monotone" dataKey="loss" stroke="#F97316" strokeWidth={2} dot={{r: 3, fill: '#F97316'}} activeDot={{r: 5}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-bold text-slate-900">Feature Importance</h3>
            <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-500 cursor-pointer">
              <span>Top Features</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={10}>
                <CartesianGrid horizontal={false} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#475569', fontWeight: 600}} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltipFeature />} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                  {featureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4C3BDE' : '#8B5CF6'} />
                  ))}
                </Bar>
                {/* Adding labels to the right of bars */}
                {featureData.map((entry, index) => (
                  <text 
                    key={`label-${index}`} 
                    x="100%" 
                    y={index * 50 + 25} // approximate position
                    dx={-20}
                    dy={4}
                    textAnchor="end" 
                    fill="#94a3b8" 
                    fontSize="10px" 
                    fontWeight="600"
                  >
                    {entry.value}%
                  </text>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction with Confidence */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-bold text-slate-900">Prediction with Confidence</h3>
          </div>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600">
              <div className="w-4 h-0.5 bg-[#8B5CF6]"></div>
              <span>Predicted FWHM</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
              <span>Observed</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600">
              <div className="w-3 h-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"></div>
              <span>Confidence Interval</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="iteration" axisLine={{stroke: '#e2e8f0'}} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} label={{ value: 'Iteration', position: 'insideBottom', offset: -5, style: {fontSize: 9, fill: '#64748b'} }} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} label={{ value: 'FWHM (meV)', angle: -90, position: 'insideLeft', style: {fontSize: 9, fill: '#64748b'} }} ticks={[0, 15, 30, 45, 60]} domain={[0, 70]} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                {/* Confidence Interval band */}
                <Area type="monotone" dataKey={['lower', 'upper']} stroke="none" fill="#8B5CF6" fillOpacity={0.1} />
                {/* Predicted Line */}
                <Line type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={1.5} dot={false} activeDot={false} />
                {/* Observed points */}
                <Scatter dataKey="observed" fill="#8B5CF6" shape="circle" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Model Versions Table */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6">
        <h3 className="text-[14px] font-bold text-[#1e1b4b] mb-6">Model Versions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Version</th>
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kernel</th>
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dataset</th>
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">R² Score</th>
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">MAE (meV)</th>
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trained On</th>
                <th className="text-center py-3 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map((model, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-2 flex items-center space-x-2">
                    <span className="text-[13px] font-bold text-slate-800">{model.version}</span>
                    {model.current && (
                      <span className="px-1.5 py-0.5 bg-[#4C3BDE] text-white text-[9px] font-bold rounded">Current</span>
                    )}
                  </td>
                  <td className="py-4 px-2 text-[13px] text-slate-600 font-medium">{model.kernel}</td>
                  <td className="py-4 px-2 text-[13px] text-slate-600">{model.dataset}</td>
                  <td className="py-4 px-2 text-[13px] font-bold text-slate-800">{model.r2}</td>
                  <td className="py-4 px-2 text-[13px] font-bold text-slate-800">{model.mae}</td>
                  <td className="py-4 px-2">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${
                      model.status === 'Active' 
                        ? 'bg-[#E8FFF3] text-[#00B050]' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {model.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-[12px] text-slate-500 font-medium">{model.date}</td>
                  <td className="py-4 px-2">
                    <div className="flex justify-center items-center space-x-2">
                      <button className="p-1.5 text-slate-400 hover:text-[#4C3BDE] hover:bg-[#F4F0FF] rounded-md transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-[12px] font-medium text-slate-500">Showing 1 to 3 of 3 models</span>
        </div>
      </div>
    </div>
  );
};

export default Models;
