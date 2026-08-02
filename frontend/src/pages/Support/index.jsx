import React, { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import api from '../../services/api';

const Support = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    category: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.category || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.submitSupportRequest({
        full_name: formData.fullName,
        email: formData.email,
        category: formData.category,
        message: formData.message
      });
      setSuccessData(response);
    } catch (err) {
      setError(err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ fullName: '', email: '', category: '', message: '' });
    setSuccessData(null);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-800">
            {successData ? 'Request Submitted' : 'Contact Support'}
          </h2>
          {!successData && (
            <p className="text-slate-500 mt-2 text-sm">
              Please fill out the form below and we will get back to you as soon as possible.
            </p>
          )}
        </div>

        <div className="p-8">
          {successData ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Message Sent Successfully</h3>
              <p className="text-slate-600 mb-8 text-base max-w-md mx-auto">
                Thank you for contacting BO-LAB. Your request has been received successfully. Our team will respond to your email as soon as possible.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-8 inline-block text-left min-w-[200px]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Ticket ID</p>
                <p className="text-xl font-mono font-medium text-slate-800">{successData.ticket_id}</p>
              </div>
              <div>
                <button
                  onClick={handleReset}
                  className="bg-[#6D5EF5] hover:bg-[#5D3EBC] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6D5EF5]/20 focus:border-[#6D5EF5] transition-all text-sm outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6D5EF5]/20 focus:border-[#6D5EF5] transition-all text-sm outline-none"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6D5EF5]/20 focus:border-[#6D5EF5] transition-all text-sm outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Account & Login">Account & Login</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6D5EF5]/20 focus:border-[#6D5EF5] transition-all text-sm outline-none resize-y min-h-[120px]"
                  placeholder="Describe your issue or question in detail..."
                  required
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#6D5EF5] hover:bg-[#5D3EBC] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Support;
