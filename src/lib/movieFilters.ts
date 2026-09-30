import type { Movie } from '../types/index';

const sourceAliases: Record<string, string> = {
  netflix: 'netflix', 'prime video': 'prime', prime: 'prime',
  'apple tv+': 'apple', apple: 'apple', 'disney+': 'disney', disney: 'disney',
  max: 'max', 'max / hbo': 'max', 'hbo max': 'max', plex: 'plex', 'plex library': 'plex',
};

export function normalizeMovieSource(source: string): string {
  return sourceAliases[source.trim().toLowerCase()] || source.trim().toLowerCase();
}

const ratingTiers: Record<string, number> = {
  G: 1, U: 1, 'TV-G': 1, 'TV-Y': 1, 'U/G': 1,
  PG: 2, 'TV-PG': 2,
  '12': 3, '12A': 3, 'PG-13': 3, 'TV-14': 3, '12/PG-13': 3, '12/12A/PG-13': 3,
  '15': 4, R: 4, 'TV-MA': 4, '15/R': 4,
  '18': 5, 'NC-17': 5, '18/NC-17': 5,
};

export function matchesMovieCriteria(movie: Movie, sources: string[], genres: string[], rating: string): boolean {
  if (sources.length && !(movie.streamingSources || []).some((source) => sources.map(normalizeMovieSource).includes(normalizeMovieSource(source)))) return false;
  if (genres.length && !genres.includes(movie.genre)) return false;
  if (rating !== 'ALL') {
    const maximum = ratingTiers[rating.toUpperCase().replace(/\s/g, '')];
    const actual = ratingTiers[(movie.rated || '').toUpperCase().replace(/\s/g, '')];
    if (!maximum || !actual || actual > maximum) return false;
  }
  return true;
}

/** Explicitly added movies remain choices even when the catalogue is filtered. */
export function getSetupMovieChoices(movies: Movie[], sources: string[], genres: string[], rating: string): Movie[] {
  const seenIds = new Set<string>();
  const results: Movie[] = [];
  for (const movie of movies) {
    if (seenIds.has(movie.id)) continue;
    if (movie.isCustom || matchesMovieCriteria(movie, sources, genres, rating)) {
      seenIds.add(movie.id);
      results.push(movie);
    }
  }
  return results;
}

export function getMovieCriteriaWarnings(movie: Movie, sources: string[], genres: string[], rating: string): string[] {
  const warnings: string[] = [];
  if (!matchesMovieCriteria(movie, sources, [], 'ALL')) warnings.push('source');
  if (!matchesMovieCriteria(movie, [], genres, 'ALL')) warnings.push('genre');
  if (!matchesMovieCriteria(movie, [], [], rating)) warnings.push('age rating');
  return warnings;
}
