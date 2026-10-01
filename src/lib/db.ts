import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import { rankByVotes } from './ranking';
import { normalizeMovieSource } from './movieFilters';
import {
  SessionConfig,
  SessionResponse,
  MovieScore,
  Voter,
  Ballot,
  CreatorMetadata,
  Movie,
  CustomMovieInput,
  DeadlockRule,
  SessionStatus,
} from '@/types';
import { DEFAULT_VOTERS, GENRE_INFO } from '@/data/moviesData';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_BACKUP_PATH = path.join(DATA_DIR, 'movienight.json');

declare global {
  // eslint-disable-next-line no-var
  var __movieNightPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __movieNightDbInitialized: boolean | undefined;
}

export function getPool(): Pool {
  if (global.__movieNightPgPool) {
    return global.__movieNightPgPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in environment variables (.env.local)');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  global.__movieNightPgPool = pool;
  return pool;
}

export async function ensureDbInitialized(): Promise<void> {
  if (global.__movieNightDbInitialized) return;

  const pool = getPool();

  // Create core tables if not existing
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      session_title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'setup',
      winner_movie_id TEXT,
      creator_user_id TEXT,
      creator_email TEXT,
      creator_name TEXT,
      creator_avatar TEXT,
      max_votes_per_voter INT DEFAULT 3,
      is_public BOOLEAN DEFAULT true,
      deadlock_rule TEXT DEFAULT 'random',
      age_rating_limit TEXT DEFAULT 'ALL',
      year_filter TEXT DEFAULT 'ALL',
      min_year INT,
      max_year INT,
      genre_filter TEXT[] DEFAULT '{}',
      streaming_filter TEXT[] DEFAULT '{}',
      movie_addition_mode TEXT DEFAULT 'voter_suggestions',
      max_suggestions_per_voter INT DEFAULT 2,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_user_id TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_email TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_name TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_avatar TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_votes_per_voter INT DEFAULT 3;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deadlock_rule TEXT DEFAULT 'random';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_rating_limit TEXT DEFAULT 'ALL';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS year_filter TEXT DEFAULT 'ALL';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS min_year INT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_year INT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS genre_filter TEXT[] DEFAULT '{}';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS streaming_filter TEXT[] DEFAULT '{}';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS movie_addition_mode TEXT DEFAULT 'voter_suggestions';
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_suggestions_per_voter INT DEFAULT 2;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_ai_curated BOOLEAN DEFAULT false;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ai_movie_ids TEXT[] DEFAULT '{}';
    ALTER TABLE sessions ALTER COLUMN movie_addition_mode SET DEFAULT 'voter_suggestions';
    ALTER TABLE sessions ALTER COLUMN max_suggestions_per_voter SET DEFAULT 2;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS vote_weight_mode TEXT DEFAULT 'ranked';
    ALTER TABLE sessions ALTER COLUMN vote_weight_mode SET DEFAULT 'ranked';

    CREATE TABLE IF NOT EXISTS voters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      avatar_url TEXT,
      color TEXT NOT NULL
    );

    ALTER TABLE voters ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE voters ADD COLUMN IF NOT EXISTS user_id TEXT;
    ALTER TABLE voters ADD COLUMN IF NOT EXISTS email TEXT;

    CREATE TABLE IF NOT EXISTS session_voters (
      session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
      voter_id TEXT NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
      PRIMARY KEY (session_id, voter_id)
    );

    CREATE TABLE IF NOT EXISTS active_movies (
      session_id TEXT NOT NULL,
      movie_id TEXT NOT NULL,
      PRIMARY KEY (session_id, movie_id)
    );

    CREATE TABLE IF NOT EXISTS active_genres (
      session_id TEXT NOT NULL,
      genre_id TEXT NOT NULL,
      PRIMARY KEY (session_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS custom_movies (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      title TEXT NOT NULL,
      year INT NOT NULL,
      imdb_rating NUMERIC DEFAULT 7.0,
      imdb_id TEXT,
      imdb_url TEXT,
      genre TEXT NOT NULL,
      genre_emoji TEXT,
      director TEXT,
      cast_list TEXT[],
      synopsis TEXT,
      youtube_trailer_id TEXT,
      poster_url TEXT NOT NULL,
      backdrop_url TEXT,
      tagline TEXT,
      runtime TEXT,
      rated TEXT,
      streaming_sources TEXT[] DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    ALTER TABLE custom_movies ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

    CREATE TABLE IF NOT EXISTS votes (
      session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
      voter_id TEXT NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
      movie_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (session_id, voter_id, movie_id)
    );
  `);

  // Ensure default voters are seeded in the master voter directory
  for (const v of DEFAULT_VOTERS) {
    await pool.query(
      'INSERT INTO voters (id, name, avatar, avatar_url, color) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, avatar_url = EXCLUDED.avatar_url, color = EXCLUDED.color',
      [v.id, v.name, v.avatar, v.avatarUrl || null, v.color]
    );
  }

  global.__movieNightDbInitialized = true;
}

let cachedCatalogue: Movie[] | null = null;
let cachedCatalogueTime = 0;
const CATALOGUE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/** Shared catalogue stored in Supabase PostgreSQL. Run db:migrate:movies before deployment. */
export async function getCatalogueMovies(): Promise<Movie[]> {
  const now = Date.now();
  if (cachedCatalogue && now - cachedCatalogueTime < CATALOGUE_CACHE_TTL) {
    return cachedCatalogue;
  }

  const result = await getPool().query<{ data: Movie }>('SELECT data FROM public.movies ORDER BY title, id');
  cachedCatalogue = result.rows.map((row) => row.data);
  cachedCatalogueTime = now;
  return cachedCatalogue;
}

export function invalidateCatalogueCache(): void {
  cachedCatalogue = null;
  cachedCatalogueTime = 0;
}

/**
 * When AI looks up or suggests new titles, ensure they are persisted to the remote
 * Supabase public.movies catalogue if not already present. This grows the universal
 * catalogue for all non-AI users.
 */
export async function addMovieToCatalogueIfMissingInDB(
  input: CustomMovieInput,
  sessionId?: string
): Promise<Movie> {
  await ensureDbInitialized();
  const pool = getPool();

  const title = input.title.trim();
  const year = input.year ?? new Date().getFullYear();
  const tmdbId = input.tmdbId ?? null;
  const imdbId = input.imdbUrl?.match(/tt\d+/)?.[0] || null;

  // 1. Check if movie already exists in public.movies (by tmdbId, imdbId, or title + year)
  const existingRes = await pool.query<{ id: string; data: Movie }>(
    `SELECT id, data FROM public.movies
     WHERE 
       ($1::int IS NOT NULL AND (data->>'tmdbId')::int = $1)
       OR ($2::text IS NOT NULL AND data->>'imdbId' = $2)
       OR (LOWER(TRIM(title)) = LOWER(TRIM($3)) AND (data->>'year')::int = $4)
     LIMIT 1`,
    [tmdbId, imdbId, title, year]
  );

  let movieRecord: Movie;

  if (existingRes.rows.length > 0) {
    movieRecord = existingRes.rows[0].data;
  } else {
    // 2. Generate clean slug ID for public.movies
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'movie';
    const slugWithYear = year ? `${baseSlug}-${year}` : baseSlug;

    let candidateId = slugWithYear;
    let counter = 1;
    while ((await pool.query('SELECT 1 FROM public.movies WHERE id = $1', [candidateId])).rows.length > 0) {
      candidateId = `${slugWithYear}-${counter++}`;
    }

    const genre = (input.genres && input.genres[0]) || input.genre || 'Other';
    const genreEmoji = input.genreEmoji || GENRE_INFO[genre]?.emoji || '🎬';
    const synopsis = input.synopsis?.trim() || 'No synopsis provided.';
    const posterUrl = input.poster?.trim() || input.posterUrl?.trim() || '/movie-placeholder.svg';
    const trailerId = input.trailerId?.trim() || input.youtubeTrailerId?.trim() || '';
    const director = input.director?.trim() || 'Unknown Director';
    const cast = input.cast && input.cast.length > 0 ? input.cast : [];
    const imdbRating = input.imdbRating ?? 0;
    const runtimeStr = typeof input.runtime === 'number' ? `${input.runtime} min` : input.runtime || '';
    const ratedStr = input.ageRating || input.rated || 'PG-13';
    const streamingSources = (input.streamingSources && input.streamingSources.length > 0)
      ? input.streamingSources.map(normalizeMovieSource)
      : ['plex'];

    movieRecord = {
      id: candidateId,
      title,
      year,
      genre,
      genreEmoji,
      director,
      cast,
      castMembers: input.castMembers,
      synopsis,
      posterUrl,
      backdropUrl: input.backdropUrl?.trim() || undefined,
      tagline: input.tagline?.trim() || undefined,
      runtime: runtimeStr,
      rated: ratedStr,
      imdbRating,
      imdbId: imdbId || '',
      imdbUrl: imdbId ? `https://www.imdb.com/title/${imdbId}/` : (input.imdbUrl || ''),
      tmdbId: tmdbId ?? undefined,
      tmdbRating: input.tmdbRating,
      streamingSources,
      youtubeTrailerId: trailerId,
      watchProvidersUrl: input.watchProvidersUrl,
      watchRegion: input.watchRegion,
      isCustom: false,
    };

    // Insert into remote Supabase public.movies
    await pool.query(
      'INSERT INTO public.movies (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING',
      [candidateId, JSON.stringify(movieRecord)]
    );
  }

  // 3. If sessionId provided, ensure it is added to active_movies for that session
  if (sessionId) {
    await pool.query(
      'INSERT INTO active_movies (session_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [sessionId, movieRecord.id]
    );
    const now = new Date().toISOString();
    await pool.query('UPDATE sessions SET updated_at = $1 WHERE session_id = $2', [now, sessionId]);
  }

  return movieRecord;
}

async function getAvailableMovies(sessionId?: string): Promise<Movie[]> {
  const pool = getPool();
  const customMoviesRes = await pool.query<{
    id: string;
    session_id: string | null;
    title: string;
    year: number;
    imdb_rating: string | number;
    imdb_id: string | null;
    imdb_url: string | null;
    genre: string;
    genre_emoji: string | null;
    director: string | null;
    cast_list: string[] | null;
    synopsis: string | null;
    youtube_trailer_id: string | null;
    poster_url: string;
    backdrop_url: string | null;
    tagline: string | null;
    runtime: string | null;
    rated: string | null;
    streaming_sources: string[] | null;
    metadata: Pick<Movie, 'tmdbId' | 'tmdbRating' | 'watchProvidersUrl' | 'watchRegion' | 'addedByVoterId' | 'castMembers'>;
  }>(
    'SELECT * FROM custom_movies WHERE $1::text IS NULL OR session_id = $1 OR session_id IS NULL ORDER BY created_at DESC',
    [sessionId || null]
  );

  const customMovies: Movie[] = customMoviesRes.rows.map((r) => ({
    ...r.metadata,
    id: r.id,
    title: r.title,
    year: r.year,
    imdbRating: typeof r.imdb_rating === 'number' ? r.imdb_rating : parseFloat(r.imdb_rating) || 0,
    imdbId: r.imdb_id || '',
    imdbUrl: r.imdb_url || '',
    genre: r.genre,
    genreEmoji: r.genre_emoji || '🎬',
    director: r.director || 'Unknown',
    cast: r.cast_list || [],
    castMembers: r.metadata?.castMembers || undefined,
    synopsis: r.synopsis || '',
    youtubeTrailerId: r.youtube_trailer_id || '',
    posterUrl: r.poster_url,
    backdropUrl: r.backdrop_url || undefined,
    tagline: r.tagline || undefined,
    runtime: r.runtime || '',
    rated: r.rated || '',
    streamingSources: r.streaming_sources || ['plex'],
    isCustom: true,
  }));

  const catalogue = await getCatalogueMovies();
  const catalogueIds = new Set(catalogue.map((m) => m.id));
  const uniqueCustom = customMovies.filter((m) => !catalogueIds.has(m.id));
  return [...uniqueCustom, ...catalogue];
}

export function generateNumericSessionId(): string {
  return crypto.randomInt(10000000, 100000000).toString();
}

export function formatSessionCode(id: string): string {
  const digits = id.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return id;
}

async function initSession(
  pool: Pool,
  sessionId: string,
  initialTitle: string,
  creator?: CreatorMetadata,
  initialMovieIds?: string[]
): Promise<void> {
  const title = initialTitle;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO sessions (
      session_id, session_title, status, winner_movie_id, 
      creator_user_id, creator_email, creator_name, creator_avatar, 
      created_at, updated_at, movie_addition_mode, max_suggestions_per_voter
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'voter_suggestions', 2) 
    ON CONFLICT (session_id) DO NOTHING`,
    [
      sessionId,
      title,
      'setup',
      null,
      creator?.userId || null,
      creator?.email || null,
      creator?.name || null,
      creator?.avatarUrl || null,
      now,
      now,
    ]
  );

  // If initial movie choices are provided, add them to active_movies
  if (Array.isArray(initialMovieIds) && initialMovieIds.length > 0) {
    for (const mId of initialMovieIds) {
      await pool.query(
        'INSERT INTO active_movies (session_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [sessionId, mId]
      );
    }
  }

  // If creator info is provided, insert the creator as the host voter in this session
  if (creator && (creator.name || creator.email)) {
    const creatorId = creator.userId ? `host_${creator.userId.slice(0, 8)}` : `host_${sessionId.slice(-4)}`;
    const creatorName = creator.name || (creator.email ? creator.email.split('@')[0] : 'Host');
    await pool.query(
      `INSERT INTO voters (id, name, avatar, avatar_url, color, user_id, email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE 
       SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, avatar_url = EXCLUDED.avatar_url, user_id = EXCLUDED.user_id, email = EXCLUDED.email`,
      [creatorId, creatorName, '👑', creator.avatarUrl || null, 'from-amber-500 to-red-600', creator.userId || null, creator.email || null]
    );
    await pool.query(
      'INSERT INTO session_voters (session_id, voter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [sessionId, creatorId]
    );
  }
}

export async function listSessionsInDB(): Promise<Array<{
  sessionId: string;
  sessionTitle: string;
  status: string;
  winnerMovieId: string | null;
  creator: { userId?: string | null; email?: string | null; name?: string | null; avatarUrl?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  movieCount: number;
  voteCount: number;
  voterCount: number;
  sampleMovies: Array<{ id: string; title: string; posterUrl: string; year: number; rating: number }>;
  leaderMovie: { id: string; title: string; posterUrl: string; votes: number } | null;
}>> {
  await ensureDbInitialized();
  const pool = getPool();

  const res = await pool.query<{
    session_id: string;
    session_title: string;
    status: string;
    winner_movie_id: string | null;
    is_public: boolean | null;
    creator_user_id: string | null;
    creator_email: string | null;
    creator_name: string | null;
    creator_avatar: string | null;
    created_at: string;
    updated_at: string;
    movie_count: string;
    vote_count: string;
    voter_count: string;
    active_movie_ids: string[] | null;
  }>(`
    SELECT 
      s.session_id, 
      s.session_title, 
      s.status, 
      s.winner_movie_id,
      s.is_public,
      s.creator_user_id,
      s.creator_email,
      s.creator_name,
      s.creator_avatar,
      s.created_at, 
      s.updated_at,
      COUNT(DISTINCT am.movie_id) as movie_count,
      COUNT(DISTINCT v.movie_id || '-' || v.voter_id) as vote_count,
      COUNT(DISTINCT sv.voter_id) as voter_count,
      ARRAY_AGG(DISTINCT am.movie_id) FILTER (WHERE am.movie_id IS NOT NULL) as active_movie_ids
    FROM sessions s
    LEFT JOIN active_movies am ON s.session_id = am.session_id
    LEFT JOIN votes v ON s.session_id = v.session_id
    LEFT JOIN session_voters sv ON s.session_id = sv.session_id
    GROUP BY s.session_id
    ORDER BY s.updated_at DESC
  `);

  // Fetch vote leaders per session
  const leadersRes = await pool.query<{ session_id: string; movie_id: string; vote_tally: string }>(`
    SELECT session_id, movie_id, COUNT(*) as vote_tally
    FROM votes
    GROUP BY session_id, movie_id
    ORDER BY session_id, vote_tally DESC
  `);

  const leadersBySession = new Map<string, { movieId: string; votes: number }>();
  for (const row of leadersRes.rows) {
    if (!leadersBySession.has(row.session_id)) {
      leadersBySession.set(row.session_id, {
        movieId: row.movie_id,
        votes: parseInt(row.vote_tally, 10) || 0,
      });
    }
  }

  const moviesMap = new Map((await getAvailableMovies()).map((m) => [m.id, m]));

  return res.rows.map((row) => {
    const movieIds = row.active_movie_ids || [];
    const sampleMovies = movieIds
      .slice(0, 4)
      .map((id) => moviesMap.get(id))
      .filter((m): m is Movie => Boolean(m))
      .map((m) => ({
        id: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        year: m.year,
        rating: m.tmdbRating ?? m.imdbRating,
      }));

    let leaderMovie: { id: string; title: string; posterUrl: string; votes: number } | null = null;
    const leaderItem = leadersBySession.get(row.session_id);
    if (leaderItem) {
      const found = moviesMap.get(leaderItem.movieId);
      if (found) {
        leaderMovie = {
          id: found.id,
          title: found.title,
          posterUrl: found.posterUrl,
          votes: leaderItem.votes,
        };
      }
    } else if (row.winner_movie_id) {
      const found = moviesMap.get(row.winner_movie_id);
      if (found) {
        leaderMovie = {
          id: found.id,
          title: found.title,
          posterUrl: found.posterUrl,
          votes: 1,
        };
      }
    }

    const creator =
      row.creator_name || row.creator_email
        ? {
            userId: row.creator_user_id,
            email: row.creator_email,
            name: row.creator_name,
            avatarUrl: row.creator_avatar,
          }
        : null;

    return {
      sessionId: row.session_id,
      sessionTitle: row.session_title,
      status: row.status,
      winnerMovieId: row.winner_movie_id,
      isPublic: row.is_public ?? true,
      creator,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      movieCount: parseInt(row.movie_count, 10) || 0,
      voteCount: parseInt(row.vote_count, 10) || 0,
      voterCount: parseInt(row.voter_count, 10) || 0,
      sampleMovies,
      leaderMovie,
    };
  });
}

export async function createSessionInDB(
  title?: string,
  requestedId?: string,
  creator?: CreatorMetadata,
  initialMovieIds?: string[]
): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();

  let cleanId = requestedId ? requestedId.replace(/\D/g, '') : '';
  if (!cleanId || cleanId.length < 4) {
    let isUnique = false;
    while (!isUnique) {
      cleanId = generateNumericSessionId();
      const existing = await pool.query('SELECT 1 FROM sessions WHERE session_id = $1', [cleanId]);
      if (existing.rows.length === 0) {
        isUnique = true;
      }
    }
  }

  const sessionTitle = title ? title.trim() : '';

  await initSession(pool, cleanId, sessionTitle, creator, initialMovieIds);
  return computeSessionResponseFromDB(cleanId);
}

export async function computeSessionResponseFromDB(rawSessionId?: string): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();

  let sessionId = (rawSessionId || '').trim();

  // If someone requests 'session-main' or empty, resolve to the primary numeric session
  if (!sessionId || sessionId === 'session-main') {
    const primaryRes = await pool.query('SELECT session_id FROM sessions ORDER BY created_at ASC LIMIT 1');
    if (primaryRes.rows.length > 0) {
      sessionId = primaryRes.rows[0].session_id;
    } else {
      sessionId = generateNumericSessionId();
    }
  }

  // Strip non-digits if it looks like a formatted code like "3235 5672"
  const digitsOnly = sessionId.replace(/\D/g, '');
  if (digitsOnly.length >= 6 && digitsOnly.length <= 8) {
    sessionId = digitsOnly;
  }

  // 1. Session info
  let sessionRes = await pool.query<{
    session_id: string;
    session_title: string;
    status: SessionStatus;
    winner_movie_id: string | null;
    creator_user_id: string | null;
    creator_email: string | null;
    creator_name: string | null;
    creator_avatar: string | null;
    max_votes_per_voter: number | null;
    is_public: boolean | null;
    deadlock_rule: DeadlockRule | null;
    age_rating_limit: string | null;
    year_filter: string | null;
    min_year: number | null;
    max_year: number | null;
    genre_filter: string[] | null;
    streaming_filter: string[] | null;
    movie_addition_mode: 'admin_only' | 'voter_suggestions' | null;
    max_suggestions_per_voter: number | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);

  // If session doesn't exist yet, auto-provision only default main session, otherwise return expired/not found
  if (sessionRes.rows.length === 0) {
    if (!rawSessionId || rawSessionId === 'session-main') {
      const formattedTitle = `Movie Night #${formatSessionCode(sessionId)}`;
      await initSession(pool, sessionId, formattedTitle);
      sessionRes = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
    } else {
      return {
        session: null as any,
        expired: true,
        error: 'Session not found or expired',
        turnout: { totalVoters: 0, votedCount: 0, pendingVoters: [], votedVoters: [] },
      };
    }
  }

  const sessionRow = sessionRes.rows[0];

  const sid = sessionRow.session_id;
  const sessionTitle = sessionRow.session_title;
  const status: SessionStatus = (sessionRow.status as SessionStatus) || 'setup';
  const winnerMovieId = sessionRow.winner_movie_id || null;
  const createdAt = sessionRow.created_at ? new Date(sessionRow.created_at).toISOString() : new Date().toISOString();
  const updatedAt = sessionRow.updated_at ? new Date(sessionRow.updated_at).toISOString() : new Date().toISOString();

  const allAvailableMovies = await getAvailableMovies(sid);
  const allMoviesMap = new Map(allAvailableMovies.map((m) => [m.id, m]));

  // Active Movies and Genres
  const activeMovieRes = await pool.query<{ movie_id: string }>(
    'SELECT movie_id FROM active_movies WHERE session_id = $1',
    [sid]
  );
  const activeMovieIds = activeMovieRes.rows.map((r) => r.movie_id);

  const activeGenreRes = await pool.query<{ genre_id: string }>(
    'SELECT genre_id FROM active_genres WHERE session_id = $1',
    [sid]
  );
  const activeGenres = activeGenreRes.rows.map((r) => r.genre_id);

  // 3. Voters for this session
  const voterRes = await pool.query<{ id: string; name: string; avatar: string; avatar_url: string | null; color: string; user_id: string | null; email: string | null }>(`
    SELECT v.id, v.name, v.avatar, v.avatar_url, v.color, v.user_id, v.email 
    FROM voters v
    JOIN session_voters sv ON v.id = sv.voter_id
    WHERE sv.session_id = $1
    ORDER BY v.name ASC
  `, [sid]);

  const voters: Voter[] = voterRes.rows.map((v) => {
    let resolvedAvatarUrl = v.avatar_url || undefined;
    if (!resolvedAvatarUrl && ['brian', 'suzi', 'michelle', 'william', 'aimee', 'kimberley', 'liam'].includes(v.id.toLowerCase())) {
      resolvedAvatarUrl = `/avatars/${v.id.toLowerCase()}.png`;
    }
    return {
      id: v.id,
      name: v.name,
      avatar: v.avatar,
      avatarUrl: resolvedAvatarUrl,
      color: v.color,
      userId: v.user_id || undefined,
      email: v.email || undefined,
    };
  });

  const voterMap = new Map(voters.map((v) => [v.id, v]));

  // 4. Votes & Ballots for this session
  const voteRes = await pool.query<{
    voter_id: string;
    movie_id: string;
    created_at: string;
    voter_name: string;
  }>(`
    SELECT v.voter_id, v.movie_id, v.created_at, vt.name as voter_name
    FROM votes v
    JOIN voters vt ON v.voter_id = vt.id
    WHERE v.session_id = $1
  `, [sid]);
  const voteRows = voteRes.rows;

  const ballots: Record<string, Ballot> = {};
  voters.forEach((v) => {
    ballots[v.id] = {
      voterId: v.id,
      voterName: v.name,
      movieIds: [],
      updatedAt: createdAt,
    };
  });

  const movieVoteMap = new Map<string, { count: number; voterNames: string[]; voters: Voter[] }>();
  const activeMovies = allAvailableMovies.filter((m) => activeMovieIds.includes(m.id));

  activeMovies.forEach((m) => {
    movieVoteMap.set(m.id, { count: 0, voterNames: [], voters: [] });
  });

  voteRows.forEach((row) => {
    const formattedDate = row.created_at ? new Date(row.created_at).toISOString() : createdAt;
    // Add to voter ballot
    if (!ballots[row.voter_id]) {
      ballots[row.voter_id] = {
        voterId: row.voter_id,
        voterName: row.voter_name,
        movieIds: [],
        updatedAt: formattedDate,
      };
    }
    if (!ballots[row.voter_id].movieIds.includes(row.movie_id)) {
      ballots[row.voter_id].movieIds.push(row.movie_id);
      ballots[row.voter_id].updatedAt = formattedDate;
    }

    // Add to movie score
    if (movieVoteMap.has(row.movie_id)) {
      const item = movieVoteMap.get(row.movie_id)!;
      item.count += 1;
      if (!item.voterNames.includes(row.voter_name)) {
        item.voterNames.push(row.voter_name);
      }
      const voterObj = voterMap.get(row.voter_id);
      if (voterObj && !item.voters.some((v) => v.id === voterObj.id)) {
        item.voters.push(voterObj);
      }
    }
  });

  // 5. Leaderboard with Gold, Silver, Bronze ranking
  const leaderboard: MovieScore[] = rankByVotes(activeMovies
    .map((m) => {
      const item = movieVoteMap.get(m.id) || { count: 0, voterNames: [], voters: [] };
      return {
        movie: m,
        votes: item.count,
        points: item.count,
        totalVoters: item.count,
        voterNames: item.voterNames,
        voters: item.voters,
      };
    })
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      if ((b.movie.tmdbRating ?? b.movie.imdbRating) !== (a.movie.tmdbRating ?? a.movie.imdbRating)) return (b.movie.tmdbRating ?? b.movie.imdbRating) - (a.movie.tmdbRating ?? a.movie.imdbRating);
      return a.movie.title.localeCompare(b.movie.title);
    }));

  // 6. Turnout
  const votedVoters: Voter[] = [];
  const pendingVoters: Voter[] = [];

  voters.forEach((v) => {
    const b = ballots[v.id];
    if (b && b.movieIds.length > 0) {
      votedVoters.push(v);
    } else {
      pendingVoters.push(v);
    }
  });

  const session: SessionConfig = {
    sessionId: sid,
    sessionTitle,
    activeMovieIds,
    activeGenres,
    voters,
    ballots,
    status,
    winnerMovieId,
    creatorUserId: sessionRow.creator_user_id || null,
    creatorEmail: sessionRow.creator_email || null,
    creatorName: sessionRow.creator_name || null,
    creatorAvatar: sessionRow.creator_avatar || null,
    maxVotesPerVoter: sessionRow.max_votes_per_voter ?? 3,
    isPublic: sessionRow.is_public ?? true,
    deadlockRule: sessionRow.deadlock_rule || 'random',
    voteWeightMode: (sessionRow as any).vote_weight_mode || 'ranked',
    ageRatingLimit: sessionRow.age_rating_limit || 'ALL',
    yearFilter: sessionRow.year_filter || 'ALL',
    minYear: sessionRow.min_year ?? null,
    maxYear: sessionRow.max_year ?? null,
    genreFilter: sessionRow.genre_filter || [],
    streamingFilter: sessionRow.streaming_filter || [],
    movieAdditionMode: sessionRow.movie_addition_mode || 'voter_suggestions',
    maxSuggestionsPerVoter: sessionRow.max_suggestions_per_voter ?? 2,
    isAiCurated: Boolean((sessionRow as any).is_ai_curated),
    aiPrompt: (sessionRow as any).ai_prompt || undefined,
    aiMovieIds: (sessionRow as any).ai_movie_ids || [],
    createdAt,
    updatedAt,
  };

  return {
    session,
    leaderboard,
    turnout: {
      totalVoters: voters.length,
      votedCount: votedVoters.length,
      votedVoters,
      pendingVoters,
    },
    allAvailableMovies,
  };
}

const PRESET_GRADIENTS = [
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-pink-600',
  'from-red-500 to-amber-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-emerald-600',
];

function getRandomGradient(): string {
  return PRESET_GRADIENTS[Math.floor(Math.random() * PRESET_GRADIENTS.length)];
}

export async function addVoterToSessionInDB(
  rawSessionId: string,
  name: string,
  avatar: string,
  color?: string,
  userId?: string | null,
  email?: string | null
): Promise<{ voter: Voter; sessionResponse: SessionResponse }> {
  await ensureDbInitialized();
  const pool = getPool();

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Voter name is required');
  }

  // Resolve numeric or formatted session id
  let sessionId = rawSessionId.trim();
  const digitsOnly = sessionId.replace(/\D/g, '');
  if (digitsOnly.length >= 6 && digitsOnly.length <= 8) {
    sessionId = digitsOnly;
  }

  // Check if session exists
  const sessionCheck = await pool.query<{ session_id: string; status: string }>(
    'SELECT session_id, status FROM sessions WHERE session_id = $1',
    [sessionId]
  );
  if (sessionCheck.rows.length === 0) {
    await initSession(pool, sessionId, `Movie Night #${formatSessionCode(sessionId)}`);
  }
  const isSessionLocked = sessionCheck.rows.length > 0 && sessionCheck.rows[0].status === 'locked';

  let voterObj: Voter;
  const voterColor = color || getRandomGradient();
  const avatarUrl = avatar.startsWith('http') || avatar.startsWith('data:') ? avatar : null;

  if (userId) {
    // 1. Authenticated OAuth User
    const userAlreadyInSession = await pool.query(
      `SELECT 1 FROM session_voters sv JOIN voters v ON sv.voter_id = v.id WHERE sv.session_id = $1 AND v.user_id = $2 LIMIT 1`,
      [sessionId, userId]
    );
    if (userAlreadyInSession.rows.length === 0 && isSessionLocked) {
      throw new Error('Voting has ended for this session. New visitors cannot register as voters.');
    }

    // Check if voter with this user_id already exists in voters master table
    const userVoterRes = await pool.query<{ id: string; name: string; avatar: string; avatar_url: string | null; color: string }>(
      'SELECT id, name, avatar, avatar_url, color FROM voters WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    let effectiveVoterId: string;
    if (userVoterRes.rows.length > 0) {
      effectiveVoterId = userVoterRes.rows[0].id;
      await pool.query(
        `UPDATE voters 
         SET name = COALESCE(NULLIF($1, ''), name), 
             avatar = COALESCE(NULLIF($2, ''), avatar),
             avatar_url = COALESCE($3, avatar_url),
             email = COALESCE($4, email)
         WHERE id = $5`,
        [cleanName, avatar, avatarUrl, email || null, effectiveVoterId]
      );
    } else {
      const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'voter';
      effectiveVoterId = `u_${baseSlug}_${userId.slice(0, 6)}`;
      await pool.query(
        `INSERT INTO voters (id, name, avatar, avatar_url, color, user_id, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, avatar_url = EXCLUDED.avatar_url, user_id = EXCLUDED.user_id, email = EXCLUDED.email`,
        [effectiveVoterId, cleanName, avatar, avatarUrl, voterColor, userId, email || null]
      );
    }

    // Link voter to this session
    await pool.query(
      'INSERT INTO session_voters (session_id, voter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [sessionId, effectiveVoterId]
    );

    voterObj = {
      id: effectiveVoterId,
      name: cleanName,
      avatar,
      avatarUrl: avatarUrl || undefined,
      color: voterColor,
    };
  } else {
    // 2. Unauthenticated Guest
    const existingRes = await pool.query<{ id: string; name: string; avatar: string; avatar_url: string | null; color: string; user_id: string | null }>(
      `SELECT v.id, v.name, v.avatar, v.avatar_url, v.color, v.user_id 
       FROM voters v
       JOIN session_voters sv ON v.id = sv.voter_id
       WHERE sv.session_id = $1 AND LOWER(TRIM(v.name)) = LOWER(TRIM($2))
       LIMIT 1`,
      [sessionId, cleanName]
    );

    if (existingRes.rows.length === 0 && isSessionLocked) {
      throw new Error('Voting has ended for this session. New visitors cannot register as voters.');
    }

    if (existingRes.rows.length > 0 && !existingRes.rows[0].user_id) {
      const row = existingRes.rows[0];
      voterObj = {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        avatarUrl: row.avatar_url || undefined,
        color: row.color,
      };
    } else {
      const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'voter';
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const newVoterId = `${baseSlug}_${randomSuffix}`;

      await pool.query(
        `INSERT INTO voters (id, name, avatar, avatar_url, color, user_id, email) 
         VALUES ($1, $2, $3, $4, $5, NULL, NULL) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, avatar_url = EXCLUDED.avatar_url, color = EXCLUDED.color`,
        [newVoterId, cleanName, avatar, avatarUrl, voterColor]
      );

      await pool.query(
        'INSERT INTO session_voters (session_id, voter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [sessionId, newVoterId]
      );

      voterObj = {
        id: newVoterId,
        name: cleanName,
        avatar,
        avatarUrl: avatarUrl || undefined,
        color: voterColor,
      };
    }
  }

  const sessionResponse = await computeSessionResponseFromDB(sessionId);
  return { voter: voterObj, sessionResponse };
}

export async function toggleVoteInDB(
  sessionId: string = 'session-main',
  voterId: string,
  movieId: string
): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const now = new Date().toISOString();

  // 1. Fetch session status and max_votes_per_voter
  const sessionRes = await pool.query(
    'SELECT status, max_votes_per_voter FROM sessions WHERE session_id = $1',
    [sessionId]
  );
  if (sessionRes.rows.length === 0) {
    throw new Error('Session not found');
  }
  const { status, max_votes_per_voter } = sessionRes.rows[0];

  if (status === 'setup') {
    throw new Error('Voting is not open yet. The host is still setting up the session.');
  }
  if (status === 'locked') {
    throw new Error('Voting has ended for this session.');
  }

  // Check if vote exists for this session
  const existing = await pool.query(
    'SELECT 1 FROM votes WHERE session_id = $1 AND voter_id = $2 AND movie_id = $3',
    [sessionId, voterId, movieId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      'DELETE FROM votes WHERE session_id = $1 AND voter_id = $2 AND movie_id = $3',
      [sessionId, voterId, movieId]
    );
  } else {
    // Toggling vote ON - check vote cap
    if (max_votes_per_voter && max_votes_per_voter > 0) {
      const countRes = await pool.query(
        'SELECT COUNT(*) FROM votes WHERE session_id = $1 AND voter_id = $2',
        [sessionId, voterId]
      );
      const currentCount = parseInt(countRes.rows[0].count, 10);
      if (currentCount >= max_votes_per_voter) {
        throw new Error(
          `You have reached the maximum of ${max_votes_per_voter} vote${max_votes_per_voter === 1 ? '' : 's'} allowed for this session.`
        );
      }
    }

    await pool.query(
      'INSERT INTO votes (session_id, voter_id, movie_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (session_id, voter_id, movie_id) DO NOTHING',
      [sessionId, voterId, movieId, now]
    );
  }

  // Update session timestamp
  await pool.query('UPDATE sessions SET updated_at = $1 WHERE session_id = $2', [now, sessionId]);

  return computeSessionResponseFromDB(sessionId);
}

export async function setVoterVotesInDB(
  sessionId: string = 'session-main',
  voterId: string,
  movieIds: string[]
): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const client = await pool.connect();
  const now = new Date().toISOString();

  // Check status & limit
  const sessionRes = await pool.query(
    'SELECT status, max_votes_per_voter FROM sessions WHERE session_id = $1',
    [sessionId]
  );
  if (sessionRes.rows.length === 0) {
    throw new Error('Session not found');
  }
  const { status, max_votes_per_voter } = sessionRes.rows[0];
  if (status === 'setup') {
    throw new Error('Voting is not open yet. The host is still setting up the session.');
  }
  if (status === 'locked') {
    throw new Error('Voting has ended for this session.');
  }

  let finalMovieIds = movieIds;
  if (max_votes_per_voter && max_votes_per_voter > 0 && movieIds.length > max_votes_per_voter) {
    finalMovieIds = movieIds.slice(0, max_votes_per_voter);
  }

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM votes WHERE session_id = $1 AND voter_id = $2', [sessionId, voterId]);
    for (const mId of finalMovieIds) {
      await client.query(
        'INSERT INTO votes (session_id, voter_id, movie_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (session_id, voter_id, movie_id) DO NOTHING',
        [sessionId, voterId, mId, now]
      );
    }
    await client.query('UPDATE sessions SET updated_at = $1 WHERE session_id = $2', [now, sessionId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return computeSessionResponseFromDB(sessionId);
}

export async function resetSessionVotesInDB(sessionId: string = 'session-main'): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const client = await pool.connect();
  const now = new Date().toISOString();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM votes WHERE session_id = $1', [sessionId]);
    await client.query(
      "UPDATE sessions SET status = 'voting', winner_movie_id = NULL, updated_at = $1 WHERE session_id = $2",
      [now, sessionId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return computeSessionResponseFromDB(sessionId);
}

export async function updateSessionConfigInDB(
  sessionId: string = 'session-main',
  updates: Partial<SessionConfig>
): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const client = await pool.connect();
  const now = new Date().toISOString();

  try {
    await client.query('BEGIN');

    const sessionUpdates: string[] = ['updated_at = $1'];
    const values: any[] = [now];
    let paramIdx = 2;

    if (updates.sessionTitle !== undefined) {
      sessionUpdates.push(`session_title = $${paramIdx++}`);
      values.push(updates.sessionTitle);
    }
    if (updates.status !== undefined) {
      sessionUpdates.push(`status = $${paramIdx++}`);
      values.push(updates.status);
    }
    if (updates.winnerMovieId !== undefined) {
      sessionUpdates.push(`winner_movie_id = $${paramIdx++}`);
      values.push(updates.winnerMovieId);
    }
    if (updates.maxVotesPerVoter !== undefined) {
      sessionUpdates.push(`max_votes_per_voter = $${paramIdx++}`);
      values.push(updates.maxVotesPerVoter);
    }
    if (updates.isPublic !== undefined) {
      sessionUpdates.push(`is_public = $${paramIdx++}`);
      values.push(updates.isPublic);
    }
    if (updates.deadlockRule !== undefined) {
      sessionUpdates.push(`deadlock_rule = $${paramIdx++}`);
      values.push(updates.deadlockRule);
    }
    if ((updates as any).voteWeightMode !== undefined) {
      sessionUpdates.push(`vote_weight_mode = $${paramIdx++}`);
      values.push((updates as any).voteWeightMode);
    }
    if (updates.ageRatingLimit !== undefined) {
      sessionUpdates.push(`age_rating_limit = $${paramIdx++}`);
      values.push(updates.ageRatingLimit);
    }
    if (updates.yearFilter !== undefined) {
      sessionUpdates.push(`year_filter = $${paramIdx++}`);
      values.push(updates.yearFilter);
    }
    if (updates.minYear !== undefined) {
      sessionUpdates.push(`min_year = $${paramIdx++}`);
      values.push(updates.minYear);
    }
    if (updates.maxYear !== undefined) {
      sessionUpdates.push(`max_year = $${paramIdx++}`);
      values.push(updates.maxYear);
    }
    if (updates.genreFilter !== undefined) {
      sessionUpdates.push(`genre_filter = $${paramIdx++}`);
      values.push(Array.isArray(updates.genreFilter) ? updates.genreFilter : []);
    }
    if (updates.streamingFilter !== undefined) {
      sessionUpdates.push(`streaming_filter = $${paramIdx++}`);
      values.push(Array.isArray(updates.streamingFilter) ? updates.streamingFilter : []);
    }
    if (updates.movieAdditionMode !== undefined) {
      sessionUpdates.push(`movie_addition_mode = $${paramIdx++}`);
      values.push(updates.movieAdditionMode);
    }
    if (updates.maxSuggestionsPerVoter !== undefined) {
      sessionUpdates.push(`max_suggestions_per_voter = $${paramIdx++}`);
      values.push(updates.maxSuggestionsPerVoter);
    }
    if (updates.isAiCurated !== undefined) {
      sessionUpdates.push(`is_ai_curated = $${paramIdx++}`);
      values.push(updates.isAiCurated);
    }
    if (updates.aiPrompt !== undefined) {
      sessionUpdates.push(`ai_prompt = $${paramIdx++}`);
      values.push(updates.aiPrompt);
    }
    if (updates.aiMovieIds !== undefined) {
      sessionUpdates.push(`ai_movie_ids = $${paramIdx++}`);
      values.push(Array.isArray(updates.aiMovieIds) ? updates.aiMovieIds : []);
    }

    if (sessionUpdates.length > 1) {
      values.push(sessionId);
      await client.query(
        `UPDATE sessions SET ${sessionUpdates.join(', ')} WHERE session_id = $${paramIdx}`,
        values
      );
    }

    if (Array.isArray(updates.activeMovieIds)) {
      await client.query('DELETE FROM active_movies WHERE session_id = $1', [sessionId]);
      for (const mId of updates.activeMovieIds) {
        await client.query(
          'INSERT INTO active_movies (session_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [sessionId, mId]
        );
      }
    }

    if (Array.isArray(updates.activeGenres)) {
      await client.query('DELETE FROM active_genres WHERE session_id = $1', [sessionId]);
      for (const gId of updates.activeGenres) {
        await client.query(
          'INSERT INTO active_genres (session_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [sessionId, gId]
        );
      }
    }

    if (Array.isArray(updates.voters)) {
      await client.query('DELETE FROM session_voters WHERE session_id = $1', [sessionId]);
      for (const v of updates.voters) {
        await client.query(
          'INSERT INTO voters (id, name, avatar, color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, color = EXCLUDED.color',
          [v.id, v.name, v.avatar, v.color]
        );
        await client.query(
          'INSERT INTO session_voters (session_id, voter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [sessionId, v.id]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return computeSessionResponseFromDB(sessionId);
}

export async function launchSessionInDB(sessionId: string): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const now = new Date().toISOString();

  await pool.query(
    "UPDATE sessions SET status = 'voting', updated_at = $1 WHERE session_id = $2",
    [now, sessionId]
  );

  return computeSessionResponseFromDB(sessionId);
}

export class MovieSuggestionError extends Error {}

export async function addCustomMovieToDB(
  sessionId: string,
  input: CustomMovieInput
): Promise<Movie> {
  await ensureDbInitialized();
  const pool = getPool();
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const title = input.title.trim();
  const year = input.year ?? new Date().getFullYear();
  const genre = (input.genres && input.genres[0]) || input.genre || 'Other';
  const genreEmoji = input.genreEmoji || GENRE_INFO[genre]?.emoji || '🎬';
  const synopsis = input.synopsis?.trim() || 'No synopsis provided.';
  const posterUrl = input.poster?.trim() || input.posterUrl?.trim() || '/movie-placeholder.svg';
  const trailerId = input.trailerId?.trim() || input.youtubeTrailerId?.trim() || '';
  const director = input.director?.trim() || 'Unknown Director';
  const cast = input.cast && input.cast.length > 0 ? input.cast : [];
  const imdbRating = input.imdbRating ?? 0;
  const imdbId = input.imdbUrl?.match(/tt\d+/)?.[0] || '';
  const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : '';
  const runtimeStr = typeof input.runtime === 'number' ? `${input.runtime} min` : input.runtime || '';
  const ratedStr = input.ageRating || input.rated || '';
  const streamingSources = (input.streamingSources || []).map(normalizeMovieSource);
  const metadata = {
    tmdbId: input.tmdbId,
    tmdbRating: input.tmdbRating,
    watchProvidersUrl: input.watchProvidersUrl,
    watchRegion: input.watchRegion,
    addedByVoterId: input.addedByVoterId,
    castMembers: input.castMembers,
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize additions in a session so concurrent submissions cannot exceed the cap.
    const config = await client.query(
      'SELECT movie_addition_mode, max_suggestions_per_voter FROM sessions WHERE session_id = $1 FOR UPDATE', [sessionId]
    );
    if (!config.rows.length) throw new MovieSuggestionError('Session not found.');
    if (input.addedByVoterId) {
      const membership = await client.query('SELECT 1 FROM session_voters WHERE session_id = $1 AND voter_id = $2', [sessionId, input.addedByVoterId]);
      if (!membership.rows.length) throw new MovieSuggestionError('Join the session before suggesting a movie.');
      if (config.rows[0].movie_addition_mode !== 'voter_suggestions') throw new MovieSuggestionError('Movie suggestions are not enabled for this session.');
      const limit = config.rows[0].max_suggestions_per_voter ?? 2;
      const used = await client.query("SELECT COUNT(*)::int AS count FROM custom_movies WHERE session_id = $1 AND metadata->>'addedByVoterId' = $2", [sessionId, input.addedByVoterId]);
      if (limit > 0 && used.rows[0].count >= limit) throw new MovieSuggestionError('You have used all your movie suggestions.');
    }
  await client.query(
    `INSERT INTO custom_movies (
      id, session_id, title, year, imdb_rating, imdb_id, imdb_url,
      genre, genre_emoji, director, cast_list, synopsis,
      youtube_trailer_id, poster_url, runtime, rated, streaming_sources, created_at, backdrop_url, tagline, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
    [
      id,
      sessionId,
      title,
      year,
      imdbRating,
      imdbId,
      imdbUrl,
      genre,
      genreEmoji,
      director,
      cast,
      synopsis,
      trailerId,
      posterUrl,
      runtimeStr,
      ratedStr,
      streamingSources,
      now,
      input.backdropUrl || null,
      input.tagline || null,
      JSON.stringify(metadata),
    ]
  );

  // Automatically add to active_movies for this session
  await client.query(
    'INSERT INTO active_movies (session_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [sessionId, id]
  );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    ...metadata,
    id,
    title,
    year,
    imdbRating,
    imdbId,
    imdbUrl,
    backdropUrl: input.backdropUrl,
    tagline: input.tagline,
    genre,
    genreEmoji,
    director,
    cast,
    synopsis,
    youtubeTrailerId: trailerId,
    posterUrl,
    runtime: runtimeStr,
    rated: ratedStr,
    streamingSources,
    isCustom: true,
  };
}

export async function getHostPastVotersInDB(
  creatorUserId?: string | null,
  creatorEmail?: string | null
): Promise<Voter[]> {
  if (!creatorUserId && !creatorEmail) return [];
  await ensureDbInitialized();
  const pool = getPool();

  const query = `
    SELECT DISTINCT v.id, v.name, v.avatar, v.color, v.avatar_url as "avatarUrl"
    FROM voters v
    JOIN session_voters sv ON v.id = sv.voter_id
    JOIN sessions s ON sv.session_id = s.session_id
    WHERE (
      ($1::text IS NOT NULL AND s.creator_user_id = $1)
      OR
      ($2::text IS NOT NULL AND s.creator_email = $2)
    )
    AND v.user_id IS NOT NULL
    AND (
      ($1::text IS NULL OR v.user_id != $1)
      AND
      ($2::text IS NULL OR v.email IS NULL OR LOWER(v.email) != LOWER($2))
    )
    ORDER BY v.name ASC
  `;
  const res = await pool.query(query, [creatorUserId || null, creatorEmail || null]);
  return res.rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    avatarUrl: row.avatarUrl || undefined,
    color: row.color,
  }));
}

export async function pauseSessionInDB(sessionId: string): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const now = new Date().toISOString();
  await pool.query("UPDATE sessions SET status = 'paused', updated_at = $1 WHERE session_id = $2", [now, sessionId]);
  return computeSessionResponseFromDB(sessionId);
}

export async function resumeSessionInDB(sessionId: string): Promise<SessionResponse> {
  await ensureDbInitialized();
  const pool = getPool();
  const now = new Date().toISOString();
  await pool.query("UPDATE sessions SET status = 'voting', updated_at = $1 WHERE session_id = $2", [now, sessionId]);
  return computeSessionResponseFromDB(sessionId);
}

export async function deleteSessionInDB(sessionId: string): Promise<void> {
  await ensureDbInitialized();
  const pool = getPool();
  await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
}

export async function getSessionOgMetadata(rawSessionId: string): Promise<{
  sessionId: string;
  title: string;
  topMovie: Movie | null;
  movieCount: number;
} | null> {
  try {
    await ensureDbInitialized();
    const pool = getPool();
    let sessionId = (rawSessionId || '').trim();
    const digitsOnly = sessionId.replace(/\D/g, '');
    if (digitsOnly.length >= 6 && digitsOnly.length <= 8) {
      sessionId = digitsOnly;
    }

    const sessionRes = await pool.query<{ session_id: string; session_title: string }>(
      'SELECT session_id, session_title FROM sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return null;
    }

    const session = sessionRes.rows[0];
    const allMovies = await getAvailableMovies(session.session_id);

    // Active Movies for this session
    const activeMovieRes = await pool.query<{ movie_id: string }>(
      'SELECT movie_id FROM active_movies WHERE session_id = $1',
      [session.session_id]
    );
    const activeMovieIds = new Set(activeMovieRes.rows.map((r) => r.movie_id));
    const activeMovies = allMovies.filter((m) => activeMovieIds.has(m.id));

    // Determine highest rated movie among active movies (or any session movie if none active)
    const poolForRating = activeMovies.length > 0 ? activeMovies : allMovies;
    let topMovie: Movie | null = null;
    if (poolForRating.length > 0) {
      topMovie = [...poolForRating].sort((a, b) => {
        const ratingA = a.tmdbRating ?? a.imdbRating ?? 0;
        const ratingB = b.tmdbRating ?? b.imdbRating ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.year || 0) - (a.year || 0);
      })[0];
    }

    return {
      sessionId: session.session_id,
      title: session.session_title,
      topMovie,
      movieCount: activeMovies.length || allMovies.length,
    };
  } catch (err) {
    console.error('Error fetching session OG metadata:', err);
    return null;
  }
}

