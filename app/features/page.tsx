import React from "react";

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
    <section id={id} className="relative z-10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl container-padding py-10 md:py-14">
        <div className="flex items-center justify-center">
          {image ? (
            <>
              {/* Desktop/tablet: show full image */}
              <div className="relative rounded-3xl p-3 hidden md:block">
                <img src={image.src} alt={image.alt} className="mx-auto w-full max-w-full h-auto rounded-xl" />
              </div>
              {/* Mobile: split image vertically into two stacked halves */}
              <div className="relative rounded-3xl p-3 md:hidden w-full">
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
            <div className="relative rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-4 w-full max-w-5xl">
              <div className="flex h-64 md:h-96 w-full items-center justify-center rounded-2xl bg-white/[0.02]">
                <div className="text-center text-white/70">
                  <div className="text-sm">Whiteboard placeholder</div>
                  <div className="mt-1 text-xs text-white/60">{placeholderLabel}</div>
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
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 red-glow" aria-hidden />

      <header className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/App_store_1024_1x.png" alt="Parohia icon" className="h-12 w-12 rounded-lg" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">Parohia</span>
              <span className="text-xs text-white/70">Embrace the Orthodox faith</span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/features"
              className="rounded-md bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Learn more
            </a>
            <a
              href="/notify"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              style={{ background: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)' }}
            >
              Notify me
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10 border-b border-white/10">
        <div className="mx-auto max-w-7xl container-padding pt-10 md:pt-14 pb-20">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Explore Parohia</h1>
          <p className="mt-8 max-w-2xl text-lg text-zinc-300">
            Replace scattered chats, emails, flyers, and PDFs with one home for your parish info.
            Orthodox calendar, parish schedules, announcements, events, volunteering and confession scheduling —
            all in one place, with respectful, configurable notifications so everyone stays in the loop.
          </p>

        </div>
      </section>

      <FeatureBlock
        id="calendar-schedule"
        placeholderLabel=""
        image={{ src: "/feature11.png", alt: "Orthodox calendar & parish schedule" }}
      />

      <FeatureBlock
        id="notifications"
        placeholderLabel=""
        image={{ src: "/feature22.png", alt: "Notifications settings & personal events" }}
      />

      <FeatureBlock
        id="announcements-events"
        placeholderLabel=""
        image={{ src: "/feature3.png", alt: "Announcements feed & event details" }}
      />

      <FeatureBlock
        id="volunteering-confessions"
        placeholderLabel=""
        image={{ src: "/feature4.png", alt: "Volunteering & Confession scheduling" }}
      />

      <section id="cta" className="relative z-10">
        <div className="mx-auto max-w-5xl container-padding py-16 md:py-24">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-bold">We want to hear from you.</h2>
            <p className="mt-3 text-zinc-300">
              Feedback and suggestions from Orthodox clergy and parishioners is invaluable to us.<br />
              Please share your thoughts and ideas at <a href="mailto:support@parohia.app" className="text-white">support@parohia.app</a>
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="/notify"
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)' }}
              >
                Join our newsletter
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center rounded-md bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10"
              >
                About us
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="relative z-10 border-t border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl container-padding py-10 text-sm text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2">
              <img src="/App_store_1024_1x.png" alt="Parohia icon" className="h-8 w-8 rounded-lg" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold tracking-tight text-white">Parohia</span>
              </div>
            </a>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="mailto:support@parohia.app" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}


