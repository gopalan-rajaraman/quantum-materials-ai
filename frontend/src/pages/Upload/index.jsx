import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Database, ArrowRight, CheckCircle2, Table as TableIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const emptyRow = {
    P1: '', P2: '', CP1: '', CP2: '', FRP1: '', FRP2: '', SA: '', Substrate: '', CG: '', 
    FRA: '', FRH: '', GTE: '', GTI: '', HR: '', Pressure: '', COM: '', PC: '', TOCVD: '', 
    Class: '', PL_Peak: '', PL_FWHM: ''
  };
  const [spreadsheetData, setSpreadsheetData] = useState([
    { ...emptyRow }, { ...emptyRow }, { ...emptyRow }
  ]);
  const [savedDatasets, setSavedDatasets] = useState([]);

  useEffect(() => {
    const fetchSavedDatasets = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/datasets/saved');
        if (res.ok) {
          const data = await res.json();
          setSavedDatasets(data.datasets);
        }
      } catch (error) {
        console.error('Failed to fetch saved datasets:', error);
      }
    };
    fetchSavedDatasets();
  }, [uploadSuccess]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const uploadFilesToBackend = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/api/datasets/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          navigate('/optimization');
        }, 1500);
      } else {
        alert(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Failed to connect to the ML backend. Ensure FastAPI is running.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Dataset Ingestion</h2>
          <p className="text-slate-400 text-lg">Upload files or insert data directly into the online Excel template.</p>
        </div>
        <a href="/quantum_template.csv" download className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md text-cyan-400 font-medium rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all hover:scale-105 active:scale-95">
          <FileSpreadsheet className="w-5 h-5" />
          <span>Download Excel Template</span>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'upload' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
        >
          <UploadCloud className="w-5 h-5" />
          <span>File Upload</span>
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'manual' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
        >
          <TableIcon className="w-5 h-5" />
          <span>Online Excel Template</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'upload' ? (
            <div 
              className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_50px_rgba(6,182,212,0.15)]' 
                : 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 hover:border-slate-500'
            } backdrop-blur-sm mb-8`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 transition-transform duration-300 ${dragActive ? 'scale-110 bg-cyan-500/20' : 'bg-slate-800'}`}>
              <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            </div>
            
            {selectedFiles.length > 0 ? (
              <>
                <h3 className="text-2xl font-semibold text-cyan-400 mb-2">{selectedFiles.length} files selected</h3>
                <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-32 overflow-y-auto z-10 relative">
                  {selectedFiles.map((f, i) => (
                    <span key={i} className="flex items-center space-x-2 px-3 py-1 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
                      <span>{f.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="text-slate-400 hover:text-red-400 transition-colors focus:outline-none"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold text-white mb-2">Drop Multiple Datasets Here</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">Upload up to 10 CSV/Excel files at once. The ML engine will aggregate them for hyperparameter tuning.</p>
              </>
            )}
            
            <input 
              type="file" 
              multiple 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            
            <div className="flex justify-center space-x-4">
              <button onClick={triggerFileSelect} className="relative group overflow-hidden px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all active:scale-95">
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Select Files</span>
                </span>
              </button>
              
              {selectedFiles.length > 0 && (
                <button 
                  onClick={uploadFilesToBackend}
                  disabled={uploading || uploadSuccess}
                  className={`relative group overflow-hidden px-8 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 ${
                    uploadSuccess ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-cyan-600 text-white hover:bg-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                  }`}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    {uploading ? (
                      <span className="animate-pulse">Aggregating Data...</span>
                    ) : uploadSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Tuning Complete</span>
                      </>
                    ) : (
                      <span>Upload to ML Engine</span>
                    )}
                  </span>
                  {!uploading && !uploadSuccess && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>}
                </button>
              )}
            </div>
          </div>
          ) : (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-xl min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Online Excel Template</h3>
                <button 
                  onClick={async () => {
                    setUploading(true);
                    try {
                      const res = await fetch('http://localhost:8000/api/datasets/upload-json', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: spreadsheetData })
                      });
                      if(res.ok) {
                        setUploadSuccess(true);
                        setTimeout(() => navigate('/optimization'), 1500);
                      } else {
                        alert("Failed to tune ML.");
                      }
                    } catch(err) {
                      alert("Error connecting to backend.");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading || uploadSuccess}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadSuccess ? 'bg-emerald-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {uploading ? "Ingesting..." : uploadSuccess ? "Success!" : "Save to Database & Tune ML"}
                </button>
              </div>
              <p className="text-slate-400 mb-6">Directly insert or paste your data into the template below. The ML model will ingest this just like a file upload.</p>
              
              <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/30 max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-cyan-400 border-b border-slate-700 uppercase font-semibold text-xs tracking-wider sticky top-0 z-10">
                    <tr>
                      {Object.keys(emptyRow).map(key => (
                         <th key={key} className="px-4 py-3 border-r border-slate-700 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {spreadsheetData.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                        {Object.keys(emptyRow).map(key => (
                          <td key={key} className="p-0 border-r border-slate-700">
                            <input 
                              type="text" 
                              className={`w-full bg-transparent p-2 outline-none focus:bg-slate-700/50 text-white min-w-[80px] ${['PL_FWHM', 'GTE', 'GTI', 'FRA', 'Pressure'].includes(key) ? 'font-bold text-cyan-300' : ''}`}
                              value={row[key]} 
                              placeholder={`e.g. ${key}`}
                              onChange={(e) => { 
                                const newData = [...spreadsheetData]; 
                                newData[index][key] = e.target.value; 
                                setSpreadsheetData(newData); 
                              }} 
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setSpreadsheetData([...spreadsheetData, { ...emptyRow }])} className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center">
                + Add new row
              </button>
            </div>
          )}
        </div>

        {/* Database Recent Files */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800 h-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Saved Datasets</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6">Datasets previously uploaded and parsed by the ML engine. Select to reuse.</p>

            <div className="space-y-3">
              {savedDatasets.length > 0 ? savedDatasets.map((file, i) => (
                <div key={i} className="group p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-purple-500/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-200 font-medium text-sm truncate max-w-[150px]" title={file.name}>{file.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors group-hover:translate-x-1" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{file.date}</span>
                    <span className="flex items-center"><CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1"/> {file.rows} rows</span>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500 text-sm text-center py-4">No datasets saved yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
