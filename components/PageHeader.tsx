import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

export default function PageHeader({
  showThemeToggle = true,
}: {
  showThemeToggle?: boolean;
}) {
  return (
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
            <a
              href="/features"
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              Features
            </a>
            <a
              href="/about"
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              About
            </a>
          </nav>

          {/* Desktop CTA + Theme Toggle */}
          <div className="hidden md:flex items-center gap-3 font-sans">
            {showThemeToggle ? <ThemeToggle /> : null}
            <a
              href="/notify"
              className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get notified
            </a>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            {showThemeToggle ? <ThemeToggle /> : null}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
