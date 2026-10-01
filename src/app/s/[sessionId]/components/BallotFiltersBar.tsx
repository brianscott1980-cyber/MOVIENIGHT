'use client';

import React from 'react';
import { Search, Shuffle, ArrowUpDown, Plus } from 'lucide-react';
import { GENRE_INFO } from '@/data/moviesData';
import { Movie, Voter } from '@/types';

interface BallotFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'random' | 'imdb' | 'year' | 'title' | 'default';
  setSortBy: (sort: 'random' | 'imdb' | 'year' | 'title' | 'default') => void;
  onShuffle: () => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  activeMovieIds: string[];
  allCandidateMovies: Movie[];
  movieAdditionMode: 'admin_only' | 'voter_suggestions';
  currentVoter: Voter | null;
  suggestionLimit: number;
  suggestionsRemaining: number;
  suggestionLimitReached: boolean;
  onOpenSuggestModal: () => void;
  onOpenPicker: () => void;
}

export function BallotFiltersBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onShuffle,
  selectedGenre,
  setSelectedGenre,
  activeMovieIds,
  allCandidateMovies,
  movieAdditionMode,
  currentVoter,
  suggestionLimit,
  suggestionsRemaining,
  suggestionLimitReached,
  onOpenSuggestModal,
  onOpenPicker,
}: BallotFiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, actor, director..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Dropdown & Shuffle & Suggest Buttons - Sharing width on mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onShuffle}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 border shrink-0 ${
              sortBy === 'random'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm glow-gold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-400/50'
            }`}
            title="Shuffle movie order randomly"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden min-[360px]:inline">Shuffle</span>
          </button>

          <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 sm:flex-initial bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 sm:px-3 py-2.5 focus:outline-none focus:border-amber-400 transition truncate"
          >
            <option value="random">🔀 Random</option>
            <option value="imdb">⭐ Rating</option>
            <option value="year">📅 Year</option>
            <option value="title">🔤 Title</option>
            <option value="default">📜 Catalog</option>
          </select>

          {movieAdditionMode === 'voter_suggestions' && (
            <button
              type="button"
              onClick={() => currentVoter ? onOpenSuggestModal() : onOpenPicker()}
              disabled={suggestionLimitReached}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md active:scale-95 shrink-0 ${
                suggestionLimitReached
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
              }`}
              aria-label={suggestionLimit > 0 && currentVoter ? `Suggest movie — ${suggestionsRemaining} suggestions remaining` : "Suggest movie"}
              title={suggestionLimitReached ? "You have used all your movie suggestions" : "Suggest a custom movie for tonight"}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Suggest Movie</span>
              <span className="sm:hidden">Suggest</span>
              {suggestionLimit > 0 && currentVoter && (
                <span aria-live="polite" className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] font-bold" aria-label={`${suggestionsRemaining} movie suggestions remaining`}>
                  {suggestionsRemaining} left
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Genre Tabs Pill Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedGenre('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition border ${
            selectedGenre === 'all'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          All Genres ({activeMovieIds.length})
        </button>

        {Object.entries(GENRE_INFO).map(([key, meta]) => {
          const count = allCandidateMovies.filter(
            (m) => m.genre === key && activeMovieIds.includes(m.id)
          ).length;
          if (count === 0) return null;

          return (
            <button
              key={key}
              onClick={() => setSelectedGenre(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition flex items-center gap-1.5 border ${
                selectedGenre === key
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-400/20'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
