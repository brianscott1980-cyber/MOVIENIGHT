'use client';

import React from 'react';
import { Users, UserCheck, Check, Plus, Trash2 } from 'lucide-react';
import { Voter } from '@/types';
import { VoterAvatar } from '@/components/VoterAvatar';

interface Step2VotersViewProps {
  maxVotesPerVoter: number;
  setMaxVotesPerVoter: (val: number) => void;
  movieAdditionMode: 'admin_only' | 'voter_suggestions';
  setMovieAdditionMode: (mode: 'admin_only' | 'voter_suggestions') => void;
  maxSuggestionsPerVoter: number;
  setMaxSuggestionsPerVoter: (val: number) => void;
  voters: Voter[];
  pastVoters: Voter[];
  onTogglePastVoter: (pv: Voter) => void;
  onRemoveVoter: (id: string) => void;
}

export function Step2VotersView({
  maxVotesPerVoter,
  setMaxVotesPerVoter,
  movieAdditionMode,
  setMovieAdditionMode,
  maxSuggestionsPerVoter,
  setMaxSuggestionsPerVoter,
  voters,
  pastVoters,
  onTogglePastVoter,
  onRemoveVoter,
}: Step2VotersViewProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-fadeIn">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Step 2: Voters &amp; Voting Rules</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure vote allowances, participant movie addition permissions, and eligible voters.
          </p>
        </div>
      </div>

      {/* Voting Rules Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
        {/* Max Votes per Person */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Number of Votes Per Person</span>
            <span className="text-[11px] text-amber-400 font-semibold">
              {maxVotesPerVoter === 0 ? 'Unlimited' : `${maxVotesPerVoter} vote(s)`}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 1, label: '1 Vote', desc: 'Single Pick' },
              { value: 3, label: '3 Votes', desc: 'Top 3 Picks' },
              { value: 5, label: '5 Votes', desc: 'Top 5 Picks' },
              { value: 0, label: 'Unlimited', desc: 'No Vote Cap' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMaxVotesPerVoter(opt.value)}
                className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition flex flex-col justify-between text-center ${
                  maxVotesPerVoter === opt.value
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold block">{opt.label}</span>
                <span className="text-[10px] opacity-80 block">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Participant Movie Additions */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Can Participants Add Movies?</span>
            <span className="text-[11px] text-amber-400 font-semibold">
              {movieAdditionMode === 'admin_only'
                ? 'Host Only'
                : maxSuggestionsPerVoter === 0
                ? 'Unlimited'
                : `${maxSuggestionsPerVoter} per person`}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMovieAdditionMode('admin_only');
                setMaxSuggestionsPerVoter(0);
              }}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition flex flex-col justify-between text-center ${
                movieAdditionMode === 'admin_only'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block">🚫 No</span>
              <span className="text-[10px] opacity-80 block">Host Only</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMovieAdditionMode('voter_suggestions');
                if (maxSuggestionsPerVoter <= 0) setMaxSuggestionsPerVoter(2);
              }}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition flex flex-col justify-between text-center ${
                movieAdditionMode === 'voter_suggestions' && maxSuggestionsPerVoter > 0
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block">🔢 Limited</span>
              <span className="text-[10px] opacity-80 block">
                {maxSuggestionsPerVoter > 0 ? `${maxSuggestionsPerVoter} max` : 'Set limit'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMovieAdditionMode('voter_suggestions');
                setMaxSuggestionsPerVoter(0);
              }}
              className={`p-3 min-h-[72px] rounded-xl text-xs font-bold border transition flex flex-col justify-between text-center ${
                movieAdditionMode === 'voter_suggestions' && maxSuggestionsPerVoter === 0
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block">♾️ Yes</span>
              <span className="text-[10px] opacity-80 block">Unlimited</span>
            </button>
          </div>

          {/* Sub-options for limited suggestions */}
          {movieAdditionMode === 'voter_suggestions' && maxSuggestionsPerVoter > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-400">Limit:</span>
              {[1, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMaxSuggestionsPerVoter(count)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    maxSuggestionsPerVoter === count
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {count} movie{count > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Add from Past Sessions (OAuth Only) */}
      {pastVoters.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-2.5">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              Quick Add from Your Past Sessions ({pastVoters.length})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            OAuth participants who joined sessions you previously managed. Tap to include in this session:
          </p>
          <div className="flex flex-wrap gap-2">
            {pastVoters.map((pv) => {
              const isIncluded = voters.some((v) => v.id === pv.id);
              return (
                <button
                  key={pv.id}
                  type="button"
                  onClick={() => onTogglePastVoter(pv)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                    isIncluded
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <VoterAvatar voter={pv} size="xs" />
                  <span>{pv.name}</span>
                  {isIncluded ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Session Voters Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Enrolled Voters ({voters.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Participants can also join dynamically with the 8-digit code
          </span>
        </div>

        {voters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {voters.map((voter) => (
              <div
                key={voter.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <VoterAvatar voter={voter} size="md" />
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm block truncate">{voter.name}</span>
                    <span className="text-[10px] text-slate-500">ID: {voter.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveVoter(voter.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                  title="Remove voter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No pre-enrolled voters yet. Select past voters above or let participants join dynamically using the 8-digit invite code.
          </div>
        )}
      </div>
    </div>
  );
}
