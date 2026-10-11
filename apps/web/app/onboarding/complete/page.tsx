"use client";

import { saveOnboardingData, setOnboardingComplete } from "@parohia/shared";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../../../components/Icon";
import { FormError } from "../../../components/app/AuthChrome";
import { Button } from "../../../components/app/ui";
import { useOnboarding } from "../OnboardingShell";

export default function CompleteStep() {
  const router = useRouter();
  const { userId, data, reset } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = data.fullName?.split(" ")[0] || "friend";
  const isAdmin = data.userType === "parish_admin";

  useEffect(() => {
    const ready = data.userType && data.fullName && (isAdmin ? data.parishName : data.selectedParishId);
    if (!ready) router.replace("/onboarding/user-type");
  }, [data, isAdmin, router]);

  const handleGetStarted = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await saveOnboardingData(userId, data);
      if (!result.success) {
        setError(result.error || "Failed to save your information.");
        return;
      }
      await setOnboardingComplete(userId);
      reset();
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 260 }}
        className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-red-600 text-white shadow-xl shadow-brand-red/30"
      >
        <Icon name="checkmark" size={44} />
      </motion.div>
      <p className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
        You&apos;re all set
      </p>
      <h1 className="font-display text-[56px] leading-[1.02] text-zinc-900 dark:text-white">Welcome, {firstName}!</h1>
      <p className="mx-auto mt-4 max-w-md font-display-italic text-[19px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {isAdmin
          ? `Your account is ready. Next, set up ${data.parishName} for your community.`
          : "Your account is ready. Connect with your faith community and begin your journey."}
      </p>
      <div className="mx-auto mt-10 max-w-sm text-left">
        <FormError message={error} />
        <Button size="lg" fullWidth iconRight="arrow-forward" loading={loading} onClick={handleGetStarted}>
          Open the dashboard
        </Button>
      </div>
    </div>
  );
}
