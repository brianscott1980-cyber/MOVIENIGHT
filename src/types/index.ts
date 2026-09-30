export interface Movie {
  addedByVoterId?: string;
  tmdbId?: number;
  tmdbRating?: number;
  watchProvidersUrl?: string;
  watchRegion?: string;

  id: string;
  title: string;
  year: number;
  imdbRating: number;
  imdbId: string;
  imdbUrl: string;
  genre: string;
  genreEmoji: string;
  director: string;
  cast: string[];
  synopsis: string;
  youtubeTrailerId: string;
  posterUrl: string;
  backdropUrl?: string;
  tagline?: string;
  runtime?: string;
  rated?: string;
  awards?: string;
  rottenTomatoes?: string | null;
  boxOffice?: string | null;
  streamingSources?: string[];
  isCustom?: boolean;
}

export interface CustomMovieInput {
  tmdbId?: number;
  tmdbRating?: number;
  watchProvidersUrl?: string;
  watchRegion?: string;

  title: string;
  year: number;
  genres?: string[];
  genre?: string;
  genreEmoji?: string;
  director?: string;
  cast?: string[];
  synopsis?: string;
  trailerId?: string;
  youtubeTrailerId?: string;
  poster?: string;
  posterUrl?: string;
  backdropUrl?: string;
  tagline?: string;
  runtime?: number | string;
  rated?: string;
  ageRating?: string;
  imdbRating?: number;
  imdbUrl?: string;
  streamingSources?: string[];
  addedByVoterId?: string;
}

export interface Voter {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  color: string;
  userId?: string | null;
  email?: string | null;
}

export interface Ballot {
  voterId: string;
  voterName: string;
  movieIds: string[]; // List of movie IDs this voter has voted for
  // Kept for backward compatibility
  rank1MovieId?: string | null;
  rank2MovieId?: string | null;
  rank3MovieId?: string | null;
  updatedAt: string;
}

export interface MovieScore {
  movie: Movie;
  votes: number; // Total votes received
  points: number; // Kept for tally calculation
  totalVoters: number;
  voterNames: string[];
  voters?: Voter[];
  isJointPosition?: boolean;
  rankPosition?: number; // 1 = Gold, 2 = Silver, 3 = Bronze
}

export type SessionStatus = 'setup' | 'voting' | 'paused' | 'locked';
export type DeadlockRule = 'random' | 'runoff' | 'revote';
export type VoteWeightMode = 'equal' | 'ranked';
export type AgeRatingLimit = 'ALL' | 'U/G' | 'PG' | '12/PG-13' | '15/R' | '18/NC-17' | string;

export interface SessionConfig {
  sessionId: string;
  sessionTitle: string;
  activeMovieIds: string[];
  activeGenres: string[];
  voters: Voter[];
  ballots: Record<string, Ballot>;
  status: SessionStatus;
  winnerMovieId?: string | null;
  creatorUserId?: string | null;
  creatorEmail?: string | null;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  // Session setup configuration
  maxVotesPerVoter: number; // default = 3 (0 = unlimited)
  isPublic: boolean; // true = public live podium, false = secret ballot until locked
  deadlockRule: DeadlockRule; // 'random' | 'revote'
  voteWeightMode: VoteWeightMode; // 'equal' = all votes same weight, 'ranked' = first choice breaks ties
  ageRatingLimit: string; // 'ALL', 'U', 'PG', '12', '15', '18', 'G', 'PG-13', 'R'
  yearFilter: string; // 'ALL', '80s', '90s', '2000s', 'custom'
  minYear?: number | null;
  maxYear?: number | null;
  genreFilter: string[];
  streamingFilter: string[]; // e.g. ['netflix', 'prime', 'apple', 'disney', 'plex'] or []
  movieAdditionMode: 'admin_only' | 'voter_suggestions';
  maxSuggestionsPerVoter: number;
  isAiCurated?: boolean;
  aiPrompt?: string;
  aiMovieIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatorMetadata {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface SessionResponse {
  session: SessionConfig;
  allAvailableMovies?: Movie[];
  leaderboard?: MovieScore[];
  expired?: boolean;
  error?: string;
  turnout: {
    totalVoters: number;
    votedCount: number;
    pendingVoters: Voter[];
    votedVoters: Voter[];
  };
}

