import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Building2, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    institute: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          department: formData.department,
          institute: formData.institute,
          role: formData.role,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // In a real app, you'd show email verification message
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] font-sans">
      {/* Left side - Banner */}
      <div className="hidden lg:flex lg:w-[45%] bg-white relative overflow-hidden flex-col justify-center px-16 xl:px-24">
        
        {/* Wave effect at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-[55%] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] to-[#2e1065] rounded-t-[100%] scale-[1.8] origin-bottom translate-y-[40%]"></div>
          {/* Subtle dotted pattern overlay for the wave */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] rounded-t-[100%] scale-[1.8] origin-bottom translate-y-[40%]"></div>
        </div>

        <div className="relative z-10 max-w-lg mb-20 -mt-20">
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="#7C3AED" fillOpacity="0.2"/>
                <path d="M20 5L33.8564 13V27L20 35L6.14359 27V13L20 5Z" fill="#7C3AED"/>
                <path d="M20 10L28.6603 15V25L20 30L11.3397 25V15L20 10Z" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">BO Loop</span>
          </div>

          <h1 className="text-[4rem] font-black mb-6 leading-[1.05] tracking-tight text-slate-900">
            Optimize.<br />
            Learn.<br />
            <span className="text-[#6366f1]">Converge.</span>
          </h1>
          <p className="text-[1.1rem] text-slate-500 mb-16 font-medium max-w-sm leading-relaxed">
            AI-powered Bayesian Optimization<br />
            with Active Learning
          </p>

          {/* Dark card at bottom left */}
          <div className="bg-[#0A0524] text-white rounded-2xl p-7 shadow-2xl relative overflow-hidden mt-16 w-72 border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/10">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                </div>
                <span className="font-semibold text-[13px] tracking-wide">Your experiments.</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center"></div>
                <span className="font-semibold text-[13px] tracking-wide text-slate-300">Our intelligence.</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center"></div>
                <span className="font-semibold text-[13px] tracking-wide text-slate-300">Smarter discoveries.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 overflow-y-auto h-screen">
        <div className="w-full max-w-[500px] bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-slate-100 my-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Create your account</h2>
            <p className="text-slate-500 text-sm font-medium">Join BO Loop to start optimizing your experiments.</p>
          </div>

          {success ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Registration Successful!</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">A verification email has been sent to your email address. Please verify your account to continue.</p>
              <div className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-semibold text-sm">
                Redirecting to login...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Full Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name" 
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 placeholder-slate-400 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email" 
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 placeholder-slate-400 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Department</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Materials Science, Physics" 
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 placeholder-slate-400 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Institute */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Institute Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="institute"
                      value={formData.institute}
                      onChange={handleChange}
                      placeholder="e.g., IIT Bombay, MIT" 
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 placeholder-slate-400 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>Role</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                    </div>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 shadow-sm appearance-none"
                      required
                    >
                      <option value="" disabled className="text-slate-400">Select your role</option>
                      <option value="student">Student</option>
                      <option value="researcher">Researcher</option>
                      <option value="professor">Professor</option>
                      <option value="postdoc">Postdoctoral Fellow</option>
                      <option value="industry">Industry Professional</option>
                      <option value="other">Other</option>
                    </select>
                    {/* Custom select arrow */}
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password" 
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 placeholder-slate-400 shadow-sm"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="flex items-center text-[13px] font-semibold text-slate-700 mb-2 space-x-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Confirm Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password" 
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-[14px] text-slate-900 placeholder-slate-400 shadow-sm"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#5E48E8] hover:bg-[#4d3bcc] text-white py-3.5 rounded-xl font-semibold transition-all mt-6 shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-[14px]">
              Already have an account? <Link to="/login" className="text-[#5E48E8] font-bold hover:underline ml-1">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
