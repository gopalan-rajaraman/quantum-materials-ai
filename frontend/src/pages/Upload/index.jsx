import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Lock, CheckCircle2, ChevronRight, BarChart2, Check, ArrowRight, PieChart, Info, Thermometer, Clock, Wind, Gauge, FlaskConical, Copy, Trash2, ChevronDown, Activity, List, FileText, Layers, Users, Shield, AlertCircle } from 'lucide-react';
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
  const [datasetId, setDatasetId] = useState('');
  const [uploadDate, setUploadDate] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState({ numerical: [], categorical: [] });
  const [distributions, setDistributions] = useState({});
  const [selectedVariables, setSelectedVariables] = useState({});
  const [activeTab, setActiveTab] = useState('numerical');
  const [variableUnits, setVariableUnits] = useState({});
  const [datasetName, setDatasetName] = useState('');
  const [autoGenFileName, setAutoGenFileName] = useState('');
  const [boConstants, setBoConstants] = useState({
    P1: 'W(CO)6',
    P2: 'H2S',
    Substrate: 'SiO2/Si',
    CG: 'Ar',
    COM: 'Natural',
    PC: 'Bubbler',
    SA: 'NaCl',
    Class: 'Monolayer',
    FRH: 0
  });

  const updateBoConstant = (field, value) => {
    setBoConstants(prev => ({ ...prev, [field]: value }));
  };

  
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState(null);
  const [confirmedExpIds, setConfirmedExpIds] = useState(new Set());
  const [showFinalLockModal, setShowFinalLockModal] = useState(false);
  const [searchSpace, setSearchSpace] = useState([]);
  const [variableRanges, setVariableRanges] = useState({});

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
          if (data.length < 7) {
            alert('Error: Uploaded file must contain at least 7 experimental entries. Please upload a file with more data.');
            setFile(null);
            return;
          }
          const currentDatasetCount = parseInt(localStorage.getItem('datasetCount') || '0') + 1;
          localStorage.setItem('datasetCount', currentDatasetCount);
          const dsId = `EXP_${currentDatasetCount.toString().padStart(3, '0')}`;
          
          let baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
          setDatasetName(baseName);
          setAutoGenFileName(`${baseName}_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.json`);
          
          const dataWithIds = data.map((row, index) => {
            const expNum = index + 1;
            const expId = `${dsId}_${expNum.toString().padStart(3, '0')}`;
            return {
              ...row,
              Dataset_ID: dsId,
              Exp_Number: expId,
              'PL FWHM': row['PL FWHM'] || (Math.random() * 50 + 50).toFixed(2)
            };
          });

          setDatasetId(dsId);
          setUploadDate(new Date());
          setParsedData(dataWithIds);
          analyzeColumns(dataWithIds);
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
    
    Object.keys(sample).forEach(key => {
      let isNum = true;
      let min = Infinity;
      let max = -Infinity;
      const values = [];
      
      for (let i = 0; i < Math.min(data.length, 100); i++) {
        let val = data[i][key];
        if (val === 'NS') val = null;
        if (val !== null && val !== undefined && val !== '') {
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
        const normalizedKey = key.replace(/\s+/g, '_').toUpperCase();
        let detectedUnit = '';
        if (normalizedKey.includes('GTE') || normalizedKey.includes('TEMPERATURE') || normalizedKey.includes('TEMP')) detectedUnit = '°C';
        else if (normalizedKey.includes('GTI') || normalizedKey.includes('TIME')) detectedUnit = 'min';
        else if (normalizedKey.includes('FLOW') || normalizedKey.includes('FR')) detectedUnit = 'sccm';
        else if (normalizedKey.includes('PRESSURE')) detectedUnit = 'Torr';
        else if (normalizedKey.includes('FWHM')) detectedUnit = 'meV';
        else if (normalizedKey.includes('PEAK') || normalizedKey.includes('POSITION')) detectedUnit = 'eV';
        else if (normalizedKey.includes('POWER') || normalizedKey.includes('CP')) detectedUnit = 'W';
        
        units[key] = detectedUnit;
        
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

    // Default variable selections (all columns from sheet are variables)
    const initialVars = {};
    [...numerical, ...categorical].forEach(col => {
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
    setConfirmedExpIds(new Set([expId]));
  };

  const [samplesPerExperiment, setSamplesPerExperiment] = useState(10);

  const getExperimentalIds = () => {
    if (parsedData.length === 0) return [];
    const totalExperiments = Math.ceil(parsedData.length / samplesPerExperiment);
    const experiments = [];
    for (let i = 0; i < totalExperiments; i++) {
      const startIdx = i * samplesPerExperiment;
      const endIdx = Math.min(startIdx + samplesPerExperiment, parsedData.length);
      const samples = parsedData.slice(startIdx, endIdx);
      
      const currentDsId = datasetId || 'DS_NEW';
      const expNum = startIdx === 0 ? 1 : startIdx;
      const expId = `${currentDsId}_${String(expNum).padStart(3, '0')}`;
      
      experiments.push({
        id: expId,
        label: expId,
        sampleCount: samples.length,
        startRow: startIdx + 1,
        endRow: endIdx,
        samples: samples,
        batchNum: i + 1
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
      // Separate categorical and numerical constants
      const catConstants = {
        P1: boConstants.P1,
        P2: boConstants.P2,
        Substrate: boConstants.Substrate,
        CG: boConstants.CG,
        COM: boConstants.COM,
        PC: boConstants.PC,
        SA: boConstants.SA,
        Class: boConstants.Class
      };
      const numConstants = {
        FRH: parseFloat(boConstants.FRH) || 0
      };

      const response = await api.uploadDataset([file], catConstants, numConstants);

      // Store search space and variable ranges
      if (response.search_space) {
        setSearchSpace(response.search_space);
      }
      if (response.variable_ranges) {
        setVariableRanges(response.variable_ranges);
      }

      setIsLocked(true);
    } catch (err) {
      console.error(err);
      setLockError(err.message);
    } finally {
      setIsLocking(false);
    }
  };

  const downloadSearchSpace = () => {
    if (searchSpace.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(searchSpace);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Virtual Space');
    XLSX.writeFile(wb, `Virtual_Space_${datasetName || 'Dataset'}.xlsx`);
  };

  const StepsSidebar = () => {
    const steps = [
      { id: 1, name: 'Upload Template' },
      { id: 2, name: 'Extract Variables' },
      { id: 3, name: 'Dataset Details' },
      { id: 4, name: 'Confirm & Lock' }
    ];

    return (
      <div className="w-[250px] flex-shrink-0 pr-6 border-r border-slate-100 hidden md:block">
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

        {step >= 2 && datasetId && (
          <div className="mt-12 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <FileSpreadsheet className="w-4 h-4 text-[#4C3BDE]" />
              <h4 className="text-[13px] font-bold text-[#4C3BDE]">Dataset Information</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dataset ID</p>
                <div className="flex items-center space-x-2">
                  <span className="text-[13px] font-semibold text-[#4C3BDE] bg-indigo-100/50 px-2 py-0.5 rounded">{datasetId}</span>
                  <Copy className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Uploaded On</p>
                <p className="text-[12px] font-medium text-slate-700">
                  {uploadDate ? uploadDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + uploadDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                </p>
              </div>



              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source File</p>
                <div className="flex items-center space-x-2">
                  <span className="text-[12px] font-medium text-slate-700 truncate max-w-[150px]">{file?.name}</span>
                  <Copy className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>

              <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-[11px] font-bold text-green-700 mb-0.5">Status: Active</p>
                <p className="text-[10px] text-green-600">This dataset is ready for BO.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeVariablesCount = Object.values(selectedVariables).filter(v => v.selected).length;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      {isLocked ? (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-sm border border-slate-200 text-center mt-10 animate-fade-in">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Dataset Registered Successfully!</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Your dataset has been locked and the virtual search space has been generated. You can download the virtual space or proceed to the BO Loop.
          </p>

          {/* Virtual Space Summary */}
          {searchSpace.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100 text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Virtual Search Space</h3>
                    <p className="text-sm text-slate-500">{searchSpace.length} candidate experiments generated</p>
                  </div>
                </div>
                <button
                  onClick={downloadSearchSpace}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 rounded-lg text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel
                </button>
              </div>

              {/* Variable Ranges */}
              {Object.keys(variableRanges).length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {Object.entries(variableRanges).map(([varName, [min, max]]) => (
                    <div key={varName} className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                      <p className="text-xs font-bold text-slate-500 mb-1">{varName}</p>
                      <p className="text-sm font-semibold text-indigo-700">{min.toFixed(1)} - {max.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 text-left mb-8">
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
                <li>Download virtual space (optional)</li>
                <li>Start the BO Loop</li>
                <li>Run experiments as suggested</li>
                <li>Enter PL FWHM results</li>
                <li>Model learns and optimizes</li>
              </ol>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start text-left mb-8">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
              <span className="text-[#4C3BDE] font-bold text-xs">i</span>
            </div>
            <div>
              <p className="font-bold text-indigo-900 mb-1">BO Loop includes Active Learning</p>
              <p className="text-sm text-indigo-700">The model will optimize itself after each experimental run based on your feedback (PL FWHM result) and suggest the next best experiment.</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/datasets')} className="px-8 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
              View Datasets
            </button>
            <button onClick={() => navigate('/optimization')} className="bg-[#4C3BDE] hover:bg-[#3D2EB0] text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center space-x-2">
              <span>Go to BO Loop</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
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
              <div className="animate-fade-in flex flex-col h-full text-slate-800">
                
                {/* Header Area */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{datasetId}</h2>
                      <span className="text-[11px] font-bold text-[#4C3BDE] bg-[#F4F0FF] border border-[#E5E0FF] px-2.5 py-1 rounded-full flex items-center gap-1.5"><FlaskConical className="w-3 h-3" /> New Dataset</span>
                      <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Ready</span>
                    </div>
                    <p className="text-slate-500 text-[14px] font-medium">Bayesian Optimization for FWHM Minimization</p>
                  </div>
                  <button className="px-5 py-2.5 bg-white border border-[#E5E0FF] text-[#4C3BDE] text-[13px] font-bold rounded-xl hover:bg-[#F4F0FF] transition-colors shadow-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Preview Setup
                  </button>
                </div>
                
                {/* Main Middle Panels */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  
                  {/* Left: Optimization Variables */}
                  <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-[#4C3BDE]" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-[16px]">Optimization Variables</h3>
                    </div>
                    <p className="text-[13px] text-slate-500 mb-6">These variables will be optimized by the BO model.</p>
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                            <Thermometer className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] text-slate-900">GTE</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">Growth Temperature</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[14px] text-slate-900">550 - 1100</p>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">°C</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] text-slate-900">GTI</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">Growth Time</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[14px] text-slate-900">10 - 60</p>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">min</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                            <Wind className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] text-slate-900">FRA</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">Ar Flow Rate</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[14px] text-slate-900">0 - 300</p>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">sccm</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500">
                            <Gauge className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] text-slate-900">Pressure</p>
                            <p className="text-[12px] text-slate-500 mt-0.5">Chamber Pressure</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[14px] text-slate-900">1 - 760</p>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">Torr</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-[#F8F6FF] border border-[#F0EBFF] rounded-xl p-4 flex gap-3">
                      <Info className="w-5 h-5 text-[#4C3BDE] flex-shrink-0" />
                      <div>
                        <p className="text-[12px] text-[#4C3BDE] font-semibold">These variables will vary across experiments.</p>
                        <p className="text-[12px] text-indigo-700/80 mt-0.5 font-medium">All other parameters remain constant.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Experiment Constants */}
                  <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FlaskConical className="w-4 h-4 text-[#4C3BDE]" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-[16px]">Experiment Constants</h3>
                    </div>
                    <p className="text-[13px] text-slate-500 mb-6">These parameters remain constant throughout the optimization.</p>
                    
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4 flex-1">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Precursor 1 (P1)</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.P1} onChange={(e) => updateBoConstant('P1', e.target.value)}>
                            {['WO3', 'WCl6', 'W(CO)6', 'WF6'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Precursor 2 (P2)</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.P2} onChange={(e) => updateBoConstant('P2', e.target.value)}>
                            {['Sulfur', 'H2S', 'DTBS'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Substrate</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.Substrate} onChange={(e) => updateBoConstant('Substrate', e.target.value)}>
                            {['graphite', 'SiO2/Si', 'Sapphire (C-plane)', 'Graphene'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Carrier Gas (CG)</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.CG} onChange={(e) => updateBoConstant('CG', e.target.value)}>
                            {['Ar', 'H2', 'H2/Ar', 'He'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Cooling Method (COM)</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.COM} onChange={(e) => updateBoConstant('COM', e.target.value)}>
                            {['Rapid', 'Natural'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Container (PC)</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.PC} onChange={(e) => updateBoConstant('PC', e.target.value)}>
                            {['Quartz boat', 'Al2O3 crucible', 'Bubbler', 'Sulfur boat', 'Ceramic boat', 'Gas cylinders'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Seed Additive (SA)</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.SA} onChange={(e) => updateBoConstant('SA', e.target.value)}>
                            {['NaCl', 'SnCl4', 'None'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Class</label>
                        <div className="relative">
                          <select className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none cursor-pointer" value={boConstants.Class} onChange={(e) => updateBoConstant('Class', e.target.value)}>
                            {['Monolayer', 'Nanosheets'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 col-span-2">
                        <label className="text-[10px] text-slate-500 mb-1 block font-bold uppercase tracking-wide">Fixed Parameter (e.g., FRH)</label>
                        <div className="relative">
                          <input type="number" className="w-full bg-transparent text-[13px] text-slate-900 font-bold outline-none appearance-none" value={boConstants.FRH} onChange={(e) => updateBoConstant('FRH', e.target.value)} />
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-[#FFF9ED] border border-[#FFEDD5] rounded-xl p-4 flex gap-3">
                      <div className="w-5 h-5 text-orange-500 flex-shrink-0 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.45.62 2.8 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>
                      </div>
                      <div>
                        <p className="text-[12px] text-orange-800 font-semibold">These constants define your experiment environment.</p>
                        <p className="text-[12px] text-orange-600/80 mt-0.5 font-medium">You can change them for a new experiment series.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Numbering Works */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] mb-8 flex flex-col xl:flex-row items-center gap-10">
                  <div className="xl:w-1/3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <List className="w-4 h-4 text-[#4C3BDE]" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-[15px]">How Experiment Numbering Works</h3>
                    </div>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">For each new dataset you upload, a new Experiment ID is assigned. Samples in the dataset are automatically numbered in sequence.</p>
                  </div>
                  
                  <div className="xl:w-2/3 flex items-center justify-between text-center text-[12px] w-full gap-2">
                    <div className="flex-1 flex flex-col items-center min-w-0">
                      <p className="text-[#4C3BDE] font-semibold mb-3 truncate w-full">Upload Dataset</p>
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 px-3 inline-flex items-center gap-2 shadow-sm max-w-full overflow-hidden">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" /> <span className="text-slate-700 font-medium truncate">{file?.name || 'dataset.xlsx'}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mx-1" />
                    <div className="flex-1 flex flex-col items-center min-w-0">
                      <p className="text-[#4C3BDE] font-bold mb-3 truncate w-full">Assigned ID</p>
                      <div className="text-lg lg:text-xl font-extrabold text-[#4C3BDE] truncate w-full">{datasetId}</div>
                      <p className="text-indigo-400 font-bold mt-1.5">(New)</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mx-1" />
                    <div className="flex-1 flex flex-col items-center min-w-0">
                      <p className="text-green-600 font-bold mb-3 truncate w-full">Experiment Numbers</p>
                      <div className="bg-green-50 border border-green-200 rounded-xl py-2.5 px-3 flex flex-wrap justify-center items-center gap-2 font-mono font-bold text-green-700 text-[10px] lg:text-[11px] w-full">
                        <span className="truncate">{datasetId}_001</span> <span className="text-green-400 flex-shrink-0">...</span> <span className="truncate">{datasetId}_{parsedData.length.toString().padStart(3, '0')}</span>
                      </div>
                      <p className="text-green-600 font-bold mt-2">(For {parsedData.length} samples)</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-[11px] font-medium text-slate-400 mb-8 mt-[-10px]">If you upload another dataset, a new ID will be created (e.g., EXP_009) and numbering will start from EXP_009_001.</p>

                {/* Summary & Footer */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] flex flex-col mb-4 relative overflow-hidden">
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#4C3BDE]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-[16px]">Experiment Summary</h3>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5">Review your configuration before proceeding</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className="bg-[#F8F6FF] rounded-xl p-6 text-center border border-[#E5E0FF] flex flex-col items-center justify-center">
                      <FlaskConical className="w-7 h-7 text-[#4C3BDE] mb-4" />
                      <p className="text-[12px] text-slate-500 font-bold mb-1.5">Experiment ID (New)</p>
                      <p className="text-xl font-extrabold text-[#4C3BDE] mb-2">{datasetId}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Automatically assigned<br/>for this dataset</p>
                    </div>
                    <div className="bg-[#F0FDF4] rounded-xl p-6 text-center border border-[#DCFCE7] flex flex-col items-center justify-center">
                      <Thermometer className="w-7 h-7 text-green-600 mb-4" />
                      <p className="text-[12px] text-green-700 font-bold mb-1.5">Samples in Dataset</p>
                      <p className="text-xl font-extrabold text-green-700 mb-2">{parsedData.length}</p>
                      <p className="text-[11px] text-green-600/80 font-medium">Will be numbered automatically<br/>{datasetId}_001 to {datasetId}_{parsedData.length.toString().padStart(3, '0')}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-xl p-6 text-center border border-[#E2E8F0] flex flex-col items-center justify-center">
                      <Activity className="w-7 h-7 text-blue-500 mb-4" />
                      <p className="text-[12px] text-slate-500 font-bold mb-1.5">Optimization Variables</p>
                      <p className="text-xl font-extrabold text-slate-900 mb-2">4</p>
                      <p className="text-[11px] text-slate-500 font-medium">GTE, GTI, FRA, Pressure<br/>(To be optimized)</p>
                    </div>
                    <div className="bg-[#FFF7ED] rounded-xl p-6 text-center border border-[#FFEDD5] flex flex-col items-center justify-center">
                      <FlaskConical className="w-7 h-7 text-orange-500 mb-4" />
                      <p className="text-[12px] text-orange-700 font-bold mb-1.5">Constants</p>
                      <p className="text-xl font-extrabold text-orange-700 mb-2">9</p>
                      <p className="text-[11px] text-orange-600/80 font-medium">Fixed environment<br/>parameters</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => setStep(3)} 
                      className="px-12 py-3.5 bg-[#4020f5] text-white rounded-xl font-bold hover:bg-[#3D2EB0] transition-all shadow-md text-[14px] flex items-center space-x-3 mb-2"
                    >
                      <span>Review & Proceed</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] font-medium text-slate-500 mr-2">You can review all settings in the next step.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in flex h-full">
                <div className="max-w-2xl w-full mx-auto mt-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Dataset Details</h2>
                    <p className="text-slate-500 text-[14px]">
                      Provide a name for your dataset before proceeding.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-8">
                    <div className="mb-8">
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">
                        Dataset Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[14px] text-slate-800"
                      />
                      <p className="text-[12px] text-slate-500 mt-2">A clear and descriptive name helps you identify this dataset easily.</p>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">
                        Auto-generated filename
                      </label>
                      <div className="flex items-center">
                        <input 
                          type="text" 
                          value={autoGenFileName}
                          readOnly
                          className="w-full px-4 py-3 rounded-l-lg border border-slate-200 bg-slate-50 focus:outline-none text-[13px] text-slate-600 font-mono"
                        />
                        <button className="px-4 py-3 border-y border-r border-slate-200 bg-slate-50 rounded-r-lg hover:bg-slate-100 transition-colors text-slate-500" title="Copy" onClick={() => navigator.clipboard.writeText(autoGenFileName)}>
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[12px] text-slate-500 mt-2">This is the system filename. You can rename your dataset above.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setStep(2)}
                      className="px-6 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all shadow-sm text-[14px]"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setStep(4)}
                      className="px-6 py-2.5 bg-[#4020f5] text-white rounded-lg font-bold hover:bg-[#3D2EB0] transition-all shadow-md text-[14px] flex items-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in flex gap-6 h-full bg-white relative">
                {/* Left Sidebar */}
                <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">
                  <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-2 text-indigo-600 mb-6">
                      <FileText className="w-4 h-4" />
                      <h3 className="font-bold text-sm">Dataset Information</h3>
                    </div>

                    <div className="space-y-5 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Dataset ID</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[13px]">{datasetId || 'DS_NEW'}</span>
                          <Copy className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-indigo-600" />
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Uploaded On</p>
                        <p className="text-[13px] text-slate-800 font-medium">
                          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Source File</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-slate-800 font-medium truncate max-w-[160px]">
                            {file?.name || 'WS2_ThermalCVD_Blan...'}
                          </span>
                          <Copy className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-indigo-600 flex-shrink-0" />
                        </div>
                      </div>

                      <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-[12px] font-bold text-green-700 mb-0.5">Status: Active</p>
                        <p className="text-[11px] font-medium text-green-600/80">This dataset is ready for BO.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Confirm Experiment Batches</h2>
                      <p className="text-slate-500 text-[13px]">
                        Samples will be grouped in batches of {samplesPerExperiment}.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500"><Layers className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500">Dataset ID</p>
                          <p className="font-bold text-indigo-600">{datasetId || 'DS_NEW'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-500"><FileText className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500">Total Samples</p>
                          <p className="font-bold text-green-600">{parsedData.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm bg-white">
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Users className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-slate-500">Batch Size</p>
                          <input 
                            type="number"
                            min="1"
                            max="1000"
                            value={samplesPerExperiment}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setSamplesPerExperiment(val);
                            }}
                            className="font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 w-16 text-sm focus:outline-none focus:border-indigo-500 mt-0.5"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Shield className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500">Total Batches</p>
                          <p className="font-bold text-orange-600">{Math.ceil(parsedData.length / samplesPerExperiment)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-600 text-[13px] font-medium leading-tight mb-1">Samples will be grouped in batches of {samplesPerExperiment}.</p>
                      <p className="text-blue-600 text-[13px] font-bold">You can select and lock one batch at a time.</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Select one experiment batch to confirm and lock.</h3>
                    <p className="text-xs text-slate-500">Only one batch can be selected at a time.</p>
                  </div>

                  <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col mb-6">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50 items-center">
                      <div className="col-span-1 text-[11px] font-bold text-slate-800">Select</div>
                      <div className="col-span-3 text-[11px] font-bold text-slate-800 flex items-center gap-1">Experiment Number <Info className="w-3 h-3 text-slate-400" /></div>
                      <div className="col-span-5 text-[11px] font-bold text-slate-800">Samples (Rows)</div>
                      <div className="col-span-2 text-[11px] font-bold text-slate-800 text-center">No. of Samples</div>
                      <div className="col-span-1 text-[11px] font-bold text-slate-800 text-right">Status</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {getExperimentalIds().map((exp, idx) => {
                        const isSelected = confirmedExpIds.has(exp.id);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleExpIdConfirmation(exp.id)}
                            className={`grid grid-cols-12 gap-4 px-6 py-5 border-b border-slate-50 items-center transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/10' : 'hover:bg-slate-50/30'}`}
                          >
                            <div className="col-span-1 flex justify-center w-8">
                              <div className={`w-5 h-5 rounded-full border-[2.5px] flex items-center justify-center transition-all ${isSelected ? 'border-indigo-600' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                              </div>
                            </div>
                            
                            <div className="col-span-3">
                              <p className="font-bold text-[13px] text-indigo-700 mb-1.5">{exp.label}</p>
                              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md">
                                Batch {exp.batchNum}
                              </span>
                            </div>
                            
                            <div className="col-span-5">
                              <p className="text-[12px] text-slate-800 font-bold mb-2">{exp.startRow}–{exp.endRow}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from({ length: exp.endRow - exp.startRow + 1 }).map((_, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full bg-indigo-50/80 text-indigo-600 text-[9px] font-bold flex items-center justify-center border border-indigo-100/50 shadow-sm">
                                    {exp.startRow + i}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="col-span-2 flex justify-center">
                              <div className="px-3.5 py-1.5 font-bold text-[11px] rounded-lg border shadow-sm bg-green-50 text-green-700 border-green-100">
                                {exp.sampleCount}
                              </div>
                            </div>
                            
                            <div className="col-span-1 flex justify-end">
                              {isSelected ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold shadow-sm border border-blue-100">
                                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> Selected
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[11px] font-bold shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Lock
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3 mb-6 flex items-center gap-3">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-600"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    </div>
                    <p className="text-orange-700 text-[12px] font-semibold">After locking this batch, you can proceed with BO optimization.</p>
                  </div>

                  {lockError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 border border-red-200 text-sm font-medium">
                      {lockError}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setStep(2)}
                      className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-[13px] shadow-sm"
                    >
                      Back
                    </button>
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={() => setShowFinalLockModal(true)}
                        disabled={confirmedExpIds.size === 0 || isLocking}
                        className="flex items-center space-x-2 px-10 py-3.5 bg-[#4C3BDE] text-white rounded-xl font-bold hover:bg-[#3D2EB0] transition-all shadow-md text-[13px] disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Confirm & Lock Selected Batch</span>
                      </button>
                      <p className="text-[11px] text-slate-500 font-medium mr-2">You can lock the next batch after this.</p>
                    </div>
                  </div>
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
