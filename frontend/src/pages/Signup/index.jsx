import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Building2, Briefcase, GraduationCap } from 'lucide-react';

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
    <div className="min-h-screen flex">
      {/* Left side - Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a1464] via-[#4338ca] to-[#2e1065] relative overflow-hidden flex-col justify-center px-16">
        
        {/* Abstract shapes for background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[40rem] h-[40rem] bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-purple-500/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
          
          {/* Wave effect at bottom - mockup simulation */}
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#1e1b4b] to-transparent opacity-80"></div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path fill="rgba(79, 70, 229, 0.4)" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,176C672,160,768,128,864,133.3C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full transform rotate-45"></div>
            </div>
            <span className="text-2xl font-bold">BO Loop</span>
          </div>

          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Optimize.<br />
            Learn.<br />
            <span className="text-indigo-300">Converge.</span>
          </h1>
          <p className="text-lg text-indigo-100/80 mb-12">
            AI-powered Bayesian Optimization<br />
            with Active Learning
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mt-8 relative">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="font-semibold">Your experiments.</span>
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="font-semibold">Our intelligence.</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="font-semibold">Smarter discoveries.</span>
            </div>
            
            {/* Dashboard Mockup abstract illustration */}
            <div className="absolute right-[-20%] top-[-50%] w-64 h-64 opacity-50 transform rotate-12 scale-75">
              <div className="w-full h-full bg-white rounded-xl shadow-2xl p-4 flex flex-col gap-2">
                <div className="h-8 bg-indigo-100 rounded w-1/3"></div>
                <div className="flex-1 flex gap-2">
                  <div className="w-2/3 bg-indigo-50 rounded"></div>
                  <div className="w-1/3 bg-purple-50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-indigo-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Create your account</h2>
            <p className="text-slate-500">Join BO Loop to start optimizing your experiments.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5 space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Full Name</span>
              </label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5 space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email</span>
              </label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5 space-x-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a password" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50 pr-10"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-1.5 space-x-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Confirm Password</span>
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirm your password" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50 pr-10"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3.5 rounded-xl font-semibold transition-all mt-4 shadow-lg shadow-indigo-500/30"
            >
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
