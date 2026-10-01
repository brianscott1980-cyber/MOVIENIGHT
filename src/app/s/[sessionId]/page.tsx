'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVoter } from '@/context/VoterContext';
import { useAuth } from '@/context/AuthContext';
import { Movie } from '@/types';
import { MovieDetailModal } from '@/components/MovieDetailModal';
import { AddCustomMovieModal } from '@/components/AddCustomMovieModal';
import { trackAdminAction } from '@/lib/analytics';

// Sub-screen views
import { BallotWaitingRoom } from './components/BallotWaitingRoom';
import { BallotHostBanner } from './components/BallotHostBanner';
import { BallotOutcomeBanner } from './components/BallotOutcomeBanner';
import { BallotHeroHeader } from './components/BallotHeroHeader';
import { BallotFiltersBar } from './components/BallotFiltersBar';
import { BallotMovieGrid } from './components/BallotMovieGrid';

export default function SessionVotingPage() {
  const router = useRouter();
  const { sessionId, sessionData, votedMovieIds, refreshSession, currentVoter, openPicker, isLoading, openSuggestModalSignal, setPendingAction, toggleMovieVote } = useVoter();
  const { user, userEmail } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'random' | 'imdb' | 'year' | 'title' | 'default'>('random');
  const [randomSeedMap, setRandomSeedMap] = useState<Record<string, number>>({});
  const [modalConfig, setModalConfig] = useState<{ movie: Movie; autoPlay: boolean } | null>(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Trigger suggest modal if requested by pending action signal
  useEffect(() => {
    if (openSuggestModalSignal > 0) {
      setIsSuggestModalOpen(true);
    }
  }, [openSuggestModalSignal]);

  // If vote ended, default view is the live podium outcome unless explicit view=ballot is requested
  useEffect(() => {
    if (!sessionData?.session) return;
    if (sessionData.session.status === 'locked') {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') !== 'ballot') {
          router.replace(`/s/${sessionId}/live`);
        }
      }
    }
  }, [sessionData, sessionId, router]);

  // Candidate movies come from the database.
  const allCandidateMovies: Movie[] = useMemo(() => {
    if (sessionData?.allAvailableMovies && sessionData.allAvailableMovies.length > 0) {
      return sessionData.allAvailableMovies;
    }
    return [];
  }, [sessionData]);

  const suggestionLimit = sessionData?.session?.maxSuggestionsPerVoter ?? 2;
  const suggestionsUsed = currentVoter
    ? allCandidateMovies.filter((movie) => movie.addedByVoterId === currentVoter.id).length
    : 0;
  const suggestionsRemaining = Math.max(0, suggestionLimit - suggestionsUsed);
  const suggestionLimitReached = Boolean(currentVoter && suggestionLimit > 0 && suggestionsRemaining === 0);

  // Shuffle movie order randomly on initial load
  const shuffleMovies = () => {
    const ids = allCandidateMovies.map((m) => m.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const map: Record<string, number> = {};
    ids.forEach((id, idx) => {
      map[id] = idx;
    });
    setRandomSeedMap(map);
  };

  useEffect(() => {
    shuffleMovies();
  }, [allCandidateMovies.length]);

  const handleOpenDetails = (movie: Movie, autoPlay: boolean = false) => {
    setModalConfig({ movie, autoPlay });
  };

  const activeIds = useMemo(() => {
    if (!sessionData?.session) return [];
    return sessionData.session.activeMovieIds || [];
  }, [sessionData]);

  const isHost = useMemo(() => {
    if (!sessionData?.session) return false;
    if (!user && !userEmail) return false;
    const creatorUserId = sessionData.session.creatorUserId;
    const creatorEmail = sessionData.session.creatorEmail;
    if (user?.id && creatorUserId && user.id === creatorUserId) return true;
    if (userEmail && creatorEmail && userEmail.toLowerCase() === creatorEmail.toLowerCase()) return true;
    return false;
  }, [sessionData, user, userEmail]);

  const [isStartingVote, setIsStartingVote] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosingVote, setIsClosingVote] = useState(false);
  const [isReopeningVote, setIsReopeningVote] = useState(false);

  const isReadyToStart = Boolean(
    sessionData?.session?.sessionTitle?.trim() && (sessionData?.session?.activeMovieIds?.length || 0) > 0
  );

  const handleStartVote = async () => {
    if (!isReadyToStart) return;
    setIsStartingVote(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'launch',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        trackAdminAction({
          sessionId,
          action: 'launch',
          sessionTitle: sessionData?.session?.sessionTitle,
          movieCount: sessionData?.session?.activeMovieIds?.length,
        });
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to start vote:', err);
    } finally {
      setIsStartingVote(false);
    }
  };

  const handlePauseVote = async () => {
    setIsPausing(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'pause',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        trackAdminAction({ sessionId, action: 'pause' });
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to pause vote:', err);
    } finally {
      setIsPausing(false);
    }
  };

  const handleResumeVote = async () => {
    setIsResuming(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'resume',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        trackAdminAction({ sessionId, action: 'resume' });
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to resume vote:', err);
    } finally {
      setIsResuming(false);
    }
  };

  const handleCloseVote = async () => {
    if (!confirm('Are you sure you want to close voting? Anyone joining will no longer be able to vote and the podium outcome will be shown.')) return;
    setIsClosingVote(true);
    try {
      const topMovie = sessionData?.leaderboard?.[0]?.movie;
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'lock',
          winnerMovieId: topMovie?.id || null,
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        trackAdminAction({
          sessionId,
          action: 'close',
          sessionTitle: sessionData?.session?.sessionTitle,
        });
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to close vote:', err);
    } finally {
      setIsClosingVote(false);
    }
  };

  const handleReopenVote = async () => {
    setIsReopeningVote(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'unlock',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        trackAdminAction({
          sessionId,
          action: 'reopen',
          sessionTitle: sessionData?.session?.sessionTitle,
        });
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to re-open vote:', err);
    } finally {
      setIsReopeningVote(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'delete',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        trackAdminAction({
          sessionId,
          action: 'delete_session',
          sessionTitle: sessionData?.session?.sessionTitle,
        });
        router.replace('/');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter movies by search query, selected genre, and active session filter
  const filteredMovies = useMemo(() => {
    return allCandidateMovies
      .filter((movie) => {
        if (!activeIds.includes(movie.id)) {
          return false;
        }

        const matchesSearch =
          movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.cast.some((actor) => actor.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesGenre = selectedGenre === 'all' || movie.genre === selectedGenre;

        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy === 'imdb') {
          return (b.tmdbRating ?? b.imdbRating) - (a.tmdbRating ?? a.imdbRating);
        }
        if (sortBy === 'year') {
          return b.year - a.year;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'random') {
          const rankA = randomSeedMap[a.id] ?? 0;
          const rankB = randomSeedMap[b.id] ?? 0;
          return rankA - rankB;
        }
        return 0;
      });
  }, [allCandidateMovies, activeIds, searchQuery, selectedGenre, sortBy, randomSeedMap]);

  if (sessionData?.expired || (sessionData && !sessionData.session)) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4">
          🍿
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Session Not Found or Deleted</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          This movie night session does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-md transition hover:bg-amber-400"
        >
          Return to All Sessions
        </Link>
      </div>
    );
  }

  // If session is still in setup and viewer is NOT the host, show guest waiting room
  if (sessionData?.session && sessionData.session.status === 'setup' && !isHost) {
    return (
      <BallotWaitingRoom
        mode="setup"
        sessionId={sessionId}
        session={sessionData.session}
      />
    );
  }

  // If session is paused and viewer is NOT the host, show guest paused waiting room
  if (sessionData?.session && sessionData.session.status === 'paused' && !isHost) {
    return (
      <BallotWaitingRoom
        mode="paused"
        sessionId={sessionId}
        session={sessionData.session}
      />
    );
  }

  const maxVotes = sessionData?.session?.maxVotesPerVoter ?? 0;

  return (
    <div className="min-h-screen pb-12 w-full max-w-[100vw] overflow-x-hidden">
      {/* Prominent Host Action Banner */}
      {isHost && sessionData?.session && (
        <BallotHostBanner
          sessionId={sessionId}
          session={sessionData.session}
          isReadyToStart={isReadyToStart}
          isStartingVote={isStartingVote}
          isPausing={isPausing}
          isResuming={isResuming}
          isClosingVote={isClosingVote}
          isReopeningVote={isReopeningVote}
          isDeleting={isDeleting}
          onStartVote={handleStartVote}
          onPauseVote={handlePauseVote}
          onResumeVote={handleResumeVote}
          onCloseVote={handleCloseVote}
          onReopenVote={handleReopenVote}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Voting Concluded Outcome Callout Banner */}
      {sessionData?.session?.status === 'locked' && (
        <BallotOutcomeBanner sessionId={sessionId} />
      )}

      {/* Hero Welcome Banner */}
      {sessionData?.session && (
        <BallotHeroHeader
          sessionId={sessionId}
          session={sessionData.session}
          maxVotes={maxVotes}
          votedCount={votedMovieIds.length}
          isHost={isHost}
        />
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12">
        {/* Filter, Search & Sorting Bar */}
        <BallotFiltersBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onShuffle={() => {
            shuffleMovies();
            setSortBy('random');
          }}
          selectedGenre={selectedGenre}
          setSelectedGenre={setSelectedGenre}
          activeMovieIds={activeIds}
          allCandidateMovies={allCandidateMovies}
          movieAdditionMode={sessionData?.session?.movieAdditionMode || 'voter_suggestions'}
          currentVoter={currentVoter}
          suggestionLimit={suggestionLimit}
          suggestionsRemaining={suggestionsRemaining}
          suggestionLimitReached={suggestionLimitReached}
          onOpenSuggestModal={() => setIsSuggestModalOpen(true)}
          onOpenPicker={() => {
            setPendingAction({ type: 'suggest', sessionId });
            openPicker();
          }}
        />

        {/* Movies Grid */}
        <BallotMovieGrid
          sessionId={sessionId}
          activeCount={activeIds.length}
          filteredMovies={filteredMovies}
          isLoading={isLoading}
          onOpenDetails={handleOpenDetails}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedGenre('all');
          }}
        />
      </main>

      {/* Fast Detail & Trailer Modal */}
      {modalConfig && (
        <MovieDetailModal
          movie={modalConfig.movie}
          autoPlay={modalConfig.autoPlay}
          onClose={() => setModalConfig(null)}
        />
      )}

      {/* Participant Suggest Movie Modal */}
      <AddCustomMovieModal
        isOpen={isSuggestModalOpen && Boolean(currentVoter)}
        onClose={() => setIsSuggestModalOpen(false)}
        sessionId={sessionId}
        addedByVoterId={currentVoter?.id}
        canVote={sessionData?.session?.status === 'voting'}
        onMovieAdded={async (movie, andVote) => {
          await refreshSession();
          if (andVote && movie?.id) {
            await toggleMovieVote(movie.id);
          }
        }}
      />
    </div>
  );
}
