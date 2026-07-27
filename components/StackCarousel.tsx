"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselImage = {
  src: string;
  alt: string;
};

interface StackCarouselProps {
  images: CarouselImage[];
  autoPlayMs?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function StackCarousel({
  images,
  autoPlayMs = 0,
}: StackCarouselProps) {
  const [order, setOrder] = useState<number[]>(() =>
    images.map((_, idx) => idx)
  );
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;

  const advance = useCallback(() => {
    setOrder((prev) => (prev.length ? [...prev.slice(1), prev[0]] : prev));
  }, []);

  const retreat = useCallback(() => {
    setOrder((prev) =>
      prev.length ? [prev[prev.length - 1], ...prev.slice(0, -1)] : prev
    );
  }, []);

  useEffect(() => {
    if (total <= 1) return;
    if (isPaused) return;
    if (!autoPlayMs || autoPlayMs <= 0) return;
    const id = setInterval(advance, autoPlayMs);
    return () => clearInterval(id);
  }, [advance, autoPlayMs, isPaused, total]);

  const positions = useMemo(() => {
    const visibleCount = clamp(total, 0, 1);
    return order.slice(0, visibleCount);
  }, [order, total]);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const startX = touchStartX.current;
      if (startX == null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX;
      const delta = endX - startX;
      if (Math.abs(delta) > 30) {
        if (delta > 0) {
          retreat();
        } else {
          advance();
        }
      }
      touchStartX.current = null;
    },
    [advance, retreat]
  );

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-6xl select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") retreat();
        if (e.key === "ArrowRight") advance();
      }}
      tabIndex={0}
      aria-roledescription="carousel"
    >
      <div className="relative h-[600px] md:h-[740px]">
        {positions.map((imageIndex, stackIndex) => {
          const depth = stackIndex;
          const translateY = depth * 14;
          const scale = 1 - depth * 0.07;
          const opacity = 1 - depth * 0.08;
          const z = 50 - depth;

          return (
            <div
              key={`${imageIndex}-${depth}`}
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: z }}
              aria-hidden={depth !== 0}
            >
              <div
                className="relative h-full aspect-[9/19.5] rounded-2xl overflow-hidden bg-transparent"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  transition:
                    "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
                  opacity,
                }}
              >
                <img
                  src={images[imageIndex].src}
                  alt={images[imageIndex].alt}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}

        {/* Left/Right previews */}
        {total > 1 && (
          <>
            {/* Previous */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
              style={{ zIndex: 20 }}
            >
              <div
                className="relative aspect-[9/19.5] rounded-2xl overflow-hidden bg-transparent"
                style={{
                  height: "86%",
                  transform: "translateY(36px) translateX(-28%) scale(0.9)",
                  opacity: 0.5,
                  transition:
                    "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
                }}
              >
                <img
                  src={images[order[order.length - 1]].src}
                  alt={images[order[order.length - 1]].alt}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>

            {/* Next */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
              style={{ zIndex: 20 }}
            >
              <div
                className="relative aspect-[9/19.5] rounded-2xl overflow-hidden bg-transparent"
                style={{
                  height: "86%",
                  transform: "translateY(36px) translateX(28%) scale(0.9)",
                  opacity: 0.5,
                  transition:
                    "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
                }}
              >
                <img
                  src={images[order[1 % total] ?? 0].src}
                  alt={images[order[1 % total] ?? 0].alt}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </>
        )}

        {/* Navigation buttons */}
        <button
          type="button"
          onClick={retreat}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/40 text-zinc-600 dark:text-white/80 backdrop-blur-md hover:bg-zinc-100 dark:hover:bg-black/60 hover:text-zinc-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-colors"
          aria-label="Previous screenshot"
          style={{ zIndex: 60 }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={advance}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/40 text-zinc-600 dark:text-white/80 backdrop-blur-md hover:bg-zinc-100 dark:hover:bg-black/60 hover:text-zinc-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-colors"
          aria-label="Next screenshot"
          style={{ zIndex: 60 }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Ambient glow behind carousel */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[70%] w-[60%] rounded-[40%] bg-brand-red/8 blur-3xl" />
      </div>

      {/* Dot indicators */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {images.map((_, i) => {
          const active = order[0] === i;
          return (
            <button
              type="button"
              key={i}
              onClick={() => {
                const idx = order.indexOf(i);
                if (idx === -1) return;
                setOrder((prev) => [
                  ...prev.slice(idx),
                  ...prev.slice(0, idx),
                ]);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                active
                  ? "w-6 bg-zinc-900 dark:bg-white"
                  : "w-2 bg-zinc-300 dark:bg-white/30 hover:bg-zinc-400 dark:hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
