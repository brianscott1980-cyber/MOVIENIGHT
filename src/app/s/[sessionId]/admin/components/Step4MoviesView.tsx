'use client';

import React from 'react';
import {
  Film,
  Plus,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Movie, AgeRatingLimit } from '@/types';
import { QUICK_IDEAS_PRESETS } from '@/data/moviesData';
import { getMovieCriteriaWarnings } from '@/lib/movieFilters';

interface Step4MoviesViewProps {
  // AI states
  isGeneratingAi: boolean;
  aiGenerationStatus: string;
  aiSuccessCount: number | null;
  onGenerateMoreAi: () => void;
  onDismissAiSuccess: () => void;
  isAiCuratedMode?: boolean;
  aiPromptText?: string;
  onResetToCatalogue?: () => void;

  // Movie list states
  selectedMovieIds: string[];
  visibleMoviesStep4: Movie[];
  totalMatchingCriteriaMovies: Movie[];
  searchFilter: string;
  setSearchFilter: (q: string) => void;
  allowedSources: string[];
  allowedGenres: string[];
  ageRatingLimit: AgeRatingLimit;

  // Handlers
  onToggleMovie: (id: string) => void;
  onClearAllSelectedMovies: () => void;
  onToggleQuickPreset: (presetTitle: string) => void;
  onOpenCustomModal: () => void;
  onJumpToStep3: () => void;

  // Setup mode flag
  isSetupMode?: boolean;
}

export function Step4MoviesView({
  isGeneratingAi,
  aiGenerationStatus,
  aiSuccessCount,
  onGenerateMoreAi,
  onDismissAiSuccess,
  isAiCuratedMode = false,
  aiPromptText = '',
  onResetToCatalogue,

  selectedMovieIds,
  visibleMoviesStep4,
  totalMatchingCriteriaMovies,
  searchFilter,
  setSearchFilter,
  allowedSources,
  allowedGenres,
  ageRatingLimit,

  onToggleMovie,
  onClearAllSelectedMovies,
  onToggleQuickPreset,
  onOpenCustomModal,
  onJumpToStep3,

  isSetupMode = true,
}: Step4MoviesViewProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* AI Generation Loading State */}
      {isGeneratingAi && (
        <div className="p-4 rounded-2xl border-2 border-purple-500/50 bg-purple-950/30 flex items-center gap-3 text-purple-200 animate-pulse shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400 shrink-0" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider block text-purple-300">
              Gemini AI &amp; TMDB Curation in Progress
            </span>
            <p className="text-xs text-slate-300">
              {aiGenerationStatus || 'Converting your description to movies and fetching posters, trailers, and streaming details via TMDB...'}
            </p>
          </div>
        </div>
      )}


      {/* Movie Lineup Selection Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>
                Step 4: Curate Initial Movie Lineup ({selectedMovieIds.length} Selected)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAiCuratedMode
                ? 'Exclusively displaying the results of your AI lookup. Choose which movies to include on the ballot.'
                : 'Choose movies for the ballot. Added movies stay available even when they fall outside your filters.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenCustomModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Custom Movie</span>
            </button>

            <button
              type="button"
              onClick={onClearAllSelectedMovies}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs font-bold transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* AI Curated Mode Notice OR Quick Ideas Lineup Presets */}
        {isAiCuratedMode ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-950 to-indigo-950/60 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5 text-purple-200">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>AI Curated Lineup:</strong> Only displaying the {visibleMoviesStep4.length} movie suggestions from your AI prompt{aiPromptText ? ` ("${aiPromptText}")` : ''}.
              </span>
            </div>
            {onResetToCatalogue && (
              <button
                type="button"
                onClick={onResetToCatalogue}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition shrink-0"
              >
                View Full Catalogue
              </button>
            )}
          </div>
        ) : (
          /* Quick Ideas Lineup Presets for normal catalogue mode */
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Ideas (movies matching your filters):</span>
              </div>
              <span className="text-[11px] text-amber-400 font-bold">
                {selectedMovieIds.length} candidate movies selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_IDEAS_PRESETS.map((preset) => {
                const matchingIds = preset.movieIds.filter((id) =>
                  totalMatchingCriteriaMovies.some((movie) => movie.id === id)
                );
                const allSelected =
                  matchingIds.length > 0 && matchingIds.every((id) => selectedMovieIds.includes(id));
                const someSelected =
                  !allSelected && preset.movieIds.some((id) => selectedMovieIds.includes(id));

                return (
                  <button
                    key={preset.title}
                    type="button"
                    disabled={matchingIds.length === 0}
                    onClick={() => onToggleQuickPreset(preset.title)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 active:scale-95 ${
                      allSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : someSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        allSelected
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {matchingIds.length} movies
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Criteria Quick Summary & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isAiCuratedMode ? (
              <>
                <span className="text-purple-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Suggestions:</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-purple-200 font-mono">
                  {visibleMoviesStep4.length} AI results
                </span>
                {onResetToCatalogue && (
                  <button
                    type="button"
                    onClick={onResetToCatalogue}
                    className="text-[11px] text-amber-400 hover:underline font-bold ml-1"
                  >
                    (Show all catalogue movies)
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="text-slate-400 font-semibold">Filtered by:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-300 font-mono">
                  {allowedSources.length === 0 ? 'Any Source' : allowedSources.join(', ')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-purple-300 font-mono">
                  {allowedGenres.length === 0 ? 'All Genres' : `${allowedGenres.length} Genres`}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-300 font-mono">
                  Rating: {ageRatingLimit}
                </span>
                {isSetupMode && (
                  <button
                    type="button"
                    onClick={onJumpToStep3}
                    className="text-[11px] text-amber-400 hover:underline font-bold ml-1"
                  >
                    (Edit in Step 3)
                  </button>
                )}
              </>
            )}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search candidate movies..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Filtered Movie Cards Grid */}
        {visibleMoviesStep4.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleMoviesStep4.map((movie, idx) => {
              const isSelected = selectedMovieIds.includes(movie.id);
              const warnings = isAiCuratedMode
                ? []
                : getMovieCriteriaWarnings(movie, allowedSources, allowedGenres, ageRatingLimit);
              const warningText = warnings.length
                ? `Outside your ${warnings.join(', ')} filters. You can still include this added movie.`
                : '';

              return (
                <button
                  key={`${movie.id}-${idx}`}
                  type="button"
                  onClick={() => onToggleMovie(movie.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 active:scale-95 ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-950/20 text-white shadow-md'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="relative shrink-0">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg border border-slate-800"
                      />
                      {warnings.length > 0 && (
                        <span
                          role="img"
                          aria-label={warningText}
                          title={warningText}
                          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-400 text-slate-950 shadow border border-slate-900"
                        >
                          <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                        {movie.title}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {movie.year} &bull; ⭐ {(movie.tmdbRating ?? movie.imdbRating).toFixed(1)} &bull; {movie.rated || 'PG-13'}
                      </span>
                      {movie.streamingSources && movie.streamingSources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {movie.streamingSources.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300"
                            >
                              {s === 'Plex Library' ? '🟠 Plex' : s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 space-y-2">
            <p className="text-sm font-bold text-slate-400">
              No movies match your current criteria &amp; search.
            </p>
            <p className="text-xs text-slate-500">
              {isAiCuratedMode
                ? 'Try a different search term or generate more movies with AI.'
                : 'Try broadening your source, genre, or rating criteria in Step 3, or add a custom movie.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {isSetupMode && (
                <button
                  type="button"
                  onClick={onJumpToStep3}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition"
                >
                  {isAiCuratedMode ? 'Generate with AI Again' : 'Adjust Step 3 Criteria'}
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCustomModal}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
              >
                Add Custom Movie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
