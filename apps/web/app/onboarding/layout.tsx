import { resolveAuthDestination } from "@parohia/shared";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DesktopGate } from "../../components/app/DesktopGate";
import { getServerSupabase } from "../../lib/supabase/server";
import { OnboardingShell } from "./OnboardingShell";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const destination = await resolveAuthDestination(user.id, supabase);
  if (destination === "tabs") redirect("/dashboard");

  return (
    <DesktopGate>
      <OnboardingShell userId={user.id} email={user.email ?? ""} rejoin={destination === "parish-selection"}>
        {children}
      </OnboardingShell>
    </DesktopGate>
  );
}
