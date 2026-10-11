-- Sentinel parish for "Skip for now" during onboarding.
-- Users with a connection to this parish are treated as having no parish in the app UI,
-- but they are not routed back to parish-selection on sign-in.

INSERT INTO public.parishes (
  id,
  name,
  jurisdiction,
  address,
  city,
  state,
  is_verified,
  admin_user_id,
  donation_enabled
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'No Parish',
  'N/A',
  'N/A',
  'N/A',
  'NA',
  false,
  NULL,
  false
)
ON CONFLICT (id) DO NOTHING;
