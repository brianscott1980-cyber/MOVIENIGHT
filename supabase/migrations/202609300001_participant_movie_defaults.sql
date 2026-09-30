-- ADD COLUMN IF NOT EXISTS does not update defaults on existing columns.
-- Both values are needed to select Limited / 2 max in new session setups.
DO $$ BEGIN
  IF to_regclass('public.sessions') IS NOT NULL THEN
    ALTER TABLE public.sessions ALTER COLUMN movie_addition_mode SET DEFAULT 'voter_suggestions';
    ALTER TABLE public.sessions ALTER COLUMN max_suggestions_per_voter SET DEFAULT 2;
  END IF;
END $$;
