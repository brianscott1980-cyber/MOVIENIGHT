'use client';

import React, { useMemo } from 'react';
import { Movie, Voter } from '@/types';
import { useVoter } from '@/context/VoterContext';
import { GENRE_INFO } from '@/data/moviesData';
import { VoterAvatar } from '@/components/VoterAvatar';
import {
  Star,
  Play,
  Film,
  Clock,
  Award,
  Check,
  Crown,
} from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onOpenDetails: (movie: Movie, autoPlay?: boolean) => void;
}

export function MovieCard({ movie, onOpenDetails }: MovieCardProps) {
  const { currentVoter, isVoted, toggleMovieVote, sessionData } = useVoter();

  const voted = isVoted(movie.id);

  // Find overall tally standing from leaderboard
  const scoreItem = sessionData?.leaderboard?.find((item) => item.movie.id === movie.id);
  const totalVotes = scoreItem?.votes || 0;
  const rankPosition = scoreItem?.rankPosition; // 1 = Gold, 2 = Silver, 3 = Bronze

  // Real-time voters who voted for this movie
  const votersWhoVoted: Voter[] = useMemo(() => {
    if (scoreItem?.voters && scoreItem.voters.length > 0) {
      return scoreItem.voters;
    }
    if (!sessionData?.session?.ballots || !sessionData?.session?.voters) return [];
    const ballots = sessionData.session.ballots;
    return sessionData.session.voters.filter((voter) => {
      const b = ballots[voter.id];
      return b?.movieIds?.includes(movie.id);
    });
  }, [scoreItem, sessionData, movie.id]);

  const genreMeta = GENRE_INFO[movie.genre] || {
    emoji: movie.genreEmoji || '🎬',
    label: movie.genre,
    color: 'border-slate-700 text-slate-300 bg-slate-800',
  };

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden bg-slate-900/90 shadow-lg ${
        voted
          ? 'border-emerald-400/80 ring-2 ring-emerald-400/30 shadow-emerald-500/20 glow-cyan'
          : rankPosition === 1
          ? 'border-amber-400/80 glow-gold'
          : 'border-slate-800 hover:border-amber-500/60 hover:shadow-2xl'
      }`}
    >
      {/* Overall Leaderboard Position Badges (Gold, Silver, Bronze) */}
      <div className="absolute top-2.5 left-2.5 z-30 flex flex-col gap-1 items-start pointer-events-none">
        {rankPosition === 1 && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-lg glow-gold">
            <Crown className="w-3.5 h-3.5 fill-slate-950" />
            <span>🥇 1ST PLACE ({totalVotes} {totalVotes === 1 ? 'vote' : 'votes'})</span>
          </div>
        )}
        {rankPosition === 2 && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 font-black text-[11px] shadow-lg">
            <span>🥈 2ND PLACE ({totalVotes})</span>
          </div>
        )}
        {rankPosition === 3 && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-700 text-amber-100 font-black text-[11px] shadow-lg">
            <span>🥉 3RD PLACE ({totalVotes})</span>
          </div>
        )}
        {voted && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] shadow">
            <Check className="w-3 h-3 text-slate-950" />
            <span>YOU VOTED</span>
          </div>
        )}
      </div>

      {/* Landscape Movie Artwork Thumbnail with Hover-to-Play Overlay */}
      <div
        onClick={() => onOpenDetails(movie, true)}
        className="relative aspect-[64/39] sm:aspect-[32/27] w-full overflow-hidden bg-slate-950 cursor-pointer group/thumb"
      >
        {/* Ambient blurred backdrop for letterbox-free aesthetics */}
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top blur-xl scale-115 opacity-40 pointer-events-none"
        />

        {/* Sharp landscape movie artwork */}
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={`${movie.title} artwork`}
          loading="lazy"
          className="relative w-full h-full object-cover object-top group-hover/thumb:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== movie.posterUrl) {
              target.src = movie.posterUrl;
            }
          }}
        />

        {/* Shadow vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Year, MPAA Rating & IMDb Score Badges */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-wrap items-center gap-1.5 justify-end max-w-[80%] pointer-events-none">
          {movie.rated && movie.rated !== 'N/A' && (
            <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-slate-300 text-[10px] font-bold border border-white/10">
              {movie.rated}
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-slate-300 text-xs font-mono font-medium border border-white/10">
            {movie.year}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500 text-slate-950 text-xs font-black shadow">
            <Star className="w-3 h-3 fill-slate-950" />
            <span>{movie.imdbRating.toFixed(1)}</span>
          </span>
        </div>

        {/* Hover Overlay: Reveals 'Play Trailer' Button */}
        <div className="absolute inset-0 z-20 bg-slate-950/65 opacity-0 group-hover/thumb:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(movie, true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-2xl transform scale-90 group-hover/thumb:scale-100 transition-all duration-200 border border-white/30 glow-red hover:shadow-red-500/50 active:scale-95"
          >
            <Play className="w-4 h-4 fill-white ml-0.5" />
            <span>Play Trailer</span>
          </button>
        </div>

        {/* Real-time Voter Avatars along bottom border of thumbnail */}
        {votersWhoVoted.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-2.5 z-25 flex items-center gap-1.5 pointer-events-auto"
          >
            <div className="flex items-center -space-x-2">
              {votersWhoVoted.map((voter) => (
                <div
                  key={voter.id}
                  title={`Voted by ${voter.name}`}
                  className="relative group/voter"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ${
                      currentVoter?.id === voter.id ? 'ring-emerald-400 shadow-emerald-500/50' : 'ring-slate-950'
                    } overflow-hidden shadow-lg transform transition-all duration-200 group-hover/voter:scale-125 group-hover/voter:z-30 bg-slate-900`}
                  >
                    <VoterAvatar voter={voter} size="sm" />
                  </div>
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-white/90 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 pointer-events-none shadow">
              {votersWhoVoted.length === 1
                ? votersWhoVoted[0].name
                : `${votersWhoVoted.length} votes`}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          {/* Genre Tag & Runtime */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${genreMeta.color}`}
            >
              <span>{genreMeta.emoji}</span>
              <span className="truncate max-w-[130px] sm:max-w-none">{genreMeta.label}</span>
            </span>

            <div className="flex items-center gap-2">
              {movie.runtime && movie.runtime !== 'N/A' && (
                <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{movie.runtime}</span>
                </span>
              )}
              <button
                onClick={() => onOpenDetails(movie, false)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition font-medium p-1 -m-1"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetails(movie, false)}
            className="text-base sm:text-lg font-bold text-white tracking-tight cursor-pointer hover:text-amber-300 transition line-clamp-1"
          >
            {movie.title}
          </h3>

          {/* Director & Lead Cast */}
          <div className="mt-1 text-xs text-slate-400 space-y-0.5">
            <p className="truncate">
              <span className="text-slate-400">Dir:</span>{' '}
              <span className="text-slate-200">{movie.director}</span>
            </p>
            <p className="truncate">
              <span className="text-slate-400">Cast:</span>{' '}
              <span className="text-slate-200">{movie.cast.slice(0, 3).join(', ')}</span>
            </p>
          </div>

          {/* Rotten Tomatoes / Awards badge */}
          <div className="flex items-center gap-2 mt-2">
            {movie.rottenTomatoes && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded-full">
                <span>🍅</span>
                <span>{movie.rottenTomatoes}</span>
              </span>
            )}
            {movie.awards && movie.awards.includes('Oscar') && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                <Award className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{movie.awards}</span>
              </span>
            )}
          </div>
        </div>

        {/* Single Clean VOTE Button Under Movie Tile */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800">
          <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>
              {totalVotes > 0 ? (
                <strong className="text-amber-300">{totalVotes} {totalVotes === 1 ? 'total vote' : 'total votes'}</strong>
              ) : (
                '0 votes'
              )}
            </span>
            {currentVoter ? (
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <VoterAvatar voter={currentVoter} size="xs" />
                <span>Voting as <strong className="text-slate-300 font-semibold">{currentVoter.name}</strong></span>
              </span>
            ) : (
              <span className="text-[10px] text-amber-400/90 font-medium">
                Select profile to vote
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleMovieVote(movie.id)}
            className={`w-full h-11 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 border active:scale-98 shadow-md ${
              voted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-emerald-400 shadow-emerald-500/20 glow-cyan'
                : 'bg-slate-800 hover:bg-amber-400 text-slate-100 hover:text-slate-950 border-slate-700 hover:border-amber-300'
            }`}
          >
            {voted ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Voted! (Tap to undo)</span>
              </>
            ) : (
              <>
                <span>🗳️</span>
                <span>Vote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
