import { NextResponse } from 'next/server';
import { GENRE_INFO, DEFAULT_VOTERS } from '@/data/moviesData';

import { getCatalogueMovies } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    movies: await getCatalogueMovies(),
    genres: GENRE_INFO,
    voters: DEFAULT_VOTERS,
  });
}

