import React from "react";
import { ArrowRight } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import PageFooter from "../../components/PageFooter";

function FeatureBlock({
  id,
  image,
  placeholderLabel,
}: {
  id: string;
  image?: { src: string; alt: string };
  placeholderLabel: string;
}) {
  return (
    <section id={id} className="relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-center justify-center">
          {image ? (
            <>
              {/* Desktop/tablet: show full image */}
              <div className="relative rounded-2xl overflow-hidden hidden md:block">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="mx-auto w-full max-w-full h-auto rounded-xl"
                />
              </div>
              {/* Mobile: split image vertically into two stacked halves */}
              <div className="relative rounded-2xl md:hidden w-full">
                <div className="flex flex-col gap-3">
                  <div className="relative overflow-hidden rounded-xl w-full">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-[200%] max-w-none h-auto transform"
                    />
                  </div>
                  <div className="relative overflow-hidden rounded-xl w-full">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-[200%] max-w-none h-auto transform -translate-x-1/2"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-4 w-full max-w-5xl">
              <div className="flex h-64 md:h-96 w-full items-center justify-center rounded-xl bg-white/[0.02]">
                <div className="text-center text-zinc-500">
                  <div className="text-sm">Whiteboard placeholder</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {placeholderLabel}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      <PageHeader />

      {/* Hero */}
      <section className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 md:pt-20 pb-16 md:pb-20">
          <p className="text-sm font-medium text-brand-red tracking-wide uppercase mb-4">
            Features
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Explore Parohia
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            Parohia replaces scattered chats, emails, flyers, and PDFs with one
            home for your parish info. Orthodox calendar, parish schedules,
            announcements, events, volunteering and confession scheduling — all
            in one place, with respectful, configurable notifications so everyone
            stays in the loop.
          </p>
        </div>
      </section>

      {/* Feature images */}
      <div className="divide-y divide-white/[0.06]">
        <FeatureBlock
          id="calendar-schedule"
          placeholderLabel=""
          image={{
            src: "/feature11.png",
            alt: "Orthodox calendar & parish schedule",
          }}
        />
        <FeatureBlock
          id="notifications"
          placeholderLabel=""
          image={{
            src: "/feature22.png",
            alt: "Notifications settings & personal events",
          }}
        />
        <FeatureBlock
          id="announcements-events"
          placeholderLabel=""
          image={{
            src: "/feature3.png",
            alt: "Announcements feed & event details",
          }}
        />
        <FeatureBlock
          id="volunteering-confessions"
          placeholderLabel=""
          image={{
            src: "/feature4.png",
            alt: "Volunteering & Confession scheduling",
          }}
        />
      </div>

      {/* CTA */}
      <section className="relative z-10">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 md:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-8 md:p-14 text-center">
            {/* Decorative glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-brand-red/20 blur-[80px]"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                We Want to Hear From You
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed max-w-lg mx-auto">
                Feedback and suggestions from Orthodox clergy and parishioners
                are invaluable. Share your thoughts and help shape the future of
                Parohia.
              </p>
              <p className="mt-2 text-zinc-500 text-sm">
                Reach us at{" "}
                <a
                  href="mailto:support@parohia.app"
                  className="text-white hover:text-brand-red transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-brand-red/50"
                >
                  support@parohia.app
                </a>
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/notify"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-all hover:shadow-brand-red/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join our newsletter
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  About us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
