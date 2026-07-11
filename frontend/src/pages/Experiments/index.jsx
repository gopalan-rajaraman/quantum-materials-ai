import React, { useState, useEffect } from 'react';
import { Search, Filter, Database, CheckCircle2, Clock, RefreshCw, Star, Eye, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, Trash2, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Experiments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const showToast = (title, message, type = 'error', onRetry = null) => {
    setToast({ title, message, type, onRetry });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const data = await api.fetchSavedDatasets();
      const backendDatasets = data.datasets || [];
      const drafts = JSON.parse(localStorage.getItem('draftDatasets') || '[]');
      
      // Merge drafts that aren't already in backend datasets
      const backendIds = new Set(backendDatasets.map(d => d.dataset_id || d.id));
      const newDrafts = drafts.filter(d => !backendIds.has(d.id));
      
      setExperiments([...newDrafts, ...backendDatasets]);
    } catch (e) {
      console.error('Failed to fetch experiments', e);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const confirmDelete = (e, id) => {
    e.stopPropagation();
    setDeleteModal(id);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDataset(id);
      fetchExperiments();
      setDeleteModal(null);
      showToast('Dataset deleted', 'The dataset was successfully deleted.', 'success');
    } catch (err) {
      console.error('Error deleting dataset:', err);
      showToast('Delete failed', 'An error occurred while trying to delete the dataset.');
      setDeleteModal(null);
    }
  };

  const handleDownload = async (e, exp) => {
    e.stopPropagation();
    try {
      let experimentsData = [];
      let datasetDoc = exp;
      
      // Try to fetch the full document just to be absolutely sure we have the latest embedded data if it exists
      try {
         const fullDoc = await api.getDataset(exp._id || exp.id);
         if (fullDoc) datasetDoc = fullDoc;
      } catch(e) {
         console.warn("Could not fetch full dataset doc, falling back to exp summary", e);
      }
      
      // 1. Check embedded data
      if (datasetDoc.data && Array.isArray(datasetDoc.data) && datasetDoc.data.length > 0) {
        experimentsData = datasetDoc.data;
      } else if (datasetDoc.experiments && Array.isArray(datasetDoc.experiments) && datasetDoc.experiments.length > 0) {
        experimentsData = datasetDoc.experiments;
      } else {
        // 2. Try the experiments endpoint
        try {
          const data = await api.getDatasetExperiments(exp._id || exp.id, 1, 10000);
          if (data && data.data && Array.isArray(data.data)) {
             experimentsData = data.data;
          } else if (data && data.experiments && Array.isArray(data.experiments)) {
             experimentsData = data.experiments;
          } else if (Array.isArray(data)) {
             experimentsData = data;
          }
        } catch (apiErr) {
          console.warn('Backend fetch failed, possibly a draft dataset without backend experiments.', apiErr);
        }
      }
      
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Dataset');
      
      if (experimentsData.length > 0) {
        // Flatten variables
        const flatData = experimentsData.map((ex, index) => {
          if (ex.variables) {
             return {
               'Experiment Number': ex.experiment_number || index + 1,
               'Type': ex.type || 'historical',
               'FWHM (meV)': parseFloat(ex.fwhm) || '',
               ...ex.variables
             };
          }
          // Fallback if data is already flat
          return { ...ex };
        });
        
        const headers = Object.keys(flatData[0]);
        ws.columns = headers.map(k => ({ header: k, key: k, width: 15 }));
        
        // Add header row styles
        ws.getRow(1).font = { bold: true };
        
        ws.addRows(flatData);
      } else {
        ws.columns = [{ header: 'Message', key: 'msg', width: 30 }];
        ws.addRow({ msg: 'No experiments found in this dataset.' });
      }
      
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = exp.name || 'dataset';
      if (fileName.toLowerCase().endsWith('.json') || fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.xlsx')) {
        fileName = fileName.substring(0, fileName.lastIndexOf('.'));
      }
      
      link.download = `${fileName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Download Complete', 'Dataset downloaded successfully as Excel file.', 'success');
    } catch (err) {
      console.error('Error downloading dataset:', err);
      showToast('Download failed', 'The dataset could not be downloaded. Please try again or contact support.', 'error');
    }
  };

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = (exp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (exp.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const expStatus = (exp.status || '').toLowerCase();
    const isCompletedOrLocked = expStatus === 'completed' || expStatus === 'locked';
    
    let matchesStatus = true;
    if (statusFilter === 'Completed') matchesStatus = isCompletedOrLocked;
    else if (statusFilter === 'In Progress') matchesStatus = !isCompletedOrLocked;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const idA = a.id || '';
    const idB = b.id || '';
    if (idA > idB) return -1;
    if (idA < idB) return 1;
    return 0;
  });

  const totalPages = Math.ceil(filteredExperiments.length / itemsPerPage);
  const displayData = filteredExperiments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in flex flex-col bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden min-w-[340px]">
          <div className="p-4 flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs">✕</div>
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-bold text-slate-900">{toast.title}</h4>
              <p className="text-[13px] text-slate-500 mt-1">{toast.message}</p>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2 flex items-center justify-end space-x-4 border-t border-slate-100">
            {toast.onRetry && (
              <button onClick={toast.onRetry} className="text-[13px] font-bold text-[#4C3BDE] hover:text-[#3D2EB0] transition-colors">
                Retry
              </button>
            )}
            <button onClick={() => setToast(null)} className="text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Dataset</h3>
            <p className="text-[14px] text-slate-500 mb-6">Are you sure you want to delete this dataset? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteModal)} className="px-4 py-2 rounded-lg text-[13px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1b4b] mb-4">Experiments</h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">Manage and track all historical Bayesian Optimization runs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchExperiments}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition-all shadow-sm text-[14px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-[380px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Experiment ID or Dataset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-slate-800 text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#4C3BDE] focus:ring-1 focus:ring-[#4C3BDE] transition-shadow"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
               <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[14px] font-semibold transition-colors"
                >
                  <span>{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                    {['All', 'Completed', 'In Progress'].map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setShowFilterMenu(false); }}
                        className="w-full text-left px-4 py-2 text-[14px] text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                      >
                        {status === 'All' ? 'All Status' : status}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-12"></th>
                <th className="px-4 py-5 whitespace-nowrap">Experiment ID</th>
                <th className="px-4 py-5 whitespace-nowrap">Dataset Used</th>
                <th className="px-4 py-5 whitespace-nowrap">Target Property</th>
                <th className="px-4 py-5 whitespace-nowrap">Status</th>
                <th className="px-4 py-5 whitespace-nowrap">Best FWHM Found</th>

                <th className="px-4 py-5 whitespace-nowrap">Created On</th>
                <th className="px-4 py-5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading experiments...
                  </td>
                </tr>
              ) : displayData && displayData.length > 0 ? (
                displayData.map((exp, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer bg-white" onClick={() => navigate('/results')}>
                    <td className="px-6 py-4 text-center text-slate-300">
                      <Star className="w-[18px] h-[18px] hover:text-slate-400 transition-colors cursor-pointer inline-block" />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-[#4C3BDE] text-[13px]">{exp.id || `EXP-${String(i + 1).padStart(3, '0')}`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-500 shadow-sm">
                           <Database className="w-[18px] h-[18px]" />
                        </div>
                        <div>
                           <div className="font-bold text-slate-800 text-[13px]">{exp.name || '—'}</div>
                           <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{exp.range || exp.id || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-semibold text-[13px]">{exp.target || '—'}</td>
                    <td className="px-4 py-4">
                      {['completed', 'locked'].includes((exp.status || '').toLowerCase()) ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#E8FFF3] text-[#00B050] text-[12px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{exp.status.toLowerCase() === 'locked' ? 'Locked' : 'Completed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F0F2FF] text-[#4C3BDE] text-[12px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-4 font-bold text-[13px] ${['completed', 'locked'].includes((exp.status || '').toLowerCase()) ? 'text-[#00B050]' : 'text-[#4C3BDE]'}`}>
                      {exp.bestValue || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-semibold text-[13px]">{exp.date?.split(' ')[0] || '—'}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{exp.time || (exp.date?.includes(' ') ? exp.date.split(' ')[1] : '')}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={(e) => handleDownload(e, exp)} className="p-1.5 text-slate-400 hover:text-white hover:bg-[#4C3BDE] rounded-md transition-all duration-200" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => confirmDelete(e, exp._id || exp.id)} className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500 rounded-md transition-all duration-200" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-slate-500 text-[14px]">No experiments found. Upload a dataset to get started.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-slate-500 text-[13px] font-medium">
            Showing {filteredExperiments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredExperiments.length)} of {filteredExperiments.length} experiments
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
               >
                  <ChevronLeft className="w-4 h-4" />
               </button>
               
               {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-[13px] transition-colors ${
                        currentPage === pageNum 
                          ? 'bg-[#4C3BDE] text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
               })}
               
               {totalPages > 5 && currentPage < totalPages - 2 && (
                 <>
                   <span className="px-2 text-slate-400 text-[13px]">...</span>
                   <button 
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-50 font-bold text-[13px] transition-colors"
                    >
                      {totalPages}
                    </button>
                 </>
               )}

               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages || totalPages === 0}
                 className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
               >
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
            <div className="flex items-center">
               <div className="relative">
                 <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none flex items-center space-x-2 pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-[13px] font-semibold bg-white shadow-sm focus:outline-none focus:border-[#4C3BDE]"
                 >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                 </select>
                 <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experiments;
