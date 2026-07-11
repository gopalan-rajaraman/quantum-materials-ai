import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Optimization from './pages/Optimization';
import Experiments from './pages/Experiments';
import Results from './pages/Results';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Datasets from './pages/Datasets';
import Variables from './pages/Variables';
import Models from './pages/Models';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Docs from './pages/Docs';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    api.fetchMe()
      .then(() => {
        if (isMounted) setIsAuthenticated(true);
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      });
      
    return () => { isMounted = false; };
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signup' || location.pathname === '/login' || location.pathname === '/verify-email' || location.pathname === '/reset-password';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-slate-900 flex font-sans print:bg-white print:block">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto bg-[#F5F6FA] ${location.pathname === '/' ? 'p-0' : 'p-8 pt-12 lg:p-10 lg:pt-14'} print:bg-white print:p-0 print:m-0 print:overflow-visible`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/datasets" element={<ProtectedRoute><Datasets /></ProtectedRoute>} />
          <Route path="/datasets/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/experiments" element={<ProtectedRoute><Experiments /></ProtectedRoute>} />
          <Route path="/variables" element={<ProtectedRoute><Variables /></ProtectedRoute>} />
          <Route path="/optimization" element={<ProtectedRoute><Optimization /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/models" element={<ProtectedRoute><Models /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;