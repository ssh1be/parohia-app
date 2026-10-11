"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FormError } from "../../../components/app/AuthChrome";
import { Button, Checkbox, TextField } from "../../../components/app/ui";
import { StepHeader, useOnboarding } from "../OnboardingShell";

export default function ProfileStep() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [fullName, setFullName] = useState(data.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber ?? "");
  const [termsAccepted, setTermsAccepted] = useState(!!data.termsAccepted);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data.userType) router.replace("/onboarding/user-type");
  }, [data.userType, router]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    updateData({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim(), termsAccepted });
    router.push(data.userType === "parish_admin" ? "/onboarding/parish-details" : "/onboarding/parish-selection");
  };

  return (
    <>
      <StepHeader eyebrow="Step 2 of 3" title="Your information" subtitle="Tell us a little about yourself." />
      <FormError message={error} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-x-4">
          <TextField
            label="Display name"
            required
            placeholder="John Doe"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
          />
          <TextField
            label="Phone number"
            type="tel"
            placeholder="(503) 123-4567"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            helper="Optional. Only used by your parish if they need to reach you."
          />
        </div>

        <Checkbox checked={termsAccepted} onChange={setTermsAccepted} className="mb-8 mt-2">
          I agree to the{" "}
          <a href="/terms" target="_blank" className="font-sans-semibold text-red-600 hover:underline dark:text-red-400">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" className="font-sans-semibold text-red-600 hover:underline dark:text-red-400">
            Privacy Policy
          </a>
        </Checkbox>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="lg" icon="arrow-back" onClick={() => router.push("/onboarding/user-type")}>
            Back
          </Button>
          <Button type="submit" size="lg" iconRight="arrow-forward" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </>
  );
}
