import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded bg-cyan-500 flex items-center justify-center font-bold text-slate-900">
          Q
        </div>
        <span className="text-xl font-bold text-white tracking-wide">
          QMat<span className="text-cyan-400">AI</span>
        </span>
      </div>
      <div className="flex items-center space-x-6 text-sm text-slate-300">
        <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <Link to="/experiments" className="hover:text-cyan-400 transition-colors">Experiments</Link>
        <Link to="/upload" className="hover:text-cyan-400 transition-colors">Upload</Link>
        <Link to="/optimization" className="hover:text-cyan-400 transition-colors">Optimization</Link>
        <div className="w-8 h-8 rounded-full bg-slate-700 ml-4 border border-slate-600"></div>
      </div>
    </nav>
  );
};

export default Navbar;
