'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Voter, SessionResponse, Ballot, PendingVoterAction } from '@/types';
import { DEFAULT_VOTERS } from '@/data/moviesData';
import { useAuth } from '@/context/AuthContext';
import { trackVote } from '@/lib/analytics';
import { recordSessionViewActivity } from '@/lib/sessionActivity';

interface VoterContextType {
  sessionId: string;
  isHost: boolean;
  currentVoter: Voter | null;
  setCurrentVoter: (voter: Voter) => void;
  sessionData: SessionResponse | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  votedMovieIds: string[];
  hasReachedVoteLimit: boolean;
  isVotePending: boolean;
  toggleMovieVote: (movieId: string) => Promise<boolean>;
  clearMyVotes: () => Promise<boolean>;
  isVoted: (movieId: string) => boolean;
  currentBallot: Ballot | null;
  isPickerOpen: boolean;
  setIsPickerOpen: (open: boolean) => void;
  openPicker: () => void;
  closePicker: () => void;
  logout: () => Promise<void>;
  pendingAction: PendingVoterAction | null;
  setPendingAction: (action: PendingVoterAction | null) => void;
  executePendingAction: (voter?: Voter) => Promise<void>;
  openSuggestModalSignal: number;
}

const VoterContext = createContext<VoterContextType | undefined>(undefined);

export function VoterProvider({
  children,
  sessionId = 'session-main',
}: {
  children: React.ReactNode;
  sessionId?: string;
}) {
  const { user, userName, userAvatar, userEmail, isLoading: isAuthLoading, signOut } = useAuth();
  const autoJoinedSessionsRef = useRef<Set<string>>(new Set());

  const [currentVoter, setCurrentVoterState] = useState<Voter | null>(null);
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votedMovieIds, setVotedMovieIds] = useState<string[]>([]);
  const [isVotePending, setIsVotePending] = useState(false);
  const votePendingRef = useRef(false);
  const voteLimit = sessionData?.session?.maxVotesPerVoter ?? 3;
  const hasReachedVoteLimit = voteLimit > 0 && votedMovieIds.length >= voteLimit;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hasPromptedInitial, setHasPromptedInitial] = useState(false);
  const [pendingAction, setPendingActionState] = useState<PendingVoterAction | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('movienight_pending_voter_action');
      if (stored) {
        const parsed = JSON.parse(stored) as PendingVoterAction;
        if (parsed.sessionId === sessionId) return parsed;
      }
    } catch {}
    return null;
  });
  const [openSuggestModalSignal, setOpenSuggestModalSignal] = useState(0);

  const setPendingAction = useCallback((action: PendingVoterAction | null) => {
    setPendingActionState(action);
    if (typeof window !== 'undefined') {
      if (action) {
        sessionStorage.setItem('movienight_pending_voter_action', JSON.stringify(action));
      } else {
        sessionStorage.removeItem('movienight_pending_voter_action');
      }
    }
  }, []);

  const openPicker = () => {
    if (sessionData?.session?.status === 'locked') return;
    setIsPickerOpen(true);
  };
  const closePicker = () => {
    setPendingAction(null);
    setIsPickerOpen(false);
  };

  // Fetch session data
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data: SessionResponse = await res.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Real-time EventSource connection for instant live updates across devices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`/api/events?sessionId=${encodeURIComponent(sessionId)}`);

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

    // Fetch initial session payload immediately via HTTP
    refreshSession();

    // Safety fallback refresh every 8 seconds in case network temporarily drops SSE
    fallbackInterval = setInterval(refreshSession, 8000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [sessionId, refreshSession]);

  // Record session view asynchronously in background with 10-minute grouping (fire-and-forget, zero performance impact)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const triggerView = () => {
      recordSessionViewActivity({
        sessionId,
        voterId: currentVoter?.id,
        voterName: currentVoter?.name || userName || undefined,
        avatar: currentVoter?.avatar || userAvatar || undefined,
      });
    };

    // Immediate check on mount
    triggerView();

    // Re-check when user switches back to tab after being away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerView();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, currentVoter?.id, currentVoter?.name, currentVoter?.avatar, userName, userAvatar]);

  // Sync stored voter from localStorage on load or auto-identify OAuth users
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // CRITICAL: Wait until auth state finishes loading so we never prompt an authenticated user
    if (isAuthLoading) return;
    if (!sessionData?.session) return;

    const votersList = sessionData.session.voters || DEFAULT_VOTERS;

    // CASE 1: User is logged in via OAuth
    if (user && user.id) {
      // Never prompt an authenticated user!
      setIsPickerOpen(false);
      setHasPromptedInitial(true);

      // Check if user already exists as a voter in this session
      const matchedUserVoter = votersList.find((v) => {
        if (v.userId && v.userId === user.id) return true;
        if (
          sessionData.session.creatorUserId === user.id &&
          (v.id.startsWith('host_') || v.id === `host_${user.id.slice(0, 8)}`)
        ) {
          return true;
        }
        if (v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase()) return true;
        if (v.id === `u_${user.id.slice(0, 6)}` || v.id.endsWith(user.id.slice(0, 6))) return true;
        return false;
      });

      if (matchedUserVoter) {
        if (!currentVoter || currentVoter.id !== matchedUserVoter.id) {
          setCurrentVoterState(matchedUserVoter);
        }
        localStorage.setItem(`movienight_voter_${sessionId}`, matchedUserVoter.id);
        localStorage.setItem('movienight_voter_id', matchedUserVoter.id);
        return;
      }

      // Check if localStorage has a stored voter in this session
      const storedVoterId = localStorage.getItem(`movienight_voter_${sessionId}`);
      if (storedVoterId) {
        const found = votersList.find((v) => v.id === storedVoterId);
        if (found) {
          if (!currentVoter || currentVoter.id !== found.id) {
            setCurrentVoterState(found);
          }
          return;
        }
      }

      // User is logged in but has not been added to this session yet:
      // If session is locked, do not auto-join!
      if (sessionData.session.status === 'locked') {
        setCurrentVoterState(null);
        return;
      }

      // Auto-join them silently!
      const joinKey = `${sessionId}_${user.id}`;
      if (!autoJoinedSessionsRef.current.has(joinKey)) {
        autoJoinedSessionsRef.current.add(joinKey);
        (async () => {
          try {
            const res = await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'join-voter',
                sessionId,
                name: userName || (user.email ? user.email.split('@')[0] : 'Voter'),
                avatar: userAvatar || '🍿',
                userId: user.id,
                email: user.email || null,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.voter) {
                setCurrentVoterState(data.voter);
                localStorage.setItem(`movienight_voter_${sessionId}`, data.voter.id);
                localStorage.setItem('movienight_voter_id', data.voter.id);
              }
              await refreshSession();
            }
          } catch (err) {
            console.error('Failed to auto-join OAuth voter:', err);
          }
        })();
      }
      return;
    }

    // CASE 2: Unauthenticated Anonymous / Guest User
    // The anonymous user's identity is stored in the client browser for ALL sessions, not a choice per session.

    // 1. Check if a voter was already assigned to this specific session in this browser
    const storedSessionVoterId = localStorage.getItem(`movienight_voter_${sessionId}`);
    if (storedSessionVoterId) {
      const found = votersList.find((v) => v.id === storedSessionVoterId);
      if (found) {
        if (!currentVoter || currentVoter.id !== found.id) {
          setCurrentVoterState(found);
        }
        setIsPickerOpen(false);
        setHasPromptedInitial(true);
        return;
      }
    }

    // 2. Read browser-wide anonymous identity (saved across all sessions)
    let guestName = localStorage.getItem('movienight_guest_name');
    let guestAvatar = localStorage.getItem('movienight_guest_avatar') || '🍿';

    if (!guestName) {
      try {
        const storedProfileJson = localStorage.getItem('movienight_guest_profile');
        if (storedProfileJson) {
          const parsed = JSON.parse(storedProfileJson);
          if (parsed.name && typeof parsed.name === 'string') {
            guestName = parsed.name.trim();
            guestAvatar = parsed.avatar || guestAvatar;
          }
        }
      } catch {
        // ignore parse error
      }
    }

    // 3. Fallback: check if a global movienight_voter_id is stored and matches a voter in this session
    const globalVoterId = localStorage.getItem('movienight_voter_id');
    if (globalVoterId) {
      const found = votersList.find((v) => v.id === globalVoterId);
      if (found) {
        if (!currentVoter || currentVoter.id !== found.id) {
          setCurrentVoterState(found);
        }
        localStorage.setItem(`movienight_voter_${sessionId}`, found.id);
        if (!guestName) {
          guestName = found.name;
          guestAvatar = found.avatar;
          localStorage.setItem('movienight_guest_name', found.name);
          localStorage.setItem('movienight_guest_avatar', found.avatar);
          localStorage.setItem('movienight_guest_profile', JSON.stringify({ name: found.name, avatar: found.avatar }));
        }
        setIsPickerOpen(false);
        setHasPromptedInitial(true);
        return;
      }
    }

    // 4. If an anonymous user identity is stored in this browser:
    if (guestName && guestName.trim()) {
      const cleanGuestName = guestName.trim();
      const resolvedAvatar = guestAvatar || '🍿';

      // DO NOT PROMPT! Stored identity applies to ALL sessions
      setIsPickerOpen(false);
      setHasPromptedInitial(true);

      // Check if a voter with this name already exists in this session's voter list
      const matchedGuestVoter = votersList.find(
        (v) => !v.userId && v.name.toLowerCase().trim() === cleanGuestName.toLowerCase()
      );

      if (matchedGuestVoter) {
        if (!currentVoter || currentVoter.id !== matchedGuestVoter.id) {
          setCurrentVoterState(matchedGuestVoter);
        }
        localStorage.setItem(`movienight_voter_${sessionId}`, matchedGuestVoter.id);
        localStorage.setItem('movienight_voter_id', matchedGuestVoter.id);
        return;
      }

      // Guest has an identity stored in browser, but hasn't joined this session yet:
      // If session is locked, do not auto-join!
      if (sessionData.session.status === 'locked') {
        setCurrentVoterState(null);
        return;
      }

      // Silently auto-join them with their stored browser profile!
      const anonJoinKey = `${sessionId}_anon_${cleanGuestName.toLowerCase()}`;
      if (!autoJoinedSessionsRef.current.has(anonJoinKey)) {
        autoJoinedSessionsRef.current.add(anonJoinKey);
        (async () => {
          try {
            const res = await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'join-voter',
                sessionId,
                name: cleanGuestName,
                avatar: resolvedAvatar,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.voter) {
                setCurrentVoterState(data.voter);
                localStorage.setItem(`movienight_voter_${sessionId}`, data.voter.id);
                localStorage.setItem('movienight_voter_id', data.voter.id);
              }
              await refreshSession();
            }
          } catch (err) {
            console.error('Failed to auto-join stored guest voter:', err);
          }
        })();
      }
      return;
    }

    // 5. Only if the browser has NO saved guest profile at all (first-time visitor):
    // Do not immediately prompt the user who they are on landing.
    // They will be asked when performing an action (e.g. vote, suggest movie).
    if (!hasPromptedInitial) {
      setCurrentVoterState(null);
      setHasPromptedInitial(true);
    }
  }, [
    sessionId,
    sessionData,
    user,
    userName,
    userAvatar,
    userEmail,
    isAuthLoading,
    hasPromptedInitial,
    currentVoter,
    refreshSession,
  ]);

  // Sync votedMovieIds when voter changes or session updates
  useEffect(() => {
    if (votePendingRef.current) return;
    if (currentVoter && sessionData?.session?.ballots) {
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
      localStorage.setItem(`movienight_voter_${sessionId}`, voter.id);
      localStorage.setItem('movienight_voter_id', voter.id);
      // Persist anonymous name & avatar globally across ALL sessions
      if (!user) {
        localStorage.setItem('movienight_guest_name', voter.name);
        localStorage.setItem('movienight_guest_avatar', voter.avatar);
        localStorage.setItem(
          'movienight_guest_profile',
          JSON.stringify({
            name: voter.name,
            avatar: voter.avatar,
          })
        );
      }
    }
    setIsPickerOpen(false);
  };

  const isVoted = (movieId: string) => {
    return votedMovieIds.includes(movieId);
  };

  const performToggleMovieVote = async (movieId: string, overrideVoter?: Voter): Promise<boolean> => {
    if (sessionData?.session?.status === 'locked') {
      return false;
    }

    let voter = overrideVoter || currentVoter;

    if (!voter && user && user.id) {
      // User is authenticated but state hasn't settled yet: resolve voter immediately
      const votersList = sessionData?.session?.voters || [];
      const matched = votersList.find(
        (v) =>
          (v.userId && v.userId === user.id) ||
          (sessionData?.session?.creatorUserId === user.id && (v.id.startsWith('host_') || v.id === `host_${user.id.slice(0, 8)}`)) ||
          (v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase())
      );
      if (matched) {
        voter = matched;
        setCurrentVoterState(matched);
      } else {
        try {
          const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'join-voter',
              sessionId,
              name: userName || (user.email ? user.email.split('@')[0] : 'Voter'),
              avatar: userAvatar || '🍿',
              userId: user.id,
              email: user.email || null,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.voter) {
              voter = data.voter;
              setCurrentVoterState(data.voter);
              localStorage.setItem(`movienight_voter_${sessionId}`, data.voter.id);
              localStorage.setItem('movienight_voter_id', data.voter.id);
            }
          }
        } catch (e) {
          console.error('Failed to auto-join before vote:', e);
        }
      }
    }

    if (!voter && !user && typeof window !== 'undefined') {
      // Anonymous user: resolve from browser-stored profile before prompting
      let gName = localStorage.getItem('movienight_guest_name');
      let gAvatar = localStorage.getItem('movienight_guest_avatar') || '🍿';
      if (!gName) {
        try {
          const parsed = JSON.parse(localStorage.getItem('movienight_guest_profile') || '{}');
          if (parsed.name) {
            gName = parsed.name;
            gAvatar = parsed.avatar || gAvatar;
          }
        } catch {}
      }

      if (gName && gName.trim()) {
        const cleanGName = gName.trim();
        const votersList = sessionData?.session?.voters || [];
        const matched = votersList.find(
          (v) => !v.userId && v.name.toLowerCase().trim() === cleanGName.toLowerCase()
        );
        if (matched) {
          voter = matched;
          setCurrentVoterState(matched);
        } else {
          try {
            const res = await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'join-voter',
                sessionId,
                name: cleanGName,
                avatar: gAvatar,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.voter) {
                voter = data.voter;
                setCurrentVoterState(data.voter);
                localStorage.setItem(`movienight_voter_${sessionId}`, data.voter.id);
                localStorage.setItem('movienight_voter_id', data.voter.id);
              }
            }
          } catch (e) {
            console.error('Failed to auto-join guest before vote:', e);
          }
        }
      }
    }

    if (!voter) {
      // First-time unauthenticated user hasn't chosen who they are yet! Save pending action and open picker
      setPendingAction({ type: 'vote', movieId, sessionId });
      setIsPickerOpen(true);
      return false;
    }

    const previousVotes = voter.id === currentVoter?.id
      ? votedMovieIds
      : sessionData?.session?.ballots?.[voter.id]?.movieIds || [];
    const removingVote = previousVotes.includes(movieId);
    if (!removingVote && voteLimit > 0 && previousVotes.length >= voteLimit) return false;
    setVotedMovieIds(removingVote ? previousVotes.filter((id) => id !== movieId) : [...previousVotes, movieId]);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          voterId: voter.id,
          movieId,
        }),
      });

      if (res.ok) {
        const updatedData: SessionResponse = await res.json();
        setSessionData(updatedData);
        setVotedMovieIds(updatedData?.session?.ballots?.[voter.id]?.movieIds || []);

        const moviesList = updatedData?.allAvailableMovies || sessionData?.allAvailableMovies || [];
        const movieObj = moviesList.find((m) => m.id === movieId);
        trackVote({
          sessionId,
          movieId,
          movieTitle: movieObj?.title,
          action: removingVote ? 'unvote' : 'vote',
          voterName: voter.name,
        });

        return true;
      }
      setVotedMovieIds(previousVotes);
      void refreshSession();
      return false;
    } catch (err) {
      console.error('Failed to toggle vote:', err);
      setVotedMovieIds(previousVotes);
      void refreshSession();
      return false;
    }
  };

  const toggleMovieVote = async (movieId: string): Promise<boolean> => {
    if (votePendingRef.current) return false;
    votePendingRef.current = true;
    setIsVotePending(true);
    try { return await performToggleMovieVote(movieId); }
    finally { votePendingRef.current = false; setIsVotePending(false); }
  };

  const executePendingAction = useCallback(async (explicitVoter?: Voter) => {
    let action = pendingAction;
    if (!action && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('movienight_pending_voter_action');
        if (raw) {
          const parsed = JSON.parse(raw) as PendingVoterAction;
          if (parsed.sessionId === sessionId) action = parsed;
        }
      } catch {}
    }

    if (!action || action.sessionId !== sessionId) return;

    // Clear pending action first to prevent duplicate execution
    setPendingAction(null);

    const voterToUse = explicitVoter || currentVoter;

    if (action.type === 'vote') {
      const targetMovieId = action.movieId;
      if (voterToUse) {
        await performToggleMovieVote(targetMovieId, voterToUse);
      } else {
        await performToggleMovieVote(targetMovieId);
      }
    } else if (action.type === 'suggest') {
      setOpenSuggestModalSignal((prev) => prev + 1);
    }
  }, [pendingAction, sessionId, currentVoter, performToggleMovieVote, setPendingAction]);

  // Execute any pending actions once currentVoter is resolved (e.g. after OAuth redirect or join)
  useEffect(() => {
    if (!currentVoter) return;
    if (typeof window === 'undefined') return;

    let action = pendingAction;
    if (!action) {
      try {
        const raw = sessionStorage.getItem('movienight_pending_voter_action');
        if (raw) {
          const parsed = JSON.parse(raw) as PendingVoterAction;
          if (parsed.sessionId === sessionId) action = parsed;
        }
      } catch {}
    }

    if (action && action.sessionId === sessionId) {
      void executePendingAction(currentVoter);
    }
  }, [currentVoter, sessionId, pendingAction, executePendingAction]);

  const clearMyVotes = async (): Promise<boolean> => {
    if (sessionData?.session?.status === 'locked') return false;
    if (!currentVoter) return false;
    setVotedMovieIds([]);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
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

  const logout = async () => {
    if (user) {
      await signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('movienight_guest_name');
      localStorage.removeItem('movienight_guest_avatar');
      localStorage.removeItem('movienight_guest_profile');
      localStorage.removeItem('movienight_voter_id');
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('movienight_voter_')) {
            localStorage.removeItem(k);
          }
        });
      } catch {}
    }
    setCurrentVoterState(null);
    setHasPromptedInitial(true);
  };

  const isHost = React.useMemo(() => {
    if (!sessionData?.session) return false;
    if (!user && !userEmail) return false;
    const creatorUserId = sessionData.session.creatorUserId;
    const creatorEmail = sessionData.session.creatorEmail;
    if (user?.id && creatorUserId && user.id === creatorUserId) return true;
    if (userEmail && creatorEmail && userEmail.toLowerCase() === creatorEmail.toLowerCase()) return true;
    return false;
  }, [sessionData, user, userEmail]);

  const currentBallot =
    currentVoter && sessionData?.session?.ballots ? sessionData.session.ballots[currentVoter.id] || null : null;

  return (
    <VoterContext.Provider
      value={{
        sessionId,
        isHost,
        currentVoter,
        setCurrentVoter,
        sessionData,
        isLoading,
        refreshSession,
        votedMovieIds,
        hasReachedVoteLimit,
        isVotePending,
        toggleMovieVote,
        clearMyVotes,
        isVoted,
        currentBallot,
        isPickerOpen,
        setIsPickerOpen,
        openPicker,
        closePicker,
        logout,
        pendingAction,
        setPendingAction,
        executePendingAction,
        openSuggestModalSignal,
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
