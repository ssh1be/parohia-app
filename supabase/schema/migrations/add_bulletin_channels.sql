-- Bulletin channels: parish-scoped channels, subscriptions, and post targeting.
-- Run in Supabase SQL editor (or via CLI) against the live database.

-- 1. Channels
CREATE TABLE IF NOT EXISTS public.bulletin_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_channels_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_channels_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS bulletin_channels_parish_name_unique
  ON public.bulletin_channels (parish_id, lower(name))
  WHERE is_archived = false;

CREATE UNIQUE INDEX IF NOT EXISTS bulletin_channels_one_default_per_parish
  ON public.bulletin_channels (parish_id)
  WHERE is_default = true;

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS public.bulletin_channel_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.bulletin_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_channel_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_channel_subscriptions_unique UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS bulletin_channel_subscriptions_user_idx
  ON public.bulletin_channel_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS bulletin_channel_subscriptions_channel_idx
  ON public.bulletin_channel_subscriptions (channel_id);

-- 3. Backfill General for existing parishes
INSERT INTO public.bulletin_channels (parish_id, name, description, is_default, created_by)
SELECT
  p.id,
  'General',
  'Default parish channel',
  true,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = p.admin_user_id)
    THEN p.admin_user_id
    ELSE NULL
  END
FROM public.parishes p
WHERE NOT EXISTS (
  SELECT 1 FROM public.bulletin_channels c
  WHERE c.parish_id = p.id AND c.is_default = true
);

-- 4. Add channel_id to bulletin_events
ALTER TABLE public.bulletin_events
  ADD COLUMN IF NOT EXISTS channel_id uuid;

UPDATE public.bulletin_events be
SET channel_id = c.id
FROM public.bulletin_channels c
WHERE be.channel_id IS NULL
  AND c.parish_id = be.parish_id
  AND c.is_default = true;

ALTER TABLE public.bulletin_events
  ALTER COLUMN channel_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bulletin_events_channel_id_fkey'
  ) THEN
    ALTER TABLE public.bulletin_events
      ADD CONSTRAINT bulletin_events_channel_id_fkey
      FOREIGN KEY (channel_id) REFERENCES public.bulletin_channels(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS bulletin_events_channel_id_idx
  ON public.bulletin_events (channel_id);

-- 5. Subscribe existing parishioners to General
INSERT INTO public.bulletin_channel_subscriptions (channel_id, user_id)
SELECT c.id, upc.user_id
FROM public.user_parish_connections upc
JOIN public.bulletin_channels c
  ON c.parish_id = upc.parish_id AND c.is_default = true
WHERE upc.user_id IS NOT NULL
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- 6. Triggers: new parish → General channel
CREATE OR REPLACE FUNCTION public.create_default_bulletin_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bulletin_channels WHERE parish_id = NEW.id AND is_default = true
  ) THEN
    INSERT INTO public.bulletin_channels (parish_id, name, description, is_default, created_by)
    VALUES (
      NEW.id,
      'General',
      'Default parish channel',
      true,
      CASE
        WHEN NEW.admin_user_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = NEW.admin_user_id)
        THEN NEW.admin_user_id
        ELSE NULL
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_parishes_create_general_channel ON public.parishes;
CREATE TRIGGER trg_parishes_create_general_channel
  AFTER INSERT ON public.parishes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_bulletin_channel();

-- 7. Triggers: join parish → subscribe to General; leave → drop parish channel subs
CREATE OR REPLACE FUNCTION public.subscribe_user_to_default_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_channel_id uuid;
BEGIN
  IF NEW.user_id IS NULL OR NEW.parish_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO default_channel_id
  FROM public.bulletin_channels
  WHERE parish_id = NEW.parish_id AND is_default = true
  LIMIT 1;

  IF default_channel_id IS NOT NULL THEN
    INSERT INTO public.bulletin_channel_subscriptions (channel_id, user_id)
    VALUES (default_channel_id, NEW.user_id)
    ON CONFLICT (channel_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_upc_subscribe_general ON public.user_parish_connections;
CREATE TRIGGER trg_upc_subscribe_general
  AFTER INSERT ON public.user_parish_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.subscribe_user_to_default_channel();

CREATE OR REPLACE FUNCTION public.cleanup_channel_subs_on_parish_leave()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id IS NULL OR OLD.parish_id IS NULL THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.bulletin_channel_subscriptions bcs
  USING public.bulletin_channels bc
  WHERE bcs.channel_id = bc.id
    AND bcs.user_id = OLD.user_id
    AND bc.parish_id = OLD.parish_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_upc_cleanup_channel_subs ON public.user_parish_connections;
CREATE TRIGGER trg_upc_cleanup_channel_subs
  AFTER DELETE ON public.user_parish_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_channel_subs_on_parish_leave();
