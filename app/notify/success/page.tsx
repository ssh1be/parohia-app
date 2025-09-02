export default function NotifySuccessPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 red-glow" aria-hidden />

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-2xl">
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">You're on the list 🎉</h1>
            <p className="mt-6 text-lg text-zinc-300">
              Thanks for signing up! We’ll email you when Parohia is ready.
            </p>

            <div className="mt-8">
              <a href="/" className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white">
                <ion-icon name="home" className="h-4 w-4 hydrated md" role="img"></ion-icon>
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


