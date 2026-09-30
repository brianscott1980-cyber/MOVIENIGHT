'use client';

import React from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { DeadlockRule } from '@/types';

interface Step1RulesViewProps {
  sessionTitle: string;
  setSessionTitle: (title: string) => void;
  deadlockRule: DeadlockRule;
  setDeadlockRule: (rule: DeadlockRule) => void;
  isPublic: boolean;
  setIsPublic: (isPub: boolean) => void;
}

export function Step1RulesView({
  sessionTitle,
  setSessionTitle,
  deadlockRule,
  setDeadlockRule,
  isPublic,
  setIsPublic,
}: Step1RulesViewProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-fadeIn">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <span>Step 1: Session Naming & Event Rules</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Set up the event title, tie-breaker handling, and ballot privacy for this movie night.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Event Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Movie Night Title / Theme
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-amber-400"
            placeholder="e.g. Friday Sci-Fi Marathon Voting"
          />
        </div>

        {/* Tie-Break / Deadlock Rule */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Tie-Break / Deadlock Rule
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            What happens if two or more movies tie with the highest score:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeadlockRule('random')}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition text-left flex flex-col justify-between gap-1 ${
                deadlockRule === 'random'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm">
                <span>🎲</span>
                <span>Coin-Flip</span>
              </span>
              <span className="text-[10px] opacity-80">Randomly select between tied leaders</span>
            </button>
            <button
              type="button"
              onClick={() => setDeadlockRule('runoff')}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition text-left flex flex-col justify-between gap-1 ${
                deadlockRule === 'runoff'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm">
                <span>🔄</span>
                <span>Runoff Re-vote</span>
              </span>
              <span className="text-[10px] opacity-80">Re-vote solely between top tied films</span>
            </button>
          </div>
        </div>

        {/* Ballot Visibility & Listing (Public vs Private) */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Ballot Privacy & Visibility
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Whether this session is listed on the homepage for anyone or invite-only:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition text-left flex flex-col justify-between gap-1 ${
                isPublic
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm">
                <Eye className="w-4 h-4" />
                <span>Public Session</span>
              </span>
              <span className="text-[10px] opacity-80">Available for all to see and join on homepage</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition text-left flex flex-col justify-between gap-1 ${
                !isPublic
                  ? 'bg-purple-500 text-white border-purple-400 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm">
                <EyeOff className="w-4 h-4" />
                <span>Private Session 🔒</span>
              </span>
              <span className="text-[10px] opacity-80">Only visible to host or with the invite code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
