import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { SessionConfig, SessionResponse, MovieScore, Voter, Ballot } from '@/types';
import { DEFAULT_VOTERS, MOVIES_DATA, GENRE_INFO } from '@/data/moviesData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'movienight.db');
const JSON_BACKUP_PATH = path.join(DATA_DIR, 'movienight.json');

declare global {
  // eslint-disable-next-line no-var
  var __movieNightDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (global.__movieNightDb) {
    return global.__movieNightDb;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);

  // High performance & concurrency pragmas
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      session_title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'voting',
      winner_movie_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS voters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      color TEXT NOT NULL
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

    CREATE TABLE IF NOT EXISTS votes (
      voter_id TEXT NOT NULL,
      movie_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (voter_id, movie_id),
      FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE
    );
  `);

  // Initial seeding / migration check
  seedOrMigrate(db);

  global.__movieNightDb = db;
  return db;
}

function seedOrMigrate(db: DatabaseSync) {
  const existingSession = db.prepare('SELECT session_id FROM sessions LIMIT 1').get();
  if (existingSession) return;

  console.log('Initializing MovieNight SQLite database...');

  // Try migrating from JSON if available
  let title = 'Heaney Movie Night';
  let activeMovieIds = MOVIES_DATA.map((m) => m.id);
  let activeGenres = Object.keys(GENRE_INFO);
  let votersList = DEFAULT_VOTERS;

  if (fs.existsSync(JSON_BACKUP_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_BACKUP_PATH, 'utf-8');
      const json = JSON.parse(raw);
      if (json.sessionTitle) title = json.sessionTitle;
      if (Array.isArray(json.activeMovieIds) && json.activeMovieIds.length > 0) {
        activeMovieIds = json.activeMovieIds;
      }
      if (Array.isArray(json.activeGenres) && json.activeGenres.length > 0) {
        activeGenres = json.activeGenres;
      }
      if (Array.isArray(json.voters) && json.voters.length > 0) {
        votersList = json.voters;
      }
    } catch (e) {
      console.error('Could not read existing JSON configuration for migration:', e);
    }
  }

  const now = new Date().toISOString();

  // Insert session
  db.prepare(`
    INSERT INTO sessions (session_id, session_title, status, winner_movie_id, created_at, updated_at)
    VALUES (?, ?, 'voting', NULL, ?, ?)
  `).run('session-main', title, now, now);

  // Insert voters
  const insertVoter = db.prepare('INSERT OR REPLACE INTO voters (id, name, avatar, color) VALUES (?, ?, ?, ?)');
  for (const v of votersList) {
    insertVoter.run(v.id, v.name, v.avatar, v.color);
  }

  // Insert active movies
  const insertMovie = db.prepare('INSERT OR REPLACE INTO active_movies (session_id, movie_id) VALUES (?, ?)');
  for (const mId of activeMovieIds) {
    insertMovie.run('session-main', mId);
  }

  // Insert active genres
  const insertGenre = db.prepare('INSERT OR REPLACE INTO active_genres (session_id, genre_id) VALUES (?, ?)');
  for (const gId of activeGenres) {
    insertGenre.run('session-main', gId);
  }

  console.log('Database initialized successfully with', activeMovieIds.length, 'movies and', votersList.length, 'voters.');
}

export function computeSessionResponseFromDB(): SessionResponse {
  const db = getDb();

  // 1. Session info
  const sessionRow = (db.prepare('SELECT * FROM sessions WHERE session_id = ?').get('session-main') as unknown) as {
    session_id: string;
    session_title: string;
    status: 'voting' | 'locked';
    winner_movie_id: string | null;
    created_at: string;
    updated_at: string;
  } | undefined;

  const sessionId = sessionRow?.session_id || 'session-main';
  const sessionTitle = sessionRow?.session_title || 'Heaney Movie Night';
  const status = sessionRow?.status || 'voting';
  const winnerMovieId = sessionRow?.winner_movie_id || null;
  const createdAt = sessionRow?.created_at || new Date().toISOString();
  const updatedAt = sessionRow?.updated_at || new Date().toISOString();

  // 2. Active Movies and Genres
  const activeMovieRows = (db.prepare('SELECT movie_id FROM active_movies WHERE session_id = ?').all(sessionId) as unknown) as { movie_id: string }[];
  const activeMovieIds = activeMovieRows.map((r) => r.movie_id);

  const activeGenreRows = (db.prepare('SELECT genre_id FROM active_genres WHERE session_id = ?').all(sessionId) as unknown) as { genre_id: string }[];
  const activeGenres = activeGenreRows.map((r) => r.genre_id);

  // 3. Voters
  const voterRows = (db.prepare('SELECT id, name, avatar, color FROM voters').all() as unknown) as Voter[];
  const voters: Voter[] = voterRows.map((v) => ({
    ...v,
    avatarUrl: `/avatars/${v.id}.png`,
  }));

  const voterMap = new Map(voters.map((v) => [v.id, v]));

  // 4. Votes & Ballots
  const voteRows = (db.prepare(`
    SELECT v.voter_id, v.movie_id, v.created_at, vt.name as voter_name
    FROM votes v
    JOIN voters vt ON v.voter_id = vt.id
  `).all() as unknown) as { voter_id: string; movie_id: string; created_at: string; voter_name: string }[];

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
  const activeMovies = MOVIES_DATA.filter((m) => activeMovieIds.includes(m.id));

  activeMovies.forEach((m) => {
    movieVoteMap.set(m.id, { count: 0, voterNames: [], voters: [] });
  });

  voteRows.forEach((row) => {
    // Add to voter ballot
    if (!ballots[row.voter_id]) {
      ballots[row.voter_id] = {
        voterId: row.voter_id,
        voterName: row.voter_name,
        movieIds: [],
        updatedAt: row.created_at,
      };
    }
    if (!ballots[row.voter_id].movieIds.includes(row.movie_id)) {
      ballots[row.voter_id].movieIds.push(row.movie_id);
      ballots[row.voter_id].updatedAt = row.created_at;
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
  const leaderboard: MovieScore[] = activeMovies.map((m) => {
    const item = movieVoteMap.get(m.id) || { count: 0, voterNames: [], voters: [] };
    return {
      movie: m,
      votes: item.count,
      points: item.count,
      totalVoters: item.count,
      voterNames: item.voterNames,
      voters: item.voters,
    };
  }).sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    if (b.movie.imdbRating !== a.movie.imdbRating) return b.movie.imdbRating - a.movie.imdbRating;
    return a.movie.title.localeCompare(b.movie.title);
  });

  leaderboard.forEach((item, index) => {
    if (item.votes > 0) {
      item.rankPosition = index + 1;
    }
  });

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
    sessionId,
    sessionTitle,
    activeMovieIds,
    activeGenres,
    voters,
    ballots,
    status,
    winnerMovieId,
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
  };
}

export function toggleVoteInDB(voterId: string, movieId: string): SessionResponse {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if vote exists
  const existing = db.prepare('SELECT 1 FROM votes WHERE voter_id = ? AND movie_id = ?').get(voterId, movieId);

  if (existing) {
    db.prepare('DELETE FROM votes WHERE voter_id = ? AND movie_id = ?').run(voterId, movieId);
  } else {
    db.prepare('INSERT OR REPLACE INTO votes (voter_id, movie_id, created_at) VALUES (?, ?, ?)').run(voterId, movieId, now);
  }

  // Update session timestamp
  db.prepare('UPDATE sessions SET updated_at = ? WHERE session_id = ?').run(now, 'session-main');

  return computeSessionResponseFromDB();
}

export function setVoterVotesInDB(voterId: string, movieIds: string[]): SessionResponse {
  const db = getDb();
  const now = new Date().toISOString();

  // Replace all votes for this voter in an atomic transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM votes WHERE voter_id = ?').run(voterId);
    const insert = db.prepare('INSERT INTO votes (voter_id, movie_id, created_at) VALUES (?, ?, ?)');
    for (const mId of movieIds) {
      insert.run(voterId, mId, now);
    }
    db.prepare('UPDATE sessions SET updated_at = ? WHERE session_id = ?').run(now, 'session-main');
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return computeSessionResponseFromDB();
}

export function resetSessionVotesInDB(): SessionResponse {
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM votes').run();
    db.prepare(`
      UPDATE sessions
      SET status = 'voting', winner_movie_id = NULL, updated_at = ?
      WHERE session_id = ?
    `).run(now, 'session-main');
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return computeSessionResponseFromDB();
}

export function updateSessionConfigInDB(updates: Partial<SessionConfig>): SessionResponse {
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    if (updates.sessionTitle !== undefined || updates.status !== undefined || updates.winnerMovieId !== undefined) {
      db.prepare(`
        UPDATE sessions
        SET session_title = COALESCE(?, session_title),
            status = COALESCE(?, status),
            winner_movie_id = ?,
            updated_at = ?
        WHERE session_id = ?
      `).run(
        updates.sessionTitle !== undefined ? updates.sessionTitle : null,
        updates.status !== undefined ? updates.status : null,
        updates.winnerMovieId !== undefined ? updates.winnerMovieId : null,
        now,
        'session-main'
      );
    }

    if (Array.isArray(updates.activeMovieIds)) {
      db.prepare('DELETE FROM active_movies WHERE session_id = ?').run('session-main');
      const ins = db.prepare('INSERT INTO active_movies (session_id, movie_id) VALUES (?, ?)');
      for (const mId of updates.activeMovieIds) {
        ins.run('session-main', mId);
      }
    }

    if (Array.isArray(updates.activeGenres)) {
      db.prepare('DELETE FROM active_genres WHERE session_id = ?').run('session-main');
      const ins = db.prepare('INSERT INTO active_genres (session_id, genre_id) VALUES (?, ?)');
      for (const gId of updates.activeGenres) {
        ins.run('session-main', gId);
      }
    }

    if (Array.isArray(updates.voters)) {
      db.prepare('DELETE FROM voters').run();
      const ins = db.prepare('INSERT INTO voters (id, name, avatar, color) VALUES (?, ?, ?, ?)');
      for (const v of updates.voters) {
        ins.run(v.id, v.name, v.avatar, v.color);
      }
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return computeSessionResponseFromDB();
}
