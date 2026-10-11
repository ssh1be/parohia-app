"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FormError } from "../../../components/app/AuthChrome";
import { Button, Notice, TextField } from "../../../components/app/ui";
import { StepHeader, useOnboarding } from "../OnboardingShell";

const REQUIRED: { key: "parishName" | "jurisdiction" | "address" | "city" | "state"; message: string }[] = [
  { key: "parishName", message: "Please enter your parish name." },
  { key: "jurisdiction", message: "Please enter your jurisdiction." },
  { key: "address", message: "Please enter your parish address." },
  { key: "city", message: "Please enter your city." },
  { key: "state", message: "Please enter your state." },
];

export default function ParishDetailsStep() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [form, setForm] = useState({
    parishName: data.parishName ?? "",
    jurisdiction: data.jurisdiction ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    zipCode: data.zipCode ?? "",
    parishPhoneNumber: data.parishPhoneNumber ?? "",
    parishWebsite: data.parishWebsite ?? "",
    parishEmail: data.parishEmail ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data.userType !== "parish_admin" || !data.fullName) router.replace("/onboarding/user-type");
  }, [data.fullName, data.userType, router]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const missing = REQUIRED.find(({ key }) => !form[key].trim());
    if (missing) {
      setError(missing.message);
      return;
    }
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as typeof form;
    updateData(trimmed);
    router.push("/onboarding/complete");
  };

  return (
    <>
      <StepHeader eyebrow="Step 3 of 3" title="Parish details" subtitle="Register your community on Parohia." />
      <FormError message={error} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-x-4">
          <TextField label="Parish name" required placeholder="St. Mary Orthodox Church" autoFocus {...field("parishName")} />
          <TextField label="Jurisdiction" required placeholder="Orthodox Church in America (OCA)" {...field("jurisdiction")} />
        </div>
        <TextField label="Street address" required placeholder="123 Main St" autoComplete="street-address" {...field("address")} />
        <div className="grid grid-cols-[1fr_96px_140px] gap-x-4">
          <TextField label="City" required placeholder="Portland" autoComplete="address-level2" {...field("city")} />
          <TextField
            label="State"
            required
            placeholder="OR"
            maxLength={2}
            autoComplete="address-level1"
            className="uppercase"
            {...field("state")}
          />
          <TextField label="ZIP code" placeholder="97201" inputMode="numeric" maxLength={10} autoComplete="postal-code" {...field("zipCode")} />
        </div>
        <div className="grid grid-cols-3 gap-x-4">
          <TextField label="Parish phone" type="tel" placeholder="(503) 123-4567" helper="Optional" {...field("parishPhoneNumber")} />
          <TextField label="Website" type="url" placeholder="https://stmary.org" helper="Optional" {...field("parishWebsite")} />
          <TextField label="Parish email" type="email" placeholder="info@stmary.org" helper="Optional" {...field("parishEmail")} />
        </div>

        <Notice tone="warning" icon="shield-checkmark-outline" className="mb-6 mt-2">
          Your parish will need to be verified before you can fully access administrator features. We'll guide you
          through this after registration.
        </Notice>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="lg" icon="arrow-back" onClick={() => router.push("/onboarding/profile")}>
            Back
          </Button>
          <Button type="submit" size="lg" icon="checkmark-circle-outline" className="flex-1">
            Complete registration
          </Button>
        </div>
      </form>
    </>
  );
}
