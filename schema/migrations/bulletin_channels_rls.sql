-- RLS for bulletin channels + subscriptions.
-- Run after add_bulletin_channels.sql.
-- Style matches existing bulletin_events_* policies (TO public).

-- ---------------------------------------------------------------------------
-- bulletin_channels
-- ---------------------------------------------------------------------------
ALTER TABLE public.bulletin_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bulletin_channels_select_by_parish_members_or_admin" ON public.bulletin_channels;
CREATE POLICY "bulletin_channels_select_by_parish_members_or_admin"
ON public.bulletin_channels
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_channels.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR (
    bulletin_channels.is_archived = false
    AND EXISTS (
      SELECT 1
      FROM public.user_parish_connections upc
      WHERE upc.parish_id = bulletin_channels.parish_id
        AND upc.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "bulletin_channels_insert_by_parish_admin" ON public.bulletin_channels;
CREATE POLICY "bulletin_channels_insert_by_parish_admin"
ON public.bulletin_channels
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_channels.parish_id
      AND p.admin_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "bulletin_channels_update_by_parish_admin" ON public.bulletin_channels;
CREATE POLICY "bulletin_channels_update_by_parish_admin"
ON public.bulletin_channels
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_channels.parish_id
      AND p.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Do not query bulletin_channels here — that causes infinite RLS recursion.
  -- General-channel protections live in the app + can use a DB trigger if needed.
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_channels.parish_id
      AND p.admin_user_id = auth.uid()
  )
);

-- Soft-archive only; no hard deletes from the client
DROP POLICY IF EXISTS "bulletin_channels_delete_by_parish_admin" ON public.bulletin_channels;
CREATE POLICY "bulletin_channels_delete_by_parish_admin"
ON public.bulletin_channels
FOR DELETE
TO public
USING (
  bulletin_channels.is_default = false
  AND EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_channels.parish_id
      AND p.admin_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- bulletin_channel_subscriptions
-- ---------------------------------------------------------------------------
ALTER TABLE public.bulletin_channel_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bulletin_channel_subscriptions_select_own_or_admin" ON public.bulletin_channel_subscriptions;
CREATE POLICY "bulletin_channel_subscriptions_select_own_or_admin"
ON public.bulletin_channel_subscriptions
FOR SELECT
TO public
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    JOIN public.parishes p ON p.id = c.parish_id
    WHERE c.id = bulletin_channel_subscriptions.channel_id
      AND p.admin_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "bulletin_channel_subscriptions_insert_own_in_parish" ON public.bulletin_channel_subscriptions;
CREATE POLICY "bulletin_channel_subscriptions_insert_own_in_parish"
ON public.bulletin_channel_subscriptions
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    WHERE c.id = bulletin_channel_subscriptions.channel_id
      AND c.is_archived = false
      AND (
        EXISTS (
          SELECT 1
          FROM public.user_parish_connections upc
          WHERE upc.parish_id = c.parish_id
            AND upc.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.parishes p
          WHERE p.id = c.parish_id
            AND p.admin_user_id = auth.uid()
        )
      )
  )
);

DROP POLICY IF EXISTS "bulletin_channel_subscriptions_delete_own_non_default" ON public.bulletin_channel_subscriptions;
CREATE POLICY "bulletin_channel_subscriptions_delete_own_non_default"
ON public.bulletin_channel_subscriptions
FOR DELETE
TO public
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    WHERE c.id = bulletin_channel_subscriptions.channel_id
      AND c.is_default = false
  )
);

-- ---------------------------------------------------------------------------
-- Optional: tighten bulletin_events SELECT so parishioners only see
-- posts in channels they subscribe to (admins still see all).
-- Only run if you want RLS to enforce feed filtering (app already filters).
-- ---------------------------------------------------------------------------
-- DROP POLICY IF EXISTS "bulletin_events_select_by_parish_members_or_admin" ON public.bulletin_events;
-- CREATE POLICY "bulletin_events_select_by_parish_members_or_admin"
-- ON public.bulletin_events
-- FOR SELECT
-- TO public
-- USING (
--   created_by = auth.uid()
--   OR EXISTS (
--     SELECT 1
--     FROM public.parishes p
--     WHERE p.id = bulletin_events.parish_id
--       AND p.admin_user_id = auth.uid()
--   )
--   OR EXISTS (
--     SELECT 1
--     FROM public.bulletin_channel_subscriptions s
--     JOIN public.bulletin_channels c ON c.id = s.channel_id
--     WHERE s.channel_id = bulletin_events.channel_id
--       AND s.user_id = auth.uid()
--       AND c.is_archived = false
--   )
-- );
