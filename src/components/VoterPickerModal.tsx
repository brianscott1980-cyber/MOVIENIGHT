'use client';

import React, { useState, useEffect } from 'react';
import { useVoter } from '@/context/VoterContext';
import { useAuth } from '@/context/AuthContext';
import { Voter } from '@/types';
import { VoterAvatar } from './VoterAvatar';
import {
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  History,
  Crown,
  Film,
} from 'lucide-react';

interface VoterPickerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const PRESET_AVATARS = [
  { emoji: '🍿', label: 'Popcorn' },
  { emoji: '🎬', label: 'Clapper' },
  { emoji: '🕶️', label: 'Sunglasses' },
  { emoji: '🌟', label: 'Star' },
  { emoji: '🥤', label: 'Soda' },
  { emoji: '🎟️', label: 'Ticket' },
  { emoji: '📽️', label: 'Projector' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🤠', label: 'Cowboy' },
  { emoji: '🧙', label: 'Wizard' },
  { emoji: '🦹', label: 'Hero' },
  { emoji: '🤖', label: 'Robot' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '👻', label: 'Ghost' },
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '👑', label: 'Crown' },
];

export function VoterPickerModal({ isOpen, onClose }: VoterPickerModalProps = {}) {
  const { sessionId, currentVoter, setCurrentVoter, sessionData, isPickerOpen, closePicker, refreshSession } = useVoter();
  const { user, userName, userAvatar, userEmail, signInWithOAuth } = useAuth();

  const actuallyOpen = isOpen !== undefined ? isOpen : isPickerOpen;
  const handleClose = onClose || closePicker;

  if (sessionData?.session?.status === 'locked') {
    return null;
  }

  const voters = sessionData?.session?.voters || [];
  const ballots = sessionData?.session?.ballots || {};

  // Modes: 'choose-method' | 'guest-form'
  const [viewMode, setViewMode] = useState<'choose-method' | 'guest-form'>('choose-method');
  const [guestName, setGuestName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍿');
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recall client-side stored profile from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const gName = localStorage.getItem('movienight_guest_name');
      const gAvatar = localStorage.getItem('movienight_guest_avatar');
      if (gName) {
        setGuestName(gName);
        if (gAvatar) setSelectedAvatar(gAvatar);
        setHasSavedProfile(true);
        return;
      }

      const storedGuestJson = localStorage.getItem('movienight_guest_profile');
      if (storedGuestJson) {
        const parsed = JSON.parse(storedGuestJson);
        if (parsed.name) {
          setGuestName(parsed.name);
          if (parsed.avatar) setSelectedAvatar(parsed.avatar);
          setHasSavedProfile(true);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // Always offer Google and guest entry when an unsigned-in visitor opens Join In.
  useEffect(() => {
    if (actuallyOpen) {
      if (user) {
        setViewMode('guest-form');
        if (userName) setGuestName(userName);
      } else {
        setViewMode('choose-method');
      }
    }
  }, [actuallyOpen, user, userName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentVoter) handleClose();
    };
    if (actuallyOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actuallyOpen, handleClose, currentVoter]);

  if (!actuallyOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = guestName.trim();
    if (!cleanName) {
      setErrorMessage('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // If user is logged in via OAuth, attach their photo and user credentials
      const payloadAvatar = (user && userAvatar) ? userAvatar : selectedAvatar;

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-voter',
          sessionId,
          name: cleanName,
          avatar: payloadAvatar,
          userId: user?.id || null,
          email: user?.email || userEmail || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join session');
      }

      const responseData = await res.json();
      if (responseData.voter) {
        setCurrentVoter(responseData.voter);
      }

      // Store in browser client-side for recall on entering future sessions!
      if (!user && typeof window !== 'undefined') {
        localStorage.setItem('movienight_guest_name', cleanName);
        localStorage.setItem('movienight_guest_avatar', selectedAvatar);
        localStorage.setItem(
          'movienight_guest_profile',
          JSON.stringify({
            name: cleanName,
            avatar: selectedAvatar,
          })
        );
      }

      await refreshSession();
      handleClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to join movie night');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithOAuth('google');
    } catch (err) {
      console.error('Google sign in error:', err);
      setIsSubmitting(false);
    }
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

        {/* Modal Header */}
        <div className="text-center mb-4 shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-gradient-to-tr from-amber-500 to-red-600 rounded-2xl text-2xl shadow-lg shadow-amber-500/20">
            🍿
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            {viewMode === 'choose-method'
              ? 'Join In'
              : user
              ? 'Your Profile'
              : 'Set Your Voter Profile'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'choose-method'
              ? 'Choose how you would like to participate in this session'
              : 'Enter your name and choose an avatar to identify your votes'}
          </p>
        </div>

        {/* 1. CHOOSE METHOD SCREEN (Guest vs OAuth choice) */}
        {viewMode === 'choose-method' && !user && (
          <div className="flex-1 overflow-y-auto space-y-4 py-1">
            {/* OAuth Option */}
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recommended</span>
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  Full Features
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">
                Sign In with Google
              </h3>

              <ul className="text-xs text-slate-300 space-y-1.5 mb-4">
                <li className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Find & revisit all past sessions you took part in</span>
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Be added directly to future sessions by hosts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Create and host your own movie night sessions</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-98"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Guest Option */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950/60 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-bold text-white">
                  Take Part Without Registering
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Fast Join
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
                Join immediately as a guest. Just set your name and avatar once to vote across all movie nights.
              </p>

              {hasSavedProfile && (
                <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <span className="text-base">{selectedAvatar}</span>
                  <span>
                    Saved profile found: <strong>{guestName}</strong>
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setViewMode('guest-form')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-amber-400/50 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. GUEST / PROFILE FORM SCREEN */}
        {viewMode === 'guest-form' && (
          <form onSubmit={handleJoinSubmit} className="flex-1 overflow-y-auto space-y-4 px-1">
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs">
                {errorMessage}
              </div>
            )}

            {user ? (
              <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    {userName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">
                    Signed in as {userName || userEmail}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    ✓ OAuth verified &bull; Saved to your past sessions history
                  </div>
                </div>
              </div>
            ) : hasSavedProfile ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <span>✨ Saved in this browser</span>
                <span className="text-[10px] text-slate-400">Applies to all sessions</span>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Alex, Sam, CinemaBuff"
                maxLength={30}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition"
              />
            </div>

            {!user && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Choose Your Avatar
                </label>
                <div className="grid grid-cols-6 gap-2 p-2 bg-slate-950/80 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto">
                  {PRESET_AVATARS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedAvatar(item.emoji)}
                      className={`h-10 flex items-center justify-center text-xl rounded-xl transition ${
                        selectedAvatar === item.emoji
                          ? 'bg-amber-500/30 border-2 border-amber-400 scale-105 shadow'
                          : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
                      }`}
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !guestName.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 glow-gold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save & Continue</span>
                </>
              )}
            </button>

            {!user && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('choose-method')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  &larr; Back to sign in options
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 shrink-0">
          💾 Saved in your browser for all sessions &bull; Log out anytime to clear
        </div>
      </div>
    </div>
  );
}
