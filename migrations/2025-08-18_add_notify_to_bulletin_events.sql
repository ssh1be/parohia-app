-- Migration: Add notify column to bulletin_events
-- Created: 2025-08-18

BEGIN;

-- 1) Add column with default for future inserts
ALTER TABLE public.bulletin_events
ADD COLUMN IF NOT EXISTS notify boolean DEFAULT false;

-- 2) Backfill existing rows to false to avoid NULLs
UPDATE public.bulletin_events
SET notify = false
WHERE notify IS NULL;

COMMIT;

-- Down migration (for reference only; do not run as part of this file)
-- BEGIN;
-- ALTER TABLE public.bulletin_events DROP COLUMN IF EXISTS notify;
-- COMMIT;


