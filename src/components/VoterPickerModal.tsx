'use client';

import React, { useEffect } from 'react';
import { useVoter } from '@/context/VoterContext';
import { Voter } from '@/types';
import { VoterAvatar } from './VoterAvatar';
import { Check, X } from 'lucide-react';

interface VoterPickerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function VoterPickerModal({ isOpen, onClose }: VoterPickerModalProps = {}) {
  const { currentVoter, setCurrentVoter, sessionData, isPickerOpen, closePicker } = useVoter();

  const actuallyOpen = isOpen !== undefined ? isOpen : isPickerOpen;
  const handleClose = onClose || closePicker;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (actuallyOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actuallyOpen, handleClose]);

  if (!actuallyOpen) return null;

  const voters = sessionData?.session.voters || [];
  const ballots = sessionData?.session.ballots || {};

  const handleSelect = (voter: Voter) => {
    setCurrentVoter(voter);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-slate-900 border border-amber-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl glow-gold max-h-[90vh] flex flex-col">
        {currentVoter && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-slate-800 active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-4 sm:mb-6 shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-2.5 bg-gradient-to-tr from-amber-500 to-red-600 rounded-2xl text-2xl shadow-lg shadow-amber-500/20">
            🍿
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            Who are you?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pick your profile to cast votes from this device
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto p-1 flex-1">
          {voters.map((voter) => {
            const isSelected = currentVoter?.id === voter.id;
            const ballot = ballots[voter.id];
            const hasVoted = Boolean(
              ballot && (
                (ballot.movieIds && ballot.movieIds.length > 0) ||
                ballot.rank1MovieId || ballot.rank2MovieId || ballot.rank3MovieId
              )
            );

            return (
              <button
                key={voter.id}
                onClick={() => handleSelect(voter)}
                className={`relative flex items-center p-3 rounded-2xl border text-left transition-all active:scale-98 ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/40 shadow-lg glow-gold ring-1 ring-amber-400/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-amber-500/50 hover:bg-slate-800/80'
                }`}
              >
                <VoterAvatar voter={voter} size="md" className="mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate text-base">
                      {voter.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs">
                    {hasVoted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                        <Check className="w-3 h-3" /> Voted
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Ready to vote</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 shrink-0">
          💾 Saved on this device • Switch profiles anytime from the top bar
        </div>
      </div>
    </div>
  );
}
