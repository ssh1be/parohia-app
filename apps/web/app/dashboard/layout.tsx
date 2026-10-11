import { resolveAuthDestination } from "@parohia/shared";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DesktopGate } from "../../components/app/DesktopGate";
import { ToastProvider } from "../../components/app/toast";
import { destinationPath } from "../../lib/auth";
import { getServerSupabase } from "../../lib/supabase/server";
import { DashboardProvider } from "./DashboardContext";
import { DashboardShell, DashboardSkeleton } from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const destination = await resolveAuthDestination(user.id, supabase);
  if (destination !== "tabs") redirect(destinationPath(destination));

  return (
    <DesktopGate>
      <ToastProvider>
        <DashboardProvider userId={user.id} email={user.email ?? ""} loading={<DashboardSkeleton />}>
          <DashboardShell>{children}</DashboardShell>
        </DashboardProvider>
      </ToastProvider>
    </DesktopGate>
  );
}
