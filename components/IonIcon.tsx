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
      // Rely on scripts included in app layout. No remote import here to avoid type errors during build.
      return;
    }
    ensureIoniconsLoaded();
  }, []);

  return <ion-icon ref={ref as any} name={name} className={className} />;
}


