import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Lock, CheckCircle2, ChevronRight, BarChart2, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const Upload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Mock data for charts
  const numericalData = [
    { name: '10-20', value: 4 },
    { name: '20-30', value: 8 },
    { name: '30-40', value: 12 },
    { name: '40-50', value: 6 },
    { name: '50-60', value: 2 }
  ];
  
  const categoricalData = [
    { name: 'Perovskite', value: 10 },
    { name: 'Quantum Dot', value: 5 },
    { name: 'Organic', value: 3 }
  ];
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const StepsSidebar = () => {
    const steps = [
      { id: 1, name: 'Upload Template' },
      { id: 2, name: 'Review Data' },
      { id: 3, name: 'Extract Variables' },
      { id: 4, name: 'Confirm & Lock' }
    ];

    return (
      <div className="w-64 flex-shrink-0 pr-8 border-r border-slate-200 hidden md:block">
        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${step === s.id ? 'bg-indigo-600 text-white' : 
                  step > s.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`ml-3 text-sm font-medium ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      
      {isLocked ? (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-12 shadow-xl text-center border border-slate-100 mt-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Dataset Registered Successfully!</h2>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto">
            You can now start the BO Loop. After each experimental run, enter the PL FWHM result to let the model learn and suggest the next best experiment.
          </p>

          <div className="grid grid-cols-2 gap-8 text-left mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Dataset Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Dataset Name</span><span className="font-medium">Perovskite_PL_Study</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Experiment ID Range</span><span className="font-medium">EXP-001 to EXP-018</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Experiments</span><span className="font-medium">18</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Variables (To Vary)</span><span className="font-medium">8</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">Locked</span></div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">What's Next?</h3>
              <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
                <li>Start the BO Loop</li>
                <li>Run experiments as suggested</li>
                <li>Enter PL FWHM results</li>
                <li>Model learns and optimizes</li>
                <li>View results after convergence</li>
              </ol>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start text-left mb-10">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
              <span className="text-indigo-600 font-bold text-xs">i</span>
            </div>
            <div>
              <p className="font-bold text-indigo-900 mb-1">BO Loop includes Active Learning</p>
              <p className="text-sm text-indigo-700">The model will optimize itself after each experimental run based on your feedback (PL FWHM result) and suggest the next best experiment.</p>
            </div>
          </div>

          <button onClick={() => navigate('/optimization')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center mx-auto space-x-2">
            <span>Go to BO Loop</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex min-h-[600px]">
          <StepsSidebar />
          
          <div className="flex-1 md:pl-8">
            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Upload Excel Template</h2>
                <p className="text-slate-500 mb-8">Upload your experiment template to extract variables.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div 
                    className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all ${
                      dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  >
                    <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-900 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-slate-500 text-sm mb-6">Excel files only (.xlsx, .xls)</p>
                    <button onClick={() => fileInputRef.current.click()} className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm">
                      Select File
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => { if(e.target.files.length) setFile(e.target.files[0]) }} />
                    
                    {file && (
                      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center space-x-3 w-full text-left">
                        <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {file && (
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8">
                      <h3 className="font-bold text-slate-900 mb-6">Template Preview</h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Experiments Found</span><span className="font-bold text-slate-900">18</span></div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Numerical Constants</span><span className="font-bold text-slate-900">12</span></div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Categorical Constants</span><span className="font-bold text-slate-900">6</span></div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Variables (To Vary)</span><span className="font-bold text-slate-900">8</span></div>
                        <div className="flex justify-between items-center py-2"><span className="text-slate-500">Minimum Runs Required</span><span className="font-bold text-slate-900">10</span></div>
                      </div>
                      <button onClick={() => setStep(2)} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg">
                        Review Data
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Graphical Representation of Numerical & Categorical Constants</h2>
                
                <div className="mb-6 flex space-x-4 border-b border-slate-200">
                  <button className="px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 font-medium">Numerical Constants</button>
                  <button className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700">Categorical Constants</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <p className="text-sm font-semibold text-slate-700 mb-4 text-center">Variable {i}</p>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={numericalData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-auto pt-8 border-t border-slate-200">
                  <button onClick={() => setStep(1)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200">Back</button>
                  <button onClick={() => setStep(3)} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in flex flex-col h-full">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Define Variables (To Vary)</h2>
                <p className="text-slate-500 mb-8">Select the variables that will vary during experiments.</p>
                
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Select Variables</h3>
                    <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                      {['Temperature (°C)', 'Time (min)', 'Material Type', 'Concentration (M)', 'Solvent Type', 'Annealing Temperature (°C)', 'Annealing Time (min)', 'Power (W)', 'Dopant Type'].map((v, i) => (
                        <label key={i} className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" defaultChecked={i % 2 === 0} />
                          <span className="text-sm font-medium text-slate-700">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-[400px] overflow-y-auto">
                    <div className="space-y-6">
                      {/* Form for selected variables */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 font-semibold text-sm text-slate-900">Temperature (°C)</div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Min</label>
                          <input type="number" defaultValue="20" className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Max</label>
                          <input type="number" defaultValue="120" className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Unit</label>
                          <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50">
                            <option>°C</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                        <div className="col-span-3 font-semibold text-sm text-slate-900">Material Type</div>
                        <div className="col-span-3">
                           <label className="text-xs text-slate-500 mb-1 block">Select options</label>
                           <div className="flex gap-2">
                             <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium flex items-center">Perovskite <button className="ml-1 text-indigo-400 hover:text-indigo-600">&times;</button></span>
                             <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium flex items-center">Quantum Dot <button className="ml-1 text-indigo-400 hover:text-indigo-600">&times;</button></span>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                        <div className="col-span-3 font-semibold text-sm text-slate-900">Concentration (M)</div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Min</label>
                          <input type="number" defaultValue="0.01" className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Max</label>
                          <input type="number" defaultValue="0.20" className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Unit</label>
                          <select className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50">
                            <option>M</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-indigo-900 mb-1">Experimental Runs Setup</h4>
                    <p className="text-sm text-indigo-700">First column will be Experimental No. 1 to 18</p>
                  </div>
                  <div className="flex space-x-12">
                    <div className="text-center">
                      <p className="text-sm text-indigo-700 mb-1">Minimum Runs Required</p>
                      <p className="text-2xl font-bold text-indigo-900">10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-indigo-700 mb-1">Total Planned Runs</p>
                      <p className="text-2xl font-bold text-indigo-900">18</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200">
                  <button onClick={() => setStep(2)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200">Back</button>
                  <button onClick={() => setStep(4)} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Lock Dataset</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  Are you sure you want to lock this dataset? Once locked, the uploaded data cannot be modified.
                </p>
                
                <div className="flex space-x-4">
                  <button onClick={() => setStep(3)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button onClick={() => setIsLocked(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    Yes, Lock Dataset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
