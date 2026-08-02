import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, LogOut, Settings, X, MessageSquare, Bug, Lightbulb, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, getUserDisplayName, logout } from '../../utils/auth';
import api from '../../services/api';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const helpRef = useRef(null);
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const data = await api.fetchNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    if (getStoredUser()) {
      loadNotifs();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };
  
  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };
  
  const loggedInUser = getStoredUser();
  const displayName = getUserDisplayName(loggedInUser);
  const email = loggedInUser?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout(navigate);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setIsHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-transparent px-8 py-5 flex items-center justify-between sticky top-0 z-40 mb-2">
      {/* Search Bar Removed */}
      <div className="flex-1 max-w-lg">
      </div>

      {/* Right side items */}
      <div className="flex items-center space-x-5 ml-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative text-[#8C8CA1] hover:text-[#5D3EBC] transition-colors p-1 focus:outline-none"
          >
            <Bell className="w-[22px] h-[22px]" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 bg-[#6D5EF5] text-white text-[9px] font-bold rounded-full border-2 border-[#F5F6FA]">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span onClick={markAllAsRead} className="text-[12px] font-semibold text-[#6D5EF5] cursor-pointer hover:underline">Mark all as read</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-500 text-[13px]">No notifications yet.</div>
                ) : notifications.map((notif) => (
                  <div key={notif.id} className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors flex items-start space-x-3 group ${notif.is_read ? 'opacity-75 hover:bg-slate-50' : 'bg-indigo-50/30 hover:bg-indigo-50/60'}`}>
                    <div className="text-[16px] leading-none mt-0.5">{notif.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${notif.is_read ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>{notif.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    <button onClick={(e) => deleteNotif(notif.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <button className="text-[13px] font-semibold text-slate-600 hover:text-[#6D5EF5] transition-colors">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Dropdown */}
        <div className="relative" ref={helpRef}>
          <button 
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="text-[#8C8CA1] hover:text-[#5D3EBC] transition-colors p-1 focus:outline-none"
          >
            <HelpCircle className="w-[22px] h-[22px]" strokeWidth={1.8} />
          </button>
          
          {isHelpOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <a href="/docs" className="flex items-center space-x-3 px-4 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] transition-colors">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Documentation</span>
              </a>
              <button 
                onClick={() => { setIsHelpOpen(false); navigate('/support'); }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>Contact Support</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] transition-colors">
                <Bug className="w-4 h-4 text-slate-400" />
                <span>Report a Bug</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] transition-colors">
                <Lightbulb className="w-4 h-4 text-slate-400" />
                <span>Request a Feature</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] transition-colors">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>FAQ</span>
              </button>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 ml-2 p-1 rounded-full hover:bg-slate-200/50 transition-colors focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-[#6D5EF5] flex items-center justify-center text-white font-[600] text-[16px] shadow-sm">
              {initial}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" strokeWidth={2} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[14px] font-semibold text-slate-800 truncate">{displayName}</p>
                <p className="text-[13px] text-slate-500 truncate mt-0.5">{email}</p>
              </div>

              {/* Menu Items */}
              <div className="px-2 py-2">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div></div>
                  <span>My Profile</span>
                </button>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] rounded-lg transition-colors">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </button>
                <button 
                  onClick={() => { setIsDropdownOpen(false); navigate('/support'); }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] text-slate-600 font-medium hover:bg-slate-50 hover:text-[#6D5EF5] rounded-lg transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Help & Support</span>
                </button>
              </div>

              <div className="px-2 pb-1 border-t border-slate-100 pt-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
