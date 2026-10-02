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
const FOLLOW = { stiffness: 260, damping: 34, mass: 0.9 };
const EASE = [0.16, 1, 0.3, 1] as const;

/** Scroll distance given to each note while pinned, plus a short hold once every note is showing. */
const STEP_VH = 50;
const HOLD_STEPS = 0.6;
/** Pin progress where note `i` of `n` appears. */
const noteAt = (i: number, n: number) => (i + 0.05) / (n + HOLD_STEPS);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

function BlurPane({ show, style }: { show: boolean; style: MotionStyle }) {
  return (
    <motion.div
      className="absolute left-0 top-0 bg-gray-50/25 backdrop-blur-[5px] dark:bg-black/35"
      style={style}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    />
  );
}

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
  const [canHover, setCanHover] = useState(false);
  /** False while the highlighted area is scrolled partly out of the phone's visible screen. */
  const [attached, setAttached] = useState(true);
  const [direction, setDirection] = useState(1);
  /** How many notes the pinned scroll has revealed so far. */
  const [revealed, setRevealed] = useState(0);
  const [phoneScale, setPhoneScale] = useState(0.82);
  /** True once the pinned section starts scrolling away and the phone eases out. */
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const note = notes[active];
  const screenIndex = note.screen;
  const playing = autoplay && inView && !hovering && !reduce && !pinned;
  const spotlight = measured && (!pinned || (revealed > 0 && !leaving));

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
  };
  const hx = useSpring(raw.hx, FOLLOW);
  const hy = useSpring(raw.hy, FOLLOW);
  const hw = useSpring(raw.hw, FOLLOW);
  const hh = useSpring(raw.hh, FOLLOW);
  const sx = useSpring(raw.sx, FOLLOW);
  const sy = useSpring(raw.sy, FOLLOW);
  // The connector ends on the hole's edge, derived from the same springs so it can never drift off the red outline.
  const ex = useTransform([raw.ox, hx, hw, raw.side], ([o, x, w, side]: number[]) => o + x + (side ? w : 0));
  const ey = useTransform([raw.oy, hy, hh], ([o, y, h]: number[]) => o + y + h / 2);
  const springs = [hx, hy, hw, hh, sx, sy];
  const [radius, setRadius] = useState(0);
  const belowY = useTransform([hy, hh], ([y, h]: number[]) => y + h);
  const belowH = useTransform([raw.oh, hy, hh], ([o, y, h]: number[]) => Math.max(o - y - h, 0));
  const leftW = useTransform(hx, (x) => Math.max(x, 0));
  const rightX = useTransform([hx, hw], ([x, w]: number[]) => x + w);
  const rightW = useTransform([raw.ow, hx, hw], ([o, x, w]: number[]) => Math.max(o - x - w, 0));
  const ringX = useTransform([raw.ox, hx], ([o, x]: number[]) => o + x);
  const ringY = useTransform([raw.oy, hy], ([o, y]: number[]) => o + y);

  const path = useTransform([sx, sy, ex, ey], ([a, b, c, d]: number[]) => {
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
  useMotionValueEvent(exit, "change", (o) => setLeaving(o > 0.04));

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

    const dot = dotRefs.current[activeRef.current];
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
    scroller.scrollTo({ top: Math.max(offset - scroller.clientHeight * 0.24, 0), behavior: reduce ? "auto" : "smooth" });
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
    let pending = 0;
    const onScroll = () => {
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

  const zoomFrame = useRef(0);
  useMotionValueEvent(phoneZoom, "change", () => {
    if (!pinned || zoomFrame.current) return;
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
  const blur = outlined && canHover;

  const grid = (
    <div
      ref={containerRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className={`relative grid items-center gap-x-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] ${pinned ? "mx-auto w-full max-w-[1120px]" : "mt-12 lg:mt-16"}`}
    >
      <ol className="hidden flex-col gap-12 lg:flex">{sides.left.map(renderNote)}</ol>

      <div className="flex flex-col items-center">
        <motion.div
          onPointerEnter={(e) => e.pointerType === "mouse" && setPhoneHover(true)}
          onPointerLeave={() => setPhoneHover(false)}
          onPointerDown={() => setAutoplay(false)}
          style={pinned ? ({ opacity: phoneOpacity, scale: phoneZoom, "--s": phoneScale } as unknown as MotionStyle) : undefined}
        >
          <PhoneFrame
            interactive
            label={`${title}: interactive preview`}
            screenRef={screenRef}
            statusTone={screens[screenIndex].statusTone}
            className={pinned ? "" : "[--s:0.76] sm:[--s:0.8] lg:[--s:0.82]"}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={screenIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -48 }}
                transition={{ duration: 0.42, ease: EASE }}
                className="absolute inset-0 bg-gray-50 dark:bg-black"
              >
                {screens[screenIndex].render()}
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </motion.div>

        {screens.length > 1 && !pinned && (
          <div className="mt-8 flex rounded-full border border-zinc-200 bg-zinc-100/80 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            {screens.map((screen, i) => {
              const current = i === screenIndex;
              return (
                <button
                  key={screen.label}
                  type="button"
                  onClick={() => go(notes.findIndex((n) => n.screen === i))}
                  aria-pressed={current}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-red/60"
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
        <BlurPane show={blur} style={{ width: raw.ow, height: hy }} />
        <BlurPane show={blur} style={{ y: belowY, width: raw.ow, height: belowH }} />
        <BlurPane show={blur} style={{ y: hy, width: leftW, height: hh }} />
        <BlurPane show={blur} style={{ x: rightX, y: hy, width: rightW, height: hh }} />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 rounded-[12px] ring-[3px] ring-brand-red"
        style={{ x: ringX, y: ringY, width: hw, height: hh }}
        initial={false}
        animate={{ opacity: outlined ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        {!reduce && (
          <motion.span
            className="absolute -inset-px rounded-[13px] border border-brand-red"
            animate={{ opacity: [0.35, 0], scale: [1, 1.06] }}
            transition={{ duration: 2.4, ease: "easeOut", repeat: Infinity }}
          />
        )}
      </motion.div>

      <motion.svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible lg:block"
        initial={false}
        animate={{ opacity: attached ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <AnimatePresence>
          {spotlight && (
            <motion.g key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
              <motion.path
                d={path}
                fill="none"
                stroke="#FA433F"
                strokeWidth={1.5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : 0.75, ease: EASE, delay: reduce ? 0 : 0.18 }}
              />
              <motion.circle
                cx={ex}
                cy={ey}
                r={4.5}
                fill="#FA433F"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 300, delay: reduce ? 0 : 0.8 }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </div>
  );

  const stepper = (
    <div className="mx-auto mt-10 max-w-md lg:hidden">
      <div className="flex gap-1.5" role="tablist" aria-label={`${title} highlights`}>
        {notes.map((n, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={n.title}
            onClick={() => go(i)}
            className="relative h-1 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"
          >
            {i === active && (
              <motion.span
                key={`${active}-${playing}`}
                className="absolute inset-0 origin-left rounded-full bg-brand-red"
                initial={{ scaleX: playing ? 0 : 1 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: playing ? AUTOPLAY_MS / 1000 : 0, ease: "linear" }}
              />
            )}
            {i < active && <span className="absolute inset-0 rounded-full bg-brand-red/40" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mt-6 flex min-h-[132px] items-start gap-4"
        >
          <span className="mt-[9px] h-3 w-3 shrink-0 rounded-full bg-brand-red shadow-[0_0_0_5px_rgba(250,67,63,0.16)]" />
          <div className="flex-1">
            <p className="font-display text-[26px] leading-[1.15] text-zinc-900 dark:text-white">{note.title}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{note.body}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-2 flex justify-end gap-2">
        {(["chevron-back", "chevron-forward"] as const).map((icon, i) => (
          <button
            key={icon}
            type="button"
            aria-label={i === 0 ? "Previous highlight" : "Next highlight"}
            onClick={() => go((active + (i === 0 ? notes.length - 1 : 1)) % notes.length)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition active:scale-95 dark:border-white/10 dark:text-zinc-200"
          >
            <Icon name={icon} size={18} />
          </button>
        ))}
      </div>
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
          {stepper}
        </div>
      )}
    </section>
  );
}
