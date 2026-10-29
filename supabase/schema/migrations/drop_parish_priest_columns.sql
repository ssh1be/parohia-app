-- Drops the single-priest columns now that clergy live in public.parish_clergy.
-- Run after add_parish_clergy.sql, and only once every shipped app build reads parish_clergy:
-- older builds name these columns in their parish queries and will fail to load the parish.

ALTER TABLE public.parishes
  DROP COLUMN IF EXISTS priest_name,
  DROP COLUMN IF EXISTS priest_phone_number,
  DROP COLUMN IF EXISTS priest_email;
