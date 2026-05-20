import React, { useState, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';

const Variables = () => {
  const [activeTab, setActiveTab] = useState('numerical');
  const [distData, setDistData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6'];

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const data = await api.fetchVariablesDistribution();
      if (data && (data.numerical?.length || data.categorical?.length)) {
        setDistData(data);
      }
    } catch (e) {
      console.error("Error fetching variable distributions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributions();
  }, []);

  const numericalData = distData?.numerical?.length ? distData.numerical : [];
  const categoricalData = distData?.categorical?.length ? distData.categorical : [];

  return (
    <div className="animate-fade-in flex flex-col h-full bg-[#F5F6FA] min-h-screen">
      <div className="bg-[#1e1b4b] text-white px-4 py-2 rounded-t-lg rounded-br-lg inline-block mb-6 shadow-sm self-start">
        <h2 className="text-[13px] font-bold tracking-wide">4. Graphical Representation of Numerical & Categorical Constants</h2>
      </div>
      
      <div className="mb-6 flex space-x-6 border-b border-slate-200 w-full">
        <button 
          onClick={() => setActiveTab('numerical')}
          className={`px-1 py-2 border-b-2 font-bold text-[13px] transition-colors ${
            activeTab === 'numerical' ? 'border-[#4C3BDE] text-[#4C3BDE]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Numerical Constants & Variables
        </button>
        <button 
          onClick={() => setActiveTab('categorical')}
          className={`px-1 py-2 border-b-2 font-bold text-[13px] transition-colors ${
            activeTab === 'categorical' ? 'border-[#4C3BDE] text-[#4C3BDE]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Categorical Constants
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#4C3BDE] mb-2" />
          <span className="text-[13px] font-medium">Loading distribution details...</span>
        </div>
      ) : (
        <div className="flex-1 pb-10">
          {activeTab === 'numerical' ? (
            <>
              <h3 className="font-bold text-slate-900 text-[14px]">Numerical Constants & Variables Distribution</h3>
              <p className="text-[11px] text-slate-500 mb-4">Binned distributions of numerical variables swept by BO and process constants.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {numericalData.map((chart, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <p className="text-[12px] font-bold text-slate-800 mb-4 text-center truncate">{chart.title}</p>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                          <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fontSize: 9, fill: '#64748b'} }} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                          <Bar dataKey="value" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#F8F6FF] rounded-lg p-3 flex items-center mb-8 border border-[#EBE5FF]">
                <Info className="w-4 h-4 text-[#4C3BDE] mr-3 flex-shrink-0" />
                <span className="text-[12px] text-[#4C3BDE] font-medium">These distributions represent physical configurations and constraints loaded in the current optimizer state.</span>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-slate-900 text-[14px]">Categorical Constants Overview</h3>
              <p className="text-[11px] text-slate-500 mb-4">Breakdown of categorical parameters and experimental configuration classes.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categoricalData.map((cat, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative h-[160px]">
                    <p className="text-[11px] font-bold text-slate-800 truncate mb-0.5">{cat.title}</p>
                    <p className="text-[10px] text-[#4C3BDE] font-semibold mb-3">{cat.categories} Categories</p>
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex-1 space-y-1.5 pr-2 overflow-hidden">
                        {cat.items.map((entry, index) => (
                          <div key={index} className="text-[9px] text-slate-600 truncate flex justify-between items-center" title={entry.name}>
                            <span className="font-semibold text-slate-700">{entry.name}</span>
                            <span className="text-slate-400">({entry.value})</span>
                          </div>
                        ))}
                      </div>
                      <div className="w-16 h-16 flex-shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={cat.items}
                              cx="50%"
                              cy="50%"
                              innerRadius={18}
                              outerRadius={30}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {cat.items.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-4 text-[9px] font-bold text-slate-700">
                      Total: {cat.total}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Variables;
