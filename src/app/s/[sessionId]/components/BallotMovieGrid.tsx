'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Settings } from 'lucide-react';
import { Movie } from '@/types';
import { MovieCard } from '@/components/MovieCard';

interface BallotMovieGridProps {
  sessionId: string;
  activeCount: number;
  filteredMovies: Movie[];
  onOpenDetails: (movie: Movie, autoPlay?: boolean) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export function BallotMovieGrid({
  sessionId,
  activeCount,
  filteredMovies,
  onOpenDetails,
  onResetFilters,
  isLoading = false,
}: BallotMovieGridProps) {
  if (isLoading && filteredMovies.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-slate-900/60 rounded-3xl border border-slate-800 p-4 space-y-3">
            <div className="w-full aspect-[2/3] bg-slate-800/80 rounded-2xl" />
            <div className="h-4 bg-slate-800 rounded-md w-3/4" />
            <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (activeCount === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 max-w-lg mx-auto">
        <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Movies on the Ballot Yet</h3>
        <p className="text-xs text-slate-400 mt-1">
          The host hasn&apos;t added any movie contenders to this session yet.
        </p>
        <Link
          href={`/s/${sessionId}/admin`}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition glow-gold"
        >
          <Settings className="w-4 h-4" />
          <span>Configure Lineup in Setup</span>
        </Link>
      </div>
    );
  }

  if (filteredMovies.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No movies match your filter</h3>
        <p className="text-xs text-slate-400 mt-1">
          Try clearing your search query or switching genre filter
        </p>
        <button
          onClick={onResetFilters}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {filteredMovies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  );
}
