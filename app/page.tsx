import { Users, CalendarDays, BellRing, ArrowRight, Mail, Heart } from "lucide-react";
import StackCarousel from "../components/StackCarousel";
import MobileNav from "../components/MobileNav";
import AnimateIn from "../components/AnimateIn";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <img
                src="/App_store_1024_1x.png"
                alt="Parohia icon"
                className="h-10 w-10 rounded-xl shadow-lg shadow-brand-red/20 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold">Parohia</span>
                <span className="text-[11px] font-sans text-zinc-500">App for Orthodox Parishes</span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 font-sans">
              {[
                { href: "#features", label: "Features" },
                { href: "#screenshots", label: "Screenshots" },
                { href: "/about", label: "About" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3 font-sans">
              <a
                href="/features"
                className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Learn more
              </a>
              <ThemeToggle />
              <a
                href="/notify"
                className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Get notified
              </a>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-12 md:pt-28 md:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="max-w-2xl">
              {/* Status pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] px-4 py-1.5 font-sans text-sm text-zinc-500 dark:text-zinc-400 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                Coming soon to iOS &amp; Android
              </div>

              <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.22] animate-fade-in-up">
                A Modern Companion
                <br />
                for an Ancient Faith.
              </h1>

              <p
                className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl animate-fade-in-up"
                style={{ animationDelay: "100ms" }}
              >
                Parohia helps you connect with your Orthodox parish, follow the
                liturgical calendar, and stay engaged with your community — all
                from your phone.
              </p>

              <div
                className="mt-10 flex flex-col sm:flex-row gap-4 font-sans animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
              >
                <a
                  href="/notify"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-all hover:shadow-brand-red/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join the waitlist
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] px-6 py-3.5 text-sm text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20"
                >
                  Explore features
                </a>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="relative hidden lg:flex justify-center items-center">
              {/* Glow behind phone */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <div className="h-80 w-80 rounded-full bg-brand-red/10 dark:bg-brand-red/15 blur-[100px]" />
              </div>
              <div className="relative animate-float">
                <img
                  src="/mockup1.png"
                  alt="Parohia app preview"
                  className="relative w-full max-w-[400px] mx-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative z-10 border-t border-zinc-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28">
          <AnimateIn className="text-center max-w-2xl mx-auto mb-14">
            <p className="font-sans text-sm font-medium text-brand-red tracking-widest uppercase mb-4">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold">
              Built for the Orthodox Community
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              Everything your parish needs to stay connected, informed, and
              spiritually engaged.
            </p>
          </AnimateIn>

          <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
            <AnimateIn delay={0} className="h-full">
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Parish Connection"
                description="Follow announcements, schedule confessions, volunteer, and stay actively involved in your community life."
              />
            </AnimateIn>
            <AnimateIn delay={100} className="h-full">
              <FeatureCard
                icon={<CalendarDays className="h-5 w-5" />}
                title="Orthodox Calendar"
                description="Fast days, feasts, and saints — beautifully presented alongside daily Scripture readings and troparia."
              />
            </AnimateIn>
            <AnimateIn delay={200} className="h-full">
              <FeatureCard
                icon={<BellRing className="h-5 w-5" />}
                title="Smart Reminders"
                description="Receive fully customizable notifications for services, parish events, confessions, and much more."
              />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── SCREENSHOTS ─── */}
      <section id="screenshots" className="relative z-10 border-t border-zinc-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28">
          <AnimateIn className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-sans text-sm font-medium text-brand-red tracking-widest uppercase mb-4">
              Preview
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold">
              See Parohia in Action
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-lg">
              A glimpse into the experience we&apos;re crafting.
            </p>
          </AnimateIn>

          <AnimateIn>
            <StackCarousel
              images={[
                { src: "/home.png", alt: "Home screen" },
                { src: "/calendar3.png", alt: "Orthodox calendar view" },
                { src: "/calendar2.png", alt: "Calendar details and readings" },
                { src: "/events.png", alt: "Parish events list" },
                { src: "/events2.png", alt: "Event details screen" },
                { src: "/notif.png", alt: "Notifications settings" },
              ]}
            />
          </AnimateIn>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 md:py-24">
          <AnimateIn>
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-gradient-to-br from-zinc-50 dark:from-white/[0.06] to-transparent p-8 md:p-14 text-center">
              {/* Decorative glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-brand-red/10 dark:bg-brand-red/20 blur-[80px]"
                aria-hidden
              />

              <div className="relative">
                <Mail className="h-10 w-10 mx-auto mb-6 text-brand-red" />
                <h2 className="text-2xl md:text-3xl font-semibold">
                  We Want to Hear From You
                </h2>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto">
                  Feedback and suggestions from Orthodox clergy and parishioners
                  are invaluable. Share your thoughts and help shape the future
                  of Parohia.
                </p>
                <p className="mt-2 text-zinc-500 text-sm">
                  Reach us at{" "}
                  <a
                    href="mailto:support@parohia.app"
                    className="text-zinc-900 dark:text-white hover:text-brand-red transition-colors underline underline-offset-4 decoration-zinc-300 dark:decoration-white/20 hover:decoration-brand-red/50"
                  >
                    support@parohia.app
                  </a>
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center font-sans">
                  <a
                    href="/notify"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-all hover:shadow-brand-red/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Join our newsletter
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <a
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] px-6 py-3.5 text-sm text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:text-zinc-900 dark:hover:text-white"
                  >
                    About us
                  </a>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-zinc-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <a href="/" className="flex items-center gap-3">
                <img
                  src="/App_store_1024_1x.png"
                  alt="Parohia icon"
                  className="h-10 w-10 rounded-xl"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-semibold">
                    Parohia
                  </span>
                  <span className="text-[11px] font-sans text-zinc-500">
                    App for Orthodox Parishes
                  </span>
                </div>
              </a>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-xs">
                A modern companion for Orthodox Christian parishes.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                Product
              </h4>
              <ul className="space-y-3 font-sans">
                <li>
                  <a
                    href="/features"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/notify"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Newsletter
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                Resources
              </h4>
              <ul className="space-y-3 font-sans">
                <li>
                  <a
                    href="mailto:support@parohia.app"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@parohia.app"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                Legal
              </h4>
              <ul className="space-y-3 font-sans">
                <li>
                  <a
                    href="/privacy"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              &copy; {new Date().getFullYear()} Parohia. All rights reserved.
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 flex items-center gap-1">Made with <Heart className="h-4 w-4 text-brand-red fill-brand-red" /> in Oregon, USA.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ─── Feature Card Component ─── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02] p-6 md:p-8 transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.12] hover:shadow-lg hover:shadow-brand-red/5">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lg shadow-brand-red/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
