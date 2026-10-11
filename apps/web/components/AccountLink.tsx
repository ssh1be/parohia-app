"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "../lib/supabase/client";

/** "Sign in" for visitors, "Open dashboard" once a session cookie exists. */
export default function AccountLink({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <a href={signedIn ? "/dashboard" : "/login"} className={className}>
      {signedIn ? "Open dashboard" : "Sign in"}
    </a>
  );
}
