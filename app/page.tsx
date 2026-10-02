import FeedbackCTA from "../components/FeedbackCTA";
import { AppPreview } from "../components/home/AppPreview";
import { FeatureBento } from "../components/home/FeatureBento";
import { HeroPhone } from "../components/home/HeroPhone";
import { Icon } from "../components/Icon";
import PageFooter from "../components/PageFooter";
import PageHeader from "../components/PageHeader";
import { Reveal } from "../components/Reveal";

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh]">
      <div className="ambient-glow pointer-events-none fixed inset-0" aria-hidden />
      <PageHeader />

      <section className="relative z-10 overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100dvh-68px)] max-w-7xl items-center gap-14 px-6 pb-16 pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pb-20 lg:pt-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Coming soon to iOS &amp; Android
            </span>
            <h1 className="mt-8 max-w-[14ch] font-display text-[52px] leading-[1.02] tracking-[-0.02em] sm:text-7xl lg:text-[84px]">
              A modern companion for an <span className="font-display-italic text-brand-red">ancient faith.</span>
            </h1>
            <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Follow the liturgical calendar, stay close to your parish, and never miss a service. All from your phone.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="/notify"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-7 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                Join the waitlist
                <Icon name="arrow-forward" size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <a
                href="/features"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 px-7 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
              >
                Explore features
              </a>
            </div>
          </Reveal>
          <HeroPhone />
        </div>
      </section>

      <section id="features" className="relative z-10 scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28 lg:px-8">
          <Reveal className="mb-12 grid gap-6 md:mb-16 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start">
            <h2 className="max-w-[20ch] font-display text-[44px] leading-[1.05] tracking-[-0.015em] md:text-6xl">Built for the Orthodox community</h2>
            <p className="max-w-[48ch] text-lg leading-relaxed text-zinc-600 md:justify-self-end md:pt-2 dark:text-zinc-400">
              Everything your parish needs to stay connected, informed, and spiritually engaged. These are live pieces of the app, so go ahead and
              tap them.
            </p>
          </Reveal>
          <FeatureBento />
          <Reveal className="mt-10 flex justify-center">
            <a href="/features" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-red">
              See every feature
              <Icon name="arrow-forward" size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        </div>
      </section>

      <section id="screenshots" className="relative z-10 scroll-mt-20 overflow-x-clip border-t border-zinc-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:px-8">
          <Reveal className="mb-12 max-w-2xl md:mb-16">
            <h2 className="font-display text-[44px] leading-[1.05] tracking-[-0.015em] md:text-6xl">See Parohia in action</h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">A glimpse into the experience we&apos;re crafting, running right here in your browser.</p>
          </Reveal>
          <AppPreview />
        </div>
      </section>

      <FeedbackCTA />
      <PageFooter />
    </main>
  );
}
