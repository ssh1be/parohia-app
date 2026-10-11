import AccountLink from "./AccountLink";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/#screenshots", label: "Preview" },
  { href: "/about", label: "About" },
];

export default function PageHeader() {
  return (
    <header className="site-header sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="glass mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-zinc-200/70 pl-2 pr-2 shadow-[0_10px_30px_-12px_rgba(9,9,11,0.18)] dark:border-white/10 dark:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]">
        <a href="/" className="group flex items-center gap-2.5 rounded-full pr-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-red/60">
          <img
            src="/App_store_1024_1x.png"
            alt=""
            className="h-10 w-10 rounded-full shadow-md shadow-brand-red/20 transition-transform duration-300 ease-out-expo group-hover:scale-105"
          />
          <span className="font-display text-[23px] leading-none tracking-[-0.01em]">Parohia</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AccountLink className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-900/[0.05] hover:text-zinc-900 md:inline-flex dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white" />
          <a
            href="/notify"
            className="hidden h-10 items-center rounded-full bg-brand-gradient px-5 text-sm font-semibold text-white shadow-md shadow-brand-red/25 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] md:inline-flex"
          >
            Join the waitlist
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
