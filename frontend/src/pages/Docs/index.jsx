import React, { useState } from 'react';
import {
  BookOpen, Database, Target, LineChart, HelpCircle, UploadCloud,
  Network, Play, CheckCircle2, RotateCcw, BrainCircuit, Activity,
  ClipboardList, FlaskConical, ChevronDown, ChevronUp, FileSpreadsheet,
  ArrowRight, Search, Map, LayoutGrid, Brain, Sparkles
} from 'lucide-react';

// Common Card Component
const Card = ({ icon: Icon, iconColor, bgIconColor, title, className = "", children }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col ${className}`}>
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 ${bgIconColor} ${iconColor} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  </div>
);

// Custom SVG approximations for the Hero Section
const CrystalStructure = () => (
  <div className="relative w-48 h-32 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <g stroke="#94a3b8" strokeWidth="1.5">
        <line x1="20" y1="30" x2="50" y2="15" />
        <line x1="50" y1="15" x2="80" y2="30" />
        <line x1="20" y1="30" x2="20" y2="70" />
        <line x1="80" y1="30" x2="80" y2="70" />
        <line x1="20" y1="70" x2="50" y2="85" />
        <line x1="80" y1="70" x2="50" y2="85" />
        
        <line x1="50" y1="15" x2="50" y2="50" />
        <line x1="20" y1="70" x2="50" y2="50" />
        <line x1="80" y1="70" x2="50" y2="50" />
      </g>
      <g fill="#fbbf24">
        <circle cx="50" cy="15" r="5" />
        <circle cx="20" cy="70" r="5" />
        <circle cx="80" cy="70" r="5" />
      </g>
      <g fill="#60a5fa">
        <circle cx="20" cy="30" r="5" />
        <circle cx="80" cy="30" r="5" />
        <circle cx="50" cy="85" r="5" />
        <circle cx="50" cy="50" r="5" />
      </g>
    </svg>
    <div className="absolute -bottom-4 text-[10px] font-semibold text-slate-500">WS₂ Crystal Structure</div>
  </div>
);

const GaussianProcessHero = () => (
  <div className="relative w-48 h-32 flex items-center justify-center">
    <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-sm">
      <path d="M0,30 Q25,10 50,30 T100,30" fill="none" stroke="#6366f1" strokeWidth="2" />
      <path d="M0,30 Q25,0 50,30 T100,30" fill="#818cf8" opacity="0.2" />
      <path d="M0,30 Q25,20 50,30 T100,30" fill="#818cf8" opacity="0.2" />
      <circle cx="25" cy="20" r="2.5" fill="#1e293b" />
      <circle cx="75" cy="40" r="2.5" fill="#1e293b" />
      <circle cx="50" cy="30" r="2.5" fill="#1e293b" />
    </svg>
    <div className="absolute -top-4 text-[10px] font-semibold text-slate-500">Gaussian Process Model</div>
  </div>
);

const AcquisitionHero = () => (
  <div className="relative w-40 h-32 flex items-center justify-center">
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <path d="M0,50 Q30,50 40,20 T70,50 T100,50" fill="none" stroke="#a855f7" strokeWidth="2" />
      <line x1="60" y1="10" x2="60" y2="50" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="60" cy="30" r="3" fill="#22c55e" />
    </svg>
    <div className="absolute -top-4 text-[10px] font-semibold text-slate-500">Acquisition (EI)</div>
    <div className="absolute top-4 right-0 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">Next Best<br/>Experiment</div>
    <div className="absolute -bottom-4 text-[10px] font-semibold text-slate-500">Search Space</div>
  </div>
);

const AiBeakerHero = () => (
  <div className="relative w-24 h-32 flex items-center justify-center">
    <div className="relative text-indigo-600">
      <FlaskConical size={60} strokeWidth={1.5} />
      <div className="absolute inset-0 flex items-center justify-center mt-4">
        <span className="text-[12px] font-bold text-white bg-indigo-600 px-1.5 rounded">AI</span>
      </div>
    </div>
  </div>
);

const Docs = () => {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    { q: "How many experiments do I need?", a: "Typically, 10-15 initial experiments are enough to seed the Gaussian Process model effectively." },
    { q: "Can I upload Excel files?", a: "Yes, you can upload both .csv and .xlsx files. Ensure the first row has your headers." },
    { q: "Can I edit logged experiments?", a: "Yes, you can edit or delete them from the Experiments tab." },
    { q: "What if values are missing?", a: "The platform requires complete rows for training. Please remove or impute rows with missing values before uploading." },
    { q: "How is the next experiment selected?", a: "We use Expected Improvement (EI) to balance exploring unknown areas and exploiting known good areas." }
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* ── HERO SECTION ──────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Research Platform Documentation</h1>
            <p className="text-slate-500 text-base">Learn how to optimize quantum materials experiments using<br/>Bayesian Optimization and Active Learning.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100">Bayesian Optimization</span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100">Gaussian Processes</span>
            <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-full border border-purple-100">Quantum Materials</span>
            <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full border border-orange-100">Active Learning</span>
            <span className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-semibold rounded-full border border-sky-100">WS₂ CVD</span>
          </div>
        </div>
        
        <div className="hidden xl:flex items-center gap-6 shrink-0 relative">
          <CrystalStructure />
          <ArrowRight className="text-slate-300" />
          <GaussianProcessHero />
          <ArrowRight className="text-slate-300" />
          <AcquisitionHero />
          <ArrowRight className="text-slate-300" />
          <AiBeakerHero />
          
          {/* Legend for GP */}
          <div className="absolute bottom-0 left-[260px] text-[9px] text-slate-500 leading-tight">
            <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-indigo-500"></div> GP Mean</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div> Observations</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-100"></div> Uncertainty</div>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Workflow Overview */}
        <Card icon={Network} iconColor="text-blue-600" bgIconColor="bg-blue-50" title="Workflow Overview" className="lg:col-span-1">
          <div className="flex items-center justify-between mt-4 px-2">
            {[
              { i: UploadCloud, l: 'Upload\nDataset', c: 'text-blue-500' },
              { i: LayoutGrid, l: 'Map\nColumns', c: 'text-indigo-500' },
              { i: Activity, l: 'Train\nGP Model', c: 'text-purple-500' },
              { i: BrainCircuit, l: 'Get Next\nSuggestion', c: 'text-amber-500' },
              { i: FlaskConical, l: 'Run\nExperiment', c: 'text-emerald-500' },
              { i: ClipboardList, l: 'Log\nResult', c: 'text-teal-500' },
              { i: RotateCcw, l: 'Model Updates\nAutomatically', c: 'text-blue-600' }
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 text-center w-12">
                  <step.i className={`${step.c}`} size={20} strokeWidth={1.5} />
                  <span className="text-[9px] font-semibold text-slate-600 leading-tight whitespace-pre-wrap">{step.l}</span>
                </div>
                {idx < arr.length - 1 && <ArrowRight size={12} className="text-slate-300 -mt-6" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-auto pt-8 text-center px-4">
            <p className="text-sm text-slate-500">An iterative cycle where the model learns from your results and continuously suggests the next best experiment.</p>
          </div>
        </Card>

        {/* Dataset Formatting */}
        <Card icon={Database} iconColor="text-emerald-600" bgIconColor="bg-emerald-50" title="Dataset Formatting" className="lg:col-span-1">
          <div className="flex flex-col h-full gap-4">
            <div className="flex gap-4">
              <ul className="flex-1 text-xs text-slate-600 space-y-3">
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Upload your data in CSV or Excel (.csv, .xlsx)</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> First row must contain exact column names</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> No merged cells</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> No empty rows or columns between data</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Numerical values should not contain units (use 150 not 150 °C)</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Categorical variables will be one-hot encoded</li>
              </ul>
              <div className="w-[180px] shrink-0 border border-slate-100 rounded-lg overflow-hidden shadow-sm bg-white self-start">
                <table className="w-full text-[9px] text-center">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <tr><th className="p-1.5">Temperature<br/>(°C)</th><th className="p-1.5">Pressure<br/>(Torr)</th><th className="p-1.5">Time<br/>(min)</th><th className="p-1.5 border-l border-slate-100">PL FWHM<br/>(meV)</th></tr>
                  </thead>
                  <tbody className="text-slate-500">
                    <tr className="border-b border-slate-50"><td className="p-1.5">850</td><td className="p-1.5">10</td><td className="p-1.5">20</td><td className="p-1.5 border-l border-slate-50 font-medium text-slate-700">18.4</td></tr>
                    <tr className="border-b border-slate-50"><td className="p-1.5">900</td><td className="p-1.5">15</td><td className="p-1.5">30</td><td className="p-1.5 border-l border-slate-50 font-medium text-slate-700">16.7</td></tr>
                    <tr><td className="p-1.5">950</td><td className="p-1.5">20</td><td className="p-1.5">25</td><td className="p-1.5 border-l border-slate-50 font-medium text-slate-700">15.1</td></tr>
                    <tr><td colSpan={4} className="p-1 text-slate-300">...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-auto bg-emerald-50 text-emerald-700 text-xs font-semibold py-2 px-4 rounded-lg text-center">
              One row = One experiment
            </div>
          </div>
        </Card>

        {/* Column Mapping */}
        <Card icon={LineChart} iconColor="text-purple-600" bgIconColor="bg-purple-50" title="Column Mapping" className="lg:col-span-1">
          <div className="flex justify-between items-stretch h-full gap-2">
            <div className="flex-1 bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Your Excel Columns</div>
              <div className="space-y-2 text-xs font-medium text-slate-700">
                <div className="p-1.5 bg-white rounded border border-slate-200">Temperature (°C)</div>
                <div className="p-1.5 bg-white rounded border border-slate-200">Pressure (Torr)</div>
                <div className="p-1.5 bg-white rounded border border-slate-200">Ar Flow (sccm)</div>
                <div className="p-1.5 bg-white rounded border border-slate-200">Growth Time (min)</div>
                <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded">PL FWHM (meV)</div>
                <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-400">Notes</div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center items-center gap-6 px-2 text-slate-300">
              <ArrowRight size={14} />
              <ArrowRight size={14} />
              <ArrowRight size={14} />
              <ArrowRight size={14} />
              <ArrowRight size={14} className="text-indigo-400" />
              <ArrowRight size={14} />
            </div>

            <div className="flex-1 bg-slate-50 rounded-lg p-3 flex flex-col gap-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Map to Platform</div>
              
              <div className="flex gap-2">
                <Target size={14} className="text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-700">Feature</div>
                  <div className="text-[9px] text-slate-500 leading-tight">Input parameters you can control.</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <LineChart size={14} className="text-indigo-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-indigo-700">Target (To Optimize)</div>
                  <div className="text-[9px] text-indigo-500/70 leading-tight">Property you want to optimize (e.g., FL FWHM).</div>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <div className="w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 mt-0.5">/</div>
                <div>
                  <div className="text-xs font-bold text-slate-500">Ignore</div>
                  <div className="text-[9px] text-slate-400 leading-tight">Metadata columns not used in training.</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* How BO Works */}
        <Card icon={Brain} iconColor="text-pink-600" bgIconColor="bg-pink-50" title="How Bayesian Optimization Works" className="lg:col-span-1">
          <div className="flex items-center justify-between mt-6 px-2">
            {[
              { i: BookOpen, l: 'Learn', d: 'Model learns from previous experiments.', c: 'text-blue-500' },
              { i: Activity, l: 'Predict', d: 'Predicts outcome across search space.', c: 'text-purple-500' },
              { i: Network, l: 'Uncertainty', d: 'Estimates uncertainty in predictions.', c: 'text-amber-500' },
              { i: Target, l: 'Acquire', d: 'Acquisition function (EI) selects best point.', c: 'text-emerald-500' },
              { i: ArrowRight, l: 'Improve', d: 'Model improves after every new result.', c: 'text-orange-500' }
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 text-center w-14">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-1">
                    <step.i className={`${step.c}`} size={18} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">{step.l}</span>
                  <span className="text-[8px] text-slate-400 leading-tight">{step.d}</span>
                </div>
                {idx < arr.length - 1 && <ArrowRight size={14} className="text-slate-200 -mt-10" />}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* Logging Experiments */}
        <Card icon={ClipboardList} iconColor="text-orange-600" bgIconColor="bg-orange-50" title="Logging Experiments" className="lg:col-span-1">
          <div className="flex items-center justify-between mt-6 px-4">
            {[
              { i: Sparkles, l: 'Suggestion\nGenerated', c: 'text-emerald-500' },
              { i: FlaskConical, l: 'Experiment\nPerformed', c: 'text-blue-500' },
              { i: Activity, l: 'Measure\nPL FWHM', c: 'text-pink-500' },
              { i: ClipboardList, l: 'Log\nResult', c: 'text-purple-500' },
              { i: RotateCcw, l: 'Model Retrains\nAutomatically', c: 'text-blue-600' },
              { i: Sparkles, l: 'New\nSuggestion Ready', c: 'text-emerald-500' }
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 text-center w-12">
                  <step.i className={`${step.c}`} size={20} strokeWidth={1.5} />
                  <span className="text-[9px] font-semibold text-slate-600 leading-tight whitespace-pre-wrap">{step.l}</span>
                </div>
                {idx < arr.length - 1 && <ArrowRight size={12} className="text-slate-300 -mt-6" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-auto pt-6 text-center">
            <p className="text-[13px] text-slate-500 font-medium">Log your experimental results to update the model and get better suggestions.</p>
          </div>
        </Card>

        {/* The Optimization Loop */}
        <Card icon={RotateCcw} iconColor="text-blue-600" bgIconColor="bg-blue-50" title="The Optimization Loop" className="lg:col-span-1">
          <div className="relative h-full w-full flex items-center justify-center mt-4 pb-8">
            <div className="w-56 h-32 relative">
              <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full text-slate-200">
                <path d="M40,60 A60,50 0 1,1 160,60 A60,50 0 1,1 40,60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M40,60 L35,50 L45,50 Z" fill="currentColor" transform="rotate(-30 40 60)" />
                <path d="M160,60 L155,50 L165,50 Z" fill="currentColor" transform="rotate(150 160 60)" />
              </svg>
              
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white p-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><UploadCloud size={14}/></div>
                <span className="text-[9px] font-bold mt-1 text-slate-600 text-center leading-tight">Upload<br/>Data</span>
              </div>
              
              <div className="absolute top-4 right-2 flex flex-col items-center bg-white p-1">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Activity size={14}/></div>
                <span className="text-[9px] font-bold mt-1 text-slate-600 text-center leading-tight">Train<br/>GP Model</span>
              </div>

              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white p-1">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><Brain size={14}/></div>
                <span className="text-[9px] font-bold mt-1 text-slate-600 text-center leading-tight">Get<br/>Suggestion</span>
              </div>

              <div className="absolute bottom-2 right-4 flex flex-col items-center bg-white p-1">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><FlaskConical size={14}/></div>
                <span className="text-[9px] font-bold mt-1 text-slate-600 text-center leading-tight">Run<br/>Experiment</span>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center bg-white p-1">
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center"><ClipboardList size={14}/></div>
                <span className="text-[9px] font-bold mt-1 text-slate-600 text-center leading-tight">Log<br/>Result</span>
              </div>

              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white p-1">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center"><RotateCcw size={14}/></div>
                <span className="text-[9px] font-bold mt-1 text-slate-600 text-center leading-tight">Retrain<br/>Model</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Architecture */}
        <Card icon={Database} iconColor="text-blue-600" bgIconColor="bg-blue-50" title="Platform Architecture" className="lg:col-span-1">
          <div className="flex items-center justify-between mt-6 px-4">
            {[
              { i: Database, l: 'Dataset', c: 'text-blue-500' },
              { i: Network, l: 'Preprocessing', c: 'text-emerald-500' },
              { i: Activity, l: 'Gaussian\nProcess', c: 'text-purple-500' },
              { i: Target, l: 'Expected\nImprovement', c: 'text-amber-500' },
              { i: Sparkles, l: 'Best\nParameters', c: 'text-pink-500' },
              { i: BookOpen, l: 'Researcher /\nLab', c: 'text-slate-500' }
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2 text-center w-12">
                  <step.i className={`${step.c}`} size={20} strokeWidth={1.5} />
                  <span className="text-[9px] font-semibold text-slate-600 leading-tight whitespace-pre-wrap">{step.l}</span>
                </div>
                {idx < arr.length - 1 && <ArrowRight size={12} className="text-slate-300 -mt-6" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-auto pt-8 text-center">
            <p className="text-xs text-slate-500">From your data to intelligent suggestions.</p>
          </div>
        </Card>

        {/* Best Practices */}
        <Card icon={CheckCircle2} iconColor="text-emerald-600" bgIconColor="bg-emerald-50" title="Best Practices" className="lg:col-span-1">
          <div className="flex gap-4 h-full">
            <ul className="flex-1 text-[13px] text-slate-600 space-y-3 font-medium mt-2">
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Upload at least 10 experiments</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Keep units consistent</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Log every experiment</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Don't remove failed experiments</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> More data = better suggestions</li>
            </ul>
            <div className="w-28 shrink-0 bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-end relative overflow-hidden mt-2">
              <div className="w-full flex items-end justify-around h-16 gap-1 opacity-70">
                <div className="w-full bg-slate-200 rounded-t h-[30%]"></div>
                <div className="w-full bg-slate-200 rounded-t h-[50%]"></div>
                <div className="w-full bg-indigo-200 rounded-t h-[80%]"></div>
                <div className="w-full bg-indigo-400 rounded-t h-[60%]"></div>
                <div className="w-full bg-emerald-400 rounded-t h-[100%]"></div>
              </div>
              <div className="absolute bottom-2 right-2 bg-white rounded-full p-0.5 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
            </div>
          </div>
        </Card>

        {/* FAQs */}
        <Card icon={HelpCircle} iconColor="text-indigo-600" bgIconColor="bg-indigo-50" title="FAQs" className="lg:col-span-1">
          <div className="space-y-2 mt-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-0 pb-2">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full text-left flex items-center justify-between py-1 text-[13px] font-semibold text-slate-700 hover:text-indigo-600"
                >
                  {faq.q}
                  {openFaq === idx ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>
                {openFaq === idx && (
                  <p className="text-xs text-slate-500 mt-1 pb-1 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ── FOOTER ──────────────────────────── */}
      <footer className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-inner">
            <Network size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Quantum Materials AI</h3>
            <p className="text-[10px] text-slate-500">Bayesian Optimization for<br/>Materials Discovery</p>
          </div>
        </div>

        <div className="flex items-center gap-8 text-xs">
          <div>
            <div className="font-bold text-slate-900">Version</div>
            <div className="text-slate-500">1.0.0</div>
          </div>
          <div>
            <div className="font-bold text-slate-900">Last Updated</div>
            <div className="text-slate-500">July 20, 2026</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-slate-500 mb-1">Supported by</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-0.5"><img src="/NQM.png" alt="NQM" className="w-full h-full object-contain" /></div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">National<br/>Quantum Mission</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-1"><img src="/DST.png" alt="DST" className="w-full h-full object-contain" /></div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">DST<br/>India</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-slate-100 p-0.5"><img src="/IIT.png" alt="IIT" className="w-full h-full object-contain" /></div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">IIT<br/>Bombay</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-4">
            <a href="#" className="flex items-center gap-1.5 hover:text-indigo-600"><BookOpen size={14} /> Documentation</a>
            <a href="#" className="flex items-center gap-1.5 hover:text-indigo-600"><Map size={14} /> API Reference</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="flex items-center gap-1.5 hover:text-indigo-600"><Network size={14} /> GitHub Repository</a>
            <a href="mailto:support@quantummaterials.ai" className="flex items-center gap-1.5 hover:text-indigo-600"><HelpCircle size={14} /> Contact Support</a>
          </div>
        </div>
        
        <div className="text-[9px] text-slate-400 text-right">
          © 2026 Quantum Materials AI<br/>All rights reserved.
        </div>

      </footer>

    </div>
  );
};

export default Docs;
