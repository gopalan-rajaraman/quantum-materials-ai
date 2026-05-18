import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, Infinity, Database, SlidersHorizontal, BarChart2, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }) => {
    const active = isActive(path);
    return (
      <Link 
        to={path} 
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
          active 
            ? 'bg-[#3730a3] text-white' 
            : 'text-slate-400 hover:bg-[#3730a3]/20 hover:text-slate-200'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-[#1e1b4b] border-r border-[#312e81] min-h-[calc(100vh-73px)] p-4 flex flex-col justify-between">
      <div>
        <nav className="space-y-1">
          <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem path="/experiments" icon={FlaskConical} label="Experiments" />
          <NavItem path="/optimization" icon={Infinity} label="BO Loop" />
          <NavItem path="/datasets" icon={Database} label="Datasets" />
          <NavItem path="/variables" icon={SlidersHorizontal} label="Variables" />
          <NavItem path="/results" icon={BarChart2} label="Results" />
          <NavItem path="/reports" icon={FileText} label="Reports" />
          <NavItem path="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>

      <div className="mt-8 flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
          K
        </div>
        <div>
          <p className="text-white text-sm font-medium">Khushboo</p>
          <p className="text-slate-400 text-xs">Researcher</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
