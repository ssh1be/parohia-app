-- Chant system channel (opt-in) + chant signups for parish calendar services.
-- Run in Supabase SQL editor (or via CLI) against the live database.

-- 1. Flag on bulletin_channels
ALTER TABLE public.bulletin_channels
  ADD COLUMN IF NOT EXISTS is_chant boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS bulletin_channels_one_chant_per_parish
  ON public.bulletin_channels (parish_id)
  WHERE is_chant = true AND is_archived = false;

-- Soft-archive: also block hard-delete of Chant (matches General protection style)
DROP POLICY IF EXISTS "bulletin_channels_delete_by_parish_admin" ON public.bulletin_channels;
CREATE POLICY "bulletin_channels_delete_by_parish_admin"
ON public.bulletin_channels
FOR DELETE
TO public
USING (
  bulletin_channels.is_default = false
  AND bulletin_channels.is_chant = false
  AND EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_channels.parish_id
      AND p.admin_user_id = auth.uid()
  )
);

-- 2. Backfill Chant for existing parishes
INSERT INTO public.bulletin_channels (parish_id, name, description, is_default, is_chant, created_by)
SELECT
  p.id,
  'Chant',
  'Opt-in channel for service chanting',
  false,
  true,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = p.admin_user_id)
    THEN p.admin_user_id
    ELSE NULL
  END
FROM public.parishes p
WHERE NOT EXISTS (
  SELECT 1 FROM public.bulletin_channels c
  WHERE c.parish_id = p.id AND c.is_chant = true AND c.is_archived = false
);

-- 3. New parish → also create Chant (extend General trigger function)
CREATE OR REPLACE FUNCTION public.create_default_bulletin_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_id uuid;
BEGIN
  creator_id := CASE
    WHEN NEW.admin_user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = NEW.admin_user_id)
    THEN NEW.admin_user_id
    ELSE NULL
  END;

  IF NOT EXISTS (
    SELECT 1 FROM public.bulletin_channels WHERE parish_id = NEW.id AND is_default = true
  ) THEN
    INSERT INTO public.bulletin_channels (parish_id, name, description, is_default, is_chant, created_by)
    VALUES (NEW.id, 'General', 'Default parish channel', true, false, creator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.bulletin_channels
    WHERE parish_id = NEW.id AND is_chant = true AND is_archived = false
  ) THEN
    INSERT INTO public.bulletin_channels (parish_id, name, description, is_default, is_chant, created_by)
    VALUES (NEW.id, 'Chant', 'Opt-in channel for service chanting', false, true, creator_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Chant signups for Google Calendar parish events
CREATE TABLE IF NOT EXISTS public.chant_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
  calendar_event_id text NOT NULL,
  event_title text,
  event_start timestamp with time zone,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chant_signups_pkey PRIMARY KEY (id),
  CONSTRAINT chant_signups_unique UNIQUE (parish_id, calendar_event_id, user_id)
);

CREATE INDEX IF NOT EXISTS chant_signups_parish_event_idx
  ON public.chant_signups (parish_id, calendar_event_id);

CREATE INDEX IF NOT EXISTS chant_signups_user_idx
  ON public.chant_signups (user_id);

ALTER TABLE public.chant_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chant_signups_select_parish_members_or_admin" ON public.chant_signups;
CREATE POLICY "chant_signups_select_parish_members_or_admin"
ON public.chant_signups
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = chant_signups.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_parish_connections upc
    WHERE upc.parish_id = chant_signups.parish_id
      AND upc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "chant_signups_insert_own_in_parish" ON public.chant_signups;
CREATE POLICY "chant_signups_insert_own_in_parish"
ON public.chant_signups
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1
      FROM public.parishes p
      WHERE p.id = chant_signups.parish_id
        AND p.admin_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_parish_connections upc
      WHERE upc.parish_id = chant_signups.parish_id
        AND upc.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "chant_signups_delete_own" ON public.chant_signups;
CREATE POLICY "chant_signups_delete_own"
ON public.chant_signups
FOR DELETE
TO public
USING (user_id = auth.uid());
