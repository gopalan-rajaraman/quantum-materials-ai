import React, { useState, useEffect } from 'react';
import { Database, FolderOpen, ChevronRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Optimization from '../Optimization';

const Results = () => {
  // View state: LOADING | NO_DATASET | SELECT_DATASET | RESULTS
  const [view, setView] = useState('LOADING');
  const [loading, setLoading] = useState(true);
  const [activeDataset, setActiveDataset] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadResults() {
      try {
        // Step 1: Check for active dataset
        const activeResp = await api.getActiveDataset();

        if (!activeResp.active_dataset) {
          // No active dataset — check if user has any datasets
          const datasetsResp = await api.fetchDatasets();

          if (!datasetsResp.datasets || datasetsResp.datasets.length === 0) {
            setView('NO_DATASET');
          } else {
            setDatasets(datasetsResp.datasets);
            setView('SELECT_DATASET');
          }
          setLoading(false);
          return;
        }

        // Active dataset exists
        setActiveDataset(activeResp.active_dataset);
        setView('RESULTS');
      } catch (err) {
        console.error("Results load error:", err);
        setError({ message: err.message, status: err.status || 500 });
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  // Handle activating a dataset from the selector
  const handleActivateDataset = async (datasetId) => {
    setActivatingId(datasetId);
    try {
      await api.activateDataset(datasetId);
      // Reload the page to trigger the full Results flow
      window.location.reload();
    } catch (err) {
      setError({ message: err.message, status: err.status || 500 });
      setActivatingId(null);
    }
  };

  // ─── LOADING ────────────────────────────────────────────
  if (loading && view === 'LOADING') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-medium text-slate-700">Loading Results…</div>
        <p className="text-slate-500 mt-2">Checking your dataset status.</p>
      </div>
    );
  }

  // ─── NO DATASET ─────────────────────────────────────────
  if (view === 'NO_DATASET') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Dataset Yet</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Upload a dataset to start Bayesian Optimization. Once you have data, the AI will help you find optimal synthesis parameters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/datasets/upload')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Dataset</span>
            </button>
            <button
              onClick={() => navigate('/datasets')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              <Database className="w-5 h-5" />
              <span>Browse Datasets</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECT DATASET ─────────────────────────────────────
  if (view === 'SELECT_DATASET') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[600px]">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a Dataset</h2>
            <p className="text-slate-500">Choose a dataset to continue with Bayesian Optimization results.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
              {error.message || 'An error occurred'}
            </div>
          )}

          <div className="space-y-3">
            {datasets.map((ds) => (
              <div
                key={ds._id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200">
                    <Database className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{ds.name || 'Unnamed Dataset'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ds.row_count || ds.total_experiments || 0} experiments · {ds.status || 'ready'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleActivateDataset(ds._id)}
                  disabled={activatingId === ds._id}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activatingId === ds._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Opening…</span>
                    </>
                  ) : (
                    <>
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/datasets/upload')}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              + Upload a new dataset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────
  if (view === 'RESULTS') {
    return <Optimization />;
  }

  return null;
};

export default Results;
