'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useVoter } from '@/context/VoterContext';
import { MOVIES_DATA, GENRE_INFO } from '@/data/moviesData';
import { Movie } from '@/types';
import { MovieCard } from '@/components/MovieCard';
import { MovieDetailModal } from '@/components/MovieDetailModal';
import { VoterRollCall } from '@/components/VoterRollCall';
import {
  Search,
  Filter,
  Tv,
  Film,
  Sparkles,
  ArrowUpDown,
  Shuffle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export default function HomePage() {
  const { sessionData, currentVoter } = useVoter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'random' | 'imdb' | 'year' | 'title' | 'default'>('random');
  const [randomSeedMap, setRandomSeedMap] = useState<Record<string, number>>({});
  const [modalConfig, setModalConfig] = useState<{ movie: Movie; autoPlay: boolean } | null>(null);

  // Shuffle movie order randomly on initial load
  const shuffleMovies = () => {
    const ids = MOVIES_DATA.map((m) => m.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const map: Record<string, number> = {};
    ids.forEach((id, idx) => {
      map[id] = idx;
    });
    setRandomSeedMap(map);
  };

  useEffect(() => {
    shuffleMovies();
  }, []);

  const handleOpenDetails = (movie: Movie, autoPlay: boolean = false) => {
    setModalConfig({ movie, autoPlay });
  };

  // Active movie IDs from session
  const activeIds = sessionData?.session.activeMovieIds || MOVIES_DATA.map((m) => m.id);

  // Filter & Sort
  const filteredMovies = useMemo(() => {
    return MOVIES_DATA.filter((m) => {
      if (!activeIds.includes(m.id)) return false;
      if (selectedGenre !== 'all' && m.genre !== selectedGenre) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesCast = m.cast.some((actor) => actor.toLowerCase().includes(query));
        const matchesDirector = m.director.toLowerCase().includes(query);
        return matchesTitle || matchesCast || matchesDirector;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'imdb') return b.imdbRating - a.imdbRating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'random') {
        const orderA = randomSeedMap[a.id] ?? 0;
        const orderB = randomSeedMap[b.id] ?? 0;
        return orderA - orderB;
      }
      return 0; // default seed order
    });
  }, [activeIds, selectedGenre, searchQuery, sortBy, randomSeedMap]);

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🍿 Live Movie Night Voting</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Cast Your Vote for <br />
                <span className="bg-gradient-to-r from-amber-400 via-red-400 to-rose-500 bg-clip-text text-transparent">
                  {sessionData?.session.sessionTitle || 'Heaney Movie Night'}
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2.5 leading-relaxed">
                Browse our lineup of classic contenders. Watch trailers, check IMDb cast &amp; ratings, and tap Vote on any movies you want to watch. The live leaderboard tallies the votes into Gold 🥇, Silver 🥈, and Bronze 🥉!
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/live"
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/20 transition transform hover:-translate-y-0.5 glow-red"
              >
                <Tv className="w-4 h-4" />
                <span>Watch Live Marquee Screen</span>
              </Link>
            </div>
          </div>

          {/* Voter Roll Call Attendance Strip */}
          <div className="mt-8">
            <VoterRollCall />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filter, Search & Sorting Bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by movie title, actor, or director..."
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

            {/* Sort Dropdown & Shuffle Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  shuffleMovies();
                  setSortBy('random');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
                  sortBy === 'random'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm glow-gold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-400/50'
                }`}
                title="Shuffle movie order randomly"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>

              <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 transition"
              >
                <option value="random">🔀 Random (Default)</option>
                <option value="imdb">⭐ IMDb Rating</option>
                <option value="year">📅 Release Year</option>
                <option value="title">🔤 Title (A - Z)</option>
                <option value="default">📜 Original Catalog</option>
              </select>
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
              All Genres ({activeIds.length})
            </button>

            {Object.entries(GENRE_INFO).map(([key, meta]) => {
              const count = MOVIES_DATA.filter((m) => m.genre === key && activeIds.includes(m.id)).length;
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

        {/* Movies Grid */}
        {filteredMovies.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No movies match your filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting All Genres</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>
        )}
      </main>

      {/* Fast Detail & Trailer Modal */}
      {modalConfig && (
        <MovieDetailModal
          movie={modalConfig.movie}
          autoPlay={modalConfig.autoPlay}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
