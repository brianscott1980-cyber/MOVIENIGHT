'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SessionResponse, MovieScore, Voter } from '@/types';
import { GENRE_INFO } from '@/data/moviesData';
import { VoterAvatar } from '@/components/VoterAvatar';
import {
  Trophy,
  Crown,
  Users,
  Check,
  Clock,
  Sparkles,
  Maximize,
  Film,
  RotateCcw,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LivePage() {
  const [data, setData] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWinnerRevealed, setIsWinnerRevealed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/session', { cache: 'no-store' });
      if (res.ok) {
        const json: SessionResponse = await res.json();
        setData(json);
        if (json.session.status === 'locked' && json.session.winnerMovieId) {
          setIsWinnerRevealed(true);
        }
      }
    } catch (err) {
      console.error('Error fetching live session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
          try {
            const updated: SessionResponse = JSON.parse(event.data);
            setData(updated);
            if (updated.session.winnerMovieId && !isWinnerRevealed) {
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
        console.error('Live marquee SSE error:', err);
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
  }, [isWinnerRevealed]);

  const handleCrownWinner = async () => {
    if (!data || data.leaderboard.length === 0) return;
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
        body: JSON.stringify({ action: 'lock', winnerMovieId: topMovie.id }),
      });
    } catch (err) {
      console.error('Failed to lock session:', err);
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('Are you sure you want to reset all votes for a new round?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
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
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;
  const totalVotesCast = leaderboard.reduce((acc, curr) => acc + curr.votes, 0);

  const turnout = data?.turnout || {
    totalVoters: 0,
    votedCount: 0,
    votedVoters: [],
    pendingVoters: [],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Live Marquee Header */}
      <section className="relative border-b border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase mb-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>LIVE MARQUEE BROADCAST</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2 sm:gap-3">
              <span>🍿</span>
              <span>Live Vote Tally</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Overall Gold 🥇, Silver 🥈, and Bronze 🥉 calculated from live group votes
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleCrownWinner}
              disabled={leaderboard.length === 0 || totalVotesCast === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-95 glow-gold"
            >
              <Crown className="w-4 h-4 fill-slate-950" />
              <span>Crown Winner!</span>
            </button>

            <button
              onClick={handleResetVotes}
              disabled={isResetting}
              className="p-2.5 sm:px-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Reset votes for a new round"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <Link
              href="/"
              className="px-3 sm:px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Film className="w-4 h-4" />
              <span>Vote</span>
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
              TONIGHT'S OFFICIAL MOVIE NIGHT PICK
            </span>
            <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight">
              {top1.movie.title}
            </h2>
            <p className="text-slate-300 text-xs sm:text-base mt-1.5 max-w-2xl mx-auto">
              Won with <strong className="text-amber-300">{top1.votes} {top1.votes === 1 ? 'vote' : 'votes'}</strong> across the group!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ⭐ IMDb {top1.movie.imdbRating.toFixed(1)}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {top1.movie.year}
              </span>
              <Link
                href={`/movie/${top1.movie.id}`}
                className="text-xs px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1"
              >
                <span>Watch Trailer & Details</span>
              </Link>
            </div>
          </div>
        )}

        {/* Voter Participation Board ("Who Has Voted") */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Voter Participation</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                    {turnout.votedCount} / {turnout.totalVoters} Voted
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Track who has voted for movie night
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Voted ({turnout.votedCount})
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" /> Deciding ({turnout.totalVoters - turnout.votedCount})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {data?.session.voters.map((voter) => {
              const ballot = data.session.ballots[voter.id];
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
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all flex flex-col items-center text-center ${
                    hasVoted
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-sm'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  <VoterAvatar voter={voter} size="lg" className="mb-1.5" />
                  <span className="font-bold text-white text-xs sm:text-sm truncate max-w-full">
                    {voter.name}
                  </span>
                  <div className="mt-1">
                    {hasVoted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Voted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" /> Deciding
                      </span>
                    )}
                  </div>
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
              <h2 className="text-xl sm:text-3xl font-black text-white">Gold, Silver & Bronze Contenders</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-end max-w-5xl mx-auto">
              {/* 🥇 Gold / 1st Place (Most Votes) */}
              {top1 && (
                <div className="order-1 md:order-2 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-center flex flex-col items-center glow-gold">
                    <div className="relative mb-2">
                      <Crown className="w-7 h-7 text-amber-400 absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2" />
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-400 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-lg">
                        🥇
                      </div>
                    </div>

                    <Link
                      href={`/movie/${top1.movie.id}`}
                      className="text-lg sm:text-2xl font-extrabold text-white hover:text-amber-300 transition line-clamp-1 mt-1.5"
                    >
                      {top1.movie.title}
                    </Link>
                    <span className="text-xs text-amber-300 font-medium mt-0.5">
                      {top1.movie.year} • ⭐ {top1.movie.imdbRating.toFixed(1)}
                    </span>

                    <div className="my-2.5 sm:my-3 px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
                      <span className="text-2xl sm:text-3xl font-black">{top1.votes}</span>
                      <span className="text-[10px] sm:text-xs font-bold block uppercase tracking-wider">
                        {top1.votes === 1 ? 'Total Vote' : 'Total Votes'}
                      </span>
                    </div>

                    <div className="text-xs text-amber-200/90">
                      {top1.voterNames.length > 0 ? (
                        <span>Backed by: {top1.voterNames.join(', ')}</span>
                      ) : (
                        <span>Leader</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-10 sm:h-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-b-xl sm:rounded-b-2xl flex items-center justify-center font-black text-slate-950 text-xs sm:text-base shadow-lg">
                    🥇 GOLD (1ST PLACE)
                  </div>
                </div>
              )}

              {/* 🥈 Silver / 2nd Place */}
              {top2 && (
                <div className="order-2 md:order-1 flex flex-col items-center">
                  <div className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl text-center flex flex-col items-center">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center mb-2 shadow">
                      🥈
                    </div>
                    <Link
                      href={`/movie/${top2.movie.id}`}
                      className="text-base sm:text-lg font-bold text-white hover:text-amber-300 transition line-clamp-1"
                    >
                      {top2.movie.title}
                    </Link>
                    <span className="text-xs text-slate-400 mt-0.5">{top2.movie.year}</span>

                    <div className="my-2 sm:my-3 px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-800 border border-slate-700">
                      <span className="text-xl sm:text-2xl font-black text-slate-100">
                        {top2.votes}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 block uppercase tracking-wider">
                        {top2.votes === 1 ? 'Vote' : 'Votes'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate max-w-full">
                      {top2.voterNames.length > 0 ? top2.voterNames.join(', ') : 'Runner-up'}
                    </div>
                  </div>
                  <div className="w-full h-8 sm:h-14 bg-gradient-to-t from-slate-800 to-slate-700 rounded-b-xl sm:rounded-b-2xl border-t border-slate-600 flex items-center justify-center font-black text-slate-400 text-xs sm:text-sm">
                    🥈 SILVER (2ND PLACE)
                  </div>
                </div>
              )}

              {/* 🥉 Bronze / 3rd Place */}
              {top3 && (
                <div className="order-3 md:order-3 flex flex-col items-center">
                  <div className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl text-center flex flex-col items-center">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-700 text-amber-100 font-black text-base sm:text-lg flex items-center justify-center mb-2 shadow">
                      🥉
                    </div>
                    <Link
                      href={`/movie/${top3.movie.id}`}
                      className="text-base sm:text-lg font-bold text-white hover:text-amber-300 transition line-clamp-1"
                    >
                      {top3.movie.title}
                    </Link>
                    <span className="text-xs text-slate-400 mt-0.5">{top3.movie.year}</span>

                    <div className="my-2 sm:my-3 px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-800 border border-slate-700">
                      <span className="text-xl sm:text-2xl font-black text-amber-500">
                        {top3.votes}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 block uppercase tracking-wider">
                        {top3.votes === 1 ? 'Vote' : 'Votes'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate max-w-full">
                      {top3.voterNames.length > 0 ? top3.voterNames.join(', ') : '3rd Place'}
                    </div>
                  </div>
                  <div className="w-full h-7 sm:h-10 bg-gradient-to-t from-amber-900 to-amber-800 rounded-b-xl sm:rounded-b-2xl border-t border-amber-700 flex items-center justify-center font-black text-amber-200 text-[10px] sm:text-xs">
                    🥉 BRONZE (3RD PLACE)
                  </div>
                </div>
              )}
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
              href="/"
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
                  <th className="py-2.5 px-3">IMDb</th>
                  <th className="py-2.5 px-4 text-center">Total Votes</th>
                  <th className="py-2.5 px-4">Supporters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((item, index) => {
                  const genreMeta = GENRE_INFO[item.movie.genre] || {
                    emoji: item.movie.genreEmoji,
                    label: item.movie.genre,
                  };

                  return (
                    <tr
                      key={item.movie.id}
                      className={`hover:bg-slate-800/40 transition ${
                        index === 0 && item.votes > 0 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold">
                        {index === 0 && item.votes > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-black">
                            🥇 Gold #1
                          </span>
                        ) : index === 1 && item.votes > 0 ? (
                          <span className="inline-flex items-center gap-1 text-slate-200 font-black">
                            🥈 Silver #2
                          </span>
                        ) : index === 2 && item.votes > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-black">
                            🥉 Bronze #3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{index + 1}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <Link
                          href={`/movie/${item.movie.id}`}
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

                      <td className="py-2.5 px-3 font-bold text-xs text-yellow-400 whitespace-nowrap">
                        ⭐ {item.movie.imdbRating.toFixed(1)}
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
