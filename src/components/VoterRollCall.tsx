'use client';

import React from 'react';
import { useVoter } from '@/context/VoterContext';
import { VoterAvatar } from '@/components/VoterAvatar';
import { Check, Clock, Users } from 'lucide-react';

export function VoterRollCall() {
  const { sessionData, currentVoter } = useVoter();

  if (!sessionData?.session) return null;

  const { voters, ballots } = sessionData.session;
  const { votedCount, totalVoters } = sessionData.turnout || { votedCount: 0, totalVoters: 0 };
  const percentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Voter Roll Call</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-semibold">
                {votedCount} / {totalVoters} Voted
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              {votedCount === totalVoters
                ? '🎉 Everyone has cast their vote!'
                : `${totalVoters - votedCount} waiting to cast their ballot`}
            </p>
          </div>
        </div>

        {/* Turnout Progress Bar */}
        <div className="w-full sm:w-48">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Turnout</span>
            <span className="font-semibold text-amber-400">{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Voter chips: Horizontally scrollable on small screens or wrap cleanly */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap scrollbar-none">
        {voters.map((voter) => {
          const ballot = ballots[voter.id];
          const hasVoted = Boolean(
            ballot &&
              ((Array.isArray(ballot.movieIds) && ballot.movieIds.length > 0) ||
                ballot.rank1MovieId ||
                ballot.rank2MovieId ||
                ballot.rank3MovieId)
          );
          const isCurrent = currentVoter?.id === voter.id;

          return (
            <div
              key={voter.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border shrink-0 ${
                isCurrent
                  ? 'border-amber-400/80 bg-amber-950/40 text-amber-300 shadow-sm ring-1 ring-amber-400/30'
                  : hasVoted
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400'
              }`}
            >
              <VoterAvatar voter={voter} size="xs" />
              <span>{voter.name}</span>
              {isCurrent && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold uppercase tracking-wider">
                  You
                </span>
              )}
              {hasVoted ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Clock className="w-3 h-3 text-slate-400 opacity-60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
