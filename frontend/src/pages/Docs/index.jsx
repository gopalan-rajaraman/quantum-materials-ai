import React from 'react';
import { BookOpen, Database, Target, LineChart, HelpCircle } from 'lucide-react';

const Docs = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Documentation</h1>
            <p className="text-slate-500 mt-1">Learn how to use Quantum Materials AI</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* What is BO */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Target size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Bayesian Optimization</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Bayesian Optimization (BO) is a strategy for the global optimization of black-box functions. In materials science, it allows you to find the optimal experimental parameters (e.g., temperature, pressure, time) to maximize a target property (e.g., yield, conductivity, strength) with the fewest possible experiments.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            The platform uses a Gaussian Process (GP) surrogate model to predict outcomes and an Acquisition Function (like Expected Improvement) to suggest the next best experiment.
          </p>
        </div>

        {/* Dataset Formatting */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Database size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Dataset Formatting</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Upload your historical experimental data in <b>CSV or Excel</b> format. The platform requires a clean dataset without merged cells or complex headers.
          </p>
          <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
            <li>Ensure the first row contains exact column names.</li>
            <li>No empty rows or columns between data.</li>
            <li>Numerical values should not contain units in the cells (e.g., use "150" instead of "150 C").</li>
            <li>Categorical variables will be automatically one-hot encoded.</li>
          </ul>
        </div>

        {/* Column Mapping */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <LineChart size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Column Mapping</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            After uploading, you must define the role of each column:
          </p>
          <ul className="text-sm text-slate-600 space-y-2 mt-3 ml-2 border-l-2 border-slate-100 pl-3">
            <li><strong className="text-slate-800">Target:</strong> The property you want to optimize (e.g., Bandgap). Specify if you want to maximize or minimize.</li>
            <li><strong className="text-slate-800">Feature:</strong> Input parameters you can control (e.g., Temperature, Precursor Flow). Provide minimum and maximum bounds for the optimizer.</li>
            <li><strong className="text-slate-800">Ignore:</strong> Metadata columns (e.g., Date, Notes) that shouldn't be fed to the ML model.</li>
          </ul>
        </div>

        {/* Logging Experiments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Logging Experiments</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            The true power of the platform is the iterative <b>closed-loop</b> optimization:
          </p>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li>Generate a <b>Suggestion</b> from the Optimization page.</li>
            <li>Perform the physical experiment in your lab using those parameters.</li>
            <li>Measure the target outcome.</li>
            <li>Click <b>Log Result</b> to feed the actual measurement back into the platform.</li>
            <li>The model automatically retrains, improving its accuracy for the next suggestion!</li>
          </ol>
        </div>

      </div>

      {/* Support section */}
      <div className="bg-slate-900 rounded-xl shadow-sm p-8 text-center text-white">
        <h2 className="text-xl font-bold mb-2">Need more help?</h2>
        <p className="text-slate-300 text-sm mb-6 max-w-lg mx-auto">
          If you encounter any issues, require custom ML architectures, or want to discuss enterprise deployments, our team is here to assist.
        </p>
        <a href="mailto:support@quantummaterials.ai" className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm">
          Contact Support
        </a>
      </div>
      
    </div>
  );
};

export default Docs;
