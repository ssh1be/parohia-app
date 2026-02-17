import MobileNav from "./MobileNav";

export default function PageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-xl">
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
              <span className="text-lg font-semibold tracking-tight">Parohia</span>
              <span className="text-[11px] text-zinc-500">App for Orthodox Parishes</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="/features"
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Features
            </a>
            <a
              href="/about"
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              About
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/notify"
              className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get notified
            </a>
          </div>

          {/* Mobile */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
