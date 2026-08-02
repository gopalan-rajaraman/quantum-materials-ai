import React, { useState } from 'react';
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
  BookOpen,
  Menu,
  X,
  LogIn,
} from 'lucide-react';
import { getStoredUser, getUserDisplayName, logout } from '../../utils/auth';
 
const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;
  const loggedInUser = getStoredUser();
  const isLoggedIn = !!(loggedInUser?._id || loggedInUser?.email || loggedInUser?.full_name || loggedInUser?.username);
  const displayName = getUserDisplayName(loggedInUser);
  const displayRole = loggedInUser?.role || 'Researcher';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout(navigate);
  };
 
  const NavItem = ({ path, icon: Icon, label }) => {
    const active = isActive(path);
    return (
      <Link 
        to={path} 
        onClick={() => setIsOpen(false)}
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
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-[#0D0B2E] text-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-[40]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`w-[260px] bg-[#0D0B2E] min-h-screen h-screen sticky top-0 p-5 flex flex-col justify-between shrink-0 text-white select-none print:hidden transition-transform duration-300 z-[50] max-lg:fixed max-lg:left-0 max-lg:-translate-x-full ${isOpen ? 'max-lg:translate-x-0' : ''}`}>
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
          <span className="text-[14px] font-bold tracking-tight text-white leading-tight">BO-LAB</span>
        </div>
 
        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          <NavItem path="/dashboard" icon={Home} label="Dashboard" />
          <NavItem path="/experiments" icon={FlaskConical} label="Experiments" />
          <NavItem path="/datasets" icon={Database} label="Datasets" />
          <NavItem path="/variables" icon={LayoutGrid} label="Variables" />
          <NavItem path="/results" icon={TrendingUp} label="Results" />
          <NavItem path="/models" icon={Boxes} label="Models" />
          <NavItem path="/docs" icon={BookOpen} label="Documentation" />
          <NavItem path="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>
 
      <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
        {/* User Profile / Sign In */}
        {isLoggedIn ? (
          <div className="flex flex-col gap-2 p-3 bg-[#1C184B]/50 rounded-xl border border-white/5">
            <div className="flex items-center space-x-3 px-1">
              <div className="w-[40px] h-[40px] rounded-full bg-[#6D5EF5] flex items-center justify-center text-white font-[600] text-[18px] shrink-0">
                {initial}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[14px] font-semibold text-white leading-tight truncate">{displayName}</p>
                <p className="text-[#8C8CA1] text-[11px] font-medium mt-0.5 capitalize">{displayRole}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#FCA5A5] hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-semibold">Log out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#5D3EBC] text-white font-semibold text-[14px] hover:bg-[#6D4ED0] transition-colors shadow-lg shadow-[#5D3EBC]/30"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>Sign In</span>
          </Link>
        )}


      </div>
      </aside>
    </>
  );
};
 
export default Sidebar;