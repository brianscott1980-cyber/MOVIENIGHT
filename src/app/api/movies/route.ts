import { NextResponse } from 'next/server';
import { MOVIES_DATA, GENRE_INFO, DEFAULT_VOTERS } from '@/data/moviesData';

export async function GET() {
  return NextResponse.json({
    movies: MOVIES_DATA,
    genres: GENRE_INFO,
    voters: DEFAULT_VOTERS,
  });
}

