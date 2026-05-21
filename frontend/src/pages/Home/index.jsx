import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200"></div>
      <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl"></div>
      <div className="absolute right-0 top-28 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"></div>
      <div className="absolute -bottom-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl"></div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-slate-50 shadow-lg shadow-slate-900/10">
            QM
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Quantum Materials AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 sm:px-10">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-700 shadow-sm shadow-sky-200/70">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
              AI-Powered Materials Discovery
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Next-Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600">Quantum Materials AI</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                AI-driven experimental optimization platform utilizing Gaussian Process surrogate models and active learning to accelerate material discovery.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/signup" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:bg-slate-800">
                Get Started
              </Link>
              <Link to="/upload" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50">
                Start New Experiment
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">Smarter Experiments</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">AI suggests the most informative experiments.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">Faster Discoveries</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Active learning accelerates your research.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-600">Reliable Insights</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Uncertainty quantification you can trust.</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-300/40">
            <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-cyan-100/70 blur-3xl"></div>
            <div className="absolute -left-8 bottom-12 h-24 w-24 rounded-full bg-violet-100/70 blur-3xl"></div>
            <div className="relative space-y-8">
              <div className="rounded-3xl bg-slate-50 p-6 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Built for Researchers</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-950">Powered by AI</h2>
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                    <span className="text-sm font-semibold">AI</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5 shadow-sm shadow-slate-200/60">
                  <p className="text-sm text-slate-500">Experiment performance</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">92%</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 shadow-sm shadow-slate-200/60">
                  <p className="text-sm text-slate-500">Discovery speed</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">3.4x</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-slate-100 p-6 shadow-sm shadow-slate-200/60">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Confidence score</span>
                  <span className="text-slate-950 font-semibold">0.87</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20">
                    87%
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Recommended run</p>
                    <p className="text-lg font-semibold text-slate-950">Thermal CVD batch 5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
