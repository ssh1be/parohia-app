"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../../components/Icon";
import { AuthHeader, FormError, FormNotice } from "../../../components/app/AuthChrome";
import { Button, cx } from "../../../components/app/ui";
import { getBrowserSupabase } from "../../../lib/supabase/client";

const OTP_LENGTH = 6;

export function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [focused, setFocused] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!email) router.replace("/login?mode=signup");
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const verify = async (code: string) => {
    if (code.length < OTP_LENGTH || verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    setError(null);
    const { error: verifyError } = await getBrowserSupabase().auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });
    if (verifyError) {
      setError(verifyError.message || "Failed to verify code.");
      verifyingRef.current = false;
      setLoading(false);
      return;
    }
    router.replace("/onboarding/user-type");
    router.refresh();
  };

  const handleChange = (value: string) => {
    const next = value.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setOtp(next);
    if (next.length === OTP_LENGTH) void verify(next);
  };

  const resend = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    setError(null);
    setNotice(null);
    const { error: resendError } = await getBrowserSupabase().auth.resend({ type: "signup", email });
    setResendLoading(false);
    if (resendError) {
      setError(resendError.message || "Failed to resend code.");
      return;
    }
    setCountdown(60);
    setNotice("A new code has been sent to your email.");
  };

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? "");

  return (
    <>
      <AuthHeader
        eyebrow="Almost there"
        title="Verify email"
        subtitle={
          <>
            Enter the 6-digit code we sent to{" "}
            <span className="font-sans-semibold text-zinc-900 dark:text-white">{email}</span>.
          </>
        }
      />

      <FormNotice message={notice} />
      <FormError message={error} />

      <div className="relative mb-8" onClick={() => inputRef.current?.focus()}>
        <div className="flex justify-between gap-3">
          {digits.map((digit, i) => {
            const active = focused && (otp.length === i || (otp.length === OTP_LENGTH && i === OTP_LENGTH - 1));
            return (
              <div
                key={i}
                className={cx(
                  "flex h-16 flex-1 items-center justify-center rounded-2xl border bg-zinc-100 font-sans-bold text-[26px] text-zinc-900 transition-colors dark:bg-white/5 dark:text-white",
                  active
                    ? "border-red-500/70 ring-4 ring-red-500/10"
                    : digit
                      ? "border-red-600/30 dark:border-red-500/25"
                      : "border-transparent dark:border-white/5"
                )}
              >
                {digit}
              </div>
            );
          })}
        </div>
        <input
          ref={inputRef}
          value={otp}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          autoFocus
          disabled={loading}
          aria-label="Verification code"
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
      </div>

      <Button
        size="lg"
        fullWidth
        icon="checkmark-circle-outline"
        loading={loading}
        disabled={otp.length < OTP_LENGTH}
        onClick={() => void verify(otp)}
      >
        Verify email
      </Button>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Didn&apos;t receive the code?</p>
        <Button variant="ghost" size="sm" loading={resendLoading} disabled={countdown > 0} onClick={resend}>
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
        </Button>
      </div>

      <a
        href="/login?mode=signup"
        className="mt-8 flex items-center justify-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <Icon name="arrow-back" size={13} />
        Use a different email
      </a>
    </>
  );
}
