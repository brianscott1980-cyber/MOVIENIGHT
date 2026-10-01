'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Film, Plus, Image as ImageIcon, Video, Check, Search, Loader2, Star } from 'lucide-react';
import { CustomMovieInput, Movie } from '@/types';
import { STREAMING_NAMES, STREAMING_PLATFORMS, GENRE_INFO } from '@/data/moviesData';
import type { TmdbSearchResult } from '@/lib/tmdb';
import { trackAddMovie } from '@/lib/analytics';
import { useHtmlDialog } from '@/hooks/useHtmlDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMovieAdded: (movie: Movie, andVote?: boolean) => void;
  sessionId: string;
  addedByVoterId?: string;
  canVote?: boolean;
}

export function AddCustomMovieModal(props: Props) {
  return props.isOpen ? <MovieForm key={props.sessionId} {...props} /> : null;
}

function MovieForm({ onClose, onMovieAdded, sessionId, addedByVoterId, canVote = true }: Props) {
  const { dialogRef, handleCancel, handleClick } = useHtmlDialog({
    isOpen: true,
    onClose,
  });
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [genre, setGenre] = useState('sci-fi');
  const [ageRating, setAgeRating] = useState('');
  const [runtime, setRuntime] = useState(0);
  const [imdbRating, setImdbRating] = useState(0);
  const [synopsis, setSynopsis] = useState('');
  const [poster, setPoster] = useState('');
  const [trailerInput, setTrailerInput] = useState('');
  const [selectedStreaming, setSelectedStreaming] = useState<string[]>([]);
  const [selected, setSelected] = useState<CustomMovieInput | null>(null);
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchController = useRef<AbortController | null>(null);
  const detailController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (manual || selected || title.trim().length < 2) return;
    const controller = new AbortController();
    searchController.current = controller;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(title.trim())}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed.');
        if (!controller.signal.aborted) { setResults(data.results); setSearched(true); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Search failed. Try manual entry.');
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [title, manual, selected]);
  useEffect(() => () => { detailController.current?.abort(); }, []);

  function changeTitle(value: string) {
    searchController.current?.abort();
    detailController.current?.abort();
    setTitle(value); setSelected(null); setResults([]); setSearched(false);
    setSearching(false); setImporting(false); setError('');
  }
  async function selectMovie(result: TmdbSearchResult) {
    searchController.current?.abort(); detailController.current?.abort();
    const controller = new AbortController(); detailController.current = controller;
    setImporting(true); setSearching(false); setError('');
    try {
      const res = await fetch(`/api/movies/search?tmdbId=${result.tmdbId}`, { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load movie details.');
      if (controller.signal.aborted) return;
      const movie: CustomMovieInput = data.movie;
      setSelected(movie); setTitle(movie.title); setResults([]);
      setYear(movie.year); setDirector(movie.director || ''); setCast((movie.cast || []).join(', '));
      setGenre(movie.genre || 'sci-fi'); setAgeRating(movie.rated || ''); setRuntime(Number(movie.runtime) || 0);
      setImdbRating(0); setSynopsis(movie.synopsis || ''); setPoster(movie.posterUrl || '');
      setTrailerInput(movie.youtubeTrailerId || ''); setSelectedStreaming((movie.streamingSources || []).map((id) => STREAMING_PLATFORMS.find((platform) => platform.id === id)?.name || id));
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load movie details.');
    } finally { if (!controller.signal.aborted) setImporting(false); }
  }
  function toggleMode() {
    searchController.current?.abort(); detailController.current?.abort();
    setSearching(false); setImporting(false); setError(''); setResults([]); setSearched(false);
    if (manual) setSelected(null);
    setManual(!manual);
  }
  function toggleStreamingSource(source: string) {
    setSelectedStreaming((previous) => previous.includes(source) ? previous.filter((s) => s !== source) : [...previous, source]);
  }
  function extractTrailerId(value: string) {
    const match = value.match(/(?:youtu\.be\/|[?&]v=|youtube\.com\/embed\/)([\w-]{11})/);
    return match?.[1] || value.trim();
  }
  async function handleAdd(andVote = false) {
    if (importing || isSubmitting || !title.trim() || (!manual && !selected)) return;
    setIsSubmitting(true); setError('');
    const payload: CustomMovieInput = manual ? {
      title: title.trim(), year, genre, director, cast: cast.split(',').map((name) => name.trim()).filter(Boolean),
      rated: ageRating, runtime: runtime || '', imdbRating, synopsis, posterUrl: poster,
      youtubeTrailerId: extractTrailerId(trailerInput), streamingSources: selectedStreaming,
    } : selected!;
    try {
      const res = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, action: 'add-custom-movie', movie: { ...payload, addedByVoterId } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add movie.');

      trackAddMovie({
        sessionId,
        movieId: data.movie?.id,
        movieTitle: data.movie?.title || payload.title,
        year: data.movie?.year || payload.year,
        genre: data.movie?.genre || payload.genre,
        isManual: manual,
        addedByVoterId,
      });

      onMovieAdded(data.movie, andVote);
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not add movie.'); }
    finally { setIsSubmitting(false); }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    handleAdd(false);
  }

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby="add-movie-title"
      className="relative mb-0 mt-auto w-full sm:m-auto sm:w-[calc(100%-2rem)] max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-8 shadow-2xl text-white outline-none"
    >
      <button type="button" onClick={onClose} aria-label="Close add movie" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        <h2 id="add-movie-title" className="text-2xl font-black text-white pr-8">{manual ? 'Add Movie Manually' : 'Find a Movie'}</h2>
        <p className="text-sm text-slate-400 mt-2">{manual ? 'Enter the details yourself when a movie cannot be found.' : 'Search by title, choose your movie, and we’ll fill in the details.'}</p>
        <button type="button" onClick={toggleMode} disabled={isSubmitting} className="text-xs text-amber-400 underline my-4">{manual ? 'Back to movie search' : 'Can’t find it? Add manually'}</button>
        {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-rose-950/60 text-sm text-rose-300">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="movie-title-search" className="block text-xs font-bold text-slate-300 mb-2">Movie title</label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input id="movie-title-search" autoFocus autoComplete="off" required value={title} disabled={isSubmitting} onChange={(e) => changeTitle(e.target.value)} placeholder="e.g. Inception, Gladiator, Dune…" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          {!manual && <div aria-live="polite">
            {(searching || importing) && <p className="flex gap-2 items-center text-amber-300 text-sm"><Loader2 className="w-4 h-4 animate-spin" />{importing ? 'Loading movie details…' : 'Searching TMDB…'}</p>}
            {!selected && !searching && !importing && searched && !results.length && <p className="text-sm text-slate-400">No movies found. Try another title or use manual entry.</p>}
            {!selected && !searched && !searching && !importing && !error && <p className="text-xs text-slate-500">Type at least two characters to search The Movie Database.</p>}
            {!!results.length && <div className="space-y-1 max-h-80 overflow-y-auto mt-2">
              {results.map((movie) => <button key={movie.tmdbId} type="button" disabled={importing} onClick={() => selectMovie(movie)} className="w-full flex gap-3 p-3 rounded-xl text-left hover:bg-slate-800 focus:bg-slate-800 disabled:opacity-50">
                {movie.posterUrl ? <img src={movie.posterUrl} alt="" className="w-12 h-16 object-cover rounded" /> : <Film className="w-12 h-16 text-slate-600" />}
                <span className="min-w-0"><span className="font-bold text-white">{movie.title} <span className="text-amber-300">{movie.year ? `(${movie.year})` : ''}</span></span><span className="block text-xs text-slate-400 line-clamp-2 mt-1">{movie.overview}</span></span>
              </button>)}
            </div>}
            {selected && <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 flex gap-4">
              {selected.posterUrl ? <img src={selected.posterUrl} alt={`${selected.title} poster`} className="w-24 h-36 rounded-lg object-cover" /> : <Film className="w-24 h-36 text-slate-600 shrink-0" />}
              <div className="min-w-0 text-sm"><h3 className="text-lg font-bold text-white">{selected.title}</h3><p className="text-slate-400">{selected.year || 'Year unknown'} · {selected.runtime ? `${selected.runtime} min` : 'Runtime unknown'} · {selected.rated || 'Not rated'}</p><p className="text-amber-300 mt-1">TMDB {selected.tmdbRating?.toFixed(1)} / 10</p><p className="text-slate-300 mt-2 line-clamp-4">{selected.synopsis}</p><p className="text-xs text-slate-500 mt-2">{selected.director}{selected.cast?.length ? ` · ${selected.cast.slice(0, 3).join(', ')}` : ''}</p>
              {selected.watchProvidersUrl && <a href={selected.watchProvidersUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-400 underline">Where to watch ({selected.watchRegion}) · JustWatch via TMDB</a>}
              </div>
            </div>}
          </div>}
          {manual && <>
          {/* Release Year, Primary Genre & Age Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Release Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={1900}
                max={2035}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Primary Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {Object.entries(GENRE_INFO).map(([id, info]) => <option key={id} value={id}>{info.label} {info.emoji}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Age Rating (UK / US)
              </label>
              <select
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {['', 'U', 'G', 'PG', '12', '12A', 'PG-13', '15', 'R', '18', 'NC-17'].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate || 'Unknown / Not rated'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Director & Cast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Director
              </label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. Denis Villeneuve"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Top Cast (Comma-separated)
              </label>
              <input
                type="text"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                placeholder="Timothée Chalamet, Zendaya..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* IMDb Rating & Runtime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>IMDb Score (0.0 &ndash; 10.0)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={imdbRating}
                onChange={(e) => setImdbRating(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Runtime (Minutes)
              </label>
              <input
                type="number"
                value={runtime}
                onChange={(e) => setRuntime(Number(e.target.value))}
                min={1}
                max={600}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Synopsis / Plot Summary
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Brief overview of the film plot..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Poster & Trailer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Poster Image URL</span>
              </label>
              <input
                type="url"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                placeholder="https://image.tmdb.org/t/p/w500/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-red-400" />
                <span>YouTube Trailer URL or ID</span>
              </label>
              <input
                type="text"
                value={trailerInput}
                onChange={(e) => setTrailerInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Streaming Platforms */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Available Media & Streaming Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {STREAMING_NAMES.map((source) => {
                const isSelected = selectedStreaming.includes(source);
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleStreamingSource(source)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{source}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
          </>}

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-800 sm:border-transparent text-center order-last sm:order-first"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAdd(false)}
              disabled={isSubmitting || importing || !title.trim() || (!manual && !selected)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex gap-2 items-center justify-center disabled:opacity-40 border border-slate-700 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding…' : 'Add Movie'}</span>
            </button>
            {canVote && (
              <button
                type="button"
                onClick={() => handleAdd(true)}
                disabled={isSubmitting || importing || !title.trim() || (!manual && !selected)}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex gap-2 items-center justify-center disabled:opacity-40 shadow-lg glow-gold transition active:scale-95"
              >
                <span>🗳️</span>
                <span>{isSubmitting ? 'Adding…' : 'Add Movie & Vote'}</span>
              </button>
            )}
          </div>
        </form>
        <p className="mt-4 text-[10px] text-slate-500">Movie data and images from <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </dialog>
  );
}
