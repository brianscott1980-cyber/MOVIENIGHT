export interface Movie {
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
}

export interface Voter {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  color: string;
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
  rankPosition?: number; // 1 = Gold, 2 = Silver, 3 = Bronze
}

export interface SessionConfig {
  sessionId: string;
  sessionTitle: string;
  activeMovieIds: string[];
  activeGenres: string[];
  voters: Voter[];
  ballots: Record<string, Ballot>;
  status: 'voting' | 'locked';
  winnerMovieId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  session: SessionConfig;
  leaderboard: MovieScore[];
  turnout: {
    totalVoters: number;
    votedCount: number;
    pendingVoters: Voter[];
    votedVoters: Voter[];
  };
}
