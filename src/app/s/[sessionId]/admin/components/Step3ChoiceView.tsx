'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Step3ChoiceViewProps {
  onSelectAi: () => void;
  onSelectSources: () => void;
}

export function Step3ChoiceView({ onSelectAi, onSelectSources }: Step3ChoiceViewProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <span>Step 3: How Would You Like to Curate Your Movies?</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pick your streaming sources and genres manually from our catalogue, or describe what you feel like watching and let AI assisted curation create a custom lineup processed via TMDB.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {/* Option 1: Choose from Sources and Genres (Manual Filter) */}
        <button
          type="button"
          onClick={onSelectSources}
          className="group relative p-6 sm:p-7 rounded-3xl border-2 border-amber-500/40 hover:border-amber-400 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 text-left transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between gap-5 active:scale-[0.99]"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🎛️
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                Manual Filter
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                Choose from Sources &amp; Genres
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Select specific streaming providers (Netflix, Prime, Disney+, Apple TV+, Plex Library), film genres, and age certification limits to filter our catalogue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 group-hover:text-amber-300">
            <span>Filter by Sources &amp; Genres</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Option 2: AI Assisted */}
        <button
          type="button"
          onClick={onSelectAi}
          className="group relative p-6 sm:p-7 rounded-3xl border-2 border-purple-500/40 hover:border-purple-400 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 text-left transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between gap-5 active:scale-[0.99]"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ✨
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                AI Assisted
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                Use AI to Generate from Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Describe your movie night theme, mood, or favorite film vibes (e.g. &ldquo;90s sci-fi mind benders&rdquo;, &ldquo;fun 80s creature horror comedies&rdquo;, &ldquo;cozy autumn mysteries&rdquo;). AI will convert your description to a list of movies, which are then processed via TMDB on the movies selection view.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold text-purple-300 group-hover:text-purple-200">
            <span>Start with AI Assisted Description</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
