import { Pool } from 'pg';

const token = process.env.TMDB_READ_ACCESS_TOKEN;
const apiKey = process.env.TMDB_API_KEY;

if (!token && !apiKey) {
  console.error('TMDB credentials missing.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function tmdbFetch(urlStr: string) {
  const url = new URL(urlStr);
  if (!token && apiKey) {
    url.searchParams.set('api_key', apiKey);
  }
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

function tmdbImage(path: string | null | undefined): string | undefined {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : undefined;
}

interface CastMember {
  name: string;
  character?: string;
  profileUrl?: string;
}

async function findCastForMovie(title: string, year?: number, tmdbId?: number): Promise<CastMember[]> {
  try {
    let credits: any[] | null = null;
    if (tmdbId) {
      const data = await tmdbFetch(`https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=credits`);
      if (data?.credits?.cast) {
        credits = data.credits.cast;
      }
    }

    if (!credits || credits.length === 0) {
      const searchUrl = new URL('https://api.themoviedb.org/3/search/movie');
      searchUrl.searchParams.set('query', title);
      if (year) searchUrl.searchParams.set('year', String(year));
      const sData = await tmdbFetch(searchUrl.toString());
      if (sData?.results && sData.results.length > 0) {
        const match = sData.results[0];
        const cData = await tmdbFetch(`https://api.themoviedb.org/3/movie/${match.id}/credits`);
        if (cData?.cast) {
          credits = cData.cast;
        }
      }
    }

    if (!credits) return [];
    return credits.slice(0, 10).map((c: any) => ({
      name: c.name,
      character: c.character || undefined,
      profileUrl: tmdbImage(c.profile_path),
    }));
  } catch (err) {
    console.error(`Error looking up cast for ${title}:`, err);
    return [];
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retroBackfillCastAvatars() {
  console.log('--- Starting Retro Cast Avatars Backfill ---');

  // 1. Backfill custom_movies
  const customRes = await pool.query('SELECT id, title, year, metadata FROM custom_movies');
  console.log(`Found ${customRes.rows.length} custom_movies to check.`);
  let customUpdated = 0;

  for (const row of customRes.rows) {
    const meta = row.metadata || {};
    if (!meta.castMembers || meta.castMembers.length === 0 || !meta.castMembers.some((c: any) => c.profileUrl)) {
      const cast = await findCastForMovie(row.title, row.year, meta.tmdbId);
      if (cast.length > 0) {
        meta.castMembers = cast;
        await pool.query('UPDATE custom_movies SET metadata = $1 WHERE id = $2', [JSON.stringify(meta), row.id]);
        customUpdated++;
        console.log(`[custom_movies] Updated ${row.title} with ${cast.length} cast members (${cast.filter(c => c.profileUrl).length} avatars).`);
      }
      await sleep(100);
    }
  }

  // 2. Backfill public.movies (catalogue)
  const catalogueRes = await pool.query('SELECT id, data FROM public.movies');
  console.log(`Found ${catalogueRes.rows.length} public.movies to check.`);
  let catalogueUpdated = 0;

  for (const row of catalogueRes.rows) {
    const movie = row.data || {};
    if (!movie.castMembers || movie.castMembers.length === 0 || !movie.castMembers.some((c: any) => c.profileUrl)) {
      const cast = await findCastForMovie(movie.title, movie.year, movie.tmdbId);
      if (cast.length > 0) {
        movie.castMembers = cast;
        await pool.query('UPDATE public.movies SET data = $1::jsonb WHERE id = $2', [JSON.stringify(movie), row.id]);
        catalogueUpdated++;
        console.log(`[public.movies] Updated ${movie.title} with ${cast.length} cast members (${cast.filter(c => c.profileUrl).length} avatars).`);
      }
      await sleep(100);
    }
  }

  console.log(`--- Finished Backfill! Updated ${customUpdated} custom movies and ${catalogueUpdated} catalogue movies. ---`);
  await pool.end();
}

if (process.argv[1]?.endsWith('retroBackfillCast.ts')) {
  retroBackfillCastAvatars().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
