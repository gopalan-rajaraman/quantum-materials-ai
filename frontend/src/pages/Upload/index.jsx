import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Lock, CheckCircle2, ChevronRight, BarChart2, Check, ArrowRight, PieChart, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import api from '../../services/api';

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
  const [confirmedExpIds, setConfirmedExpIds] = useState(new Set());
  const [showFinalLockModal, setShowFinalLockModal] = useState(false);

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

  const toggleExpIdConfirmation = (expId) => {
    setConfirmedExpIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expId)) {
        newSet.delete(expId);
      } else {
        newSet.add(expId);
      }
      return newSet;
    });
  };

  const SAMPLES_PER_EXPERIMENT = 10;

  const getExperimentalIds = () => {
    if (parsedData.length === 0) return [];
    const totalExperiments = Math.ceil(parsedData.length / SAMPLES_PER_EXPERIMENT);
    const experiments = [];
    for (let i = 0; i < totalExperiments; i++) {
      const startIdx = i * SAMPLES_PER_EXPERIMENT;
      const endIdx = Math.min(startIdx + SAMPLES_PER_EXPERIMENT, parsedData.length);
      const samples = parsedData.slice(startIdx, endIdx);
      experiments.push({
        id: `EXP-${i + 1}`,
        label: `EXP-${i + 1}`,
        sampleCount: samples.length,
        startRow: startIdx + 1,
        endRow: endIdx,
        samples: samples
      });
    }
    return experiments;
  };

  const confirmAllExpIds = () => {
    const allIds = getExperimentalIds().map(exp => exp.id);
    setConfirmedExpIds(new Set(allIds));
  };

  const handleLockDataset = async () => {
    setIsLocking(true);
    setLockError(null);
    try {
      await api.uploadDataset([file]);

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
      { id: 2, name: 'Extract Variables' },
      { id: 3, name: 'Confirm & Lock' }
    ];

    return (
      <div className="w-[200px] flex-shrink-0 pr-6 border-r border-slate-100 hidden md:block">
        <div className="space-y-10 relative mt-2">
          {/* Vertical line connecting steps */}
          <div className="absolute left-[13px] top-4 bottom-4 w-px bg-slate-200 z-0"></div>
          
          {steps.map((s) => (
            <div key={s.id} className="flex items-center relative z-10 bg-white">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] transition-colors
                ${step === s.id ? 'bg-[#4C3BDE] text-white' : 
                  step > s.id ? 'bg-white border border-slate-300 text-slate-400' : 'bg-white border border-slate-200 text-slate-400'}`}>
                {step > s.id ? <Check className="w-3 h-3" /> : s.id}
              </div>
              <span className={`ml-4 text-[13px] font-semibold transition-colors ${step === s.id ? 'text-[#4C3BDE]' : 'text-slate-500'}`}>
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
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-12 shadow-sm border border-slate-200 text-center mt-10 animate-fade-in">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
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
              <span className="text-[#4C3BDE] font-bold text-xs">i</span>
            </div>
            <div>
              <p className="font-bold text-indigo-900 mb-1">BO Loop includes Active Learning</p>
              <p className="text-sm text-indigo-700">The model will optimize itself after each experimental run based on your feedback (PL FWHM result) and suggest the next best experiment.</p>
            </div>
          </div>

          <button onClick={() => navigate('/optimization')} className="bg-[#4C3BDE] hover:bg-[#3D2EB0] text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center mx-auto space-x-2">
            <span>Go to BO Loop</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex min-h-[600px] relative">
          <StepsSidebar />
          
          <div className="flex-1 md:pl-10 flex flex-col h-full min-h-[500px]">
            {step === 1 && (
              <div className="animate-fade-in flex-1 flex flex-col">
                <div className="mb-8">
                   <h2 className="text-[18px] font-bold text-slate-900 mb-1">Upload Excel Template</h2>
                   <p className="text-slate-500 text-[13px]">Upload your experiment template to extract variables.</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8 flex-1">
                  <div className="flex-1">
                    <div 
                      className={`border-[1.5px] border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        dragActive ? 'border-[#4C3BDE] bg-[#F4F0FF]' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <UploadCloud className="w-8 h-8 text-slate-600 mb-4" />
                      <p className="text-slate-800 font-semibold mb-1 text-[13px]">Click to upload or drag and drop</p>
                      <p className="text-slate-400 text-[12px] mb-0">Excel files only (.xlsx, .xls)</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} />
                    </div>

                    {file && (
                      <div className="mt-4 p-4 bg-[#F8F6FF] border border-[#F0EBFF] rounded-xl flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 flex items-center justify-center bg-transparent text-[#4C3BDE]">
                              <FileSpreadsheet className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="text-[13px] font-bold text-slate-900 truncate">{file.name}</p>
                             <p className="text-[11px] font-medium text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                           </div>
                        </div>
                        <Check className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="w-72 flex-shrink-0">
                    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 flex flex-col h-full">
                      <h3 className="font-bold text-slate-900 mb-6 text-[14px]">Template Preview</h3>
                      <div className="space-y-5 text-sm flex-1">
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-[12px] font-medium">Experiments Found</span><span className="font-bold text-slate-900 text-[12px]">{parsedData.length || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-[12px] font-medium">Numerical Constants</span><span className="font-bold text-slate-900 text-[12px]">{columnsInfo.numerical.length || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-[12px] font-medium">Categorical Constants</span><span className="font-bold text-slate-900 text-[12px]">{columnsInfo.categorical.length || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-[12px] font-medium">Variables (To Vary)</span><span className="font-bold text-slate-900 text-[12px]">{columnsInfo.numerical.length + columnsInfo.categorical.length || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 text-[12px] font-medium">Minimum Runs Required</span><span className="font-bold text-slate-900 text-[12px]">{parsedData.length > 0 ? Math.min(10, parsedData.length) : 0}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {file && parsedData.length > 0 && (
                   <div className="mt-8 flex justify-end">
                     <button onClick={() => setStep(2)} className="bg-[#4C3BDE] hover:bg-[#3D2EB0] text-white px-8 py-2.5 rounded-lg font-semibold transition-all text-[13px] shadow-sm">
                       Extract Variables
                     </button>
                   </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in flex flex-col h-full">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Define Constants & Variables</h2>
                <p className="text-slate-500 mb-6 text-[13px]">Specify which parameters are constants and which will vary during experiments.</p>
                
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <h3 className="font-bold text-slate-900 mb-4 text-[13px]">All Parameters</h3>
                    <div className="space-y-2 h-[320px] overflow-y-auto pr-2">
                      {[...columnsInfo.numerical, ...columnsInfo.categorical].map((v, i) => (
                        <label key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 shadow-sm rounded-lg cursor-pointer hover:border-[#4C3BDE]/30 transition-colors">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-[#4C3BDE] rounded border-slate-200 focus:ring-[#4C3BDE]" 
                              checked={selectedVariables[v]?.selected || false}
                              onChange={() => toggleVariable(v)}
                            />
                            <span className="text-[12px] font-semibold text-slate-700 truncate" title={v}>{v}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {columnsInfo.numerical.includes(v) ? 'Num' : 'Cat'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-[360px] overflow-y-auto">
                    <div className="space-y-4">
                      {Object.keys(selectedVariables).filter(k => selectedVariables[k].selected).map((v, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${idx > 0 ? 'border-slate-100' : 'border-[#4C3BDE]/20 bg-[#F8F6FF]'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-[13px] text-slate-900">{v}</div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleVariableType(v)}
                                className={`text-[11px] px-3 py-1 rounded-md font-bold transition-colors border ${
                                  selectedVariables[v]?.isConstant 
                                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                    : 'bg-white text-[#4C3BDE] border-[#4C3BDE]/20'
                                }`}
                              >
                                {selectedVariables[v]?.isConstant ? 'Constant' : 'Variable to Vary'}
                              </button>
                            </div>
                          </div>
                          
                          {columnsInfo.numerical.includes(v) ? (
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Value</label>
                                <input 
                                  type="number" 
                                  step="any"
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#4C3BDE] focus:border-[#4C3BDE] outline-none"
                                  placeholder="Enter value"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Unit (Fixed)</label>
                                <div className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 text-slate-700 font-semibold flex items-center">
                                  {selectedVariables[v]?.unit || variableUnits[v] || '—'}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Type</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#4C3BDE] focus:border-[#4C3BDE] outline-none"
                                  value={selectedVariables[v]?.isConstant ? 'constant' : 'variable'}
                                  onChange={(e) => updateVariableField(v, 'isConstant', e.target.value === 'constant')}
                                >
                                  <option value="variable">Variable</option>
                                  <option value="constant">Constant</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Note</label>
                                <div className="w-full rounded-lg p-2 text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
                                  Unit is locked. Use the fixed unit only.
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Value</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#4C3BDE] focus:border-[#4C3BDE] outline-none"
                                >
                                  <option value="">Select a class</option>
                                  {distributions[v]?.map((d, dIdx) => (
                                    <option key={dIdx} value={d.name}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Available Classes</label>
                                <div className="flex gap-1.5 flex-wrap">
                                  {distributions[v]?.map((d, dIdx) => (
                                    <span key={dIdx} className="bg-white text-[#4C3BDE] px-2 py-1 rounded text-[10px] font-bold border border-[#4C3BDE]/20">
                                      {d.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wide font-semibold">Type</label>
                                <select 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#4C3BDE] focus:border-[#4C3BDE] outline-none"
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
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <BarChart2 className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-slate-500 text-[13px]">Select parameters from the left to define their properties.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-[#F8F6FF] border border-[#F0EBFF] rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1 text-[13px]">Dataset Summary</h4>
                    <p className="text-[11px] text-slate-500">First column should contain Experimental ID (minimum 10 entries required)</p>
                  </div>
                  <div className="flex space-x-8">
                    <div className="text-center px-4">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Total Experiments</p>
                      <p className="text-lg font-bold text-[#4C3BDE]">{getExperimentalIds().length}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Variables to Vary</p>
                      <p className="text-lg font-bold text-[#4C3BDE]">
                        {Object.values(selectedVariables).filter(v => v.selected && !v.isConstant).length}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Constants</p>
                      <p className="text-lg font-bold text-[#4C3BDE]">
                        {Object.values(selectedVariables).filter(v => v.selected && v.isConstant).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all text-[13px]">Back</button>
                  <button 
                    onClick={() => setStep(3)} 
                    className="px-8 py-2.5 bg-[#4C3BDE] text-white rounded-lg font-semibold hover:bg-[#3D2EB0] transition-all shadow-sm text-[13px]"
                  >
                    Confirm & Lock Dataset
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Confirm Experimental IDs</h2>
                  <p className="text-slate-500 text-[13px]">
                    Please confirm each experimental ID before locking the dataset. This ensures data integrity for the ML model training.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 mb-6">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={confirmAllExpIds}
                        className="text-[11px] px-3 py-1.5 bg-white border border-[#4C3BDE]/20 text-[#4C3BDE] rounded-md font-bold hover:bg-[#F8F6FF] transition-colors"
                      >
                        Confirm All ({getExperimentalIds().length})
                      </button>
                      <span className="text-[12px] font-semibold text-slate-500">
                        Confirmed: {confirmedExpIds.size} / {getExperimentalIds().length}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getExperimentalIds().map((exp, idx) => (
                      <div 
                        key={idx}
                        onClick={() => toggleExpIdConfirmation(exp.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          confirmedExpIds.has(exp.id) 
                            ? 'bg-[#E8FFF3] border-[#00B050]/20' 
                            : 'bg-white border-slate-100 hover:border-[#4C3BDE]/30 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              confirmedExpIds.has(exp.id) 
                                ? 'border-[#00B050] bg-[#00B050]' 
                                : 'border-slate-300'
                            }`}>
                              {confirmedExpIds.has(exp.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[13px] text-slate-900">{exp.label}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{exp.sampleCount} samples (Rows {exp.startRow}–{exp.endRow})</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {lockError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 border border-red-200 text-sm font-medium">
                    {lockError}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all text-[13px]"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setShowFinalLockModal(true)}
                    disabled={confirmedExpIds.size === 0 || isLocking}
                    className="flex items-center space-x-2 px-8 py-2.5 bg-[#4C3BDE] text-white rounded-lg font-semibold hover:bg-[#3D2EB0] transition-all shadow-sm text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock Dataset</span>
                  </button>
                </div>
              </div>
            )}
            
            {showFinalLockModal && (
              <div className="absolute left-4 bottom-4 md:-left-12 md:-bottom-8 z-50 animate-fade-in pointer-events-auto">
                 <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-6 max-w-[420px] w-full flex space-x-5">
                    <div className="flex-shrink-0">
                       <div className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#00B050] flex items-center justify-center bg-white">
                          <Lock className="w-[22px] h-[22px] text-[#00B050]" />
                       </div>
                    </div>
                    <div className="flex-1">
                       <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">Lock Dataset</h3>
                       <p className="text-slate-600 text-[13px] mb-1.5 leading-relaxed font-medium">Are you sure you want to lock this dataset?</p>
                       <p className="text-slate-600 text-[13px] mb-5 leading-relaxed font-medium">Once locked, the uploaded data cannot be modified.</p>
                       <div className="flex space-x-3">
                          <button 
                            onClick={() => setShowFinalLockModal(false)} 
                            className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              setShowFinalLockModal(false);
                              handleLockDataset();
                            }}
                            disabled={isLocking}
                            className="flex-1 px-4 py-2 bg-[#4C3BDE] text-white rounded-lg text-[13px] font-bold hover:bg-[#3D2EB0] transition-all flex justify-center items-center shadow-sm"
                          >
                            {isLocking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Yes, Lock Dataset'}
                          </button>
                       </div>
                    </div>
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
