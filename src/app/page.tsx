'use client';

import { SessionCopyActions } from '@/components/SessionCopyActions';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { trackCreateSession } from '@/lib/analytics';
import {
  Film,
  Sparkles,
  Plus,
  Tv,
  Users,
  Search,
  Settings,
  Crown,
  Vote,
  X,
  Clock,
  Hash,
  ArrowRight,
  LogIn,
  LogOut,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface SampleMovie {
  id: string;
  title: string;
  posterUrl: string;
  year: number;
  rating: number;
}

interface LeaderMovie {
  id: string;
  title: string;
  posterUrl: string;
  votes: number;
}

interface SessionItem {
  sessionId: string;
  sessionTitle: string;
  status: string;
  winnerMovieId: string | null;
  isPublic?: boolean;
  creator?: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  movieCount: number;
  voteCount: number;
  voterCount: number;
  sampleMovies: SampleMovie[];
  leaderMovie: LeaderMovie | null;
}

function formatCode(id: string) {
  const digits = id.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return id;
}

export default function ExploreSessionsPage() {
  const router = useRouter();
  const { user, userName, userEmail, userAvatar, signOut, openAuthModal } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  type FilterTab = 'all' | 'hosts' | 'locked' | 'setup';
  const [filterTab, setFilterTab] = useState<FilterTab>('hosts');

  // Update default tab based on login state and whether user has hosted sessions
  useEffect(() => {
    if (user) {
      const hasHostedSessions = sessions.some((s) => {
        if (s.creator?.userId && s.creator.userId === user.id) return true;
        if (userEmail && s.creator?.email && s.creator.email.toLowerCase() === userEmail.toLowerCase()) return true;
        return false;
      });

      if (!hasHostedSessions) {
        setFilterTab('all');
      } else {
        setFilterTab((current) => (current === 'all' ? 'hosts' : current));
      }
    } else {
      setFilterTab((current) => (current === 'hosts' || current === 'setup' ? 'all' : current));
    }
  }, [user, userEmail, sessions]);

  // Quick Join by Code
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/session?action=list', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setSessions(json.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const clean = joinCodeInput.replace(/\D/g, '');
    if (!clean) {
      setJoinError('Please enter an 8-digit session code.');
      return;
    }
    if (clean.length < 4) {
      setJoinError('Please enter a valid session code (e.g. 1234 5678).');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/session?sessionId=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setJoinError('Session not found. Please check your 8-digit code.');
        return;
      }
      const data = await res.json();
      const session = data?.session;
      if (!session) {
        setJoinError('Session not found. Please check your 8-digit code.');
        return;
      }

      const isHost = Boolean(
        (user && session.creatorUserId === user.id) ||
        (userEmail && session.creatorEmail && session.creatorEmail.toLowerCase() === userEmail.toLowerCase())
      );

      if (session.status === 'setup' && !isHost) {
        setJoinError('This session has not started yet. The host must launch voting before you can join.');
        return;
      }

      router.push(`/s/${clean}`);
    } catch (err) {
      console.error('Failed to verify session:', err);
      router.push(`/s/${clean}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinError(null);
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 4) {
      setJoinCodeInput(`${raw.slice(0, 4)} ${raw.slice(4)}`);
    } else {
      setJoinCodeInput(raw);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('movienight_pending_intent', 'create_session');
        sessionStorage.setItem('movienight_auth_return', '/?action=create_session');
      }
      openAuthModal();
      return;
    }
    setNewTitle('');
    setIsCreateModalOpen(true);
  };

  // Auto-create session if user logged in with pending 'create_session' intent
  const autoCreatedRef = React.useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || autoCreatedRef.current) return;

    const pendingIntent = sessionStorage.getItem('movienight_pending_intent');
    const params = new URLSearchParams(window.location.search);
    const hasCreateAction = params.get('action') === 'create_session' || params.get('action') === 'new_session';

    if (pendingIntent === 'create_session' || hasCreateAction) {
      autoCreatedRef.current = true;
      sessionStorage.removeItem('movienight_pending_intent');
      sessionStorage.removeItem('movienight_auth_return');

      (async () => {
        setIsCreating(true);
        try {
          const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              title: '🍿 Movie Night Voting',
              creator: {
                userId: user.id || null,
                email: user.email || null,
                name: userName || null,
                avatarUrl: userAvatar || null,
              },
            }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json?.session?.sessionId) {
              router.replace(`/s/${json.session.sessionId}/admin`);
            }
          }
        } catch (err) {
          console.error('Failed to auto-create session after login:', err);
        } finally {
          setIsCreating(false);
        }
      })();
    }
  }, [user, userName, userAvatar, router]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: newTitle.trim(),
          creator: {
            userId: user?.id || null,
            email: user?.email || null,
            name: userName || null,
            avatarUrl: userAvatar || null,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsCreateModalOpen(false);
        trackCreateSession({
          sessionId: json.session.sessionId,
          sessionTitle: newTitle.trim(),
        });
        router.push(`/s/${json.session.sessionId}/admin`);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Check if current viewer is the host of a session
  const isUserSessionHost = useCallback(
    (s: SessionItem) => {
      if (!user && !userEmail) return false;
      if (user && s.creator?.userId && s.creator.userId === user.id) return true;
      if (userEmail && s.creator?.email && s.creator.email.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    },
    [user, userEmail]
  );

  // Filter sessions:
  // - "In Setup" sessions only show for the host of that session
  // - "Private" sessions (isPublic === false) only show if the current user is the host, OR if the user entered the invite code in search
  // - "Public" sessions show for all users on the homepage
  const visibleSessions = useMemo(() => {
    const rawDigits = searchQuery.trim().replace(/\D/g, '');
    const isCodeSearch = Boolean(
      searchQuery.trim() &&
        (rawDigits.length >= 4 || searchQuery.trim().length >= 4)
    );

    return sessions.filter((s) => {
      const isHost = isUserSessionHost(s);
      if (s.status === 'setup') {
        return isHost;
      }
      if (s.isPublic === false) {
        const matchesCode = Boolean(
          isCodeSearch &&
            (s.sessionId.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
              (rawDigits.length >= 4 && s.sessionId.includes(rawDigits)))
        );
        return isHost || matchesCode;
      }
      return true;
    });
  }, [sessions, isUserSessionHost, searchQuery]);

  // Filter sessions by tab & search query
  const filteredSessions = useMemo(() => {
    return visibleSessions.filter((s) => {
      if (filterTab === 'hosts') {
        if (!isUserSessionHost(s)) return false;
      } else if (filterTab === 'setup') {
        if (s.status !== 'setup' || !isUserSessionHost(s)) return false;
      } else if (filterTab === 'locked') {
        if (s.status !== 'locked') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const rawDigits = q.replace(/\D/g, '');
        const matchesTitle = s.sessionTitle.toLowerCase().includes(q);
        const matchesId = s.sessionId.includes(q) || (rawDigits && s.sessionId.includes(rawDigits));
        const matchesMovie = s.sampleMovies?.some((m) => m.title.toLowerCase().includes(q));
        return matchesTitle || matchesId || matchesMovie;
      }
      return true;
    });
  }, [visibleSessions, filterTab, searchQuery, isUserSessionHost]);

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition group" title="MovieNight Home">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
              🍿
            </div>
            <div>
              <span className="font-black text-white text-base sm:text-lg tracking-tight">MovieNight</span>
              <span className="text-[10px] text-amber-400 block -mt-1 font-semibold uppercase tracking-wider">
                Explore Sessions
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 glow-gold"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Movie Night</span>
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 py-1 px-2 rounded-xl">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-6 h-6 rounded-full border border-amber-400 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-white hidden md:inline max-w-[100px] truncate">
                    {userName}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('movienight_pending_intent');
                    sessionStorage.removeItem('movienight_auth_return');
                  }
                  openAuthModal();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section & Fast Join Code Bar */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          <div className="max-w-2xl text-left">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Explore Movie Night <br />
              <span className="bg-gradient-to-r from-amber-400 via-red-400 to-rose-500 bg-clip-text text-transparent">
                Voting Sessions
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
              Browse live and past movie night sessions. Each session has a unique 8-digit numeric code for fast, easy joining across living room devices.
            </p>
          </div>

          {/* Mentimeter-Style Quick Join Box */}
          <div className="w-full lg:w-auto shrink-0 self-stretch lg:self-center">
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl max-w-md w-full">
              <div className="flex items-center gap-2 mb-1.5">
                <Hash className="w-4 h-4 text-amber-400" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                  Join with 8-Digit Code
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Enter the session code shown on the TV marquee or invitation
              </p>

              <form onSubmit={handleJoinByCode} className="space-y-2.5">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={joinCodeInput}
                    onChange={handleCodeInputChange}
                    placeholder="1234 5678"
                    className="w-full text-center tracking-widest font-mono text-lg sm:text-xl font-black py-2.5 px-4 rounded-xl bg-slate-950 border-2 border-slate-700 text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                {joinError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition active:scale-95 shadow-md flex items-center justify-center gap-2 glow-gold cursor-pointer"
                >
                  <span>{isJoining ? 'Checking Session...' : 'Enter Voting Session'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Search, Filters & Sessions List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Search Bar & Tab Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, 8-digit code, or film..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
            {/* 1. All */}
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                filterTab === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({visibleSessions.length})
            </button>

            {/* 2. Hosts (when logged in) */}
            {user && (
              <button
                onClick={() => setFilterTab('hosts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  filterTab === 'hosts'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👑</span>
                <span>Hosts ({visibleSessions.filter(isUserSessionHost).length})</span>
              </button>
            )}

            {/* 3. Crowned */}
            <button
              onClick={() => setFilterTab('locked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                filterTab === 'locked'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Crowned ({visibleSessions.filter((s) => s.status === 'locked').length})</span>
            </button>

            {/* 4. "In Setup" (when logged in) */}
            {user && (
              <button
                onClick={() => setFilterTab('setup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  filterTab === 'setup'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <span>⚙️ In Setup ({visibleSessions.filter((s) => s.status === 'setup' && isUserSessionHost(s)).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-slate-800 rounded-md w-3/4"></div>
                  <div className="h-4 bg-slate-800/60 rounded-md w-1/2"></div>
                </div>
                <div className="h-20 bg-slate-800/40 rounded-xl"></div>
                <div className="h-10 bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white">
              {filterTab === 'hosts'
                ? 'No hosted sessions yet'
                : filterTab === 'setup'
                ? 'No sessions in setup'
                : filterTab === 'locked'
                ? 'No crowned sessions'
                : 'No movie night sessions found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? `No sessions match "${searchQuery}". Try resetting your search.`
                : filterTab === 'hosts'
                ? "You haven't hosted any movie night sessions yet. Click '+ New Movie Night' to launch one!"
                : filterTab === 'setup'
                ? 'You have no sessions currently in setup. All your sessions are live or crowned.'
                : filterTab === 'locked'
                ? 'No crowned or concluded movie night sessions yet.'
                : 'No movie night sessions are currently available.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition glow-gold"
              >
                Create New Movie Night
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => {
              const isLocked = session.status === 'locked';
              const isHost = isUserSessionHost(session);
              const formattedPin = formatCode(session.sessionId);

              return (
                <div
                  key={session.sessionId}
                  className={`group relative flex flex-col justify-between rounded-3xl border bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    isLocked
                      ? 'border-red-500/40 hover:border-red-400/80 shadow-red-950/20'
                      : 'border-slate-800 hover:border-amber-500/60 shadow-amber-950/10'
                  }`}
                >
                  <div>
                    {/* Header Row with Mentimeter-Style PIN Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Hash className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formattedPin}</span>
                        <SessionCopyActions sessionId={session.sessionId} />
                      </span>

                      <div className="flex items-center gap-1.5">
                        {session.isPublic === false && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border bg-purple-950/70 text-purple-300 border-purple-500/40"
                            title="Private session - invite code or host only"
                          >
                            🔒 Private
                          </span>
                        )}

                        <span
                          className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                            session.status === 'setup'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                              : session.status === 'paused'
                              ? 'bg-orange-950/70 text-orange-300 border-orange-500/40'
                              : isLocked
                              ? 'bg-red-950/60 text-red-300 border-red-800/40'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                          }`}
                        >
                          {session.status === 'setup'
                            ? '⚙️ In Setup'
                            : session.status === 'paused'
                            ? '⏸️ Paused'
                            : isLocked
                            ? '🏆 Crowned'
                            : '🟢 Voting Live'}
                        </span>
                      </div>
                    </div>

                    {/* Session Title */}
                    <Link href={`/s/${session.sessionId}`} className="block group-hover:text-amber-300 transition">
                      <h3 className="text-xl font-extrabold text-white tracking-tight line-clamp-1">
                        {session.sessionTitle}
                      </h3>
                    </Link>

                    {/* Host Info */}
                    {session.creator && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        {session.creator.avatarUrl ? (
                          <img
                            src={session.creator.avatarUrl}
                            alt={session.creator.name || 'Host'}
                            className="w-4 h-4 rounded-full object-cover border border-amber-500/50 shrink-0"
                          />
                        ) : (
                          <span className="text-[11px]">👑</span>
                        )}
                        <span className="truncate">
                          Hosted by <strong className="text-slate-300 font-semibold">{session.creator.name || 'Host'}</strong>
                        </span>
                      </div>
                    )}

                    {/* Meta Stats Strip */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                        <span>{session.movieCount} Films</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Vote className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{session.voteCount} Votes</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>{session.voterCount} Voters</span>
                      </span>
                    </div>

                    {/* Sample Movie Posters Collage */}
                    {session.sampleMovies && session.sampleMovies.length > 0 ? (
                      <div className="mt-4 pt-3 border-t border-slate-800/70">
                        <div className="grid grid-cols-4 gap-2">
                          {session.sampleMovies.map((m) => (
                            <div
                              key={m.id}
                              className="group/poster relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 shadow"
                              title={m.title}
                            >
                              <img
                                src={m.posterUrl}
                                alt={m.title}
                                className="w-full h-full object-cover group-hover/poster:scale-105 transition duration-300"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-3 border-t border-slate-800/70">
                        <div className="grid grid-cols-4 gap-2">
                          {['🍿', '🎬', '🎟️', '🎥'].map((emoji, idx) => (
                            <div
                              key={idx}
                              className="aspect-[2/3] rounded-lg border border-dashed border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center gap-1 p-1 text-center shadow-inner"
                              title="No movies configured yet"
                            >
                              <span className="text-base sm:text-lg opacity-40">{emoji}</span>
                              {idx === 0 && (
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Pending
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Leader Highlight Banner */}
                    {session.leaderMovie ? (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{isLocked ? '👑' : '🥇'}</span>
                          <div className="min-w-0">
                            <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider block">
                              {isLocked ? 'Official Winner' : 'Current Leader'}
                            </span>
                            <span className="text-xs font-bold text-white truncate block">
                              {session.leaderMovie.title}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-amber-300 shrink-0 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          {session.leaderMovie.votes} {session.leaderMovie.votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>No votes cast yet &bull; Be the first to vote!</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                    <Link
                      href={session.status === 'setup' ? `/s/${session.sessionId}/admin` : `/s/${session.sessionId}`}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs text-center transition active:scale-95 shadow-md ${
                        session.status === 'setup'
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 glow-gold'
                      }`}
                    >
                      {session.status === 'setup' ? 'Configure & Launch ⚙️' : 'Enter Ballot'}
                    </Link>

                    {session.status !== 'setup' && (
                      <Link
                        href={`/s/${session.sessionId}/live`}
                        className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition flex items-center gap-1 active:scale-95"
                        title="Open Live TV Marquee"
                      >
                        <Tv className="w-3.5 h-3.5 text-red-400" />
                        <span className="hidden sm:inline">Marquee</span>
                      </Link>
                    )}

                    {isHost && (
                      <Link
                        href={`/s/${session.sessionId}/admin`}
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-purple-400 hover:text-purple-300 transition active:scale-95"
                        title="Session Setup"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Movie Night Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                🍿
              </div>
              <div>
                <h3 className="text-lg font-black text-white">New Movie Night</h3>
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

            <form onSubmit={handleCreateSession} className="space-y-4">
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
                  onClick={() => setIsCreateModalOpen(false)}
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
          </div>
        </div>
      )}

      {/* Auto-Creation Loading Overlay after Login */}
      {isCreating && !isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-200 font-bold text-base">Setting up your new movie night...</p>
        </div>
      )}
    </div>
  );
}
