import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTmdbMovie, tmdbImage, searchTmdbMovies } from '../src/lib/tmdb.ts';
const movie = {
  id: 11, title: 'Example', release_date: '2020-01-01', poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg',
  imdb_id: 'tt1234567', runtime: 123, vote_average: 8.4, tagline: 'Tagline', overview: 'Plot', genres: [{ id: 878, name: 'Science Fiction' }],
  credits: { cast: [{ name: 'Actor' }], crew: [{ name: 'Director', job: 'Director' }] },
  videos: { results: [{ site: 'YouTube', type: 'Trailer', key: 'official123', official: true }] },
  release_dates: { results: [{ iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] }, { iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] }] },
  'watch/providers': { results: { GB: { link: 'https://www.themoviedb.org/movie/11/watch', flatrate: [{ provider_id: 8, provider_name: 'Netflix' }] }, US: { flatrate: [{ provider_id: 9, provider_name: 'Amazon' }] } } },
};
test('TMDB details retain source identity, mapped genres, regional certification, media and providers', () => {
  const result = mapTmdbMovie(movie);
  assert.equal(result.tmdbId, 11); assert.equal(result.tmdbRating, 8.4); assert.equal(result.imdbRating, undefined);
  assert.equal(result.genre, 'sci-fi'); assert.equal(result.rated, '12A'); assert.deepEqual(result.streamingSources, ['netflix']);
  assert.equal(result.posterUrl, 'https://image.tmdb.org/t/p/w500/poster.jpg');
  assert.equal(result.backdropUrl, 'https://image.tmdb.org/t/p/w1280/backdrop.jpg');
  assert.equal(result.youtubeTrailerId, 'official123'); assert.equal(result.director, 'Director');
});
test('missing media and certification stay unknown instead of fabricated defaults', () => {
  const result = mapTmdbMovie({ ...movie, poster_path: null, backdrop_path: null, release_dates: undefined, videos: undefined, 'watch/providers': undefined });
  assert.equal(result.posterUrl, ''); assert.equal(result.rated, ''); assert.equal(result.youtubeTrailerId, '');
  assert.deepEqual(result.streamingSources, []); assert.equal(tmdbImage(null), '');
});
test('search uses server bearer authentication and does not return credentials', async (t) => {
  const original = process.env.TMDB_READ_ACCESS_TOKEN;
  process.env.TMDB_READ_ACCESS_TOKEN = 'test-token';
  t.after(() => { if (original === undefined) delete process.env.TMDB_READ_ACCESS_TOKEN; else process.env.TMDB_READ_ACCESS_TOKEN = original; });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://api.themoviedb.org'); assert.equal(url.searchParams.get('query'), 'Example');
    assert.equal(options.headers.Authorization, 'Bearer test-token'); assert.equal(url.searchParams.has('api_key'), false);
    return new Response(JSON.stringify({ results: [movie] }));
  });
  const results = await searchTmdbMovies('Example');
  assert.equal(results[0].tmdbId, 11); assert.equal(JSON.stringify(results).includes('test-token'), false);
});
