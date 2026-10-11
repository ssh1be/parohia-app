-- Parish-level toggle for confession scheduling (default off).
-- Run in Supabase SQL editor (or via CLI) against the live database.

ALTER TABLE public.parishes
  ADD COLUMN IF NOT EXISTS confession_enabled boolean NOT NULL DEFAULT false;
