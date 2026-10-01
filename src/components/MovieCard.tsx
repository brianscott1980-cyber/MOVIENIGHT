'use client';

import { STREAMING_PLATFORMS } from '@/data/moviesData';
import { normalizeMovieSource } from '@/lib/movieFilters';
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
  const { currentVoter, isVoted, toggleMovieVote, hasReachedVoteLimit, isVotePending, sessionData } = useVoter();

  const voted = isVoted(movie.id);
  const voteLimitReached = !voted && hasReachedVoteLimit;

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
      className={`group relative flex flex-col rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden bg-slate-900/90 shadow-lg ${
        voted
          ? 'border-emerald-400/80 ring-2 ring-emerald-400/30 shadow-emerald-500/20 glow-cyan'
          : rankPosition === 1
          ? 'border-amber-400/80 glow-gold'
          : 'border-slate-800 hover:border-amber-500/60 hover:shadow-2xl'
      }`}
    >
      {/* Overall Leaderboard Position Badges (Gold, Silver, Bronze) */}
      <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 z-30 flex flex-col gap-1 items-start pointer-events-none">
        {rankPosition === 1 && (
          <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] shadow-lg glow-gold">
            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950" />
            <span className="sm:hidden">1st ({totalVotes})</span>
            <span className="hidden sm:inline">🥇 {scoreItem?.isJointPosition ? 'JOINT ' : ''}1ST PLACE ({totalVotes} {totalVotes === 1 ? 'vote' : 'votes'})</span>
          </div>
        )}
        {rankPosition === 2 && (
          <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 font-black text-[10px] sm:text-[11px] shadow-lg">
            <span className="sm:hidden">2nd ({totalVotes})</span>
            <span className="hidden sm:inline">🥈 {scoreItem?.isJointPosition ? 'JOINT ' : ''}2ND PLACE ({totalVotes})</span>
          </div>
        )}
        {rankPosition === 3 && (
          <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-amber-700 text-amber-100 font-black text-[10px] sm:text-[11px] shadow-lg">
            <span className="sm:hidden">3rd ({totalVotes})</span>
            <span className="hidden sm:inline">🥉 {scoreItem?.isJointPosition ? 'JOINT ' : ''}3RD PLACE ({totalVotes})</span>
          </div>
        )}
        {voted && (
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] sm:text-[10px] shadow">
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950 stroke-[3]" />
            <span>VOTED</span>
          </div>
        )}
      </div>

      {/* Movie Artwork Thumbnail with Click to Open Details */}
      <div
        onClick={() => onOpenDetails(movie, true)}
        className="relative aspect-[15/16] sm:aspect-[32/27] w-full overflow-hidden bg-slate-950 cursor-pointer group/thumb"
      >
        {/* Ambient blurred backdrop for letterbox-free aesthetics */}
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top blur-xl scale-115 opacity-40 pointer-events-none"
        />

        {/* Sharp movie artwork: poster focus on mobile, landscape on desktop */}
        <img
          src={movie.posterUrl || movie.backdropUrl}
          alt={`${movie.title} artwork`}
          loading="lazy"
          className="relative w-full h-full object-cover object-top sm:hidden group-hover/thumb:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== movie.posterUrl) {
              target.src = movie.posterUrl;
            }
          }}
        />
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={`${movie.title} artwork`}
          loading="lazy"
          className="relative w-full h-full object-cover object-top hidden sm:block group-hover/thumb:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== movie.posterUrl) {
              target.src = movie.posterUrl;
            }
          }}
        />

        {/* Shadow vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Year & Rating Badges */}
        <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 z-20 flex flex-wrap items-center gap-1 sm:gap-1.5 justify-end max-w-[80%] pointer-events-none">
          {movie.rated && movie.rated !== 'N/A' && (
            <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-slate-300 text-[10px] font-bold border border-white/10">
              {movie.rated}
            </span>
          )}
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-slate-300 text-[10px] sm:text-xs font-mono font-medium border border-white/10">
            {movie.year}
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-yellow-500 text-slate-950 text-[10px] sm:text-xs font-black shadow">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-slate-950" />
            <span>{(movie.tmdbRating ?? movie.imdbRating).toFixed(1)}</span>
          </span>
        </div>

        {/* Hover/Tap Overlay: Reveals 'Play Trailer' Button */}
        <div className="absolute inset-0 z-20 bg-slate-950/65 opacity-0 group-hover/thumb:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(movie, true);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-2xl transform scale-90 group-hover/thumb:scale-100 transition-all duration-200 border border-white/30 glow-red hover:shadow-red-500/50 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
            <span className="sm:hidden">Trailer</span>
            <span className="hidden sm:inline">Play Trailer</span>
          </button>
        </div>

        {/* Real-time Voter Avatars - Always visible on desktop */}
        {votersWhoVoted.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex absolute bottom-2.5 left-2.5 z-25 items-center gap-1.5 pointer-events-auto"
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
      <div className="flex-1 p-2.5 sm:p-4 flex flex-col justify-between">
        <div>
          {/* Genre Tag & Runtime - hidden on mobile for clean card layout */}
          <div className="hidden sm:flex items-center justify-between gap-2 mb-1.5">
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
            className="text-xs sm:text-lg font-bold text-white tracking-tight cursor-pointer hover:text-amber-300 transition line-clamp-2 sm:line-clamp-1 leading-snug text-center sm:text-left"
            title={movie.title}
          >
            {movie.title}
          </h3>

          {/* Director & Lead Cast - hidden on mobile */}
          <div className="hidden sm:block mt-1 text-xs text-slate-400 space-y-0.5">
            <p className="truncate">
              <span className="text-slate-400">Dir:</span>{' '}
              <span className="text-slate-200">{movie.director}</span>
            </p>
            <p className="truncate">
              <span className="text-slate-400">Cast:</span>{' '}
              <span className="text-slate-200">{movie.cast.slice(0, 3).join(', ')}</span>
            </p>
          </div>

          {/* Rotten Tomatoes / Awards badge - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 mt-2">
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

          {/* Streaming Platform Badges - hidden on mobile */}
          {movie.streamingSources && movie.streamingSources.length > 0 && (
            <div className="hidden sm:flex flex-wrap items-center gap-1 mt-2">
              {movie.streamingSources.slice(0, 3).map((source) => STREAMING_PLATFORMS.find((platform) => platform.id === normalizeMovieSource(source))?.name || source).map((source) => (
                <span
                  key={source}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    source === 'Netflix'
                      ? 'bg-red-950/70 text-red-300 border-red-800/50'
                      : source === 'Prime Video'
                      ? 'bg-sky-950/70 text-sky-300 border-sky-800/50'
                      : source === 'Apple TV+'
                      ? 'bg-zinc-800 text-slate-200 border-zinc-700'
                      : source === 'Disney+'
                      ? 'bg-blue-950/70 text-blue-300 border-blue-800/50'
                      : source === 'Max'
                      ? 'bg-purple-950/70 text-purple-300 border-purple-800/50'
                      : source === 'Plex Library'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-600/70 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {source === 'Plex Library' ? '🟠 Plex' : source}
                </span>
              ))}
              {movie.streamingSources.length > 3 && (
                <span className="text-[9px] text-slate-400 font-semibold">
                  +{movie.streamingSources.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clean VOTE Button Under Movie Tile */}
        <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-800">
          <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>
              {totalVotes > 0 ? (
                <strong className="text-amber-300">{totalVotes} {totalVotes === 1 ? 'total vote' : 'total votes'}</strong>
              ) : (
                '0 votes'
              )}
            </span>
            {sessionData?.session?.status === 'locked' ? (
              <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                <span>🔒 Voting Ended</span>
              </span>
            ) : currentVoter ? (
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
            disabled={sessionData?.session?.status === 'locked' || voteLimitReached || isVotePending}
            title={
              sessionData?.session?.status === 'locked'
                ? 'Voting has ended for this session'
                : voteLimitReached
                ? 'Vote limit reached. Unvote a movie to free a vote.'
                : undefined
            }
            className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-auto w-full h-9 sm:h-11 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 sm:gap-2 border active:scale-98 shadow-md ${
              sessionData?.session?.status === 'locked'
                ? voted
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 cursor-not-allowed'
                  : 'bg-slate-950/80 border-slate-800 text-slate-500 cursor-not-allowed'
                : voted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-emerald-400 shadow-emerald-500/20 glow-cyan'
                : 'bg-slate-800 hover:bg-amber-400 text-slate-100 hover:text-slate-950 border-slate-700 hover:border-amber-300'
            }`}
          >
            {sessionData?.session?.status === 'locked' ? (
              voted ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 stroke-[3]" />
                  <span className="sm:hidden">Voted</span>
                  <span className="hidden sm:inline">You Voted (Voting Closed)</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span className="sm:hidden">Closed</span>
                  <span className="hidden sm:inline">Voting Closed</span>
                </>
              )
            ) : voted ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[3]" />
                <span className="sm:hidden">Voted</span>
                <span className="hidden sm:inline">Voted! (Tap to undo)</span>
              </>
            ) : (
              <>
                <span>🗳️</span>
                <span>{voteLimitReached ? 'Limit' : 'Vote'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
