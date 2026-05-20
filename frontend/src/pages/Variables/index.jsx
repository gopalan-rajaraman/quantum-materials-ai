import React from 'react';
import { Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const Variables = () => {
  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6'];

  const numericalData = [
    { title: 'Temperature (°C)', data: [{name: '20-40', value: 15}, {name: '40-60', value: 22}, {name: '60-80', value: 35}, {name: '80-100', value: 20}, {name: '100-120', value: 10}] },
    { title: 'Time (min)', data: [{name: '0-10', value: 8}, {name: '10-20', value: 30}, {name: '20-30', value: 12}, {name: '30-40', value: 15}, {name: '40-50', value: 14}, {name: '50-60', value: 5}] },
    { title: 'Concentration (M)', data: [{name: '0-0.05', value: 10}, {name: '0.05-0.1', value: 20}, {name: '0.1-0.15', value: 32}, {name: '0.15-0.2', value: 25}, {name: '0.2-0.25', value: 15}, {name: '0.25-0.3', value: 5}] },
    { title: 'Annealing Temperature (°C)', data: [{name: '40-60', value: 10}, {name: '60-80', value: 20}, {name: '80-100', value: 30}, {name: '100-120', value: 25}, {name: '120-140', value: 20}, {name: '140-160', value: 10}, {name: '160-180', value: 5}] },
    { title: 'Annealing Time (min)', data: [{name: '0-10', value: 15}, {name: '10-20', value: 25}, {name: '20-30', value: 20}, {name: '30-40', value: 15}, {name: '40-50', value: 12}, {name: '50-60', value: 10}] },
    { title: 'Power (W)', data: [{name: '10-20', value: 5}, {name: '20-30', value: 12}, {name: '30-40', value: 35}, {name: '40-50', value: 18}, {name: '50-60', value: 8}, {name: '60-70', value: 2}] },
  ];

  const categoricalData = [
    { title: 'Material Type', categories: 3, items: [{name: 'Perovskite', value: 8}, {name: 'Quantum Dot', value: 6}, {name: 'Organic', value: 4}], total: 18 },
    { title: 'Substrate Type', categories: 4, items: [{name: 'Glass', value: 6}, {name: 'SiO2', value: 5}, {name: 'ITO', value: 4}, {name: 'PET', value: 3}], total: 18 },
    { title: 'Dopant Type', categories: 3, items: [{name: 'X', value: 7}, {name: 'Y', value: 6}, {name: 'Z', value: 5}], total: 18 },
    { title: 'Annealing Ambient', categories: 2, items: [{name: 'N2', value: 12}, {name: 'Air', value: 6}], total: 18 },
  ];

  return (
    <div className="animate-fade-in flex flex-col h-full bg-[#F5F6FA] min-h-screen">
      <div className="bg-[#1e1b4b] text-white px-4 py-2 rounded-t-lg rounded-br-lg inline-block mb-6 shadow-sm self-start">
        <h2 className="text-[13px] font-bold tracking-wide">4. Graphical Representation of Numerical & Categorical Constants</h2>
      </div>
      
      <div className="mb-6 flex space-x-6 border-b border-slate-200 w-full">
        <button className="px-1 py-2 border-b-2 border-[#4C3BDE] text-[#4C3BDE] font-bold text-[13px]">
          Numerical Constants
        </button>
        <button className="px-1 py-2 border-b-2 border-transparent text-slate-500 font-semibold text-[13px]">
          Categorical Constants
        </button>
      </div>

      <div className="flex-1 pb-10">
        <h3 className="font-bold text-slate-900 text-[14px]">Numerical Constants Distribution</h3>
        <p className="text-[11px] text-slate-500 mb-4">Distributions of numerical constants extracted from your template.</p>
        
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
                    <Bar dataKey="value" fill="#9f7aea" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#F8F6FF] rounded-lg p-3 flex items-center mb-8 border border-[#EBE5FF]">
          <Info className="w-4 h-4 text-[#4C3BDE] mr-3 flex-shrink-0" />
          <span className="text-[12px] text-[#4C3BDE] font-medium">These distributions will help the BO model understand the search space better.</span>
        </div>

        <h3 className="font-bold text-slate-900 text-[14px]">Categorical Constants Overview</h3>
        <p className="text-[11px] text-slate-500 mb-4">Breakdown of categorical constants and their categories.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoricalData.map((cat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative h-[140px]">
              <p className="text-[11px] font-bold text-slate-800 truncate mb-0.5">{cat.title}</p>
              <p className="text-[10px] text-[#4C3BDE] font-semibold mb-3">{cat.categories} Categories</p>
              <div className="flex-1 flex items-center justify-between">
                <div className="flex-1 space-y-1.5 pr-2">
                  {cat.items.map((entry, index) => (
                    <div key={index} className="text-[9px] text-slate-600 truncate" title={entry.name}>
                      {entry.name}
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
      </div>
    </div>
  );
};

export default Variables;
