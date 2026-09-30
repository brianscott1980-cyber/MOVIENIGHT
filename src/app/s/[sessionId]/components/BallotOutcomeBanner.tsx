'use client';

import React from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';

interface BallotOutcomeBannerProps {
  sessionId: string;
}

export function BallotOutcomeBanner({ sessionId }: BallotOutcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-purple-950/90 border-b-2 border-purple-500/50 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2 justify-center sm:justify-start">
              <span>Voting Has Ended &bull; Tonight&apos;s Winner Decided!</span>
            </h3>
            <p className="text-xs text-purple-200/80">
              The ballot is now closed to new votes. View the crowned winner and podium outcome on the live podium.
            </p>
          </div>
        </div>
        <Link
          href={`/s/${sessionId}/live`}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-lg glow-gold shrink-0 flex items-center justify-center gap-1.5"
        >
          <Tv className="w-4 h-4" />
          <span>Watch Live Podium Outcome 🏆</span>
        </Link>
      </div>
    </div>
  );
}
