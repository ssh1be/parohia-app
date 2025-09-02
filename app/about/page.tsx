import AuthorPhoto from "../../components/AuthorPhoto";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
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

      <section className="relative z-10 flex-1">
        <div className="mx-auto max-w-7xl container-padding pt-16 md:pt-24 pb-20">
          <div className="max-w-3xl">
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">About Parohia</h1>

          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-2 items-start">
            <div className="order-1 md:order-1 mt-16">
              <h2 className="text-xl font-semibold">Our Team</h2>
              <p className="mt-4 text-zinc-300 leading-relaxed">
                Parohia is currently being built and maintained by me, <span className="text-white font-medium">Alexandru Perussi</span>.
                I am a Computer Science student at Oregon State University graduating in December 2025. I was raised in the Orthodox Church and began
                Parohia as a personal project to help parishes stay organized and connected. The ultimate goal is to help us further embrace our precious faith daily.
              </p>
            </div>

            <div className="order-2 md:order-2 md:self-start">
              <div className="relative inline-block rounded-2xl p-3 mx-auto md:ml-auto md:sticky md:top-28">
                <AuthorPhoto
                  src="/alexandru2.jpg"
                  alt="Alexandru Perussi"
                  fallbackSrc="/App_store_1024_1x.png"
                  className="h-64 w-64 md:h-80 md:w-80 rounded-xl object-cover shadow-lg"
                />
              </div>
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
  )
}