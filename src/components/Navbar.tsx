'use client';

import { SessionCopyActions } from '@/components/SessionCopyActions';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVoter } from '@/context/VoterContext';
import { VoterPickerModal } from './VoterPickerModal';
import { VoterAvatar } from './VoterAvatar';
import { Film, Tv, Settings, LogOut, Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { currentVoter, openPicker, sessionId, logout, isHost } = useVoter();
  const { user } = useAuth();

  const voteUrl = `/s/${sessionId}`;
  const liveUrl = `/s/${sessionId}/live`;
  const adminUrl = `/s/${sessionId}/admin`;

  const isVoteActive = pathname === voteUrl || pathname === '/';
  const isLiveActive = pathname === liveUrl || pathname === '/live';
  const isAdminActive = pathname === adminUrl || pathname === '/admin';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Session Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Logo Link - site icon logo is the home button */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition group"
              title="MovieNight - Return to Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
                🍿
              </div>
              <span className="font-black text-white text-base sm:text-lg tracking-tight hidden min-[400px]:inline">
                MovieNight
              </span>
            </Link>

            {/* Session code with copy actions beside the navigation link */}
            <span className="inline-flex items-center gap-0.5">
            <Link
              href={voteUrl}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-amber-400 hover:border-amber-500/50 hover:bg-slate-800 transition"
              title="Session Code"
            >
              #{sessionId}
            </Link>
            <SessionCopyActions sessionId={sessionId} />
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href={voteUrl}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                isVoteActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden sm:inline">Ballot</span>
            </Link>

            <Link
              href={liveUrl}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                isLiveActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Podium</span>
            </Link>

            {isHost && (
              <Link
                href={adminUrl}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  isAdminActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span className="hidden sm:inline">Setup</span>
              </Link>
            )}
          </nav>

          {/* Voter Identity & Log Out */}
          <div className="flex items-center shrink-0">
            {currentVoter ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 shadow-sm text-left">
                  <VoterAvatar voter={currentVoter} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white max-w-[80px] sm:max-w-[120px] truncate leading-tight">
                      {currentVoter.name}
                    </span>
                    <span className="text-[9px] text-amber-400/80 leading-none">
                      {user ? 'Google' : 'Guest'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                  title="Sign Out / Log Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openPicker}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition shadow-sm text-xs font-bold"
              >
                <span>👤</span>
                <span className="truncate">Join In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <VoterPickerModal />
    </>
  );
}
