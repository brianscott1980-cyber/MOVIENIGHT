'use client';

import React from 'react';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

interface Step3AiPromptViewProps {
  sessionTitle?: string;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiMovieCount: number;
  setAiMovieCount: (cnt: number) => void;
  isGeneratingAi: boolean;
  aiGenerationStatus: string;
  aiError: string;
  onBackToChoice: () => void;
  onSwitchToSources: () => void;
  onGenerateAiMovies: () => void;
}

const INSPIRATION_CHIPS = [
  '🍿 90s mind-bending psychological thrillers with shocking twists',
  '👻 Fun 80s creature horror comedies & practical effects',
  '☕ Cozy autumn rainy-day heartwarming comfort movies',
  '🚀 Deep space exploration & mind-expanding hard sci-fi',
  '✨ Acclaimed family-friendly animated adventures',
  '🕵️ Witty modern murder mysteries & whodunits',
];

export function Step3AiPromptView({
  sessionTitle = '',
  aiPrompt,
  setAiPrompt,
  aiMovieCount,
  setAiMovieCount,
  isGeneratingAi,
  aiGenerationStatus,
  aiError,
  onBackToChoice,
  onSwitchToSources,
  onGenerateAiMovies,
}: Step3AiPromptViewProps) {
  const cleanTitle = sessionTitle.replace(/^[^\w\s]+\s*/, '').trim();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-fadeIn">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={onBackToChoice}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to choice</span>
            </button>
            <span className="text-slate-600">&bull;</span>
            <button
              type="button"
              onClick={onSwitchToSources}
              className="text-xs text-amber-400 hover:underline transition"
            >
              Switch to sources &amp; genres
            </button>
          </div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Step 3: Generate Movie Lineup with Gemini AI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Describe what you want to watch. Gemini will convert your description to a list of movies, then process them via TMDB on the movies selection view.
          </p>
        </div>
      </div>

      {/* Quick Inspiration Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Quick Inspiration (Click to use):
        </span>
        <div className="flex flex-wrap gap-2">
          {/* Current Session Title Pill */}
          {cleanTitle && (
            <button
              type="button"
              onClick={() => setAiPrompt(cleanTitle)}
              className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/70 bg-gradient-to-r from-amber-950/70 via-purple-950/50 to-amber-950/70 hover:border-amber-400 text-amber-200 hover:text-white transition active:scale-95 font-bold flex items-center gap-1.5 shadow-md glow-gold"
            >
              <span>🎯 Use Current Title:</span>
              <span className="font-extrabold text-white underline decoration-amber-400/60">
                &ldquo;{cleanTitle}&rdquo;
              </span>
            </button>
          )}

          {INSPIRATION_CHIPS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setAiPrompt(sample.replace(/^[^\w\s]+\s*/, ''))}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-purple-950/40 hover:border-purple-500/50 text-slate-300 hover:text-white transition active:scale-95"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div className="space-y-2">
        <label htmlFor="ai-movie-prompt" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Describe the movies you want:
        </label>
        <textarea
          id="ai-movie-prompt"
          rows={3}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g. 90s action thrillers with suspenseful cat-and-mouse chases, like The Fugitive, Speed, and Heat..."
          disabled={isGeneratingAi}
          className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-sm leading-relaxed"
        />
      </div>

      {/* Options bar: movie count & action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Movies to generate:</span>
          {[6, 8, 10, 12, 24, 36].map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => setAiMovieCount(cnt)}
              disabled={isGeneratingAi}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                aiMovieCount === cnt
                  ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cnt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSwitchToSources}
            disabled={isGeneratingAi}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
          >
            Choose Sources &amp; Genres Instead
          </button>
          <button
            type="button"
            onClick={onGenerateAiMovies}
            disabled={!aiPrompt.trim() || isGeneratingAi}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              !aiPrompt.trim() || isGeneratingAi
                ? 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25 glow-cyan cursor-pointer'
            }`}
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                <span>{aiGenerationStatus || 'Generating with Gemini...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Generate Movies &amp; Process via TMDB ✨</span>
              </>
            )}
          </button>
        </div>
      </div>

      {aiError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{aiError}</span>
        </div>
      )}
    </div>
  );
}
