export default function PageFooter() {
  return (
    <footer className="relative z-10 border-t border-zinc-200 dark:border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/App_store_1024_1x.png"
              alt="Parohia icon"
              className="h-9 w-9 rounded-xl"
            />
            <span className="text-lg font-semibold">Parohia</span>
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-sans text-sm text-zinc-500">
            <a href="/features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</a>
            <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="mailto:support@parohia.app" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-white/[0.06] text-center sm:text-left">
          <p className="font-sans text-sm text-zinc-400 dark:text-zinc-600">
            &copy; {new Date().getFullYear()} Parohia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
