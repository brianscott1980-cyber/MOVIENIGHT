'use client';

import React from 'react';
import Link from 'next/link';
import { SessionCopyActions } from '@/components/SessionCopyActions';
import {
  Settings,
  ArrowLeft,
  Share2,
  Check,
  RotateCcw,
  Save,
  Lock,
  Unlock,
  Rocket,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';

interface AdminHeaderProps {
  sessionId: string;
  isSetupMode: boolean;
  isVotingLive: boolean;
  isPaused: boolean;
  isLocked: boolean;
  isReadyToStart: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  copiedLink: boolean;
  isLaunching: boolean;
  isClosingSession: boolean;
  isReopeningSession: boolean;
  onCopyInvite: () => void;
  onResetVotes: () => void;
  onSaveConfig: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onCloseSession: () => void;
  onReopenSession: () => void;
  onDeleteSession: () => void;
  onLaunchSession: () => void;
}

export function AdminHeader({
  sessionId,
  isSetupMode,
  isVotingLive,
  isPaused,
  isLocked,
  isReadyToStart,
  isSaving,
  saveSuccess,
  copiedLink,
  isLaunching,
  isClosingSession,
  isReopeningSession,
  onCopyInvite,
  onResetVotes,
  onSaveConfig,
  onPauseSession,
  onResumeSession,
  onCloseSession,
  onReopenSession,
  onDeleteSession,
  onLaunchSession,
}: AdminHeaderProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-5 sm:py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/s/${sessionId}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Movie Night</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
            <span>{isSetupMode ? 'Movie Night Setup' : 'Session Settings'} &bull; {sessionId}</span>
            <SessionCopyActions sessionId={sessionId} />
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {isSetupMode
              ? '2-stage setup: curate movies and launch your session.'
              : 'Configure session rules, voters and permissions, or manage contender movies.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isSetupMode && (
            <button
              onClick={onCopyInvite}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          )}

          {!isSetupMode && (
            <button
              onClick={onResetVotes}
              className="px-3 py-2 rounded-xl border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onSaveConfig}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving…' : 'Save'}</span>
              </>
            )}
          </button>

          {isVotingLive && (
            <button
              onClick={onPauseSession}
              className="px-3.5 py-2 rounded-xl bg-orange-950/80 hover:bg-orange-900 text-orange-300 border border-orange-700/50 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={onResumeSession}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}

          {(isVotingLive || isPaused) && (
            <button
              onClick={onCloseSession}
              disabled={isClosingSession}
              className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/50 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isClosingSession ? 'Closing…' : 'Close'}</span>
            </button>
          )}

          {isLocked && (
            <button
              onClick={onReopenSession}
              disabled={isReopeningSession}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isReopeningSession ? 'Re-opening…' : 'Re-open'}</span>
            </button>
          )}

          <button
            onClick={onDeleteSession}
            className="px-3 py-2 rounded-xl border border-red-900/80 bg-red-950 hover:bg-red-900 text-red-200 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {isSetupMode && (
            <button
              onClick={onLaunchSession}
              disabled={!isReadyToStart || isLaunching}
              title={
                !isReadyToStart
                  ? 'Select at least 1 movie in Step 4 and enter a title before starting voting'
                  : 'Start voting now'
              }
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg active:scale-95 ${
                isReadyToStart
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 glow-cyan cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Rocket className="w-4 h-4 stroke-[2.5]" />
              <span>{isLaunching ? 'Starting…' : 'Launch'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
