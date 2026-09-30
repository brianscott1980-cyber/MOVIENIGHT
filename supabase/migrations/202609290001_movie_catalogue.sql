-- Full display metadata lives in JSONB; generated columns support catalogue queries.
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  title TEXT GENERATED ALWAYS AS (data->>'title') STORED,
  genre TEXT GENERATED ALWAYS AS (data->>'genre') STORED,
  age_rating TEXT GENERATED ALWAYS AS (data->>'rated') STORED,
  imdb_rating NUMERIC GENERATED ALWAYS AS ((data->>'imdbRating')::numeric) STORED,
  streaming_sources JSONB GENERATED ALWAYS AS (data->'streamingSources') STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS movies_genre_idx ON public.movies (genre);
CREATE INDEX IF NOT EXISTS movies_sources_idx ON public.movies USING gin (streaming_sources);
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
-- Access is through the server's PostgreSQL connection, not the browser anon client.
DO $$ BEGIN
  IF to_regclass('public.sessions') IS NOT NULL THEN
    ALTER TABLE public.sessions ALTER COLUMN max_votes_per_voter SET DEFAULT 3;
    ALTER TABLE public.sessions ALTER COLUMN max_suggestions_per_voter SET DEFAULT 2;
  END IF;
END $$;
