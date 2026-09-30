'use client';

import React from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';

interface AdminStatusBannersProps {
  sessionId: string;
  isVotingLive: boolean;
  isLocked: boolean;
}

export function AdminStatusBanners({
  sessionId,
  isVotingLive,
  isLocked,
}: AdminStatusBannersProps) {
  if (isVotingLive) {
    return (
      <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
              🟢 Voting is Currently Live
            </span>
            <p className="text-xs text-slate-400">
              Participants can cast and adjust their ballots in real time.
            </p>
          </div>
        </div>
        <Link
          href={`/s/${sessionId}`}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
        >
          View Ballot
        </Link>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="p-4 rounded-2xl border border-purple-500/40 bg-purple-950/30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-400" />
          <div>
            <span className="text-xs font-black text-purple-300 uppercase tracking-wider block">
              🔒 Voting is Concluded &bull; Outcome Finalized
            </span>
            <p className="text-xs text-slate-400">
              Anyone joining the ballot can no longer vote. New visitors do not register; default view is the live podium outcome.
            </p>
          </div>
        </div>
        <Link
          href={`/s/${sessionId}/live`}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow"
        >
          <Tv className="w-4 h-4" />
          <span>View Podium Outcome</span>
        </Link>
      </div>
    );
  }

  return null;
}
