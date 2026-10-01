'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useHtmlDialog } from '@/hooks/useHtmlDialog';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userName: string;
  userAvatar?: string | null;
  userEmail?: string | null;
  newTitle: string;
  setNewTitle: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isCreating: boolean;
}

export function CreateSessionModal({
  isOpen,
  onClose,
  user,
  userName,
  userAvatar,
  userEmail,
  newTitle,
  setNewTitle,
  onSubmit,
  isCreating,
}: CreateSessionModalProps) {
  const { dialogRef, handleCancel, handleClick } = useHtmlDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby="create-session-title"
      className="relative w-[calc(100%-2rem)] max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl m-auto text-white outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
          🍿
        </div>
        <div>
          <h3 id="create-session-title" className="text-lg font-black text-white">
            New Movie Night
          </h3>
          <p className="text-xs text-slate-400">Give your movie night a title to begin</p>
        </div>
      </div>

      {user && (
        <div className="mb-4 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-9 h-9 rounded-full border border-amber-400 object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 text-xs">
            <div className="text-white font-bold truncate flex items-center gap-1.5">
              <span>{userName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Host
              </span>
            </div>
            <div className="text-slate-400 text-[11px] truncate">{userEmail}</div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Movie Night Title
          </label>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Friday Family Night"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            autoFocus
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || !newTitle.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition active:scale-95 disabled:opacity-50 glow-gold"
          >
            {isCreating ? 'Creating Session...' : 'Continue'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
