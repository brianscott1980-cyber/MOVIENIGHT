'use client';

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Film,
  Tv,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { STREAMING_PLATFORMS, GENRE_INFO } from '@/data/moviesData';
import { AgeRatingLimit, Movie } from '@/types';

interface Step3SourcesViewProps {
  allMovies: Movie[];
  allowedSources: string[];
  allowedGenres: string[];
  ageRatingLimit: AgeRatingLimit;
  totalMatchingCriteriaMovies: Movie[];
  onToggleSource: (sourceName: string) => void;
  onSelectAllSources: () => void;
  onClearAllSources: () => void;
  onToggleAllowedGenre: (genreKey: string) => void;
  onSelectAllGenres: () => void;
  onClearAllGenres: () => void;
  onSetAgeRatingLimit: (limit: AgeRatingLimit) => void;
  onBackToChoice: () => void;
  onSwitchToAi: () => void;
  onContinueToStep4: () => void;
}

const AGE_RATING_OPTIONS = [
  { value: 'ALL', label: 'Any Rating', desc: 'No certification limit' },
  { value: 'U/G', label: 'U / G', desc: 'Family & all ages' },
  { value: 'PG', label: 'PG', desc: 'Parental guidance' },
  { value: '12/PG-13', label: '12 / PG-13', desc: 'Teens & general' },
  { value: '15/R', label: '15 / R', desc: 'Older teens & adults' },
  { value: '18/NC-17', label: '18 / NC-17', desc: 'Adults only' },
];

export function Step3SourcesView({
  allMovies,
  allowedSources,
  allowedGenres,
  ageRatingLimit,
  totalMatchingCriteriaMovies,
  onToggleSource,
  onSelectAllSources,
  onClearAllSources,
  onToggleAllowedGenre,
  onSelectAllGenres,
  onClearAllGenres,
  onSetAgeRatingLimit,
  onBackToChoice,
  onSwitchToAi,
  onContinueToStep4,
}: Step3SourcesViewProps) {
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
              onClick={onSwitchToAi}
              className="text-xs text-purple-400 hover:underline transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Use AI assisted instead</span>
            </button>
          </div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-400" />
            <span>Step 3: Movie Sources &amp; Content Criteria</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Limit movie choices to selected sources, genres, and age ratings. Leave sources or genres unselected to include all.
          </p>
        </div>

        {/* Matching count badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {totalMatchingCriteriaMovies.length} matching films in catalogue
            </span>
          </div>
        </div>
      </div>

      {/* 1. Available Sources (Streaming & Plex) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Tv className="w-4 h-4 text-amber-400" />
            <span>Limit movie choices to these sources ({allowedSources.length === 0 ? 'All Sources' : `${allowedSources.length} Selected`})</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAllSources}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition"
            >
              Select All
            </button>
            <span className="text-slate-600 text-xs">|</span>
            <button
              type="button"
              onClick={onClearAllSources}
              className="text-[11px] text-slate-400 hover:text-white transition"
            >
              Clear limits
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          No sources selected means all sources are included. Select one or more to limit movie choices.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {STREAMING_PLATFORMS.map((platform) => {
            const isSelected = allowedSources.includes(platform.id);
            const count = allMovies.filter((m) =>
              (m.streamingSources || []).includes(platform.id)
            ).length;

            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => onToggleSource(platform.id)}
                className={`p-3 min-h-[72px] rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 active:scale-95 ${
                  isSelected
                    ? platform.name === 'Plex Library'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-800 text-white border-amber-400 shadow-sm font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{platform.emoji}</span>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-current" />
                  ) : (
                    <Square className="w-4 h-4 opacity-40" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block truncate">{platform.name}</span>
                  <span className="text-[10px] opacity-75">{count} movies</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Allowed Genres */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>🎭</span>
            <span>Limit movie choices to these genres ({allowedGenres.length === 0 ? 'All Genres' : `${allowedGenres.length} Selected`})</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAllGenres}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition"
            >
              Select All
            </button>
            <span className="text-slate-600 text-xs">|</span>
            <button
              type="button"
              onClick={onClearAllGenres}
              className="text-[11px] text-slate-400 hover:text-white transition"
            >
              Clear limits
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          No genres selected means all genres are included. Select one or more to limit movie choices.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(GENRE_INFO).map(([key, meta]) => {
            const isSelected = allowedGenres.includes(key);
            const count = allMovies.filter((m) => m.genre === key).length;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleAllowedGenre(key)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between active:scale-95 ${
                  isSelected
                    ? 'border-amber-400/80 bg-amber-950/30 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{meta.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{meta.label}</span>
                    <span className="text-[10px] text-slate-500">{count} films</span>
                  </div>
                </div>
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                ) : (
                  <Square className="w-4 h-4 text-slate-700 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Parental Ratings Guidance Allowed */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🔞</span>
          <span>Parental Ratings Guidance Allowed</span>
        </label>
        <p className="text-[11px] text-slate-400">
          Set the upper limit for age certifications allowed in this session (UK &amp; US classifications):
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {AGE_RATING_OPTIONS.map((rating) => {
            const isSelected = ageRatingLimit === rating.value;

            return (
              <button
                key={rating.value}
                type="button"
                onClick={() => onSetAgeRatingLimit(rating.value as AgeRatingLimit)}
                className={`p-3 min-h-[72px] rounded-xl border text-left transition flex flex-col justify-between gap-1 active:scale-95 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-black">{rating.label}</span>
                <span className="text-[10px] opacity-75">{rating.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 Navigation Controls */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToChoice}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Curation Method</span>
        </button>
        <button
          type="button"
          onClick={onContinueToStep4}
          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
        >
          <span>Continue to Step 4: Lineup Selection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
