"use client";

export default function NotifyPage() {
  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });
      window.location.assign("/notify/success");
    } catch {
      // Silent fail; optionally add client-side error UI later
    }
  }
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 red-glow" aria-hidden />

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-2xl">
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Get notified about Parohia!</h1>
            <p className="mt-6 text-lg text-zinc-300">
              Parohia is still in development. Leave us your email and we'll let you know about
              updates, beta tests, and the public release.
            </p>

            <form
              name="notify"
              onSubmit={handleFormSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <input type="hidden" name="form-name" value="notify" />
              <p className="hidden">
                <label>
                  Don’t fill this out if you're human:
                  <input name="bot-field" />
                </label>
              </p>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full sm:w-auto flex-1 rounded-md bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none ring-1 ring-inset ring-white/10 focus:ring-white/20"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #FA433F 0%, #8D0300 100%)" }}
              >
                Notify me
              </button>
            </form>

            <div className="mt-8">
              <a href="/" className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white">
                <ion-icon name="arrow-back" className="h-4 w-4 hydrated md" role="img"></ion-icon>
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


