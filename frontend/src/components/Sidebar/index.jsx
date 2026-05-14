import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const linkClasses = (path) => 
    `block px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
      isActive(path) 
        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`;

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-800 min-h-[calc(100vh-73px)] p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">Menu</div>
      <nav>
        <Link to="/dashboard" className={linkClasses('/dashboard')}>Dashboard</Link>
        <Link to="/experiments" className={linkClasses('/experiments')}>Experiments</Link>
        <Link to="/upload" className={linkClasses('/upload')}>Upload Data</Link>
        
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4 px-4">Active Learning</div>
        <Link to="/optimization" className={linkClasses('/optimization')}>BO Loop</Link>
        <Link to="/results" className={linkClasses('/results')}>Model Results</Link>
      </nav>


    </aside>
  );
};

export default Sidebar;
