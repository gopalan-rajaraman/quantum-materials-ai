import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Lock, CheckCircle2, ChevronRight, BarChart2, Check, ArrowRight, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const Upload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState({ numerical: [], categorical: [] });
  const [distributions, setDistributions] = useState({});
  const [selectedVariables, setSelectedVariables] = useState({});
  const [activeTab, setActiveTab] = useState('numerical');
  const [variableUnits, setVariableUnits] = useState({});
  
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState(null);

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const parseFile = async (selectedFile) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length > 0) {
          if (data.length < 10) {
            alert('Error: Uploaded file must contain at least 10 experimental entries. Please upload a file with more data.');
            setFile(null);
            return;
          }
          setParsedData(data);
          analyzeColumns(data);
        }
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert('Error parsing file. Please ensure it is a valid Excel file.');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      parseFile(e.target.files[0]);
    }
  };

  const analyzeColumns = (data) => {
    if (data.length === 0) return;
    const sample = data[0];
    const numerical = [];
    const categorical = [];
    const dists = {};
    const units = {};
    
    // Auto-detect units based on column names
    const unitMapping = {
      'GTE': '°C', 'GTI': 'min', 'FRA': 'sccm', 'Pressure': 'Torr',
      'FRH': 'sccm', 'HR': 'sccm', 'FRP1': 'sccm', 'FRP2': 'sccm',
      'CP1': 'W', 'CP2': 'W', 'Temperature': '°C', 'Time': 'min',
      'Concentration': 'M', 'Power': 'W', 'Annealing_Temperature': '°C',
      'Annealing_Time': 'min', 'PL_FWHM': 'meV', 'PL_Peak': 'eV'
    };
    
    Object.keys(sample).forEach(key => {
      let isNum = true;
      let min = Infinity;
      let max = -Infinity;
      const values = [];
      
      for (let i = 0; i < Math.min(data.length, 100); i++) {
        const val = data[i][key];
        if (val !== null && val !== undefined) {
          values.push(val);
          if (typeof val === 'string' && isNaN(Number(val))) {
            isNum = false;
          }
          if (isNum) {
            const num = Number(val);
            if (num < min) min = num;
            if (num > max) max = num;
          }
        }
      }

      if (isNum) {
        numerical.push(key);
        // Auto-detect unit
        const cleanKey = key.replace(' ', '_').replace('_', '');
        units[key] = unitMapping[cleanKey] || unitMapping[key] || '';
        
        // Simple histogram bins
        const binCount = 5;
        const range = max - min;
        const binSize = range / binCount || 1;
        const bins = Array.from({length: binCount}, (_, i) => ({
          name: `${(min + i * binSize).toFixed(1)}-${(min + (i+1) * binSize).toFixed(1)}`,
          value: 0
        }));
        
        values.forEach(v => {
          const num = Number(v);
          let binIdx = Math.floor((num - min) / binSize);
          if (binIdx >= binCount) binIdx = binCount - 1;
          bins[binIdx].value += 1;
        });
        dists[key] = bins;
      } else {
        categorical.push(key);
        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        dists[key] = Object.entries(counts).map(([k, v]) => ({ name: k, value: v })).slice(0, 5);
      }
    });

    setColumnsInfo({ numerical, categorical });
    setDistributions(dists);
    setVariableUnits(units);

    // Default variable selections
    const initialVars = {};
    [...numerical, ...categorical].slice(0, 8).forEach(col => {
      initialVars[col] = { 
        selected: true, 
        min: '', 
        max: '', 
        unit: units[col] || '',
        isConstant: false 
      };
    });
    setSelectedVariables(initialVars);
  };

  const toggleVariable = (col) => {
    setSelectedVariables(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        selected: !prev[col]?.selected
      }
    }));
  };

  const updateVariableField = (col, field, value) => {
    setSelectedVariables(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        [field]: value
      }
    }));
  };

  const toggleVariableType = (col) => {
    setSelectedVariables(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        isConstant: !prev[col]?.isConstant
      }
    }));
  };

  const handleLockDataset = async () => {
    setIsLocking(true);
    setLockError(null);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('http://localhost:8000/api/datasets/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }
      
      setIsLocked(true);
    } catch (err) {
      console.error(err);
      setLockError(err.message);
    } finally {
      setIsLocking(false);
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
          {steps.map((s) => (
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

  const activeVariablesCount = Object.values(selectedVariables).filter(v => v.selected).length;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      {isLocked ? (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-12 shadow-xl text-center border border-slate-100 mt-10 animate-fade-in">
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
                <div className="flex justify-between"><span className="text-slate-500">Dataset Name</span><span className="font-medium truncate max-w-[150px]" title={file?.name}>{file?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Experiments</span><span className="font-medium">{parsedData.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Variables (To Vary)</span><span className="font-medium">{activeVariablesCount}</span></div>
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
          
          <div className="flex-1 md:pl-8 flex flex-col h-full min-h-[500px]">
            {step === 1 && (
              <div className="animate-fade-in flex-1">
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
                    <p className="text-slate-500 text-sm mb-6">Excel files only (.xlsx, .xls, .csv)</p>
                    <button onClick={() => fileInputRef.current.click()} className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm">
                      Select File
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} />
                    
                    {file && (
                      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center space-x-3 w-full text-left">
                        <FileSpreadsheet className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {file && parsedData.length > 0 && (
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 flex flex-col h-full">
                      <h3 className="font-bold text-slate-900 mb-6">Template Preview</h3>
                      <div className="space-y-4 text-sm flex-1">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Experiments Found</span><span className="font-bold text-slate-900">{parsedData.length}</span></div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Numerical Constants</span><span className="font-bold text-slate-900">{columnsInfo.numerical.length}</span></div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Categorical Constants</span><span className="font-bold text-slate-900">{columnsInfo.categorical.length}</span></div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200"><span className="text-slate-500">Total Variables</span><span className="font-bold text-slate-900">{columnsInfo.numerical.length + columnsInfo.categorical.length}</span></div>
                        <div className="flex justify-between items-center py-2"><span className="text-slate-500">Minimum Runs Required</span><span className="font-bold text-slate-900">{Math.min(10, parsedData.length)}</span></div>
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
              <div className="animate-fade-in flex flex-col h-full">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Graphical Representation of Variables</h2>
                
                <div className="mb-6 flex space-x-4 border-b border-slate-200">
                  <button 
                    onClick={() => setActiveTab('numerical')}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'numerical' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Numerical Constants
                  </button>
                  <button 
                    onClick={() => setActiveTab('categorical')}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'categorical' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Categorical Constants
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px]">
                  {activeTab === 'numerical' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 pr-2">
                      {columnsInfo.numerical.map((col, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <p className="text-sm font-semibold text-slate-700 mb-4 text-center truncate" title={col}>{col}</p>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={distributions[col] || []}>
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
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 pr-2">
                      {columnsInfo.categorical.map((col, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <p className="text-sm font-semibold text-slate-700 mb-4 text-center truncate" title={col}>{col}</p>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={distributions[col] || []}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={60}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {(distributions[col] || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1 justify-center">
                            {(distributions[col] || []).slice(0, 4).map((entry, index) => (
                              <span key={index} className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {entry.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200">
                  <button onClick={() => setStep(1)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200">Back</button>
                  <button onClick={() => setStep(3)} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in flex flex-col h-full">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Define Constants & Variables</h2>
                <p className="text-slate-500 mb-6">Specify which parameters are constants and which will vary during experiments.</p>
                
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm">All Parameters</h3>
                    <div className="space-y-2 h-[320px] overflow-y-auto pr-2">
                      {[...columnsInfo.numerical, ...columnsInfo.categorical].map((v, i) => (
                        <label key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                              checked={selectedVariables[v]?.selected || false}
                              onChange={() => toggleVariable(v)}
                            />
                            <span className="text-xs font-medium text-slate-700 truncate" title={v}>{v}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {columnsInfo.numerical.includes(v) ? 'Num' : 'Cat'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-[360px] overflow-y-auto">
                    <div className="space-y-4">
                      {Object.keys(selectedVariables).filter(k => selectedVariables[k].selected).map((v, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${idx > 0 ? 'border-slate-100' : 'border-indigo-100 bg-indigo-50/30'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-sm text-slate-900">{v}</div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleVariableType(v)}
                                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                                  selectedVariables[v]?.isConstant 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {selectedVariables[v]?.isConstant ? 'Constant' : 'Variable to Vary'}
                              </button>
                            </div>
                          </div>
                          
                          {columnsInfo.numerical.includes(v) ? (
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide">Min Value</label>
                                <input 
                                  type="number" 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="0"
                                  value={selectedVariables[v]?.min || ''}
                                  onChange={(e) => updateVariableField(v, 'min', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide">Max Value</label>
                                <input 
                                  type="number" 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="100"
                                  value={selectedVariables[v]?.max || ''}
                                  onChange={(e) => updateVariableField(v, 'max', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide">Unit</label>
                                <input 
                                  type="text" 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="°C"
                                  value={selectedVariables[v]?.unit || variableUnits[v] || ''}
                                  onChange={(e) => updateVariableField(v, 'unit', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide">Type</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  value={selectedVariables[v]?.isConstant ? 'constant' : 'variable'}
                                  onChange={(e) => updateVariableField(v, 'isConstant', e.target.value === 'constant')}
                                >
                                  <option value="variable">Variable</option>
                                  <option value="constant">Constant</option>
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide">Available Classes</label>
                                <div className="flex gap-1.5 flex-wrap">
                                  {distributions[v]?.map((d, dIdx) => (
                                    <span key={dIdx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-medium border border-indigo-100">
                                      {d.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide">Type</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  value={selectedVariables[v]?.isConstant ? 'constant' : 'variable'}
                                  onChange={(e) => updateVariableField(v, 'isConstant', e.target.value === 'constant')}
                                >
                                  <option value="variable">Variable</option>
                                  <option value="constant">Constant</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {activeVariablesCount === 0 && (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <BarChart2 className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-slate-500 text-sm">Select parameters from the left to define their properties.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-indigo-900 mb-1 text-sm">Dataset Summary</h4>
                    <p className="text-xs text-indigo-700">First column should contain Experimental ID (minimum 10 entries required)</p>
                  </div>
                  <div className="flex space-x-8">
                    <div className="text-center px-4">
                      <p className="text-xs text-indigo-700 mb-1">Total Experiments</p>
                      <p className="text-xl font-bold text-indigo-900">{parsedData.length}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-indigo-700 mb-1">Variables to Vary</p>
                      <p className="text-xl font-bold text-indigo-900">
                        {Object.values(selectedVariables).filter(v => v.selected && !v.isConstant).length}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-indigo-700 mb-1">Constants</p>
                      <p className="text-xl font-bold text-indigo-900">
                        {Object.values(selectedVariables).filter(v => v.selected && v.isConstant).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all">Back</button>
                  <button 
                    onClick={() => setStep(4)} 
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Review & Lock Dataset
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in flex flex-col items-center justify-center h-full flex-1 text-center">
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Lock Dataset</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  Are you sure you want to lock this dataset? Once locked, the ML model will ingest it and begin training.
                </p>
                
                {lockError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 max-w-md border border-red-200">
                    {lockError}
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button onClick={() => setStep(3)} disabled={isLocking} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all disabled:opacity-50">
                    Cancel
                  </button>
                  <button 
                    onClick={handleLockDataset} 
                    disabled={isLocking}
                    className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-75"
                  >
                    {isLocking ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Training ML Model...</span>
                      </>
                    ) : (
                      <span>Yes, Lock Dataset</span>
                    )}
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
