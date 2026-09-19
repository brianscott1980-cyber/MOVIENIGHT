'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Voter, SessionResponse, Ballot } from '@/types';
import { DEFAULT_VOTERS } from '@/data/moviesData';

interface VoterContextType {
  currentVoter: Voter | null;
  setCurrentVoter: (voter: Voter) => void;
  sessionData: SessionResponse | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  votedMovieIds: string[];
  toggleMovieVote: (movieId: string) => Promise<boolean>;
  clearMyVotes: () => Promise<boolean>;
  isVoted: (movieId: string) => boolean;
  currentBallot: Ballot | null;
  isPickerOpen: boolean;
  setIsPickerOpen: (open: boolean) => void;
  openPicker: () => void;
  closePicker: () => void;
}

const VoterContext = createContext<VoterContextType | undefined>(undefined);

export function VoterProvider({ children }: { children: React.ReactNode }) {
  const [currentVoter, setCurrentVoterState] = useState<Voter | null>(null);
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votedMovieIds, setVotedMovieIds] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hasPromptedInitial, setHasPromptedInitial] = useState(false);

  const openPicker = () => setIsPickerOpen(true);
  const closePicker = () => setIsPickerOpen(false);

  // Fetch session data
  const refreshSession = async () => {
    try {
      const res = await fetch('/api/session', { cache: 'no-store' });
      if (res.ok) {
        const data: SessionResponse = await res.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time EventSource connection for instant live updates across devices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onmessage = (event) => {
          try {
            const data: SessionResponse = JSON.parse(event.data);
            setSessionData(data);
            setIsLoading(false);
          } catch (err) {
            console.error('Failed to parse SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry connection after 3s
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectSSE();
            }, 3000);
          }
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connectSSE();
          }, 3000);
        }
      }
    };

    connectSSE();

    // Safety fallback refresh every 8 seconds in case network temporarily drops SSE
    fallbackInterval = setInterval(refreshSession, 8000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Sync stored voter from localStorage on load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedVoterId = localStorage.getItem('movienight_voter_id');
    const votersList = sessionData?.session.voters || DEFAULT_VOTERS;

    if (storedVoterId) {
      const found = votersList.find((v) => v.id === storedVoterId);
      if (found) {
        setCurrentVoterState(found);
        return;
      }
    }

    // First load on this browser: No voter selected yet!
    // Prompt the user who they are and keep currentVoter null until they choose
    if (!hasPromptedInitial) {
      setCurrentVoterState(null);
      setIsPickerOpen(true);
      setHasPromptedInitial(true);
    }
  }, [sessionData, hasPromptedInitial]);

  // Sync votedMovieIds when voter changes or session updates
  useEffect(() => {
    if (currentVoter && sessionData) {
      const existingBallot = sessionData.session.ballots[currentVoter.id];
      if (existingBallot) {
        if (Array.isArray(existingBallot.movieIds)) {
          setVotedMovieIds(existingBallot.movieIds);
        } else {
          const ids: string[] = [];
          if (existingBallot.rank1MovieId) ids.push(existingBallot.rank1MovieId);
          if (existingBallot.rank2MovieId) ids.push(existingBallot.rank2MovieId);
          if (existingBallot.rank3MovieId) ids.push(existingBallot.rank3MovieId);
          setVotedMovieIds(ids);
        }
      } else {
        setVotedMovieIds([]);
      }
    } else {
      setVotedMovieIds([]);
    }
  }, [currentVoter, sessionData]);

  const setCurrentVoter = (voter: Voter) => {
    setCurrentVoterState(voter);
    if (typeof window !== 'undefined') {
      localStorage.setItem('movienight_voter_id', voter.id);
    }
    setIsPickerOpen(false);
  };

  const isVoted = (movieId: string) => {
    return votedMovieIds.includes(movieId);
  };

  const toggleMovieVote = async (movieId: string): Promise<boolean> => {
    if (!currentVoter) {
      // User hasn't chosen who they are yet! Open the picker modal
      setIsPickerOpen(true);
      return false;
    }

    // Optimistic UI update
    setVotedMovieIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: currentVoter.id,
          movieId,
        }),
      });

      if (res.ok) {
        const updatedData: SessionResponse = await res.json();
        setSessionData(updatedData);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle vote:', err);
      // Revert optimistic update on failure
      refreshSession();
      return false;
    }
  };

  const clearMyVotes = async (): Promise<boolean> => {
    if (!currentVoter) return false;
    setVotedMovieIds([]);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: currentVoter.id,
          movieIds: [],
        }),
      });

      if (res.ok) {
        const updatedData: SessionResponse = await res.json();
        setSessionData(updatedData);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to clear votes:', err);
      refreshSession();
      return false;
    }
  };

  const currentBallot =
    currentVoter && sessionData ? sessionData.session.ballots[currentVoter.id] || null : null;

  return (
    <VoterContext.Provider
      value={{
        currentVoter,
        setCurrentVoter,
        sessionData,
        isLoading,
        refreshSession,
        votedMovieIds,
        toggleMovieVote,
        clearMyVotes,
        isVoted,
        currentBallot,
        isPickerOpen,
        setIsPickerOpen,
        openPicker,
        closePicker,
      }}
    >
      {children}
    </VoterContext.Provider>
  );
}

export function useVoter() {
  const context = useContext(VoterContext);
  if (!context) {
    throw new Error('useVoter must be used within a VoterProvider');
  }
  return context;
}
