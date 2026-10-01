'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, Film, AlertTriangle } from 'lucide-react';

export default function SessionErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Session route error boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col justify-between">
      {/* Top subtle bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
              🍿
            </div>
            <span className="font-black text-white text-sm sm:text-base tracking-tight">
              MovieNight
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>

      {/* Main recovery panel */}
      <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl shadow-xl shadow-amber-950/30 mx-auto">
          🍿
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Session Connection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Something went wrong loading this session
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto font-medium">
            We couldn&apos;t load the session ballot right now. This can happen if the network was interrupted or an unexpected error occurred.
          </p>
        </div>

        {/* Action recovery buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 active:scale-95 glow-gold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>All Sessions</span>
          </Link>
        </div>

        {error?.digest && (
          <p className="text-[10px] text-slate-600 font-mono">
            Error Ref: {error.digest}
          </p>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        MovieNight &bull; Collaborative Film Selection
      </footer>
    </div>
  );
}
