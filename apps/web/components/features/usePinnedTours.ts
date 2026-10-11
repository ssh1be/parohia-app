"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PINNED_QUERY } from "./chapters";

export function usePinnedTours() {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(PINNED_QUERY);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return wide && !reduce;
}
