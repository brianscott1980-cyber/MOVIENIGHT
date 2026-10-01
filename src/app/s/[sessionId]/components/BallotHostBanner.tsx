'use client';

import React from 'react';
import Link from 'next/link';
import { Tv, Rocket, Lock, Unlock } from 'lucide-react';
import { SessionConfig } from '@/types';

interface BallotHostBannerProps {
  sessionId: string;
  session: SessionConfig;
  isReadyToStart: boolean;
  isStartingVote: boolean;
  isPausing: boolean;
  isResuming: boolean;
  isClosingVote: boolean;
  isReopeningVote: boolean;
  isDeleting: boolean;
  onStartVote: () => void;
  onPauseVote: () => void;
  onResumeVote: () => void;
  onCloseVote: () => void;
  onReopenVote: () => void;
  onDeleteSession: () => void;
}

export function BallotHostBanner({
  sessionId,
  session,
  isReadyToStart,
  isStartingVote,
  isPausing,
  isResuming,
  isClosingVote,
  isReopeningVote,
  isDeleting,
  onStartVote,
  onPauseVote,
  onResumeVote,
  onCloseVote,
  onReopenVote,
  onDeleteSession,
}: BallotHostBannerProps) {
  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-2xl border-b-2 border-amber-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-3">
        {/* Host Status text - concise on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-950/20 flex items-center justify-center text-sm sm:text-xl shrink-0">
            👑
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-black text-xs sm:text-sm uppercase tracking-wide truncate block">
              {session.status === 'setup'
                ? 'Host: Setup'
                : session.status === 'paused'
                ? 'Host: Paused'
                : session.status === 'locked'
                ? 'Host: Voting Concluded'
                : 'Host: Voting Live'}
            </span>
            <p className="text-[11px] sm:text-xs font-bold text-slate-900/90 hidden sm:block">
              {session.status === 'setup'
                ? 'Guests see a waiting room until you launch. Review your lineup below or start voting now.'
                : session.status === 'paused'
                ? 'Guests currently see a paused screen. Resume voting whenever you are ready.'
                : session.status === 'locked'
                ? 'Voting has ended. Visitors see the live podium outcome. You can re-open voting if needed.'
                : 'Manage session controls below or navigate to full settings.'}
            </p>
          </div>
        </div>

        {/* Action Controls - Fits on ONE single horizontal row on mobile (scrollbar-none + flex-nowrap) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none shrink-0 w-full md:w-auto">
          <Link
            href={`/s/${sessionId}/live`}
            className="flex-1 md:flex-initial px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 text-[11px] sm:text-xs font-black transition text-center shadow flex items-center justify-center gap-1 shrink-0"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Podium</span>
          </Link>

          <Link
            href={`/s/${sessionId}/admin`}
            className="flex-1 md:flex-initial px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 text-[11px] sm:text-xs font-black transition text-center shadow shrink-0"
          >
            <span className="sm:hidden">Setup ⚙️</span>
            <span className="hidden sm:inline">Settings ⚙️</span>
          </Link>

          {session.status === 'setup' && (
            <button
              onClick={onStartVote}
              disabled={!isReadyToStart || isStartingVote}
              title={
                !isReadyToStart
                  ? (session.activeMovieIds?.length || 0) === 0
                    ? 'Select at least 1 movie in Settings before starting voting'
                    : 'Session title is required'
                  : 'Launch voting for all participants'
              }
              className={`flex-1 md:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition shadow-xl flex items-center justify-center gap-1.5 shrink-0 ${
                !isReadyToStart || isStartingVote
                  ? 'bg-slate-950/60 text-slate-500 border border-slate-800 opacity-50 cursor-not-allowed'
                  : 'bg-slate-950 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 active:scale-95 glow-cyan'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isStartingVote ? 'Starting…' : 'Start'}</span>
            </button>
          )}

          {session.status === 'voting' && (
            <button
              onClick={onPauseVote}
              disabled={isPausing}
              className="flex-1 md:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-orange-400 hover:text-orange-300 text-[11px] sm:text-xs font-black transition shadow-xl flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <span>{isPausing ? 'Pausing…' : '⏸️ Pause'}</span>
            </button>
          )}

          {session.status === 'paused' && (
            <button
              onClick={onResumeVote}
              disabled={isResuming}
              className="flex-1 md:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 text-[11px] sm:text-xs font-black transition shadow-xl flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <span>{isResuming ? 'Resuming…' : '▶️ Resume'}</span>
            </button>
          )}

          {(session.status === 'voting' || session.status === 'paused') && (
            <button
              onClick={onCloseVote}
              disabled={isClosingVote}
              className="flex-1 md:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800/80 text-[11px] sm:text-xs font-black transition shadow-xl flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isClosingVote ? 'Closing…' : 'Close'}</span>
            </button>
          )}

          {session.status === 'locked' && (
            <button
              onClick={onReopenVote}
              disabled={isReopeningVote}
              className="flex-1 md:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] sm:text-xs font-black transition shadow-xl flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isReopeningVote ? 'Re-opening…' : 'Re-open'}</span>
            </button>
          )}

          <button
            onClick={onDeleteSession}
            disabled={isDeleting}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 text-[11px] sm:text-xs font-black transition shadow flex items-center justify-center gap-1 active:scale-95 border border-red-800/50 shrink-0"
            title="Delete Session"
          >
            <span>🗑️</span>
            <span className="hidden sm:inline">{isDeleting ? 'Deleting…' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
