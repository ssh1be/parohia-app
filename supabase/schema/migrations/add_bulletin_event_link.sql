-- Optional external URL on bulletin posts (all event types).
-- Run in Supabase SQL editor (or via CLI) against the live database.

ALTER TABLE public.bulletin_events
  ADD COLUMN IF NOT EXISTS link text;
