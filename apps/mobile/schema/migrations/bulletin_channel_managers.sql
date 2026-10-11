-- Channel-scoped managers + bulletin_events write policies.
-- Run after bulletin_channels_rls.sql.

-- ---------------------------------------------------------------------------
-- bulletin_channel_managers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulletin_channel_managers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_channel_managers_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_channel_managers_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES public.bulletin_channels(id) ON DELETE CASCADE,
  CONSTRAINT bulletin_channel_managers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT bulletin_channel_managers_assigned_by_fkey
    FOREIGN KEY (assigned_by) REFERENCES public.user_profiles(id),
  CONSTRAINT bulletin_channel_managers_unique UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS bulletin_channel_managers_channel_id_idx
  ON public.bulletin_channel_managers (channel_id);
CREATE INDEX IF NOT EXISTS bulletin_channel_managers_user_id_idx
  ON public.bulletin_channel_managers (user_id);

ALTER TABLE public.bulletin_channel_managers ENABLE ROW LEVEL SECURITY;

-- Parish admin, self, or parish member of the channel's parish can read assignments
DROP POLICY IF EXISTS "bulletin_channel_managers_select_parish_or_self" ON public.bulletin_channel_managers;
CREATE POLICY "bulletin_channel_managers_select_parish_or_self"
ON public.bulletin_channel_managers
FOR SELECT
TO public
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    JOIN public.parishes p ON p.id = c.parish_id
    WHERE c.id = bulletin_channel_managers.channel_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    JOIN public.user_parish_connections upc ON upc.parish_id = c.parish_id
    WHERE c.id = bulletin_channel_managers.channel_id
      AND upc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "bulletin_channel_managers_insert_by_parish_admin" ON public.bulletin_channel_managers;
CREATE POLICY "bulletin_channel_managers_insert_by_parish_admin"
ON public.bulletin_channel_managers
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    JOIN public.parishes p ON p.id = c.parish_id
    WHERE c.id = bulletin_channel_managers.channel_id
      AND p.admin_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "bulletin_channel_managers_delete_by_parish_admin" ON public.bulletin_channel_managers;
CREATE POLICY "bulletin_channel_managers_delete_by_parish_admin"
ON public.bulletin_channel_managers
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    JOIN public.parishes p ON p.id = c.parish_id
    WHERE c.id = bulletin_channel_managers.channel_id
      AND p.admin_user_id = auth.uid()
  )
);

-- Allow parish admins to subscribe members (needed when assigning channel managers)
DROP POLICY IF EXISTS "bulletin_channel_subscriptions_insert_own_in_parish" ON public.bulletin_channel_subscriptions;
CREATE POLICY "bulletin_channel_subscriptions_insert_own_or_admin"
ON public.bulletin_channel_subscriptions
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    WHERE c.id = bulletin_channel_subscriptions.channel_id
      AND c.is_archived = false
      AND (
        (
          bulletin_channel_subscriptions.user_id = auth.uid()
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
        OR EXISTS (
          SELECT 1
          FROM public.parishes p
          WHERE p.id = c.parish_id
            AND p.admin_user_id = auth.uid()
        )
      )
  )
);

-- ---------------------------------------------------------------------------
-- bulletin_events write policies (versioned + extended for channel managers)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bulletin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bulletin_events_insert_by_admin_or_channel_manager" ON public.bulletin_events;
DROP POLICY IF EXISTS "bulletin_events_insert_by_parish_admin" ON public.bulletin_events;
CREATE POLICY "bulletin_events_insert_by_admin_or_channel_manager"
ON public.bulletin_events
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_events.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channel_managers m
    JOIN public.bulletin_channels c ON c.id = m.channel_id
    WHERE m.channel_id = bulletin_events.channel_id
      AND m.user_id = auth.uid()
      AND c.parish_id = bulletin_events.parish_id
      AND c.is_archived = false
  )
);

DROP POLICY IF EXISTS "bulletin_events_update_by_admin_or_channel_manager" ON public.bulletin_events;
DROP POLICY IF EXISTS "bulletin_events_update_by_parish_admin" ON public.bulletin_events;
DROP POLICY IF EXISTS "bulletin_events_update_own_or_admin" ON public.bulletin_events;
CREATE POLICY "bulletin_events_update_by_admin_or_channel_manager"
ON public.bulletin_events
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_events.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channel_managers m
    WHERE m.channel_id = bulletin_events.channel_id
      AND m.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_events.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channel_managers m
    JOIN public.bulletin_channels c ON c.id = m.channel_id
    WHERE m.channel_id = bulletin_events.channel_id
      AND m.user_id = auth.uid()
      AND c.parish_id = bulletin_events.parish_id
  )
);

DROP POLICY IF EXISTS "bulletin_events_delete_by_admin_or_channel_manager" ON public.bulletin_events;
DROP POLICY IF EXISTS "bulletin_events_delete_by_parish_admin" ON public.bulletin_events;
DROP POLICY IF EXISTS "bulletin_events_delete_own_or_admin" ON public.bulletin_events;
CREATE POLICY "bulletin_events_delete_by_admin_or_channel_manager"
ON public.bulletin_events
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_events.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_channel_managers m
    WHERE m.channel_id = bulletin_events.channel_id
      AND m.user_id = auth.uid()
  )
);
