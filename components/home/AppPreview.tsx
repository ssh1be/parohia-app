"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import { AUGUST_30 } from "../phone/data";
import { DEVICE, PhoneFrame } from "../phone/PhoneFrame";
import { CalendarScreen } from "../phone/screens/CalendarScreen";
import { EventsScreen } from "../phone/screens/EventsScreen";
import { HomeScreen } from "../phone/screens/HomeScreen";
import { ParishScreen } from "../phone/screens/ParishScreen";
import type { TabKey } from "../phone/ui";

const TABS: { key: TabKey; icon: IconName; title: string; body: string }[] = [
  {
    key: "home",
    icon: "home-outline",
    title: "Home",
    body: "Today in the Church, your schedule, and the day's readings, the moment you open the app.",
  },
  {
    key: "calendar",
    icon: "calendar-outline",
    title: "Calendar",
    body: "A month of feasts, fasts, and parish services. Tap any day to see what it holds.",
  },
  {
    key: "events",
    icon: "newspaper-outline",
    title: "Events",
    body: "The parish bulletin board: announcements, events, volunteering, and confession times.",
  },
  {
    key: "parish",
    icon: "location-outline",
    title: "Parish",
    body: "Clergy, contact details, directions, and ways to support your parish.",
  },
];

/** Scroll progress where the zoom-in finishes and the zoom-out begins; the screens tick through in between. */
const ZOOM_IN = 0.12;
const ZOOM_OUT = 0.88;
const segment = (i: number): [number, number] => {
  const step = (ZOOM_OUT - ZOOM_IN) / TABS.length;
  return [ZOOM_IN + step * i, ZOOM_IN + step * (i + 1)];
};

const ORDER = TABS.map((t) => t.key);

/** The home page section wrapping the preview, targeted by the "Preview" nav links. */
const SECTION_ID = "screenshots";

/** React Navigation's `shift` tab animation: a short horizontal slide toward the tab you picked, with a crossfade. */
const shift = {
  enter: (dir: number) => ({ x: dir * 50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -50, opacity: 0 }),
};

function PhoneScreen({ tab, onTab, className = "" }: { tab: TabKey; onTab: (tab: TabKey) => void; className?: string }) {
  const previous = useRef(tab);
  const direction = useRef(1);
  if (previous.current !== tab) {
    direction.current = ORDER.indexOf(tab) > ORDER.indexOf(previous.current) ? 1 : -1;
    previous.current = tab;
  }

  const screen = {
    home: <HomeScreen onTab={onTab} />,
    calendar: <CalendarScreen day={AUGUST_30} onTab={onTab} />,
    events: <EventsScreen onTab={onTab} />,
    parish: <ParishScreen onTab={onTab} />,
  }[tab];

  return (
    <PhoneFrame interactive label="Interactive Parohia preview" className={className}>
      <AnimatePresence initial={false} custom={direction.current}>
        <motion.div
          key={tab}
          custom={direction.current}
          variants={shift}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.42, 0, 0.58, 1] }}
          className="absolute inset-0 overflow-hidden bg-gray-50 dark:bg-black"
        >
          {screen}
        </motion.div>
      </AnimatePresence>
    </PhoneFrame>
  );
}

interface Reveal {
  /** Runs 0 to 1 while the section enters the viewport, then 1 to 2 across the pin. */
  timeline: MotionValue<number>;
  /** 0 at rest, 1 once zoomed in. */
  focus: MotionValue<number>;
  /** The phone's zoomed scale; cards rest at its inverse so both grow together. */
  zoom: MotionValue<number>;
  /** Resting horizontal offset of the cards from their centered spot. */
  restX: MotionValue<number>;
}

const STAGGER = 0.06;
const STAGGERED_ITEMS = TABS.length + 1;

const offsetWithin = (el: HTMLElement, root: Element) => {
  let top = 0;
  for (let node: HTMLElement | null = el; node && node !== root; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
};

/**
 * Rises in alongside the phone as the section scrolls into view, grows and glides into place with the zoom on its own
 * slightly staggered schedule, and slides back out while the pin zooms out.
 */
function Staggered({ reveal, index, children }: { reveal: Reveal; index: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  /** Vertical distance from the card list's center, so resting cards pack together as if the whole list were scaled. */
  const fromCenter = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    const root = el?.closest("[data-cards]");
    if (!el || !root) return;
    const measure = () => fromCenter.set(offsetWithin(el, root) + el.offsetHeight / 2 - (root as HTMLElement).offsetHeight / 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [fromCenter]);

  const enter = 0.35 + index * 0.05;
  const exit = 1 + ZOOM_OUT + index * 0.015;
  const own = useTransform(reveal.focus, (f) => Math.min(Math.max((f - index * STAGGER) / (1 - STAGGER * (STAGGERED_ITEMS - 1)), 0), 1));
  const scale = useTransform([own, reveal.zoom], ([f, z]: number[]) => 1 / z + (1 - 1 / z) * f);
  const opacity = useTransform(reveal.timeline, [enter, enter + 0.4, exit, exit + 0.05], [0, 1, 1, 0]);
  const rise = useTransform(reveal.timeline, [enter, enter + 0.5], [60, 0]);
  const slide = useTransform(reveal.timeline, [exit, exit + 0.05], [0, -40]);
  const x = useTransform([own, reveal.restX, slide], ([f, rest, s]: number[]) => rest * (1 - f) + s);
  const y = useTransform([rise, scale, fromCenter], ([r, sc, d]: number[]) => r + d * (sc - 1));
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  return (
    <motion.div ref={ref} style={{ opacity, x, y, scale, visibility, transformOrigin: "left center" }}>
      {children}
    </motion.div>
  );
}

function TabList({ tab, onSelect, reveal }: { tab: TabKey; onSelect: (tab: TabKey) => void; reveal?: Reveal }) {
  return (
    <ul className="flex flex-col gap-2">
      {TABS.map((t, i) => {
        const active = t.key === tab;
        const button = (
          <button
            type="button"
            onClick={() => onSelect(t.key)}
            aria-pressed={active}
            className={`relative flex w-full items-start gap-4 rounded-[24px] p-5 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand-red/60 ${
              active ? "" : "hover:bg-zinc-100/70 dark:hover:bg-white/[0.03]"
            }`}
          >
            {active && (
              <motion.span
                layoutId="preview-active"
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="absolute inset-0 rounded-[24px] border border-zinc-200 bg-white shadow-[0_12px_32px_-18px_rgba(9,9,11,0.25)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none"
              />
            )}
            <span
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
                active ? "bg-brand-gradient text-white" : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400"
              }`}
            >
              <Icon name={t.icon} size={19} />
            </span>
            <span className="relative block">
              <span
                className={`block font-display text-[26px] leading-[1.15] ${active ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                {t.title}
              </span>
              <span
                className={`mt-1 block text-[15px] leading-relaxed transition-colors duration-300 ${active ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"}`}
              >
                {t.body}
              </span>
            </span>
          </button>
        );
        return (
          <li key={t.key}>
            {reveal ? (
              <Staggered reveal={reveal} index={i}>
                {button}
              </Staggered>
            ) : (
              button
            )}
          </li>
        );
      })}
    </ul>
  );
}

function StaticPreview() {
  const [tab, setTab] = useState<TabKey>("home");
  const step = (delta: number) => setTab(ORDER[(ORDER.indexOf(tab) + delta + ORDER.length) % ORDER.length]);
  return (
    <>
      <div className="flex w-full flex-col items-center lg:hidden">
        <div className="relative flex w-full justify-center">
          <PhoneScreen tab={tab} onTab={setTab} className="[--s:0.85]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex w-[min(calc(100vw-0.5rem),calc(410px*0.85+7rem))] -translate-x-1/2 items-center justify-between">
            <button
              type="button"
              aria-label="Previous screen"
              onClick={() => step(-1)}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-[0_8px_20px_-12px_rgba(9,9,11,0.45)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-red/60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <Icon name="chevron-back" size={18} />
            </button>
            <button
              type="button"
              aria-label="Next screen"
              onClick={() => step(1)}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-[0_8px_20px_-12px_rgba(9,9,11,0.45)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-red/60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <Icon name="chevron-forward" size={18} />
            </button>
          </div>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
          <Icon name="hand-left-outline" size={15} />
          Tap inside, or use the arrows to switch screens.
        </p>
      </div>
      <div className="hidden items-center gap-20 lg:grid lg:grid-cols-[minmax(0,1fr)_auto]">
        <TabList tab={tab} onSelect={setTab} />
        <div className="flex flex-col items-center">
          <PhoneScreen tab={tab} onTab={setTab} className="[--s:0.84]" />
          <p className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <Icon name="hand-left-outline" size={15} />
            Tap, scroll, and switch tabs. It all works.
          </p>
        </div>
      </div>
    </>
  );
}

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** Pin progress where the phone has faded out. */
const EXITED = 0.97;
/** Point in the section's entry (0 to 1) where the zoom-in starts, before the pin locks. */
const FOCUS_START = 0.45;

/** Minimum viewport padding around the centered cards-and-phone group, and the gap between them. */
const EDGE = 48;
const GAP = 56;
/** Resting inset of the cards from the stage's left edge, matching the phone's `pr-4` on the right. */
const REST_INSET = 16;
const cardWidth = (viewport: number) => (viewport >= 1536 ? 416 : viewport >= 1440 ? 368 : 320);

/** Pins the preview while scrolling: zoom in with the cards centered alongside, step through each tab, then zoom back out. */
function PinnedPreview() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<TabKey>("home");
  const [phoneScale, setPhoneScale] = useState(0.72);
  const [list, setList] = useState({ left: EDGE, width: 320 });
  /**
   * Zoomed phone scale and horizontal travel into the centered group, measured from the resting layout.
   * `listX` is the cards' resting offset from their centered spot, mirroring the phone at the opposite edge.
   */
  const target = { zoom: useMotionValue(1.3), x: useMotionValue(0), listX: useMotionValue(0) };

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const { scrollYProgress: entry } = useScroll({
    target: trackRef,
    offset: ["start end", "start start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.6 });

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      const s = Math.min(0.9, (vh * 0.72) / DEVICE.height);
      const card = cardWidth(vw);
      const fit = vw - 2 * EDGE - card - GAP;
      const width = Math.min(DEVICE.width * s * Math.min(1.45, (vh * 0.97) / (DEVICE.height * s)), fit);
      const left = Math.max(EDGE, (vw - card - GAP - width) / 2);
      setPhoneScale(s);

      requestAnimationFrame(() => {
        const stage = stageRef.current?.getBoundingClientRect();
        const slot = slotRef.current?.getBoundingClientRect();
        if (!stage || !slot) return;
        target.zoom.set(Math.max(1, width / (DEVICE.width * s)));
        target.x.set(left + card + GAP + width / 2 - (slot.right - (DEVICE.width * s) / 2));
        target.listX.set(stage.left + REST_INSET - left);
        setList({ left: left - stage.left, width: card });
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const rawTimeline = useTransform([entry, scrollYProgress], ([e, p]: number[]) => (p > 0 ? 1 + p : e));
  const rawFocus = useTransform(rawTimeline, (t) => {
    if (t < 1 + ZOOM_IN) return easeInOut((t - FOCUS_START) / (1 + ZOOM_IN - FOCUS_START));
    if (t > 1 + ZOOM_OUT) return easeOut((2 - t) / (1 - ZOOM_OUT));
    return 1;
  });
  const focus = useSpring(rawFocus, { stiffness: 220, damping: 34, mass: 0.6 });
  const zoom = useTransform([focus, target.zoom], ([f, z]: number[]) => 1 + (z - 1) * f);
  const x = useTransform([focus, target.x], ([f, tx]: number[]) => tx * f);
  const timeline = useTransform([entry, scrollYProgress, smooth], ([e, p, s]: number[]) => (p > 0 ? 1 + s : e));
  const phoneOpacity = useTransform(timeline, [0.35, 0.85, 1 + ZOOM_OUT + 0.02, 1 + ZOOM_OUT + 0.09], [0, 1, 1, 0]);
  const phoneY = useTransform(entry, [0.35, 1], [80, 0]);
  const fill = useTransform(smooth, [ZOOM_IN, ZOOM_OUT], [0, 1]);
  const barOpacity = useTransform(focus, [0.92, 1], [0, 1]);
  const reveal: Reveal = { timeline, focus, zoom: target.zoom, restX: target.listX };

  useMotionValueEvent(rawTimeline, "change", (t) => {
    const p = t - 1;
    const i = Math.floor(((p - ZOOM_IN) / (ZOOM_OUT - ZOOM_IN)) * TABS.length);
    setTab(TABS[Math.min(Math.max(i, 0), TABS.length - 1)].key);
    document.documentElement.dataset.immersive = t > 0.85 && p < 0.98 ? "true" : "false";
  });

  /** Once a downward scroll settles past the faded-out phone, glide on to center the next section. */
  useEffect(() => {
    let timer = 0;
    let lastY = window.scrollY;
    let down = false;
    let gliding = false;

    const glide = () => {
      const track = trackRef.current;
      const next = track?.closest("section")?.nextElementSibling;
      if (!track || !next || !down) return;
      const progress = -track.getBoundingClientRect().top / (track.offsetHeight - window.innerHeight);
      const rect = next.getBoundingClientRect();
      const offset = rect.height < window.innerHeight ? (rect.height - window.innerHeight) / 2 : 0;
      if (progress < EXITED || rect.top + offset < 2) return;
      gliding = true;
      window.setTimeout(onScrollEnd, 1200);
      window.scrollTo({ top: window.scrollY + rect.top + offset, behavior: "smooth" });
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) down = y > lastY;
      lastY = y;
      window.clearTimeout(timer);
      if (!gliding) timer = window.setTimeout(glide, 140);
    };
    const onScrollEnd = () => void (gliding = false);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, []);

  useEffect(() => () => void delete document.documentElement.dataset.immersive, []);

  useEffect(() => {
    const scrollToFocused = (behavior: ScrollBehavior) => {
      const track = trackRef.current;
      if (!track) return;
      const top = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (track.offsetHeight - window.innerHeight) * (ZOOM_IN + 0.02), behavior });
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.hash !== `#${SECTION_ID}` || link.pathname !== window.location.pathname) return;
      event.preventDefault();
      history.replaceState(history.state, "", `#${SECTION_ID}`);
      scrollToFocused("smooth");
    };
    if (window.location.hash === `#${SECTION_ID}`) requestAnimationFrame(() => scrollToFocused("instant"));
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const select = (key: TabKey) => {
    const track = trackRef.current;
    if (!track) return;
    const [start, end] = segment(TABS.findIndex((t) => t.key === key));
    const top = track.getBoundingClientRect().top + window.scrollY;
    const distance = track.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + distance * ((start + end) / 2),
      behavior: "smooth",
    });
  };

  return (
    <div ref={trackRef} className="relative h-[460vh]">
      <div ref={stageRef} className="sticky top-0 h-[100dvh]">
        <div data-cards className="absolute top-1/2 z-10 -translate-y-1/2" style={{ left: list.left, width: list.width }}>
          <div className="relative">
            <TabList tab={tab} onSelect={select} reveal={reveal} />
            <motion.span
              style={{ left: list.width + GAP / 2 - 1.5, opacity: barOpacity }}
              className="absolute inset-y-4 block w-[3px] overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"
            >
              <motion.span style={{ scaleY: fill }} className="absolute inset-0 origin-top rounded-full bg-brand-gradient" />
            </motion.span>
          </div>
          <Staggered reveal={reveal} index={TABS.length}>
            <p className="mt-6 flex items-center gap-2 pl-5 text-sm text-zinc-500">
              <Icon name="hand-left-outline" size={15} />
              Keep scrolling, or tap a screen to jump to it.
            </p>
          </Staggered>
        </div>
        <div className="flex h-full items-center justify-end pr-4">
          <motion.div ref={slotRef} style={{ opacity: phoneOpacity, y: phoneY }}>
            <motion.div
              style={
                {
                  scale: zoom,
                  x,
                  "--s": phoneScale,
                } as unknown as CSSProperties
              }
            >
              <PhoneScreen tab={tab} onTab={select} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function AppPreview() {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return wide && !reduce ? <PinnedPreview /> : <StaticPreview />;
}
