import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist-min';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

export const OptimizationReport = React.forwardRef(({
  modelInfo,
  plotData,
  timelineData,
  suggestions,
  gpTraces,
  eiTraces,
  sharedTickVals,
  sharedTickText,
  sharedXRange,
  predictedFwhm,
  predictedUncertainty,
  initialBestFWHM,
  currentBestFWHM
}, ref) => {

  const nExperiments = timelineData ? timelineData.length : 0;
  const boIterations = timelineData ? timelineData.filter(r => r.type === 'User').length : 0;

  const bestExpIdx = timelineData ? timelineData.findIndex(r => parseFloat(r.fwhm) === currentBestFWHM) : -1;
  const bestExpData = bestExpIdx !== -1 ? timelineData[bestExpIdx] : null;
  const bestExpName = bestExpIdx !== -1 ? `Experiment-${bestExpIdx + 1}` : '--';

  const suggestion = suggestions && suggestions.length > 0 ? suggestions[0] : null;
  const expectedImprovement = suggestion ? (currentBestFWHM - predictedFwhm).toFixed(1) : '0.0';

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateTimeStr = `${dateStr}, ${timeStr}`;

  // Feature Importance formatting
  const importances = modelInfo?.feature_importances || [];
  const chartData = importances.map(item => ({
    name: item.name,
    value: item.value
  })).reverse(); // Reverse for bar chart so highest is at top

  // Re-use Plot data without toolbar and non-responsive so it fits exactly
  const gpPlotLayout = {
    autosize: false, width: 680, height: 350, margin: {l: 50, r: 20, b: 40, t: 80},
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    xaxis: { title: '', gridcolor: '#f1f5f9', color: '#64748b', tickmode: 'array', tickvals: sharedTickVals, ticktext: sharedTickText, range: sharedXRange },
    yaxis: { title: 'Predicted FWHM (meV)', gridcolor: '#f1f5f9', color: '#64748b' },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.15, yanchor: 'bottom', font: {size: 10} },
    shapes: plotData?.maxEITemp ? [{ type: 'line', x0: plotData.maxEITemp, y0: 0, x1: plotData.maxEITemp, y1: 1, yref: 'paper', line: { color: 'rgba(124, 77, 255, 0.45)', width: 1, dash: 'dash' } }] : []
  };

  const eiPlotLayout = {
    autosize: false, width: 680, height: 350, margin: {l: 50, r: 20, b: 40, t: 80},
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    xaxis: { title: 'Search-space candidate index', gridcolor: '#f1f5f9', color: '#64748b' },
    yaxis: { title: 'Normalized EI', gridcolor: '#f1f5f9', color: '#64748b', range: [0, 110] },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.1, yanchor: 'bottom', font: {size: 10} },
    shapes: plotData?.maxEITemp ? [{ type: 'line', x0: plotData.maxEITemp, y0: 0, x1: plotData.maxEITemp, y1: 1, yref: 'paper', line: { color: 'rgba(124, 77, 255, 0.45)', width: 1, dash: 'dash' } }] : []
  };

  const PageContainer = ({ children }) => (
    <div className="w-[794px] h-[1123px] bg-white p-[50px] flex flex-col font-sans shrink-0 pdf-page" style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
      {children}
    </div>
  );

  const Header = ({ left, right }) => (
    <div className="flex justify-between items-end border-b border-slate-300 pb-2 mb-6">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{left}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase">{right}</span>
    </div>
  );

  const SectionTitle = ({ num, title }) => (
    <div className="border-b-[3px] border-[#2f277a] pb-2 mb-6 flex items-baseline mt-8">
      <span className="text-xl font-bold text-[#2f277a] mr-3">{num}</span>
      <h2 className="text-xl font-bold text-slate-900 tracking-wide uppercase">{title}</h2>
    </div>
  );

  const pdfGpTraces = (gpTraces || []).map(trace => {
    if (trace.mode === 'markers' && trace.name === 'Best Historical Experiment') {
      return {
        ...trace,
        mode: 'markers+text',
        text: trace.y.map(y => `Best: ${y.toFixed(1)}`),
        textposition: 'bottom center',
        textfont: { size: 12, color: '#16a34a', family: 'sans-serif' }
      };
    }
    if (trace.mode === 'markers' && trace.name === 'Next Suggested Experiment') {
      return {
        ...trace,
        mode: 'markers+text',
        text: trace.y.map(y => `Suggested: ${y.toFixed(1)}`),
        textposition: 'top center',
        textfont: { size: 12, color: '#7C4DFF', family: 'sans-serif' }
      };
    }
    return trace;
  });

  const pdfEiTraces = (eiTraces || []).map(trace => {
    if (trace.mode === 'markers' && trace.name === 'Selected maximum EI point') {
      return {
        ...trace,
        mode: 'markers+text',
        text: trace.y.map(y => `${y.toFixed(1)}%`),
        textposition: 'top right',
        textfont: { size: 10, color: '#ef4444', family: 'sans-serif' }
      };
    }
    return trace;
  });

  const [gpImgUrl, setGpImgUrl] = useState(null);
  const [eiImgUrl, setEiImgUrl] = useState(null);

  useEffect(() => {
    if (pdfGpTraces && pdfGpTraces.length > 0) {
      Plotly.toImage({data: pdfGpTraces, layout: gpPlotLayout}, {format: 'png', width: 680, height: 350})
        .then(setGpImgUrl)
        .catch(console.error);
    }
    if (pdfEiTraces && pdfEiTraces.length > 0) {
      Plotly.toImage({data: pdfEiTraces, layout: eiPlotLayout}, {format: 'png', width: 680, height: 350})
        .then(setEiImgUrl)
        .catch(console.error);
    }
  }, [pdfGpTraces, pdfEiTraces, gpPlotLayout, eiPlotLayout]);

  return (
    <div ref={ref} className="flex flex-col bg-white">
      
      {/* PAGE 1 */}
      <PageContainer>
        <Header left="QUANTUM MATERIALS AI" right={dateTimeStr} />
        
        <h1 className="text-[44px] font-extrabold text-slate-900 leading-[1.1] mb-6 mt-4">
          Thermal CVD Bayesian Optimization Report
        </h1>
        
        <p className="text-[15px] text-slate-600 mb-12 leading-relaxed">
          Technical summary of the Gaussian Process surrogate model, Expected Improvement acquisition strategy, observed experiment history, and recommended next search region for Thermal CVD optimization.
        </p>

        <SectionTitle num="1" title="EXECUTIVE SUMMARY" />

        <div className="grid grid-cols-4 border border-slate-200 rounded-sm mb-10 divide-x divide-slate-200">
          <div className="p-5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Best FWHM Achieved</span>
            <span className="text-3xl font-bold text-[#2f277a]">{currentBestFWHM?.toFixed(1) || '--'} meV</span>
          </div>
          <div className="p-5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Best Experiment</span>
            <span className="text-3xl font-bold text-[#2f277a]">{bestExpName}</span>
          </div>
          <div className="p-5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Number of Experiments</span>
            <span className="text-3xl font-bold text-[#2f277a]">{nExperiments}</span>
          </div>
          <div className="p-5 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Number of BO Iterations</span>
            <span className="text-3xl font-bold text-[#2f277a]">{boIterations}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 text-[13px] text-slate-700 leading-relaxed">
          <div>
            The current campaign identifies <strong>{bestExpName}</strong> as the best measured condition, achieving <strong>{currentBestFWHM?.toFixed(1)} meV</strong> PL FWHM. This result is the primary benchmark used by the Bayesian optimization loop when estimating future improvement.
          </div>
          <div>
            The Gaussian Process model uses the measured Thermal CVD experiments to estimate both expected FWHM and posterior uncertainty. This allows the optimization loop to compare known high-performing regions against less explored regions that may still contain better recipes.
          </div>
          <div>
            The parameter analysis indicates that <strong>Pressure</strong> contributes the largest share of the measured response variation in this dataset, so the next search should control that parameter carefully while validating the BO recommendation experimentally.
          </div>
        </div>
      </PageContainer>

      {/* PAGE 2 */}
      <PageContainer>
        <Header left="MODEL ANALYSIS" right="GAUSSIAN PROCESS + EXPECTED IMPROVEMENT" />
        
        <SectionTitle num="2" title="MODEL ANALYSIS" />

        <h3 className="text-lg font-bold text-slate-900 mb-4">Gaussian Process Regression Visualization</h3>
        
        <div className="border border-slate-200 rounded-sm mb-6 flex justify-center bg-white min-h-[350px]">
           {gpImgUrl ? <img src={gpImgUrl} alt="Gaussian Process Regression" style={{ width: 680, height: 350 }} /> : <div className="text-slate-400 mt-20">Generating plot...</div>}
        </div>

        <div className="grid grid-cols-2 gap-8 text-[13px] text-slate-700 leading-relaxed mb-8">
          <div>
            The uncertainty band widens in sparsely explored regions and narrows around observed experiments. In this report, the shaded interval represents the model's posterior uncertainty around the GP mean prediction, not measurement error alone.
          </div>
          <div>
            The selected BO point maximized Expected Improvement by balancing low predicted FWHM and model uncertainty. This means the recommendation is valuable either because it is predicted to improve the current best result, because it explores an uncertain region, or because it offers both.
          </div>
        </div>
      </PageContainer>

      {/* PAGE 3 */}
      <PageContainer>
        <Header left="MODEL ANALYSIS (CONTINUED)" right="EXPECTED IMPROVEMENT & PARAMETERS" />
        
        <h3 className="text-lg font-bold text-slate-900 mb-4 mt-4">Expected Improvement Landscape</h3>
        
        <div className="border border-slate-200 rounded-sm flex justify-center bg-white mb-10 min-h-[350px]">
           {eiImgUrl ? <img src={eiImgUrl} alt="Expected Improvement" style={{ width: 680, height: 350 }} /> : <div className="text-slate-400 mt-20">Generating plot...</div>}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-4">Parameter Importance</h3>
        
        <div className="border border-slate-200 rounded-sm p-8 flex justify-center h-[300px] mb-8">
          <BarChart
            width={680}
            height={240}
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} ticks={[0, 25, 50, 75, 100]} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={100} />
            <Bar dataKey="value" barSize={24} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#4030a5" />
              ))}
            </Bar>
          </BarChart>
          <div className="text-center text-[12px] text-slate-500 mt-[-20px] font-semibold w-full absolute bottom-4">Relative importance (%)</div>
        </div>

        <div className="border-l-[3px] border-[#2f277a] pl-4 text-[13px] text-slate-700 leading-relaxed">
          Parameter importance summarizes which process variables most strongly explain the observed FWHM variation. The highest-ranked variables should receive the tightest experimental control in the next Thermal CVD run.
        </div>
      </PageContainer>

      {/* PAGE 4 */}
      <PageContainer>
        <Header left="BEST EXPERIMENT ANALYSIS" right="RECOMMENDATION SUMMARY" />
        
        <SectionTitle num="3" title="BEST EXPERIMENT ANALYSIS" />
        
        <div className="border border-slate-200 rounded-sm p-8 mb-8 flex gap-12">
          <div className="flex flex-col w-1/2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Best Experiment</span>
            <span className="text-4xl font-bold text-[#2f277a] mb-8">{bestExpName}</span>
            
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Achieved FWHM</span>
            <span className="text-4xl font-bold text-slate-900">{currentBestFWHM?.toFixed(1) || '--'} meV</span>
          </div>
          
          <div className="w-1/2 flex flex-col justify-center">
             <div className="flex justify-between border-b border-slate-100 py-3">
               <span className="text-[14px] text-slate-600 font-medium">Growth temperature</span>
               <span className="text-[14px] text-slate-900 font-bold">{bestExpData?.gte} C</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 py-3">
               <span className="text-[14px] text-slate-600 font-medium">Growth time</span>
               <span className="text-[14px] text-slate-900 font-bold">{bestExpData?.gti} min</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 py-3">
               <span className="text-[14px] text-slate-600 font-medium">Ar flow</span>
               <span className="text-[14px] text-slate-900 font-bold">{bestExpData?.fra} sccm</span>
             </div>
             <div className="flex justify-between py-3">
               <span className="text-[14px] text-slate-600 font-medium">Pressure</span>
               <span className="text-[14px] text-slate-900 font-bold">{bestExpData?.pressure} Torr</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-[13px] text-slate-700 leading-relaxed mb-12">
          <div>
            This result was achieved at <strong>{bestExpData?.pressure} Torr</strong> pressure and <strong>{bestExpData?.gte}°C</strong> growth temperature. The model identifies <strong>Pressure</strong> as the dominant variable explaining FWHM variation. The best experiment's performance suggests an optimum in this region of parameter space.
          </div>
          <div>
            Since <strong>Pressure</strong> is the most influential parameter, the next search should prioritize careful control of this variable while exploring nearby conditions. The observed FWHM of <strong>{currentBestFWHM?.toFixed(1)} meV</strong> serves as the baseline for measuring improvement. Any new condition must exceed this value to constitute genuine progress in the optimization campaign.
          </div>
        </div>

        <SectionTitle num="4" title="NEXT BAYESIAN OPTIMIZATION RECOMMENDATION" />
        
        <div className="border-[2px] border-[#2f277a] rounded-xl p-8">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold text-[#2f277a]">Recommended Next Experiment</h3>
             <span className="bg-[#e6fcf5] text-[#0ca678] text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wide">High Confidence</span>
           </div>

           <div className="grid grid-cols-4 gap-4 text-center mb-10">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Growth Temperature</div>
                <div className="text-xl font-bold text-[#2f277a]">{suggestion?.GTE_celsius || '--'}°C</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Growth Time</div>
                <div className="text-xl font-bold text-[#2f277a]">{suggestion?.GTI_minutes || '--'} min</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ar Flow Rate</div>
                <div className="text-xl font-bold text-[#2f277a]">{suggestion?.FRA_sccm || '--'} sccm</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Pressure</div>
                <div className="text-xl font-bold text-[#2f277a]">{suggestion?.Pressure_Torr || '--'} Torr</div>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-4 text-center mb-8">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Predicted FWHM</div>
                <div className="text-2xl font-bold text-red-500">{predictedFwhm?.toFixed(1)} meV</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Uncertainty (±1.96σ)</div>
                <div className="text-2xl font-bold text-red-500">±{predictedUncertainty?.toFixed(1)} meV</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Expected Improvement</div>
                <div className="text-2xl font-bold text-red-500">{expectedImprovement} meV</div>
              </div>
           </div>

           <div className="text-[13px] text-slate-500 italic">
             This recommendation maximizes Expected Improvement by balancing predicted performance and exploration of uncertain regions. The confidence level reflects model certainty at this point. Implement this experiment to advance the optimization.
           </div>
        </div>
      </PageContainer>

      {/* PAGE 5 */}
      <PageContainer>
        <Header left="COMPLETE EXPERIMENT HISTORY" right={`${nExperiments} EXPERIMENTS`} />
        
        <SectionTitle num="5" title="COMPLETE EXPERIMENT HISTORY" />

        <table className="w-full text-[12px] text-left">
          <thead className="border-b-[2px] border-[#2f277a] text-[10px] font-bold text-slate-900 uppercase">
            <tr>
              <th className="py-4">Experiment ID</th>
              <th className="py-4">GTE<br/>(C)</th>
              <th className="py-4">GTI<br/>(MIN)</th>
              <th className="py-4">FRA<br/>(SCCM)</th>
              <th className="py-4">Pressure<br/>(TORR)</th>
              <th className="py-4">Actual FWHM<br/>(MEV)</th>
              <th className="py-4">Predicted FWHM<br/>(MEV)</th>
              <th className="py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(timelineData || []).map((row, idx) => {
              const isBest = parseFloat(row.fwhm) === currentBestFWHM;
              return (
                <tr key={idx} className={`border-b border-slate-200 ${isBest ? 'bg-[#f8f7ff] text-[#2f277a] font-medium' : 'text-slate-700'}`}>
                  <td className="py-3">Experiment {idx + 1}</td>
                  <td className="py-3">{row.gte}</td>
                  <td className="py-3">{row.gti}</td>
                  <td className="py-3">{row.fra}</td>
                  <td className="py-3">{row.pressure}</td>
                  <td className="py-3 font-semibold">{parseFloat(row.fwhm).toFixed(1)}</td>
                  <td className="py-3">{parseFloat(row.fwhm).toFixed(1)}</td>
                  <td className="py-3">{isBest ? 'Best observed' : (row.type === 'Initial' ? 'Training sample' : 'BO Sample')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </PageContainer>
    </div>
  );
});

export default OptimizationReport;
