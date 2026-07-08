import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Activity, FileSpreadsheet, Target } from 'lucide-react';

const MapColumns = ({ 
  datasetId, 
  file, 
  setStep, 
  importSessionId, 
  setImportSessionId, 
  columnMapping, 
  setColumnMapping,
  optimizationVariables,
  setOptimizationVariables,
  numericalColumns,
  fileColumns
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parsedCols, setParsedCols] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Parse File if no session yet
        let session = importSessionId;
        let cols = fileColumns || [];
        
        if (!session) {
          const parseRes = await api.parseDataset([file], "Thermal CVD");
          session = parseRes.import_session_id;
          cols = parseRes.columns;
          setImportSessionId(session);
        }
        
        setParsedCols(cols);

        // Auto-select some mapping if empty
        if (Object.keys(columnMapping).length === 0) {
          const initialMapping = {};
          
          // Try to auto-detect PL FWHM
          const fwhmMatch = cols.find(c => c.toLowerCase().includes('fwhm') || c.toLowerCase().includes('target'));
          if (fwhmMatch) initialMapping['PL_FWHM'] = fwhmMatch;

          setColumnMapping(initialMapping);
        }

      } catch (err) {
        setError(err.message || "Failed to parse dataset");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [file, importSessionId]);

  const handleMappingChange = (varName, colName) => {
    setColumnMapping(prev => {
      const next = { ...prev };
      if (colName === "") {
        delete next[varName];
      } else {
        next[varName] = colName;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#4C3BDE]" />
        <p>Parsing file and extracting columns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200">
        <h3 className="font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Error parsing dataset</h3>
        <p className="mt-2 text-sm">{error}</p>
        <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 bg-white text-red-600 rounded shadow-sm border border-red-200 font-semibold text-sm">Go Back</button>
      </div>
    );
  }

  const hasTarget = !!columnMapping['PL_FWHM'];
  const has4OptVars = optimizationVariables.length === 4;
  const isReady = hasTarget && has4OptVars;

  // Derive numerical columns for optimization vars (use passed prop if available, else filter parsedCols naively)
  const availableNumerical = numericalColumns && numericalColumns.length > 0 
    ? numericalColumns 
    : parsedCols; // Fallback if index.jsx didn't pass it yet

  return (
    <div className="animate-fade-in flex flex-col h-full text-slate-800">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-slate-900 mb-1">Select Dataset Columns</h2>
        <p className="text-slate-500 text-[14px]">Identify your core identifiers, target variables, and exactly 4 optimization variables.</p>
      </div>

      <div className="mb-6 max-w-xl">

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <Target className="w-5 h-5" />
            <h3 className="text-[15px] font-bold text-slate-900">Target Variable</h3>
          </div>
          <label className="block text-[12px] font-bold text-slate-700 mb-2">
            Target Variable (e.g. PL FWHM) <span className="text-red-500">*</span>
          </label>
          <select
            value={columnMapping['PL_FWHM'] || ""}
            onChange={(e) => handleMappingChange('PL_FWHM', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-3"
          >
            <option value="">-- Select Column --</option>
            {parsedCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-2">The output value that Bayesian Optimization will minimize or maximize.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1 mb-8">
        <div className="flex items-center gap-2 mb-2 text-blue-600">
          <Activity className="w-5 h-5" />
          <h3 className="text-[15px] font-bold text-slate-900">Optimization Variables</h3>
        </div>
        <p className="text-slate-500 text-[13px] mb-4">
          Select <strong className="text-blue-700">exactly 4 numerical columns</strong> that the Bayesian Optimization loop will explore.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableNumerical.filter(c => c !== columnMapping['PL_FWHM']).map(col => {
            const isSelected = optimizationVariables.includes(col);
            const isMaxedOut = !isSelected && optimizationVariables.length >= 4;
            
            return (
              <div 
                key={col}
                onClick={() => {
                  if (isSelected) {
                    setOptimizationVariables(prev => prev.filter(v => v !== col));
                  } else if (!isMaxedOut) {
                    setOptimizationVariables(prev => [...prev, col]);
                  }
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                } ${isMaxedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-[12px] font-bold truncate mr-2" title={col}>{col}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
        
        {optimizationVariables.length !== 4 && (
          <div className="mt-6 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-[12px] font-semibold">
            <AlertCircle className="w-4 h-4" />
            Please select {4 - optimizationVariables.length} more optimization {4 - optimizationVariables.length === 1 ? 'variable' : 'variables'}.
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-auto">
        <button 
          onClick={() => setStep(1)}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Back
        </button>
        <button 
          onClick={() => setStep(3)}
          disabled={!isReady}
          className={`px-6 py-2.5 text-[13px] font-bold rounded-xl flex items-center gap-2 transition-all ${
            isReady 
              ? 'bg-[#4C3BDE] text-white hover:bg-[#3f31b8] shadow-md shadow-[#4C3BDE]/20' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isReady ? 'Confirm Selection & Proceed' : 'Complete Selection to Proceed'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MapColumns;
