'use client';

import { positionLabel } from '@/lib/ranking';
import { SessionCopyActions } from '@/components/SessionCopyActions';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useVoter } from '@/context/VoterContext';
import { useAuth } from '@/context/AuthContext';
import { SessionResponse } from '@/types';
import { GENRE_INFO } from '@/data/moviesData';
import { VoterAvatar } from '@/components/VoterAvatar';
import {
  Crown,
  Users,
  Check,
  Clock,
  Maximize,
  Film,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SessionLivePage() {
  const { sessionId, isHost } = useVoter();
  const { user, userEmail } = useAuth();
  const [data, setData] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWinnerRevealed, setIsWinnerRevealed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json: SessionResponse = await res.json();
        setData(json);
        if (json?.session?.status === 'locked') {
          setIsWinnerRevealed(true);
        }
      }
    } catch (err) {
      console.error('Error fetching live session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`/api/events?sessionId=${encodeURIComponent(sessionId)}`);
        eventSource.onmessage = (event) => {
          try {
            const updated: SessionResponse = JSON.parse(event.data);
            setData(updated);
            if (updated?.session?.status === 'locked' || (updated?.session?.winnerMovieId && !isWinnerRevealed)) {
              setIsWinnerRevealed(true);
            }
            setIsLoading(false);
          } catch (err) {
            console.error('Failed to parse live SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectSSE();
            }, 3000);
          }
        };
      } catch (err) {
        console.error('Live podium SSE error:', err);
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connectSSE();
          }, 3000);
        }
      }
    };

    connectSSE();

    // Heartbeat fallback refresh every 10 seconds
    heartbeatInterval = setInterval(fetchSession, 10000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [sessionId, isWinnerRevealed, fetchSession]);

  const handleCrownWinner = async () => {
    if (!data || !data.leaderboard || data.leaderboard.length === 0) return;
    const topMovie = data.leaderboard[0].movie;
    setIsWinnerRevealed(true);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 300);

    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'lock',
          winnerMovieId: topMovie.id,
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
    } catch (err) {
      console.error('Failed to lock session:', err);
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('Are you sure you want to reset all votes for this movie night?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'reset',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setIsWinnerRevealed(false);
      }
    } catch (err) {
      console.error('Failed to reset votes:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const leaderboard = data?.leaderboard || [];
  const top1 = leaderboard[0] || null;

  const totalVotesCast = leaderboard.reduce((acc, curr) => acc + curr.votes, 0);

  const turnout = data?.turnout || {
    totalVoters: 0,
    votedCount: 0,
    votedVoters: [],
    pendingVoters: [],
  };

  if (data?.expired || (data && !data.session)) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col justify-between">
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <span>&larr; All Sessions</span>
            </Link>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl mx-auto">
            🚫
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Session Expired or Not Found
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              This movie night session does not exist or has been deleted by the host.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition"
            >
              Return to Homepage
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 w-full max-w-[100vw] overflow-x-hidden">
      {/* Live Podium Header */}
      <section className="relative border-b border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>LIVE VOTING PODIUM</span>
              </div>

              {data?.session?.status === 'paused' && (
                <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-orange-600 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase">
                  <span>⏸️ VOTING PAUSED</span>
                </div>
              )}

              {data?.session?.status === 'locked' && (
                <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-purple-600 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase">
                  <span>🔒 VOTING ENDED &bull; OFFICIAL OUTCOME</span>
                </div>
              )}

              <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-black tracking-widest">
                <span>{sessionId.replace(/\D/g, '').length === 8 ? `${sessionId.slice(0, 4)} ${sessionId.slice(4)}` : sessionId}</span>
                <SessionCopyActions sessionId={sessionId} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2 sm:gap-3">
              <span>🍿</span>
              <span>{data?.session?.sessionTitle || `Movie Night #${sessionId}`} {data?.session?.status === 'locked' ? 'Outcome' : 'Tally'}</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {data?.session?.status === 'locked'
                ? 'Official results finalized. Anyone joining now sees the winner and podium outcome.'
                : 'Overall Gold 🥇, Silver 🥈, and Bronze 🥉 calculated from live group votes'}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
            {isHost && (
              <>
                {data?.session?.status !== 'locked' ? (
                  <button
                    onClick={handleCrownWinner}
                    disabled={leaderboard.length === 0 || totalVotesCast === 0}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-95 glow-gold"
                  >
                    <Crown className="w-4 h-4 fill-slate-950" />
                    <span>Crown Winner &amp; End Vote</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/session', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionId,
                            action: 'unlock',
                            hostUserId: user?.id || null,
                            hostEmail: userEmail || null,
                          }),
                        });
                        if (res.ok) {
                          await fetchSession();
                        }
                      } catch (err) {
                        console.error('Failed to reopen vote:', err);
                      }
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <span>🔓 Re-open Voting</span>
                  </button>
                )}

                <button
                  onClick={handleResetVotes}
                  disabled={isResetting}
                  className="p-2.5 sm:px-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  title="Reset votes for a new round"
                >
                  <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <Link
              href={`/s/${sessionId}?view=ballot`}
              className="px-3 sm:px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Film className="w-4 h-4" />
              <span>{data?.session?.status === 'locked' ? 'View Lineup' : 'Vote'}</span>
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Winner Spotlight Banner */}
        {isWinnerRevealed && top1 && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 p-5 sm:p-10 shadow-2xl glow-gold-lg animate-fade-in text-center">
            <div className="inline-flex items-center justify-center p-2.5 sm:p-3 rounded-full bg-amber-400 text-slate-950 text-2xl sm:text-3xl mb-2 sm:mb-3 shadow-lg animate-bounce">
              👑
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-black text-amber-400 block mb-1">
              TONIGHT&apos;S OFFICIAL MOVIE NIGHT PICK
            </span>
            <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight">
              {top1.movie.title}
            </h2>
            <p className="text-slate-300 text-xs sm:text-base mt-1.5 max-w-2xl mx-auto">
              Won with <strong className="text-amber-300">{top1.votes} {top1.votes === 1 ? 'vote' : 'votes'}</strong> across the group!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {top1.movie.year}
              </span>
              <Link
                href={`/s/${sessionId}/movie/${top1.movie.id}`}
                className="text-xs px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1"
              >
                <span>Watch Trailer &amp; Details</span>
              </Link>
            </div>
          </div>
        )}

        {/* Compact voter participation strip */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2.5 sm:px-4 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
              <Users className="w-4 h-4 text-amber-400" />
              Voter Participation
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono">
                {turnout.votedCount}/{turnout.totalVoters} voted
              </span>
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="w-3 h-3" /> Voted</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Deciding</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(data?.session?.voters || []).map((voter) => {
              const ballot = data?.session?.ballots?.[voter.id];
              const hasVoted = Boolean(
                ballot &&
                  ((Array.isArray(ballot.movieIds) && ballot.movieIds.length > 0) ||
                    ballot.rank1MovieId ||
                    ballot.rank2MovieId ||
                    ballot.rank3MovieId)
              );

              return (
                <div
                  key={voter.id}
                  className={`px-2 py-1 rounded-lg border transition-colors inline-flex items-center gap-2 max-w-full ${
                    hasVoted
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-sm'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  <VoterAvatar voter={voter} size="xs" className="shrink-0" />
                  <span className="font-semibold text-white text-xs truncate max-w-32">
                    {voter.name}
                  </span>
                  <span role="img" aria-label={hasVoted ? 'Voted' : 'Deciding'} title={hasVoted ? 'Voted' : 'Deciding'} className="shrink-0">
                    {hasVoted ? <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-400" /> : <Clock aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Gold, Silver, Bronze Podium */}
        {totalVotesCast > 0 ? (
          <div>
            <div className="text-center mb-5 sm:mb-6">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-400 uppercase">
                OVERALL TALLY PODIUM
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white">Gold, Silver &amp; Bronze Contenders</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-end max-w-5xl mx-auto">
              {[1, 2, 3].map((rank) => {
                const movies = leaderboard.filter((item) => item.rankPosition === rank);
                if (!movies.length) return null;
                const joint = movies.length > 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                const columns = movies.length === 1 ? 'grid-cols-1' : movies.length === 2 || movies.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
                const placement = rank === 1 ? 'md:col-start-2 md:row-start-1' : rank === 2 ? 'md:col-start-1 md:row-start-1' : 'md:col-start-3 md:row-start-1';
                const border = rank === 1 ? 'border-amber-400 bg-gradient-to-b from-amber-500/15 to-slate-900 shadow-amber-500/10' : rank === 2 ? 'border-slate-400 bg-slate-900' : 'border-amber-700 bg-slate-900';
                const base = rank === 1 ? 'h-16 md:h-24 bg-gradient-to-t from-amber-600 to-amber-400 text-slate-950' : rank === 2 ? 'h-12 md:h-16 bg-gradient-to-t from-slate-500 to-slate-300 text-slate-950' : 'h-10 md:h-10 bg-gradient-to-t from-amber-900 to-amber-700 text-amber-100';

                return (
                  <section key={rank} aria-label={`${positionLabel(rank, joint)} place podium`} className={placement}>
                    <div className={`rounded-t-3xl border border-b-0 p-4 sm:p-5 text-center shadow-xl ${border}`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {rank === 1 && <Crown aria-hidden="true" className="w-5 h-5 text-amber-400" />}
                        <h3 className="text-lg font-black text-white">{medal} {positionLabel(rank, joint)} place</h3>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        {joint ? `${movies.length} movies tied · ${movies[0].votes} ${movies[0].votes === 1 ? 'vote' : 'votes'} each` : `${movies[0].votes} ${movies[0].votes === 1 ? 'vote' : 'votes'}`}
                      </p>
                      <div className="md:h-[320px] flex items-center justify-center">
                        <div tabIndex={movies.length > 3 ? 0 : undefined} aria-label={movies.length > 3 ? 'Tied movies — scroll for more' : undefined} className={`grid ${columns} gap-3 w-full max-h-[320px] overflow-y-auto p-1 content-start rounded-lg focus-visible:outline-2 focus-visible:outline-amber-400`}>
                          {movies.map((item) => (
                            <Link key={item.movie.id} href={`/s/${sessionId}/movie/${item.movie.id}`} title={item.movie.title} className={`group min-w-0 block rounded-lg focus-visible:outline-2 focus-visible:outline-amber-400 ${joint ? '' : 'w-36 sm:w-40 mx-auto'}`}>
                              <img
                                src={item.movie.posterUrl || '/movie-placeholder.svg'}
                                alt={`${item.movie.title} poster`}
                                loading="lazy"
                                onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/movie-placeholder.svg'; }}
                                className="w-full aspect-[2/3] object-cover rounded-lg border border-white/10 shadow-lg group-hover:ring-2 group-hover:ring-amber-400 transition"
                              />
                              <span className={`block mt-2 font-bold text-white group-hover:text-amber-300 line-clamp-2 ${joint ? 'text-xs' : 'text-sm'}`}>{item.movie.title}</span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">{item.movie.year}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-b-2xl flex items-center justify-center shadow-lg font-black text-xs sm:text-sm tracking-wide ${base}`}>
                      {medal} {rank === 1 ? 'GOLD' : rank === 2 ? 'SILVER' : 'BRONZE'} · {positionLabel(rank, joint).toUpperCase()}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-slate-900/40 rounded-2xl sm:rounded-3xl border border-slate-800 p-6 sm:p-8">
            <Film className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg sm:text-xl font-bold text-white">No votes cast yet</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Head over to the voting page and click <strong className="text-amber-400">Vote</strong> under your favorites to start the tally!
            </p>
            <Link
              href={`/s/${sessionId}`}
              className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition"
            >
              <span>Cast the First Vote</span>
            </Link>
          </div>
        )}

        {/* Complete Standings Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>All Film Standings</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({leaderboard.length} films)
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Ranked by total overall votes cast by group members
              </p>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs sm:text-sm min-w-[560px]">
              <thead className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tally Rank</th>
                  <th className="py-2.5 px-4">Movie</th>
                  <th className="py-2.5 px-3">Genre</th>
                  <th className="py-2.5 px-4 text-center">Total Votes</th>
                  <th className="py-2.5 px-4">Supporters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((item) => {
                  const genreMeta = GENRE_INFO[item.movie.genre] || {
                    emoji: item.movie.genreEmoji,
                    label: item.movie.genre,
                  };

                  return (
                    <tr
                      key={item.movie.id}
                      className={`hover:bg-slate-800/40 transition ${
                        item.rankPosition === 1 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold">
                        <span className={item.rankPosition === 1 ? 'text-amber-400' : 'text-slate-300'}>
                          {positionLabel(item.rankPosition, item.isJointPosition)}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <Link
                          href={`/s/${sessionId}/movie/${item.movie.id}`}
                          className="font-bold text-white hover:text-amber-300 transition block text-xs sm:text-sm"
                        >
                          {item.movie.title}
                        </Link>
                        <span className="text-[11px] text-slate-400 block">
                          {item.movie.year} • Dir: {item.movie.director}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-xs text-slate-300 whitespace-nowrap">
                        <span>{genreMeta.emoji}</span>
                        <span className="ml-1 text-slate-400 hidden sm:inline">{genreMeta.label}</span>
                      </td>

                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-xs sm:text-sm font-black px-3 py-1 rounded-xl ${
                            item.votes > 0
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {item.votes} {item.votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        {item.voterNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.voterNames.map((name) => (
                              <span
                                key={name}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No votes yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

