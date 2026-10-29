"use client";

import { useEffect } from "react";
import { AUGUST_30, SEPTEMBER_10 } from "../phone/data";
import { CalendarScreen } from "../phone/screens/CalendarScreen";
import { EventsScreen } from "../phone/screens/EventsScreen";
import { LockScreen } from "../phone/screens/LockScreen";
import { NotificationsScreen } from "../phone/screens/NotificationsScreen";
import { PostDetailScreen } from "../phone/screens/PostDetailScreen";
import { FloatingChapterNav } from "./ChapterNav";
import { FeatureTour } from "./FeatureTour";
import { usePinnedTours } from "./usePinnedTours";

/** Scroll down past this to hide the header, so small jitters don't toggle it. */
const HEADER_HIDE_SLACK = 8;
/** Scroll back up this far from the lowest point to bring the header back. */
const HEADER_REVEAL_SLACK = 120;

/** Slides the site header out while scrolling down and back in after a deliberate scroll up. */
function useHideHeaderOnScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    let anchor = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const hidden = root.dataset.immersive === "true";
      if (root.dataset.autoScroll) {
        anchor = y;
      } else if (y < 80) {
        root.dataset.immersive = "false";
        anchor = y;
      } else if (hidden) {
        anchor = Math.max(anchor, y);
        if (anchor - y > HEADER_REVEAL_SLACK) {
          root.dataset.immersive = "false";
          anchor = y;
        }
      } else {
        anchor = Math.min(anchor, y);
        if (y - anchor > HEADER_HIDE_SLACK) {
          root.dataset.immersive = "true";
          anchor = y;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.immersive;
    };
  }, [enabled]);
}

export function FeatureChapters() {
  const pinned = usePinnedTours();
  useHideHeaderOnScroll(!pinned);
  return (
    <>
      {pinned && <FloatingChapterNav />}
      <div className="divide-y divide-zinc-200 dark:divide-white/[0.06]">
        <FeatureTour
          pinned={pinned}
          id="calendar-schedule"
          title="The liturgical year and your parish, on one calendar"
          intro="Feasts, fasts, and saints sit right alongside your parish's own services, so every day reads at a glance."
          screens={[{ label: "Calendar", render: () => <CalendarScreen day={SEPTEMBER_10} /> }]}
          notes={[
            { screen: 0, spot: "month-grid", side: "left", title: "One calendar", body: "Orthodox and parish calendars, neatly combined in one place." },
            {
              screen: 0,
              spot: "fasting",
              side: "right",
              title: "Fasting at a glance",
              body: "Every day carries its fasting rule, with icons right on the month.",
            },
            { screen: 0, spot: "commemorations", side: "left", title: "Saints of the day", body: "See who the Church remembers today and read their lives." },
            {
              screen: 0,
              spot: "parish-schedule",
              side: "right",
              title: "The full parish schedule",
              body: "Every service and gathering, with a reminder you can turn on for each one.",
            },
          ]}
        />

        <FeatureTour
          pinned={pinned}
          id="notifications"
          title="Reminders on your terms"
          intro="Choose when Parohia reaches you, get one calm summary a day, and keep the day's scripture close."
          screens={[
            { label: "Notification settings", render: () => <NotificationsScreen />, statusTone: "light" },
            { label: "Your day", render: () => <CalendarScreen day={AUGUST_30} /> },
          ]}
          notes={[
            {
              screen: 0,
              spot: "reminder-time",
              side: "left",
              title: "Choose your timing",
              body: "Decide how far ahead you're notified, from 15 minutes to 2 hours.",
            },
            { screen: 0, spot: "digest", side: "left", title: "A daily digest", body: "Receive one summary of everything happening at your parish." },
            {
              screen: 1,
              spot: "personal-schedule",
              side: "right",
              title: "Your schedule, synced",
              body: "Confessions, volunteering, and other personal events land on the same calendar automatically.",
            },
            { screen: 1, spot: "readings", side: "right", title: "Daily readings", body: "Read the day's Epistle and Gospel right in the app." },
          ]}
        />

        <FeatureTour
          pinned={pinned}
          id="announcements-events"
          title="Parish news, the moment it's posted"
          intro="Clergy, administrators, and ministry leaders share announcements and events. Parishioners respond with a tap."
          screens={[
            { label: "Bulletin board", render: () => <EventsScreen admin /> },
            { label: "Lock screen", render: () => <LockScreen />, statusTone: "light" },
          ]}
          notes={[
            {
              screen: 0,
              spot: "new-post",
              side: "left",
              title: "A parish bulletin board",
              body: "Administrators create posts for announcements, events, and volunteer needs.",
            },
            {
              screen: 0,
              spot: "channel-chips",
              side: "right",
              title: "Channels for every ministry",
              body: "Follow the choir, youth group, or festival committee. Channel managers post to the channels they run.",
            },
            {
              screen: 0,
              spot: "volunteer-card",
              side: "left",
              title: "RSVP with ease",
              body: "Parishioners volunteer and RSVP for events without a sign-up sheet.",
            },
            {
              screen: 1,
              spot: "push",
              side: "right",
              title: "Everyone hears it at once",
              body: "Any post can notify its channel's followers, straight to the lock screen.",
            },
          ]}
        />

        <FeatureTour
          pinned={pinned}
          id="volunteering-confessions"
          title="Volunteering and confession, a few taps away"
          intro="Offer to help or book a time with your priest, without a phone call or a clipboard."
          screens={[
            { label: "Volunteer", render: () => <PostDetailScreen />, statusTone: "light" },
            { label: "Confession", render: () => <EventsScreen initialTab="confession" /> },
          ]}
          notes={[
            {
              screen: 0,
              spot: "volunteer-toggle",
              side: "left",
              title: "Volunteer in seconds",
              body: "One tap tells your parish they can count on you. Try it.",
            },
            {
              screen: 1,
              spot: "confession-tab",
              side: "right",
              title: "Confession, if enabled",
              body: "Parishes can turn on confession scheduling right in the app.",
            },
            { screen: 1, spot: "your-slot", side: "left", title: "Book in a few taps", body: "Parishioners pick an open time and they're on the schedule." },
            {
              screen: 1,
              spot: "slot-grid",
              side: "right",
              title: "Your priest's availability",
              body: "Admins set which times are open for confession, directly in Parohia.",
            },
          ]}
        />
      </div>
    </>
  );
}
