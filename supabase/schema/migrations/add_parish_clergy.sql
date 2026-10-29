-- Parish clergy: any number of clergy per parish, each with a title (Parish Priest, Deacon, ...).
-- Replaces parishes.priest_name / priest_phone_number / priest_email.
-- Run in Supabase SQL editor (or via CLI) against the live database,
-- then run drop_parish_priest_columns.sql once no app build reads the old columns.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.parish_clergy (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  phone_number text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parish_clergy_pkey PRIMARY KEY (id),
  CONSTRAINT parish_clergy_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS parish_clergy_parish_idx
  ON public.parish_clergy (parish_id, created_at);

-- 2. Backfill from the old single-priest columns
INSERT INTO public.parish_clergy (parish_id, name, title, phone_number, email)
SELECT p.id, trim(p.priest_name), 'Parish Priest', p.priest_phone_number, p.priest_email
FROM public.parishes p
WHERE p.priest_name IS NOT NULL
  AND char_length(trim(p.priest_name)) > 0
  AND NOT EXISTS (SELECT 1 FROM public.parish_clergy c WHERE c.parish_id = p.id);

-- 3. RLS: members read, the parish admin writes
ALTER TABLE public.parish_clergy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parish_clergy_select_by_parish_members_or_admin" ON public.parish_clergy;
CREATE POLICY "parish_clergy_select_by_parish_members_or_admin"
ON public.parish_clergy
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = parish_clergy.parish_id
      AND p.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_parish_connections upc
    WHERE upc.parish_id = parish_clergy.parish_id
      AND upc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "parish_clergy_insert_by_parish_admin" ON public.parish_clergy;
CREATE POLICY "parish_clergy_insert_by_parish_admin"
ON public.parish_clergy
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = parish_clergy.parish_id
      AND p.admin_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "parish_clergy_update_by_parish_admin" ON public.parish_clergy;
CREATE POLICY "parish_clergy_update_by_parish_admin"
ON public.parish_clergy
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = parish_clergy.parish_id
      AND p.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = parish_clergy.parish_id
      AND p.admin_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "parish_clergy_delete_by_parish_admin" ON public.parish_clergy;
CREATE POLICY "parish_clergy_delete_by_parish_admin"
ON public.parish_clergy
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.parishes p
    WHERE p.id = parish_clergy.parish_id
      AND p.admin_user_id = auth.uid()
  )
);
