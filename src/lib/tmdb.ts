// Server-side TMDB client. Never import this module into a client component.
import type { CustomMovieInput } from '../types/index';

export interface TmdbSearchResult {
  tmdbId: number;
  title: string;
  year: number | null;
  posterUrl: string;
  overview: string;
}
interface SearchMovie {
  id: number; title: string; release_date?: string; poster_path: string | null; overview: string;
}
interface MovieDetails extends SearchMovie {
  backdrop_path: string | null; imdb_id: string | null; runtime: number | null;
  vote_average: number; tagline: string; genres: { id: number; name: string }[];
  credits?: {
    cast: { name: string; character?: string; profile_path?: string | null }[];
    crew: { name: string; job: string }[];
  };
  videos?: { results: { site: string; type: string; key: string; official: boolean }[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] };
  'watch/providers'?: { results: Record<string, { link: string; flatrate?: { provider_id: number; provider_name: string }[] }> };
}
export class TmdbError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export async function tmdbRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const key = process.env.TMDB_API_KEY;
  if (!token && !key) throw new TmdbError('Movie search is not configured. You can add a movie manually.', 503);
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries({ language: 'en-GB', ...params }).forEach(([name, value]) => url.searchParams.set(name, value));
  if (!token) url.searchParams.set('api_key', key!);
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new TmdbError(response.status === 404 ? 'Movie not found.' : 'TMDB is unavailable. Please try again or use manual entry.', response.status === 404 ? 404 : 502);
  return response.json();
}
export function tmdbImage(path: string | null | undefined, size: 'w185' | 'w500' | 'w1280' = 'w500'): string {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}
export async function searchTmdbMovies(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbRequest<{ results: SearchMovie[] }>('search/movie', { query, include_adult: 'false' });
  return data.results.slice(0, 10).map((movie) => ({ tmdbId: movie.id, title: movie.title,
    year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
    posterUrl: tmdbImage(movie.poster_path, 'w185'), overview: movie.overview }));
}
export function mapTmdbMovie(movie: MovieDetails, region = 'GB'): CustomMovieInput {
  const ids = new Set(movie.genres.map((genre) => genre.id));
  const genre = ids.has(878) ? 'sci-fi' : ids.has(27) ? 'horror-creature' : ids.has(10751) || ids.has(16) ? 'adventure-family'
    : ids.has(14) || ids.has(12) ? 'epic-adventure' : ids.has(28) || ids.has(53) || ids.has(80) ? 'action-thriller'
    : ids.has(35) || ids.has(10749) ? 'comedy-cult' : 'drama-coming-of-age';
  const releases = movie.release_dates?.results || [];
  const certification = [region, 'US'].flatMap((country) => releases.find((r) => r.iso_3166_1 === country)?.release_dates || [])
    .find((release) => release.certification)?.certification || '';
  const trailers = (movie.videos?.results || []).filter((video) => video.site === 'YouTube' && video.type === 'Trailer');
  const trailer = trailers.find((video) => video.official) || trailers[0];
  const availability = movie['watch/providers']?.results[region];
  const providerIds: Record<number, string> = { 8: 'netflix', 1796: 'netflix', 9: 'prime', 119: 'prime', 2100: 'prime', 350: 'apple', 337: 'disney', 1899: 'max', 384: 'max', 538: 'plex' };
  
  const rawCast = movie.credits?.cast || [];
  const cast = rawCast.slice(0, 10).map((person) => person.name);
  const castMembers = rawCast.slice(0, 10).map((person) => ({
    name: person.name,
    character: person.character || undefined,
    profileUrl: person.profile_path ? tmdbImage(person.profile_path, 'w185') : undefined,
  }));

  return {
    tmdbId: movie.id, tmdbRating: movie.vote_average, title: movie.title,
    year: Number(movie.release_date?.slice(0, 4)) || 0,
    imdbUrl: movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}/` : '',
    genre, genres: [genre], director: movie.credits?.crew.filter((person) => person.job === 'Director').map((person) => person.name).join(', ') || '',
    cast,
    castMembers,
    synopsis: movie.overview, runtime: movie.runtime || '', rated: certification,
    posterUrl: tmdbImage(movie.poster_path), backdropUrl: tmdbImage(movie.backdrop_path, 'w1280'),
    tagline: movie.tagline, youtubeTrailerId: trailer?.key || '',
    streamingSources: [...new Set((availability?.flatrate || []).map((provider) => providerIds[provider.provider_id]).filter(Boolean))],
    watchProvidersUrl: availability?.link, watchRegion: region,
  };
}
export async function getTmdbMovie(id: number): Promise<CustomMovieInput> {
  const movie = await tmdbRequest<MovieDetails>(`movie/${id}`, { append_to_response: 'credits,videos,release_dates,watch/providers' });
  return mapTmdbMovie(movie, process.env.TMDB_REGION || 'GB');
}
