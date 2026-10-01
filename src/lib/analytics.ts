/**
 * Google Analytics custom events helper for MovieNight.
 * Safe to call on client or server (no-ops gracefully when window.gtag is not present).
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Custom event definitions

/** Track casting or revoking a vote for a specific movie */
export function trackVote({
  sessionId,
  movieId,
  movieTitle,
  action, // 'vote' | 'unvote'
  voterName,
}: {
  sessionId: string;
  movieId: string;
  movieTitle?: string;
  action: 'vote' | 'unvote';
  voterName?: string;
}) {
  trackEvent(action === 'vote' ? 'cast_vote' : 'remove_vote', {
    session_id: sessionId,
    movie_id: movieId,
    movie_title: movieTitle,
    voter_name: voterName,
  });
}

/** Track adding a custom or searched movie to a session */
export function trackAddMovie({
  sessionId,
  movieId,
  movieTitle,
  year,
  genre,
  isManual,
  addedByVoterId,
}: {
  sessionId: string;
  movieId?: string;
  movieTitle: string;
  year?: number;
  genre?: string;
  isManual?: boolean;
  addedByVoterId?: string;
}) {
  trackEvent('add_movie', {
    session_id: sessionId,
    movie_id: movieId,
    movie_title: movieTitle,
    release_year: year,
    genre,
    is_manual: Boolean(isManual),
    is_voter_suggestion: Boolean(addedByVoterId),
  });
}

/** Track admin saving or changing session settings */
export function trackSettingsChange({
  sessionId,
  sessionTitle,
  voteWeightMode,
  deadlockRule,
  maxVotesPerVoter,
  movieAdditionMode,
  selectedMovieCount,
  voterCount,
}: {
  sessionId: string;
  sessionTitle?: string;
  voteWeightMode?: string;
  deadlockRule?: string;
  maxVotesPerVoter?: number;
  movieAdditionMode?: string;
  selectedMovieCount?: number;
  voterCount?: number;
}) {
  trackEvent('change_session_settings', {
    session_id: sessionId,
    session_title: sessionTitle,
    vote_weight_mode: voteWeightMode,
    deadlock_rule: deadlockRule,
    max_votes: maxVotesPerVoter,
    movie_addition_mode: movieAdditionMode,
    selected_movies: selectedMovieCount,
    voters_count: voterCount,
  });
}

/** Track key admin lifecycle events (launch, pause, resume, close, reopen, reset, delete) */
export function trackAdminAction({
  sessionId,
  action, // 'launch' | 'pause' | 'resume' | 'close' | 'reopen' | 'reset_votes' | 'delete_session'
  sessionTitle,
  movieCount,
}: {
  sessionId: string;
  action:
    | 'launch'
    | 'pause'
    | 'resume'
    | 'close'
    | 'reopen'
    | 'reset_votes'
    | 'delete_session';
  sessionTitle?: string;
  movieCount?: number;
}) {
  trackEvent(`admin_${action}`, {
    session_id: sessionId,
    session_title: sessionTitle,
    movie_count: movieCount,
  });
}

/** Track AI movie recommendation generation */
export function trackAiGenerate({
  sessionId,
  prompt,
  count,
  resultsCount,
}: {
  sessionId: string;
  prompt: string;
  count: number;
  resultsCount?: number;
}) {
  trackEvent('ai_generate_movies', {
    session_id: sessionId,
    prompt,
    requested_count: count,
    results_count: resultsCount,
  });
}

/** Track creating a new session */
export function trackCreateSession({
  sessionId,
  sessionTitle,
}: {
  sessionId: string;
  sessionTitle: string;
}) {
  trackEvent('create_session', {
    session_id: sessionId,
    session_title: sessionTitle,
  });
}

/** Track viewing a movie's detail modal or full detail page */
export function trackViewMovie({
  sessionId,
  movieId,
  movieTitle,
  source, // 'modal' | 'page'
}: {
  sessionId?: string;
  movieId: string;
  movieTitle: string;
  source: 'modal' | 'page';
}) {
  trackEvent('view_movie_details', {
    session_id: sessionId,
    movie_id: movieId,
    movie_title: movieTitle,
    source,
  });
}

/** Track clicking to play a movie's official YouTube trailer */
export function trackPlayTrailer({
  sessionId,
  movieId,
  movieTitle,
  youtubeTrailerId,
}: {
  sessionId?: string;
  movieId: string;
  movieTitle: string;
  youtubeTrailerId: string;
}) {
  trackEvent('play_trailer', {
    session_id: sessionId,
    movie_id: movieId,
    movie_title: movieTitle,
    youtube_trailer_id: youtubeTrailerId,
  });
}

/** Track sharing a session to social platforms or copying link/code */
export function trackShareSession({
  sessionId,
  platform,
}: {
  sessionId: string;
  platform: 'native_share' | 'whatsapp' | 'x' | 'facebook' | 'telegram' | 'reddit' | 'copy_link' | 'copy_code';
}) {
  trackEvent('share_session', {
    session_id: sessionId,
    platform,
  });
}

