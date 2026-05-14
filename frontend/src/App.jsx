import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Optimization from './pages/Optimization';
import Experiments from './pages/Experiments';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={null} />
            <Route path="*" element={<Sidebar />} />
          </Routes>
          
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/optimization" element={<Optimization />} />
              <Route path="/results" element={<Results />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
