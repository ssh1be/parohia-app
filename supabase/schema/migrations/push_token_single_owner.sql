-- A device's push token belongs to whoever registered it last.
-- Sign-out revokes the token from the client, but that call fails offline, which would leave the
-- previous account receiving pushes on this device. Revoke other users' rows for the same token
-- whenever a user registers or re-activates it.
-- Run in Supabase SQL editor (or via CLI) against the live database.

CREATE OR REPLACE FUNCTION public.revoke_push_token_for_other_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.revoked IS DISTINCT FROM true THEN
    UPDATE public.user_push_tokens
    SET revoked = true
    WHERE token = NEW.token
      AND user_id <> NEW.user_id
      AND revoked IS DISTINCT FROM true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_push_tokens_single_owner ON public.user_push_tokens;
CREATE TRIGGER trg_user_push_tokens_single_owner
  AFTER INSERT OR UPDATE OF revoked, user_id ON public.user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_push_token_for_other_users();

-- One-time cleanup: keep only the most recently seen owner of each active token.
UPDATE public.user_push_tokens t
SET revoked = true
WHERE t.revoked IS DISTINCT FROM true
  AND EXISTS (
    SELECT 1
    FROM public.user_push_tokens newer
    WHERE newer.token = t.token
      AND newer.user_id <> t.user_id
      AND newer.revoked IS DISTINCT FROM true
      AND newer.last_seen_at > t.last_seen_at
  );
