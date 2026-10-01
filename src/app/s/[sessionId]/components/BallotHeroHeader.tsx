'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, EyeOff, Tv, Settings } from 'lucide-react';
import { SessionCopyActions } from '@/components/SessionCopyActions';
import { VoterRollCall } from '@/components/VoterRollCall';
import { SessionConfig } from '@/types';

interface BallotHeroHeaderProps {
  sessionId: string;
  session: SessionConfig;
  maxVotes: number;
  votedCount: number;
  isHost: boolean;
}

export function BallotHeroHeader({
  sessionId,
  session,
  maxVotes,
  votedCount,
  isHost,
}: BallotHeroHeaderProps) {
  const isLocked = session.status === 'locked';
  const isSecret = session.isPublic === false;
  const formattedCode =
    sessionId.replace(/\D/g, '').length === 8
      ? `${sessionId.slice(0, 4)} ${sessionId.slice(4)}`
      : sessionId;

  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl flex-1 min-w-0">
            <div className="inline-flex flex-wrap items-center gap-2 mb-3">
              <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  🍿 Code: <strong className="font-mono">{formattedCode}</strong>
                </span>
                <SessionCopyActions sessionId={sessionId} />
              </div>

              {isLocked ? (
                <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  <span>🔒 Voting Closed</span>
                </div>
              ) : maxVotes > 0 ? (
                <div className="h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <span>🗳️ Max {maxVotes} Vote{maxVotes === 1 ? '' : 's'}</span>
                  <span className="text-slate-400">({votedCount}/{maxVotes} cast)</span>
                </div>
              ) : null}

              {isSecret && (
                <div className="h-8 inline-flex items-center gap-1 px-2.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
                  <EyeOff className="w-3 h-3 shrink-0" />
                  <span>Secret Ballot</span>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {isLocked ? (
                <>Lineup &amp; Results for <br /></>
              ) : (
                <>Cast Your Vote for <br /></>
              )}
              <span className="bg-gradient-to-r from-amber-400 via-red-400 to-rose-500 bg-clip-text text-transparent">
                {session.sessionTitle || `Movie Night #${sessionId}`}
              </span>
            </h1>
          </div>

          {/* Quick Links - Share width on mobile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
            <Link
              href={`/s/${sessionId}/live`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/20 transition transform hover:-translate-y-0.5 glow-red"
            >
              <Tv className="w-4 h-4" />
              <span>Watch Live Podium</span>
            </Link>
            {isHost && (
              <Link
                href={`/s/${sessionId}/admin`}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Session Setup</span>
              </Link>
            )}
          </div>
        </div>

        {/* Voter Roll Call Attendance Strip */}
        <div className="mt-8">
          <VoterRollCall />
        </div>
      </div>
    </section>
  );
}
