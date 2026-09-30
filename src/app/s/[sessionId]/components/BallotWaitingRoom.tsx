'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Tv } from 'lucide-react';
import { SessionCopyActions } from '@/components/SessionCopyActions';
import { SessionConfig } from '@/types';

interface BallotWaitingRoomProps {
  mode: 'setup' | 'paused';
  sessionId: string;
  session: SessionConfig;
}

export function BallotWaitingRoom({ mode, sessionId, session }: BallotWaitingRoomProps) {
  const isSetup = mode === 'setup';

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col justify-between">
      <div className="border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Sessions</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              Code: {sessionId} <SessionCopyActions sessionId={sessionId} />
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8">
        <div className="relative inline-block">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-2xl mx-auto ${
              isSetup
                ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 shadow-amber-500/30'
                : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 shadow-amber-500/30'
            }`}
          >
            {isSetup ? '🎬' : '⏸️'}
          </div>
          <div className="absolute -bottom-2 -right-4 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/50 text-[11px] font-black text-amber-300 shadow flex items-center gap-1.5">
            <span>{isSetup ? '⚙️' : '⏸️'}</span>
            <span>{isSetup ? 'SETUP IN PROGRESS' : 'VOTING PAUSED'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {isSetup
              ? 'The host is currently setting up the vote'
              : 'Voting Has Been Paused by the Host'}
          </h1>
          <p className="text-amber-400/90 text-sm font-semibold">
            {session.sessionTitle}
          </p>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2">
            {isSetup ? (
              <>
                The host{' '}
                {session.creatorName ? (
                  <strong className="text-slate-200 font-bold">({session.creatorName})</strong>
                ) : null}{' '}
                is currently configuring the lineup, rules, and contender films for this movie night. Please hold tight — your ballot will automatically unlock right here as soon as voting is launched!
              </>
            ) : (
              <>
                The host{' '}
                {session.creatorName ? (
                  <strong className="text-slate-200 font-bold">({session.creatorName})</strong>
                ) : null}{' '}
                has temporarily paused voting for this session. Please stay on this page — your ballot will automatically re-open as soon as the host resumes voting!
              </>
            )}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-md mx-auto space-y-2 text-left shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>Real-Time Waiting Room</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isSetup
              ? 'Keep this screen open! As soon as the host completes setup and launches the vote, your ballot will activate automatically without needing a refresh.'
              : 'Keep this screen open! As soon as voting is resumed, your voting interface will instantly reappear without needing to refresh.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/s/${sessionId}/live`}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <Tv className="w-4 h-4 text-red-400" />
            <span>Preview Live TV Podium</span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        MovieNight &bull; Collaborative living room voting made simple
      </footer>
    </div>
  );
}
