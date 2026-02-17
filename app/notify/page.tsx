"use client";

import { ArrowLeft } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import PageFooter from "../../components/PageFooter";

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
    <main className="relative min-h-screen flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      <PageHeader />

      <section className="relative z-10 flex-1">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 md:pt-24 pb-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand-red tracking-wide uppercase mb-4">
              Stay Updated
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Get notified about Parohia!
            </h1>
            <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
              Parohia is still in development. Leave us your email and
              we&apos;ll let you know about updates, beta tests, and the public
              release.
            </p>

            <form
              name="notify"
              onSubmit={handleFormSubmit}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <input type="hidden" name="form-name" value="notify" />
              <p className="hidden">
                <label>
                  Don&apos;t fill this out if you&apos;re human:
                  <input name="bot-field" />
                </label>
              </p>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full sm:w-auto flex-1 rounded-xl bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none border border-white/[0.08] focus:border-white/20 focus:bg-white/[0.06] transition-colors"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-all hover:shadow-brand-red/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Notify me
              </button>
            </form>

            <div className="mt-10">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
