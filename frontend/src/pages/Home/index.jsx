import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 opacity-95"></div>
      <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"></div>
      <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent"></div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30">
            QM
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Quantum Materials AI</p>
            <p className="text-sm text-slate-300">AI-Powered Materials Discovery</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-200 transition hover:text-white">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pb-16 sm:px-10 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 shadow-sm shadow-cyan-500/10">
            <span className="mr-2 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            AI-driven experimental optimization for next-gen materials
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Next-Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400">Quantum Materials AI</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            AI-driven experimental optimization platform utilizing Gaussian Process surrogate models and active learning to accelerate material discovery.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-8 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-400">
              Get Started
            </Link>
            <Link to="/upload" className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-8 py-4 text-base font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800">
              Start New Experiment
            </Link>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/5 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Smarter Experiments</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">AI suggests the most informative experiments.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/5 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Faster Discoveries</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Active learning accelerates your research.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/5 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Reliable Insights</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Uncertainty quantification you can trust.</p>
            </div>
          </div>
        </section>

        <section className="relative flex-1">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/50 sm:p-8">
            <div className="absolute -right-16 top-8 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl"></div>
            <div className="absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl"></div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-950/80 p-4 shadow-inner shadow-black/20">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active Learning</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Experiment performance</h2>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300">AI</div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 w-3/4 rounded-full bg-cyan-400"></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-3xl bg-slate-950/90 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Model accuracy</p>
                  <p className="text-3xl font-semibold text-white">92%</p>
                </div>
                <div className="space-y-2 rounded-3xl bg-slate-950/90 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Discovery speed</p>
                  <p className="text-3xl font-semibold text-white">3.4x</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-cyan-500/10 bg-slate-950/90 p-6">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Confidence score</span>
                <span className="text-white font-semibold">0.87</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500/70 p-1">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-white">87%</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Recommended run</p>
                  <p className="text-lg font-semibold text-white">Thermal CVD batch 5</p>
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
