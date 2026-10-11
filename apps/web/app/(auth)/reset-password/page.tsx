"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthHeader, FormError } from "../../../components/app/AuthChrome";
import { Button, Spinner, TextField } from "../../../components/app/ui";
import { getBrowserSupabase } from "../../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBrowserSupabase()
      .auth.getUser()
      .then(({ data }) => setHasSession(!!data.user));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  if (hasSession === null) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <Spinner size={22} />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <>
        <AuthHeader
          eyebrow="Link expired"
          title="Reset password"
          subtitle="This reset link is invalid or has expired. Request a new one to continue."
        />
        <Button size="lg" fullWidth icon="refresh-outline" onClick={() => router.push("/forgot-password")}>
          Request a new link
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthHeader eyebrow="Account recovery" title="New password" subtitle="Choose a new password for your account." />
      <FormError message={error} />
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="New password"
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <TextField
          label="Confirm password"
          required
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth loading={loading} icon="key-outline" className="mt-2">
          Update password
        </Button>
      </form>
    </>
  );
}
