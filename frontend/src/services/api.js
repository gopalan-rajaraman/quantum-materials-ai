const API_BASE_URL = 'http://localhost:8000';

const request = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    ...options,
  });
  
  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }
  
  return response.json();
};

export const api = {
  // Auth
  login: (email, password) => 
    request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    
  signup: (username, email, password) => 
    request('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    }),

  // Datasets
 fetchDashboardStats: () => request('/api/datasets/dashboard-stats'),
fetchSavedDatasets: () => request('/api/datasets/list'),
  
  uploadDataset: async (files, catConstants = {}, numConstants = {}) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    // Add constants as JSON strings
    if (Object.keys(catConstants).length > 0) {
      formData.append('cat_constants', JSON.stringify(catConstants));
    }
    if (Object.keys(numConstants).length > 0) {
      formData.append('num_constants', JSON.stringify(numConstants));
    }
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const url = `${API_BASE_URL}/api/datasets/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      let errDetail = 'Failed to upload dataset';
      try {
        const errJson = await response.json();
        errDetail = errJson.detail || errDetail;
      } catch (_) {}
      throw new Error(errDetail);
    }
    return response.json();
  },

  uploadJsonDataset: (data, name) =>
    request('/api/datasets/upload-json', {
      method: 'POST',
      body: JSON.stringify({ data, name })
    }),

  lockDataset: (id) => request(`/api/datasets/${id}/lock`, { method: 'POST' }),
  unlockDataset: (id) => request(`/api/datasets/${id}/unlock`, { method: 'POST' }),
  deleteDataset: (id) => request(`/api/datasets/${id}`, { method: 'DELETE' }),
  getDataset: (id) => request(`/api/datasets/${id}`),

  // Thermal CVD Model
  fetchModelInfo: () => request('/thermal-cvd/info'),
  fetchTimeline: () => request('/thermal-cvd/timeline'),
  fetchConstants: () => request('/thermal-cvd/constants'),
  updateConstantsBatch: (constants) =>
    request('/thermal-cvd/constants/batch', {
      method: 'POST',
      body: JSON.stringify({ constants })
    }),
  predictFWHM: (payload) => 
    request('/thermal-cvd/predict', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  
  suggestExperiments: (n = 5) => 
    request('/thermal-cvd/suggest', {
      method: 'POST',
      body: JSON.stringify({ n_suggestions: n })
    }),

  runOptimization: (nSteps = 10) => 
    request('/thermal-cvd/optimize', {
      method: 'POST',
      body: JSON.stringify({ n_steps: nSteps })
    }),

  simulateExperiment: () => 
    request('/thermal-cvd/simulate-run', { method: 'POST' }),

  addManualExperiment: (payload) => 
    request('/thermal-cvd/add-experiment', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getPlotData: (sliceMode = 'suggestion') => request(`/thermal-cvd/plot-data?slice_mode=${sliceMode}`),
  getBoProgress: () => request('/thermal-cvd/bo-progress'),
  fetchVariablesDistribution: () => request('/thermal-cvd/variables-distribution'),
};

export default api;
