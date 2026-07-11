import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Lock, CheckCircle2, ChevronRight, BarChart2, Check, ArrowRight, PieChart, Info, Thermometer, Clock, Wind, Gauge, FlaskConical, Copy, Trash2, ChevronDown, Activity, List, FileText, Layers, Users, Shield, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import MapColumns from './MapColumns';
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
  // Track if we've already reserved a counter slot this session to avoid
  // double-incrementing when the user re-uploads or changes the file.
  const sessionDatasetCountRef = useRef(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState({ numerical: [], categorical: [] });
  const [optimizationVariables, setOptimizationVariables] = useState([]);
  
  const [isParsing, setIsParsing] = useState(false);
  const [uploadDate, setUploadDate] = useState(null);
  const [distributions, setDistributions] = useState({});
  const [selectedVariables, setSelectedVariables] = useState({});
  const [activeTab, setActiveTab] = useState('numerical');
  const [variableUnits, setVariableUnits] = useState({});
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [autoGenFileName, setAutoGenFileName] = useState('');
  const [datasetObjectId, setDatasetObjectId] = useState('');
  const [constantsSchema, setConstantsSchema] = useState([]);
  const [boConstants, setBoConstants] = useState({});
  const [customConstants, setCustomConstants] = useState({});
  const [totalRows, setTotalRows] = useState(0);

  React.useEffect(() => {
    const fetchConstantsSchema = async () => {
      try {
        const varsRes = await api.getExperimentVariables("Thermal CVD");
        if (varsRes.constants) {
          setConstantsSchema(varsRes.constants);
          const initialConstants = {};
          varsRes.constants.forEach(c => {
            if (c.type === 'categorical' && c.options && c.options.length > 0) {
              initialConstants[c.name] = c.options[0];
            } else if (c.type === 'numeric') {
              initialConstants[c.name] = 0;
            }
          });
          setBoConstants(prev => Object.keys(prev).length === 0 ? initialConstants : prev);
        }
      } catch (e) {
        console.error("Failed to fetch constants schema:", e);
      }
    };
    fetchConstantsSchema();
  }, []);

  const updateBoConstant = (field, value) => {
    setBoConstants(prev => ({ ...prev, [field]: value }));
    if (value !== 'Other') {
      setCustomConstants(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateCustomConstant = (field, value) => {
    setCustomConstants(prev => ({ ...prev, [field]: value }));
  };

  
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState(null);
  const [confirmedExpIds, setConfirmedExpIds] = useState(new Set());
  const [showFinalLockModal, setShowFinalLockModal] = useState(false);
  const [searchSpace, setSearchSpace] = useState([]);
  const [variableRanges, setVariableRanges] = useState({});
  const [dynamicRanges, setDynamicRanges] = useState(null);

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6'];

  React.useEffect(() => {
    const initDatasetCount = async () => {
      if (sessionDatasetCountRef.current !== null) return;
      try {
        const data = await api.fetchSavedDatasets();
        sessionDatasetCountRef.current = (data?.datasets?.length || 0) + 1;
      } catch (e) {
        console.error("Failed to fetch dataset count:", e);
      }
    };
    initDatasetCount();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const parseFile = async (selectedFile) => {
    setFile(selectedFile);
    setColumnMapping({});
    setOptimizationVariables([]);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length > 0) {
          const headers = Object.keys(data[0] || {});
          let numColsCount = 0;
          headers.forEach(key => {
            let isNum = true;
            for (let i = 0; i < Math.min(data.length, 10); i++) {
              let val = data[i][key];
              if (val !== undefined && val !== null && val !== '' && val !== 'NS') {
                if (typeof val === 'string' && isNaN(Number(val))) {
                  isNum = false;
                  break;
                }
              }
            }
            if (isNum) numColsCount++;
          });

          if (numColsCount < 5) {
            alert('At least 5 numerical columns are required (1 target + 4 optimization variables).');
            setFile(null);
            return;
          }

          if (sessionDatasetCountRef.current === null) {
            try {
              const res = await api.fetchSavedDatasets();
              sessionDatasetCountRef.current = (res?.datasets?.length || 0) + 1;
            } catch (e) {
              const lastSavedCount = parseInt(localStorage.getItem('datasetCount') || '0');
              sessionDatasetCountRef.current = lastSavedCount + 1;
            }
          }
          const currentDatasetCount = sessionDatasetCountRef.current;
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
              Exp_Number: expId
            };
          });

          setDatasetId(dsId);
          setUploadDate(new Date());
          setParsedData(dataWithIds);
          setTotalRows(dataWithIds.length);
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

    // Calculate dynamic ranges for Optimization Variables (matches backend logic)
    const calcDynamicRanges = {};
    numerical.forEach(v => {
      let vals = [];
      for (let i = 0; i < data.length; i++) {
        let val = data[i][v];
        if (val !== undefined && val !== null && val !== 'NS' && val !== '') {
          let num = Number(val);
          if (!isNaN(num)) vals.push(num);
        }
      }
      if (vals.length > 0) {
        const sum = vals.reduce((a, b) => a + b, 0);
        const avg = sum / vals.length;
        const minVal = Math.min(...vals);
        const maxVal = Math.max(...vals);
        calcDynamicRanges[v] = {
          min: Math.max(0, avg - minVal),
          max: avg + maxVal
        };
      }
    });
    setDynamicRanges(calcDynamicRanges);
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
  const [importSessionId, setImportSessionId] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});

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
      // Separate categorical and numerical constants based on schema
      const catConstants = {};
      const numConstants = {};
      
      constantsSchema.forEach(c => {
        if (c.type === 'categorical') {
          catConstants[c.name] = boConstants[c.name] === 'Other' ? customConstants[c.name] : boConstants[c.name];
        } else if (c.type === 'numeric') {
          numConstants[c.name] = parseFloat(boConstants[c.name]) || 0;
        }
      });

      const response = await api.confirmImport({ 
        import_session_id: importSessionId, 
        mapping: columnMapping, 
        cat_constants: catConstants, 
        num_constants: numConstants,
        optimization_variables: optimizationVariables
      });

      // Store the Mongo document ID for the uploaded dataset so lock can be persisted.
      if (response.inserted_id) {
        setDatasetObjectId(response.inserted_id);
        await api.lockDataset(response.inserted_id);
        await api.activateDataset(response.inserted_id); // Auto-activate newly uploaded dataset
      }

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
    const stepsList = [
      { id: 1, name: '1. Upload File', desc: file ? file.name : '' },
      { id: 2, name: '2. Select Columns', desc: 'Identify target & variables' },
      { id: 3, name: '3. Dataset Details', desc: 'Configure experiment settings' },
      { id: 4, name: '4. Confirm & Preview', desc: 'Review before import' },
      { id: 5, name: '5. Import & Train', desc: 'Create dataset & train GP' }
    ];

    const isStep2Complete = columnMapping['PL_FWHM'] && optimizationVariables.length === 4;

    return (
      <div className="w-[280px] flex-shrink-0 pr-6 border-r border-slate-100 hidden md:block">
        <h2 className="text-lg font-bold text-slate-900 mb-8">Dataset Upload</h2>
        
        <div className="space-y-6 relative mb-12">
          {/* Vertical line connecting steps */}
          <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-100 z-0"></div>
          
          {stepsList.map((s) => (
            <div key={s.id} className={`flex relative z-10 ${step === s.id ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0 transition-colors
                ${step === s.id ? 'bg-[#4C3BDE] text-white ring-4 ring-indigo-50' : 
                  step > s.id ? 'bg-[#10b981] text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div className="ml-4">
                <div className={`text-[13px] font-bold ${step === s.id ? 'text-[#4C3BDE]' : 'text-slate-700'}`}>
                  {s.name}
                </div>
                {s.desc && (
                  <div className={`text-[11px] mt-0.5 ${step === s.id ? 'text-indigo-500 font-medium' : 'text-slate-500'}`}>
                    {s.desc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upload Summary Box */}
        {file && step > 1 && (
          <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 animate-fade-in">
            <h4 className="text-[13px] font-bold text-slate-900 mb-4">Upload Summary</h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">File Name</p>
                <p className="text-[12px] font-medium text-slate-800 truncate" title={file.name}>{file.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Sheet</p>
                <p className="text-[12px] font-medium text-slate-800">Sheet1</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Rows (after mapping)</p>
                <p className="text-[12px] font-medium text-slate-800">{parsedData.length || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Selected Variables</p>
                <p className="text-[12px] font-medium text-slate-800">{optimizationVariables.length} / 4</p>
              </div>
              <div className="pt-2">
                <button onClick={() => setStep(2)} className="text-[#4C3BDE] text-[12px] font-bold hover:underline flex items-center gap-1">
                  View Selection <ExternalLink className="w-3 h-3" />
                </button>
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
              <MapColumns
                datasetId={datasetId}
                file={file}
                setStep={setStep}
                importSessionId={importSessionId}
                setImportSessionId={setImportSessionId}
                columnMapping={columnMapping}
                setColumnMapping={setColumnMapping}
                optimizationVariables={optimizationVariables}
                setOptimizationVariables={setOptimizationVariables}
                numericalColumns={columnsInfo.numerical}
                fileColumns={Object.keys(selectedVariables)}
              />
            )}

            {step === 3 && (
              <div className="animate-fade-in flex flex-col h-full w-full max-w-[1000px] mx-auto mt-4">
                <div className="mb-8">
                  <h2 className="text-[22px] font-bold text-slate-900 mb-1">Step 3: Dataset Details & Experiment Configuration</h2>
                  <p className="text-slate-500 text-[14px]">
                    Provide dataset information and set the global experiment configuration (constants).
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-indigo-600">
                      <FileText className="w-5 h-5" />
                      <h3 className="text-[15px] font-bold text-slate-900">Dataset Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">
                          Dataset Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          value={datasetName}
                          onChange={(e) => setDatasetName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4C3BDE] focus:ring-1 focus:ring-[#4C3BDE] text-[13px] text-slate-800"
                        />
                        <p className="text-[11px] text-slate-500 mt-2">A unique, descriptive name for this dataset.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 bg-indigo-50/50 rounded-xl border border-indigo-100 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4 text-[#4C3BDE]">
                      <Info className="w-4 h-4" />
                      <h4 className="font-bold text-[13px]">About Experiment Configuration</h4>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      These values are constant for all experiments in this dataset. They describe the setup and materials used and are not expected to change between rows.
                    </p>
                  </div>
                </div>

                {/* Experiment Configuration Section */}
                {constantsSchema.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8 flex-1">
                    <div className="flex items-center gap-2 mb-1 text-purple-600">
                      <FlaskConical className="w-5 h-5" />
                      <h3 className="text-[15px] font-bold text-slate-900">
                        Experiment Configuration (Constants)
                      </h3>
                    </div>
                    <p className="text-slate-500 text-[12px] mb-6">
                      Set the fixed parameters for this experiment. These values will be applied to all rows in this dataset.
                    </p>

                    {/* Categorical Constants */}
                    <div className="mb-8">
                      <h4 className="font-bold text-slate-900 mb-4 text-[13px]">Categorical Constants</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {constantsSchema.filter(c => c.type === 'categorical').map(c => (
                          <div key={c.name}>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                              {c.label || c.name}
                              <Info className="w-3 h-3 text-slate-400" />
                            </label>
                            <div className="relative">
                              <select
                                value={boConstants[c.name] || ''}
                                onChange={(e) => updateBoConstant(c.name, e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4C3BDE] focus:ring-1 focus:ring-[#4C3BDE] text-[12px] text-slate-800 bg-white hover:bg-slate-50 transition-colors appearance-none"
                              >
                                {c.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Other">Other...</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            {boConstants[c.name] === 'Other' && (
                              <div className="mt-3 animate-fade-in">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                                  Custom Value <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder={`Enter ${c.label ? c.label.toLowerCase() : c.name.toLowerCase()}...`}
                                  value={customConstants[c.name] || ''}
                                  onChange={(e) => updateCustomConstant(c.name, e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4C3BDE] focus:ring-1 focus:ring-[#4C3BDE] text-[12px] text-slate-800 bg-white"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Numerical Constants */}
                    <div className="mb-6">
                      <h4 className="font-bold text-slate-900 mb-4 text-[13px]">Numerical Constants</h4>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {constantsSchema.filter(c => c.type === 'numeric').map(c => (
                          <div key={c.name}>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                              {c.label || c.name}
                              <Info className="w-3 h-3 text-slate-400" />
                            </label>
                            <input
                              type="number"
                              value={boConstants[c.name] !== undefined ? boConstants[c.name] : ''}
                              onChange={(e) => updateBoConstant(c.name, e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#4C3BDE] focus:ring-1 focus:ring-[#4C3BDE] text-[12px] text-slate-800 bg-white hover:bg-slate-50 transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Banner */}
                    <div className="bg-purple-50/50 rounded-lg border border-purple-100 p-4 flex items-center gap-3">
                      <Zap className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className="text-[12px] font-medium text-purple-800">
                        Categorical constants use predefined values. Click "Other..." to enter a custom value.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pb-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all shadow-sm text-[13px] flex items-center gap-2"
                  >
                    Back to Selection
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const drafts = JSON.parse(localStorage.getItem('draftDatasets') || '[]');
                        const existing = drafts.find(d => d.id === datasetId);
                        if (existing) {
                          existing.name = datasetName || existing.name;
                          localStorage.setItem('draftDatasets', JSON.stringify(drafts));
                        }
                        alert("Draft saved successfully! You can resume it from the Datasets page later.");
                      }}
                      className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all shadow-sm text-[13px]"
                    >
                      Save Draft
                    </button>
                    <button 
                      onClick={() => {
                        if (!datasetName.trim()) {
                          alert("Please provide a dataset name.");
                          return;
                        }


                        const missingCustoms = constantsSchema.filter(c => c.type === 'categorical' && boConstants[c.name] === 'Other' && (!customConstants[c.name] || !customConstants[c.name].trim()));
                        if (missingCustoms.length > 0) {
                          alert(`Please provide a custom value for: ${missingCustoms.map(c => c.label || c.name).join(', ')}`);
                          return;
                        }
                        setStep(4);
                      }}
                      className="px-6 py-2.5 bg-[#1d4ed8] text-white rounded-lg font-bold hover:bg-[#1e40af] transition-all shadow-md text-[13px] flex items-center space-x-2"
                    >
                      <span>Continue to Review</span>
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
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Confirm Dataset Import</h2>
                      <p className="text-slate-500 text-[13px]">
                        Review the total number of experiments and lock the dataset to proceed.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
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
                          <p className="text-[11px] font-bold text-slate-500">Total Samples to Import</p>
                          <p className="font-bold text-green-600">{parsedData.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-600 text-[13px] font-medium leading-tight mb-1">All {parsedData.length} experiments will be imported as the initial training set.</p>
                      <p className="text-blue-600 text-[13px] font-bold">Locking the dataset will initialize the BO engine.</p>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3 mb-6 flex items-center gap-3">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-600"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    </div>
                    <p className="text-orange-700 text-[12px] font-semibold">After locking this dataset, you can proceed with BO optimization.</p>
                  </div>

                  {lockError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 border border-red-200 text-sm font-medium">
                      {lockError}
                    </div>
                  )}
                  
                  <div className="flex-1"></div>

                  <div className="flex justify-between items-center mt-auto">
                    <button 
                      onClick={() => setStep(2)}
                      className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-[13px] shadow-sm"
                    >
                      Back
                    </button>
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={() => {
                          setShowFinalLockModal(true);
                        }}
                        disabled={isLocking}
                        className="flex items-center space-x-2 px-10 py-3.5 bg-[#4C3BDE] text-white rounded-xl font-bold hover:bg-[#3D2EB0] transition-all shadow-md text-[13px] disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Confirm & Lock Dataset</span>
                      </button>
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
                            onClick={() => {
                              setShowFinalLockModal(false);
                              setConfirmedExpIds(new Set());
                            }} 
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
