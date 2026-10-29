-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.user_profiles (
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  id uuid NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['regular_user'::text, 'parish_admin'::text])),
  email text NOT NULL,
  phone_number text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.parishes (
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
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parish_calendar_id text,
  donation_enabled boolean DEFAULT false,
  donation_message text,
  paypal_donation_url text,
  confession_enabled boolean DEFAULT false,
  CONSTRAINT parishes_pkey PRIMARY KEY (id),
  CONSTRAINT parishes_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.parish_clergy (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL,
  name text NOT NULL,
  title text,
  phone_number text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parish_clergy_pkey PRIMARY KEY (id),
  CONSTRAINT parish_clergy_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id)
);
CREATE TABLE public.user_parish_connections (
  user_name text,
  user_id uuid,
  parish_id uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_parish_connections_pkey PRIMARY KEY (id),
  CONSTRAINT user_parish_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_parish_connections_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id)
);
CREATE TABLE public.confession_schedules (
  parish_id uuid NOT NULL,
  date date NOT NULL,
  time_slot time without time zone NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_available boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT confession_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT confession_schedules_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id)
);
CREATE TABLE public.confession_reservations (
  schedule_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'confirmed'::text CHECK (status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT confession_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT confession_reservations_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.confession_schedules(id),
  CONSTRAINT confession_reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.bulletin_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_chant boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_channels_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_channels_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id),
  CONSTRAINT bulletin_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.bulletin_channel_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_channel_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_channel_subscriptions_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.bulletin_channels(id),
  CONSTRAINT bulletin_channel_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT bulletin_channel_subscriptions_unique UNIQUE (channel_id, user_id)
);
CREATE TABLE public.bulletin_channel_managers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_channel_managers_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_channel_managers_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.bulletin_channels(id),
  CONSTRAINT bulletin_channel_managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT bulletin_channel_managers_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.user_profiles(id),
  CONSTRAINT bulletin_channel_managers_unique UNIQUE (channel_id, user_id)
);
CREATE TABLE public.bulletin_events (
  notify boolean DEFAULT false,
  parish_id uuid NOT NULL,
  channel_id uuid NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['announcement'::text, 'volunteer'::text, 'event'::text])),
  event_date date,
  event_time time without time zone,
  location text,
  contact_info text,
  link text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  volunteers_needed integer,
  CONSTRAINT bulletin_events_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_events_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id),
  CONSTRAINT bulletin_events_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.bulletin_channels(id),
  CONSTRAINT bulletin_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.bulletin_responses (
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  response_type text NOT NULL CHECK (response_type = ANY (ARRAY['interested'::text, 'unavailable'::text, 'attending'::text, 'volunteer'::text])),
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bulletin_responses_pkey PRIMARY KEY (id),
  CONSTRAINT bulletin_responses_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.bulletin_events(id),
  CONSTRAINT bulletin_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.chant_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parish_id uuid NOT NULL,
  calendar_event_id text NOT NULL,
  event_title text,
  event_start timestamp with time zone,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chant_signups_pkey PRIMARY KEY (id),
  CONSTRAINT chant_signups_unique UNIQUE (parish_id, calendar_event_id, user_id),
  CONSTRAINT chant_signups_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES public.parishes(id),
  CONSTRAINT chant_signups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_push_tokens (
  user_id uuid NOT NULL,
  token text NOT NULL,
  device_id text,
  platform text CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text])),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  last_seen_at timestamp with time zone DEFAULT now(),
  revoked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT user_push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);