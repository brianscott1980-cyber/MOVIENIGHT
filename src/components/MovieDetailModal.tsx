'use client';

import { positionLabel } from '@/lib/ranking';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Movie } from '@/types';
import { useVoter } from '@/context/VoterContext';
import { GENRE_INFO } from '@/data/moviesData';
import { VoterAvatar } from './VoterAvatar';
import { trackViewMovie, trackPlayTrailer } from '@/lib/analytics';
import {
  X,
  Star,
  ExternalLink,
  Film,
  Trophy,
  User,
  Clapperboard,
  Clock,
  Award,
  DollarSign,
  Play,
  Check,
  Crown,
} from 'lucide-react';

interface MovieDetailModalProps {
  movie: Movie | null;
  autoPlay?: boolean;
  onClose: () => void;
}

export function MovieDetailModal({ movie, autoPlay = false, onClose }: MovieDetailModalProps) {
  const { currentVoter, isVoted, toggleMovieVote, hasReachedVoteLimit, isVotePending, sessionData } = useVoter();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(Boolean(autoPlay));
    if (movie) {
      trackViewMovie({
        sessionId: sessionData?.session?.sessionId,
        movieId: movie.id,
        movieTitle: movie.title,
        source: 'modal',
      });
      if (autoPlay && movie.youtubeTrailerId) {
        trackPlayTrailer({
          sessionId: sessionData?.session?.sessionId,
          movieId: movie.id,
          movieTitle: movie.title,
          youtubeTrailerId: movie.youtubeTrailerId,
        });
      }
    }
  }, [movie, autoPlay, sessionData?.session?.sessionId]);

  const handlePlayTrailer = () => {
    setIsPlaying(true);
    if (movie && movie.youtubeTrailerId) {
      trackPlayTrailer({
        sessionId: sessionData?.session?.sessionId,
        movieId: movie.id,
        movieTitle: movie.title,
        youtubeTrailerId: movie.youtubeTrailerId,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const votersWhoVoted = React.useMemo(() => {
    if (!movie) return [];
    const scoreItem = sessionData?.leaderboard?.find((item) => item.movie.id === movie.id);
    if (scoreItem?.voters && scoreItem.voters.length > 0) return scoreItem.voters;
    if (!sessionData?.session?.ballots || !sessionData?.session?.voters) return [];
    const ballots = sessionData.session.ballots;
    return sessionData.session.voters.filter((voter) => ballots[voter.id]?.movieIds?.includes(movie.id));
  }, [movie, sessionData]);

  if (!movie) return null;

  const voted = isVoted(movie.id);
  const voteLimitReached = !voted && hasReachedVoteLimit;

  const scoreItem = sessionData?.leaderboard?.find((item) => item.movie.id === movie.id);
  const totalVotes = scoreItem?.votes || 0;
  const rankPosition = scoreItem?.rankPosition;

  const genreMeta = GENRE_INFO[movie.genre] || {
    emoji: movie.genreEmoji || '🎬',
    label: movie.genre,
    color: 'border-slate-700 text-slate-300 bg-slate-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden glow-gold max-h-[95vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 sm:p-2.5 text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800 rounded-full backdrop-blur-md transition border border-slate-700 active:scale-95 shadow-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Area */}
        <div className="relative w-full aspect-video bg-black shrink-0 overflow-hidden">
          {isPlaying ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.youtubeTrailerId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${movie.title} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 animate-fade-in"
            />
          ) : (
            <div
              onClick={handlePlayTrailer}
              className="relative w-full h-full cursor-pointer group/player"
            >
              {/* Ambient blurred backdrop for letterbox-free aesthetics */}
              <img
                src={movie.backdropUrl || movie.posterUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-top blur-xl scale-110 opacity-35 pointer-events-none"
              />
              <img
                src={movie.backdropUrl || movie.posterUrl}
                alt={`${movie.title} artwork`}
                className="relative w-full h-full object-cover object-top group-hover/player:scale-105 transition-transform duration-500 opacity-95 group-hover/player:opacity-100"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== movie.posterUrl) {
                    target.src = movie.posterUrl;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 group-hover/player:bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover/player:scale-110 transition-all border-2 border-white/30 glow-red">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white ml-1" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider bg-black/60 px-3.5 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-lg">
                  Click to Play Official Trailer
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-7 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${genreMeta.color}`}
                >
                  <span>{genreMeta.emoji}</span>
                  <span>{genreMeta.label}</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {movie.year}
                </span>
                {movie.rated && movie.rated !== 'N/A' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    {movie.rated}
                  </span>
                )}
                {movie.runtime && movie.runtime !== 'N/A' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{movie.runtime}</span>
                  </span>
                )}
                <a
                  href={movie.tmdbId ? `https://www.themoviedb.org/movie/${movie.tmdbId}` : movie.imdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition font-bold"
                >
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{movie.tmdbRating != null ? 'TMDB' : 'IMDb'} {(movie.tmdbRating ?? movie.imdbRating).toFixed(1)}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
                {movie.rottenTomatoes && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-950/50 text-rose-300 border border-rose-800/40 font-bold">
                    <span>🍅</span>
                    <span>{movie.rottenTomatoes}</span>
                  </span>
                )}
                {rankPosition && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-black ${
                      rankPosition === 1
                        ? 'bg-amber-400 text-slate-950'
                        : rankPosition === 2
                        ? 'bg-slate-200 text-slate-950'
                        : 'bg-amber-700 text-amber-100'
                    }`}
                  >
                    <span>{positionLabel(rankPosition, scoreItem?.isJointPosition)}</span>
                    <span>({totalVotes} {totalVotes === 1 ? 'vote' : 'votes'})</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-xs sm:text-sm italic text-amber-400/90 mt-1">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            <Link
              href={`/movie/${movie.id}?play=1`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition py-1 px-2.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 self-start shrink-0"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Awards & Box Office Bar */}
          {(movie.awards || movie.boxOffice) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {movie.awards && movie.awards !== 'N/A' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-300 text-xs">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{movie.awards}</span>
                </div>
              )}
              {movie.boxOffice && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 text-xs">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Box Office: {movie.boxOffice}</span>
                </div>
              )}
            </div>
          )}

          {/* Synopsis */}
          <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Synopsis
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{movie.synopsis}</p>
          </div>

          {/* Director & Cast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Director</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-white">{movie.director}</p>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Starring Cast</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {movie.cast.map((actor, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-200 border border-slate-700/60"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Single Clean Vote Button Section */}
          <div className="pt-3 border-t border-slate-800 sticky bottom-0 bg-slate-900 pb-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 p-3.5 sm:p-4 rounded-xl border border-amber-500/20">
              <div className="text-center sm:text-left">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Vote for {movie.title}</span>
                  {currentVoter && (
                    <span className="text-xs font-normal text-slate-400">
                      (as {currentVoter.name})
                    </span>
                  )}
                </h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  {votersWhoVoted.length > 0 && (
                    <div className="flex items-center -space-x-1.5">
                      {votersWhoVoted.map((v) => (
                        <div
                          key={v.id}
                          className="w-5 h-5 rounded-full ring-2 ring-slate-900 overflow-hidden shadow"
                          title={`Voted by ${v.name}`}
                        >
                          <VoterAvatar voter={v} size="xs" />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {totalVotes > 0 ? (
                      <span className="text-amber-300 font-medium">
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                        {votersWhoVoted.length > 0 && (
                          <span className="text-slate-300 font-normal"> ({votersWhoVoted.map((v) => v.name).join(', ')})</span>
                        )}
                      </span>
                    ) : (
                      'Be the first to vote for this film!'
                    )}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => toggleMovieVote(movie.id)}
            disabled={voteLimitReached || isVotePending}
            title={voteLimitReached ? 'Vote limit reached. Unvote a movie to free a vote.' : undefined}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 active:scale-95 shadow-lg ${
                    voted
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border border-emerald-400 glow-cyan'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20 glow-gold'
                  }`}
                >
                  {voted ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>Voted! (Tap to remove)</span>
                    </>
                  ) : (
                    <>
                      <span>🗳️</span>
                      <span>{voteLimitReached ? 'Limit reached — unvote to free a vote' : 'Vote for this Movie'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
