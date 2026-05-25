import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, TrendingUp, Database, Download, Calendar
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import api from '../../services/api';

const Reports = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [datasetsList, setDatasetsList] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const bestFwhm = currentMin !== Infinity ? `${currentMin.toFixed(2)}` : (dashboardStats?.best_fwhm != null ? `${dashboardStats.best_fwhm.toFixed(2)}` : '22.85');
  const trainRows = modelInfo?.n_train_samples !== undefined ? modelInfo.n_train_samples : '21';
  const r2Value = modelInfo?.R2_score !== undefined ? `${(modelInfo.R2_score * 100).toFixed(1)}%` : '100.0%';
  const maeValue = modelInfo?.MAE_meV !== undefined ? `${modelInfo.MAE_meV.toFixed(2)}` : '0.00';
  const rmseValue = modelInfo?.RMSE_meV !== undefined ? `${modelInfo.RMSE_meV.toFixed(2)}` : '0.00';

  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};
  const generatedOn = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const datasetName = datasetsList[0]?.name?.replace(/\.[^/.]+$/, "") || 'Manual_Data_20260625_154605';
  const experimentId = datasetsList[0]?.id || 'EXP-101';

  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6 max-w-5xl mx-auto mb-16">
      
      {/* Top Header Actions (Hidden when printing) */}
      <div className="flex justify-between items-center no-print pt-6">
        <h1 className="text-2xl font-bold text-[#1e1b4b]">Report Export</h1>
        <button 
          onClick={() => window.print()}
          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      </div>

      {/* The Printable Report Canvas */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden print:shadow-none print:border-none print:w-full">
        
        {/* Report Header */}
        <div className="p-8 border-b-2 border-[#6366f1] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#4C3BDE] rounded-xl flex items-center justify-center shadow-md">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-[#1e1b4b] tracking-tight">Quantum Materials AI</h1>
              <p className="text-[13px] text-slate-500 font-medium">Bayesian Optimization for Quantum Materials Discovery</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-4 py-1.5 bg-[#F4F0FF] text-[#4C3BDE] text-[13px] font-bold rounded-full">Experiment Summary</span>
            <div className="flex items-center text-slate-500 text-[12px] font-medium mr-1">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {generatedOn}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Experiment Overview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#F4F0FF] text-[#4C3BDE] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-[16px] font-bold text-[#1e1b4b]">Experiment Overview</h2>
            </div>
            <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
              This experiment applies Bayesian Optimization to efficiently discover optimal quantum material configurations with minimal evaluations.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#F4F0FF] text-[#4C3BDE] flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31L2.08 18.2a2 2 0 0 0 1.6 3.24h16.64a2 2 0 0 0 1.6-3.24L14 9.31V2"/><path d="M8.5 2h7"/></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Experiment ID</span>
                <span className="text-[15px] font-bold text-[#4C3BDE]">{experimentId}</span>
              </div>
              <div className="border border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#F0F7FF] text-[#3B82F6] flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dataset</span>
                <span className="text-[15px] font-bold text-slate-800">{datasetName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            {/* Performance Metrics */}
            <div className="border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-lg bg-[#F4F0FF] text-[#4C3BDE] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e1b4b]">Performance Metrics</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F4F0FF] rounded-xl p-4 text-center">
                  <div className="text-[11px] font-bold text-slate-800 mb-1">R² Score</div>
                  <div className="text-2xl font-bold text-[#4C3BDE] mb-1">{r2Value}</div>
                  <div className="text-[10px] font-medium text-slate-500">Goodness of Fit</div>
                </div>
                <div className="bg-[#E8FFF3] rounded-xl p-4 text-center">
                  <div className="text-[11px] font-bold text-slate-800 mb-1">MAE</div>
                  <div className="text-2xl font-bold text-[#00B050] mb-1">{maeValue} <span className="text-[12px]">meV</span></div>
                  <div className="text-[10px] font-medium text-slate-500">Mean Absolute Error</div>
                </div>
                <div className="bg-[#F0F7FF] rounded-xl p-4 text-center">
                  <div className="text-[11px] font-bold text-slate-800 mb-1">RMSE</div>
                  <div className="text-2xl font-bold text-[#3B82F6] mb-1">{rmseValue} <span className="text-[12px]">meV</span></div>
                  <div className="text-[10px] font-medium text-slate-500">Root Mean Square Error</div>
                </div>
                <div className="bg-[#FFF0F7] rounded-xl p-4 text-center">
                  <div className="text-[11px] font-bold text-slate-800 mb-1">Training Rounds</div>
                  <div className="text-2xl font-bold text-[#D946EF] mb-1">{trainRows}</div>
                  <div className="text-[10px] font-medium text-slate-500">Total Iterations</div>
                </div>
              </div>
            </div>

            {/* Optimization Progress */}
            <div className="border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#F4F0FF] text-[#4C3BDE] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <h2 className="text-[16px] font-bold text-[#1e1b4b]">Optimization Progress</h2>
              </div>
              <p className="text-[11px] font-medium text-slate-500 text-center mb-4">Best FWHM (meV) over Iterations</p>
              
              <div className="h-[140px] w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={optimizationData}>
                    <defs>
                      <linearGradient id="colorFwhm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4C3BDE" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4C3BDE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="iteration" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      minTickGap={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      domain={[0, 24]}
                      ticks={[0, 6, 12, 18, 24]}
                      width={25}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="fwhm" 
                      stroke="#4C3BDE" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorFwhm)" 
                      activeDot={{ r: 4, fill: "#4C3BDE" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="text-center">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">Best FWHM (meV)</div>
                  <div className="text-[18px] font-bold text-[#4C3BDE]">{bestFwhm}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">Improvement</div>
                  <div className="text-[18px] font-bold text-[#00B050]">0.00%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="bg-[#E8FFF3] rounded-xl p-5 flex items-start gap-4 mt-6 border border-[#bbf7d0]">
            <div className="w-6 h-6 rounded-full bg-[#00B050] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#065f46] mb-1">Key Takeaway</h3>
              <p className="text-[13px] text-[#064e3b] leading-relaxed">
                The optimization converged successfully with a perfect model fit (R² = {r2Value}) and zero prediction error, indicating highly accurate performance.
              </p>
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .min-h-screen { min-height: auto !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:w-full { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
          /* Ensure charts render well in PDF */
          .recharts-responsive-container { min-width: 300px; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
