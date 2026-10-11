import type { ReactNode } from "react";
import { DesktopGate } from "../../components/app/DesktopGate";
import { AuthBrandPanel } from "../../components/app/AuthChrome";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <DesktopGate>
      <div className="grid min-h-[100dvh] grid-cols-[minmax(420px,1fr)_minmax(520px,1.1fr)]">
        <AuthBrandPanel />
        <main className="flex items-center justify-center px-12 py-16">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
      </div>
    </DesktopGate>
  );
}
