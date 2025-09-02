"use client";

import { useEffect, useRef } from "react";

type IonIconProps = {
  name?: string;
  className?: string;
};

export default function IonIcon({ name, className }: IonIconProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure web component is defined on client
    async function ensureIoniconsLoaded() {
      if (typeof window === "undefined") return;
      if (customElements.get("ion-icon")) return;
      try {
        await import("https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js");
      } catch {
        // no-op: rely on layout scripts or previous loads
      }
    }
    ensureIoniconsLoaded();
  }, []);

  return <ion-icon ref={ref as any} name={name} className={className} />;
}


