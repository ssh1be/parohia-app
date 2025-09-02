"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CarouselImage = {
  src: string;
  alt: string;
};

interface StackCarouselProps {
  images: CarouselImage[];
  autoPlayMs?: number; // set <= 0 to disable autoplay
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function StackCarousel({ images, autoPlayMs = 0 }: StackCarouselProps) {
  const [order, setOrder] = useState<number[]>(() => images.map((_, idx) => idx));
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;

  const advance = useCallback(() => {
    setOrder((prev) => (prev.length ? [...prev.slice(1), prev[0]] : prev));
  }, []);

  const retreat = useCallback(() => {
    setOrder((prev) => (prev.length ? [prev[prev.length - 1], ...prev.slice(0, -1)] : prev));
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

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
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
  }, [advance, retreat]);

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
          const depth = stackIndex; // 0 is top
          const translateY = depth * 14; // px
          const scale = 1 - depth * 0.07; // shrink slightly per layer
          const rotate = 0; // remove tilt
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
                className="relative h-[100%] md:h-[100%] aspect-[9/19.5] rounded-xl overflow-hidden shadow-2xl"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                  transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
                  opacity,
                }}
              >
                <img
                  src={images[imageIndex].src}
                  alt={images[imageIndex].alt}
                  className="h-full w-full object-contain bg-black/10"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}

        {/* Left/Right low-opacity previews */}
        {total > 1 && (
          <>
            {/* Previous */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
              style={{ zIndex: 20 }}
            >
              <div
                className="relative aspect-[9/19.5] rounded-xl overflow-hidden shadow-xl"
                style={{
                  height: "86%",
                  transform: "translateY(36px) translateX(-28%) scale(0.9)",
                  opacity: 0.6,
                  transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
                }}
              >
                <img
                  src={images[order[order.length - 1]].src}
                  alt={images[order[order.length - 1]].alt}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/40" />
              </div>
            </div>

            {/* Next */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
              style={{ zIndex: 20 }}
            >
              <div
                className="relative aspect-[9/19.5] rounded-xl overflow-hidden shadow-xl"
                style={{
                  height: "86%",
                  transform: "translateY(36px) translateX(28%) scale(0.9)",
                  opacity: 0.6,
                  transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
                }}
              >
                <img
                  src={images[order[1 % total] ?? 0].src}
                  alt={images[order[1 % total] ?? 0].alt}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/40" />
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={retreat}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 backdrop-blur-sm hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Previous screenshot"
          style={{ zIndex: 60 }}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={advance}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 backdrop-blur-sm hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Next screenshot"
          style={{ zIndex: 60 }}
        >
          ›
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[70%] w-[60%] rounded-[40%] bg-red-900/10 blur-3xl" />
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5">
        {images.map((_, i) => {
          const active = order[0] === i;
          return (
            <button
              type="button"
              key={i}
              onClick={() => {
                // rotate order so that i becomes first
                const idx = order.indexOf(i);
                if (idx === -1) return;
                setOrder((prev) => {
                  const offset = idx;
                  return [...prev.slice(offset), ...prev.slice(0, offset)];
                });
              }}
              className={`h-1.5 rounded-full transition-all ${active ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}