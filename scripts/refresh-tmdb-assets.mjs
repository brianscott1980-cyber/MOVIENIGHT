// Node 22+: preserve catalogue IDs, ballots and curated genres while replacing artwork.
import { readFile, writeFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { Pool } from 'pg';
import { tmdbRequest, getTmdbMovie } from '../src/lib/tmdb.ts';
nextEnv.loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
try {
  await pool.query(await readFile('supabase/migrations/202609300002_tmdb_metadata.sql', 'utf8'));
  const { rows } = await pool.query('SELECT id, data FROM movies ORDER BY id');
  const updates = [];
  for (const { id, data } of rows) {
    const found = data.tmdbId ? { movie_results: [{ id: data.tmdbId }] } : await tmdbRequest(`find/${data.imdbId}`, { external_source: 'imdb_id' });
    if (!found.movie_results?.length) throw new Error(`No TMDB match for catalogue movie ${id}`);
    const movie = await getTmdbMovie(found.movie_results[0].id);
    updates.push({ id, data: { ...data, tmdbId: movie.tmdbId, tmdbRating: movie.tmdbRating,
      posterUrl: movie.posterUrl || '/movie-placeholder.svg', backdropUrl: movie.backdropUrl || undefined,
      youtubeTrailerId: movie.youtubeTrailerId || data.youtubeTrailerId,
    } });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const movie of updates) await client.query('UPDATE movies SET data=$2::jsonb WHERE id=$1', [movie.id, JSON.stringify(movie.data)]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
  const seed = JSON.parse(await readFile('data/movie-catalogue.seed.json', 'utf8'));
  const byId = new Map(updates.map((movie) => [movie.id, movie.data]));
  await writeFile('data/movie-catalogue.seed.json', JSON.stringify(seed.map((movie) => byId.get(movie.id) || movie), null, 2) + '\n');
  console.log(`Updated TMDB artwork, trailer references and TMDB scores for ${updates.length} catalogue movies. IMDb scores and catalogue IDs preserved.`);
} finally { await pool.end(); }
