'use client';

import { positionLabel } from '@/lib/ranking';
import React, { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GENRE_INFO } from '@/data/moviesData';
import { useVoter } from '@/context/VoterContext';
import { VoterAvatar } from '@/components/VoterAvatar';
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Clapperboard,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  DollarSign,
  Play,
  Check,
} from 'lucide-react';

export default function SessionMovieDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string; id: string }>;
  searchParams?: Promise<{ play?: string; autoplay?: string }>;
}) {
  const { sessionId, id } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const shouldAutoPlay = resolvedSearchParams?.play === '1' || resolvedSearchParams?.autoplay === 'true';

  const { currentVoter, isVoted, toggleMovieVote, hasReachedVoteLimit, isVotePending, sessionData, isLoading } = useVoter();
  const [isPlaying, setIsPlaying] = useState(shouldAutoPlay);

  const votersWhoVoted = React.useMemo(() => {
    if (!id) return [];
    const scoreItem = sessionData?.leaderboard?.find((item) => item.movie.id === id);
    if (scoreItem?.voters && scoreItem.voters.length > 0) return scoreItem.voters;
    if (!sessionData?.session?.ballots || !sessionData?.session?.voters) return [];
    const ballots = sessionData.session.ballots;
    return sessionData.session.voters.filter((voter) => ballots[voter.id]?.movieIds?.includes(id));
  }, [id, sessionData]);

  const movies = sessionData?.allAvailableMovies || [];
  if (isLoading || !sessionData) return <div className="p-8 text-slate-400">Loading movie…</div>;
  if (sessionData.expired || !sessionData.session) {
    notFound();
  }
  const movieIndex = movies.findIndex((m) => m.id === id);
  if (movieIndex === -1) {
    notFound();
  }

  const movie = movies[movieIndex];
  const prevMovie = movieIndex > 0 ? movies[movieIndex - 1] : null;
  const nextMovie = movieIndex < movies.length - 1 ? movies[movieIndex + 1] : null;

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
    <div className="min-h-screen pb-12">
      {/* Top Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/s/${sessionId}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Contenders</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {prevMovie && (
              <Link
                href={`/s/${sessionId}/movie/${prevMovie.id}`}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition active:scale-95"
                title={`Previous: ${prevMovie.title}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
            <span className="text-xs text-slate-400 font-mono px-1">
              {movieIndex + 1} / {movies.length}
            </span>
            {nextMovie && (
              <Link
                href={`/s/${sessionId}/movie/${nextMovie.id}`}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition active:scale-95"
                title={`Next: ${nextMovie.title}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 space-y-6 sm:space-y-8">
        {/* Cinematic Header & Trailer Area */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden bg-slate-950 shadow-2xl glow-gold">
          {/* 16:9 Video Area */}
          <div className="relative aspect-video w-full bg-black overflow-hidden">
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
                onClick={() => setIsPlaying(true)}
                className="relative w-full h-full cursor-pointer group/player"
              >
                {/* Ambient blurred backdrop */}
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

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 group-hover/player:bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover/player:scale-110 transition-all border-2 border-white/30 glow-red">
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white ml-1" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider bg-black/70 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                    Click to Play Official Trailer
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Under-Video Information & Direct Voting Card */}
          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
              {/* Title & Metadata */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${genreMeta.color}`}
                  >
                    <span>{genreMeta.emoji}</span>
                    <span>{genreMeta.label}</span>
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-medium">
                    {movie.year}
                  </span>
                  {movie.rated && movie.rated !== 'N/A' && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
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
                      className={`inline-flex items-center gap-1 text-xs px-3 py-0.5 rounded-full font-black ${
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

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {movie.title}
                </h1>

                {movie.tagline && (
                  <p className="text-sm sm:text-base italic text-amber-400/90 mt-1">
                    &quot;{movie.tagline}&quot;
                  </p>
                )}
              </div>

              {/* Direct Single Vote Action Card */}
              <div className="w-full lg:w-96 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/30 shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">Cast Vote for This Film</span>
                  </div>
                  {voted && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                      ✓ Voted
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mb-3.5 space-y-1.5">
                  <p>
                    {currentVoter ? (
                      <>
                        Voting as <strong className="text-amber-300">{currentVoter.name}</strong> •{' '}
                        <span>{totalVotes} {totalVotes === 1 ? 'total vote' : 'total votes'}</span>
                      </>
                    ) : (
                      'Select your profile to vote'
                    )}
                  </p>

                  {votersWhoVoted.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400">Voters:</span>
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
                      <span className="text-[11px] text-slate-300 font-medium truncate">
                        {votersWhoVoted.map((v) => v.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleMovieVote(movie.id)}
            disabled={voteLimitReached || isVotePending}
            title={voteLimitReached ? 'Vote limit reached. Unvote a movie to free a vote.' : undefined}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed w-full min-h-[48px] py-2.5 px-4 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 active:scale-95 shadow-lg ${
                    voted
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border border-emerald-400 glow-cyan'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 glow-gold shadow-amber-400/20'
                  }`}
                >
                  {voted ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>Voted! (Tap to remove vote)</span>
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

            {/* Awards & Box Office Bar */}
            {(movie.awards || movie.boxOffice) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.awards && movie.awards !== 'N/A' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-300 text-xs">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{movie.awards}</span>
                  </div>
                )}
                {movie.boxOffice && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Box Office: {movie.boxOffice}</span>
                  </div>
                )}
              </div>
            )}

            {/* Synopsis */}
            <div className="bg-slate-900/60 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Synopsis
              </h3>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">{movie.synopsis}</p>
            </div>

            {/* Director & Cast Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/40 border border-slate-800">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Director</span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-white">{movie.director}</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/40 border border-slate-800">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Starring Cast</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {movie.cast.map((actor, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

