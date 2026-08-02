import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Briefcase, Building2, Calendar, Lock,
  FlaskConical, Info, ChevronDown, LogOut
} from 'lucide-react';
import { getStoredUser, getUserDisplayName, logout } from '../../utils/auth';
 
const Settings = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
 
  const loggedInUser = getStoredUser();
  const displayName = getUserDisplayName(loggedInUser);
  const displayEmail = loggedInUser.email || '—';
  const displayRole = loggedInUser.role || 'Researcher';
 
  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e1b4b] mb-1">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account and experiment preferences.</p>
      </div>
 
      {/* Account Settings Layout */}
      <div className="flex justify-start">
 
        {/* Account Settings Card */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
          {/* Card Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#4C3BDE]">1. Account Settings</h2>
              <p className="text-[12px] text-slate-500 font-medium">Manage your personal and account details.</p>
            </div>
          </div>
 
          {/* Fields */}
          <div className="space-y-6">
            <div className="flex items-center space-x-5 py-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-500">Name</span>
                <span className="text-[13px] font-bold text-slate-800">{displayName}</span>
              </div>
            </div>
 
            <div className="flex items-center space-x-5 py-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-500">Email</span>
                <span className="text-[13px] font-bold text-slate-800">{displayEmail}</span>
              </div>
            </div>
 
            <div className="flex items-center space-x-5 py-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-500">Role</span>
                <span className="px-3 py-1 bg-[#F4F0FF] text-[#4C3BDE] text-[11px] font-bold rounded-md border border-[#4C3BDE]/10">
                  {displayRole}
                </span>
              </div>
            </div>
 
            <div className="flex items-center space-x-5 py-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-500">Institute / Organization</span>
                <span className="text-[13px] font-bold text-slate-800">BO Loop Labs</span>
              </div>
            </div>
 
            <div className="flex items-center space-x-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-500">Member Since</span>
                <span className="text-[13px] font-bold text-slate-800">15 May 2026</span>
              </div>
            </div>
          </div>
 
          {/* Change Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="mt-8 w-full flex items-center justify-center space-x-3 py-3.5 rounded-xl border-2 border-[#4C3BDE]/20 text-[#4C3BDE] hover:bg-[#F4F0FF] transition-all font-bold text-[13px]"
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => logout(navigate)}
            className="mt-3 w-full flex items-center justify-center space-x-3 py-3.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all font-bold text-[13px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
 

      </div>
 
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-fade-in">
            <h3 className="text-[17px] font-bold text-[#1e1b4b] mb-1">Change Password</h3>
            <p className="text-[12px] text-slate-500 mb-6">Enter your current and new password below.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Current Password</label>
                <input type="password" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">New Password</label>
                <input type="password" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                <input type="password" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4C3BDE]" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2.5 bg-[#4C3BDE] text-white rounded-lg font-bold text-[13px] hover:bg-[#3D2EB0] transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Settings;
 