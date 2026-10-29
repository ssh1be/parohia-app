"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "../../../components/Icon";
import { AuthHeader, FormError } from "../../../components/app/AuthChrome";
import { Button, TextField } from "../../../components/app/ui";
import { getBrowserSupabase } from "../../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await getBrowserSupabase().auth.resetPasswordForEmail(trimmed);
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    router.push(`/verify?type=recovery&email=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      <AuthHeader
        eyebrow="Account recovery"
        title="Reset password"
        subtitle="We'll email you a 6-digit code to choose a new password."
      />

      <FormError message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          required
          type="email"
          autoComplete="email"
          placeholder="your-email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <Button type="submit" size="lg" fullWidth loading={loading} icon="mail-outline" className="mt-2">
          Send reset code
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-10 flex items-center justify-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <Icon name="arrow-back" size={13} />
        Back to sign in
      </Link>
    </>
  );
}
