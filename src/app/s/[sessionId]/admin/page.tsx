'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVoter } from '@/context/VoterContext';
import { useAuth } from '@/context/AuthContext';
import {
  GENRE_INFO,
  STREAMING_PLATFORMS,
  QUICK_IDEAS_PRESETS,
} from '@/data/moviesData';
import { matchesMovieCriteria, getSetupMovieChoices } from '@/lib/movieFilters';
import { Voter, Movie, AgeRatingLimit, DeadlockRule } from '@/types';
import { AddCustomMovieModal } from '@/components/AddCustomMovieModal';

// Sub-screen views
import { AdminHeader } from './components/AdminHeader';
import { AdminStatusBanners } from './components/AdminStatusBanners';
import { AdminStepTabs } from './components/AdminStepTabs';
import { AdminStepFooter } from './components/AdminStepFooter';
import { Step1RulesView } from './components/Step1RulesView';
import { Step2VotersView } from './components/Step2VotersView';
import { Step3ChoiceView } from './components/Step3ChoiceView';
import { Step3AiPromptView } from './components/Step3AiPromptView';
import { Step3SourcesView } from './components/Step3SourcesView';
import { Step4MoviesView } from './components/Step4MoviesView';

export default function SessionAdminPage() {
  const router = useRouter();
  const { sessionId, sessionData, refreshSession, isHost, isLoading } = useVoter();
  const { user, userEmail } = useAuth();

  const isSetupMode = sessionData?.session?.status === 'setup';
  // Setup mode starts on Step 3 (Stage 1: Curate Movies); settings mode starts on Step 1 (Naming & Rules)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(3);

  // Step 1: Session Naming & General Rules
  const [sessionTitle, setSessionTitle] = useState('');
  const [deadlockRule, setDeadlockRule] = useState<DeadlockRule>('random');
  const [voteWeightMode, setVoteWeightMode] = useState<'equal' | 'ranked'>('ranked');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Step 2: Voters & Voting Rules
  const [maxVotesPerVoter, setMaxVotesPerVoter] = useState<number>(3);
  const [movieAdditionMode, setMovieAdditionMode] = useState<'admin_only' | 'voter_suggestions'>('voter_suggestions');
  const [maxSuggestionsPerVoter, setMaxSuggestionsPerVoter] = useState<number>(2);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [pastVoters, setPastVoters] = useState<Voter[]>([]);

  // Step 3: Movie Sources & Content Criteria
  const [allowedSources, setAllowedSources] = useState<string[]>([]);
  const [allowedGenres, setAllowedGenres] = useState<string[]>([]);
  const [ageRatingLimit, setAgeRatingLimit] = useState<AgeRatingLimit>('ALL');

  // Step 3: Choice Mode ('ask' | 'ai' | 'sources') & AI Curation
  const [step3Mode, setStep3Mode] = useState<'ask' | 'ai' | 'sources'>('ask');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMovieCount, setAiMovieCount] = useState<number>(12);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenerationStatus, setAiGenerationStatus] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  const [aiSuccessCount, setAiSuccessCount] = useState<number | null>(null);

  // Step 4: Initial Movies Selection
  const [candidateMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [aiLookupMovieIds, setAiLookupMovieIds] = useState<string[] | null>(null);
  const [aiCustomMovies, setAiCustomMovies] = useState<Movie[]>([]);
  const [hasResetToCatalogue, setHasResetToCatalogue] = useState<boolean>(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [isReopeningSession, setIsReopeningSession] = useState(false);

  const initializedSession = useRef<string | null>(null);

  // Initialize the draft once; background polling must not overwrite edits.
  useEffect(() => {
    if (sessionData?.session && initializedSession.current !== sessionData.session.sessionId) {
      initializedSession.current = sessionData.session.sessionId;
      setSessionTitle(sessionData.session.sessionTitle || '');
      setSelectedMovieIds(sessionData.session.activeMovieIds || []);
      setAllowedGenres(sessionData.session.genreFilter?.length ? sessionData.session.genreFilter : sessionData.session.activeGenres || []);
      setVoters(sessionData.session.voters || []);
      setMaxVotesPerVoter(sessionData.session.maxVotesPerVoter ?? 3);
      setIsPublic(sessionData.session.isPublic ?? true);
      setDeadlockRule(sessionData.session.deadlockRule || 'random');
      setVoteWeightMode(sessionData.session.voteWeightMode || 'ranked');
      setAgeRatingLimit(sessionData.session.ageRatingLimit || 'ALL');
      setAllowedSources((sessionData.session.streamingFilter || []).map((source) => STREAMING_PLATFORMS.find((p) => p.name === source || p.id === source)?.id || source));
      setMovieAdditionMode(sessionData.session.movieAdditionMode || 'voter_suggestions');
      setMaxSuggestionsPerVoter(sessionData.session.maxSuggestionsPerVoter ?? 2);

      // Restore AI curation mode if persisted on session
      if (sessionData.session.isAiCurated && sessionData.session.aiMovieIds && sessionData.session.aiMovieIds.length > 0) {
        setAiLookupMovieIds(sessionData.session.aiMovieIds);
        setStep3Mode('ai');
        if (sessionData.session.aiPrompt) {
          setAiPrompt(sessionData.session.aiPrompt);
        }
      }

      // Initialize active view: Stage 1 (step 3) for setup mode, Step 1 for settings mode
      if (sessionData.session.status === 'setup') {
        setCurrentStep((prev) => (prev === 4 ? 4 : 3));
      } else {
        setCurrentStep((prev) => (prev === 3 ? 1 : prev));
      }
    }
  }, [sessionData]);

  // Fetch host's past voters
  const fetchPastVoters = useCallback(async () => {
    const hostEmail = sessionData?.session?.creatorEmail || userEmail;
    const hostUserId = sessionData?.session?.creatorUserId || user?.id;
    if (!hostEmail && !hostUserId) return;

    try {
      const res = await fetch(
        `/api/session?action=past-voters&hostEmail=${encodeURIComponent(
          hostEmail || ''
        )}&hostUserId=${encodeURIComponent(hostUserId || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setPastVoters(data.voters || []);
      }
    } catch (err) {
      console.error('Failed to fetch past voters:', err);
    }
  }, [sessionData, userEmail, user]);

  useEffect(() => {
    fetchPastVoters();
  }, [fetchPastVoters]);

  // Available movies from database
  const allMovies: Movie[] = useMemo(() => {
    const list = sessionData?.allAvailableMovies || [];
    const seen = new Set<string>();
    const deduplicated: Movie[] = [];
    for (const m of list) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        deduplicated.push(m);
      }
    }
    if (aiCustomMovies.length > 0) {
      for (const m of aiCustomMovies) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          deduplicated.push(m);
        }
      }
    }
    return deduplicated;
  }, [sessionData, aiCustomMovies]);

  // Determine effective AI movie IDs (from active state or persisted session metadata)
  const effectiveAiMovieIds = useMemo(() => {
    if (hasResetToCatalogue) return null;
    let ids: string[] | null = null;
    if (aiLookupMovieIds && aiLookupMovieIds.length > 0) ids = aiLookupMovieIds;
    else if (sessionData?.session?.isAiCurated && sessionData.session.aiMovieIds && sessionData.session.aiMovieIds.length > 0) {
      ids = sessionData.session.aiMovieIds;
    }
    return ids ? Array.from(new Set(ids)) : null;
  }, [hasResetToCatalogue, aiLookupMovieIds, sessionData?.session?.isAiCurated, sessionData?.session?.aiMovieIds]);

  const isAiCuratedMode = Boolean(effectiveAiMovieIds && effectiveAiMovieIds.length > 0);

  const doesMovieMatchCriteria = useCallback(
    (movie: Movie) => matchesMovieCriteria(movie, allowedSources, allowedGenres, ageRatingLimit),
    [allowedSources, allowedGenres, ageRatingLimit]
  );

  const setupMovieChoices = useMemo(() => {
    if (effectiveAiMovieIds !== null) {
      const movieMap = new Map(allMovies.map((m) => [m.id, m]));
      const seen = new Set<string>();
      const list: Movie[] = [];
      for (const id of effectiveAiMovieIds) {
        const m = movieMap.get(id);
        if (m && !seen.has(m.id)) {
          seen.add(m.id);
          list.push(m);
        }
      }
      return list;
    }
    return getSetupMovieChoices(allMovies, allowedSources, allowedGenres, ageRatingLimit);
  }, [effectiveAiMovieIds, allMovies, allowedSources, allowedGenres, ageRatingLimit]);

  const totalMatchingCriteriaMovies = useMemo(() => {
    if (effectiveAiMovieIds !== null) {
      return setupMovieChoices;
    }
    return allMovies.filter(doesMovieMatchCriteria);
  }, [effectiveAiMovieIds, setupMovieChoices, allMovies, doesMovieMatchCriteria]);

  const selectedMovieIds = useMemo(() => {
    const eligible = new Set(setupMovieChoices.map((movie) => movie.id));
    return candidateMovieIds.filter((id) => eligible.has(id));
  }, [candidateMovieIds, setupMovieChoices]);

  const visibleMoviesStep4 = useMemo(() => {
    return setupMovieChoices.filter((movie) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      const matchesTitle = movie.title.toLowerCase().includes(q);
      const matchesDirector = movie.director.toLowerCase().includes(q);
      const matchesCast = movie.cast.some((c) => c.toLowerCase().includes(q));
      return matchesTitle || matchesDirector || matchesCast;
    });
  }, [setupMovieChoices, searchFilter]);

  // Step 3 Decision / AI readiness check
  const hasGeneratedAi = Boolean(effectiveAiMovieIds && effectiveAiMovieIds.length > 0);
  const canProceedToStep4 = step3Mode === 'sources' || hasGeneratedAi;

  const handleSelectStep = (step: 1 | 2 | 3 | 4) => {
    if (isSetupMode) {
      if (step === 4 && !canProceedToStep4) return;
      setCurrentStep(step === 4 ? 4 : 3);
      return;
    }
    // After setup mode: Step 3 (sources/AI) is hidden and not selectable
    if (step === 3) return;
    setCurrentStep(step);
  };

  const handleNextStep = () => {
    if (currentStep === 3 && !canProceedToStep4) return;
    if (isSetupMode) {
      setCurrentStep(4);
    } else {
      setCurrentStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  // Step 2 Voter Handlers
  const handleTogglePastVoter = (pastVoter: Voter) => {
    const exists = voters.some((v) => v.id === pastVoter.id);
    if (exists) {
      setVoters(voters.filter((v) => v.id !== pastVoter.id));
    } else {
      setVoters([...voters, pastVoter]);
    }
  };

  const handleRemoveVoter = (id: string) => {
    setVoters(voters.filter((v) => v.id !== id));
  };

  // Step 3 Criteria Handlers
  const toggleSource = (sourceName: string) => {
    setAllowedSources((prev) =>
      prev.includes(sourceName) ? prev.filter((s) => s !== sourceName) : [...prev, sourceName]
    );
  };

  const selectAllSources = () => {
    setAllowedSources(STREAMING_PLATFORMS.map((platform) => platform.id));
  };

  const clearAllSources = () => {
    setAllowedSources([]);
  };

  const toggleAllowedGenre = (genreKey: string) => {
    setAllowedGenres((prev) =>
      prev.includes(genreKey) ? prev.filter((g) => g !== genreKey) : [...prev, genreKey]
    );
  };

  const selectAllGenres = () => {
    setAllowedGenres(Object.keys(GENRE_INFO));
  };

  const clearAllGenres = () => {
    setAllowedGenres([]);
  };

  // Step 4 Movie Handlers
  const toggleMovie = (id: string) => {
    setSelectedMovieIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const selectAllVisibleMovies = () => {
    const visibleIds = visibleMoviesStep4.map((m) => m.id);
    setSelectedMovieIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const deselectAllVisibleMovies = () => {
    const visibleIds = visibleMoviesStep4.map((m) => m.id);
    setSelectedMovieIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
  };

  const clearAllSelectedMovies = () => {
    setSelectedMovieIds([]);
  };

  const toggleQuickPreset = (presetTitle: string) => {
    const preset = QUICK_IDEAS_PRESETS.find((p) => p.title === presetTitle);
    if (!preset) return;

    const matchingIds = preset.movieIds.filter((id) => totalMatchingCriteriaMovies.some((movie) => movie.id === id));
    const allSelected = matchingIds.length > 0 && matchingIds.every((id) => selectedMovieIds.includes(id));
    if (allSelected) {
      setSelectedMovieIds((prev) => prev.filter((id) => !preset.movieIds.includes(id)));
    } else {
      setSelectedMovieIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
    }
  };

  // Reset AI Curation to Full Catalogue
  const handleResetToCatalogue = async () => {
    setHasResetToCatalogue(true);
    setAiLookupMovieIds(null);
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'update-config',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
          isAiCurated: false,
        }),
      });
      await refreshSession();
    } catch (err) {
      console.error('Failed to reset AI curation to catalogue:', err);
    }
  };

  // Save & Launch handlers
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'update-config',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
          sessionTitle,
          activeMovieIds: selectedMovieIds,
          activeGenres: allowedGenres,
          genreFilter: allowedGenres,
          voters,
          maxVotesPerVoter,
          isPublic,
          deadlockRule,
          voteWeightMode,
          ageRatingLimit,
          streamingFilter: allowedSources,
          movieAdditionMode,
          maxSuggestionsPerVoter,
          isAiCurated: isAiCuratedMode,
          aiPrompt: isAiCuratedMode ? (aiPrompt || sessionData?.session?.aiPrompt || null) : null,
          aiMovieIds: isAiCuratedMode ? (effectiveAiMovieIds || []) : [],
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

  const handleLaunchSession = async () => {
    if (selectedMovieIds.length === 0) {
      alert('You must select at least 1 movie before starting voting.');
      setCurrentStep(4);
      return;
    }

    const launchTitle = sessionTitle.trim() || sessionData?.session?.sessionTitle?.trim() || `Movie Night #${sessionId}`;

    setIsLaunching(true);
    try {
      const saveResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'update-config',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
          sessionTitle: launchTitle,
          activeMovieIds: selectedMovieIds,
          activeGenres: allowedGenres,
          genreFilter: allowedGenres,
          voters,
          maxVotesPerVoter,
          isPublic,
          deadlockRule,
          ageRatingLimit,
          streamingFilter: allowedSources,
          movieAdditionMode,
          maxSuggestionsPerVoter,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Could not save the movie selection. Please try again.');
      }

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
        await refreshSession();
        router.push(`/s/${sessionId}`);
      }
    } catch (err) {
      console.error('Failed to launch session:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  const handlePauseSession = async () => {
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
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to pause session:', err);
    }
  };

  const handleResumeSession = async () => {
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
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to resume session:', err);
    }
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close voting? Participants will no longer be able to vote and anyone joining will see the podium outcome.')) return;
    setIsClosingSession(true);
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
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to close session:', err);
    } finally {
      setIsClosingSession(false);
    }
  };

  const handleReopenSession = async () => {
    setIsReopeningSession(true);
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
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to reopen session:', err);
    } finally {
      setIsReopeningSession(false);
    }
  };

  const handleGenerateAiMovies = async () => {
    if (!aiPrompt.trim() || isGeneratingAi) return;
    setIsGeneratingAi(true);
    setAiError('');
    setAiGenerationStatus('Gemini is generating movie recommendations from your description...');

    try {
      const res = await fetch('/api/ai/suggest-movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          description: aiPrompt.trim(),
          count: aiMovieCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate movies with AI.');
      }

      setAiGenerationStatus('Processing high-res posters & TMDB details...');
      await refreshSession();

      const newIds: string[] = data.movieIds || [];
      const newMovies: Movie[] = data.movies || [];

      if (newMovies.length > 0) {
        setAiCustomMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = newMovies.filter((m) => !existingIds.has(m.id));
          return [...prev, ...unique];
        });
      }

      if (newIds.length > 0) {
        setHasResetToCatalogue(false);
        setAiLookupMovieIds((prev) => (prev ? Array.from(new Set([...prev, ...newIds])) : newIds));
        setSelectedMovieIds(newIds);
        setAiSuccessCount(newIds.length);
      }

      setCurrentStep(4);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Could not generate movies.');
    } finally {
      setIsGeneratingAi(false);
      setAiGenerationStatus('');
    }
  };

  const handleDeleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
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
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('This will wipe all submitted votes for this session so everyone can vote anew. Continue?')) {
      return;
    }

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'reset',
          hostUserId: user?.id || null,
          hostEmail: userEmail || null,
        }),
      });
      if (res.ok) {
        await refreshSession();
        alert('All ballots have been cleared!');
      }
    } catch (err) {
      console.error('Failed to reset votes:', err);
    }
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/s/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading || !sessionData) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading session configuration...</p>
      </div>
    );
  }

  // Host Privilege Gate
  if (sessionData && !isHost) {
    return (
      <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl mb-4">
          🔒
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Host Privilege Required</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Only the host of this movie night can configure or edit session settings, rules, and contender films.
        </p>
        <Link
          href={`/s/${sessionId}`}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-md transition active:scale-95"
        >
          Return to Session Ballot
        </Link>
      </div>
    );
  }

  const isVotingLive = sessionData?.session?.status === 'voting';
  const isPaused = sessionData?.session?.status === 'paused';
  const isLocked = sessionData?.session?.status === 'locked';
  const effectiveTitle = sessionTitle.trim() || sessionData?.session?.sessionTitle?.trim() || `Movie Night #${sessionId}`;
  const isReadyToStart = selectedMovieIds.length > 0;

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-[#080b12]">
      {/* Top Banner Header */}
      <AdminHeader
        sessionId={sessionId}
        isSetupMode={isSetupMode}
        isVotingLive={isVotingLive}
        isPaused={isPaused}
        isLocked={isLocked}
        isReadyToStart={isReadyToStart}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        copiedLink={copiedLink}
        isLaunching={isLaunching}
        isClosingSession={isClosingSession}
        isReopeningSession={isReopeningSession}
        onCopyInvite={handleCopyInvite}
        onResetVotes={handleResetVotes}
        onSaveConfig={handleSaveConfig}
        onPauseSession={handlePauseSession}
        onResumeSession={handleResumeSession}
        onCloseSession={handleCloseSession}
        onReopenSession={handleReopenSession}
        onDeleteSession={handleDeleteSession}
        onLaunchSession={handleLaunchSession}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Status Callout Banner */}
        <AdminStatusBanners
          sessionId={sessionId}
          isVotingLive={isVotingLive}
          isLocked={isLocked}
        />

        {/* Navigation Header: 2-stage wizard during setup, 3 settings tabs after setup */}
        <AdminStepTabs
          currentStep={currentStep}
          isSetupMode={isSetupMode}
          canProceedToStep4={canProceedToStep4}
          onSelectStep={handleSelectStep}
        />

        {/* STEP 1: Session Naming & General Rules */}
        {currentStep === 1 && (
          <Step1RulesView
            sessionTitle={sessionTitle}
            setSessionTitle={setSessionTitle}
            deadlockRule={deadlockRule}
            setDeadlockRule={setDeadlockRule}
            voteWeightMode={voteWeightMode}
            setVoteWeightMode={setVoteWeightMode}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
          />
        )}

        {/* STEP 2: Voters & Voting Rules */}
        {currentStep === 2 && (
          <Step2VotersView
            maxVotesPerVoter={maxVotesPerVoter}
            setMaxVotesPerVoter={setMaxVotesPerVoter}
            movieAdditionMode={movieAdditionMode}
            setMovieAdditionMode={setMovieAdditionMode}
            maxSuggestionsPerVoter={maxSuggestionsPerVoter}
            setMaxSuggestionsPerVoter={setMaxSuggestionsPerVoter}
            voters={voters}
            pastVoters={pastVoters}
            onTogglePastVoter={handleTogglePastVoter}
            onRemoveVoter={handleRemoveVoter}
          />
        )}

        {/* STEP 3 CHOICE: Ask user before showing sources view (Setup Mode Only) */}
        {isSetupMode && currentStep === 3 && step3Mode === 'ask' && (
          <Step3ChoiceView
            onSelectAi={() => setStep3Mode('ai')}
            onSelectSources={() => {
              handleResetToCatalogue();
              setStep3Mode('sources');
            }}
          />
        )}

        {/* STEP 3 AI MODE: Describe Movie Night with Gemini (Setup Mode Only) */}
        {isSetupMode && currentStep === 3 && step3Mode === 'ai' && (
          <Step3AiPromptView
            sessionTitle={sessionTitle}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            aiMovieCount={aiMovieCount}
            setAiMovieCount={setAiMovieCount}
            isGeneratingAi={isGeneratingAi}
            aiGenerationStatus={aiGenerationStatus}
            aiError={aiError}
            onBackToChoice={() => setStep3Mode('ask')}
            onSwitchToSources={() => {
              handleResetToCatalogue();
              setStep3Mode('sources');
            }}
            onGenerateAiMovies={handleGenerateAiMovies}
          />
        )}

        {/* STEP 3 SOURCES MODE: Movie Sources & Content Criteria (Setup Mode Only) */}
        {isSetupMode && currentStep === 3 && step3Mode === 'sources' && (
          <Step3SourcesView
            allMovies={allMovies}
            allowedSources={allowedSources}
            allowedGenres={allowedGenres}
            ageRatingLimit={ageRatingLimit}
            totalMatchingCriteriaMovies={totalMatchingCriteriaMovies}
            onToggleSource={toggleSource}
            onSelectAllSources={selectAllSources}
            onClearAllSources={clearAllSources}
            onToggleAllowedGenre={toggleAllowedGenre}
            onSelectAllGenres={selectAllGenres}
            onClearAllGenres={clearAllGenres}
            onSetAgeRatingLimit={setAgeRatingLimit}
            onBackToChoice={() => setStep3Mode('ask')}
            onSwitchToAi={() => setStep3Mode('ai')}
            onContinueToStep4={() => setCurrentStep(4)}
          />
        )}

        {/* STEP 4: Initial Movies Selection & Launch (Stage 2 in setup mode, or Movies Lineup tab after setup) */}
        {currentStep === 4 && (
          <Step4MoviesView
            isSetupMode={isSetupMode}
            isGeneratingAi={isGeneratingAi}
            aiGenerationStatus={aiGenerationStatus}
            aiSuccessCount={aiSuccessCount}
            onGenerateMoreAi={() => {
              setStep3Mode('ai');
              setCurrentStep(3);
            }}
            onDismissAiSuccess={() => setAiSuccessCount(null)}
            isAiCuratedMode={isAiCuratedMode}
            aiPromptText={aiPrompt || sessionData?.session?.aiPrompt || ''}
            onResetToCatalogue={handleResetToCatalogue}

            selectedMovieIds={selectedMovieIds}
            visibleMoviesStep4={visibleMoviesStep4}
            totalMatchingCriteriaMovies={totalMatchingCriteriaMovies}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            allowedSources={allowedSources}
            allowedGenres={allowedGenres}
            ageRatingLimit={ageRatingLimit}

            onToggleMovie={toggleMovie}
            onClearAllSelectedMovies={clearAllSelectedMovies}
            onToggleQuickPreset={toggleQuickPreset}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            onJumpToStep3={() => setCurrentStep(3)}
          />
        )}
      </main>

      {/* Sticky Bottom Stepper Navigation Bar (Setup Mode Only) */}
      {isSetupMode && (
        <AdminStepFooter
          currentStep={currentStep}
          selectedCount={selectedMovieIds.length}
          voterCount={voters.length}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          isLaunching={isLaunching}
          isReadyToStart={isReadyToStart}
          canProceedToStep4={canProceedToStep4}
          step3Mode={step3Mode}
          onPrevStep={() => setCurrentStep(3)}
          onNextStep={handleNextStep}
          onSaveConfig={handleSaveConfig}
          onLaunchSession={handleLaunchSession}
        />
      )}

      {/* Add Custom Movie Modal */}
      <AddCustomMovieModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        sessionId={sessionId}
        onMovieAdded={async (movie) => {
          setSelectedMovieIds((previous) => [...new Set([...previous, movie.id])]);
          setAiCustomMovies((prev) => [...prev, movie]);
          if (aiLookupMovieIds !== null) {
            setAiLookupMovieIds((previous) => (previous ? [...new Set([...previous, movie.id])] : [movie.id]));
          }
          await refreshSession();
        }}
      />
    </div>
  );
}
