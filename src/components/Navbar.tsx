'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVoter } from '@/context/VoterContext';
import { VoterPickerModal } from './VoterPickerModal';
import { VoterAvatar } from './VoterAvatar';
import { Film, Tv, Settings, ChevronDown } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { currentVoter, openPicker } = useVoter();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0" title="MovieNight Home">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              🍿
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                pathname === '/'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Vote</span>
            </Link>

            <Link
              href="/live"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                pathname === '/live'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span>Live TV</span>
            </Link>

            <Link
              href="/admin"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                pathname === '/admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span className="hidden sm:inline">Setup</span>
            </Link>
          </nav>

          {/* Voter Profile Switcher Button */}
          <div className="flex items-center shrink-0">
            {currentVoter ? (
              <button
                onClick={openPicker}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-amber-500/50 hover:bg-slate-800 transition shadow-sm text-left group"
              >
                <VoterAvatar voter={currentVoter} size="sm" />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white max-w-[70px] sm:max-w-none truncate">
                    {currentVoter.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition" />
                </div>
              </button>
            ) : (
              <button
                onClick={openPicker}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition shadow-sm text-xs font-bold"
              >
                <span>👤</span>
                <span className="truncate">Who are you?</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <VoterPickerModal />
    </>
  );
}
