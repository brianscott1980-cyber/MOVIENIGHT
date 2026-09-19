'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVoter } from '@/context/VoterContext';
import { MOVIES_DATA, GENRE_INFO, DEFAULT_VOTERS } from '@/data/moviesData';
import { Voter } from '@/types';
import { VoterAvatar } from '@/components/VoterAvatar';
import {
  Settings,
  RotateCcw,
  Save,
  Check,
  Film,
  Users,
  Plus,
  Trash2,
  ArrowLeft,
  CheckSquare,
  Square,
} from 'lucide-react';

export default function AdminPage() {
  const { sessionData, refreshSession } = useVoter();

  const [sessionTitle, setSessionTitle] = useState('🍿 Movie Night Voting');
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [newVoterName, setNewVoterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (sessionData) {
      setSessionTitle(sessionData.session.sessionTitle);
      setSelectedMovieIds(sessionData.session.activeMovieIds);
      setSelectedGenres(sessionData.session.activeGenres);
      setVoters(sessionData.session.voters);
    } else {
      setSelectedMovieIds(MOVIES_DATA.map((m) => m.id));
      setSelectedGenres(Object.keys(GENRE_INFO));
      setVoters(DEFAULT_VOTERS);
    }
  }, [sessionData]);

  const toggleMovie = (id: string) => {
    setSelectedMovieIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const toggleGenre = (genreKey: string) => {
    const isCurrentlyActive = selectedGenres.includes(genreKey);
    const moviesInGenre = MOVIES_DATA.filter((m) => m.genre === genreKey).map((m) => m.id);

    if (isCurrentlyActive) {
      setSelectedGenres((prev) => prev.filter((g) => g !== genreKey));
      setSelectedMovieIds((prev) => prev.filter((id) => !moviesInGenre.includes(id)));
    } else {
      setSelectedGenres((prev) => [...prev, genreKey]);
      setSelectedMovieIds((prev) => Array.from(new Set([...prev, ...moviesInGenre])));
    }
  };

  const selectAllMovies = () => {
    setSelectedMovieIds(MOVIES_DATA.map((m) => m.id));
    setSelectedGenres(Object.keys(GENRE_INFO));
  };

  const clearAllMovies = () => {
    setSelectedMovieIds([]);
    setSelectedGenres([]);
  };

  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoterName.trim()) return;

    const id = newVoterName.toLowerCase().replace(/\s+/g, '-');
    if (voters.some((v) => v.id === id)) {
      alert('A voter with this name already exists.');
      return;
    }

    const avatars = ['🎬', '🍿', '🌟', '🥤', '🎟️', '🕶️', '📽️', '🎥', '✨'];
    const colors = [
      'from-amber-500 to-orange-600',
      'from-pink-500 to-rose-600',
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
    ];

    const newVoter: Voter = {
      id,
      name: newVoterName.trim(),
      avatar: avatars[voters.length % avatars.length],
      color: colors[voters.length % colors.length],
    };

    setVoters([...voters, newVoter]);
    setNewVoterName('');
  };

  const handleRemoveVoter = (id: string) => {
    if (voters.length <= 1) {
      alert('Must keep at least 1 voter.');
      return;
    }
    setVoters(voters.filter((v) => v.id !== id));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-config',
          sessionTitle,
          activeMovieIds: selectedMovieIds,
          activeGenres: selectedGenres,
          voters,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        await refreshSession();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('This will wipe all submitted votes so everyone can vote anew. Continue?')) {
      return;
    }

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        await refreshSession();
        alert('All ballots have been cleared!');
      }
    } catch (err) {
      console.error('Failed to reset votes:', err);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Movie Night</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
              <span>Session Setup</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Configure active movies, enabled genres, and who can vote
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetVotes}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ballots</span>
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg active:scale-95 glow-gold"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Lineup'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Session Title */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2">Event Title</h2>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full max-w-md px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-amber-400"
            placeholder="e.g. Friday Movie Night Voting"
          />
        </div>

        {/* Voters Management */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>Eligible Voters ({voters.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Brian, Suzi, Michelle, William, Aimee, Kimberley, Liam, or add extra guests
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
            {voters.map((voter) => (
              <div
                key={voter.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60"
              >
                <div className="flex items-center gap-2.5">
                  <VoterAvatar voter={voter} size="md" />
                  <div>
                    <span className="font-bold text-white text-sm block">{voter.name}</span>
                    <span className="text-[10px] text-slate-400">ID: {voter.id}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveVoter(voter.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                  title="Remove voter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Voter Input */}
          <form onSubmit={handleAddVoter} className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              value={newVoterName}
              onChange={(e) => setNewVoterName(e.target.value)}
              placeholder="Add guest name..."
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Genre Toggles */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Allowed Genres</h2>
              <p className="text-xs text-slate-400">
                Toggle genres to include or exclude groups of movies
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllMovies}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Select All
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={clearAllMovies}
                className="text-xs text-slate-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {Object.entries(GENRE_INFO).map(([key, meta]) => {
              const isActive = selectedGenres.includes(key);
              const count = MOVIES_DATA.filter((m) => m.genre === key).length;

              return (
                <button
                  key={key}
                  onClick={() => toggleGenre(key)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition flex items-center justify-between active:scale-95 ${
                    isActive
                      ? 'border-amber-400/80 bg-amber-950/30 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{meta.emoji}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{meta.label}</span>
                      <span className="text-[10px] text-slate-400">{count} films</span>
                    </div>
                  </div>
                  {isActive ? (
                    <CheckSquare className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-700 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Movie Selection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>Active Contender Movies ({selectedMovieIds.length} of {MOVIES_DATA.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Check or uncheck individual films to fine-tune the ballot lineup
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {MOVIES_DATA.map((movie) => {
              const isSelected = selectedMovieIds.includes(movie.id);

              return (
                <button
                  key={movie.id}
                  onClick={() => toggleMovie(movie.id)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 active:scale-95 ${
                    isSelected
                      ? 'border-amber-500/50 bg-amber-950/20 text-white'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold truncate block">{movie.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {movie.year} • ⭐ {movie.imdbRating.toFixed(1)} • {movie.genreEmoji}
                    </span>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
