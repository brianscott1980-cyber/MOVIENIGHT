# Movie catalogue

The app reads catalogue movies from Supabase PostgreSQL through the server-only
`DATABASE_URL`. Before starting a fresh environment, run:

```sh
npm run db:migrate:movies
```

This transaction creates `public.movies` and imports all 52 original movies from
`data/movie-catalogue.seed.json`. Re-running it does not overwrite database edits.
It also sets defaults for new sessions to three votes and two movie suggestions
per person; existing session choices are preserved.

Each movie's `data` JSONB holds the complete Movie record, including IMDb score,
age certification, genre, cast, synopsis, streaming provider IDs, artwork URLs,
and YouTube trailer ID. Generated columns expose title, genre, age rating, IMDb
rating and streaming sources for database filtering. Images remain remote URLs;
trailer IDs link to YouTube. Session-specific custom movies remain in the existing
`custom_movies` database table and are combined with the catalogue in API responses.

Provider assignments in the original catalogue were generated placeholders.
They have been preserved exactly, not verified against current regional streaming
availability. Replace these values with verified provider data when available.

The seed is migration input only. Runtime views no longer fall back to bundled
movie data. Edit the database to update the catalogue. The historical metadata
scripts that generated `moviesData.ts` are not part of this workflow.

Filter regression checks (Node 22+):

```sh
node --experimental-strip-types --test tests/movie-filters.test.mjs
```

## TMDB lookup

Set `TMDB_READ_ACCESS_TOKEN` (preferred) or `TMDB_API_KEY` in `.env.local`
and in your deployment's server environment. Never use a `NEXT_PUBLIC_` prefix.
`TMDB_REGION` defaults to `GB` for certifications and subscription providers.

Add Movie opens debounced TMDB search by default. Selecting a result loads movie
metadata, TMDB artwork, and a YouTube trailer reference. Manual entry remains
available as a fallback. TMDB scores are stored separately from IMDb scores.
Session movie TMDB identifiers and provider attribution live in `custom_movies.metadata`.

Run `npm run db:refresh:tmdb` (Node 22+) to refresh catalogue artwork and TMDB scores
and apply the custom movie metadata migration. Catalogue IDs and IMDb scores are
preserved. Existing catalogue streaming assignments remain unchanged.

Explicitly added movies remain selectable and selected outside setup filters.
A warning on the poster identifies which source, genre or age-rating filters do
not match; changing filters does not silently remove these movies from the ballot.
