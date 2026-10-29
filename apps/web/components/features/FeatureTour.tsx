"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "../Icon";
import { DEVICE, PhoneFrame } from "../phone/PhoneFrame";

export interface TourNote {
  /** Index into `screens` that shows this note's target. */
  screen: number;
  /** `data-spot` value of the element the note points at. */
  spot: string;
  side: "left" | "right";
  title: string;
  body: string;
}

export interface TourScreen {
  label: string;
  render: () => ReactNode;
  statusTone?: "auto" | "light";
}

interface FeatureTourProps {
  id: string;
  title: string;
  intro: string;
  screens: TourScreen[];
  notes: TourNote[];
  /** Pin the tour while scrolling and step through its notes with the scroll, instead of autoplaying. */
  pinned?: boolean;
}

const AUTOPLAY_MS = 6500;
/** Mobile: how long a tap keeps the phone clear (no blur or note card). */
const PHONE_CLEAR_MS = 1000;
/** Mobile: brief clear while the highlight moves to the next feature. */
const FEATURE_CHANGE_CLEAR_MS = 480;
const FOLLOW = { stiffness: 260, damping: 34, mass: 0.9 };
const EASE = [0.16, 1, 0.3, 1] as const;

/** Scroll distance given to each note while pinned, plus a short hold once every note is showing. */
const STEP_VH = 50;
const HOLD_STEPS = 0.6;
/** Pin progress where note `i` of `n` appears. */
const noteAt = (i: number, n: number) => (i + 0.05) / (n + HOLD_STEPS);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
/** Screen space kept free around the phone below lg. */
const COMPACT_MARGIN = 40;
const CARD_GAP = 28;
/** How far the card may hang past the phone's screen before it has to close in on the highlight. */
const CARD_OVERHANG = 56;

/** Space kept between the floating card and the viewport edge when the page scrolls it into view. */
const CARD_VIEWPORT_PAD = 16;

/** Scrolls the page while flagging it as automatic, so scroll-driven UI like the hiding header can ignore it. */
function autoScrollBy(dy: number, instant: boolean) {
  const root = document.documentElement;
  root.dataset.autoScroll = "true";
  let timer = 0;
  const done = () => {
    window.clearTimeout(timer);
    window.removeEventListener("scrollend", done);
    delete root.dataset.autoScroll;
  };
  window.addEventListener("scrollend", done);
  timer = window.setTimeout(done, 1000);
  window.scrollBy({ top: dy, behavior: instant ? "auto" : "smooth" });
}

/** Below lg the note card floats over the phone: under the highlight when it fits there, otherwise above it. */
function placeCard(o: number, y: number, h: number, oh: number, ch: number) {
  const below = oh - (y + h);
  const need = ch + CARD_GAP;
  const under = below >= need || (y < need && below >= y);
  const top = under
    ? Math.min(o + y + h + CARD_GAP, o + oh + CARD_OVERHANG - ch)
    : Math.max(o + y - CARD_GAP - ch, o - CARD_OVERHANG);
  return { under, top };
}

/**
 * One continuous blur layer with the hole knocked out by a second mask layer.
 * Chrome ignores clip-path holes on backdrop-filter, separate panes leave seams where their blurs meet,
 * and a regenerated mask image decodes asynchronously, so the hole would lag its springs.
 */
const HOLE_MASK = "linear-gradient(#000 0 0), linear-gradient(#000 0 0)";

export function FeatureTour({ id, title, intro, screens, notes, pinned = false }: FeatureTourProps) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const inView = useInView(containerRef, { amount: 0.45 });

  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [phoneHover, setPhoneHover] = useState(false);
  const [measured, setMeasured] = useState(false);
  /** False while the highlighted area is scrolled partly out of the phone's visible screen. */
  const [attached, setAttached] = useState(true);
  const [direction, setDirection] = useState(1);
  /** How many notes the pinned scroll has revealed so far. */
  const [revealed, setRevealed] = useState(0);
  const [phoneScale, setPhoneScale] = useState(0.82);
  /** Below lg, the phone shrinks so it and the note card fit on one screen together. */
  const [compactScale, setCompactScale] = useState<number | null>(null);
  /** True once the pinned section starts scrolling away and the phone eases out. */
  const [leaving, setLeaving] = useState(false);
  /** Clears touch/scroll engagement so the ring returns once interaction settles. */
  const phoneIdle = useRef(0);
  /** True while a fine pointer is hovering the phone, matching desktop ring hide. */
  const stickyHover = useRef(false);
  /** True while revealTarget is scrolling the demo — don't treat that as a user peek. */
  const autoScrolling = useRef(false);
  const autoScrollDone = useRef(0);

  const engagePhone = (sticky: boolean, clearMs = PHONE_CLEAR_MS) => {
    setPhoneHover(true);
    window.clearTimeout(phoneIdle.current);
    if (sticky) {
      stickyHover.current = true;
      return;
    }
    if (stickyHover.current) return;
    phoneIdle.current = window.setTimeout(() => setPhoneHover(false), clearMs);
  };

  useEffect(
    () => () => {
      window.clearTimeout(phoneIdle.current);
      window.clearTimeout(autoScrollDone.current);
    },
    [],
  );

  const prevActiveForClear = useRef(active);
  useEffect(() => {
    if (prevActiveForClear.current === active) return;
    prevActiveForClear.current = active;
    // Below lg the note card floats over the phone — clear briefly so the highlight can
    // move, then restore blur/card on the new focus.
    if (compactScale !== null) engagePhone(false, FEATURE_CHANGE_CLEAR_MS);
  }, [active, compactScale]);

  const note = notes[active];
  const screenIndex = note.screen;
  const playing = autoplay && inView && !hovering && !reduce && !pinned;
  /** Hide the highlight while the phone is easing out between sections (pinned or mobile). */
  const spotlight = measured && !leaving && (!pinned || revealed > 0);

  const activeRef = useRef(active);
  activeRef.current = active;

  // Raw geometry is written into motion values so following scroll and screen transitions never re-renders React.
  const raw = {
    ox: useMotionValue(0),
    oy: useMotionValue(0),
    ow: useMotionValue(0),
    oh: useMotionValue(0),
    hx: useMotionValue(0),
    hy: useMotionValue(0),
    hw: useMotionValue(0),
    hh: useMotionValue(0),
    sx: useMotionValue(0),
    sy: useMotionValue(0),
    /** 1 when the active note sits right of the phone, so the connector meets the hole's right edge. */
    side: useMotionValue(0),
    /** 1 below the lg layout, where the note sits under the phone and the connector meets the ring's bottom edge. */
    mobile: useMotionValue(0),
  };
  const hx = useSpring(raw.hx, FOLLOW);
  const hy = useSpring(raw.hy, FOLLOW);
  const hw = useSpring(raw.hw, FOLLOW);
  const hh = useSpring(raw.hh, FOLLOW);
  const sx = useSpring(raw.sx, FOLLOW);
  const sy = useSpring(raw.sy, FOLLOW);
  /** Tailwind `ring-[3px]` paints outside the box; the tip lands on that outer edge. */
  const RING = 3;
  /** Endpoint marker radius; kept outside the ring so only the tip touches. */
  const MARKER = 4.5;
  const cardRef = useRef<HTMLDivElement>(null);
  const cardH = useMotionValue(0);
  const placement = [raw.oy, hy, hh, raw.oh, cardH];
  const cardUnder = useTransform(placement, ([o, y, h, oh, ch]: number[]): number => (placeCard(o, y, h, oh, ch).under ? 1 : 0));
  const cardTarget = useTransform(placement, ([o, y, h, oh, ch]: number[]) => placeCard(o, y, h, oh, ch).top);
  const cardTop = useSpring(cardTarget, FOLLOW);
  const cardX = useTransform(raw.ox, (o) => o - 6);
  const cardW = useTransform(raw.ow, (w) => w + 12);
  // The connector ends on the hole's edge, derived from the same springs so it can never drift off the red outline.
  const ex = useTransform([raw.ox, hx, hw, raw.side, raw.mobile], ([o, x, w, side, m]: number[]) => {
    if (m) return o + x + w / 2;
    return o + x + (side ? w + RING : -RING);
  });
  const ey = useTransform([raw.oy, hy, hh, raw.mobile, cardUnder], ([o, y, h, m, under]: number[]) => {
    if (m) return under ? o + y + h + RING : o + y - RING;
    return o + y + h / 2;
  });
  const markerX = useTransform([ex, raw.side, raw.mobile], ([x, side, m]: number[]) => (m ? x : x + (side ? MARKER : -MARKER)));
  const markerY = useTransform([ey, raw.mobile, cardUnder], ([y, m, under]: number[]) => (m ? y + (under ? MARKER : -MARKER) : y));
  /** Where the mobile connector leaves the floating card; it collapses to nothing if the card has to overlap the highlight. */
  const cardEdge = useTransform([cardTop, cardH, cardUnder, ey], ([top, ch, under, end]: number[]) =>
    under ? Math.max(top, end) : Math.min(top + ch, end),
  );
  const springs = [hx, hy, hw, hh, sx, sy];
  const [radius, setRadius] = useState(0);
  const maskSize = useTransform([hw, hh], ([w, h]: number[]) => `${Math.max(w, 0)}px ${Math.max(h, 0)}px, 100% 100%`);
  const maskPosition = useTransform([hx, hy], ([x, y]: number[]) => `${x}px ${y}px, 0 0`);
  const ringX = useTransform([raw.ox, hx], ([o, x]: number[]) => o + x);
  const ringY = useTransform([raw.oy, hy], ([o, y]: number[]) => o + y);

  const path = useTransform([sx, sy, ex, ey, raw.mobile, cardEdge], ([a, b, c, d, m, edge]: number[]) => {
    if (m) return `M ${c} ${edge} L ${c} ${d}`;
    const bend = (c - a) * 0.55;
    return `M ${a} ${b} C ${a + bend} ${b}, ${c - bend} ${d}, ${c} ${d}`;
  });

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const { scrollYProgress: entry } = useScroll({ target: trackRef, offset: ["start end", "start start"] });
  const { scrollYProgress: exit } = useScroll({ target: trackRef, offset: ["end end", "end start"] });
  const easeIn = useSpring(entry, { stiffness: 220, damping: 34, mass: 0.6 });
  const easeOut = useSpring(exit, { stiffness: 220, damping: 34, mass: 0.6 });
  const phoneOpacity = useTransform([easeIn, easeOut], ([i, o]: number[]) => Math.min(clamp01((i - 0.3) / 0.55), 1 - clamp01((o - 0.15) / 0.55)));
  const phoneZoom = useTransform([easeIn, easeOut], ([i, o]: number[]) => 0.9 + 0.1 * Math.min(clamp01((i - 0.3) / 0.7), 1 - clamp01(o / 0.7)));
  // Match the phone opacity curve (starts dropping around 0.15) so overlays aren't yanked early.
  useMotionValueEvent(exit, "change", (o) => setLeaving(o > 0.18));

  const firstMeasure = useRef(true);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const screen = screenRef.current;
    if (!container || !screen) return;
    const current = notes[activeRef.current];
    const c = container.getBoundingClientRect();
    const s = screen.getBoundingClientRect();
    if (s.width === 0) return;
    const scale = s.width / DEVICE.screenWidth;

    raw.ox.set(s.left - c.left);
    raw.oy.set(s.top - c.top);
    raw.ow.set(s.width);
    raw.oh.set(s.height);

    const matches = screen.querySelectorAll<HTMLElement>(`[data-spot="${current.spot}"]`);
    const target = matches[matches.length - 1];
    if (target) {
      const t = target.getBoundingClientRect();
      const pad = 6 * scale;
      const scroller = target.closest("[data-scroll]");
      const tabBar = scroller ? scroller.parentElement?.querySelector(":scope > [data-tabbar]") : null;
      const floor = tabBar ? tabBar.getBoundingClientRect().top - 2 * pad : s.bottom - 14 * scale;
      const ceiling = s.top + 52 * scale;
      const top = Math.max(t.top, ceiling) - pad;
      const bottom = Math.min(t.bottom + pad, floor);
      const visible = Math.min(t.bottom, floor) - Math.max(t.top, ceiling);
      setAttached(visible >= t.height / 2);
      const left = Math.max(t.left, s.left + 4 * scale) - pad;
      const right = Math.min(t.right, s.right - 4 * scale) + pad;
      raw.hx.set(left - s.left);
      raw.hy.set(top - s.top);
      raw.hw.set(Math.max(right - left, 0));
      raw.hh.set(Math.max(bottom - top, 0));
      raw.side.set(current.side === "right" ? 1 : 0);
    }

    raw.mobile.set(window.matchMedia("(max-width: 1023px)").matches ? 1 : 0);

    const dots = container.querySelectorAll<HTMLElement>(`[data-note-dot="${activeRef.current}"]`);
    const dot = [...dots].find((el) => el.getClientRects().length > 0) ?? dotRefs.current[activeRef.current];
    const d = dot?.getBoundingClientRect();
    if (d && d.width > 0) {
      raw.sx.set(d.left + d.width / 2 - c.left);
      raw.sy.set(d.top + d.height / 2 - c.top);
    }

    setRadius(DEVICE.screenRadius * scale);
    if (firstMeasure.current) {
      firstMeasure.current = false;
      springs.forEach((spring, i) => spring.jump([raw.hx, raw.hy, raw.hw, raw.hh, raw.sx, raw.sy][i].get()));
      setMeasured(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const frame = useRef<number>();
  const track = useCallback(
    (ms: number) => {
      if (frame.current) cancelAnimationFrame(frame.current);
      const end = performance.now() + ms;
      const tick = () => {
        measure();
        if (performance.now() < end) frame.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [measure],
  );

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  // Bring the target into the phone's visible area, the way a person would scroll to it.
  const revealTarget = useCallback(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const current = notes[activeRef.current];
    const matches = screen.querySelectorAll<HTMLElement>(`[data-spot="${current.spot}"]`);
    const target = matches[matches.length - 1];
    const scroller = target?.closest<HTMLElement>("[data-scroll]");
    if (!target || !scroller) return;
    const scale = screen.getBoundingClientRect().width / DEVICE.screenWidth;
    const t = target.getBoundingClientRect();
    const sc = scroller.getBoundingClientRect();
    const visibleTop = sc.top + 70 * scale;
    const visibleBottom = sc.bottom - 130 * scale;
    if (t.top >= visibleTop && t.bottom <= visibleBottom) return;
    const offset = (t.top - sc.top) / scale + scroller.scrollTop;
    const top = Math.max(offset - scroller.clientHeight * 0.24, 0);
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

    // Mark programmatic scrolls so they animate without resetting the mobile card clear timer.
    const finish = () => {
      autoScrolling.current = false;
      window.clearTimeout(autoScrollDone.current);
    };
    autoScrolling.current = true;
    window.clearTimeout(autoScrollDone.current);
    scroller.addEventListener("scrollend", finish, { once: true });
    autoScrollDone.current = window.setTimeout(finish, behavior === "smooth" ? 1500 : 80);
    scroller.scrollTo({ top, behavior });
  }, [notes, reduce]);

  const previousScreen = useRef(screenIndex);
  useEffect(() => {
    const switched = previousScreen.current !== screenIndex;
    previousScreen.current = screenIndex;
    const timer = window.setTimeout(revealTarget, switched ? 380 : 40);
    track(switched ? 1400 : 1000);
    return () => window.clearTimeout(timer);
  }, [active, screenIndex, revealTarget, track]);

  useEffect(() => {
    const container = containerRef.current;
    const screen = screenRef.current;
    if (!container || !screen) return;
    const observer = new ResizeObserver(() => track(200));
    observer.observe(container);
    // Re-aim when interactive spots remount (e.g. volunteer button → progress bar after submit).
    const mutations = new MutationObserver(() => track(500));
    mutations.observe(screen, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-spot"] });
    let pending = 0;
    const onScroll = () => {
      // Only user peeks should clear the overlay — programmatic revealTarget scrolls must not
      // keep resetting the mobile clear timer until a long smooth scroll settles.
      if (!autoScrolling.current) engagePhone(false);
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        measure();
      });
    };
    const onPointerUp = () => track(800);
    screen.addEventListener("scroll", onScroll, { capture: true, passive: true });
    screen.addEventListener("pointerup", onPointerUp);
    document.fonts?.ready.then(() => track(200));
    return () => {
      observer.disconnect();
      mutations.disconnect();
      screen.removeEventListener("scroll", onScroll, { capture: true });
      screen.removeEventListener("pointerup", onPointerUp);
      if (pending) cancelAnimationFrame(pending);
    };
  }, [measure, track, pinned]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go((activeRef.current + 1) % notes.length, false), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, active, notes.length]);

  const activate = (index: number) => {
    setDirection(notes[index].screen >= notes[activeRef.current].screen ? 1 : -1);
    setActive(index);
  };

  const followScroll = (p: number) => {
    const n = notes.length;
    const count = p < noteAt(0, n) ? 0 : Math.min(Math.floor(p * (n + HOLD_STEPS) - 0.05) + 1, n);
    setRevealed((shown) => Math.max(shown, count));
    const target = Math.max(count - 1, 0);
    if (target !== activeRef.current) activate(target);
  };

  useMotionValueEvent(scrollYProgress, "change", (p) => pinned && followScroll(p));

  useEffect(() => {
    if (!pinned) return;
    followScroll(scrollYProgress.get());
    const update = () => setPhoneScale(Math.min(0.86, (window.innerHeight * 0.84) / DEVICE.height));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned]);

  useEffect(() => {
    if (pinned) return;
    const update = () => {
      if (!window.matchMedia("(max-width: 1023px)").matches) return setCompactScale(null);
      const byHeight = (window.innerHeight - COMPACT_MARGIN) / DEVICE.height;
      const byWidth = (document.documentElement.clientWidth - COMPACT_MARGIN) / DEVICE.width;
      setCompactScale(Math.max(0.5, Math.min(0.9, byHeight, byWidth)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [pinned]);

  const compact = compactScale !== null;
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let first = true;
    const observer = new ResizeObserver(() => {
      cardH.set(card.offsetHeight);
      if (first) cardTop.jump(cardTarget.get());
      first = false;
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [compact, cardH, cardTop, cardTarget]);

  useEffect(() => {
    if (measured) cardTop.jump(cardTarget.get());
  }, [measured, cardTop, cardTarget]);

  const cardVisibleRef = useRef(false);
  cardVisibleRef.current = compact && measured && !phoneHover && !leaving && inView && phoneOpacity.get() > 0.55;
  // Once the card settles, nudge the page so a card hanging past the viewport comes fully into view.
  useMotionValueEvent(cardTop, "animationComplete", () => {
    const card = cardRef.current;
    if (!card || !cardVisibleRef.current) return;
    const r = card.getBoundingClientRect();
    const dy = r.top < CARD_VIEWPORT_PAD ? r.top - CARD_VIEWPORT_PAD : Math.max(r.bottom - (window.innerHeight - CARD_VIEWPORT_PAD), 0);
    if (Math.abs(dy) > 1) autoScrollBy(dy, !!reduce);
  });

  const zoomFrame = useRef(0);
  useMotionValueEvent(phoneZoom, "change", () => {
    if (zoomFrame.current) return;
    zoomFrame.current = requestAnimationFrame(() => {
      zoomFrame.current = 0;
      measure();
    });
  });
  useEffect(() => () => cancelAnimationFrame(zoomFrame.current), []);

  const go = (index: number, fromUser = true) => {
    if (pinned) {
      const trackEl = trackRef.current;
      if (!trackEl) return;
      const n = notes.length;
      const top = trackEl.getBoundingClientRect().top + window.scrollY;
      const distance = trackEl.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + distance * (noteAt(index, n) + 0.5 / (n + HOLD_STEPS)), behavior: "smooth" });
      return;
    }
    if (fromUser) setAutoplay(false);
    activate(index);
  };

  const sides = { left: [] as number[], right: [] as number[] };
  notes.forEach((n, i) => sides[n.side].push(i));

  const renderNote = (i: number) => {
    const n = notes[i];
    const isActive = i === active;
    const shown = !pinned || i < revealed;
    const facesRight = n.side === "left";
    return (
      <li key={i}>
        <button
          type="button"
          onClick={() => go(i)}
          aria-pressed={isActive}
          tabIndex={shown ? undefined : -1}
          className={`group flex w-full items-start gap-4 rounded-2xl outline-none transition-[opacity,transform] duration-500 focus-visible:ring-2 focus-visible:ring-brand-red/60 ${
            facesRight ? "flex-row-reverse text-right" : "text-left"
          } ${!shown ? "pointer-events-none translate-y-3 opacity-0" : isActive ? "opacity-100" : "opacity-45 hover:opacity-80"}`}
        >
          <span
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            data-note-dot={i}
            className={`mt-[7px] h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-500 ${
              isActive
                ? "scale-110 border-brand-red bg-brand-red shadow-[0_0_0_5px_rgba(250,67,63,0.16)]"
                : "border-zinc-300 bg-transparent dark:border-zinc-600"
            }`}
          />
          <span className="block min-w-0">
            <span className="block font-display text-[26px] leading-[1.15] text-zinc-900 dark:text-white">{n.title}</span>
            <span className="mt-1.5 block text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{n.body}</span>
            <span className={`mt-3 block h-px overflow-hidden ${facesRight ? "ml-auto" : ""} w-16`}>
              {isActive && playing && (
                <motion.span
                  key={`${active}-progress`}
                  className={`block h-px bg-brand-red ${facesRight ? "origin-right" : "origin-left"}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                />
              )}
            </span>
          </span>
        </button>
      </li>
    );
  };

  const outlined = spotlight && attached && !phoneHover;
  /** Peek/hover only — section exit fades the card with the phone via `phoneOpacity`. */
  const cardShown = measured && !phoneHover;
  /** On mobile the connector hangs off the floating card, so it waits for the card to fade in before drawing. */
  const connected = spotlight && (!compact || cardShown);
  const drawDelay = reduce ? 0 : compact ? 0.08 : 0.18;
  const blur = outlined;

  const grid = (
    <div
      ref={containerRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className={`relative grid items-center gap-x-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${pinned ? "mx-auto w-full max-w-[1120px]" : "mt-12 lg:mt-16"}`}
    >
      <ol className="hidden flex-col gap-12 lg:flex">{sides.left.map(renderNote)}</ol>

      <div className="flex flex-col items-center max-lg:min-h-[100dvh] max-lg:justify-center max-lg:py-5">
        <motion.div
          onPointerEnter={(e) => e.pointerType === "mouse" && engagePhone(true)}
          onPointerLeave={(e) => {
            // Touch fires pointerleave on finger-up — don't cancel the tap clear delay.
            if (e.pointerType !== "mouse") return;
            stickyHover.current = false;
            window.clearTimeout(phoneIdle.current);
            setPhoneHover(false);
          }}
          onPointerDown={(e) => {
            setAutoplay(false);
            if (e.pointerType !== "mouse") engagePhone(false);
          }}
          style={
            {
              opacity: phoneOpacity,
              scale: phoneZoom,
              ...(pinned ? { "--s": phoneScale } : compactScale ? { "--s": compactScale } : {}),
            } as unknown as MotionStyle
          }
        >
          <PhoneFrame
            interactive
            label={`${title}: interactive preview`}
            screenRef={screenRef}
            statusTone={screens[screenIndex].statusTone}
            className={pinned || compactScale ? "" : "[--s:0.85] lg:[--s:0.82]"}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={screenIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * (compact ? 28 : 48) }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * (compact ? -28 : -48) }}
                transition={{ duration: compact ? 0.28 : 0.42, ease: EASE }}
                className="absolute inset-0 bg-gray-50 dark:bg-black"
              >
                {screens[screenIndex].render()}
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </motion.div>

        {screens.length > 1 && !pinned && (
          <div className="mt-8 hidden rounded-full border border-zinc-200 bg-zinc-100/80 p-1 lg:flex dark:border-white/10 dark:bg-white/[0.04]">
            {screens.map((screen, i) => {
              const current = i === screenIndex;
              return (
                <button
                  key={screen.label}
                  type="button"
                  onClick={() => go(notes.findIndex((n) => n.screen === i))}
                  aria-pressed={current}
                  className="relative rounded-full px-4 py-2.5 text-center text-sm font-semibold leading-tight outline-none focus-visible:ring-2 focus-visible:ring-brand-red/60"
                >
                  {current && (
                    <motion.span
                      layoutId={`${id}-screen-pill`}
                      transition={{ type: "spring", damping: 26, stiffness: 300 }}
                      className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-white/[0.12]"
                    />
                  )}
                  <span className={`relative ${current ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>{screen.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ol className="hidden flex-col gap-12 lg:flex">{sides.right.map(renderNote)}</ol>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-10 overflow-hidden"
        style={{ x: raw.ox, y: raw.oy, width: raw.ow, height: raw.oh, borderRadius: radius }}
      >
        <motion.div
          className="absolute inset-0 bg-gray-50/25 backdrop-blur-[5px] dark:bg-black/35"
          style={{
            maskImage: HOLE_MASK,
            WebkitMaskImage: HOLE_MASK,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskSize,
            WebkitMaskSize: maskSize,
            maskPosition,
            WebkitMaskPosition: maskPosition,
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
          }}
          initial={false}
          animate={{ opacity: blur ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 rounded-[12px] ring-[3px] ring-brand-red"
        style={{ x: ringX, y: ringY, width: hw, height: hh }}
        initial={false}
        animate={{ opacity: outlined ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      />

      <motion.svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        initial={false}
        animate={{ opacity: attached ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <AnimatePresence>
          {connected && (
            <motion.g key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <motion.path
                d={path}
                fill="none"
                stroke="#FA433F"
                strokeWidth={1.5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : compact ? 0.42 : 0.75, ease: EASE, delay: drawDelay }}
              />
              <motion.circle
                cx={markerX}
                cy={markerY}
                r={MARKER}
                fill="#FA433F"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 14,
                  stiffness: 300,
                  delay: reduce ? 0 : drawDelay + (compact ? 0.32 : 0.62),
                }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>

      {compact && (
        <motion.div
          ref={cardRef}
          className="absolute left-0 top-0 z-40 lg:hidden"
          style={{ x: cardX, y: cardTop, width: cardW, opacity: phoneOpacity }}
        >
          <motion.div
            initial={false}
            animate={{ opacity: cardShown ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            className={`overflow-hidden rounded-[22px] border border-zinc-200 bg-white/[0.97] shadow-[0_18px_40px_-18px_rgba(9,9,11,0.45)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/[0.97] ${
              phoneHover ? "pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between px-4 pt-3.5">
              <div className="flex items-center gap-1.5" role="tablist" aria-label={`${title} highlights`}>
                {notes.map((n, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={n.title}
                    onClick={() => go(i)}
                    className={`h-2 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-red/60 ${
                      i === active ? "w-5 bg-brand-red" : "w-2 bg-zinc-300 dark:bg-white/25"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous highlight"
                  onClick={() => go((active + notes.length - 1) % notes.length)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-red/60 dark:border-white/10 dark:text-zinc-200"
                >
                  <Icon name="chevron-back" size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Next highlight"
                  onClick={() => go((active + 1) % notes.length)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8D0300] text-white outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-red/60"
                >
                  <Icon name="chevron-forward" size={15} />
                </button>
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.16, ease: EASE }}
                className="px-4 pb-4 pt-2"
              >
                <p className="font-display text-[22px] leading-[1.15] text-zinc-900 dark:text-white">{note.title}</p>
                <p className="mt-1 text-[15px] leading-[1.5] text-zinc-600 dark:text-zinc-300">{note.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="h-0.5 w-full bg-zinc-100 dark:bg-white/[0.06]">
              {playing && (
                <motion.span
                  key={`${active}-progress`}
                  className="block h-full w-full origin-left bg-brand-red"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );

  return (
    <section id={id} className={`relative scroll-mt-24 ${pinned ? "pt-20 md:pt-28" : "py-20 md:py-28"}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <h2 className="font-display text-[40px] leading-[1.08] tracking-[-0.01em] text-zinc-900 sm:text-5xl dark:text-white">{title}</h2>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{intro}</p>
        </motion.div>
      </div>

      {pinned ? (
        <div
          ref={trackRef}
          data-track={id}
          data-focus={noteAt(0, notes.length) + 0.002}
          className="relative"
          style={{ height: `calc(100vh + ${(notes.length + HOLD_STEPS) * STEP_VH}vh)` } as CSSProperties}
        >
          <div className="sticky top-0 flex h-[100dvh] items-center pl-[272px] pr-10">{grid}</div>
        </div>
      ) : (
        <div ref={trackRef} className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {grid}
        </div>
      )}
    </section>
  );
}
