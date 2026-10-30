"use client";

import {
  ChannelService,
  getParishByAdminId,
  getParishByUserId,
  getUserProfile,
  type CalendarSystem,
  type CalendarTradition,
  type Parish,
  type UserProfile,
} from "@parohia/shared";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getBrowserSupabase } from "../../lib/supabase/client";

const TRADITION_KEY = "@calendar_tradition";
const SYSTEM_KEY = "@calendar_system";

interface DashboardContextValue {
  userId: string;
  email: string;
  profile: UserProfile | null;
  parish: Parish | null;
  isAdmin: boolean;
  /** Channels a non-admin member manages (admins can post anywhere). */
  managedChannelIds: string[];
  canPost: boolean;
  chantSubscribed: boolean;
  setChantSubscribed: (value: boolean) => void;
  tradition: CalendarTradition;
  setTradition: (value: CalendarTradition) => void;
  calendarSystem: CalendarSystem;
  setCalendarSystem: (value: CalendarSystem) => void;
  /** Re-reads profile, parish, and roles from Supabase. */
  refresh: () => Promise<void>;
  setParish: (parish: Parish | null) => void;
  signOut: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside the dashboard layout");
  return ctx;
}

export function DashboardProvider({
  userId,
  email,
  loading,
  children,
}: {
  userId: string;
  email: string;
  loading: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [parish, setParish] = useState<Parish | null>(null);
  const [managedChannelIds, setManagedChannelIds] = useState<string[]>([]);
  const [chantSubscribed, setChantSubscribed] = useState(false);
  const [tradition, setTraditionState] = useState<CalendarTradition>("greek");
  const [calendarSystem, setCalendarSystemState] = useState<CalendarSystem>("gregorian");

  const isAdmin = profile?.user_type === "parish_admin";

  const refresh = useCallback(async () => {
    const nextProfile = await getUserProfile(userId);
    setProfile(nextProfile);
    const admin = nextProfile?.user_type === "parish_admin";
    const nextParish = admin ? await getParishByAdminId(userId) : await getParishByUserId(userId);
    setParish(nextParish);

    if (!nextParish) {
      setManagedChannelIds([]);
      setChantSubscribed(false);
      return;
    }

    if (admin) {
      await ChannelService.ensureGeneralChannel(nextParish.id, userId);
      await ChannelService.ensureChantChannel(nextParish.id, userId);
    } else {
      await ChannelService.ensureGeneralSubscription(userId, nextParish.id);
      await ChannelService.ensureChantChannel(nextParish.id);
    }

    const managed = admin
      ? []
      : await ChannelService.ensureManagedSubscriptions(userId, nextParish.id).catch(() => []);
    const chant = await ChannelService.isUserSubscribedToChant(userId, nextParish.id);
    setManagedChannelIds(managed);
    setChantSubscribed(chant);
  }, [userId]);

  useEffect(() => {
    getBrowserSupabase();
    try {
      const storedTradition = localStorage.getItem(TRADITION_KEY);
      if (storedTradition === "greek" || storedTradition === "slavic") setTraditionState(storedTradition);
      const storedSystem = localStorage.getItem(SYSTEM_KEY);
      if (storedSystem === "gregorian" || storedSystem === "julian") setCalendarSystemState(storedSystem);
    } catch {
      // Storage unavailable
    }
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const setTradition = useCallback((value: CalendarTradition) => {
    setTraditionState(value);
    try {
      localStorage.setItem(TRADITION_KEY, value);
    } catch {
      // Storage unavailable
    }
  }, []);

  const setCalendarSystem = useCallback((value: CalendarSystem) => {
    setCalendarSystemState(value);
    try {
      localStorage.setItem(SYSTEM_KEY, value);
    } catch {
      // Storage unavailable
    }
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserSupabase().auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [router]);

  return (
    <DashboardContext.Provider
      value={{
        userId,
        email,
        profile,
        parish,
        isAdmin,
        managedChannelIds,
        canPost: isAdmin || managedChannelIds.length > 0,
        chantSubscribed,
        setChantSubscribed,
        tradition,
        setTradition,
        calendarSystem,
        setCalendarSystem,
        refresh,
        setParish,
        signOut,
      }}
    >
      {ready ? children : loading}
    </DashboardContext.Provider>
  );
}
