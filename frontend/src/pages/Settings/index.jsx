import React, { useState } from 'react';
import {
  User, Mail, Briefcase, Building2, Calendar, Lock,
  FlaskConical, Info, ChevronDown
} from 'lucide-react';

const Settings = () => {
  const [boIterations, setBoIterations] = useState('10');
  const [optGoal, setOptGoal] = useState('Minimize FWHM');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Get logged-in user from localStorage safely
  const userStr = localStorage.getItem('user');
  let loggedInUser = {};
  try {
    loggedInUser = userStr ? JSON.parse(userStr) : {};
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
    loggedInUser = {};
  }
  const displayName = loggedInUser.username || loggedInUser.name || 'Khushboo';
  const displayEmail = loggedInUser.email || 'khushboo.research@boloop.com';
  const displayRole = loggedInUser.role || 'Researcher';

  return (
    <div className="animate-fade-in flex flex-col min-h-screen space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e1b4b] mb-1">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account and experiment preferences.</p>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Card: Account Settings */}
        <div className="lg:w-1/2 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
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
        </div>

        {/* Right Card: Experiment Defaults */}
        <div className="lg:w-1/2 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
          {/* Card Header */}
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-[#F4F0FF] flex items-center justify-center text-[#4C3BDE]">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#4C3BDE]">2. Experiment Defaults</h2>
              <p className="text-[12px] text-slate-500 font-medium">Set your default preferences for new experiments.</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-8">
            {/* Default BO Iterations */}
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-8">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[14px] font-bold text-slate-800">Default BO Iterations</span>
                  <div className="relative group cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <div className="absolute left-6 -top-2 w-48 bg-slate-800 text-white text-[11px] font-medium rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Number of iterations for Bayesian Optimization
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-slate-400 font-medium">Number of iterations for Bayesian Optimization</p>
              </div>
              <div className="relative flex-shrink-0">
                <select
                  value={boIterations}
                  onChange={e => setBoIterations(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-800 py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-[#4C3BDE] cursor-pointer w-[120px]"
                >
                  <option>5</option>
                  <option>10</option>
                  <option>15</option>
                  <option>20</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Optimization Goal */}
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-8">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[14px] font-bold text-slate-800">Optimization Goal</span>
                  <div className="relative group cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <div className="absolute left-6 -top-2 w-48 bg-slate-800 text-white text-[11px] font-medium rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Objective for optimization
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-slate-400 font-medium">Objective for optimization</p>
              </div>
              <div className="relative flex-shrink-0">
                <select
                  value={optGoal}
                  onChange={e => setOptGoal(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-800 py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-[#4C3BDE] cursor-pointer w-[160px]"
                >
                  <option>Minimize FWHM</option>
                  <option>Maximize FWHM</option>
                  <option>Minimize Loss</option>
                  <option>Maximize Efficiency</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-10 bg-[#F4F0FF] border border-[#4C3BDE]/15 rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-4 h-4 text-[#4C3BDE] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-[#4C3BDE]">These defaults will be applied to</p>
              <p className="text-[12px] font-medium text-[#4C3BDE]/80">All newly created Bayesian Optimization experiments.</p>
            </div>
          </div>
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
