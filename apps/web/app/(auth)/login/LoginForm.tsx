"use client";

import { resolveAuthDestination, signUpWithEmail } from "@parohia/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../../../components/Icon";
import { AuthHeader, FormError, FormNotice } from "../../../components/app/AuthChrome";
import { Button, IconButton, TextField } from "../../../components/app/ui";
import { destinationPath } from "../../../lib/auth";
import { getBrowserSupabase } from "../../../lib/supabase/client";

/** Only allow same-origin dashboard paths as post-login targets. */
const safeNext = (next: string | null) =>
  next && next.startsWith("/dashboard") && !next.startsWith("//") ? next : null;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(params.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setIsSignUp(params.get("mode") === "signup");
  }, [params]);

  const switchMode = () => {
    setIsSignUp((v) => !v);
    setError(null);
    setNotice(null);
    setShowPassword(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const supabase = getBrowserSupabase();
    try {
      if (isSignUp) {
        const outcome = await signUpWithEmail(trimmedEmail, password, supabase);
        if (outcome.status === "needs_otp") {
          router.push(`/verify?email=${encodeURIComponent(trimmedEmail)}`);
          return;
        }
        if (outcome.status === "already_registered") {
          setIsSignUp(false);
          setNotice("An account with this email is already registered. Sign in instead.");
          return;
        }
        setError(outcome.message);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError || !data.user) {
        setError(signInError?.message ?? "Unable to sign in.");
        return;
      }

      const destination = await resolveAuthDestination(data.user.id, supabase);
      const next = destination === "tabs" ? safeNext(params.get("next")) : null;
      router.replace(next ?? destinationPath(destination));
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        eyebrow={isSignUp ? "Join Parohia" : "Welcome back"}
        title={isSignUp ? "Create account" : "Sign in"}
        subtitle={isSignUp ? "Enter your email and a password to begin." : "Sign in to continue to your parish."}
      />

      <FormNotice message={notice} />
      <FormError message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          required
          type="email"
          autoComplete={isSignUp ? "email" : "username"}
          placeholder="your-email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <TextField
          label="Password"
          required
          type={showPassword ? "text" : "password"}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          accessory={
            !isSignUp ? (
              <Link
                href="/forgot-password"
                className="font-sans-semibold text-[12px] text-red-600 hover:underline dark:text-red-400"
              >
                Forgot password?
              </Link>
            ) : undefined
          }
          trailing={
            <IconButton
              icon={showPassword ? "eye-off-outline" : "eye-outline"}
              label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              size={34}
            />
          }
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          icon={isSignUp ? "person-add-outline" : "log-in-outline"}
          className="mt-2"
        >
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-zinc-500 dark:text-zinc-400">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={switchMode}
          className="font-sans-semibold text-red-600 hover:underline dark:text-red-400"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </button>
      </p>

      <a
        href="/"
        className="mt-10 flex items-center justify-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <Icon name="arrow-back" size={13} />
        Back to parohia.app
      </a>
    </>
  );
}
