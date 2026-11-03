  -- Apple App Store review tester
  -- Run in the Supabase SQL editor (production or the project you submit builds against).
  --
  -- After running, put these in App Store Connect → App Review Information:
  --   Email:    apple-review@parohia.app   (or REVIEW_EMAIL below)
  --   Password: the REVIEW_PASSWORD value below
  -- Notes tip: "Sign in with the account above. Onboarding is complete — use Calendar, Events, and Parish."

  DO $$
  DECLARE
    -- ——— edit these ———
    review_email    text := 'apple-review@parohia.app';
    review_password text := 'ParohiaReview2026!'; -- change before sharing with Apple
    review_name     text := 'App Reviewer';
    -- Optional: pin to a specific parish. NULL = first verified parish, else any parish.
    target_parish   uuid := NULL;
    -- ——————————————————

    review_id   uuid := gen_random_uuid();
    parish_id   uuid;
  BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(review_email)) THEN
      RAISE EXCEPTION 'User % already exists — delete it first or pick another email', review_email;
    END IF;

    IF target_parish IS NOT NULL THEN
      parish_id := target_parish;
    ELSE
      SELECT p.id
      INTO parish_id
      FROM public.parishes p
      ORDER BY p.is_verified DESC NULLS LAST, p.created_at ASC
      LIMIT 1;
    END IF;

    IF parish_id IS NULL THEN
      RAISE EXCEPTION 'No parish found. Create a parish first, or set target_parish.';
    END IF;

    -- Auth user (email already confirmed — no OTP for Apple)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      review_id,
      'authenticated',
      'authenticated',
      lower(review_email),
      extensions.crypt(review_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', review_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      review_id,
      jsonb_build_object(
        'sub', review_id::text,
        'email', lower(review_email),
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      lower(review_email),
      now(),
      now(),
      now()
    );

    INSERT INTO public.user_profiles (id, full_name, user_type, email, phone_number)
    VALUES (review_id, review_name, 'regular_user', lower(review_email), NULL);

    INSERT INTO public.user_parish_connections (user_id, parish_id)
    VALUES (review_id, parish_id);

    RAISE NOTICE 'Apple review user ready: % / (password you set) → parish %', lower(review_email), parish_id;
  END $$;
