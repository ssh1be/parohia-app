import AccountLink from "./AccountLink";
import { Icon } from "./Icon";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/#faq", label: "FAQ" },
      { href: "/notify", label: "Waitlist" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "mailto:support@parohia.app", label: "Support" },
      { href: "mailto:support@parohia.app", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function PageFooter() {
  return (
    <footer className="relative z-10 border-t border-zinc-200 dark:border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="inline-flex items-center gap-3">
              <img src="/App_store_1024_1x.png" alt="" className="h-10 w-10 rounded-full" />
              <span className="font-display text-[26px] leading-none">Parohia</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">A modern companion for Orthodox Christian parishes.</p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{column.title}</h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
                {column.title === "Product" && (
                  <li className="hidden lg:list-item">
                    <AccountLink className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white" />
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-8 text-sm text-zinc-400 sm:flex-row dark:border-white/[0.06] dark:text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Parohia. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Icon name="heart" size={14} className="text-brand-red" /> in Oregon, USA.
          </p>
        </div>
      </div>
    </footer>
  );
}
