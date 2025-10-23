-- RLS policies for bulletin and confession tables
-- This migration enables RLS and defines policies.

-- =====================
-- BULLETIN TABLES
-- =====================

-- Enable RLS
ALTER TABLE public.bulletin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_responses ENABLE ROW LEVEL SECURITY;


-- Members of a parish (or its admin) can read events
CREATE POLICY "bulletin_events_select_by_parish_members_or_admin"
ON public.bulletin_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_parish_connections upc
    WHERE upc.user_id = auth.uid() AND upc.parish_id = parish_id
  ) OR EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

-- Only the parish admin can create events (as themselves)
CREATE POLICY "bulletin_events_insert_by_parish_admin"
ON public.bulletin_events
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

-- Creator or parish admin can update/delete events
CREATE POLICY "bulletin_events_update_by_creator_or_admin"
ON public.bulletin_events
FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

CREATE POLICY "bulletin_events_delete_by_creator_or_admin"
ON public.bulletin_events
FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

-- Responses: owner, parish members, or parish admin can read
CREATE POLICY "bulletin_responses_select_by_member_owner_or_admin"
ON public.bulletin_responses
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_events e
    JOIN public.user_parish_connections upc ON upc.parish_id = e.parish_id
    WHERE e.id = event_id AND upc.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_events e
    JOIN public.parishes p ON p.id = e.parish_id
    WHERE e.id = event_id AND p.admin_user_id = auth.uid()
  )
);

-- Only the user themselves, and only for events in their parish, may create a response
CREATE POLICY "bulletin_responses_insert_by_member_for_own_user_id"
ON public.bulletin_responses
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bulletin_events e
    JOIN public.user_parish_connections upc ON upc.parish_id = e.parish_id
    WHERE e.id = event_id AND upc.user_id = auth.uid()
  )
);

-- Owner or parish admin can update/delete their response
CREATE POLICY "bulletin_responses_update_by_owner_or_admin"
ON public.bulletin_responses
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_events e
    JOIN public.parishes p ON p.id = e.parish_id
    WHERE e.id = event_id AND p.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_events e
    JOIN public.parishes p ON p.id = e.parish_id
    WHERE e.id = event_id AND p.admin_user_id = auth.uid()
  )
);

CREATE POLICY "bulletin_responses_delete_by_owner_or_admin"
ON public.bulletin_responses
FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.bulletin_events e
    JOIN public.parishes p ON p.id = e.parish_id
    WHERE e.id = event_id AND p.admin_user_id = auth.uid()
  )
);


-- =====================
-- CONFESSION TABLES
-- =====================

-- Enable RLS
ALTER TABLE public.confession_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_reservations ENABLE ROW LEVEL SECURITY;


-- Parish members or parish admin can read schedules
CREATE POLICY "confession_schedules_select_by_parish_members_or_admin"
ON public.confession_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_parish_connections upc
    WHERE upc.user_id = auth.uid() AND upc.parish_id = parish_id
  )
  OR EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

-- Only parish admin manages schedules
CREATE POLICY "confession_schedules_insert_by_admin"
ON public.confession_schedules
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

CREATE POLICY "confession_schedules_update_by_admin"
ON public.confession_schedules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

CREATE POLICY "confession_schedules_delete_by_admin"
ON public.confession_schedules
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.parishes p
    WHERE p.id = parish_id AND p.admin_user_id = auth.uid()
  )
);

-- Reservations visibility: members of the parish can see all reservations; owner and parish admin also allowed
CREATE POLICY "confession_reservations_select_by_owner_or_member_or_admin"
ON public.confession_reservations
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.confession_schedules cs
    JOIN public.user_parish_connections upc ON upc.parish_id = cs.parish_id
    WHERE cs.id = schedule_id AND upc.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.confession_schedules cs
    JOIN public.parishes p ON p.id = cs.parish_id
    WHERE cs.id = schedule_id AND p.admin_user_id = auth.uid()
  )
);

-- Only members of the schedule's parish can create reservations for themselves, and only if the slot is available
CREATE POLICY "confession_reservations_insert_by_member_for_available_slot"
ON public.confession_reservations
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.confession_schedules cs
    JOIN public.user_parish_connections upc ON upc.parish_id = cs.parish_id
    WHERE cs.id = schedule_id
      AND cs.is_available = true
      AND upc.user_id = auth.uid()
  )
);

-- Update/delete: parish admin can update/delete; members can only update/delete their own
CREATE POLICY "confession_reservations_update_by_owner_or_admin"
ON public.confession_reservations
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.confession_schedules cs
    JOIN public.parishes p ON p.id = cs.parish_id
    WHERE cs.id = schedule_id AND p.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.confession_schedules cs
    JOIN public.parishes p ON p.id = cs.parish_id
    WHERE cs.id = schedule_id AND p.admin_user_id = auth.uid()
  )
);

CREATE POLICY "confession_reservations_delete_by_owner_or_admin"
ON public.confession_reservations
FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.confession_schedules cs
    JOIN public.parishes p ON p.id = cs.parish_id
    WHERE cs.id = schedule_id AND p.admin_user_id = auth.uid()
  )
);