import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0B0F19] text-[#8C8CA1] py-12 px-8 w-full mt-auto print:hidden border-t border-[#1C184B]">
      <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between gap-10 lg:gap-16">
        
        {/* Product Column */}
        <div className="flex flex-col gap-3 min-w-[140px]">
          <h4 className="text-white font-semibold mb-2">Product</h4>
          <Link to="/dashboard" className="text-[14px] hover:text-white transition-colors">Dashboard</Link>
          <Link to="/datasets" className="text-[14px] hover:text-white transition-colors">Datasets</Link>
          <Link to="/experiments" className="text-[14px] hover:text-white transition-colors">Experiments</Link>
          <Link to="/models" className="text-[14px] hover:text-white transition-colors">Models</Link>
          <Link to="/results" className="text-[14px] hover:text-white transition-colors">Results</Link>
          <Link to="#" className="text-[14px] hover:text-white transition-colors">Analytics</Link>
        </div>

        {/* About Column */}
        <div className="flex flex-col gap-3 min-w-[140px]">
          <h4 className="text-white font-semibold mb-2">About</h4>
          <Link to="/docs" className="text-[14px] hover:text-white transition-colors">Documentation</Link>
        </div>

        {/* Contact Us Column */}
        <div className="flex flex-col gap-3 min-w-[140px]">
          <h4 className="text-white font-semibold mb-2">Contact Us</h4>
          <Link to="/support" className="text-[14px] hover:text-white transition-colors">Help and Support</Link>
        </div>

        {/* Supported by Column */}
        <div className="flex flex-col gap-4 min-w-[280px] lg:border-l lg:border-[#1C184B] lg:pl-10">
          <h4 className="text-white font-semibold mb-2">Supported by</h4>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shrink-0">
              <img src="/NQM.png" alt="NQM" className="w-full h-full object-contain" />
            </div>
            <span className="text-[14px] text-slate-300">National Quantum Mission (NQM)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1e3a5f] font-bold text-[12px] leading-none shrink-0">
              QMD
            </div>
            <span className="text-[14px] text-slate-300">Quantum Materials and Devices (QMD)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 shrink-0">
              <img src="/DST.png" alt="DST" className="w-full h-full object-contain" />
            </div>
            <span className="text-[14px] text-slate-300">Department of Science & Technology (DST)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shrink-0">
              <img src="/IIT.png" alt="IIT Bombay" className="w-full h-full object-contain" />
            </div>
            <span className="text-[14px] text-slate-300">IIT Bombay</span>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
