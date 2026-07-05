import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FlaskConical, 
  Database, 
  LayoutGrid, 
  TrendingUp, 
  Boxes, 
  Settings, 
  ChevronDown, 
  Hexagon,
  LogOut,
} from 'lucide-react';
import { getStoredUser, getUserDisplayName, logout } from '../../utils/auth';
 
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isActive = (path) => location.pathname === path;
  const loggedInUser = getStoredUser();
  const displayName = getUserDisplayName(loggedInUser);
  const displayRole = loggedInUser?.role || 'Researcher';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout(navigate);
  };
 
  const NavItem = ({ path, icon: Icon, label }) => {
    const active = isActive(path);
    return (
      <Link 
        to={path} 
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-1.5 transition-all duration-200 ${
          active 
            ? 'bg-[#5D3EBC] text-white shadow-lg shadow-[#5D3EBC]/30' 
            : 'text-[#8C8CA1] hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8C8CA1]'}`} />
        <span className="font-medium text-[15px]">{label}</span>
      </Link>
    );
  };
 
  return (
    <aside className="w-[260px] bg-[#0D0B2E] min-h-screen h-screen sticky top-0 p-5 flex flex-col justify-between shrink-0 text-white select-none print:hidden">
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 px-2 py-4 mb-6">
          <div className="relative flex items-center justify-center">
            <Hexagon className="w-10 h-10 text-[#6366f1] fill-[#6366f1]" />
            <div className="absolute">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2"/>
                <ellipse cx="12" cy="12" rx="10" ry="4.5"/>
                <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/>
                <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"/>
              </svg>
            </div>
          </div>
          <span className="text-[14px] font-bold tracking-tight text-white leading-tight">Quantum<br/>Materials AI</span>
        </div>
 
        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          <NavItem path="/dashboard" icon={Home} label="Dashboard" />
          <NavItem path="/experiments" icon={FlaskConical} label="Experiments" />
          <NavItem path="/datasets" icon={Database} label="Datasets" />
          <NavItem path="/variables" icon={LayoutGrid} label="Variables" />
          <NavItem path="/results" icon={TrendingUp} label="Results" />
          <NavItem path="/models" icon={Boxes} label="Models" />
          <NavItem path="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>
 
      <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
        {/* User Profile */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white font-semibold text-[15px] shadow-inner">
                {initial}
              </div>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-white leading-tight">{displayName}</p>
                <p className="text-[#8C8CA1] text-[11px] font-medium mt-0.5 capitalize">{displayRole}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#8C8CA1] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1C184B] border border-[#2B256B] rounded-xl shadow-xl overflow-hidden z-20">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#FCA5A5] hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[13px] font-semibold">Log out</span>
              </button>
            </div>
          )}
        </div>
 
        {/* Glow Info Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1C184B] to-[#120F38] border border-[#2B256B] p-4 text-center">
          {/* Neon Floating Chart SVG */}
          <div className="flex justify-center mb-1">
            <svg className="w-full h-24" viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="cardGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="glowBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="neonPath" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="50" r="40" fill="url(#cardGlow)" />
              {/* Wireframe Grid */}
              <line x1="20" y1="30" x2="140" y2="30" stroke="#251E62" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="55" x2="140" y2="55" stroke="#251E62" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="140" y2="80" stroke="#251E62" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="#251E62" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="110" y1="10" x2="110" y2="90" stroke="#251E62" strokeWidth="0.8" strokeDasharray="3 3" />
 
              {/* Bars */}
              <rect x="40" y="60" width="8" height="20" rx="1.5" fill="url(#glowBar)" />
              <rect x="52" y="48" width="8" height="32" rx="1.5" fill="url(#glowBar)" />
              <rect x="98" y="40" width="8" height="40" rx="1.5" fill="url(#glowBar)" />
              <rect x="110" y="55" width="8" height="25" rx="1.5" fill="url(#glowBar)" />
 
              {/* Line chart overlay */}
              <path d="M 25 75 Q 50 35 80 60 T 135 25" fill="none" stroke="url(#neonPath)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="135" cy="25" r="3" fill="#60A5FA" />
            </svg>
          </div>
          <p className="text-[13px] font-medium text-slate-200 leading-snug">
            Your experiments.
          </p>
          <p className="text-[13px] font-medium text-slate-200 leading-snug">
            Our intelligence.
          </p>
          <p className="text-[13px] font-semibold text-purple-400 mt-1 leading-snug">
            Smarter discoveries.
          </p>
        </div>
      </div>
    </aside>
  );
};
 
export default Sidebar;