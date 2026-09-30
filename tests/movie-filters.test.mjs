import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesMovieCriteria, normalizeMovieSource } from '../src/lib/movieFilters.ts';

const movie = { genre: 'sci-fi', rated: 'PG-13', streamingSources: ['netflix', 'Prime Video'] };
test('sources accept stored IDs and legacy display names', () => {
  assert.equal(normalizeMovieSource('Max / HBO'), 'max');
  assert.equal(matchesMovieCriteria(movie, ['Netflix'], [], 'ALL'), true);
  assert.equal(matchesMovieCriteria(movie, ['prime'], [], 'ALL'), true);
  assert.equal(matchesMovieCriteria(movie, ['disney'], [], 'ALL'), false);
});
test('source, genre and age limit apply together', () => {
  assert.equal(matchesMovieCriteria(movie, ['netflix'], ['sci-fi'], '12/PG-13'), true);
  assert.equal(matchesMovieCriteria(movie, ['netflix'], ['comedy-cult'], 'ALL'), false);
  assert.equal(matchesMovieCriteria(movie, ['netflix'], ['sci-fi'], 'PG'), false);
  assert.equal(matchesMovieCriteria(movie, [], [], 'ALL'), true);
});
test('unknown ratings and sources do not bypass restrictive criteria', () => {
  assert.equal(matchesMovieCriteria({ ...movie, rated: undefined }, [], [], 'PG'), false);
  assert.equal(matchesMovieCriteria({ ...movie, rated: 'N/A' }, [], [], '18/NC-17'), false);
  assert.equal(matchesMovieCriteria({ ...movie, streamingSources: [] }, ['plex'], [], 'ALL'), false);
  assert.equal(matchesMovieCriteria({ ...movie, rated: 'G' }, [], [], 'U / G'), true);
});

test('setup preserves explicitly added movies outside all filter rules', async () => {
  const { getSetupMovieChoices, getMovieCriteriaWarnings } = await import('../src/lib/movieFilters.ts');
  const added = { ...movie, id: 'custom', isCustom: true };
  const catalogue = { ...movie, id: 'catalogue' };
  const choices = getSetupMovieChoices([added, catalogue], ['disney'], ['comedy-cult'], 'PG');
  assert.deepEqual(choices.map((m) => m.id), ['custom']);
  assert.deepEqual(getMovieCriteriaWarnings(added, ['disney'], ['comedy-cult'], 'PG'), ['source', 'genre', 'age rating']);
  assert.deepEqual(getMovieCriteriaWarnings(added, ['netflix'], ['sci-fi'], '12/PG-13'), []);
  assert.equal(getSetupMovieChoices([added, catalogue], [], [], 'ALL').length, 2);
});
