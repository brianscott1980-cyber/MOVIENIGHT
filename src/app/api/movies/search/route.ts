import { NextResponse } from 'next/server';
import { getTmdbMovie, searchTmdbMovies, TmdbError } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('tmdbId');
    if (id !== null) {
      if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
        return NextResponse.json({ error: 'Invalid movie ID.' }, { status: 400 });
      }
      return NextResponse.json({ movie: await getTmdbMovie(Number(id)) });
    }
    const query = (searchParams.get('q') || '').trim();
    if (query.length < 2) return NextResponse.json({ results: [] });
    if (query.length > 200) return NextResponse.json({ error: 'Search title is too long.' }, { status: 400 });
    return NextResponse.json({ results: await searchTmdbMovies(query) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof TmdbError ? error.message : 'Movie lookup failed. Please try again or use manual entry.' },
      { status: error instanceof TmdbError ? error.status : 502 });
  }
}
