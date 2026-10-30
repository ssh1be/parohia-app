-- Pre-release RLS hardening.
-- Run in Supabase SQL editor (or via CLI) against the live database, after every earlier migration.
--
-- 1. user_profiles: no more world-readable rows. Users read their own row (existing
--    "Users can view own profile"), parish admins read their members. Members get
--    names only through get_parish_profile_names().
-- 2. confession_reservations: only the owner and the parish admin read rows (notes stay
--    private). Members see which slots are booked through get_booked_confession_slots().
-- 3. bulletin_events writes: the channel must belong to the post's parish, channel managers
--    must still be parish members, and authors can't be spoofed. Legacy creator-based
--    policies are dropped so former managers lose edit rights.
-- 4. Channel subscriptions/managers: admins can only add users who belong to their parish,
--    and leaving a parish removes manager assignments.
-- 5. Old confession data is cleaned up by a nightly pg_cron job instead of from clients.

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so they can read user_parish_connections, whose RLS
-- only exposes the caller's own row)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_parish_member(p_parish_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_parish_connections upc
    WHERE upc.parish_id = p_parish_id
      AND upc.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of_member(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parishes p
    JOIN public.user_parish_connections upc ON upc.parish_id = p.id
    WHERE p.admin_user_id = auth.uid()
      AND upc.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_parish_member(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_admin_of_member(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_parish_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_of_member(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;

DROP POLICY IF EXISTS "user_profiles_select_by_parish_admin" ON public.user_profiles;
CREATE POLICY "user_profiles_select_by_parish_admin"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_of_member(user_profiles.id));

-- Names (no contact details) of a parish's admin and members, for members of that parish.
CREATE OR REPLACE FUNCTION public.get_parish_profile_names(p_parish_id uuid, p_user_ids uuid[])
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id, up.full_name
  FROM public.user_profiles up
  JOIN public.parishes p ON p.id = p_parish_id
  WHERE p_parish_id <> '00000000-0000-0000-0000-000000000001'
    AND up.id = ANY (p_user_ids)
    AND (p.admin_user_id = auth.uid() OR public.is_parish_member(p_parish_id, auth.uid()))
    AND (up.id = p.admin_user_id OR public.is_parish_member(p_parish_id, up.id));
$$;

REVOKE ALL ON FUNCTION public.get_parish_profile_names(uuid, uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_parish_profile_names(uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- confession_reservations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "confession_reservations_select_by_owner_or_member_or_admin" ON public.confession_reservations;
DROP POLICY IF EXISTS "confession_reservations_select_by_owner_or_admin" ON public.confession_reservations;
CREATE POLICY "confession_reservations_select_by_owner_or_admin"
ON public.confession_reservations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.confession_schedules s
    JOIN public.parishes p ON p.id = s.parish_id
    WHERE s.id = confession_reservations.schedule_id
      AND p.admin_user_id = auth.uid()
  )
);

-- Booked slots for a parish; reservation_id is only revealed to its owner and the parish admin.
CREATE OR REPLACE FUNCTION public.get_booked_confession_slots(p_parish_id uuid, p_start date, p_end date)
RETURNS TABLE (schedule_id uuid, reservation_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.schedule_id,
    CASE WHEN r.user_id = auth.uid() OR p.admin_user_id = auth.uid() THEN r.id END
  FROM public.confession_reservations r
  JOIN public.confession_schedules s ON s.id = r.schedule_id
  JOIN public.parishes p ON p.id = s.parish_id
  WHERE s.parish_id = p_parish_id
    AND s.date BETWEEN p_start AND p_end
    AND r.status = 'confirmed'
    AND (p.admin_user_id = auth.uid() OR public.is_parish_member(p_parish_id, auth.uid()));
$$;

REVOKE ALL ON FUNCTION public.get_booked_confession_slots(uuid, date, date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_booked_confession_slots(uuid, date, date) TO authenticated;

-- ---------------------------------------------------------------------------
-- bulletin_events writes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "bulletin_events_update_by_creator_or_admin" ON public.bulletin_events;
DROP POLICY IF EXISTS "bulletin_events_delete_by_creator_or_admin" ON public.bulletin_events;

DROP POLICY IF EXISTS "bulletin_events_insert_by_admin_or_channel_manager" ON public.bulletin_events;
CREATE POLICY "bulletin_events_insert_by_admin_or_channel_manager"
ON public.bulletin_events
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    WHERE c.id = bulletin_events.channel_id
      AND c.parish_id = bulletin_events.parish_id
      AND c.is_archived = false
  )
  AND (
    EXISTS (
      SELECT 1
      FROM public.parishes p
      WHERE p.id = bulletin_events.parish_id
        AND p.admin_user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1
        FROM public.bulletin_channel_managers m
        WHERE m.channel_id = bulletin_events.channel_id
          AND m.user_id = auth.uid()
      )
      AND public.is_parish_member(bulletin_events.parish_id, auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "bulletin_events_update_by_admin_or_channel_manager" ON public.bulletin_events;
CREATE POLICY "bulletin_events_update_by_admin_or_channel_manager"
ON public.bulletin_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_events.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR (
    EXISTS (
      SELECT 1
      FROM public.bulletin_channel_managers m
      WHERE m.channel_id = bulletin_events.channel_id
        AND m.user_id = auth.uid()
    )
    AND public.is_parish_member(bulletin_events.parish_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    WHERE c.id = bulletin_events.channel_id
      AND c.parish_id = bulletin_events.parish_id
  )
  AND (
    EXISTS (
      SELECT 1
      FROM public.parishes p
      WHERE p.id = bulletin_events.parish_id
        AND p.admin_user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1
        FROM public.bulletin_channel_managers m
        WHERE m.channel_id = bulletin_events.channel_id
          AND m.user_id = auth.uid()
      )
      AND public.is_parish_member(bulletin_events.parish_id, auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "bulletin_events_delete_by_admin_or_channel_manager" ON public.bulletin_events;
CREATE POLICY "bulletin_events_delete_by_admin_or_channel_manager"
ON public.bulletin_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = bulletin_events.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR (
    EXISTS (
      SELECT 1
      FROM public.bulletin_channel_managers m
      WHERE m.channel_id = bulletin_events.channel_id
        AND m.user_id = auth.uid()
    )
    AND public.is_parish_member(bulletin_events.parish_id, auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- bulletin_channel_subscriptions: admins may only subscribe their own members
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "bulletin_channel_subscriptions_insert_own_or_admin" ON public.bulletin_channel_subscriptions;
CREATE POLICY "bulletin_channel_subscriptions_insert_own_or_admin"
ON public.bulletin_channel_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    WHERE c.id = bulletin_channel_subscriptions.channel_id
      AND c.is_archived = false
      AND (
        (
          bulletin_channel_subscriptions.user_id = auth.uid()
          AND public.is_parish_member(c.parish_id, auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.parishes p
          WHERE p.id = c.parish_id
            AND p.admin_user_id = auth.uid()
            AND (
              bulletin_channel_subscriptions.user_id = auth.uid()
              OR public.is_parish_member(c.parish_id, bulletin_channel_subscriptions.user_id)
            )
        )
      )
  )
);

-- ---------------------------------------------------------------------------
-- bulletin_channel_managers: only parish members can be assigned
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "bulletin_channel_managers_insert_by_parish_admin" ON public.bulletin_channel_managers;
CREATE POLICY "bulletin_channel_managers_insert_by_parish_admin"
ON public.bulletin_channel_managers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bulletin_channels c
    JOIN public.parishes p ON p.id = c.parish_id
    WHERE c.id = bulletin_channel_managers.channel_id
      AND p.admin_user_id = auth.uid()
      AND public.is_parish_member(c.parish_id, bulletin_channel_managers.user_id)
  )
);

-- Leaving a parish drops both channel subscriptions and manager assignments there.
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

  DELETE FROM public.bulletin_channel_managers bcm
  USING public.bulletin_channels bc
  WHERE bcm.channel_id = bc.id
    AND bcm.user_id = OLD.user_id
    AND bc.parish_id = OLD.parish_id;

  RETURN OLD;
END;
$$;

-- Remove assignments left behind by people who already left their parish.
DELETE FROM public.bulletin_channel_managers bcm
USING public.bulletin_channels bc
WHERE bcm.channel_id = bc.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_parish_connections upc
    WHERE upc.parish_id = bc.parish_id
      AND upc.user_id = bcm.user_id
  );

-- ---------------------------------------------------------------------------
-- Nightly cleanup of confession data older than 7 days (previously run from clients)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-old-confession-data',
  '0 9 * * *',
  $$
    DELETE FROM public.confession_reservations r
    USING public.confession_schedules s
    WHERE r.schedule_id = s.id
      AND s.date < current_date - 7;
    DELETE FROM public.confession_schedules
    WHERE date < current_date - 7;
  $$
);
