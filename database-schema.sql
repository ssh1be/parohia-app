-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.parishes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jurisdiction text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text,
  phone_number text,
  website text,
  email text,
  admin_user_id uuid,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parish_calendar_id text,
  priest_name text,
  priest_phone_number text,
  priest_email text,
  -- Donation fields
  paypal_donation_url text,
  donation_enabled boolean DEFAULT false,
  donation_message text,
  CONSTRAINT parishes_pkey PRIMARY KEY (id),
  CONSTRAINT parishes_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.user_parish_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  parish_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_parish_connections_pkey PRIMARY KEY (id),
  CONSTRAINT user_parish_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_parish_connections_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id)
);

CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['regular_user'::text, 'parish_admin'::text])),
  email text NOT NULL,
  phone_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Confession scheduling tables
CREATE TABLE public.confession_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL,
  date date NOT NULL,
  time_slot time NOT NULL,
  is_available boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT confession_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT confession_schedules_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id),
  CONSTRAINT confession_schedules_unique_slot UNIQUE (parish_id, date, time_slot)
);

CREATE TABLE public.confession_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT confession_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT confession_reservations_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.confession_schedules(id),
  CONSTRAINT confession_reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT confession_reservations_unique_schedule UNIQUE (schedule_id)
);

-- Bulletin board tables
CREATE TABLE public.bulletin_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['announcement'::text, 'volunteer'::text, 'event'::text])),
  event_date date,
  event_time time,
  location text,
  contact_info text,
  volunteers_needed integer,
  notify boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_events_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_events_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id),
  CONSTRAINT bulletin_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id)
);

CREATE TABLE public.bulletin_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  response_type text NOT NULL CHECK (response_type = ANY (ARRAY['interested'::text, 'unavailable'::text, 'attending'::text, 'volunteer'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_responses_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_responses_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.bulletin_events(id),
  CONSTRAINT bulletin_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT bulletin_responses_unique_user_event UNIQUE (user_id, event_id)
);