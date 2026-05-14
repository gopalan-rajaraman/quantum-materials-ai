import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-cyan-500 rounded-full animate-pulse"></div>
      </div>
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
        Next-Generation <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Quantum Materials AI
        </span>
      </h1>
      <p className="text-lg text-slate-400 max-w-2xl mb-10">
        AI-driven Experimental Optimization Platform utilizing Gaussian Process surrogate models and Active Learning to accelerate material discovery.
      </p>
      <div className="flex space-x-4">
        <Link to="/upload" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-cyan-500/20">
          Start New Experiment
        </Link>
        <Link to="/dashboard" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700">
          View Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Home;
