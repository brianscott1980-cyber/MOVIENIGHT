import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
const client = await pool.connect();
try {
  const movies = JSON.parse(await readFile('data/movie-catalogue.seed.json', 'utf8'));
  await client.query('BEGIN');
  await client.query(await readFile('supabase/migrations/202609290001_movie_catalogue.sql', 'utf8'));
  await client.query(await readFile('supabase/migrations/202609300001_participant_movie_defaults.sql', 'utf8'));
  for (const movie of movies) {
    // Re-running the migration preserves any subsequent catalogue edits.
    await client.query('INSERT INTO public.movies (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', [movie.id, JSON.stringify(movie)]);
  }
  const result = await client.query('SELECT id, data FROM public.movies WHERE id = ANY($1::text[])', [movies.map((movie) => movie.id)]);
  if (result.rowCount !== movies.length) throw new Error('Catalogue verification failed');
  await client.query('COMMIT');
  console.log(`Verified ${result.rowCount} migrated movies, including ratings, sources, artwork and trailer links. Existing custom movies remain in their database table.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
